// THEME ENGINE CONTROLLER
// ==========================================

const APP_VERSION = '1.6.0';
var escapeHTMLSafe = window.escapeHTML || ((value) => String(value ?? ''));
var escapeAttrSafe = window.escapeAttr || escapeHTMLSafe;
var sanitizeUrlSafe = window.sanitizeUrl || ((value) => value || '#');

// ==========================================
// UPDATE BANNER
// ==========================================
function showUpdateBannerIfNew() {
  const seenKey = 'seen_update_v' + APP_VERSION;
  if (localStorage.getItem(seenKey)) return;
  if (window.showSystemUpdateBanner) {
    window.showSystemUpdateBanner('v' + APP_VERSION, 'Welcome to School Portal v' + APP_VERSION, 'Discover the updated responsive layout, refined navigation, and faster performance.');
  }
}

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
  const badge = document.getElementById('notif-badge-count');
  if (!activeUser) {
    if (badge) badge.style.display = 'none';
    return;
  }
  const listEl = document.getElementById('notif-items-list');
  if (!listEl) return;

  const notifs = await dbService.getNotifications(activeUser.uid);
  if (badge) {
    const unreadCount = notifs.filter(n => !n.read).length;
    badge.innerText = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }

  if (notifs.length === 0) {
    listEl.innerHTML = `<p style="padding:1rem; text-align:center; color:var(--text-secondary); font-size:0.8rem;">No new notifications</p>`;
  } else {
    listEl.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="window.handleNotificationClick('${escapeAttrSafe(n.referenceId || '')}')" style="cursor:pointer;">
        <div class="notif-text"><strong>${escapeHTMLSafe(n.senderName)}</strong> ${escapeHTMLSafe(n.messageText)}</div>
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

window.closeHeaderDropdowns = function() {
  document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
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
      return `
        <div class="notif-item" style="cursor:pointer; display:flex; align-items:center;" onclick="closeHeaderDropdowns(); window.location.href='messenger.html?uid=${encodeURIComponent(t.uid)}'">
          <img src="${sanitizeUrlSafe(t.avatar, { allowDataImage: true, allowHash: false })}" style="width:40px; height:40px; border-radius:50%; margin-right:0.75rem;">
          <div class="notif-text">
            <strong>${escapeHTMLSafe(t.name)}</strong><br>
            <span style="font-size:0.8rem; color:var(--text-secondary);">${escapeHTMLSafe(isYou)}${escapeHTMLSafe(t.lastMsg.text ? t.lastMsg.text.substring(0,25) + '...' : 'Sent an attachment')}</span>
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
      <div class="chat-head-bubble" style="position:relative;" title="${escapeAttrSafe(t.name)}">
        <img src="${sanitizeUrlSafe(t.avatar, { allowDataImage: true, allowHash: false })}" alt="${escapeAttrSafe(t.name)}" onclick="openFloatingChat('${tJson}')">
        <button class="chat-head-dismiss-btn" onclick="dismissChatHead('${escapeAttrSafe(t.uid)}', event)" style="position:absolute; top:-2px; right:-2px; background:var(--danger); color:white; border:none; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; font-size:0.7rem; box-shadow:0 1px 3px rgba(0,0,0,0.3);">
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
function renderDrawerContacts(filterText = '') {
  const listEl = document.getElementById('drawer-contacts-list');
  const countEl = document.getElementById('drawer-contact-count');
  if (!listEl || !activeUser) return;
  
  const local = (typeof dbService.getLocalDB === 'function' ? dbService.getLocalDB() : (typeof getLocalDB === 'function' ? getLocalDB() : (window.getLocalDB ? window.getLocalDB() : null)));
  if (!local || !local.users) return;
  const allUsers = Object.values(local.users || {}).filter(u => u.uid !== activeUser.uid);
  
  const query = (filterText || '').toLowerCase().trim();
  const filtered = allUsers.filter(u => {
    if (!query) return true;
    return (u.name && u.name.toLowerCase().includes(query)) ||
           (u.role && u.role.toLowerCase().includes(query)) ||
           (u.email && u.email.toLowerCase().includes(query)) ||
           (u.department && u.department.toLowerCase().includes(query));
  });
  
  if (countEl) countEl.innerText = `${filtered.length} contact${filtered.length === 1 ? '' : 's'}`;
  
  if (filtered.length === 0) {
    listEl.innerHTML = `<div style="padding:2rem 1rem; text-align:center; color:var(--text-secondary); font-size:0.9rem;">No contacts found matching "${escapeHTMLSafe(query)}"</div>`;
    return;
  }
  
  listEl.innerHTML = filtered.map(u => {
    const uJson = encodeURIComponent(JSON.stringify({
      uid: u.uid,
      name: u.name,
      avatar: u.avatar,
      role: u.role
    })).replace(/'/g, "%27");
    
    return `
      <div class="drawer-contact-card" onclick="selectDrawerContact('${uJson}')" style="display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0.75rem; border-radius:var(--radius-md); cursor:pointer; transition:background 0.15s; border:1px solid transparent;" onmouseover="this.style.background='var(--bg-primary)'; this.style.borderColor='var(--border-color)';" onmouseout="this.style.background='transparent'; this.style.borderColor='transparent';">
        <img src="${sanitizeUrlSafe(u.avatar, { allowDataImage: true, allowHash: false })}" alt="${escapeAttrSafe(u.name)}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid var(--border-color);">
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:0.4rem; justify-content:space-between;">
            <span style="font-weight:600; font-size:0.9rem; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTMLSafe(u.name)}</span>
            <span style="font-size:0.7rem; padding:0.15rem 0.45rem; border-radius:50px; text-transform:uppercase; font-weight:700; letter-spacing:0.04em; background:var(--sidebar-active-bg); color:var(--primary);">${escapeHTMLSafe(u.role)}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:0.1rem;">
            ${escapeHTMLSafe(u.department || u.email || 'Apex School Member')}
          </div>
        </div>
        <button type="button" style="background:var(--primary); color:white; border:none; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;">
          <ion-icon name="chatbubble-ellipses-outline" style="font-size:1rem;"></ion-icon>
        </button>
      </div>
    `;
  }).join('');
}

window.openContactDrawer = function() {
  const drawer = document.getElementById('contact-drawer-overlay');
  if (drawer) {
    drawer.style.display = 'flex';
    const searchInput = document.getElementById('drawer-contact-search');
    if (searchInput) searchInput.value = '';
    renderDrawerContacts('');
    if (searchInput) searchInput.focus();
  }
};

window.closeContactDrawer = function() {
  const drawer = document.getElementById('contact-drawer-overlay');
  if (drawer) drawer.style.display = 'none';
};

window.selectDrawerContact = function(encodedUser) {
  closeContactDrawer();
  const contact = JSON.parse(decodeURIComponent(encodedUser));
  window.location.href = `messenger.html?uid=${encodeURIComponent(contact.uid)}`;
};

window.openActiveInFullMessenger = function() {
  if (!activeFloatingChatThread) return;
  const thread = activeFloatingChatThread;
  closeChatWindow();
  window.location.href = `messenger.html?uid=${encodeURIComponent(thread.uid)}`;
};

// Wire drawer search and group button on load
document.addEventListener('DOMContentLoaded', () => {
  const drawerSearch = document.getElementById('drawer-contact-search');
  if (drawerSearch) {
    drawerSearch.oninput = (e) => {
      renderDrawerContacts(e.target.value);
    };
  }

  const drawerGroupBtn = document.getElementById('drawer-btn-create-group');
  if (drawerGroupBtn) {
    drawerGroupBtn.onclick = () => {
      closeContactDrawer();
      const btnCreateGroup = document.getElementById('btn-create-group-chat');
      if (btnCreateGroup) {
        btnCreateGroup.click();
      } else {
        window.location.hash = '#/messages';
        setTimeout(() => {
          const btn = document.getElementById('btn-create-group-chat');
          if (btn) btn.click();
        }, 150);
      }
    };
  }
});

async function openFloatingChat(encodedUser) {
  if (window.closeHeaderDropdowns) window.closeHeaderDropdowns();
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
  
  let stagedFloatingAttachment = null;
  window.clearFloatingAttachmentPreview = function() {
    stagedFloatingAttachment = null;
    const bar = document.getElementById('floating-attachment-preview-bar');
    if (bar) bar.style.display = 'none';
    const fileInput = document.getElementById('floating-chat-photo-input');
    if (fileInput) fileInput.value = '';
  };

  // Keep pattern, render messages
  let html = `<div class="chat-bg-pattern"></div>`;
  let lastDateStr = '';

  messages.forEach((m, idx) => {
    const msgDate = new Date(m.timestamp);
    const dateStr = msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (dateStr !== lastDateStr) {
      lastDateStr = dateStr;
      html += `<div class="chat-date-separator" style="margin:0.4rem 0;"><span class="chat-date-pill" style="font-size:0.65rem; padding:2px 8px;">${dateStr}</span></div>`;
    }

    const isOut = m.senderId === activeUser.uid;
    const rowCls = isOut ? 'sent' : 'received';
    
    let content = '';
    
    // Voice note
    if (m.voiceNote) {
      content += `
        <div class="chat-voice-note" style="min-width:140px;">
          <button type="button" class="voice-play-btn" onclick="playVoiceWaveform(this)" title="Play" style="width:28px; height:28px; font-size:1rem;">
            <ion-icon name="play"></ion-icon>
          </button>
          <div class="voice-waveform-bars" style="height:18px;">
            ${(m.voiceNote.waveData || [6, 12, 18, 14, 20, 10, 16]).map(h => `<div class="voice-wave-bar" style="height:${Math.max(4, h*0.75)}px;"></div>`).join('')}
          </div>
          <span class="voice-duration" style="font-size:0.68rem;">${m.voiceNote.duration || '0:14'}</span>
        </div>
      `;
    }
    // Document
    else if (m.fileAttachment) {
      content += `
        <div class="chat-file-attachment" style="background: rgba(0,0,0,0.12); border-radius:10px; margin-bottom:${m.text ? '0.3rem' : '0'}; display:block; padding:0.4rem 0.6rem;">
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <ion-icon name="document-text" class="file-icon" style="font-size:1.3rem;"></ion-icon>
            <div class="file-name" title="${escapeAttrSafe(m.fileAttachment.name || 'Attachment')}" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:130px; font-size:0.78rem;">${escapeHTMLSafe(m.fileAttachment.name || 'Attachment')}</div>
            <a href="${sanitizeUrlSafe(m.fileAttachment.data, { allowDataFile: true, allowHash: false })}" download="${escapeAttrSafe(m.fileAttachment.name || 'attachment')}" class="file-download" style="color:inherit; display:flex;">
              <ion-icon name="download-outline"></ion-icon>
            </a>
          </div>
        </div>
      `;
    }
    // Photo
    else if (m.imageData) {
      const encodedMessageImage = encodeURIComponent(m.imageData);
      content += `
        <div style="position:relative; display:inline-block; margin-bottom:${m.text ? '0.3rem' : '0'}; cursor:zoom-in; border-radius:10px; overflow:hidden;" onclick="if(typeof openPhotoTheater === 'function') openPhotoTheater(decodeURIComponent('${encodedMessageImage}'), 'float_${m.timestamp}')">
          <img src="${sanitizeUrlSafe(m.imageData, { allowDataImage: true, allowHash: false })}" style="max-width:180px; max-height:160px; object-fit:cover; display:block;">
          <a href="${sanitizeUrlSafe(m.imageData, { allowDataImage: true, allowHash: false })}" download="image_${m.timestamp}.jpg" title="Download Image" style="position:absolute; bottom:4px; right:4px; background:rgba(0,0,0,0.65); color:white; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; text-decoration:none;" onclick="event.stopPropagation();">
            <ion-icon name="download-outline" style="font-size:0.85rem;"></ion-icon>
          </a>
        </div>
      `;
    }
    
    if (m.text) content += `<span>${escapeHTMLSafe(m.text)}</span>`;
    
    const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isLastMsg = idx === messages.length - 1;
    let receipt = '';
    if (isOut && isLastMsg) {
      receipt = `<div style="font-size:0.65rem; color:var(--text-secondary); text-align:right; margin-top:0.2rem;"><ion-icon name="checkmark-done-outline"></ion-icon> Seen</div>`;
    }

    // Reaction display
    let reactionsHtml = '';
    if (m.reactions && Object.keys(m.reactions).length > 0) {
      reactionsHtml += `<div class="chat-bubble-reactions" style="margin-top:2px;">`;
      for (const [emoji, users] of Object.entries(m.reactions)) {
        if (users && users.length > 0) {
          const hasReacted = users.includes(activeUser.uid);
          reactionsHtml += `
            <button type="button" class="bubble-reaction-pill ${hasReacted ? 'reacted' : ''}" style="font-size:0.7rem; padding:1px 5px;" onclick="handleReactionClick('${chatId}', ${idx}, '${emoji}')">
              <span>${emoji}</span> <span>${users.length}</span>
            </button>
          `;
        }
      }
      reactionsHtml += `</div>`;
    }

    // Reaction hover toolbar
    const toolbarHtml = `
      <div class="chat-reactions-toolbar" style="top:-30px; padding:2px 4px;">
        <button type="button" class="reaction-picker-btn" onclick="handleReactionClick('${chatId}', ${idx}, '👍')" style="font-size:0.95rem;">👍</button>
        <button type="button" class="reaction-picker-btn" onclick="handleReactionClick('${chatId}', ${idx}, '❤️')" style="font-size:0.95rem;">❤️</button>
        <button type="button" class="reaction-picker-btn" onclick="handleReactionClick('${chatId}', ${idx}, '👏')" style="font-size:0.95rem;">👏</button>
        <button type="button" class="reaction-picker-btn" onclick="handleReactionClick('${chatId}', ${idx}, '🎉')" style="font-size:0.95rem;">🎉</button>
      </div>
    `;

    const bubbleCls = m.imageData && !m.text ? 'chat-msg-bubble chat-msg-media-bubble' : 'chat-msg-bubble';
    
    if (isOut) {
      html += `
        <div class="chat-msg-row sent">
          <div style="max-width:85%; text-align:right; flex-shrink:0;">
            <div class="chat-msg-bubble-wrap">
              ${toolbarHtml}
              <div class="${bubbleCls}" style="display:inline-block; text-align:left;">${content}</div>
            </div>
            ${reactionsHtml}
            <span class="chat-msg-timestamp">${timeStr}</span>
            ${receipt}
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="chat-msg-row received">
          <img class="chat-msg-avatar" src="${sanitizeUrlSafe(targetUser.avatar, { allowDataImage: true, allowHash: false })}" alt="Avatar">
          <div style="max-width:80%; text-align:left; flex-shrink:0;">
            <div class="chat-msg-bubble-wrap">
              ${toolbarHtml}
              <div class="${bubbleCls}" style="display:inline-block; text-align:left;">${content}</div>
            </div>
            ${reactionsHtml}
            <span class="chat-msg-timestamp">${timeStr}</span>
          </div>
        </div>
      `;
    }
  });

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
  const text = input ? input.value.trim() : '';
  
  if (!text && !window.stagedFloatingAttachment) return;

  const chatId = activeFloatingChatThread.isGroup ? activeFloatingChatThread.uid : [activeUser.uid, activeFloatingChatThread.uid].sort().join('_');
  
  if (window.stagedFloatingAttachment) {
    await dbService.sendMessage(chatId, activeUser.uid, text, window.stagedFloatingAttachment);
    if (window.clearFloatingAttachmentPreview) window.clearFloatingAttachmentPreview();
  } else {
    await dbService.sendMessage(chatId, activeUser.uid, text, null);
  }

  if (typeof playChatSound === 'function') playChatSound('send');
  if (input) input.value = '';
  
  // Re-render the floating chat
  openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)).replace(/'/g, "%27"));
  
  // If the user is on the messages page and it's the same thread, sync it!
  if (window.location.hash.includes('#/messages') && typeof initMessagesPanel === 'function') {
    if (typeof activeChatThread !== 'undefined' && activeChatThread && activeChatThread.uid === activeFloatingChatThread.uid) {
      if (typeof openChatWindow === 'function') {
        openChatWindow(activeChatThread, true);
      }
    }
  }
  
  if (typeof updateMessengerDropdownList === 'function') {
    updateMessengerDropdownList();
  }

  // Trigger simulated auto reply
  if (typeof triggerSimulatedAutoReply === 'function') {
    triggerSimulatedAutoReply(activeFloatingChatThread, text);
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
        window.stagedFloatingAttachment = {
          name: file.name,
          type: file.type,
          data: dataUrl
        };
        const bar = document.getElementById('floating-attachment-preview-bar');
        const thumb = document.getElementById('floating-attachment-preview-thumb');
        const icon = document.getElementById('floating-attachment-preview-icon');
        const nameEl = document.getElementById('floating-attachment-preview-name');
        if (bar) {
          bar.style.display = 'flex';
          if (nameEl) nameEl.innerText = file.name;
          if (file.type.startsWith('image/')) {
            if (thumb) { thumb.src = dataUrl; thumb.style.display = 'block'; }
            if (icon) icon.style.display = 'none';
          } else {
            if (thumb) thumb.style.display = 'none';
            if (icon) icon.style.display = 'block';
          }
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
let activeQuickActionInputId = null;

const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚',
  '😋','😛','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','🥺','😢','😭','😤',
  '😠','🤯','😳','🥵','🥶','😱','😨','🤗','🤔','🤫','😶','😐','😑','😬','🙄','😴','😷','🤒','🤑','🤠','💩',
  '👍','👎','👏','🙌','🤝','🙏','✌️','🤞','🤟','🤘','👌','👈','👉','👆','👇','💪','❤️','🧡','💛','💚','💙','💜','🖤','💯',
  '📚','📖','🎓','✏️','📝','🏫','🎒','🔬','🎨','📐','📏','🏆','🥇','💻','🔔','📅','✨','⭐','🎉','🔥'
];

window.toggleEmojiPicker = function(inputId, event) {
  if (event) event.stopPropagation();
  activeEmojiInputId = inputId;
  const picker = document.getElementById('emoji-picker');
  if (!picker) return;
  
  if (picker.style.display === 'block') {
    picker.style.display = 'none';
    return;
  }
  
  // Close quick action popover if open
  const popover = document.getElementById('chat-quick-actions-popover');
  if (popover) popover.style.display = 'none';
  
  // Render emojis if empty
  const list = document.getElementById('emoji-list');
  if (list && list.innerHTML.trim() === '') {
    list.innerHTML = EMOJI_LIST.map(e => `
      <span style="cursor:pointer; font-size:1.35rem; padding:0.2rem; transition:transform 0.1s; display:inline-flex; align-items:center; justify-content:center; border-radius:6px;" onmouseover="this.style.transform='scale(1.2)'; this.style.background='var(--bg-primary)';" onmouseout="this.style.transform='scale(1)'; this.style.background='transparent';" onclick="insertEmoji('${e}')">${e}</span>
    `).join('');
  }
  
  picker.style.display = 'block';
  
  // Smart positioning above or near trigger button
  if (event && event.currentTarget) {
    const rect = event.currentTarget.getBoundingClientRect();
    const pickerWidth = 280;
    const pickerHeight = 240;
    
    let top = rect.top - pickerHeight - 8;
    let left = rect.left - (pickerWidth / 2) + (rect.width / 2);
    
    if (top < 10) top = rect.bottom + 8;
    if (left < 10) left = 10;
    if (left + pickerWidth > window.innerWidth - 10) {
      left = window.innerWidth - pickerWidth - 10;
    }
    
    picker.style.top = `${top}px`;
    picker.style.left = `${left}px`;
    picker.style.bottom = 'auto';
    picker.style.right = 'auto';
  } else {
    picker.style.bottom = '80px';
    picker.style.right = '20px';
    picker.style.top = 'auto';
    picker.style.left = 'auto';
  }
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

// ==========================================
// CHAT QUICK ACTIONS & SIMULATED CALLS
// ==========================================
window.toggleChatQuickActions = function(event, targetInputId) {
  if (event) event.stopPropagation();
  activeQuickActionInputId = targetInputId;
  const popover = document.getElementById('chat-quick-actions-popover');
  if (!popover) return;
  
  if (popover.style.display === 'block') {
    popover.style.display = 'none';
    return;
  }
  
  // Close emoji picker if open
  window.closeEmojiPicker();
  
  popover.style.display = 'block';
  
  if (event && event.currentTarget) {
    const rect = event.currentTarget.getBoundingClientRect();
    const popWidth = 240;
    const popHeight = 220;
    
    let top = rect.top - popHeight - 8;
    let left = rect.left;
    
    if (top < 10) top = rect.bottom + 8;
    if (left < 10) left = 10;
    if (left + popWidth > window.innerWidth - 10) {
      left = window.innerWidth - popWidth - 10;
    }
    
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.bottom = 'auto';
    popover.style.right = 'auto';
  } else {
    popover.style.bottom = '80px';
    popover.style.left = '20px';
    popover.style.top = 'auto';
    popover.style.right = 'auto';
  }
};

window.triggerQuickAction = function(actionType) {
  const popover = document.getElementById('chat-quick-actions-popover');
  if (popover) popover.style.display = 'none';
  
  const isFloating = activeQuickActionInputId === 'floating-chat-input';
  const targetThread = isFloating ? activeFloatingChatThread : (typeof activeChatThread !== 'undefined' ? activeChatThread : null);
  
  if (actionType === 'photo') {
    const fileInput = document.getElementById(isFloating ? 'floating-chat-photo-input' : 'chat-photo-input');
    if (fileInput) {
      fileInput.accept = 'image/*';
      fileInput.click();
    }
  } else if (actionType === 'file') {
    const fileInput = document.getElementById(isFloating ? 'floating-chat-photo-input' : 'chat-photo-input');
    if (fileInput) {
      fileInput.accept = '.pdf,.doc,.docx,.txt,.xlsx,.pptx';
      fileInput.click();
    }
  } else if (actionType === 'location') {
    const input = document.getElementById(activeQuickActionInputId || (isFloating ? 'floating-chat-input' : 'chat-msg-input'));
    if (input) {
      input.value = "📍 Main Academic Building - Room 204";
      input.focus();
    }
  } else if (actionType === 'greeting') {
    const greetings = [
      "Good day! Hope you are having a wonderful week.",
      "Hello! Thank you for reaching out.",
      "Received! Looking into this now and will update you shortly.",
      "Good morning! Just following up on our school schedule."
    ];
    const picked = greetings[Math.floor(Math.random() * greetings.length)];
    const input = document.getElementById(activeQuickActionInputId || (isFloating ? 'floating-chat-input' : 'chat-msg-input'));
    if (input) {
      input.value = picked;
      input.focus();
    }
  } else if (actionType === 'profile') {
    if (targetThread && targetThread.uid && !targetThread.isGroup) {
      window.location.hash = `#/user/${targetThread.uid}`;
    } else {
      showToast(targetThread?.isGroup ? "Group details can be viewed in full messenger" : "Please select a conversation first");
    }
  }
};

