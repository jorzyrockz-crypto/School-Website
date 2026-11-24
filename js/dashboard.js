// AUTH PORTAL DASHBOARDS
// ==========================================

var escapeHTMLSafe = window.escapeHTML || ((value) => String(value ?? ''));
var escapeAttrSafe = window.escapeAttr || escapeHTMLSafe;
var sanitizeUrlSafe = window.sanitizeUrl || ((value) => value || '#');

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
        <div style="font-size:0.85rem; color:var(--text-secondary);">${s.room} &bull; ${s.teacher}</div>
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
        <div style="font-size:0.85rem; color:var(--text-secondary);">${s.room} &bull; ${s.class}</div>
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
  
  // Update KPI counters
  const kpiCount = document.getElementById('kpi-pending-count');
  const kpiStatus = document.getElementById('kpi-pending-status');
  const badgeCount = document.getElementById('badge-pending-count');
  if (kpiCount) kpiCount.innerText = pendings.length;
  if (kpiStatus) kpiStatus.innerText = pendings.length > 0 ? `${pendings.length} require action` : 'All reviewed';
  if (badgeCount) {
    badgeCount.innerText = pendings.length;
    badgeCount.style.display = pendings.length > 0 ? 'inline-block' : 'none';
  }

  const pendingContainer = document.getElementById('admin-pending-announcements');
  if (pendingContainer) {
    if (pendings.length === 0) {
      pendingContainer.innerHTML = `
        <div style="text-align:center; padding:2.5rem 1rem; color:var(--text-secondary);">
          <div style="width:52px; height:52px; border-radius:50%; background:color-mix(in srgb, var(--success) 14%, transparent); color:var(--success); display:flex; align-items:center; justify-content:center; margin:0 auto 0.75rem; font-size:1.8rem;">
            <ion-icon name="checkmark-done"></ion-icon>
          </div>
          <div style="font-weight:700; font-size:0.95rem; color:var(--text-primary); margin-bottom:0.2rem;">All Caught Up!</div>
          <div style="font-size:0.8rem; opacity:0.85;">No announcement drafts currently waiting for administrative review.</div>
        </div>
      `;
    } else {
      pendingContainer.innerHTML = pendings.map(p => `
        <div class="news-card" style="margin-bottom:0.75rem; padding:1.1rem; border-radius:var(--radius-sm);">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.4rem;">
            <span style="font-size:0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase;">${p.authorRole || 'Teacher'} &bull; ${p.author}</span>
            <span style="font-size:0.72rem; color:var(--text-secondary);">${p.date}</span>
          </div>
          <h4 class="news-title" style="font-size:1.05rem; margin-bottom:0.35rem;">${escapeHTMLSafe(p.title)}</h4>
          <p style="color:var(--text-secondary); font-size:0.88rem; margin-bottom:0.85rem; line-height:1.4;">${escapeHTMLSafe(p.content)}</p>
          <div style="display:flex; gap:0.6rem;">
            <button class="btn-approve btn-action" data-id="${p.id}" style="padding:0.4rem 1.1rem; border-radius:var(--radius-pill); font-size:0.82rem; font-weight:600; background-color:var(--success); color:white; border:none; cursor:pointer;">Approve</button>
            <button class="btn-reject btn-secondary" data-id="${p.id}" style="padding:0.4rem 1.1rem; border-radius:var(--radius-pill); font-size:0.82rem; font-weight:600; border-color:var(--danger); color:var(--danger); background:transparent; cursor:pointer;">Reject</button>
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
    const students = [
      { name: "Juan Cruz", id: "learner1", grade: "Grade 10 - Rizal" },
      { name: "Maria Clara Santos", id: "learner2", grade: "Grade 10 - Rizal" },
      { name: "Andres Bonifacio", id: "learner3", grade: "Grade 10 - Rizal" },
      { name: "Sofia Delgado", id: "learner4", grade: "Grade 10 - Rizal" },
      { name: "Mateo Ramos", id: "learner5", grade: "Grade 10 - Rizal" }
    ];
    
    grid.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Learner</th>
              <th>Section</th>
              <th>Status (${dateStr})</th>
              <th style="text-align:right;">Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            ${students.map(s => {
              const status = (attendance[s.id] || {})[dateStr] || 'present';
              let badgeColor = 'var(--success)';
              let badgeBg = 'color-mix(in srgb, var(--success) 12%, transparent)';
              if (status === 'absent') {
                badgeColor = 'var(--danger)';
                badgeBg = 'color-mix(in srgb, var(--danger) 12%, transparent)';
              } else if (status === 'late') {
                badgeColor = 'var(--warning)';
                badgeBg = 'color-mix(in srgb, var(--warning) 12%, transparent)';
              } else if (status === 'unmarked') {
                badgeColor = 'var(--text-secondary)';
                badgeBg = 'color-mix(in srgb, var(--text-secondary) 12%, transparent)';
              }
              return `
                <tr>
                  <td>
                    <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">${s.name}</div>
                  </td>
                  <td>
                    <span style="font-size:0.78rem; color:var(--text-secondary);">${s.grade}</span>
                  </td>
                  <td>
                    <span style="display:inline-block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; padding:3px 8px; border-radius:12px; background:${badgeBg}; color:${badgeColor};">
                      ${status}
                    </span>
                  </td>
                  <td style="text-align:right;">
                    <div style="display:inline-flex; gap:0.3rem;">
                      <button class="btn-att-quick" data-id="${s.id}" data-val="present" style="padding:2px 8px; font-size:0.72rem; font-weight:700; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary); cursor:pointer;" title="Mark Present">P</button>
                      <button class="btn-att-quick" data-id="${s.id}" data-val="late" style="padding:2px 8px; font-size:0.72rem; font-weight:700; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary); cursor:pointer;" title="Mark Late">L</button>
                      <button class="btn-att-quick" data-id="${s.id}" data-val="absent" style="padding:2px 8px; font-size:0.72rem; font-weight:700; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary); cursor:pointer;" title="Mark Absent">A</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    grid.querySelectorAll('.btn-att-quick').forEach(b => {
      b.onclick = async (e) => {
        const id = e.currentTarget.dataset.id;
        const val = e.currentTarget.dataset.val;
        await dbService.markAttendance(id, val);
        showToast(`Attendance marked as ${val.toUpperCase()}`);
        renderAdminView();
      };
    });
  }
}

// ==========================================
// PRIVATE MESSAGES & CHAT
// ==========================================

let activeChatThread = null;
let currentMessengerThreads = [];
let currentMessengerTab = 'all';
let stagedChatAttachment = null;
let simulatedCallInterval = null;
let simulatedCallSeconds = 0;

// ==========================================
// AUDIO SYNTHESIZER (Pure Web Audio API)
// ==========================================
function playChatSound(type = 'receive') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'pop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else {
      // Receive chime (dual tone)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch(e) {
    // Ignored if sound blocked before user gesture
  }
}

