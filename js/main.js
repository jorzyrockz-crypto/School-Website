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

async function updateMessengerDropdownList() {
  if (!activeUser) return;
  const listEl = document.getElementById('messenger-dropdown-list');
  const badge = document.getElementById('messenger-badge-count');
  if (!listEl || !badge) return;

  const threads = await dbService.getChatThreads(activeUser.uid);
  
  // For the dropdown, just show the top 4 threads that have recent messages
  const recentThreads = [];
  let unreadCount = 0; // Simulated unread count

  for (const t of threads) {
    const chatId = t.isGroup ? t.uid : [activeUser.uid, t.uid].sort().join('_');
    const msgs = await dbService.getMessages(chatId);
    if (msgs.length > 0) {
      const lastMsg = msgs[msgs.length - 1];
      recentThreads.push({ ...t, lastMsg });
      
      // Simulate unread if the last message is not from the active user and was sent recently
      if (lastMsg.senderId !== activeUser.uid) {
        unreadCount++;
      }
    }
  }

  // Sort by latest message first
  recentThreads.sort((a, b) => b.lastMsg.timestamp - a.lastMsg.timestamp);

  badge.innerText = unreadCount;
  badge.style.display = unreadCount > 0 ? 'flex' : 'none';

  if (recentThreads.length === 0) {
    listEl.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--text-secondary); font-size:0.9rem;">No recent messages</div>`;
  } else {
    listEl.innerHTML = recentThreads.slice(0, 5).map(t => {
      const isYou = t.lastMsg.senderId === activeUser.uid ? 'You: ' : '';
      const tJson = encodeURIComponent(JSON.stringify(t)).replace(/'/g, "%27");
      return `
        <div class="notif-item" style="cursor:pointer; display:flex; align-items:center;" onclick="openFloatingChat('${tJson}')">
          <img src="${t.avatar}" style="width:40px; height:40px; border-radius:50%; margin-right:0.75rem;">
          <div class="notif-text">
            <strong>${t.name}</strong><br>
            <span style="font-size:0.8rem; color:var(--text-secondary);">${isYou}${t.lastMsg.text ? t.lastMsg.text.substring(0,25) + '...' : 'Sent an attachment'}</span>
          </div>
        </div>
      `;
    }).join('');
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

  // Filter out dismissed chat heads and render top 4
  const topThreads = threads.filter(t => !window.dismissedChatHeads?.includes(t.uid)).slice(0, 4);
  const threadsHTML = topThreads.map(t => {
    // Escape JSON so it can be passed as a string
    const tJson = encodeURIComponent(JSON.stringify(t)).replace(/'/g, "%27");
    return `
      <div class="chat-head-bubble" style="position:relative;" title="${t.name}">
        <img src="${t.avatar}" alt="${t.name}" onclick="openFloatingChat('${tJson}')">
        <button onclick="dismissChatHead('${t.uid}', event)" style="position:absolute; top:-2px; right:-2px; background:var(--danger); color:white; border:none; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; font-size:0.7rem; box-shadow:0 1px 3px rgba(0,0,0,0.3);">
          <ion-icon name="close"></ion-icon>
        </button>
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
  document.getElementById('floating-chat-title').innerText = targetUser.name;
  document.getElementById('floating-chat-subtitle').innerText = targetUser.role.toUpperCase();
  document.getElementById('floating-chat-avatar').src = targetUser.avatar;

  // Fetch and Render Messages
  const chatId = targetUser.isGroup ? targetUser.uid : [activeUser.uid, targetUser.uid].sort().join('_');
  const messages = await dbService.getMessages(chatId);
  const body = document.getElementById('floating-chat-messages-body');
  
  // Keep pattern, render messages
  let html = `<div class="chat-bg-pattern"></div>`;
  html += messages.map(m => {
    const isOut = m.senderId === activeUser.uid;
    const rowCls = isOut ? 'sent' : 'received';
    const bubbleCls = isOut ? 'bg-green' : 'bg-dark';
    
    let content = '';
    
    if (m.fileAttachment) {
      const ext = m.fileAttachment.name.split('.').pop().toUpperCase();
      content += `
        <div class="chat-file-attachment" style="background: rgba(0,0,0,0.15); border-radius:12px; margin-bottom:${m.text ? '0.4rem' : '0'}; display:block;">
          <div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem;">
            <ion-icon name="document-text" class="file-icon"></ion-icon>
            <div class="file-name" title="${m.fileAttachment.name}" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${m.fileAttachment.name}</div>
            <a href="${m.fileAttachment.data}" download="${m.fileAttachment.name}" class="file-download" style="color:inherit; display:flex;">
              <ion-icon name="download-outline"></ion-icon>
            </a>
          </div>
        </div>
      `;
    } else if (m.imageData) {
      content += `
        <div style="position:relative; display:inline-block; margin-bottom:${m.text ? '0.4rem' : '0'};">
          <img src="${m.imageData}" style="max-width:200px; border-radius:12px; display:block;">
          <a href="${m.imageData}" download="image_${m.timestamp}.jpg" title="Download Image" style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.6); color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; text-decoration:none;">
            <ion-icon name="download-outline" style="font-size:0.9rem;"></ion-icon>
          </a>
        </div>
      `;
    }
    
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

  const chatId = activeFloatingChatThread.isGroup ? activeFloatingChatThread.uid : [activeUser.uid, activeFloatingChatThread.uid].sort().join('_');
  await dbService.sendMessage(chatId, activeUser.uid, text, null);

  input.value = '';
  // Re-render the floating chat to show new message
  openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)).replace(/'/g, "%27"));
  
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
  
  // Sync the messenger dropdown
  if (typeof updateMessengerDropdownList === 'function') {
    updateMessengerDropdownList();
  }
}

// Add event listeners for file attachment in floating chat once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const attachBtn = document.getElementById('btn-attach-floating-photo');
  const fileInput = document.getElementById('floating-chat-photo-input');
  
  if (attachBtn && fileInput) {
    attachBtn.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file || !activeFloatingChatThread || !activeUser) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        if (file.type.startsWith('image/')) {
          dbService.compressImage(dataUrl, 800, async (compressedData) => {
            const chatId = activeFloatingChatThread.isGroup ? activeFloatingChatThread.uid : [activeUser.uid, activeFloatingChatThread.uid].sort().join('_');
            await dbService.sendMessage(chatId, activeUser.uid, '', { name: file.name, type: file.type, data: compressedData });
            fileInput.value = '';
            openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)).replace(/'/g, "%27"));
            // Sync main dashboard window if open
            if (window.location.hash.includes('#/messages') && typeof openChatWindow === 'function') {
              if (typeof activeChatThread !== 'undefined' && activeChatThread && activeChatThread.uid === activeFloatingChatThread.uid) {
                openChatWindow(activeChatThread);
              }
            }
          });
        } else {
          const chatId = activeFloatingChatThread.isGroup ? activeFloatingChatThread.uid : [activeUser.uid, activeFloatingChatThread.uid].sort().join('_');
          dbService.sendMessage(chatId, activeUser.uid, '', { name: file.name, type: file.type, data: dataUrl }).then(() => {
            fileInput.value = '';
            openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)).replace(/'/g, "%27"));
            // Sync main dashboard window if open
            if (window.location.hash.includes('#/messages') && typeof openChatWindow === 'function') {
              if (typeof activeChatThread !== 'undefined' && activeChatThread && activeChatThread.uid === activeFloatingChatThread.uid) {
                openChatWindow(activeChatThread);
              }
            }
          });
        }
      };
      reader.readAsDataURL(file);
    };
  }
});

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
    updateMessengerDropdownList();
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

// ==========================================
// CHAT HEADS & EMOJI LOGIC
// ==========================================
window.dismissedChatHeads = window.dismissedChatHeads || [];

window.dismissChatHead = function(uid, event) {
  event.stopPropagation();
  window.dismissedChatHeads.push(uid);
  updateChatHeads();
};

let activeEmojiInputId = null;

const EMOJI_LIST = ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];

window.toggleEmojiPicker = function(inputId) {
  activeEmojiInputId = inputId;
  const picker = document.getElementById('emoji-picker');
  if (!picker) return;
  
  if (picker.style.display === 'block') {
    picker.style.display = 'none';
    return;
  }
  
  // Render emojis if empty
  const list = document.getElementById('emoji-list');
  if (list && list.innerHTML.trim() === '') {
    list.innerHTML = EMOJI_LIST.map(e => `<span style="cursor:pointer; font-size:1.5rem; padding:0.2rem; transition:transform 0.1s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="insertEmoji('${e}')">${e}</span>`).join('');
  }
  
  picker.style.display = 'block';
  
  // Position it near the bottom right but above input
  picker.style.bottom = '80px';
  picker.style.right = '20px';
};

window.closeEmojiPicker = function() {
  const picker = document.getElementById('emoji-picker');
  if (picker) picker.style.display = 'none';
};

window.insertEmoji = function(emoji) {
  if (!activeEmojiInputId) return;
  const input = document.getElementById(activeEmojiInputId);
  if (input) {
    input.value += emoji;
    input.focus();
  }
};
initPage();
