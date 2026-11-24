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
        { id: "td1", title: "Citizen's Charter Comprehensive Handbook", category: "charter", format: "PDF", size: "3.8 MB", date: "June 2026", desc: "Official guidelines, registration protocols, learner rights, and service delivery standards.", url: "#" },
        { id: "td2", title: "School Report Card (SRC) FY 2025-2026", category: "performance", format: "PDF", size: "5.2 MB", date: "May 2026", desc: "Annual institutional report card covering academic benchmarks, graduation rates, and learner progress.", url: "#" },
        { id: "td3", title: "Annual Procurement Plan & Bids (APP 2026)", category: "procurement", format: "XLSX", size: "1.4 MB", date: "April 2026", desc: "Itemized capital expenditures, IT infrastructure bidding items, and textbook allocations.", url: "#" },
        { id: "td4", title: "MOOE Liquidation & Cash Disbursement (Q1-Q2)", category: "financial", format: "PDF", size: "2.6 MB", date: "June 2026", desc: "Quarterly accounting of Maintenance and Other Operating Expenses with 100% liquidation compliance.", url: "#" },
        { id: "td5", title: "Quality Management System Level III Accreditation", category: "performance", format: "PDF", size: "1.1 MB", date: "January 2026", desc: "Certificate of institutional excellence and academic standard compliance.", url: "#" },
        { id: "td6", title: "Learner Nutrition & School Feeding Financial Audit", category: "financial", format: "PDF", size: "2.1 MB", date: "June 2026", desc: "Financial accountability audit of school nutritional feeding programs and community donations.", url: "#" },
        { id: "td7", title: "Learner Safety, Anti-Bullying & Child Protection Policy", category: "charter", format: "PDF", size: "1.9 MB", date: "March 2026", desc: "Institutional policies protecting student welfare, mental health, and physical safety on campus.", url: "#" }
      ]
    }
  },
  feedSources: [
    { id: "fs5", url: "https://www.teacherph.com/feed/", type: "Educational Resources", tag: "library", color: "#8b5cf6" }
  ],
  users: {
    "admin1":   { uid: "admin1",   email: "admin@school.edu",   name: "Maria Santos (Admin)",    role: "admin",   schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos&backgroundColor=bbf7d0&hair=dougFunny", bio: "Leading the school administration to foster a community of excellence.", coverPhoto: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", contactInfo: "maria.santos@school.edu", connections: [] },
    "teacher1": { uid: "teacher1", email: "teacher@school.edu", name: "Teacher Jose (Math)",    role: "teacher", schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose&backgroundColor=bfdbfe&hair=mrT", bio: "Passionate mathematics teacher helping students discover the joy of numbers.", coverPhoto: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80", contactInfo: "jose.math@school.edu", connections: [] },
    "parent1":  { uid: "parent1",  email: "parent@school.edu",  name: "Mrs. Cruz (Parent)",     role: "parent",  schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=MrsCruz&backgroundColor=fed7aa&hair=full", bio: "Proud parent of Juan Cruz. PTA Committee Member.", coverPhoto: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80", contactInfo: "mrs.cruz@email.com", connections: [] },
    "learner1": { uid: "learner1", email: "learner@school.edu", name: "Juan Cruz (Grade 10)",   role: "learner", schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=JuanCruz&backgroundColor=bbf7d0&hair=fonze", bio: "Grade 10 student. Member of the Science Club.", coverPhoto: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80", contactInfo: "juan.cruz@student.school.edu", connections: [] }
  },
  announcements: [
    {
      id: "ann1",
      schoolId: "default-school",
      title: "AY 2026-2027 Enrollment Open",
      content: "We are pleased to announce that enrollment for both Junior and Senior High School is now officially open. Please submit requirements to the registrar's office.",
      author: "Maria Santos",
      authorUid: "admin1",
      authorRole: "admin",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos&backgroundColor=bbf7d0&hair=dougFunny",
      date: "2026-06-24",
      status: "approved",
      isPinned: true,
      likes: ["learner1", "parent1"]
    },
    {
      id: "ann2",
      schoolId: "default-school",
      title: "Class Suspensions Due to Inclement Weather",
      content: "In compliance with local school directives, classes in all levels are suspended today due to heavy rains. Please stay safe and monitor our channels for further updates.",
      author: "Teacher Jose",
      authorUid: "teacher1",
      authorRole: "teacher",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose&backgroundColor=bfdbfe&hair=mrT",
      date: "2026-06-22",
      status: "approved",
      likes: ["parent1"]
    },
    {
      id: "ann3",
      schoolId: "default-school",
      title: "Upcoming Brigada Eskwela Activities",
      content: "Join us this coming Monday for our annual school maintenance and cleanup drive. Let's work together to prepare classrooms for our learners.",
      author: "Teacher Jose",
      authorUid: "teacher1",
      authorRole: "teacher",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose&backgroundColor=bfdbfe&hair=mrT",
      date: "2026-06-23",
      status: "pending",
      likes: []
    },
    {
      id: "ann4",
      schoolId: "default-school",
      title: "Learner of the Month",
      content: "Congratulations to Juan Cruz for demonstrating outstanding academic excellence and leadership in the Grade 10 Science class!",
      author: "System Auto-Update",
      authorUid: "system",
      authorRole: "bot",
      authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ApexSystem&backgroundColor=bfdbfe",
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
      authorUid: "admin1",
      authorRole: "admin",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos&backgroundColor=bbf7d0&hair=dougFunny",
      date: "2026-07-05",
      status: "approved",
      likes: [],
      type: "event",
      extraData: {
        date: "July 10, 2026",
        time: "08:00 AM",
        location: "School Gymnasium",
        rsvps: []
      }
    },
    {
      id: "ann6",
      schoolId: "default-school",
      title: "Intramurals Theme Selection",
      content: "Learners, please vote for this year's Intramurals theme!",
      author: "Teacher Jose",
      authorUid: "teacher1",
      authorRole: "teacher",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose&backgroundColor=bfdbfe&hair=mrT",
      date: "2026-06-26",
      status: "approved",
      likes: ["learner1"],
      type: "poll",
      extraData: {
        options: ["Futuristic / Sci-Fi", "Mythology & Legends", "Philippine Festivals"],
        votes: [120, 85, 210],
        votedUsers: {}
      }
    },
    {
      id: "ann7",
      schoolId: "default-school",
      title: "Mid-Year STEM & Robotics Showcase",
      content: "Join us this Friday at the Main Auditorium as our Junior & Senior High learners demonstrate innovative engineering and coding projects.",
      author: "Teacher Jose",
      authorUid: "teacher1",
      authorRole: "teacher",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose&backgroundColor=bfdbfe&hair=mrT",
      date: "2026-11-24",
      status: "approved",
      likes: ["learner1", "admin1"],
      type: "event",
      extraData: {
        date: "2026-11-28",
        time: "09:00 AM",
        location: "Main Auditorium",
        rsvps: ["learner1"]
      }
    },
    {
      id: "ann8",
      schoolId: "default-school",
      title: "Parent-Teacher Evaluation & Report Cards",
      content: "Distribution of Second Quarter academic evaluations and individual student growth consultations with subject teachers.",
      author: "Maria Santos",
      authorUid: "admin1",
      authorRole: "admin",
      authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos&backgroundColor=bbf7d0&hair=dougFunny",
      date: "2026-11-23",
      status: "approved",
      likes: ["parent1"],
      type: "event",
      extraData: {
        date: "2026-12-05",
        time: "08:30 AM",
        location: "School Gymnasium & Classrooms",
        rsvps: ["parent1"]
      }
    }
  ],
  comments: [
    { id: "c1", announcementId: "ann1", author: "Mrs. Cruz (Parent)", authorUid: "parent1", authorAvatar: "https://api.dicebear.com/7.x/micah/svg?seed=MrsCruz&backgroundColor=fed7aa&hair=full", text: "Are the enrollment forms downloadable online?", timestamp: Date.now() }
  ],
  attendance: {}, // format: { "default-school": { "learner1": { "2026-06-24": "present" } } }
  groups: [
    {
      id: "group_faculty",
      name: "Faculty & Staff Lounge",
      category: "channel",
      participants: ["admin1", "teacher1"]
    },
    {
      id: "group_grade10_advisory",
      name: "Grade 10 Advisory & Parents",
      category: "channel",
      participants: ["admin1", "teacher1", "parent1"]
    },
    {
      id: "group_stem_robotics",
      name: "STEM & Science Club",
      category: "channel",
      participants: ["teacher1", "learner1", "admin1"]
    }
  ],
  chats: {
    "admin1_teacher1": [
      { senderId: "teacher1", text: "Good day Dr. Santos! Submitting the Grade 10 Math syllabus for the upcoming quarter.", timestamp: Date.now() - 7200000 },
      { senderId: "admin1", text: "Received, Teacher Jose. The competencies are well-aligned. Approved for implementation.", timestamp: Date.now() - 3600000, reactions: { "👍": ["teacher1"] } },
      { senderId: "teacher1", text: "Thank you Dr. Santos! I will distribute the modules to the learners tomorrow.", timestamp: Date.now() - 1800000 }
    ],
    "admin1_parent1": [
      { senderId: "parent1", text: "Good morning Ma'am Maria, confirming if the PTA General Assembly on July 10 will have a virtual link?", timestamp: Date.now() - 14400000 },
      { senderId: "admin1", text: "Good morning Mrs. Cruz! Yes, we will provide a livestream link via the portal announcements.", timestamp: Date.now() - 10800000, reactions: { "❤️": ["parent1"] } }
    ],
    "learner1_teacher1": [
      { senderId: "learner1", text: "Hello sir! Clarifying the deadline for our trigonometry assignment.", timestamp: Date.now() - 86400000 },
      { senderId: "teacher1", text: "Hi Juan! The deadline is extended until Friday 5:00 PM. Let me know if you need tutoring assistance.", timestamp: Date.now() - 82800000, reactions: { "👏": ["learner1"] } }
    ],
    "group_faculty": [
      { senderId: "admin1", text: "Good morning faculty! Please submit your Q2 grading sheets by Friday 4:00 PM.", timestamp: Date.now() - 172800000 },
      { senderId: "teacher1", text: "Noted Dr. Santos! Math 10 grades are almost finalized. We had a 94% passing rate in algebra.", timestamp: Date.now() - 86400000, reactions: { "👏": ["admin1"] } },
      { senderId: "admin1", text: "Outstanding achievement, Teacher Jose! Keep up the great mentorship.", timestamp: Date.now() - 3600000, reactions: { "❤️": ["teacher1"] } }
    ],
    "group_grade10_advisory": [
      { senderId: "teacher1", text: "Reminder to all Grade 10 parents: The midterm PTA meeting is scheduled this coming Saturday at 9:00 AM.", timestamp: Date.now() - 100000000 },
      { senderId: "parent1", text: "Thank you Teacher Jose! Mrs. Cruz will be attending in person. Will progress report cards be distributed?", timestamp: Date.now() - 50000000, reactions: { "👍": ["teacher1"] } },
      { senderId: "teacher1", text: "Yes Mrs. Cruz, hard copies will be distributed and digital copies will also be synced to your Parent Advisory Portal.", timestamp: Date.now() - 7200000 }
    ],
    "group_stem_robotics": [
      { senderId: "learner1", text: "Good afternoon Sir Jose! Our robotics prototype passed the sensor calibration test!", timestamp: Date.now() - 25000000, reactions: { "🎉": ["teacher1", "admin1"] } },
      { senderId: "teacher1", text: "Fantastic news Juan! Be sure to document your circuit schematic in your project journal.", timestamp: Date.now() - 15000000, reactions: { "💡": ["learner1"] } }
    ]
  }, 
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