// ==========================================
// MESSENGER CONTROLLER (DIRECT & CHANNELS)
// ==========================================

async function initMessagesPanel() {
  if (!activeUser) return;
  const threads = await dbService.getChatThreads(activeUser.uid);
  const threadListContainer = document.getElementById('chat-thread-list');
  const searchInput = document.getElementById('messenger-search-input');
  const clearSearchBtn = document.getElementById('btn-clear-messenger-search');
  const totalUnreadBadge = document.getElementById('messenger-total-unread-badge');
  
  // Decorate threads with last message timestamp to sort them
  const recentThreads = [];
  const readTimestamp = window.mockReadChats ? (window.mockReadChats[activeUser.uid] || 0) : 0;
  let totalUnreadCount = 0;
  
  for (const t of threads) {
    const chatId = t.isGroup ? t.uid : [activeUser.uid, t.uid].sort().join('_');
    const msgs = await dbService.getMessages(chatId);
    let lastMsg = null;
    let unreadCount = 0;
    
    if (msgs.length > 0) {
      lastMsg = msgs[msgs.length - 1];
      for (const m of msgs) {
        if (m.senderId !== activeUser.uid && m.timestamp > readTimestamp) {
          unreadCount++;
        }
      }
    }
    if (unreadCount > 0) totalUnreadCount += unreadCount;
    recentThreads.push({ ...t, lastMsg, unreadCount, unread: unreadCount > 0 });
  }

  recentThreads.sort((a, b) => (b.lastMsg?.timestamp || 0) - (a.lastMsg?.timestamp || 0));
  currentMessengerThreads = recentThreads;

  if (totalUnreadBadge) {
    if (totalUnreadCount > 0) {
      totalUnreadBadge.innerText = totalUnreadCount;
      totalUnreadBadge.style.display = 'inline-block';
    } else {
      totalUnreadBadge.style.display = 'none';
    }
  }

  // Segmented Tabs Wiring
  document.querySelectorAll('.messenger-tab').forEach(tabBtn => {
    tabBtn.onclick = (e) => {
      document.querySelectorAll('.messenger-tab').forEach(b => b.classList.remove('active'));
      const btn = e.currentTarget;
      btn.classList.add('active');
      currentMessengerTab = btn.dataset.tab || 'all';
      renderThreadItems(searchInput ? searchInput.value : '');
    };
  });

  function renderThreadItems(query = '') {
    const q = (query || '').toLowerCase().trim();
    if (clearSearchBtn) {
      clearSearchBtn.style.display = q ? 'flex' : 'none';
    }

    let displayThreads = [...currentMessengerThreads];
    
    // Filter by Tab
    if (currentMessengerTab === 'direct') {
      displayThreads = displayThreads.filter(t => !t.isGroup);
    } else if (currentMessengerTab === 'channels') {
      displayThreads = displayThreads.filter(t => t.isGroup);
    }
    
    // Filter by Search Query
    if (q) {
      displayThreads = displayThreads.filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.role && t.role.toLowerCase().includes(q)) ||
        (t.lastMsg?.text && t.lastMsg.text.toLowerCase().includes(q))
      );
    }
    
    // Check school contacts for new conversation start
    let extraContacts = [];
    if (q && currentMessengerTab !== 'channels') {
      const local = dbService.getLocalDB();
      const existingUids = new Set(currentMessengerThreads.map(t => t.uid));
      extraContacts = Object.values(local.users || {})
        .filter(u => u.uid !== activeUser.uid && !existingUids.has(u.uid))
        .filter(u => 
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q)) ||
          (u.department && u.department.toLowerCase().includes(q))
        )
        .map(u => ({
          uid: u.uid,
          name: u.name,
          avatar: u.avatar,
          role: u.role,
          isNewContact: true
        }));
    }

    if (displayThreads.length === 0 && extraContacts.length === 0) {
      threadListContainer.innerHTML = `
        <div style="padding:3rem 1rem; text-align:center; color:var(--text-secondary); font-size:0.9rem;">
          <ion-icon name="search-outline" style="font-size:2.2rem; opacity:0.4; margin-bottom:0.6rem; display:block; margin:0 auto 0.6rem;"></ion-icon>
          <div style="font-weight:600; margin-bottom:0.25rem;">No conversations found</div>
          <div style="font-size:0.8rem; opacity:0.8;">Try searching for faculty, parents, or channels</div>
        </div>
      `;
      return;
    }

    let html = '';
    
    if (displayThreads.length > 0) {
      html += displayThreads.map(t => {
        let snippet = "No messages yet";
        let timeStr = "";
        if (t.lastMsg) {
          if (t.lastMsg.voiceNote) {
            snippet = "🎙️ Voice message";
          } else if (t.lastMsg.imageData) {
            snippet = "📷 Photo";
          } else if (t.lastMsg.fileAttachment) {
            snippet = "📎 " + (t.lastMsg.fileAttachment.name || "Attachment");
          } else {
            snippet = t.lastMsg.text || "";
          }
          if (t.lastMsg.senderId === activeUser.uid) snippet = `You: ${snippet}`;
          
          const d = new Date(t.lastMsg.timestamp);
          const now = new Date();
          if (d.toDateString() === now.toDateString()) {
            timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
            timeStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
        }
        const isActive = activeChatThread && activeChatThread.uid === t.uid;
        const roleLabel = t.isGroup ? (t.category === 'channel' ? 'Channel' : 'Group') : t.role;

        return `
        <div class="thread-item ${isActive ? 'active' : ''}" data-uid="${escapeAttrSafe(t.uid)}" style="position:relative;">
          <div class="thread-avatar-wrap" style="position:relative;">
            <img class="thread-avatar" src="${sanitizeUrlSafe(t.avatar, { allowDataImage: true, allowHash: false })}" alt="avatar">
            <div class="${t.isGroup ? 'presence-dot-away' : 'presence-dot-online'}"></div>
          </div>
          <div class="thread-details">
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px;">
              <div style="display:flex; align-items:center; gap:0.35rem; max-width:80%;">
                <div class="thread-name" style="font-weight:${t.unread ? '800' : '600'}; font-size:0.9rem;">${escapeHTMLSafe(t.name)}</div>
              </div>
              <span class="thread-time">${timeStr}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="thread-snippet" style="font-weight:${t.unread ? '700' : '400'}; color:${t.unread ? 'var(--text-primary)' : 'var(--text-secondary)'}; font-size:0.8rem;">
                ${escapeHTMLSafe(snippet)}
              </div>
              ${t.unreadCount > 0 ? `<div class="thread-unread-pill">${t.unreadCount}</div>` : ''}
            </div>
          </div>
        </div>
        `;
      }).join('');
    }

    if (extraContacts.length > 0) {
      html += `
        <div style="padding:0.75rem 0.75rem 0.35rem; font-size:0.72rem; text-transform:uppercase; font-weight:800; color:var(--text-secondary); letter-spacing:0.06em;">
          School Directory
        </div>
      `;
      html += extraContacts.map(c => `
        <div class="thread-item" data-uid="${escapeAttrSafe(c.uid)}" data-is-new="true">
          <div class="thread-avatar-wrap" style="position:relative;">
            <img class="thread-avatar" src="${sanitizeUrlSafe(c.avatar, { allowDataImage: true, allowHash: false })}" alt="avatar">
            <div class="presence-dot-online"></div>
          </div>
          <div class="thread-details">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <div class="thread-name" style="font-weight:700;">${escapeHTMLSafe(c.name)}</div>
              <span style="font-size:0.7rem; color:var(--primary); font-weight:700;">+ Message</span>
            </div>
            <div class="thread-snippet" style="color:var(--text-secondary); text-transform:capitalize;">${escapeHTMLSafe(c.role)}</div>
          </div>
        </div>
      `).join('');
    }

    threadListContainer.innerHTML = html;

    // Attach click listeners to threads
    threadListContainer.querySelectorAll('.thread-item').forEach(item => {
      item.onclick = (e) => {
        const threadEl = e.currentTarget;
        threadListContainer.querySelectorAll('.thread-item').forEach(i => i.classList.remove('active'));
        threadEl.classList.add('active');
        const uid = threadEl.dataset.uid;
        let targetUser = currentMessengerThreads.find(t => t.uid === uid);
        if (!targetUser) {
          const contact = extraContacts.find(c => c.uid === uid);
          if (contact) {
            targetUser = { uid: contact.uid, name: contact.name, avatar: contact.avatar, role: contact.role, isGroup: false };
            currentMessengerThreads.unshift(targetUser);
          }
        }
        if (targetUser) {
          openChatWindow(targetUser);
        }
      };
    });
  }

  renderThreadItems(searchInput ? searchInput.value : '');

  if (searchInput) {
    searchInput.oninput = (e) => {
      renderThreadItems(e.target.value);
    };
  }

  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      if (searchInput) {
        searchInput.value = '';
        renderThreadItems('');
        searchInput.focus();
      }
    };
  }

  if (activeChatThread) {
    const activeEl = threadListContainer.querySelector(`[data-uid="${activeChatThread.uid}"]`);
    if (activeEl) activeEl.click();
  } else if (recentThreads.length > 0 && window.innerWidth >= 992) {
    const firstEl = threadListContainer.querySelector('.thread-item');
    if (firstEl) firstEl.click();
  }
}

