import { getLocalDB, saveLocalDB, useFirebase, firebaseConfig } from './firebase-config.js';

// ==========================================
// 1. DATA ACCESS LAYER (HYBRID LOCAL/FIREBASE)
// ==========================================

let activeUser = null;
let currentSchoolId = "default-school";

// Initialize Firebase if configured
let db = null;
let auth = null;
if (useFirebase) {
  // Dynamic imports since we're using CDN modules and we want it to check config
  // For offline/zero-setup, we will use mock db operations by default
}

// Custom wrapper to route calls to either Firebase or localStorage
const dbService = {
  getSchool: async (schoolId) => {
    const local = getLocalDB();
    return local.schools[schoolId];
  },
  saveSchool: async (schoolId, config) => {
    const local = getLocalDB();
    local.schools[schoolId] = { ...local.schools[schoolId], ...config };
    saveLocalDB(local);
    return local.schools[schoolId];
  },
  getUser: async (email) => {
    const local = getLocalDB();
    const user = Object.values(local.users).find(u => u.email === email);
    return user || null;
  },
  getUserById: async (uid) => {
    const local = getLocalDB();
    return local.users[uid] || null;
  },
  saveUser: async (uid, updates) => {
    const local = getLocalDB();
    local.users[uid] = { ...local.users[uid], ...updates };
    saveLocalDB(local);
    return local.users[uid];
  },
  getAnnouncements: async () => {
    const local = getLocalDB();
    return local.announcements;
  },
  addAnnouncement: async (title, content, author) => {
    const local = getLocalDB();
    const newAnn = {
      id: "ann_" + Date.now(),
      schoolId: currentSchoolId,
      title,
      content,
      author,
      date: new Date().toISOString().split('T')[0],
      status: activeUser.role === 'admin' ? 'approved' : 'pending'
    };
    local.announcements.unshift(newAnn);
    
    // Admin notification if teacher submits
    if (activeUser.role !== 'admin') {
      local.notifications.unshift({
        id: "notif_" + Date.now(),
        schoolId: currentSchoolId,
        recipientId: "admin1",
        senderName: activeUser.name,
        messageText: `submitted '${title}' for approval.`,
        read: false,
        timestamp: Date.now()
      });
    }
    
    saveLocalDB(local);
    return newAnn;
  },
  moderateAnnouncement: async (annId, status) => {
    const local = getLocalDB();
    const annIndex = local.announcements.findIndex(a => a.id === annId);
    if (annIndex !== -1) {
      local.announcements[annIndex].status = status;
      
      // Notify teachers if approved
      if (status === 'approved') {
        local.notifications.unshift({
          id: "notif_" + Date.now(),
          schoolId: currentSchoolId,
          recipientId: "teacher1",
          senderName: "Administrator",
          messageText: `approved your announcement: "${local.announcements[annIndex].title}"`,
          read: false,
          timestamp: Date.now()
        });
      }
      
      saveLocalDB(local);
    }
  },
  getComments: async (annId) => {
    const local = getLocalDB();
    return local.comments.filter(c => c.announcementId === annId);
  },
  addComment: async (annId, author, text) => {
    const local = getLocalDB();
    const newComment = {
      id: "comment_" + Date.now(),
      announcementId: annId,
      author,
      text,
      timestamp: Date.now()
    };
    local.comments.push(newComment);
    saveLocalDB(local);
    return newComment;
  },
  getAttendance: async () => {
    const local = getLocalDB();
    return local.attendance[currentSchoolId] || {};
  },
  markAttendance: async (learnerId, date, status) => {
    const local = getLocalDB();
    if (!local.attendance[currentSchoolId]) {
      local.attendance[currentSchoolId] = {};
    }
    if (!local.attendance[currentSchoolId][learnerId]) {
      local.attendance[currentSchoolId][learnerId] = {};
    }
    local.attendance[currentSchoolId][learnerId][date] = status;
    
    // Notify parent
    if (local.users[learnerId] && status === 'absent') {
      local.notifications.unshift({
        id: "notif_" + Date.now(),
        schoolId: currentSchoolId,
        recipientId: "parent1",
        senderName: "Attendance System",
        messageText: `Your child ${local.users[learnerId].name} was marked ABSENT today.`,
        read: false,
        timestamp: Date.now()
      });
    }

    saveLocalDB(local);
  },
  getNotifications: async (uid) => {
    const local = getLocalDB();
    return local.notifications.filter(n => n.recipientId === uid);
  },
  clearNotifications: async (uid) => {
    const local = getLocalDB();
    local.notifications = local.notifications.filter(n => n.recipientId !== uid);
    saveLocalDB(local);
  },
  getChatThreads: async (uid) => {
    const local = getLocalDB();
    // Return other users as contacts
    return Object.values(local.users).filter(u => u.uid !== uid);
  },
  getMessages: async (chatId) => {
    const local = getLocalDB();
    return local.chats[chatId] || [];
  },
  sendMessage: async (chatId, senderId, text) => {
    const local = getLocalDB();
    if (!local.chats[chatId]) {
      local.chats[chatId] = [];
    }
    const newMsg = {
      senderId,
      text,
      timestamp: Date.now()
    };
    local.chats[chatId].push(newMsg);
    
    // Alert recipient via notifications
    const parts = chatId.split('_');
    const recipientId = parts[0] === senderId ? parts[1] : parts[0];
    local.notifications.unshift({
      id: "notif_" + Date.now(),
      schoolId: currentSchoolId,
      recipientId,
      senderName: local.users[senderId].name,
      messageText: `sent you a message: "${text.substring(0, 30)}..."`,
      read: false,
      timestamp: Date.now()
    });

    saveLocalDB(local);
    return newMsg;
  },
  getSchedule: async (role, uid) => {
    const local = getLocalDB();
    if (role === 'learner') {
      return local.schedules['learner1'] || [];
    } else if (role === 'teacher') {
      return local.schedules['teacher1'] || [];
    }
    return [];
  }
};