let callTimer = null;
let callSeconds = 0;

window.startChatCall = function(type = 'audio') {
  const currentTarget = (typeof activeChatThread !== 'undefined' && activeChatThread) ? activeChatThread : activeFloatingChatThread;
  if (!currentTarget) {
    showToast("Please select a conversation first!");
    return;
  }
  
  const modal = document.getElementById('chat-call-modal');
  const avatar = document.getElementById('call-modal-avatar');
  const name = document.getElementById('call-modal-name');
  const status = document.getElementById('call-modal-status');
  if (!modal) return;
  
  if (avatar) avatar.src = currentTarget.avatar || 'https://api.dicebear.com/7.x/micah/svg?seed=anon';
  if (name) name.innerText = currentTarget.name || 'School Contact';
  if (status) status.innerText = `Calling (${type === 'video' ? 'Video' : 'Voice'})...`;
  
  modal.style.display = 'flex';
  
  callSeconds = 0;
  if (callTimer) clearInterval(callTimer);
  
  setTimeout(() => {
    if (modal.style.display === 'flex') {
      if (status) status.innerText = `Connected (00:00)`;
      callTimer = setInterval(() => {
        callSeconds++;
        const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        const secs = String(callSeconds % 60).padStart(2, '0');
        if (status) status.innerText = `Connected (${mins}:${secs})`;
      }, 1000);
    }
  }, 2000);
};