// ==========================================
// ACTIVE CHAT WINDOW & MESSAGES STREAM
// ==========================================

async function openChatWindow(targetUser, forceNoIndicator = false) {
  activeChatThread = targetUser;
  
  // Update Header
  const headerAvatar = document.getElementById('chat-header-avatar');
  const headerName = document.getElementById('chat-header-name');
  const headerRole = document.getElementById('chat-header-role');
  const headerBadge = document.getElementById('chat-header-badge');
  const activeDot = document.getElementById('chat-header-active-dot');
  
  if (headerAvatar) headerAvatar.src = targetUser.avatar;
  if (headerName) headerName.innerText = targetUser.name;
  
  if (headerBadge) {
    headerBadge.innerText = targetUser.isGroup ? 'CHANNEL' : targetUser.role.toUpperCase();
    headerBadge.style.display = 'inline-block';
  }
  
  if (headerRole) {
    if (targetUser.isGroup) {
      const memberCount = targetUser.participants ? targetUser.participants.length : 3;
      headerRole.innerText = `${memberCount} school members participating`;
    } else {
      headerRole.innerText = "Active now • Apex Integrated School";
    }
  }
  
  if (activeDot) activeDot.style.display = 'block';

  // Clear unread state
  window.mockReadChats = window.mockReadChats || {};
  window.mockReadChats[activeUser.uid] = Date.now();
  if (typeof updateMessengerDropdownList === 'function') updateMessengerDropdownList();

  const chatId = targetUser.isGroup ? targetUser.uid : [activeUser.uid, targetUser.uid].sort().join('_');
  const messages = await dbService.getMessages(chatId);
  const body = document.getElementById('chat-messages-body');
  if (!body) return;

  const renderMessages = () => {
    let mediaItems = [];
    let docItems = [];
    let html = '';
    let lastDateStr = '';

    messages.forEach((m, idx) => {
      const msgDate = new Date(m.timestamp);
      const dateStr = msgDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      
      // Date Separator Pill
      if (dateStr !== lastDateStr) {
        lastDateStr = dateStr;
        const isToday = new Date().toDateString() === msgDate.toDateString();
        const displayDate = isToday ? 'Today' : dateStr;
        html += `
          <div class="chat-date-separator">
            <span class="chat-date-pill">${displayDate}</span>
          </div>
        `;
      }

      const isOut = m.senderId === activeUser.uid;
      const rowCls = isOut ? 'sent' : 'received';
      let content = '';

      // 1. Voice Note Bubble
      if (m.voiceNote) {
        content += `
          <div class="chat-voice-note">
            <button type="button" class="voice-play-btn" onclick="playVoiceWaveform(this)" title="Play audio">
              <ion-icon name="play"></ion-icon>
            </button>
            <div class="voice-waveform-bars">
              ${(m.voiceNote.waveData || [8, 16, 22, 14, 20, 10, 18, 12, 16, 24, 10, 14]).map(h => `<div class="voice-wave-bar" style="height:${h}px;"></div>`).join('')}
            </div>
            <span class="voice-duration">${m.voiceNote.duration || '0:14'}</span>
          </div>
        `;
      }
      // 2. Document Attachment
      else if (m.fileAttachment) {
        docItems.push(m.fileAttachment);
        content += `
          <div class="chat-file-attachment">
            <ion-icon name="document-text" class="file-icon"></ion-icon>
            <div class="file-name" title="${escapeAttrSafe(m.fileAttachment.name || 'Attachment')}">${escapeHTMLSafe(m.fileAttachment.name || 'Attachment')}</div>
            <a href="${sanitizeUrlSafe(m.fileAttachment.data, { allowDataFile: true, allowHash: false })}" download="${escapeAttrSafe(m.fileAttachment.name || 'attachment')}" class="file-download" title="Download document">
              <ion-icon name="download-outline"></ion-icon>
            </a>
          </div>
        `;
      }
      // 3. Photo Card
      else if (m.imageData) {
        mediaItems.push(m.imageData);
        const encodedImage = encodeURIComponent(m.imageData);
        content += `
          <div style="position:relative; display:inline-block; margin-bottom:${m.text ? '0.4rem' : '0'}; cursor:zoom-in; max-width:100%; border-radius:12px; overflow:hidden;" onclick="if(typeof openPhotoTheater === 'function') openPhotoTheater(decodeURIComponent('${encodedImage}'), 'chat_${m.timestamp}')">
            <img src="${sanitizeUrlSafe(m.imageData, { allowDataImage: true, allowHash: false })}" alt="Image" style="max-width:100%; width:230px; max-height:220px; object-fit:cover; display:block;">
            <a href="${sanitizeUrlSafe(m.imageData, { allowDataImage: true, allowHash: false })}" download="photo_${m.timestamp}.jpg" title="Download Image" style="position:absolute; bottom:6px; right:6px; background:rgba(0,0,0,0.65); color:white; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; text-decoration:none;" onclick="event.stopPropagation();">
              <ion-icon name="download-outline" style="font-size:0.95rem;"></ion-icon>
            </a>
          </div>
        `;
      }

      // Text Message
      if (m.text) {
        content += `<span style="display:block;">${escapeHTMLSafe(m.text)}</span>`;
      }

      const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isLastMsg = idx === messages.length - 1;
      let receipt = '';
      if (isOut && isLastMsg) {
        receipt = `<div style="font-size:0.68rem; color:var(--text-secondary); text-align:right; margin-top:0.2rem;"><ion-icon name="checkmark-done-outline" style="color:var(--primary);"></ion-icon> Seen</div>`;
      }

      // Reactions Display
      let reactionsHtml = '';
      if (m.reactions && Object.keys(m.reactions).length > 0) {
        reactionsHtml += `<div class="chat-bubble-reactions">`;
        for (const [emoji, users] of Object.entries(m.reactions)) {
          if (users && users.length > 0) {
            const hasReacted = users.includes(activeUser.uid);
            reactionsHtml += `
              <button type="button" class="bubble-reaction-pill ${hasReacted ? 'reacted' : ''}" onclick="handleReactionClick('${chatId}', ${idx}, '${emoji}')" title="${users.join(', ')}">
                <span>${emoji}</span> <span>${users.length}</span>
              </button>
            `;
          }
        }
        reactionsHtml += `</div>`;
      }

      // Reactions Toolbar on hover
      const toolbarHtml = `
        <div class="chat-reactions-toolbar">
          <button type="button" class="reaction-picker-btn" onclick="handleReactionClick('${chatId}', ${idx}, '👍')" title="Thumbs up">👍</button>
          <button type="button" class="reaction-picker-btn" onclick="handleReactionClick('${chatId}', ${idx}, '❤️')" title="Heart">❤️</button>
          <button type="button" class="reaction-picker-btn" onclick="handleReactionClick('${chatId}', ${idx}, '👏')" title="Applause">👏</button>
          <button type="button" class="reaction-picker-btn" onclick="handleReactionClick('${chatId}', ${idx}, '🎉')" title="Celebrate">🎉</button>
          <button type="button" class="reaction-picker-btn" onclick="handleReactionClick('${chatId}', ${idx}, '💡')" title="Idea">💡</button>
        </div>
      `;

      const bubbleCls = (m.imageData && !m.text) ? 'chat-msg-bubble chat-msg-media-bubble' : 'chat-msg-bubble';

      html += `
        <div class="chat-msg-row ${rowCls}" data-msg-idx="${idx}">
          ${!isOut ? `<img class="chat-msg-avatar" src="${sanitizeUrlSafe(targetUser.avatar, { allowDataImage: true, allowHash: false })}" alt="Avatar">` : ''}
          <div class="chat-bubble-container">
            <div class="chat-msg-bubble-wrap">
              ${toolbarHtml}
              <div class="${bubbleCls}">${content}</div>
            </div>
            ${reactionsHtml}
            <span class="chat-msg-timestamp" style="font-size:0.7rem; color:var(--text-secondary); margin-top:2px;">${timeStr}</span>
            ${receipt}
          </div>
        </div>
      `;
    });

    body.innerHTML = html;

    // Populate Contextual Sidebar (Media & Docs Panel)
    const mediaGrid = document.getElementById('chat-media-grid');
    const docsList = document.getElementById('chat-docs-list');
    const mediaCount = document.getElementById('media-panel-count');
    const mediaPanelName = document.getElementById('media-panel-name');
    const mediaPanelRole = document.getElementById('media-panel-role');
    const mediaPanelAvatar = document.getElementById('media-panel-avatar');
    const mediaPanelDesc = document.getElementById('media-panel-desc');

    if (mediaPanelAvatar) mediaPanelAvatar.src = targetUser.avatar;
    if (mediaPanelName) mediaPanelName.innerText = targetUser.name;
    if (mediaPanelRole) mediaPanelRole.innerText = targetUser.isGroup ? 'School Channel' : targetUser.role;
    if (mediaPanelDesc) {
      mediaPanelDesc.innerText = targetUser.bio || targetUser.email || (targetUser.isGroup ? "Official communication space for Apex Integrated School" : "");
    }
    if (mediaCount) mediaCount.innerText = mediaItems.length;

    if (mediaGrid) {
      if (mediaItems.length > 0) {
        mediaGrid.innerHTML = mediaItems.map((src, i) => `
          <div class="media-item-box" onclick="if(typeof openPhotoTheater === 'function') openPhotoTheater(decodeURIComponent('${encodeURIComponent(src)}'), 'media_${i}')">
            <img src="${sanitizeUrlSafe(src, { allowDataImage: true, allowHash: false })}" alt="Media thumbnail">
          </div>
        `).join('');
      } else {
        mediaGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-secondary); font-size:0.8rem; padding:1.25rem 0;">No shared photos</p>`;
      }
    }

    if (docsList) {
      if (docItems.length > 0) {
        docsList.innerHTML = docItems.map((doc) => `
          <a href="${sanitizeUrlSafe(doc.data, { allowDataFile: true, allowHash: false })}" download="${escapeAttrSafe(doc.name || 'document')}" class="media-doc-item">
            <ion-icon name="document-text-outline" style="font-size:1.3rem; color:var(--primary);"></ion-icon>
            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTMLSafe(doc.name || 'Document')}</span>
            <ion-icon name="download-outline"></ion-icon>
          </a>
        `).join('');
      } else {
        docsList.innerHTML = `<p style="text-align:center; color:var(--text-secondary); font-size:0.8rem; padding:1rem 0;">No shared documents</p>`;
      }
    }

    body.scrollTop = body.scrollHeight;
  };

  renderMessages();

  // Scroll to bottom pill wiring
  const scrollPill = document.getElementById('chat-scroll-bottom-btn');
  body.onscroll = () => {
    if (!scrollPill) return;
    const distFromBottom = body.scrollHeight - body.scrollTop - body.clientHeight;
    if (distFromBottom > 150) {
      scrollPill.style.display = 'flex';
    } else {
      scrollPill.style.display = 'none';
    }
  };

  // Toggle mobile classes
  const chatContainer = document.querySelector('.chat-container');
  const chatWindow = document.querySelector('.chat-window');
  if (chatContainer) chatContainer.classList.add('chat-active-window');
  if (chatWindow) chatWindow.classList.add('mobile-active');
}