// ==========================================
// 2. THEME ENGINE CONTROLLER
// ==========================================

function applyTheme(themeName, customLogo = null) {
  const html = document.documentElement;
  html.setAttribute('data-theme', themeName);
  
  if (customLogo) {
    // Simulated color analyzer: Picks a color code out of typical preset logos or defaults
    // Since we're in the browser, if it's an uploaded URL, we set the accent CSS variables dynamically
    if (customLogo.includes('indigo') || customLogo.includes('blue')) {
      html.style.setProperty('--accent', '#6366f1');
      html.style.setProperty('--accent-hover', '#4f46e5');
    } else if (customLogo.includes('amber') || customLogo.includes('gold')) {
      html.style.setProperty('--accent', '#d4af37');
      html.style.setProperty('--accent-hover', '#c5a028');
    } else {
      // Default fallback logo analysis
      html.style.setProperty('--accent', '#10b981');
      html.style.setProperty('--accent-hover', '#059669');
    }
  } else {
    // Reset properties to use theme definitions
    html.style.removeProperty('--accent');
    html.style.removeProperty('--accent-hover');
  }
}

// ==========================================
// 3. APPLICATION ROUTING & NAVIGATION
// ==========================================

function initRouter() {
  const handleRouting = async () => {
    const hash = window.location.hash || '#/home';
    
    // Public vs Portal layouts
    const publicSite = document.getElementById('public-site');
    const portalSite = document.getElementById('portal-site');

    if (hash.startsWith('#/dashboard')) {
      if (!activeUser) {
        window.location.hash = '#/login';
        return;
      }
      publicSite.style.display = 'none';
      portalSite.style.display = 'flex';
      
      // Load specific dashboard panel
      const panel = hash.split('#/dashboard/')[1] || 'dashboard';
      switchPortalPanel(panel);
    } else {
      publicSite.style.display = 'block';
      portalSite.style.display = 'none';
      
      // Update public navbar state
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (`#/${link.dataset.route}` === hash) {
          link.classList.add('active');
        }
      });

      // Toggle public views
      document.querySelectorAll('.route-view').forEach(view => {
        view.style.display = 'none';
      });

      const viewId = `view-${hash.substring(2).split('?')[0]}`;
      const activeView = document.getElementById(viewId);
      if (activeView) {
        activeView.style.display = 'block';
      }
      
      // Specific page triggers
      if (hash === '#/home') {
        renderPublicAnnouncements();
      } else if (hash === '#/transparency') {
        renderTransparencyDocs();
      }
    }
  };

  window.addEventListener('hashchange', handleRouting);
  // Initial load routing
  handleRouting();
}