// In-Memory Database Cache for 60fps performance and zero redundant JSON parsing
let cachedLocalDB = null;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'deped_saas_db') {
      cachedLocalDB = null;
    }
  });
}

function getLocalDB() {
  if (cachedLocalDB && typeof cachedLocalDB === 'object') {
    return cachedLocalDB;
  }
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
        if (!parsed.chats || Object.keys(parsed.chats).length === 0) {
          parsed.chats = DEFAULT_LOCAL_DB.chats;
          updated = true;
        } else {
          // Merge missing default chats such as school channels
          for (const key of Object.keys(DEFAULT_LOCAL_DB.chats)) {
            if (!parsed.chats[key]) {
              parsed.chats[key] = DEFAULT_LOCAL_DB.chats[key];
              updated = true;
            }
          }
        }
        if (!parsed.groups || parsed.groups.length === 0) {
          parsed.groups = DEFAULT_LOCAL_DB.groups;
          updated = true;
        }
        if (parsed.announcements) {
          parsed.announcements.forEach(a => {
            if (a.authorAvatar && a.authorAvatar.includes('/bot/svg')) {
              a.authorAvatar = a.authorAvatar.replace('/bot/svg', '/bottts/svg');
              updated = true;
            }
          });
          const existingIds = new Set(parsed.announcements.map(a => a.id));
          DEFAULT_LOCAL_DB.announcements.forEach(defA => {
            if (!existingIds.has(defA.id)) {
              parsed.announcements.push(defA);
              updated = true;
            }
          });
          if (!parsed.announcements.some(a => a.isPinned)) {
            const firstAnn = parsed.announcements.find(a => a.id === 'ann1') || parsed.announcements[0];
            if (firstAnn) {
              firstAnn.isPinned = true;
              updated = true;
            }
          }
        }
        if (parsed.schools && parsed.schools["default-school"]) {
          const docs = parsed.schools["default-school"].transparencyDocs || [];
          if (docs.length < 5 || !docs[0].category) {
            parsed.schools["default-school"].transparencyDocs = DEFAULT_LOCAL_DB.schools["default-school"].transparencyDocs;
            updated = true;
          }
        }
        // Auto-upgrade legacy flat avatars to unified 3D clay avatars
        const clayUserMapping = {
          "admin1": "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos&backgroundColor=bbf7d0&hair=dougFunny",
          "teacher1": "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose&backgroundColor=bfdbfe&hair=mrT",
          "parent1": "https://api.dicebear.com/7.x/micah/svg?seed=MrsCruz&backgroundColor=fed7aa&hair=full",
          "learner1": "https://api.dicebear.com/7.x/micah/svg?seed=JuanCruz&backgroundColor=bbf7d0&hair=fonze"
        };
        if (parsed.users) {
          for (const uid of Object.keys(parsed.users)) {
            const u = parsed.users[uid];
            if (clayUserMapping[uid] && (!u.avatar || !u.avatar.includes("backgroundColor="))) {
              u.avatar = clayUserMapping[uid];
              updated = true;
            } else if (u.avatar && !u.avatar.includes("backgroundColor=")) {
              const bg = uid.includes("teacher") ? "bfdbfe" : (uid.includes("parent") ? "fed7aa" : "bbf7d0");
              u.avatar = u.avatar + `&backgroundColor=${bg}`;
              updated = true;
            }
          }
        }
        if (parsed.announcements) {
          parsed.announcements.forEach(a => {
            if (a.authorUid === 'admin1' && (!a.authorAvatar || !a.authorAvatar.includes("backgroundColor="))) {
              a.authorAvatar = "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos&backgroundColor=bbf7d0&hair=dougFunny";
              updated = true;
            } else if (a.authorUid === 'teacher1' && (!a.authorAvatar || !a.authorAvatar.includes("backgroundColor="))) {
              a.authorAvatar = "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose&backgroundColor=bfdbfe&hair=mrT";
              updated = true;
            } else if (a.authorUid === 'system' && (!a.authorAvatar || !a.authorAvatar.includes("backgroundColor="))) {
              a.authorAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=ApexSystem&backgroundColor=bfdbfe";
              updated = true;
            } else if (a.authorAvatar && !a.authorAvatar.includes("backgroundColor=")) {
              a.authorAvatar = a.authorAvatar + `&backgroundColor=bbf7d0`;
              updated = true;
            }
          });
        }
        if (parsed.comments) {
          parsed.comments.forEach(c => {
            if (c.authorUid && clayUserMapping[c.authorUid] && (!c.authorAvatar || !c.authorAvatar.includes("backgroundColor="))) {
              c.authorAvatar = clayUserMapping[c.authorUid];
              updated = true;
            } else if (c.authorAvatar && !c.authorAvatar.includes("backgroundColor=")) {
              c.authorAvatar = c.authorAvatar + `&backgroundColor=fed7aa`;
              updated = true;
            }
          });
        }
        if (updated) {
          localStorage.setItem("deped_saas_db", JSON.stringify(parsed));
        }
        cachedLocalDB = parsed;
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
  cachedLocalDB = DEFAULT_LOCAL_DB;
  return DEFAULT_LOCAL_DB;
}

