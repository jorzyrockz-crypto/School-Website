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
function openChatWindow(title) {
  const chatWindow = document.getElementById('floating-chat-window');
  if (chatWindow) {
    document.getElementById('chat-window-title').innerText = title;
    chatWindow.style.display = 'flex';
    // Small timeout to allow display:flex to apply before adding class for transition
    setTimeout(() => {
      chatWindow.classList.add('show');
    }, 10);
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
