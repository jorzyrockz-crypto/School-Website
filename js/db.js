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
  addAnnouncement: async (content, type, imageData, audiences, extraData, status) => {
    const local = getLocalDB();
    const newAnn = {
      id: "ann_" + Date.now(),
      schoolId: currentSchoolId,
      content,
      type: type || 'standard',
      imageData: imageData || null,
      audiences: audiences || ['all'],
      extraData: extraData || {},
      author: activeUser.name,
      authorRole: activeUser.role,
      authorAvatar: activeUser.avatar,
      date: new Date().toISOString().split('T')[0],
      status: status || 'pending',
      likes: [],
      reactions: {}, // { uid: 'love', uid2: 'celebrate' }
      isPinned: false
    };
    local.announcements.unshift(newAnn);
    
    if (status === 'pending') {
      local.notifications.unshift({
        id: "notif_" + Date.now(),
        schoolId: currentSchoolId,
        recipientId: "admin1",
        senderName: activeUser.name,
        messageText: `submitted a post for approval.`,
        read: false,
        timestamp: Date.now()
      });
    }
    saveLocalDB(local);
    return newAnn;
  },
  togglePinAnnouncement: async (postId) => {
    const local = getLocalDB();
    const post = local.announcements.find(a => a.id === postId);
    if (post) {
      post.isPinned = !post.isPinned;
      saveLocalDB(local);
    }
  },
  votePoll: async (postId, optionIndex, uid) => {
    const local = getLocalDB();
    const post = local.announcements.find(a => a.id === postId);
    if (!post || post.type !== 'poll') return;
    
    if (post.extraData.votedUsers[uid] !== undefined) {
      // Remove old vote
      post.extraData.votes[post.extraData.votedUsers[uid]]--;
    }
    post.extraData.votes[optionIndex]++;
    post.extraData.votedUsers[uid] = optionIndex;
    saveLocalDB(local);
  },
  rsvpEvent: async (postId, uid) => {
    const local = getLocalDB();
    const post = local.announcements.find(a => a.id === postId);
    if (!post || post.type !== 'event') return;
    
    if (!post.extraData.rsvps) post.extraData.rsvps = [];
    if (!post.extraData.rsvps.includes(uid)) {
      post.extraData.rsvps.push(uid);
    } else {
      post.extraData.rsvps = post.extraData.rsvps.filter(id => id !== uid);
    }
    saveLocalDB(local);
  },
  addReaction: async (postId, uid, reactionType) => {
    const local = getLocalDB();
    const post = local.announcements.find(a => a.id === postId);
    if (!post) return;
    if (!post.reactions) post.reactions = {};
    if (post.reactions[uid] === reactionType) {
      delete post.reactions[uid]; // Toggle off
    } else {
      post.reactions[uid] = reactionType;
    }
    saveLocalDB(local);
  },
  deleteAnnouncement: async (postId) => {
    const local = getLocalDB();
    local.announcements = local.announcements.filter(a => a.id !== postId);
    saveLocalDB(local);
  },
  flagAnnouncement: async (postId) => {
    const local = getLocalDB();
    const post = local.announcements.find(a => a.id === postId);
    if (post) post.status = 'flagged';
    saveLocalDB(local);
  },
  updateAnnouncementText: async (postId, newText) => {
    const local = getLocalDB();
    const post = local.announcements.find(a => a.id === postId);
    if (post) post.content = newText;
    saveLocalDB(local);
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

