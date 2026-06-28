// THEME ENGINE CONTROLLER
// ==========================================

const APP_VERSION = '1.6.0';

// ==========================================
// UPDATE BANNER
// ==========================================
function showSystemUpdateBanner(commitId, title, htmlContent) {
  if (!commitId) return;
  const seenKey = 'seen_update_' + commitId;
  if (localStorage.getItem(seenKey)) return;

  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText = `
    position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%) translateY(120%);
    z-index: 99998; width: min(520px, calc(100vw - 2rem));
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
    border-radius: 1rem; padding: 1.25rem 1.5rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1);
    color: white; font-family: inherit;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
    opacity: 0;
  `;
  banner.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
      <div style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.6rem;">
          <div style="background:rgba(255,255,255,0.2); border-radius:8px; padding:0.35rem 0.6rem; font-size:0.7rem; font-weight:800; letter-spacing:1px; text-transform:uppercase;">v${APP_VERSION}</div>
          <span style="font-size:1rem; font-weight:700;">&#x1F389; What&rsquo;s New</span>
        </div>
        <div style="font-weight:600; margin-bottom:0.4rem; font-size:0.95rem;">${title}</div>
        <div style="font-size:0.85rem; opacity:0.95; line-height:1.4;">
          ${htmlContent}
        </div>
      </div>
      <button onclick="document.getElementById('update-banner').remove()" style="background:rgba(255,255,255,0.15); border:none; color:white; border-radius:50%; width:28px; height:28px; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; line-height:1;">&times;</button>
    </div>
    <button onclick="localStorage.setItem('${seenKey}', '1'); document.getElementById('update-banner').style.opacity='0'; setTimeout(()=>document.getElementById('update-banner')?.remove(), 400);" style="margin-top:1rem; width:100%; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3); color:white; font-weight:600; font-size:0.85rem; padding:0.5rem; border-radius:0.5rem; cursor:pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">Got it &mdash; dismiss</button>
  `;

  document.body.appendChild(banner);
  // Animate in after a short delay
  setTimeout(() => {
    banner.style.transform = 'translateX(-50%) translateY(0)';
    banner.style.opacity = '1';
  }, 800);

  // Auto-dismiss after 20 seconds
  setTimeout(() => {
    if (document.getElementById('update-banner')) {
      localStorage.setItem(seenKey, '1');
      banner.style.opacity = '0';
      banner.style.transform = 'translateX(-50%) translateY(120%)';
      setTimeout(() => banner.remove(), 500);
    }
  }, 20000);
}
window.showSystemUpdateBanner = showSystemUpdateBanner;

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
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="window.handleNotificationClick('${n.referenceId}')" style="cursor:pointer;">
        <div class="notif-text"><strong>${n.senderName}</strong> ${n.messageText}</div>
      </div>
    `).join('');
  }
}

window.handleNotificationClick = function(referenceId) {
  // 1. Close dropdown
  const notifDropdown = document.getElementById('notif-dropdown');
  if (notifDropdown) notifDropdown.classList.remove('active');

  // 2. Navigate to Feed if not already there
  if (window.location.hash !== '#feed' && window.location.hash !== '') {
    window.location.hash = '#feed';
  }

  // 3. Wait slightly for feed to render (if just navigated), then scroll & highlight
  setTimeout(() => {
    const postEl = document.getElementById(`post-${referenceId}`);
    if (postEl) {
      postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postEl.classList.add('highlight-post');
      setTimeout(() => postEl.classList.remove('highlight-post'), 2500);
    }
  }, 150);
};

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
      const readTimestamp = window.mockReadChats ? (window.mockReadChats[activeUser.uid] || 0) : 0;
      if (lastMsg.senderId !== activeUser.uid && lastMsg.timestamp > readTimestamp) {
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
      
      // Clear messenger badge when opened
      if (triggerId === 'messenger-widget-trigger') {
        const badge = document.getElementById('messenger-badge-count');
        if (badge && badge.style.display !== 'none') {
          badge.style.display = 'none';
          badge.innerText = '0';
          // Mark all last messages as 'read' locally in memory to prevent badge reappearing
          window.mockReadChats = window.mockReadChats || {};
          window.mockReadChats[activeUser?.uid] = Date.now();
        }
      }
    };
    
    // Prevent clicks inside menu from closing it
    menu.onclick = (e) => e.stopPropagation();
  }
});

