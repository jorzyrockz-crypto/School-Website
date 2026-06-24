// THEME ENGINE CONTROLLER
// ==========================================

function applyTheme(themeName, customLogo = null) {
  const html = document.documentElement;
  html.setAttribute('data-theme', themeName);
  
  if (customLogo) {
    if (customLogo.includes('indigo') || customLogo.includes('blue')) {
      html.style.setProperty('--accent', '#6366f1');
      html.style.setProperty('--accent-hover', '#4f46e5');
    } else if (customLogo.includes('amber') || customLogo.includes('gold')) {
      html.style.setProperty('--accent', '#d4af37');
      html.style.setProperty('--accent-hover', '#c5a028');
    } else {
      html.style.setProperty('--accent', '#10b981');
      html.style.setProperty('--accent-hover', '#059669');
    }
  } else {
    html.style.removeProperty('--accent');
    html.style.removeProperty('--accent-hover');
  }
}

// SYSTEM NOTIFICATIONS
// ==========================================

async function updateNotificationsList() {
  if (!activeUser) return;
  const listEl = document.getElementById('notif-items-list');
  if (!listEl) return;

  const notifs = await dbService.getNotifications(activeUser.uid);
  const badge = document.getElementById('notif-badge-count');
  
  badge.innerText = notifs.length;
  badge.style.display = notifs.length > 0 ? 'flex' : 'none';

  if (notifs.length === 0) {
    listEl.innerHTML = `<p style="padding:1rem; text-align:center; color:var(--text-secondary); font-size:0.8rem;">No new notifications</p>`;
  } else {
    listEl.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-text"><strong>${n.senderName}</strong> ${n.messageText}</div>
      </div>
    `).join('');
  }
}

const clearNotifsBtn = document.getElementById('btn-clear-notifs');
if (clearNotifsBtn) {
  clearNotifsBtn.onclick = async () => {
    if (!activeUser) return;
    await dbService.clearNotifications(activeUser.uid);
    updateNotificationsList();
  };
}

// Header Dropdown Toggles
const dropdownTriggers = [
  { triggerId: 'notif-bell-trigger', menuId: 'notif-dropdown-menu' },
  { triggerId: 'messenger-widget-trigger', menuId: 'messenger-dropdown-menu' },
  { triggerId: 'profile-widget-trigger', menuId: 'profile-dropdown-menu' }
];

dropdownTriggers.forEach(({triggerId, menuId}) => {
  const trigger = document.getElementById(triggerId);
  const menu = document.getElementById(menuId);
  
  if (trigger && menu) {
    trigger.onclick = (e) => {
      e.stopPropagation();
      // Close all others first
      document.querySelectorAll('.header-dropdown').forEach(d => {
        if (d !== menu) d.classList.remove('show');
      });
      menu.classList.toggle('show');
    };
    
    // Prevent clicks inside menu from closing it
    menu.onclick = (e) => e.stopPropagation();
  }
});

// Click outside to close all dropdowns
document.addEventListener('click', () => {
  document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
});

// Floating Chat Window Logic
let activeFloatingChatThread = null;

async function initFloatingChatHeads() {
  if (!activeUser) return;
  const threads = await dbService.getChatThreads(activeUser.uid);
  const dock = document.getElementById('chat-heads-dock');
  if (!dock) return;

  // Clear existing dynamic heads, leave the "Add" button
  const addBtnHTML = `
    <div class="chat-head-bubble" title="New Message" onclick="window.location.hash='#/messages'">
      <div style="background:var(--bg-secondary); width:100%; height:100%; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--text-primary); font-size:1.5rem;">
        <ion-icon name="add"></ion-icon>
      </div>
    </div>
  `;

  // Render top 4 threads to avoid clutter
  const topThreads = threads.slice(0, 4);
  const threadsHTML = topThreads.map(t => {
    // Escape JSON so it can be passed as a string
    const tJson = encodeURIComponent(JSON.stringify(t));
    return `
      <div class="chat-head-bubble" onclick="openFloatingChat('${tJson}')" title="${t.name}">
        <img src="${t.avatar}" alt="${t.name}">
      </div>
    `;
  }).join('');

  dock.innerHTML = threadsHTML + addBtnHTML;
}

async function openFloatingChat(encodedUser) {
  const targetUser = JSON.parse(decodeURIComponent(encodedUser));
  activeFloatingChatThread = targetUser;
  
  const chatWindow = document.getElementById('floating-chat-window');
  if (!chatWindow) return;

  // Set Header Info
  document.getElementById('chat-window-title').innerText = targetUser.name;
  document.getElementById('floating-chat-subtitle').innerText = targetUser.role.toUpperCase();
  document.getElementById('floating-chat-avatar').src = targetUser.avatar;

  // Fetch and Render Messages
  const chatId = [activeUser.uid, targetUser.uid].sort().join('_');
  const messages = await dbService.getMessages(chatId);
  const body = document.getElementById('floating-chat-messages-body');
  
  // Keep pattern, render messages
  let html = `<div class="chat-bg-pattern"></div>`;
  html += messages.map(m => {
    const isOut = m.senderId === activeUser.uid;
    const rowCls = isOut ? 'sent' : 'received';
    const bubbleCls = isOut ? 'bg-green' : 'bg-dark';
    
    let content = '';
    if (m.imageData) content += `<img src="${m.imageData}" style="max-width:200px; border-radius:12px; margin-bottom:${m.text ? '0.4rem' : '0'}; display:block;">`;
    if (m.text) content += `<span>${m.text}</span>`;
    
    if (isOut) {
      return `
        <div class="chat-msg-row sent">
          <div style="display:flex; flex-direction:column; align-items:flex-end; max-width:85%;">
            <div class="chat-msg-bubble bg-green">${content}</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="chat-msg-row received">
          <img class="chat-msg-avatar" src="${targetUser.avatar}" alt="Avatar">
          <div style="display:flex; flex-direction:column; max-width:75%;">
            <div class="chat-msg-bubble bg-dark">${content}</div>
          </div>
        </div>
      `;
    }
  }).join('');

  body.innerHTML = html;
  
  // Show Window
  chatWindow.style.display = 'flex';
  setTimeout(() => {
    chatWindow.classList.add('show');
    body.scrollTop = body.scrollHeight; // Scroll to bottom after show
  }, 10);
}

async function submitFloatingChat() {
  if (!activeUser || !activeFloatingChatThread) return;
  const input = document.getElementById('floating-chat-input');
  const text = input.value.trim();
  if (!text) return;

  const chatId = [activeUser.uid, activeFloatingChatThread.uid].sort().join('_');
  await dbService.saveMessage(chatId, {
    id: 'msg_' + Date.now(),
    senderId: activeUser.uid,
    text: text,
    timestamp: Date.now()
  });

  input.value = '';
  // Re-render the floating chat to show new message
  openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)));
  
  // If the user is on the messages page and it's the same thread, sync it!
  if (window.location.hash.includes('#/messages') && typeof initMessagesPanel === 'function') {
    if (typeof activeChatThread !== 'undefined' && activeChatThread && activeChatThread.uid === activeFloatingChatThread.uid) {
      // openChatWindow is the dashboard.js function!
      // But we renamed the floating one, so calling openChatWindow here updates the main page!
      if (typeof openChatWindow === 'function') {
        openChatWindow(activeChatThread);
      }
    }
  }
}

function minimizeChatWindow() {
  const chatWindow = document.getElementById('floating-chat-window');
  if (chatWindow) {
    chatWindow.classList.remove('show');
  }
}

function closeChatWindow() {
  const chatWindow = document.getElementById('floating-chat-window');
  if (chatWindow) {
    chatWindow.classList.remove('show');
    // Wait for transition before hiding completely
    setTimeout(() => {
      chatWindow.style.display = 'none';
    }, 300);
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
  }
}

// ==========================================
// GLOBAL INITIALIZATION
// ==========================================

async function initPage() {
  const school = await dbService.getSchool(currentSchoolId);
  applyTheme(school.theme, school.logo);
  syncSchoolConfig(school);

  // Sync sidebar session state on load
  syncSidebarProfile();
  toggleAuthUIElements(activeUser !== null);

  // Initialize Router
  initRouter();
  
  if (activeUser) {
    updateNotificationsList();
  }

  // Mobile Navigation Toggler
  const sidebarToggle = document.getElementById('btn-sidebar-toggle');
  const sidebar = document.querySelector('.portal-sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.onclick = (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    };
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 900 && sidebar.classList.contains('active') && !sidebar.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    });

    // Close sidebar on navigation on mobile
    const menuLinks = document.querySelectorAll('.menu-item a');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          sidebar.classList.remove('active');
        }
      });
    });
  }
}

initPage();