function saveLocalDB(data) {
  cachedLocalDB = data;
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
  if (activeUser && (!activeUser.avatar || !activeUser.avatar.includes("backgroundColor="))) {
    const clayUserMapping = {
      "admin1": "https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos&backgroundColor=bbf7d0&hair=dougFunny",
      "teacher1": "https://api.dicebear.com/7.x/micah/svg?seed=TeacherJose&backgroundColor=bfdbfe&hair=mrT",
      "parent1": "https://api.dicebear.com/7.x/micah/svg?seed=MrsCruz&backgroundColor=fed7aa&hair=full",
      "learner1": "https://api.dicebear.com/7.x/micah/svg?seed=JuanCruz&backgroundColor=bbf7d0&hair=fonze"
    };
    if (clayUserMapping[activeUser.uid]) {
      activeUser.avatar = clayUserMapping[activeUser.uid];
      try { sessionStorage.setItem('activeUser', JSON.stringify(activeUser)); } catch(e) {}
    }
  }
} catch(e) {
  console.error("Session storage blocked or unavailable", e);
}
let currentSchoolId = "default-school";

// ==========================================
// DATA ACCESS LAYER
// ==========================================

const dbService = {
  getLocalDB: () => getLocalDB(),
  saveLocalDB: (local) => saveLocalDB(local),
  getUsers: async () => {
    const local = getLocalDB();
    return Object.values(local.users || {});
  },
  getFeedSources: async () => {
    const local = getLocalDB();
    if (!local.feedSources) local.feedSources = [];
    
    // Cleanup script to remove deprecated or failing feeds from local storage
    const originalLength = local.feedSources.length;
    local.feedSources = local.feedSources.filter(s => s.id !== "fs1" && s.id !== "fs2" && s.id !== "fs3" && s.id !== "fs4");
    
    // Auto-inject TeacherPH if missing
    if (!local.feedSources.find(s => s.id === "fs5")) {
      local.feedSources.push({ id: "fs5", url: "https://www.teacherph.com/feed/", type: "Educational Resources", tag: "library", color: "#8b5cf6" });
    }
    
    if (local.feedSources.length !== originalLength || !local.feedSources.find(s => s.id === "fs5" && originalLength > 0)) {
      saveLocalDB(local);
    }
    return local.feedSources;
  },
  saveFeedSources: async (sources) => {
    const local = getLocalDB();
    local.feedSources = sources;
    saveLocalDB(local);
    return local.feedSources;
  },
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
  toggleConnection: async (followerUid, targetUid) => {
    const local = getLocalDB();
    const follower = local.users[followerUid];
    const target = local.users[targetUid];
    if (!follower || !target) return false;
    
    if (!follower.connections) follower.connections = [];
    if (!target.connections) target.connections = [];
    
    const followerHasTarget = follower.connections.includes(targetUid);
    
    if (followerHasTarget) {
      follower.connections = follower.connections.filter(id => id !== targetUid);
      target.connections = target.connections.filter(id => id !== followerUid);
    } else {
      follower.connections.push(targetUid);
      target.connections.push(followerUid);
    }
    
    saveLocalDB(local);
    return !followerHasTarget; // returns true if connected, false if disconnected
  },
  getAnnouncements: async () => {
    const local = getLocalDB();
    
    // Auto-inject live GitHub updates into permanent local database
    try {
      const ghFetched = sessionStorage.getItem('ghFetched');
      if (!ghFetched) {
        const res = await fetch('https://api.github.com/repos/jorzyrockz-crypto/School-Website/commits?per_page=10');
        const commits = await res.json();
        
        // Find valid commits and reverse so the oldest gets added first, preserving correct order
        const validCommits = commits.filter(c => c.commit.message.match(/^(feat|fix|style|refactor|perf|chore)/i)).reverse();
        
        let newPostsAdded = false;
        
        validCommits.forEach(validCommit => {
          const ghPostId = 'gh-update-' + validCommit.sha.substring(0,7);
          
          // Check if this specific update is already saved in our database
          if (!local.announcements.some(a => a.id === ghPostId)) {
            const msgParts = validCommit.commit.message.split('\n');
            
            // Strip out developer jargon
            let cleanTitle = msgParts[0].replace(/^(feat|fix|style|refactor|perf|chore|docs)(\([^)]+\))?:\s*/i, '');
            cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

            const content = msgParts.slice(1).join('\n').trim() || "Minor platform improvements deployed automatically.";
            
            const ghPost = {
              id: ghPostId,
              schoolId: 'default-school',
              type: 'announcement',
              title: "✨ Live System Update: " + cleanTitle,
              content: content.replace(/\n/g, '<br>'),
              author: "System Auto-Update",
              authorRole: "admin",
              authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=SystemBot&backgroundColor=eff6ff",
              date: new Date(validCommit.commit.author.date).toISOString(), // Store exact timestamp
              status: "approved",
              likes: [],
              imageData: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80"
            };
            
            local.announcements.unshift(ghPost);
            newPostsAdded = true;
          }
        });
        
        if (newPostsAdded) {
          // Sort by date to ensure newest posts are always at the top
          local.announcements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          saveLocalDB(local);
        }
        
        // Mark as fetched so we don't ping GitHub again until the next session
        sessionStorage.setItem('ghFetched', 'true');
      }
    } catch(e) {
      console.log('Could not fetch GitHub updates', e);
    }

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
      authorUid: activeUser.uid,
      authorRole: activeUser.role,
      authorAvatar: activeUser.avatar,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
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
    
    if (!post.extraData) {
      post.extraData = {
        options: post.pollOptions ? post.pollOptions.map(o => o.text) : [],
        votes: post.pollOptions ? post.pollOptions.map(o => o.votes) : [],
        votedUsers: {}
      };
    }
    
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
    
    if (!post.extraData) post.extraData = {};
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
  addComment: async (annId, author, text, authorUid, authorAvatar) => {
    const local = getLocalDB();
    const newComment = {
      id: "comment_" + Date.now(),
      announcementId: annId,
      author,
      authorUid: authorUid || '',
      authorAvatar: authorAvatar || '',
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
    const users = Object.values(local.users).filter(u => u.uid !== uid).map(u => ({
      ...u,
      isGroup: false
    }));
    
    // Add groups where user is a participant with clay-style bottts / icon avatars
    const groupAvatarMap = {
      "group_faculty": "https://api.dicebear.com/7.x/bottts/svg?seed=FacultyLounge&backgroundColor=bbf7d0",
      "group_grade10_advisory": "https://api.dicebear.com/7.x/bottts/svg?seed=Grade10Advisory&backgroundColor=fed7aa",
      "group_stem_robotics": "https://api.dicebear.com/7.x/bottts/svg?seed=CyberBot&backgroundColor=bfdbfe"
    };
    const groups = (local.groups || []).filter(g => g.participants.includes(uid)).map(g => ({
      uid: g.id,
      name: g.name,
      role: g.category === 'channel' ? 'School Channel' : 'Group Chat',
      avatar: groupAvatarMap[g.id] || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(g.name) + '&backgroundColor=bfdbfe'),
      isGroup: true,
      category: g.category || 'channel',
      participants: g.participants
    }));
    
    return [...users, ...groups];
  },
  createGroupChat: async (name, participants, category = 'channel') => {
    const local = getLocalDB();
    if (!local.groups) local.groups = [];
    const groupId = 'group_' + Date.now();
    local.groups.push({
      id: groupId,
      name,
      category,
      participants,
      createdAt: Date.now()
    });
    saveLocalDB(local);
    return groupId;
  },
  getMessages: async (chatId) => {
    const local = getLocalDB();
    return local.chats[chatId] || [];
  },
  sendMessage: async (chatId, senderId, text, attachment) => {
    const local = getLocalDB();
    if (!local.chats[chatId]) {
      local.chats[chatId] = [];
    }
    
    // Legacy support for string imageData or objects
    let imageData = null;
    let fileAttachment = null;
    let voiceNote = null;
    if (typeof attachment === 'string') {
      imageData = attachment;
    } else if (attachment && typeof attachment === 'object') {
      if (attachment.isVoice) {
        voiceNote = attachment;
      } else if (attachment.type && attachment.type.startsWith('image/')) {
        imageData = attachment.data;
      } else {
        fileAttachment = attachment;
      }
    }

    const newMsg = {
      senderId,
      text: text || '',
      imageData: imageData,
      fileAttachment: fileAttachment,
      voiceNote: voiceNote,
      reactions: {},
      timestamp: Date.now()
    };
    local.chats[chatId].push(newMsg);
    
    saveLocalDB(local);
    return newMsg;
  },
  toggleReaction: async (chatId, msgIndex, emoji, userId) => {
    const local = getLocalDB();
    if (!local.chats[chatId] || !local.chats[chatId][msgIndex]) return {};
    const msg = local.chats[chatId][msgIndex];
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const userIdx = msg.reactions[emoji].indexOf(userId);
    if (userIdx >= 0) {
      msg.reactions[emoji].splice(userIdx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji].push(userId);
    }
    saveLocalDB(local);
    return msg.reactions;
  },
  clearMessages: async (chatId) => {
    const local = getLocalDB();
    local.chats[chatId] = [];
    saveLocalDB(local);
    return true;
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

window.dbService = dbService;
window.getLocalDB = getLocalDB;
window.saveLocalDB = saveLocalDB;