// ==========================================
// 4. PORTAL INTERFACES & RENDERERS
// ==========================================

function switchPortalPanel(panelName) {
  // Toggle UI panels
  document.querySelectorAll('.portal-panel').forEach(panel => {
    panel.style.display = 'none';
  });
  
  const targetPanel = document.getElementById(`panel-${panelName}`);
  if (targetPanel) {
    targetPanel.style.display = 'block';
  }

  // Update active sidebar selection
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.panel === panelName) {
      item.classList.add('active');
    }
  });

  // Render specific modules
  if (panelName === 'dashboard') {
    renderRolePortal();
  } else if (panelName === 'messages') {
    initMessagesPanel();
  } else if (panelName === 'profile') {
    initProfilePanel();
  }
}

async function renderRolePortal() {
  const role = activeUser.role;
  
  // Hide all portal-views inside default panel first
  document.getElementById('portal-view-learner').style.display = 'none';
  document.getElementById('portal-view-parent').style.display = 'none';
  document.getElementById('portal-view-teacher').style.display = 'none';
  document.getElementById('portal-view-admin').style.display = 'none';

  // Display role specific view
  const roleView = document.getElementById(`portal-view-${role}`);
  if (roleView) {
    roleView.style.display = 'block';
  }

  // Load appropriate data
  if (role === 'learner') {
    renderLearnerView();
  } else if (role === 'parent') {
    renderParentView();
  } else if (role === 'teacher') {
    renderTeacherView();
  } else if (role === 'admin') {
    renderAdminView();
  }
}

// Learner Module
async function renderLearnerView() {
  const sched = await dbService.getSchedule('learner', activeUser.uid);
  const list = document.getElementById('learner-schedule-list');
  list.innerHTML = sched.map(s => `
    <div class="schedule-item">
      <div>
        <div style="font-weight:700;">${s.subject}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">${s.room} • ${s.teacher}</div>
      </div>
      <div class="schedule-time">${s.time}</div>
    </div>
  `).join('');

  // Attendance Check-in Widget
  const attendance = await dbService.getAttendance();
  const dateStr = new Date().toISOString().split('T')[0];
  const myAttendance = attendance[activeUser.uid] || {};
  const statusToday = myAttendance[dateStr];
  
  const checkinBox = document.getElementById('attendance-status-container');
  if (statusToday === 'present') {
    checkinBox.innerHTML = `
      <ion-icon name="checkmark-circle" style="font-size:3rem; color:var(--success)"></ion-icon>
      <div style="font-weight:700; color:var(--success); margin-top:0.5rem;">Marked PRESENT Today</div>
      <div style="font-size:0.8rem; color:var(--text-secondary);">Logged at 07:30 AM</div>
    `;
  } else {
    checkinBox.innerHTML = `
      <p style="margin-bottom:1rem; font-size:0.9rem;">You haven't logged attendance for today yet.</p>
      <button id="btn-learner-checkin" class="btn-action" style="padding:0.5rem 1.5rem;">Mark Attendance Present</button>
    `;
    document.getElementById('btn-learner-checkin').addEventListener('click', async () => {
      await dbService.markAttendance(activeUser.uid, dateStr, 'present');
      showToast("Attendance logged successfully!");
      renderLearnerView();
    });
  }
}