// Click outside to close all dropdowns and floating chat
document.addEventListener('click', (e) => {
  document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
  
  // Close floating chat if clicked outside
  const chatWindow = document.getElementById('floating-chat-window');
  if (chatWindow && chatWindow.style.display === 'flex') {
    // If the click target was removed from the DOM (e.g. chat head dismissed), ignore it
    if (!document.body.contains(e.target)) return;
    
    // If click is not inside the chat window AND not inside the dock
    if (!chatWindow.contains(e.target) && !e.target.closest('#chat-heads-dock')) {
      if (typeof closeFloatingChat === 'function') {
        closeFloatingChat();
      }
    }
  }
  
  // Chat Dock Expansion Logic for touch devices
  const dock = document.getElementById('chat-heads-dock');
  if (dock) {
    if (e.target.closest('#chat-heads-dock')) {
      // Toggle expand state on dock click
      dock.classList.toggle('is-expanded');
    } else {
      // Click outside collapses the dock
      dock.classList.remove('is-expanded');
    }
  }
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
    <div class="chat-head-bubble" title="New Message" onclick="openContactDrawer()">
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

  // Mock new message trigger: If we have threads, simulate that there's a new message
  // so the dock becomes visible, otherwise hide it.
  if (topThreads.length > 0) {
    dock.classList.add('has-new-messages');
  } else {
    dock.classList.remove('has-new-messages');
  }
}

// App Drawer Functions
function openContactDrawer() {
  const drawer = document.getElementById('contact-drawer-overlay');
  if (drawer) drawer.style.display = 'flex';
}

function closeContactDrawer() {
  const drawer = document.getElementById('contact-drawer-overlay');
  if (drawer) drawer.style.display = 'none';
}

async function openFloatingChat(encodedUser) {
  const targetUser = JSON.parse(decodeURIComponent(encodedUser));
  activeFloatingChatThread = targetUser;
  
  // Auto-close bubble from dock when clicked
  if (window.dismissChatHead) {
    window.dismissChatHead(targetUser.uid, null);
  }
  
  const chatWindow = document.getElementById('floating-chat-window');
  if (!chatWindow) return;

  // Reset media panel visibility
  const floatMediaPanel = document.getElementById('floating-chat-media-panel');
  if (floatMediaPanel) floatMediaPanel.style.display = 'none';

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
          <div style="position:relative; display:inline-block; margin-bottom:${m.text ? '0.4rem' : '0'}; cursor:zoom-in;" onclick="if(typeof openPhotoTheater === 'function') openPhotoTheater('${m.imageData}', 'float_${m.timestamp}')">
            <img src="${m.imageData}" style="max-width:200px; border-radius:12px; display:block;">
            <a href="${m.imageData}" download="image_${m.timestamp}.jpg" title="Download Image" style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.6); color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; text-decoration:none;" onclick="event.stopPropagation();">
              <ion-icon name="download-outline" style="font-size:0.9rem;"></ion-icon>
            </a>
          </div>
        `;
      }
    
    if (m.text) content += `<span>${m.text}</span>`;
    
    if (isOut) {
      return `
        <div class="chat-msg-row sent">
          <div style="max-width:85%; text-align:right; flex-shrink:0;">
            <div class="chat-msg-bubble bg-green" style="display:inline-block; text-align:left;">${content}</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="chat-msg-row received">
          <img class="chat-msg-avatar" src="${targetUser.avatar}" alt="Avatar">
          <div style="max-width:75%; text-align:left; flex-shrink:0;">
            <div class="chat-msg-bubble bg-dark" style="display:inline-block; text-align:left;">${content}</div>
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

function setupFloatingChatAttachment() {
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
          compressImage(dataUrl, 800, async (compressedData) => {
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupFloatingChatAttachment);
} else {
  setupFloatingChatAttachment();
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

window.toggleFloatingMediaPanel = function() {
  const panel = document.getElementById('floating-chat-media-panel');
  if (panel) {
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) {
      populateFloatingMediaPanel();
    }
  }
};

async function populateFloatingMediaPanel() {
  if (!activeFloatingChatThread || !activeUser) return;
  
  const avatarEl = document.getElementById('floating-media-panel-avatar');
  const nameEl = document.getElementById('floating-media-panel-name');
  const gridEl = document.getElementById('floating-chat-media-grid');
  
  if (avatarEl) avatarEl.src = activeFloatingChatThread.avatar;
  if (nameEl) nameEl.innerText = activeFloatingChatThread.name;
  
  if (gridEl) {
    const chatId = activeFloatingChatThread.isGroup ? activeFloatingChatThread.uid : [activeUser.uid, activeFloatingChatThread.uid].sort().join('_');
    const messages = await dbService.getMessages(chatId);
    
    // Find all images in this chat
    const mediaItems = [];
    messages.forEach(m => {
      if (m.imageData) {
        mediaItems.push(m.imageData);
      }
    });
    
    if (mediaItems.length > 0) {
      gridEl.innerHTML = mediaItems.map((src, i) => `
        <div style="position:relative; width:100%; aspect-ratio:1; cursor:zoom-in;" onclick="if(typeof openPhotoTheater === 'function') openPhotoTheater('${src}', 'float_media_${i}')">
          <img class="media-item" src="${src}" style="width:100%; height:100%; display:block; border-radius:8px; object-fit:cover;">
          <a href="${src}" download="media_${i}.jpg" title="Download Image" style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.6); color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; text-decoration:none;" onclick="event.stopPropagation();">
            <ion-icon name="download-outline" style="font-size:0.8rem;"></ion-icon>
          </a>
        </div>
      `).join('');
    } else {
      gridEl.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-secondary); font-size:0.85rem; padding:2rem 0;">No media shared yet</p>`;
    }
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
    setTimeout(showUpdateBannerIfNew, 1200);
  }

  // Removed redundant sidebar logic (handled below in IIFE)
}

// ==========================================
// CHAT HEADS & EMOJI LOGIC
// ==========================================
window.dismissedChatHeads = window.dismissedChatHeads || [];

window.dismissChatHead = function(uid, event) {
  if (event) {
    event.stopPropagation();
  }
  window.dismissedChatHeads.push(uid);
  initFloatingChatHeads();
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

// Cross-tab synchronization
window.addEventListener('storage', (e) => {
  if (e.key === 'deped_saas_db') {
    if (typeof updateNotificationsList === 'function') updateNotificationsList();
    if (typeof updateMessengerDropdownList === 'function') updateMessengerDropdownList();
    if (typeof initFloatingChatHeads === 'function') initFloatingChatHeads();
  }
});

// ── Mobile Sidebar Toggle ──────────────────────────────────────────────────
(function () {
  const toggleBtn  = document.getElementById('btn-sidebar-toggle');
  const sidebar    = document.querySelector('.portal-sidebar');
  const overlay    = document.getElementById('sidebar-overlay');

  if (!toggleBtn || !sidebar || !overlay) return;

  function openSidebar() {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  }

  function closeSidebar() {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.innerWidth > 767) {
      document.body.classList.toggle('sidebar-hidden');
    } else {
      sidebar.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
    }
  });

  // Close when tapping the overlay
  overlay.addEventListener('click', closeSidebar);

  // Close when a nav menu item is clicked (auto-navigate on mobile)
  document.querySelectorAll('.menu-item a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 767) closeSidebar();
    });
  });
})();