// ==========================================
// REACTIONS & WAVEFORM AUDIO HELPERS
// ==========================================

window.handleReactionClick = async function(chatId, msgIndex, emoji) {
  if (!activeUser) return;
  await dbService.toggleReaction(chatId, msgIndex, emoji, activeUser.uid);
  playChatSound('pop');
  
  // Re-render active window
  if (activeChatThread) {
    openChatWindow(activeChatThread, true);
  }
  // Sync floating window if active
  if (typeof activeFloatingChatThread !== 'undefined' && activeFloatingChatThread) {
    if (typeof openFloatingChat === 'function') {
      openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)).replace(/'/g, "%27"));
    }
  }
};

window.playVoiceWaveform = function(btn) {
  const isPlaying = btn.classList.contains('playing');
  const waveContainer = btn.parentElement.querySelector('.voice-waveform-bars');
  const bars = waveContainer ? waveContainer.querySelectorAll('.voice-wave-bar') : [];
  
  if (isPlaying) {
    btn.classList.remove('playing');
    btn.innerHTML = `<ion-icon name="play"></ion-icon>`;
    bars.forEach(b => b.classList.remove('playing'));
  } else {
    btn.classList.add('playing');
    btn.innerHTML = `<ion-icon name="pause"></ion-icon>`;
    bars.forEach(b => b.classList.add('playing'));
    playChatSound('receive');
    
    setTimeout(() => {
      btn.classList.remove('playing');
      btn.innerHTML = `<ion-icon name="play"></ion-icon>`;
      bars.forEach(b => b.classList.remove('playing'));
    }, 2800);
  }
};