// Parent Module
async function renderParentView() {
  const attendance = await dbService.getAttendance();
  // Parent checks learner1
  const learnerId = "learner1";
  const childLogs = attendance[learnerId] || {};
  const logKeys = Object.keys(childLogs);
  
  const container = document.getElementById('parent-attendance-log');
  if (logKeys.length === 0) {
    container.innerHTML = `<p style="color:var(--text-secondary)">No attendance records logged yet.</p>`;
  } else {
    container.innerHTML = logKeys.map(date => `
      <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--border-color)">
        <span>${date}</span>
        <span style="font-weight:700; color:${childLogs[date] === 'present' ? 'var(--success)' : 'var(--danger)'}">
          ${childLogs[date].toUpperCase()}
        </span>
      </div>
    `).join('');
  }
}

// Teacher Module
async function renderTeacherView() {
  const sched = await dbService.getSchedule('teacher', activeUser.uid);
  const list = document.getElementById('teacher-schedule-list');
  list.innerHTML = sched.map(s => `
    <div class="schedule-item">
      <div>
        <div style="font-weight:700;">${s.subject}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">${s.room} • ${s.class}</div>
      </div>
      <div class="schedule-time">${s.time}</div>
    </div>
  `).join('');

  // Class List Attendance tracker
  const attendance = await dbService.getAttendance();
  const dateStr = new Date().toISOString().split('T')[0];
  const learnerId = "learner1"; // Mock class containing learner1
  const isPresent = (attendance[learnerId] || {})[dateStr] === 'present';
  
  const container = document.getElementById('teacher-attendance-tracker');
  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; background:var(--bg-primary); border-radius:var(--radius-sm)">
      <div>
        <strong style="display:block;">Juan Cruz</strong>
        <span style="font-size:0.75rem; color:var(--text-secondary)">Grade 10 Learner</span>
      </div>
      <div>
        <button id="btn-toggle-present" class="btn-portal" style="background:${isPresent ? 'var(--success)' : 'var(--border-color)'}; font-size:0.8rem; padding:0.35rem 0.75rem;">
          ${isPresent ? 'Present' : 'Absent'}
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-toggle-present').addEventListener('click', async () => {
    const nextStatus = isPresent ? 'absent' : 'present';
    await dbService.markAttendance(learnerId, dateStr, nextStatus);
    showToast(`Marked ${nextStatus.toUpperCase()}`);
    renderTeacherView();
  });
}