// ── Dynamic Version Injection ───────────────────────────────────────────────
// ── Dynamic Version Injection ───────────────────────────────────────────────
window.updateSidebarVersion = function(hash) {
  const versionLabel = document.getElementById('sidebar-version-text');
  if (versionLabel) {
    if (hash) {
      versionLabel.textContent = 'School Portal v' + APP_VERSION + ' (' + hash + ')';
    } else {
      versionLabel.textContent = 'School Portal v' + APP_VERSION;
    }
  }
};
// Initialize with default
window.updateSidebarVersion();

// ── Tablet Bottom Nav Bridge ───────────────────────────────────────────────
(function() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetName = item.getAttribute('data-target');
      const originalLink = Array.from(document.querySelectorAll('.sidebar-menu a'))
        .find(a => a.innerText.trim().includes(targetName));

      if (originalLink) {
        originalLink.click();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
})();
// ── Scroll Dock Toggle ──────────────────────────────────────────────────────
(function() {
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    if (!document.body.classList.contains('sidebar-hidden')) {
      document.body.classList.remove('dock-visible');
      lastScrollY = window.scrollY;
      return;
    }

    const currentScrollY = window.scrollY;
    // Show dock if scrolling up and past a threshold
    if (currentScrollY < lastScrollY && currentScrollY > 50) {
      document.body.classList.add('dock-visible');
    } else if (currentScrollY > lastScrollY) {
      document.body.classList.remove('dock-visible');
    }
    lastScrollY = currentScrollY;
  }, { passive: true });
})();