window.scrollToChatBottom = function() {
  const body = document.getElementById('chat-messages-body');
  if (body) {
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    const pill = document.getElementById('chat-scroll-bottom-btn');
    if (pill) pill.style.display = 'none';
  }
};

// ==========================================
// IN-CONVERSATION SEARCH
// ==========================================

window.toggleConversationSearch = function() {
  const bar = document.getElementById('conversation-search-bar');
  if (!bar) return;
  const isHidden = bar.style.display === 'none';
  bar.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    const input = document.getElementById('conv-search-input');
    if (input) {
      input.value = '';
      input.focus();
      input.oninput = (e) => filterConversationMessages(e.target.value);
    }
  } else {
    filterConversationMessages('');
  }
};

function filterConversationMessages(query) {
  const q = (query || '').toLowerCase().trim();
  const countEl = document.getElementById('conv-search-count');
  const rows = document.querySelectorAll('#chat-messages-body .chat-msg-row');
  let matchCount = 0;
  
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    if (!q || text.includes(q)) {
      row.style.opacity = '1';
      if (q) {
        row.style.background = 'color-mix(in srgb, var(--primary) 12%, transparent)';
        row.style.borderRadius = '12px';
        matchCount++;
      } else {
        row.style.background = '';
      }
    } else {
      row.style.opacity = '0.25';
      row.style.background = '';
    }
  });

  if (countEl) {
    countEl.innerText = q ? `${matchCount} match${matchCount === 1 ? '' : 'es'}` : '';
  }
}