// Admin Module
async function renderAdminView() {
  const announcements = await dbService.getAnnouncements();
  const pendings = announcements.filter(a => a.status === 'pending');
  
  const pendingContainer = document.getElementById('admin-pending-announcements');
  if (pendings.length === 0) {
    pendingContainer.innerHTML = `<p style="color:var(--text-secondary); padding:1rem 0;">No announcements currently pending review.</p>`;
  } else {
    pendingContainer.innerHTML = pendings.map(p => `
      <div class="news-card">
        <div class="news-meta">
          <span>Author: ${p.author}</span>
          <span>Date Submitted: ${p.date}</span>
        </div>
        <h4 class="news-title">${p.title}</h4>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">${p.content}</p>
        <div style="display:flex; gap:1rem;">
          <button class="btn-action btn-approve" data-id="${p.id}" style="padding:0.4rem 1rem; background-color:var(--success)">Approve</button>
          <button class="btn-secondary btn-reject" data-id="${p.id}" style="padding:0.4rem 1rem; border-color:var(--danger); color:var(--danger)">Reject</button>
        </div>
      </div>
    `).join('');

    // Attach click triggers
    pendingContainer.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        await dbService.moderateAnnouncement(e.target.dataset.id, 'approved');
        showToast("Announcement approved!");
        renderAdminView();
        updateNotificationsList();
      });
    });

    pendingContainer.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        await dbService.moderateAnnouncement(e.target.dataset.id, 'rejected');
        showToast("Announcement rejected.");
        renderAdminView();
      });
    });
  }

  // Consolidated attendance statistics
  const attendance = await dbService.getAttendance();
  const grid = document.getElementById('admin-attendance-grid');
  const dateStr = new Date().toISOString().split('T')[0];
  
  const students = [
    { name: "Juan Cruz", id: "learner1" }
  ];
  
  grid.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Learner Name</th>
          <th>Status (${dateStr})</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(s => {
          const status = (attendance[s.id] || {})[dateStr] || 'Unmarked';
          return `
            <tr>
              <td><strong>${s.name}</strong></td>
              <td>
                <span style="font-weight:700; color:${status === 'present' ? 'var(--success)' : status === 'absent' ? 'var(--danger)' : 'var(--text-secondary)'}">
                  ${status.toUpperCase()}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// ==========================================
// 5. PRIVATE MESSAGING ENGINE
// ==========================================

let activeChatThread = null;

async function initMessagesPanel() {
  const threads = await dbService.getChatThreads(activeUser.uid);
  const threadListContainer = document.getElementById('chat-thread-list');
  
  threadListContainer.innerHTML = threads.map(t => `
    <div class="thread-item" data-uid="${t.uid}">
      <img class="thread-avatar" src="${t.avatar}" alt="avatar">
      <div class="thread-details">
        <div class="thread-name">${t.name}</div>
        <span class="profile-role" style="font-size:0.6rem; padding:0.1rem 0.4rem;">${t.role}</span>
      </div>
    </div>
  `).join('');

  // Attach thread selection
  threadListContainer.querySelectorAll('.thread-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const threadEl = e.currentTarget;
      threadListContainer.querySelectorAll('.thread-item').forEach(i => i.classList.remove('active'));
      threadEl.classList.add('active');
      
      const targetUser = threads.find(t => t.uid === threadEl.dataset.uid);
      openChatWindow(targetUser);
    });
  });

  // Re-open active chat if exists
  if (activeChatThread) {
    const activeEl = threadListContainer.querySelector(`[data-uid="${activeChatThread.uid}"]`);
    if (activeEl) activeEl.click();
  }
}

async function openChatWindow(targetUser) {
  activeChatThread = targetUser;
  document.getElementById('chat-header-avatar').src = targetUser.avatar;
  document.getElementById('chat-header-name').innerText = targetUser.name;
  document.getElementById('chat-header-role').innerText = targetUser.role.toUpperCase();

  const chatId = [activeUser.uid, targetUser.uid].sort().join('_');
  const messages = await dbService.getMessages(chatId);
  
  const body = document.getElementById('chat-messages-body');
  body.innerHTML = messages.map(m => `
    <div class="message-bubble ${m.senderId === activeUser.uid ? 'outgoing' : 'incoming'}">
      ${m.text}
    </div>
  `).join('');
  
  // Scroll to bottom
  body.scrollTop = body.scrollHeight;
}

document.getElementById('chat-input-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!activeChatThread) {
    showToast("Please select a thread first!");
    return;
  }
  
  const input = document.getElementById('chat-msg-input');
  const text = input.value.trim();
  if (!text) return;
  
  const chatId = [activeUser.uid, activeChatThread.uid].sort().join('_');
  await dbService.sendMessage(chatId, activeUser.uid, text);
  input.value = '';
  
  openChatWindow(activeChatThread);
});

// ==========================================
// 6. PUBLIC PORTAL RENDERERS
// ==========================================

async function renderPublicAnnouncements() {
  const announcements = await dbService.getAnnouncements();
  const approved = announcements.filter(a => a.status === 'approved');
  const list = document.getElementById('public-announcements-list');

  if (approved.length === 0) {
    list.innerHTML = `<p style="color:var(--text-secondary)">No announcements posted yet.</p>`;
    return;
  }

  // Generate HTML containing news + comment section
  list.innerHTML = approved.map(a => `
    <article class="news-card">
      <div class="news-meta">
        <span class="news-badge">News</span>
        <span>Date: ${a.date}</span>
        <span>By: ${a.author}</span>
      </div>
      <h3 class="news-title">${a.title}</h3>
      <p style="color:var(--text-secondary); margin-bottom:1rem;">${a.content}</p>
      
      <button class="news-comments-btn" data-id="${a.id}">
        <ion-icon name="chatbubble-ellipses-outline"></ion-icon> Comments
      </button>

      <div id="comments-box-${a.id}" class="comments-section" style="display:none;">
        <div id="comments-list-${a.id}"></div>
        <form class="comment-form" data-ann-id="${a.id}">
          <input type="text" placeholder="Add a public comment or inquiry..." required>
          <button type="submit">Post</button>
        </form>
      </div>
    </article>
  `).join('');

  // Comment expand triggers
  list.querySelectorAll('.news-comments-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const annId = e.currentTarget.dataset.id;
      const box = document.getElementById(`comments-box-${annId}`);
      const isHidden = box.style.display === 'none';
      box.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        renderCommentsList(annId);
      }
    });
  });
}

async function renderCommentsList(annId) {
  const comments = await dbService.getComments(annId);
  const list = document.getElementById(`comments-list-${annId}`);
  
  if (comments.length === 0) {
    list.innerHTML = `<p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.5rem;">No comments yet. Be the first to ask!</p>`;
  } else {
    list.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-meta">${c.author}</div>
        <div>${c.text}</div>
      </div>
    `).join('');
  }

  // Handle new comments
  const form = document.querySelector(`.comment-form[data-ann-id="${annId}"]`);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const input = form.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    
    await dbService.addComment(annId, "Guest User", text);
    input.value = '';
    renderCommentsList(annId);
  };
}

async function renderTransparencyDocs() {
  const school = await dbService.getSchool(currentSchoolId);
  const list = document.getElementById('transparency-docs-list');
  
  list.innerHTML = school.transparencyDocs.map(d => `
    <tr>
      <td><strong>${d.title}</strong></td>
      <td>June 2026</td>
      <td>
        <a href="${d.url}" class="nav-link" style="color:var(--primary); font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
          <ion-icon name="download-outline"></ion-icon> View Document
        </a>
      </td>
    </tr>
  `).join('');
}

// ==========================================
// 7. PROFILE & ADMIN BRANDING SETTINGS
// ==========================================

function initProfilePanel() {
  // Populate User inputs
  document.getElementById('profile-avatar-preview').src = activeUser.avatar;
  document.getElementById('profile-name-input').value = activeUser.name;
  
  // Custom seed event
  const seedInput = document.getElementById('profile-avatar-seed');
  seedInput.oninput = (e) => {
    const val = e.target.value.trim();
    if (val) {
      const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(val)}`;
      document.getElementById('profile-avatar-preview').src = newAvatar;
    }
  };

  // User details submit
  document.getElementById('profile-user-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name-input').value.trim();
    const avatar = document.getElementById('profile-avatar-preview').src;
    
    activeUser = await dbService.saveUser(activeUser.uid, { name, avatar });
    showToast("Profile details updated!");
    // Sync sidebar
    document.getElementById('user-name').innerText = activeUser.name;
    document.getElementById('user-avatar').src = activeUser.avatar;
  };

  // Populate School configuration if Admin
  const adminBox = document.getElementById('admin-branding-settings');
  if (activeUser.role === 'admin') {
    adminBox.style.display = 'block';
    
    dbService.getSchool(currentSchoolId).then(school => {
      document.getElementById('school-name-input').value = school.name;
      document.getElementById('school-logo-input').value = school.logo;
      
      // Select preset
      document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.themeVal === school.theme) {
          card.classList.add('selected');
        }
      });
    });

    // Theme pickers click binding
    document.querySelectorAll('.theme-card').forEach(card => {
      card.onclick = (e) => {
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
        const el = e.currentTarget;
        el.classList.add('selected');
      };
    });

    // School config submit
    document.getElementById('profile-school-form').onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('school-name-input').value.trim();
      const logo = document.getElementById('school-logo-input').value.trim();
      const themeCard = document.querySelector('.theme-card.selected');
      const theme = themeCard ? themeCard.dataset.themeVal : 'blue-gold';

      const updated = await dbService.saveSchool(currentSchoolId, { name, logo, theme });
      applyTheme(updated.theme, updated.logo);
      syncBranding(updated);
      showToast("Branding settings saved successfully!");
    };
  } else {
    adminBox.style.display = 'none';
  }
}