initPage();
// ==========================================
// WEB SHARE TARGET API HANDLER
// ==========================================
(function handleWebShareTarget() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('shared') === 'true') {
    const sharedTitle = urlParams.get('title') || '';
    const sharedText = urlParams.get('text') || '';
    const sharedUrl = urlParams.get('url') || '';
    
    let extractedUrl = sharedUrl;
    if (!extractedUrl && sharedText.includes('http')) {
      const match = sharedText.match(/(https?:\/\/[^\s]+)/);
      if (match) extractedUrl = match[1];
    }
    
    if (extractedUrl || sharedText || sharedTitle) {
      setTimeout(() => {
        window.location.hash = '#/home';
        setTimeout(() => {
          const btnLink = document.querySelector('.post-action-btn[data-type="link"]');
          if (btnLink && extractedUrl) {
            btnLink.click();
            setTimeout(() => {
              const linkInput = document.getElementById('ev-link');
              if (linkInput) linkInput.value = extractedUrl;
            }, 100);
          } else {
            const composerArea = document.getElementById('composer-expansion-area');
            const fbPostBox = document.getElementById('fb-create-post-box');
            if (composerArea) composerArea.style.display = 'flex';
            if (fbPostBox) fbPostBox.classList.add('composer-modal-active');
            document.body.classList.add('composer-modal-active');
          }
          const composerInput = document.getElementById('composer-main-input');
          if (composerInput) {
            let combined = [sharedTitle, sharedText].filter(Boolean).join('\n');
            if (extractedUrl && combined.includes(extractedUrl)) {
              combined = combined.replace(extractedUrl, '').trim();
            }
            composerInput.value = combined;
            composerInput.focus();
          }
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }, 500);
      }, 300);
    }
  }
})();
// ==========================================
// PUBLIC USER PROFILE RENDERER
// ==========================================
window.renderPublicProfile = async function(uid) {
  if (!uid) return;
  const targetUser = await window.dbService.getUserById(uid);
  if (!targetUser) {
    showToast('User not found.');
    window.location.hash = '#/home';
    return;
  }
  
  // Populate Info
  document.getElementById('public-name').innerHTML = `
    ${targetUser.name} <span class="role-badge">${targetUser.role}</span>
  `;
  document.getElementById('public-avatar').src = targetUser.avatar || 'https://api.dicebear.com/7.x/micah/svg?seed=placeholder';
  
  const coverEl = document.getElementById('public-cover-photo');
  if (targetUser.coverPhoto) {
    coverEl.style.backgroundImage = `url('${targetUser.coverPhoto}')`;
  } else {
    coverEl.style.backgroundImage = 'none';
  }
  
  const contactEl = document.getElementById('public-contact');
  if (targetUser.contactInfo || targetUser.email) {
    contactEl.innerHTML = `<ion-icon name="mail-outline"></ion-icon> <span>${targetUser.contactInfo || targetUser.email}</span>`;
    contactEl.style.display = 'block';
  } else {
    contactEl.style.display = 'none';
  }
  
  document.getElementById('public-bio').innerText = targetUser.bio || 'No bio provided.';
  
  const connectionsCount = (targetUser.connections || []).length;
  document.getElementById('public-connections-count').innerText = `${connectionsCount} Connection${connectionsCount !== 1 ? 's' : ''}`;
  
  // Handle Action Buttons (Connect/Message)
  const btnConnect = document.getElementById('btn-public-connect');
  const btnMessage = document.getElementById('btn-public-message');
  
  if (activeUser && activeUser.uid !== uid) {
    btnMessage.style.display = 'inline-block';
    btnConnect.style.display = 'inline-block';
    
    // Check connection status
    const isConnected = (activeUser.connections || []).includes(uid);
    btnConnect.innerHTML = isConnected 
      ? `<ion-icon name="person-remove-outline"></ion-icon> Disconnect` 
      : `<ion-icon name="person-add-outline"></ion-icon> Connect`;
      
    btnConnect.onclick = async () => {
      const newStatus = await window.dbService.toggleConnection(activeUser.uid, uid);
      // Update activeUser memory
      if (newStatus) {
        if (!activeUser.connections) activeUser.connections = [];
        activeUser.connections.push(uid);
      } else {
        activeUser.connections = activeUser.connections.filter(id => id !== uid);
      }
      try { sessionStorage.setItem('activeUser', JSON.stringify(activeUser)); } catch(e){}
      renderPublicProfile(uid); // Re-render to update counts
    };
    
    btnMessage.onclick = () => {
      const chatId = [activeUser.uid, uid].sort().join('_');
      const thread = {
        uid: uid,
        name: targetUser.name,
        avatar: targetUser.avatar,
        role: targetUser.role
      };
      if (typeof openFloatingChat === 'function') {
        openFloatingChat(encodeURIComponent(JSON.stringify(thread)).replace(/'/g, "%27"));
      } else {
        window.location.hash = '#/messages';
      }
    };
  } else {
    btnMessage.style.display = 'none';
    btnConnect.style.display = 'none';
  }
  
  // Load User's Posts
  const allPosts = await window.dbService.getAnnouncements();
  const userPosts = allPosts.filter(p => p.authorUid === uid || p.author === targetUser.name);
  
  const feedContainer = document.getElementById('public-activity-feed');
  feedContainer.innerHTML = '';
  
  if (userPosts.length === 0) {
    feedContainer.innerHTML = '<p style="color:var(--text-secondary);">No recent activity.</p>';
  } else {
    // Re-use feed rendering logic for simplicity
    if (typeof window.createPostElement === 'function') {
      userPosts.forEach(post => {
        feedContainer.appendChild(window.createPostElement(post));
      });
    }
  }
};