// ==========================================
// ATTACHMENT PREVIEW & VOICE RECORDING
// ==========================================

function setupMessengerAttachment() {
  const attachBtn = document.getElementById('btn-attach-chat-photo');
  const fileInput = document.getElementById('chat-photo-input');
  
  if (attachBtn && fileInput) {
    attachBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        stagedChatAttachment = {
          name: file.name,
          type: file.type,
          data: dataUrl
        };
        showAttachmentPreview(stagedChatAttachment);
      };
      reader.readAsDataURL(file);
    };
  }
}

function showAttachmentPreview(attachment) {
  const bar = document.getElementById('chat-attachment-preview-bar');
  const thumb = document.getElementById('attachment-preview-thumb');
  const icon = document.getElementById('attachment-preview-icon');
  const nameEl = document.getElementById('attachment-preview-name');
  if (!bar) return;

  bar.style.display = 'flex';
  if (nameEl) nameEl.innerText = attachment.name;
  
  if (attachment.type.startsWith('image/')) {
    if (thumb) {
      thumb.src = attachment.data;
      thumb.style.display = 'block';
    }
    if (icon) icon.style.display = 'none';
  } else {
    if (thumb) thumb.style.display = 'none';
    if (icon) icon.style.display = 'block';
  }
}

window.clearAttachmentPreview = function() {
  stagedChatAttachment = null;
  const bar = document.getElementById('chat-attachment-preview-bar');
  if (bar) bar.style.display = 'none';
  const fileInput = document.getElementById('chat-photo-input');
  if (fileInput) fileInput.value = '';
};