window.endChatCall = function() {
  const modal = document.getElementById('chat-call-modal');
  if (callTimer) {
    clearInterval(callTimer);
    callTimer = null;
  }
  if (modal) modal.style.display = 'none';
  const durationStr = callSeconds > 0 ? ` (${callSeconds}s)` : '';
  showToast(`Call ended${durationStr}`);
};

window.toggleCallMute = function() {
  const btn = document.getElementById('btn-call-mute');
  if (btn) {
    const isMuted = btn.classList.toggle('active-muted');
    btn.style.background = isMuted ? 'var(--danger)' : 'var(--bg-primary)';
    btn.style.color = isMuted ? 'white' : 'var(--text-primary)';
    showToast(isMuted ? 'Microphone muted' : 'Microphone active');
  }
};

window.toggleCallCam = function() {
  const btn = document.getElementById('btn-call-cam');
  if (btn) {
    const isOff = btn.classList.toggle('active-cam-off');
    btn.style.background = isOff ? 'var(--danger)' : 'var(--bg-primary)';
    btn.style.color = isOff ? 'white' : 'var(--text-primary)';
    showToast(isOff ? 'Camera paused' : 'Camera active');
  }
};

window.toggleCallSpeaker = function() {
  const btn = document.getElementById('btn-call-speaker');
  if (btn) {
    const isSpeaker = btn.classList.toggle('active-speaker');
    btn.style.color = isSpeaker ? 'var(--primary)' : 'var(--text-primary)';
    showToast(isSpeaker ? 'Speakerphone enabled' : 'Earpiece enabled');
  }
};

