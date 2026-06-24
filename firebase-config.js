// Firebase Configuration & Local Mock Fallback Layer
// This file connects to your Firebase project, but falls back to localStorage automatically if credentials are empty or if running offline.

export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Auto-detect if we should use Firebase or Local Fallback
export const useFirebase = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

// Local DB State structure for mock fallback
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
    "admin1": { uid: "admin1", email: "admin@school.edu", name: "Maria Santos (Admin)", role: "admin", schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=admin" },
    "teacher1": { uid: "teacher1", email: "teacher@school.edu", name: "Teacher Jose (Math)", role: "teacher", schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=teacher" },
    "parent1": { uid: "parent1", email: "parent@school.edu", name: "Mrs. Cruz (Parent)", role: "parent", schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=parent" },
    "learner1": { uid: "learner1", email: "learner@school.edu", name: "Juan Cruz (Grade 10)", role: "learner", schoolId: "default-school", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=learner" }
  },
  announcements: [
    {
      id: "ann1",
      schoolId: "default-school",
      title: "Enrollment for Academic Year 2026-2027 Open",
      content: "We are pleased to announce that enrollment for both Junior and Senior High School is now officially open. Please submit requirements to the registrar's office.",
      author: "Maria Santos",
      date: "2026-06-24",
      status: "approved"
    },
    {
      id: "ann2",
      schoolId: "default-school",
      title: "Upcoming Brigada Eskwela Activities",
      content: "Join us this coming Monday for our annual school maintenance and cleanup drive. Let's work together to prepare classrooms for our learners.",
      author: "Teacher Jose",
      date: "2026-06-23",
      status: "pending"
    }
  ],
  comments: [
    { id: "c1", announcementId: "ann1", author: "Guest Parent", text: "Are the enrollment forms downloadable online?", timestamp: Date.now() }
  ],
  attendance: {}, // format: { "default-school": { "learner1": { "2026-06-24": "present" } } }
  chats: {}, // format: { "chatId": [ { senderId: "teacher1", text: "Hello, just checking in", timestamp: 1782292020000 } ] }
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

// Initialize LocalStorage DB if empty
if (!localStorage.getItem("deped_saas_db")) {
  localStorage.setItem("deped_saas_db", JSON.stringify(DEFAULT_LOCAL_DB));
}

export function getLocalDB() {
  return JSON.parse(localStorage.getItem("deped_saas_db"));
}

export function saveLocalDB(data) {
  localStorage.setItem("deped_saas_db", JSON.stringify(data));
}