window.sendQuickReply = function(text) {
  const input = document.getElementById('chat-msg-input');
  if (input) {
    input.value = text;
    const form = document.getElementById('chat-input-form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
  }
};

window.recordSimulatedVoiceNote = async function(targetInputId) {
  if (!activeUser || !activeChatThread) {
    showToast("Please select a conversation first!");
    return;
  }
  showToast("🎙️ Recording simulated voice message (2s)...");
  playChatSound('pop');
  
  setTimeout(async () => {
    const voiceData = {
      isVoice: true,
      duration: "0:16",
      waveData: [6, 14, 22, 18, 26, 12, 19, 24, 15, 9, 20, 14, 8]
    };
    
    const chatId = activeChatThread.isGroup ? activeChatThread.uid : [activeUser.uid, activeChatThread.uid].sort().join('_');
    await dbService.sendMessage(chatId, activeUser.uid, '', voiceData);
    playChatSound('send');
    showToast("Voice message sent!");
    openChatWindow(activeChatThread, true);
    
    // Trigger simulated reply
    triggerSimulatedAutoReply(activeChatThread, "voice note");
  }, 2200);
};

// ==========================================
// CONTEXTUAL SMART AUTO-REPLY SIMULATION
// ==========================================

function triggerSimulatedAutoReply(targetThread, sentMessageText) {
  if (!targetThread || targetThread.isGroup) return; // Only 1-on-1 chats for realistic auto-reply

  const chatId = [activeUser.uid, targetThread.uid].sort().join('_');
  const role = (targetThread.role || '').toLowerCase();
  
  let replies = [
    "Thank you for the update! I will review this and get back to you shortly.",
    "Noted with thanks! Everything is noted on our class log.",
    "Good day! Received your message. Please let me know if you need any further assistance."
  ];

  if (role.includes('teacher')) {
    replies = [
      "Good day! Thank you for reaching out. I've noted this in our academic tracker.",
      "Received! Let me know if you need additional supplementary modules for our upcoming lesson.",
      "Thank you! Please remind the class to review the syllabus posted on the portal.",
      "Understood! We will cover this during our class consultation hours."
    ];
  } else if (role.includes('parent')) {
    replies = [
      "Good day Teacher/Ma'am! Thank you for keeping us updated regarding the school activities.",
      "Thank you! I will ensure Juan finishes the assignments before the deadline.",
      "Acknowledged with thanks. We look forward to the upcoming PTA assembly."
    ];
  } else if (role.includes('learner') || role.includes('student')) {
    replies = [
      "Thank you so much teacher! I will review the study materials and submit on time.",
      "Got it teacher! Clarifying that our group has finished the science experiment report.",
      "Thank you! See you in class tomorrow."
    ];
  } else if (role.includes('admin')) {
    replies = [
      "Acknowledged. The administration will coordinate this with the respective department leads.",
      "Thank you for bringing this up! We have updated the school announcements board accordingly."
    ];
  }

  const selectedReply = replies[Math.floor(Math.random() * replies.length)];

  // 1. Show Typing Indicator after 900ms
  setTimeout(() => {
    const body = document.getElementById('chat-messages-body');
    if (body && activeChatThread && activeChatThread.uid === targetThread.uid) {
      const typingEl = document.createElement('div');
      typingEl.id = 'active-typing-indicator';
      typingEl.className = 'chat-msg-row received';
      typingEl.innerHTML = `
        <img class="chat-msg-avatar" src="${targetThread.avatar}" alt="Avatar">
        <div class="typing-indicator" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:18px; padding:0.6rem 0.85rem; display:flex; gap:4px; align-items:center;">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;
      body.appendChild(typingEl);
      body.scrollTop = body.scrollHeight;
    }
  }, 900);

  // 2. Deliver Message after 2400ms
  setTimeout(async () => {
    const typingEl = document.getElementById('active-typing-indicator');
    if (typingEl) typingEl.remove();

    await dbService.sendMessage(chatId, targetThread.uid, selectedReply, null);
    playChatSound('receive');

    if (activeChatThread && activeChatThread.uid === targetThread.uid) {
      openChatWindow(activeChatThread, true);
    }

    // Sync threads list and messenger dropdown
    if (typeof initMessagesPanel === 'function' && window.location.hash.includes('#/messages')) {
      const searchInput = document.getElementById('messenger-search-input');
      const threads = await dbService.getChatThreads(activeUser.uid);
      initMessagesPanel();
    }
    if (typeof updateMessengerDropdownList === 'function') {
      updateMessengerDropdownList();
    }
  }, 2400);
}

// ==========================================
// FORM SUBMISSION & MEDIA PANEL TOGGLES
// ==========================================

const chatForm = document.getElementById('chat-input-form');
if (chatForm) {
  chatForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!activeChatThread) {
      showToast("Please select a conversation first!");
      return;
    }
    
    const input = document.getElementById('chat-msg-input');
    const text = input ? input.value.trim() : '';
    
    if (!text && !stagedChatAttachment) return;
    
    const chatId = activeChatThread.isGroup ? activeChatThread.uid : [activeUser.uid, activeChatThread.uid].sort().join('_');
    
    if (stagedChatAttachment) {
      await dbService.sendMessage(chatId, activeUser.uid, text, stagedChatAttachment);
      clearAttachmentPreview();
    } else {
      await dbService.sendMessage(chatId, activeUser.uid, text, null);
    }
    
    if (input) input.value = '';
    playChatSound('send');
    
    openChatWindow(activeChatThread, true);
    
    if (typeof activeFloatingChatThread !== 'undefined' && activeFloatingChatThread && activeFloatingChatThread.uid === activeChatThread.uid) {
      if (typeof openFloatingChat === 'function') {
        openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)).replace(/'/g, "%27"));
      }
    }
    
    if (typeof updateMessengerDropdownList === 'function') {
      updateMessengerDropdownList();
    }

    // Trigger simulated reply from teacher/parent/student
    triggerSimulatedAutoReply(activeChatThread, text);
  };
}

// Wire Mobile Back Button
const chatBackBtn = document.getElementById('btn-chat-back');
if (chatBackBtn) {
  chatBackBtn.onclick = () => {
    activeChatThread = null;
    const chatContainer = document.querySelector('.chat-container');
    const chatWindow = document.querySelector('.chat-window');
    if (chatContainer) {
      chatContainer.classList.remove('chat-active-window');
      chatContainer.classList.remove('has-media-open');
    }
    if (chatWindow) chatWindow.classList.remove('mobile-active');
    const panel = document.getElementById('chat-media-panel');
    if (panel) panel.style.display = 'none';
  };
}

// Close media drawer on narrow resize
window.addEventListener('resize', () => {
  if (window.innerWidth < 992) {
    const container = document.querySelector('.chat-container');
    const panel = document.getElementById('chat-media-panel');
    if (container && container.classList.contains('has-media-open')) {
      container.classList.remove('has-media-open');
      if (panel) panel.style.display = 'none';
    }
  }
});

// Media Panel Toggle
window.toggleMediaPanel = function(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('chat-media-panel');
  const container = document.querySelector('.chat-container');
  if (panel) {
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'flex' : 'none';
    if (container) {
      if (isHidden) container.classList.add('has-media-open');
      else container.classList.remove('has-media-open');
    }
  }
};

window.toggleThreadMute = function() {
  const icon = document.getElementById('icon-thread-mute');
  if (icon) {
    const isMuted = icon.name === 'notifications-off-outline';
    icon.name = isMuted ? 'notifications-outline' : 'notifications-off-outline';
    showToast(isMuted ? 'Conversation unmuted' : 'Conversation muted');
  }
};

window.viewThreadPartnerProfile = function() {
  if (!activeChatThread || activeChatThread.isGroup) {
    showToast("Profile view is available for direct contacts.");
    return;
  }
  window.location.hash = `#/profile`;
};

window.clearCurrentThreadMessages = async function() {
  if (!activeChatThread) return;
  if (!confirm("Are you sure you want to clear this conversation history?")) return;
  const chatId = activeChatThread.isGroup ? activeChatThread.uid : [activeUser.uid, activeChatThread.uid].sort().join('_');
  await dbService.clearMessages(chatId);
  showToast("Conversation cleared");
  openChatWindow(activeChatThread, true);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMessengerAttachment);
} else {
  setupMessengerAttachment();
}

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

function initProfilePanel() {
  if (!activeUser) return;
  document.getElementById('profile-avatar-preview').src = activeUser.avatar;
  document.getElementById('profile-name-input').value = activeUser.name;
  
  const coverPreview = document.getElementById('profile-cover-preview');
  if (coverPreview && activeUser.coverPhoto) {
    coverPreview.src = activeUser.coverPhoto;
  }
  const previewName = document.getElementById('profile-preview-display-name');
  if (previewName) previewName.innerText = activeUser.name;
  const previewRole = document.getElementById('profile-preview-display-role');
  if (previewRole) previewRole.innerText = (activeUser.role || 'MEMBER').toUpperCase();

  if (document.getElementById('profile-contact-input')) {
    document.getElementById('profile-contact-input').value = activeUser.contactInfo || activeUser.email || '';
  }
  if (document.getElementById('profile-cover-input')) {
    document.getElementById('profile-cover-input').value = activeUser.coverPhoto || '';
  }
  if (document.getElementById('profile-bio-input')) {
    document.getElementById('profile-bio-input').value = activeUser.bio || '';
  }

  // Cover photo file upload binding
  const coverFileInput = document.getElementById('profile-cover-file');
  if (coverFileInput) {
    coverFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        resizeImage(ev.target.result, 1200, 450, (resized) => {
          if (coverPreview) coverPreview.src = resized;
          const coverInput = document.getElementById('profile-cover-input');
          if (coverInput) coverInput.value = resized;
          showToast("Cover photo updated! Click Save Changes to apply.");
        });
      };
      reader.readAsDataURL(file);
    };
  }

  // --- Settings Tabs Wiring ---
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.onclick = (e) => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = 'var(--text-primary)';
      });
      const el = e.currentTarget;
      el.classList.add('active');
      el.style.background = 'var(--bg-primary)';
      el.style.color = 'var(--primary)';
      
      document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.style.display = 'none';
      });
      document.getElementById(el.dataset.tab).style.display = 'block';
    };
  });

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

  // --- Profile Cover Photo Upload ---
  const profileCoverFile = document.getElementById('profile-cover-file');
  if (profileCoverFile) {
    profileCoverFile.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        compressImage(ev.target.result, 1200, (compressedData) => {
          document.getElementById('profile-cover-input').value = compressedData;
          showToast('Cover photo processed! Click Save Profile to apply.');
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
    
    const contactInfo = document.getElementById('profile-contact-input') ? document.getElementById('profile-contact-input').value.trim() : activeUser.contactInfo;
    const coverPhoto = document.getElementById('profile-cover-input') ? document.getElementById('profile-cover-input').value.trim() : activeUser.coverPhoto;
    const bio = document.getElementById('profile-bio-input') ? document.getElementById('profile-bio-input').value.trim() : activeUser.bio;

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

    activeUser = await dbService.saveUser(activeUser.uid, { name, avatar, contactInfo, coverPhoto, bio, roleData });
    try { sessionStorage.setItem('activeUser', JSON.stringify(activeUser)); } catch(err) {}
    showToast('Profile updated successfully!');

    // Sync sidebar avatar + name immediately
    syncSidebarProfile();
  };

  const adminSidebarSection = document.getElementById('admin-sidebar-section');
  if (activeUser.role === 'admin') {
    if (adminSidebarSection) adminSidebarSection.style.display = 'block';
    
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
    if (adminSidebarSection) adminSidebarSection.style.display = 'none';
  }
}

// ==========================================
// CREATE GROUP CHAT LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const btnCreateGroup = document.getElementById('btn-create-group-chat');
  const createGroupModal = document.getElementById('create-group-modal');
  const btnCloseGroupModal = document.getElementById('btn-close-group-modal');
  const createGroupForm = document.getElementById('create-group-form');
  const participantsList = document.getElementById('group-participants-list');

  if (btnCreateGroup && createGroupModal) {
    btnCreateGroup.onclick = async () => {
      // Populate participants
      const local = dbService.getLocalDB();
      const users = Object.values(local.users).filter(u => u.uid !== activeUser.uid);
      participantsList.innerHTML = users.map(u => `
        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.25rem; cursor:pointer;">
          <input type="checkbox" name="group-participant" value="${u.uid}">
          <img src="${u.avatar}" style="width:24px; height:24px; border-radius:50%;">
          <span style="font-size:0.9rem;">${u.name}</span>
        </label>
      `).join('');
      
      createGroupModal.style.display = 'flex';
    };

    btnCloseGroupModal.onclick = () => {
      createGroupModal.style.display = 'none';
    };

    createGroupForm.onsubmit = async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('group-name-input').value.trim();
      const checkboxes = document.querySelectorAll('input[name="group-participant"]:checked');
      const selectedUids = Array.from(checkboxes).map(cb => cb.value);
      
      if (!nameInput) {
        showToast("Group name is required.");
        return;
      }
      if (selectedUids.length === 0) {
        showToast("Select at least one participant.");
        return;
      }
      
      // Include the active user as a participant automatically
      selectedUids.push(activeUser.uid);
      
      await dbService.createGroupChat(nameInput, selectedUids);
      createGroupModal.style.display = 'none';
      createGroupForm.reset();
      showToast("Group Chat created!");
      
      // Refresh the messages panel
      if (typeof initMessagesPanel === 'function') {
        initMessagesPanel();
      }
    };
  }
});