// Global click listener to close popovers when clicking outside
document.addEventListener('click', (e) => {
  const picker = document.getElementById('emoji-picker');
  if (picker && picker.style.display === 'block') {
    if (!picker.contains(e.target) && !e.target.closest('[onclick*="toggleEmojiPicker"]')) {
      picker.style.display = 'none';
    }
  }
  
  const popover = document.getElementById('chat-quick-actions-popover');
  if (popover && popover.style.display === 'block') {
    if (!popover.contains(e.target) && !e.target.closest('[onclick*="toggleChatQuickActions"]')) {
      popover.style.display = 'none';
    }
  }
});

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
window.updateSidebarVersion = function(hash) {
  const versionLabel = document.getElementById('sidebar-version-text');
  if (versionLabel) {
    versionLabel.textContent = 'School Portal v' + APP_VERSION;
    versionLabel.title = 'School Portal v' + APP_VERSION + (hash ? ' (' + hash + ')' : '');
  }
};
// Initialize with default
window.updateSidebarVersion();

// ── Desktop Sidebar Collapse Toggle ────────────────────────────────────────
(function () {
  const collapseBtn = document.getElementById('btn-sidebar-collapse');
  const sidebar = document.querySelector('.portal-sidebar');
  
  if (!collapseBtn || !sidebar) return;

  // Restore collapsed state from storage on desktop
  if (window.innerWidth >= 1200 && localStorage.getItem('sidebar_collapsed') === 'true') {
    sidebar.classList.add('collapsed');
  }

  collapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
  });
})();

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
  try {
    const targetUser = await window.dbService.getUserById(uid);
    if (!targetUser) {
      showToast('User not found.');
      window.location.hash = '#/home';
      return;
    }
    
    // Ensure safe sanitizeUrlSafe declaration
    const safeSanitize = (typeof window.sanitizeUrl === 'function') ? window.sanitizeUrl : ((value) => value || '#');
    const safeEscape = (typeof window.escapeHTML === 'function') ? window.escapeHTML : ((value) => String(value ?? ''));

    // Populate Info
    document.getElementById('public-name').innerHTML = `
      ${safeEscape(targetUser.name)} <span class="role-badge">${safeEscape(targetUser.role)}</span>
    `;
    document.getElementById('public-avatar').src = safeSanitize(targetUser.avatar || 'https://api.dicebear.com/7.x/micah/svg?seed=placeholder', { allowDataImage: true, allowHash: false });
    
    const coverEl = document.getElementById('public-cover-photo');
    if (targetUser.coverPhoto) {
      coverEl.style.backgroundImage = `url('${safeSanitize(targetUser.coverPhoto, { allowDataImage: true, allowHash: false })}')`;
    } else {
      coverEl.style.backgroundImage = 'none';
    }
    
    const contactEl = document.getElementById('public-contact');
    if (targetUser.contactInfo || targetUser.email) {
      contactEl.innerHTML = `<ion-icon name="mail-outline" style="color:var(--text-secondary); font-size:1.2rem;"></ion-icon> <span>${safeEscape(targetUser.contactInfo || targetUser.email)}</span>`;
      contactEl.style.display = 'flex';
    } else {
      contactEl.style.display = 'none';
    }
    
    document.getElementById('public-bio').innerText = targetUser.bio || 'No bio provided.';
    
    const connectionsCount = (targetUser.connections || []).length;
    document.getElementById('public-connections-count').innerText = `${connectionsCount} Connection${connectionsCount !== 1 ? 's' : ''}`;
    
    // Handle Action Buttons (Connect/Message)
    const btnMessage = document.getElementById('btn-public-message');
    const btnConnect = document.getElementById('btn-public-connect');
    const btnEdit = document.getElementById('btn-public-edit');
    
    if (activeUser && activeUser.uid !== uid) {
      btnMessage.style.display = 'flex';
      btnConnect.style.display = 'flex';
      if (btnEdit) btnEdit.style.display = 'none';
      
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
        window.location.href = `messenger.html?uid=${encodeURIComponent(uid)}`;
      };
    } else {
      btnMessage.style.display = 'none';
      btnConnect.style.display = 'none';
      if (activeUser && activeUser.uid === uid && btnEdit) {
        btnEdit.style.display = 'flex';
      } else if (btnEdit) {
        btnEdit.style.display = 'none';
      }
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
      if (typeof window.renderPostList === 'function') {
        await window.renderPostList(userPosts, feedContainer, () => {
          // Custom callback to re-render the profile if they interact
          renderPublicProfile(uid);
        });
      }
    }
  } catch (err) {
    console.error("Profile rendering error:", err);
    showToast("Profile render error: " + err.message);
  }
};