function syncBranding(school) {
  document.getElementById('public-school-name').innerText = school.name;
  document.getElementById('school-portal-name').innerText = school.name;
  document.getElementById('public-logo').src = school.logo;
}

// ==========================================
// 8. REAL-TIME NOTIFICATIONS (FB-STYLE)
// ==========================================

async function updateNotificationsList() {
  if (!activeUser) return;
  const notifs = await dbService.getNotifications(activeUser.uid);
  const badge = document.getElementById('notif-badge-count');
  
  badge.innerText = notifs.length;
  badge.style.display = notifs.length > 0 ? 'flex' : 'none';

  const container = document.getElementById('notif-items-list');
  if (notifs.length === 0) {
    container.innerHTML = `<p style="padding:1rem; text-align:center; color:var(--text-secondary); font-size:0.8rem;">No new notifications</p>`;
  } else {
    container.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-text"><strong>${n.senderName}</strong> ${n.messageText}</div>
      </div>
    `).join('');
  }
}

// Clear all notifications
document.getElementById('btn-clear-notifs').addEventListener('click', async () => {
  if (!activeUser) return;
  await dbService.clearNotifications(activeUser.uid);
  updateNotificationsList();
});

// Toggle notifications dropdown
document.getElementById('notif-bell-trigger').addEventListener('click', (e) => {
  e.stopPropagation();
  const dropdown = document.getElementById('notif-dropdown-menu');
  dropdown.classList.toggle('show');
});

document.addEventListener('click', () => {
  document.getElementById('notif-dropdown-menu').classList.remove('show');
});

// ==========================================
// 9. AUTHENTICATION & INITIALIZATION
// ==========================================

// Login Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value; // In mock config, password is bypassed

  const user = await dbService.getUser(email);
  if (user) {
    activeUser = user;
    showToast("Welcome back, logged in successfully!");
    
    // Set user profile in sidebar
    document.getElementById('user-avatar').src = user.avatar;
    document.getElementById('user-name').innerText = user.name;
    document.getElementById('user-role').innerText = user.role;

    // Load portal
    window.location.hash = '#/dashboard';
    updateNotificationsList();
  } else {
    showToast("Invalid credentials. Try demo credentials!");
  }
});

// Logout Portal
document.getElementById('btn-logout').addEventListener('click', () => {
  activeUser = null;
  activeChatThread = null;
  showToast("Logged out successfully.");
  window.location.hash = '#/home';
});

// Toast controller helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Announcements Creation modal triggers
document.getElementById('btn-open-announcement-modal').onclick = () => {
  document.getElementById('announcement-modal').style.display = 'flex';
};

document.getElementById('btn-close-ann-modal').onclick = () => {
  document.getElementById('announcement-modal').style.display = 'none';
};

document.getElementById('announcement-form').onsubmit = async (e) => {
  e.preventDefault();
  const title = document.getElementById('ann-title').value.trim();
  const content = document.getElementById('ann-content').value.trim();
  
  await dbService.addAnnouncement(title, content, activeUser.name);
  document.getElementById('ann-title').value = '';
  document.getElementById('ann-content').value = '';
  document.getElementById('announcement-modal').style.display = 'none';
  
  showToast(activeUser.role === 'admin' ? "Announcement posted!" : "Submitted for review.");
  renderRolePortal();
};

// Global App Init
async function initApp() {
  // Load school config
  const school = await dbService.getSchool(currentSchoolId);
  applyTheme(school.theme, school.logo);
  syncBranding(school);

  // Bind Router
  initRouter();
}

initApp();
