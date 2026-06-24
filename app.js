// Firebase Configuration & Local Mock Fallback Layer
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const useFirebase = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

// Local DB State structure for mock fallback (Facebook School Edition)
const DEFAULT_LOCAL_DB = {
  schools: {
    "default-school": {
      name: "Apex Integrated School",
      logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80",
      theme: "blue-gold",
      accentColor: "#d4af37",
      transparencyDocs: [
        { title: "Citizen's Charter 2026", url: "#" },
        { title: "School Report Card (SRC) FY 2025", url: "#" },
        { title: "Annual Procurement Plan (APP)", url: "#" }
      ]
    }
  },
  users: {
    "admin1":   { uid: "admin1",   email: "admin@school.edu",   name: "Maria Santos (Admin)",    role: "admin",   schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos" },
    "teacher1": { uid: "teacher1", email: "teacher@school.edu", name: "Teacher Jose (Math)",    role: "teacher", schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose" },
    "parent1":  { uid: "parent1",  email: "parent@school.edu",  name: "Mrs. Cruz (Parent)",     role: "parent",  schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=MrsCruz" },
    "learner1": { uid: "learner1", email: "learner@school.edu", name: "Juan Cruz (Grade 10)",   role: "learner", schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=JuanCruz" }
  },
  announcements: [
    {
      id: "ann1",
      schoolId: "default-school",
      title: "AY 2026-2027 Enrollment Open",
      content: "We are pleased to announce that enrollment for both Junior and Senior High School is now officially open. Please submit requirements to the registrar's office.",
      author: "Maria Santos",
      authorRole: "admin",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos",
      date: "2026-06-24",
      status: "approved",
      likes: ["learner1", "parent1"]
    },
    {
      id: "ann2",
      schoolId: "default-school",
      title: "Class Suspensions Due to Inclement Weather",
      content: "In compliance with DepEd local directives, classes in all levels are suspended today due to heavy monsoon rains. Stay safe inside, learners!",
      author: "Teacher Jose",
      authorRole: "teacher",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose",
      date: "2026-06-23",
      status: "approved",
      likes: ["parent1"]
    },
    {
      id: "ann3",
      schoolId: "default-school",
      title: "Upcoming Brigada Eskwela Activities",
      content: "Join us this coming Monday for our annual school maintenance and cleanup drive. Let's work together to prepare classrooms for our learners.",
      author: "Teacher Jose",
      authorRole: "teacher",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose",
      date: "2026-06-23",
      status: "pending",
      likes: []
    },
    {
      id: "ann4",
      schoolId: "default-school",
      title: "Learner of the Month",
      content: "Congratulations to Juan Cruz for demonstrating outstanding academic excellence and leadership in the Grade 10 Science class!",
      author: "Maria Santos",
      authorRole: "admin",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos",
      date: "2026-06-25",
      status: "approved",
      likes: ["teacher1"],
      type: "achievement",
      reactions: { celebrate: 12, love: 5 }
    },
    {
      id: "ann5",
      schoolId: "default-school",
      title: "PTA General Assembly",
      content: "All parents are invited to the first General Assembly of the Academic Year to discuss school policies and upcoming events.",
      author: "Maria Santos",
      authorRole: "admin",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos",
      date: "2026-07-05",
      status: "approved",
      likes: [],
      type: "event",
      eventDate: "July 10, 2026",
      eventTime: "08:00 AM",
      eventLocation: "School Gymnasium",
      eventGoing: 45
    },
    {
      id: "ann6",
      schoolId: "default-school",
      title: "Intramurals Theme Selection",
      content: "Learners, please vote for this year's Intramurals theme!",
      author: "Teacher Jose",
      authorRole: "teacher",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose",
      date: "2026-06-26",
      status: "approved",
      likes: ["learner1"],
      type: "poll",
      pollOptions: [
        { text: "Futuristic / Sci-Fi", votes: 120 },
        { text: "Mythology & Legends", votes: 85 },
        { text: "Philippine Festivals", votes: 210 }
      ]
    }
  ],
  comments: [
    { id: "c1", announcementId: "ann1", author: "Mrs. Cruz (Parent)", text: "Are the enrollment forms downloadable online?", timestamp: Date.now() }
  ],
  attendance: {}, // format: { "default-school": { "learner1": { "2026-06-24": "present" } } }
  chats: {}, 
  notifications: [
    { id: "n1", schoolId: "default-school", recipientId: "admin1", senderName: "Teacher Jose", messageText: "submitted 'Upcoming Brigada Eskwela' for approval.", read: false, timestamp: Date.now() }
  ],
  schedules: {
    "learner1": [
      { time: "07:30 AM - 08:30 AM", subject: "Mathematics 10", room: "Room 102", teacher: "Teacher Jose" },
      { time: "08:30 AM - 09:30 AM", subject: "English 10", room: "Room 102", teacher: "Teacher Reyes" },
      { time: "09:45 AM - 10:45 AM", subject: "Science 10", room: "Lab A", teacher: "Teacher Lim" }
    ],
    "teacher1": [
      { time: "07:30 AM - 08:30 AM", subject: "Mathematics 10", room: "Room 102", class: "Grade 10-A" },
      { time: "10:45 AM - 11:45 AM", subject: "Mathematics 9", room: "Room 204", class: "Grade 9-B" }
    ]
  }
};

// Initialize LocalStorage DB with Version check
const DB_VERSION = "v4";
try {
  const currentVer = localStorage.getItem("deped_saas_db_version");
  if (!currentVer || currentVer < DB_VERSION) {
    // Only wipe if REALLY necessary. Actually let's just do a merge.
    localStorage.setItem("deped_saas_db_version", DB_VERSION);
  }
} catch(e) {}

// Image compression helper to prevent localStorage QuotaExceededError
function compressImage(dataUrl, maxDimension, callback) {
  const img = new Image();
  img.onload = () => {
    let w = img.width;
    let h = img.height;
    if (w > maxDimension || h > maxDimension) {
      if (w > h) {
        h = Math.floor(h * (maxDimension / w));
        w = maxDimension;
      } else {
        w = Math.floor(w * (maxDimension / h));
        h = maxDimension;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL('image/jpeg', 0.8));
  };
  img.src = dataUrl;
}

try {
  if (!localStorage.getItem("deped_saas_db")) {
    localStorage.setItem("deped_saas_db", JSON.stringify(DEFAULT_LOCAL_DB));
  }
} catch(e) {
  console.error("Storage blocked or unavailable", e);
}

function getLocalDB() {
  try {
    const data = localStorage.getItem("deped_saas_db");
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        // Ensure all required default keys are present in local DB (auto-healing)
        let updated = false;
        const keys = Object.keys(DEFAULT_LOCAL_DB);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          if (parsed[k] === undefined || parsed[k] === null) {
            parsed[k] = DEFAULT_LOCAL_DB[k];
            updated = true;
          }
        }
        if (updated) {
          localStorage.setItem("deped_saas_db", JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch(e) {
    console.error("Local database corrupted, resetting to defaults...", e);
  }
  try {
    localStorage.setItem("deped_saas_db", JSON.stringify(DEFAULT_LOCAL_DB));
  } catch(e) {
    console.error("Failed to write to local storage", e);
  }
  return DEFAULT_LOCAL_DB;
}

function saveLocalDB(data) {
  try {
    localStorage.setItem("deped_saas_db", JSON.stringify(data));
  } catch(e) {
    console.error("Failed to write to local storage", e);
    showToast("Error: Storage limit reached! Try smaller images.");
  }
}

// ==========================================
// SESSION MANAGEMENT & STATE
// ==========================================

let activeUser = null;
try {
  activeUser = JSON.parse(sessionStorage.getItem('activeUser')) || null;
} catch(e) {
  console.error("Session storage blocked or unavailable", e);
}
let currentSchoolId = "default-school";

// ==========================================
// DATA ACCESS LAYER
// ==========================================

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
  addAnnouncement: async (title, content, imageData) => {
    const local = getLocalDB();
    const newAnn = {
      id: "ann_" + Date.now(),
      schoolId: currentSchoolId,
      title,
      content,
      imageData: imageData || null,
      author: activeUser.name,
      authorRole: activeUser.role,
      authorAvatar: activeUser.avatar,
      date: new Date().toISOString().split('T')[0],
      status: activeUser.role === 'admin' ? 'approved' : 'pending',
      likes: []
    };
    local.announcements.unshift(newAnn);
    
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
  toggleLike: async (annId) => {
    if (!activeUser) return;
    const local = getLocalDB();
    const annIndex = local.announcements.findIndex(a => a.id === annId);
    if (annIndex !== -1) {
      const likes = local.announcements[annIndex].likes || [];
      const userIndex = likes.indexOf(activeUser.uid);
      if (userIndex === -1) {
        likes.push(activeUser.uid);
      } else {
        likes.splice(userIndex, 1);
      }
      local.announcements[annIndex].likes = likes;
      saveLocalDB(local);
    }
  },
  moderateAnnouncement: async (annId, status) => {
    const local = getLocalDB();
    const annIndex = local.announcements.findIndex(a => a.id === annId);
    if (annIndex !== -1) {
      local.announcements[annIndex].status = status;
      
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
    return Object.values(local.users).filter(u => u.uid !== uid);
  },
  getMessages: async (chatId) => {
    const local = getLocalDB();
    return local.chats[chatId] || [];
  },
  sendMessage: async (chatId, senderId, text, imageData) => {
    const local = getLocalDB();
    if (!local.chats[chatId]) {
      local.chats[chatId] = [];
    }
    const newMsg = {
      senderId,
      text: text || '',
      imageData: imageData || null,
      timestamp: Date.now()
    };
    local.chats[chatId].push(newMsg);
    
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

// ==========================================
// CENTRAL APPLICATION ROUTER (HASH BASED)
// ==========================================

function initRouter() {
  const handleRouting = () => {
    const hash = window.location.hash || '#/home';
    
    let viewName = 'home';
    if (hash.startsWith('#/')) {
      viewName = hash.split('#/')[1].split('/')[0];
    }

    // Guard portal routes
    const authRoutes = ['dashboard', 'messages', 'profile'];
    if (authRoutes.includes(viewName) && !activeUser) {
      window.location.hash = '#/home';
      showToast("Please log in to access this portal section!");
      return;
    }

    switchView(viewName);
  };

  window.addEventListener('hashchange', handleRouting);
  handleRouting();
}

function switchView(viewName) {
  // Check auth and show login screen if not authenticated
  const loginOverlay = document.getElementById('login-screen-overlay');
  if (!activeUser) {
    if (loginOverlay) loginOverlay.style.display = 'flex';
    // Let the background routing still process underneath so when they log in, it's ready.
  } else {
    if (loginOverlay) loginOverlay.style.display = 'none';
  }

  // Restore saved theme on navigation (in case user was previewing a theme in settings but didn't save)
  const currentSchoolId = activeUser ? activeUser.schoolId : "default-school";
  dbService.getSchool(currentSchoolId).then(school => {
    applyTheme(school.theme, school.logo);
  });

  // Toggle visibility of route blocks
  document.querySelectorAll('.route-view').forEach(view => {
    view.style.display = 'none';
  });

  const activeView = document.getElementById(`view-${viewName}`);
  if (activeView) {
    activeView.style.display = 'block';
  }

  // Update sidebar active highlights
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    }
  });

  // Specific module loaders
  if (viewName === 'home') {
    renderNewsfeed();
  } else if (viewName === 'transparency') {
    renderTransparencyDocs();
  } else if (viewName === 'dashboard') {
    renderRolePortal();
  } else if (viewName === 'messages') {
    initMessagesPanel();
  } else if (viewName === 'profile') {
    initProfilePanel();
  }
}

// ==========================================
// DYNAMIC VIEW RENDERERS (FB SCHOOL NEWSFEED)
// ==========================================

async function renderNewsfeed() {
  const container = document.getElementById('school-newsfeed-container');
  if (!container) return;

  const announcements = await dbService.getAnnouncements();
  const approved = announcements.filter(a => a.status === 'approved');

  if (approved.length === 0) {
    container.innerHTML = `<p style="padding: 2rem; text-align: center; color:var(--text-secondary)">No news or announcements have been posted yet.</p>`;
    return;
  }

  container.innerHTML = approved.map(a => {
    const likes = a.likes || [];
    const userHasLiked = activeUser ? likes.includes(activeUser.uid) : false;
    
    let innerCardHTML = '';
    
    if (a.type === 'achievement') {
      innerCardHTML = `
        <div class="achievement-badge"><ion-icon name="trophy"></ion-icon> Achievement</div>
        <h3 class="news-title" style="font-size:1.3rem; margin-bottom:0.5rem; color:#78350f;">${a.title}</h3>
        <p style="color:var(--text-secondary); margin-bottom:1rem; font-size:1rem; font-weight:500;">${a.content}</p>
      `;
    } else if (a.type === 'event') {
      innerCardHTML = `
        <h3 class="news-title" style="font-size:1.2rem; margin-bottom:0.75rem;">${a.title}</h3>
        <p style="color:var(--text-secondary); margin-bottom:1rem; font-size:0.95rem;">${a.content}</p>
        <div class="event-details">
          <div style="display:flex; align-items:center; gap:0.5rem;"><ion-icon name="calendar" style="color:var(--primary);"></ion-icon> <strong>${a.eventDate}</strong> at ${a.eventTime}</div>
          <div style="display:flex; align-items:center; gap:0.5rem;"><ion-icon name="location" style="color:var(--primary);"></ion-icon> ${a.eventLocation}</div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.5rem;">
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">${a.eventGoing} people going</span>
            <button class="btn-action" style="padding:0.4rem 1rem; font-size:0.8rem; border-radius:50px;">I'm Going</button>
          </div>
        </div>
      `;
    } else if (a.type === 'poll') {
      const totalVotes = a.pollOptions.reduce((sum, opt) => sum + opt.votes, 0);
      const pollHTML = a.pollOptions.map(opt => {
        const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
        return `
          <div class="poll-option">
            <div class="poll-progress" style="width:${percent}%;"></div>
            <span class="poll-text">${opt.text}</span>
            <span class="poll-percent">${percent}%</span>
          </div>
        `;
      }).join('');
      innerCardHTML = `
        <h3 class="news-title" style="font-size:1.2rem; margin-bottom:0.75rem;">${a.title}</h3>
        <p style="color:var(--text-secondary); margin-bottom:1rem; font-size:0.95rem;">${a.content}</p>
        <div class="poll-card" style="margin-bottom:1rem;">
          ${pollHTML}
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.5rem; text-align:right;">${totalVotes} total votes</div>
        </div>
      `;
    } else {
      // Default Announcement
      innerCardHTML = `
        <h3 class="news-title" style="font-size:1.2rem; margin-bottom:0.75rem;">${a.title}</h3>
        <p style="color:var(--text-secondary); margin-bottom:1rem; font-size:0.95rem;">${a.content}</p>
        ${a.imageData ? `<img src="${a.imageData}" alt="Post image" style="width:100%; max-height:360px; object-fit:cover; border-radius:var(--radius-md); margin-bottom:1rem; border:1px solid var(--border-color);">` : ''}
      `;
    }

    return `
      <article class="news-card ${a.type === 'achievement' ? 'achievement-card' : (a.type === 'event' ? 'event-card' : '')}" style="margin-bottom:1.5rem;">
        <!-- Card Header (FB Style) -->
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <img class="thread-avatar" src="${a.authorAvatar || 'https://api.dicebear.com/7.x/micah/svg?seed=placeholder'}" alt="avatar">
          <div>
            <strong style="font-size:0.95rem; display:block;">${a.author}</strong>
            <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">${a.authorRole} • ${a.date}</span>
          </div>
        </div>

        ${innerCardHTML}
        
        <!-- Interactive Like & Comment Status bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          <span id="likes-count-${a.id}">👍 ${likes.length} Reactions</span>
          <span style="cursor:pointer;" class="btn-expand-comments" data-id="${a.id}">💬 Comments</span>
        </div>

        <!-- Custom School Reactions Bar -->
        <div class="reactions-bar">
          <button class="reaction-btn ${userHasLiked ? 'reacted' : ''} btn-like-post" data-id="${a.id}"><ion-icon name="heart"></ion-icon> Love</button>
          <button class="reaction-btn btn-like-post" data-id="${a.id}"><ion-icon name="ribbon"></ion-icon> Celebrate</button>
          <button class="reaction-btn btn-like-post" data-id="${a.id}"><ion-icon name="bulb"></ion-icon> Inspired</button>
          <button class="reaction-btn btn-like-post" data-id="${a.id}"><ion-icon name="information-circle"></ion-icon> Helpful</button>
          <button class="btn-expand-comments reaction-btn" data-id="${a.id}" style="margin-left:auto;"><ion-icon name="chatbubble"></ion-icon> Discuss</button>
        </div>

        <!-- Comments Section drawer -->
        <div id="comments-box-${a.id}" class="comments-section" style="display:none; background:var(--bg-primary); padding:1rem; border-radius:var(--radius-md);">
          <div id="comments-list-${a.id}"></div>
          <form class="comment-form" data-ann-id="${a.id}" style="display:flex; gap:0.5rem; margin-top:0.75rem;">
            <input type="text" class="form-control" style="padding:0.4rem; font-size:0.85rem;" placeholder="Write a comment..." required>
            <button type="submit" class="btn-action" style="padding:0.4rem 1rem; font-size:0.85rem;">Post</button>
          </form>
        </div>
      </article>
    `;
  }).join('');

  // Likes trigger bindings
  container.querySelectorAll('.btn-like-post').forEach(btn => {
    btn.onclick = async (e) => {
      if (!activeUser) {
        showToast("Please log in to like posts!");
        return;
      }
      const annId = e.currentTarget.dataset.id;
      await dbService.toggleLike(annId);
      renderNewsfeed();
    };
  });

  // Comments drawer expand bindings
  container.querySelectorAll('.btn-expand-comments').forEach(btn => {
    btn.onclick = async (e) => {
      const annId = e.currentTarget.dataset.id;
      const box = document.getElementById(`comments-box-${annId}`);
      const isHidden = box.style.display === 'none';
      box.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        renderCommentsList(annId);
      }
    };
  });
}

async function renderCommentsList(annId) {
  const comments = await dbService.getComments(annId);
  const list = document.getElementById(`comments-list-${annId}`);
  
  if (comments.length === 0) {
    list.innerHTML = `<p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.5rem;">No comments yet.</p>`;
  } else {
    list.innerHTML = comments.map(c => `
      <div class="comment-item" style="padding:0.5rem; margin-bottom:0.5rem;">
        <div class="comment-meta" style="font-weight:700; color:var(--primary); font-size:0.8rem;">${c.author}</div>
        <div style="font-size:0.85rem;">${c.text}</div>
      </div>
    `).join('');
  }

  const form = document.querySelector(`.comment-form[data-ann-id="${annId}"]`);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const input = form.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    
    const authorName = activeUser ? activeUser.name : "Guest Parent";
    await dbService.addComment(annId, authorName, text);
    input.value = '';
    renderCommentsList(annId);
  };
}

async function renderTransparencyDocs() {
  const list = document.getElementById('transparency-docs-list');
  if (!list) return;

  const school = await dbService.getSchool(currentSchoolId);
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
// AUTH PORTAL DASHBOARDS
// ==========================================

async function renderRolePortal() {
  if (!activeUser) return;
  const role = activeUser.role;
  
  document.getElementById('portal-view-learner').style.display = 'none';
  document.getElementById('portal-view-parent').style.display = 'none';
  document.getElementById('portal-view-teacher').style.display = 'none';
  document.getElementById('portal-view-admin').style.display = 'none';

  const roleView = document.getElementById(`portal-view-${role}`);
  if (roleView) {
    roleView.style.display = 'block';
  }

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

async function renderLearnerView() {
  if (!activeUser) return;
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
    document.getElementById('btn-learner-checkin').onclick = async () => {
      await dbService.markAttendance(activeUser.uid, dateStr, 'present');
      showToast("Attendance logged successfully!");
      renderLearnerView();
    };
  }
}

async function renderParentView() {
  const attendance = await dbService.getAttendance();
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

async function renderTeacherView() {
  if (!activeUser) return;
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

  const attendance = await dbService.getAttendance();
  const dateStr = new Date().toISOString().split('T')[0];
  const learnerId = "learner1";
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

  document.getElementById('btn-toggle-present').onclick = async () => {
    const nextStatus = isPresent ? 'absent' : 'present';
    await dbService.markAttendance(learnerId, dateStr, nextStatus);
    showToast(`Marked ${nextStatus.toUpperCase()}`);
    renderTeacherView();
  };
}

async function renderAdminView() {
  const announcements = await dbService.getAnnouncements();
  const pendings = announcements.filter(a => a.status === 'pending');
  
  const pendingContainer = document.getElementById('admin-pending-announcements');
  if (pendingContainer) {
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
            <button class="btn-approve btn-action" data-id="${p.id}" style="padding:0.4rem 1rem; background-color:var(--success)">Approve</button>
            <button class="btn-reject btn-secondary" data-id="${p.id}" style="padding:0.4rem 1rem; border-color:var(--danger); color:var(--danger)">Reject</button>
          </div>
        </div>
      `).join('');

      pendingContainer.querySelectorAll('.btn-approve').forEach(btn => {
        btn.onclick = async (e) => {
          await dbService.moderateAnnouncement(e.target.dataset.id, 'approved');
          showToast("Announcement approved!");
          renderAdminView();
          updateNotificationsList();
        };
      });

      pendingContainer.querySelectorAll('.btn-reject').forEach(btn => {
        btn.onclick = async (e) => {
          await dbService.moderateAnnouncement(e.target.dataset.id, 'rejected');
          showToast("Announcement rejected.");
          renderAdminView();
        };
      });
    }
  }

  const attendance = await dbService.getAttendance();
  const grid = document.getElementById('admin-attendance-grid');
  if (grid) {
    const dateStr = new Date().toISOString().split('T')[0];
    const students = [{ name: "Juan Cruz", id: "learner1" }];
    
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
}

// ==========================================
// PRIVATE MESSAGES & CHAT
// ==========================================

let activeChatThread = null;

async function initMessagesPanel() {
  if (!activeUser) return;
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

  threadListContainer.querySelectorAll('.thread-item').forEach(item => {
    item.onclick = (e) => {
      const threadEl = e.currentTarget;
      threadListContainer.querySelectorAll('.thread-item').forEach(i => i.classList.remove('active'));
      threadEl.classList.add('active');
      const targetUser = threads.find(t => t.uid === threadEl.dataset.uid);
      openChatWindow(targetUser);
    };
  });

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
  body.innerHTML = messages.map(m => {
    const isOut = m.senderId === activeUser.uid;
    const cls = isOut ? 'outgoing' : 'incoming';
    let content = '';
    if (m.imageData) {
      content = `<img src="${m.imageData}" alt="Image" style="max-width:220px; max-height:200px; border-radius:var(--radius-md); display:block; margin-bottom:${m.text ? '0.4rem' : '0'};">`;
    }
    if (m.text) content += `<span>${m.text}</span>`;
    return `<div class="message-bubble ${cls}">${content}</div>`;
  }).join('');
  
  body.scrollTop = body.scrollHeight;

  // Toggle active view state on mobile
  const container = document.getElementById('chat-container-element');
  if (container) {
    container.classList.add('chat-active-window');
  }
}

// Bind mobile back button
const chatBackBtn = document.getElementById('btn-chat-back');
if (chatBackBtn) {
  chatBackBtn.onclick = () => {
    activeChatThread = null;
    const container = document.getElementById('chat-container-element');
    if (container) {
      container.classList.remove('chat-active-window');
    }
  };
}

const chatForm = document.getElementById('chat-input-form');
const chatAttachBtn = document.getElementById('btn-attach-chat-photo');
const chatPhotoInput = document.getElementById('chat-photo-input');

// Wire up the photo attach button in chat
if (chatAttachBtn && chatPhotoInput) {
  chatAttachBtn.onclick = () => chatPhotoInput.click();
  chatPhotoInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChatThread || !activeUser) {
      if (!activeChatThread) showToast("Select a conversation first!");
      chatPhotoInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      compressImage(ev.target.result, 800, async (compressedData) => {
        const chatId = [activeUser.uid, activeChatThread.uid].sort().join('_');
        await dbService.sendMessage(chatId, activeUser.uid, '', compressedData);
        chatPhotoInput.value = '';
        openChatWindow(activeChatThread);
        showToast('Photo sent!');
      });
    };
    reader.readAsDataURL(file);
  };
}

if (chatForm) {
  chatForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!activeChatThread) {
      showToast("Please select a thread first!");
      return;
    }
    
    const input = document.getElementById('chat-msg-input');
    const text = input.value.trim();
    if (!text) return;
    
    const chatId = [activeUser.uid, activeChatThread.uid].sort().join('_');
    await dbService.sendMessage(chatId, activeUser.uid, text, null);
    input.value = '';
    
    openChatWindow(activeChatThread);
  };
}

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

function initProfilePanel() {
  if (!activeUser) return;
  document.getElementById('profile-avatar-preview').src = activeUser.avatar;
  document.getElementById('profile-name-input').value = activeUser.name;

  // --- Profile Photo Upload (click avatar to pick a file) ---
  const profilePhotoInput = document.getElementById('profile-photo-input');
  const avatarUploadWrap = document.getElementById('profile-avatar-upload-wrap');

  if (avatarUploadWrap && profilePhotoInput) {
    // Hover dim effect
    avatarUploadWrap.onmouseenter = () => {
      document.getElementById('profile-avatar-preview').style.opacity = '0.75';
    };
    avatarUploadWrap.onmouseleave = () => {
      document.getElementById('profile-avatar-preview').style.opacity = '1';
    };
    // Click opens file picker
    avatarUploadWrap.onclick = () => profilePhotoInput.click();

    profilePhotoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        compressImage(ev.target.result, 400, (compressedData) => {
          document.getElementById('profile-avatar-preview').src = compressedData;
          showToast('Photo selected! Click Save Profile to apply.');
        });
      };
      reader.readAsDataURL(file);
    };
  }

  // --- Cartoon avatar seed (fallback) ---
  const seedInput = document.getElementById('profile-avatar-seed');
  if (seedInput) {
    seedInput.oninput = (e) => {
      const val = e.target.value.trim();
      if (val) {
        const newAvatar = `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(val)}`;
        document.getElementById('profile-avatar-preview').src = newAvatar;
      }
    };
  }

  // --- Dynamic Role Fields ---
  const roleFieldsContainer = document.getElementById('profile-role-fields');
  if (roleFieldsContainer) {
    const roleData = activeUser.roleData || {};
    let html = '';
    
    if (activeUser.role === 'learner') {
      html = `
        <div class="form-group" style="margin-bottom:0;"><label>Learner Reference Number (LRN)</label><input type="text" id="rf-lrn" class="form-control" value="${roleData.lrn || ''}" placeholder="12-digit LRN"></div>
        <div style="display:flex; gap:1rem;">
          <div class="form-group" style="margin-bottom:0; flex:1;"><label>Grade Level</label><input type="text" id="rf-grade" class="form-control" value="${roleData.grade || ''}" placeholder="e.g. Grade 10"></div>
          <div class="form-group" style="margin-bottom:0; flex:1;"><label>Section</label><input type="text" id="rf-section" class="form-control" value="${roleData.section || ''}" placeholder="e.g. Rizal"></div>
        </div>
        <div class="form-group" style="margin-bottom:0;"><label>Adviser Name</label><input type="text" id="rf-adviser" class="form-control" value="${roleData.adviser || ''}" placeholder="Class Adviser"></div>
      `;
    } else if (activeUser.role === 'teacher') {
      html = `
        <div class="form-group" style="margin-bottom:0;"><label>Employee ID Number</label><input type="text" id="rf-empid" class="form-control" value="${roleData.empId || ''}"></div>
        <div class="form-group" style="margin-bottom:0;"><label>PRC License Number</label><input type="text" id="rf-prc" class="form-control" value="${roleData.prc || ''}"></div>
        <div class="form-group" style="margin-bottom:0;"><label>Department / Subject</label><input type="text" id="rf-dept" class="form-control" value="${roleData.dept || ''}" placeholder="e.g. Mathematics"></div>
        <div class="form-group" style="margin-bottom:0;">
          <label>Teaching Position</label>
          <select id="rf-position" class="form-control">
            <option value="">Select Position...</option>
            <optgroup label="Classroom Teaching Career Line">
              <option value="Teacher I" ${roleData.position === 'Teacher I' ? 'selected' : ''}>Teacher I</option>
              <option value="Teacher II" ${roleData.position === 'Teacher II' ? 'selected' : ''}>Teacher II</option>
              <option value="Teacher III" ${roleData.position === 'Teacher III' ? 'selected' : ''}>Teacher III</option>
              <option value="Teacher IV" ${roleData.position === 'Teacher IV' ? 'selected' : ''}>Teacher IV</option>
              <option value="Teacher V" ${roleData.position === 'Teacher V' ? 'selected' : ''}>Teacher V</option>
              <option value="Teacher VI" ${roleData.position === 'Teacher VI' ? 'selected' : ''}>Teacher VI</option>
              <option value="Teacher VII" ${roleData.position === 'Teacher VII' ? 'selected' : ''}>Teacher VII</option>
            </optgroup>
            <optgroup label="Master Teachers">
              <option value="Master Teacher I" ${roleData.position === 'Master Teacher I' ? 'selected' : ''}>Master Teacher I</option>
              <option value="Master Teacher II" ${roleData.position === 'Master Teacher II' ? 'selected' : ''}>Master Teacher II</option>
              <option value="Master Teacher III" ${roleData.position === 'Master Teacher III' ? 'selected' : ''}>Master Teacher III</option>
              <option value="Master Teacher IV" ${roleData.position === 'Master Teacher IV' ? 'selected' : ''}>Master Teacher IV</option>
              <option value="Master Teacher V" ${roleData.position === 'Master Teacher V' ? 'selected' : ''}>Master Teacher V</option>
            </optgroup>
            <optgroup label="Head Teachers">
              <option value="Head Teacher I" ${roleData.position === 'Head Teacher I' ? 'selected' : ''}>Head Teacher I</option>
              <option value="Head Teacher III" ${roleData.position === 'Head Teacher III' ? 'selected' : ''}>Head Teacher III</option>
              <option value="Head Teacher VI" ${roleData.position === 'Head Teacher VI' ? 'selected' : ''}>Head Teacher VI</option>
            </optgroup>
          </select>
        </div>
      `;
    } else if (activeUser.role === 'parent') {
      html = `
        <div class="form-group" style="margin-bottom:0;"><label>Contact Number</label><input type="text" id="rf-contact" class="form-control" value="${roleData.contact || ''}" placeholder="09XX-XXX-XXXX"></div>
        <div class="form-group" style="margin-bottom:0;"><label>Learner Name</label><input type="text" id="rf-learner" class="form-control" value="${roleData.learnerName || ''}" placeholder="Child's Full Name"></div>
        <div class="form-group" style="margin-bottom:0;"><label>Relationship</label><input type="text" id="rf-rel" class="form-control" value="${roleData.relationship || ''}" placeholder="e.g. Mother, Father, Guardian"></div>
      `;
    } else if (activeUser.role === 'admin') {
      html = `
        <div class="form-group" style="margin-bottom:0;"><label>Employee ID Number</label><input type="text" id="rf-empid" class="form-control" value="${roleData.empId || ''}"></div>
        <div class="form-group" style="margin-bottom:0;">
          <label>School Administration Career Line</label>
          <select id="rf-position" class="form-control">
            <option value="">Select Official Title...</option>
            <optgroup label="School Principals">
              <option value="School Principal I" ${roleData.position === 'School Principal I' ? 'selected' : ''}>School Principal I</option>
              <option value="School Principal II" ${roleData.position === 'School Principal II' ? 'selected' : ''}>School Principal II</option>
              <option value="School Principal III" ${roleData.position === 'School Principal III' ? 'selected' : ''}>School Principal III</option>
              <option value="School Principal IV" ${roleData.position === 'School Principal IV' ? 'selected' : ''}>School Principal IV</option>
              <option value="School Principal V" ${roleData.position === 'School Principal V' ? 'selected' : ''}>School Principal V</option>
            </optgroup>
            <optgroup label="Assistant Principals">
              <option value="Asst. School Principal I" ${roleData.position === 'Asst. School Principal I' ? 'selected' : ''}>Assistant School Principal I</option>
              <option value="Asst. School Principal II" ${roleData.position === 'Asst. School Principal II' ? 'selected' : ''}>Assistant School Principal II</option>
              <option value="Asst. School Principal III" ${roleData.position === 'Asst. School Principal III' ? 'selected' : ''}>Assistant School Principal III</option>
            </optgroup>
            <optgroup label="Administrative Support">
              <option value="Administrative Officer V" ${roleData.position === 'Administrative Officer V' ? 'selected' : ''}>Administrative Officer V</option>
              <option value="Administrative Officer II" ${roleData.position === 'Administrative Officer II' ? 'selected' : ''}>Administrative Officer II</option>
              <option value="Administrative Assistant III" ${roleData.position === 'Administrative Assistant III' ? 'selected' : ''}>Administrative Assistant III (Senior Bookkeeper)</option>
              <option value="Administrative Assistant II" ${roleData.position === 'Administrative Assistant II' ? 'selected' : ''}>Administrative Assistant II (Clerk)</option>
            </optgroup>
          </select>
        </div>
      `;
    }
    
    roleFieldsContainer.innerHTML = html;
  }

  document.getElementById('profile-user-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name-input').value.trim();
    const avatar = document.getElementById('profile-avatar-preview').src;

    // Extract Role Data
    const roleData = {};
    if (activeUser.role === 'learner') {
      roleData.lrn = document.getElementById('rf-lrn').value.trim();
      roleData.grade = document.getElementById('rf-grade').value.trim();
      roleData.section = document.getElementById('rf-section').value.trim();
      roleData.adviser = document.getElementById('rf-adviser').value.trim();
    } else if (activeUser.role === 'teacher') {
      roleData.empId = document.getElementById('rf-empid').value.trim();
      roleData.prc = document.getElementById('rf-prc').value.trim();
      roleData.dept = document.getElementById('rf-dept').value.trim();
      roleData.position = document.getElementById('rf-position').value;
    } else if (activeUser.role === 'parent') {
      roleData.contact = document.getElementById('rf-contact').value.trim();
      roleData.learnerName = document.getElementById('rf-learner').value.trim();
      roleData.relationship = document.getElementById('rf-rel').value.trim();
    } else if (activeUser.role === 'admin') {
      roleData.empId = document.getElementById('rf-empid').value.trim();
      roleData.position = document.getElementById('rf-position').value;
    }

    activeUser = await dbService.saveUser(activeUser.uid, { name, avatar, roleData });
    try { sessionStorage.setItem('activeUser', JSON.stringify(activeUser)); } catch(err) {}
    showToast('Profile updated successfully!');

    // Sync sidebar avatar + name immediately
    syncSidebarProfile();
  };

  const adminBox = document.getElementById('admin-branding-settings');
  if (activeUser.role === 'admin') {
    adminBox.style.display = 'block';
    
    dbService.getSchool(currentSchoolId).then(school => {
      document.getElementById('school-name-input').value = school.name;
      // Populate hidden input and logo preview
      document.getElementById('school-logo-input').value = school.logo;
      const logoPreview = document.getElementById('logo-upload-preview');
      if (logoPreview) logoPreview.src = school.logo;
      
      document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.themeVal === school.theme) {
          card.classList.add('selected');
        }
      });
    });

    // Wire up logo file upload
    const logoFileBtn = document.getElementById('btn-upload-logo');
    const logoFileInput = document.getElementById('school-logo-file-input');
    if (logoFileBtn && logoFileInput) {
      logoFileBtn.onclick = () => logoFileInput.click();
      logoFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          compressImage(ev.target.result, 500, (compressedData) => {
            document.getElementById('school-logo-input').value = compressedData;
            const logoPreview = document.getElementById('logo-upload-preview');
            if (logoPreview) logoPreview.src = compressedData;
            // Apply to sidebar live preview
            document.getElementById('school-logo-img').src = compressedData;
            showToast('Logo uploaded! Click Save to apply.');
          });
        };
        reader.readAsDataURL(file);
      };
    }

    document.querySelectorAll('.theme-card').forEach(card => {
      card.onclick = (e) => {
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
        const el = e.currentTarget;
        el.classList.add('selected');
        // Live preview the theme
        applyTheme(el.dataset.themeVal, document.getElementById('school-logo-input').value.trim());
      };
    });

    document.getElementById('profile-school-form').onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('school-name-input').value.trim();
      const logo = document.getElementById('school-logo-input').value.trim();
      const themeCard = document.querySelector('.theme-card.selected');
      const theme = themeCard ? themeCard.dataset.themeVal : 'blue-gold';

      const updated = await dbService.saveSchool(currentSchoolId, { name, logo, theme });
      applyTheme(updated.theme, updated.logo);
      syncSchoolConfig(updated);
      showToast("Branding settings saved successfully!");
    };
  } else {
    adminBox.style.display = 'none';
  }
}

// ==========================================
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

const bellTrigger = document.getElementById('notif-bell-trigger');
if (bellTrigger) {
  bellTrigger.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('notif-dropdown-menu').classList.toggle('show');
  };
  document.addEventListener('click', () => {
    const dropdown = document.getElementById('notif-dropdown-menu');
    if (dropdown) dropdown.classList.remove('show');
  });
}

// ==========================================
// SESSION MANAGEMENT (MOCK BUTTONS & DROPDOWN)
// ==========================================

const loginMenuBtn = document.getElementById('btn-login-menu');
if (loginMenuBtn) {
  loginMenuBtn.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('login-menu-dropdown').classList.toggle('show');
  };

  // Stop clicks INSIDE the dropdown from bubbling up and auto-closing it
  const loginDropdown = document.getElementById('login-menu-dropdown');
  if (loginDropdown) {
    loginDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  document.addEventListener('click', () => {
    const dropdown = document.getElementById('login-menu-dropdown');
    if (dropdown) dropdown.classList.remove('show');
  });
}

const mockLoginTriggers = document.querySelectorAll('.btn-mock-login');
mockLoginTriggers.forEach(trigger => {
  trigger.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const email = trigger.dataset.email;

    const user = await dbService.getUser(email);
    if (user) {
      activeUser = user;
      try { sessionStorage.setItem('activeUser', JSON.stringify(user)); } catch(err) {}
      showToast(`Welcome back, ${user.name}!`);
      
      // Update layouts and hide login overlay
      const loginOverlay = document.getElementById('login-screen-overlay');
      if (loginOverlay) loginOverlay.style.display = 'none';

      syncSidebarProfile();
      toggleAuthUIElements(true);
      
      // Force routing and panel rendering immediately
      window.location.hash = "#/home";
      switchView("home");
    } else {
      showToast("Login failed: user not found in database.");
    }
  };
});

const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) {
  logoutBtn.onclick = () => {
    activeUser = null;
    activeChatThread = null;
    sessionStorage.removeItem('activeUser');
    showToast("Signed out successfully.");
    
    // Clear sidebar layout
    syncSidebarProfile();
    toggleAuthUIElements(false);
    
    // Show login overlay immediately upon logout
    const loginOverlay = document.getElementById('login-screen-overlay');
    if (loginOverlay) loginOverlay.style.display = 'flex';
    
    window.location.hash = "#/home"; // Redirect to homepage feed
  };
}

// ==========================================
// LAYOUT HELPERS
// ==========================================

function syncSidebarProfile() {
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('user-name');
  const position = document.getElementById('user-position');
  const profileBox = document.querySelector('.sidebar-profile');

  if (activeUser) {
    avatar.src = activeUser.avatar;
    name.innerText = activeUser.name;
    
    // Position text logic
    let posText = '';
    const rd = activeUser.roleData || {};
    if (activeUser.role === 'admin' && rd.position) posText = rd.position;
    else if (activeUser.role === 'teacher') {
      if (rd.position) posText = rd.position;
      else if (rd.dept) posText = rd.dept + ' Teacher';
    }
    else if (activeUser.role === 'learner' && rd.grade) posText = `${rd.grade}${rd.section ? ' - ' + rd.section : ''}`;
    else if (activeUser.role === 'parent' && rd.learnerName) posText = `Parent of ${rd.learnerName}`;

    if (position) {
      if (posText) {
        position.innerText = posText;
        position.style.display = 'block';
      } else {
        position.style.display = 'none';
      }
    }

    // Role-based background color for the profile card
    if (profileBox) {
      // Reset all borders to avoid compounding if roles switch
      profileBox.style.border = 'none';
      profileBox.style.borderLeft = '4px solid transparent';
      
      if (activeUser.role === 'admin') {
        profileBox.style.background = 'linear-gradient(90deg, rgba(24, 119, 242, 0.35) 0%, rgba(24, 119, 242, 0.05) 100%)';
        profileBox.style.borderLeft = '4px solid #1877f2';
      } else if (activeUser.role === 'teacher') {
        profileBox.style.background = 'linear-gradient(90deg, rgba(45, 158, 107, 0.35) 0%, rgba(45, 158, 107, 0.05) 100%)';
        profileBox.style.borderLeft = '4px solid #2d9e6b';
      } else if (activeUser.role === 'learner') {
        profileBox.style.background = 'linear-gradient(90deg, rgba(245, 158, 11, 0.35) 0%, rgba(245, 158, 11, 0.05) 100%)';
        profileBox.style.borderLeft = '4px solid #f59e0b';
      } else if (activeUser.role === 'parent') {
        profileBox.style.background = 'linear-gradient(90deg, rgba(124, 58, 237, 0.35) 0%, rgba(124, 58, 237, 0.05) 100%)';
        profileBox.style.borderLeft = '4px solid #7c3aed';
      }
    }

  } else {
    avatar.src = "https://api.dicebear.com/7.x/micah/svg?seed=guest";
    name.innerText = "Guest User";
    if (position) position.style.display = 'none';
    if (profileBox) {
      profileBox.style.background = 'rgba(255, 255, 255, 0.03)';
      profileBox.style.border = 'none';
      profileBox.style.borderLeft = '4px solid transparent';
    }
  }
}

function toggleAuthUIElements(isLoggedIn) {
  // Show / Hide auth-only menu links
  document.querySelectorAll('.menu-item.auth-only').forEach(item => {
    item.style.display = isLoggedIn ? 'block' : 'none';
  });

  // Toggle logout dropdown
  const guestBox = document.getElementById('guest-login-box');
  if (guestBox) guestBox.style.display = isLoggedIn ? 'none' : 'block';
  
  const logoutBox = document.getElementById('auth-logout-box');
  if (logoutBox) logoutBox.style.display = isLoggedIn ? 'block' : 'none';

  // Toggle create-post box on newsfeed (Admin/Teacher only)
  const canPost = isLoggedIn && activeUser && (activeUser.role === 'admin' || activeUser.role === 'teacher');
  document.getElementById('fb-create-post-box').style.display = canPost ? 'block' : 'none';
  
  if (canPost && activeUser) {
    document.getElementById('post-box-avatar').src = activeUser.avatar;
  }
}

async function syncSchoolConfig(school) {
  document.getElementById('school-sidebar-name').innerText = school.name;
  document.getElementById('school-portal-name').innerText = school.name;
  document.getElementById('school-logo-img').src = school.logo;
}

// Announcements Creation Modal (Teacher Dashboard)
const openAnnModalBtn = document.getElementById('btn-open-announcement-modal');
if (openAnnModalBtn) {
  openAnnModalBtn.onclick = () => {
    document.getElementById('announcement-modal').style.display = 'flex';
  };
}

const closeAnnModalBtn = document.getElementById('btn-close-ann-modal');
if (closeAnnModalBtn) {
  closeAnnModalBtn.onclick = () => {
    document.getElementById('announcement-modal').style.display = 'none';
    // Reset photo state
    document.getElementById('ann-photo-preview-wrap').style.display = 'none';
    document.getElementById('ann-photo-preview').src = '';
    document.getElementById('ann-photo-input').value = '';
  };
}

// Announcement photo attach wiring
const btnViewCalendar = document.getElementById('btn-view-calendar');
if (btnViewCalendar) {
  btnViewCalendar.onclick = () => {
    showToast("Full Interactive Calendar feature coming in Phase 3!");
  };
}
const annPhotoBtn = document.getElementById('btn-attach-ann-photo');
const annPhotoInput = document.getElementById('ann-photo-input');
const annRemovePhotoBtn = document.getElementById('btn-remove-ann-photo');

if (annPhotoBtn && annPhotoInput) {
  annPhotoBtn.onclick = () => annPhotoInput.click();
  annPhotoInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      compressImage(ev.target.result, 800, (compressedData) => {
        document.getElementById('ann-photo-preview').src = compressedData;
        document.getElementById('ann-photo-preview-wrap').style.display = 'block';
      });
    };
    reader.readAsDataURL(file);
  };
}

if (annRemovePhotoBtn) {
  annRemovePhotoBtn.onclick = () => {
    document.getElementById('ann-photo-preview').src = '';
    document.getElementById('ann-photo-preview-wrap').style.display = 'none';
    document.getElementById('ann-photo-input').value = '';
  };
}

const annForm = document.getElementById('announcement-form');
if (annForm) {
  annForm.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('ann-title').value.trim();
    const content = document.getElementById('ann-content').value.trim();
    const previewImg = document.getElementById('ann-photo-preview');
    const imageData = (previewImg && previewImg.src && !previewImg.src.endsWith('undefined')) ? previewImg.src : null;

    if (!title) { showToast('Please enter a title.'); return; }

    await dbService.addAnnouncement(title, content, imageData);

    // Reset form
    document.getElementById('ann-title').value = '';
    document.getElementById('ann-content').value = '';
    document.getElementById('ann-photo-preview-wrap').style.display = 'none';
    document.getElementById('ann-photo-preview').src = '';
    document.getElementById('ann-photo-input').value = '';
    document.getElementById('announcement-modal').style.display = 'none';
    
    showToast(activeUser.role === 'admin' ? "Announcement posted!" : "Submitted for review.");
    renderNewsfeed();
    if (activeUser.role === 'admin') renderRolePortal();
  };
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
