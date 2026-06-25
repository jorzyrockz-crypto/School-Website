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
  
  // Decorate threads with last message timestamp to sort them
  const recentThreads = [];
  const readTimestamp = window.mockReadChats ? (window.mockReadChats[activeUser.uid] || 0) : 0;
  
  for (const t of threads) {
    const chatId = t.isGroup ? t.uid : [activeUser.uid, t.uid].sort().join('_');
    const msgs = await dbService.getMessages(chatId);
    let lastMsg = null;
    let unread = false;
    
    if (msgs.length > 0) {
      lastMsg = msgs[msgs.length - 1];
      if (lastMsg.senderId !== activeUser.uid && lastMsg.timestamp > readTimestamp) {
        unread = true;
      }
    }
    recentThreads.push({ ...t, lastMsg, unread });
  }

  recentThreads.sort((a, b) => (b.lastMsg?.timestamp || 0) - (a.lastMsg?.timestamp || 0));

  threadListContainer.innerHTML = recentThreads.map(t => {
    let snippet = "No messages yet";
    let timeStr = "";
    if (t.lastMsg) {
      snippet = t.lastMsg.text || (t.lastMsg.imageData ? "Sent an image" : t.lastMsg.fileAttachment ? "Sent a file" : "Sent an attachment");
      if (t.lastMsg.senderId === activeUser.uid) snippet = `You: ${snippet}`;
      
      const d = new Date(t.lastMsg.timestamp);
      timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return `
    <div class="thread-item" data-uid="${t.uid}" style="position:relative;">
      <img class="thread-avatar" src="${t.avatar}" alt="avatar">
      <div class="thread-details" style="flex:1; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:baseline;">
          <div class="thread-name" style="font-weight:${t.unread ? '700' : '500'};">${t.name}</div>
          <span class="thread-time">${timeStr}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="thread-snippet" style="font-weight:${t.unread ? '700' : '400'}; color:${t.unread ? 'var(--text-primary)' : 'var(--text-secondary)'};">${snippet}</div>
          ${t.unread ? `<div class="thread-unread-badge"></div>` : ''}
        </div>
      </div>
    </div>
    `;
  }).join('');

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
  } else if (recentThreads.length > 0) {
    // Automatically select the most recent thread
    const firstEl = threadListContainer.querySelector('.thread-item');
    if (firstEl) firstEl.click();
  }
}

async function openChatWindow(targetUser, forceNoIndicator = false) {
  activeChatThread = targetUser;
  document.getElementById('chat-header-avatar').src = targetUser.avatar;
  document.getElementById('chat-header-name').innerText = targetUser.name;
  document.getElementById('chat-header-role').innerText = targetUser.role.toUpperCase();
  
  const activeDot = document.getElementById('chat-header-active-dot');
  if (activeDot) activeDot.style.display = 'block';

  const chatId = targetUser.isGroup ? targetUser.uid : [activeUser.uid, targetUser.uid].sort().join('_');
  const messages = await dbService.getMessages(chatId);
  
  // Update mockReadChats to clear unread badges for this thread
  window.mockReadChats = window.mockReadChats || {};
  window.mockReadChats[activeUser.uid] = Date.now();
  if (typeof updateMessengerDropdownList === 'function') updateMessengerDropdownList();
  
  const body = document.getElementById('chat-messages-body');
  
  const renderMessages = () => {
    let mediaItems = [];
    body.innerHTML = messages.map((m, idx) => {
      const isOut = m.senderId === activeUser.uid;
      const rowCls = isOut ? 'sent' : 'received';
      let content = '';
      
      if (m.fileAttachment) {
        const ext = m.fileAttachment.name.split('.').pop().toUpperCase();
        content += `
          <div class="chat-file-attachment" style="background:rgba(0,0,0,0.1); padding:0.5rem; border-radius:8px; display:flex; align-items:center; gap:0.5rem;">
            <ion-icon name="document-text" class="file-icon" style="font-size:1.5rem;"></ion-icon>
            <div class="file-name" title="${m.fileAttachment.name}" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.85rem;">${m.fileAttachment.name}</div>
            <a href="${m.fileAttachment.data}" download="${m.fileAttachment.name}" class="file-download" title="Download ${ext}" style="color:inherit;">
              <ion-icon name="download-outline"></ion-icon>
            </a>
          </div>
        `;
      } else if (m.imageData) {
        mediaItems.push(m.imageData);
        content += `
          <div style="position:relative; display:inline-block; margin-bottom:${m.text ? '0.4rem' : '0'}; cursor:zoom-in; max-width:100%;" onclick="if(typeof openPhotoTheater === 'function') openPhotoTheater('${m.imageData}', 'chat_${m.timestamp}')">
            <img src="${m.imageData}" alt="Image" style="max-width:100%; width:220px; max-height:200px; object-fit:cover; border-radius:8px; display:block; border:1px solid rgba(255,255,255,0.2);">
            <a href="${m.imageData}" download="image_${m.timestamp}.jpg" title="Download Image" style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.6); color:white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; text-decoration:none;" onclick="event.stopPropagation();">
              <ion-icon name="download-outline"></ion-icon>
            </a>
          </div>
        `;
      }
      
      if (m.text) content += `<span>${m.text}</span>`;
      
      const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isLastMsg = idx === messages.length - 1;
      let receipt = '';
      if (isOut && isLastMsg) {
        receipt = `<div style="font-size:0.65rem; color:var(--text-secondary); text-align:right; margin-top:0.2rem;"><ion-icon name="checkmark-done-outline"></ion-icon> Seen</div>`;
      }
      
      const bubbleCls = m.imageData && !m.text ? 'chat-msg-bubble chat-msg-media-bubble' : 'chat-msg-bubble';
      return `
        <div class="chat-msg-row ${rowCls}">
          ${!isOut ? `<img class="chat-msg-avatar" src="${targetUser.avatar}" alt="Avatar">` : ''}
          <div style="max-width:75%; text-align:${isOut ? 'right' : 'left'}; flex-shrink:0;">
            <div class="${bubbleCls}" style="display:inline-block; text-align:left;">${content}</div>
            <span class="chat-msg-timestamp">${timeStr}</span>
            ${receipt}
          </div>
        </div>
      `;
    }).join('');
    
    // Populate Media Panel
    const mediaGrid = document.getElementById('chat-media-grid');
    if (mediaGrid) {
      document.getElementById('media-panel-avatar').src = targetUser.avatar;
      document.getElementById('media-panel-name').innerText = targetUser.name;
      
      if (mediaItems.length > 0) {
        mediaGrid.innerHTML = mediaItems.map((src, i) => `
          <div style="position:relative; width:100%; aspect-ratio:1; cursor:zoom-in;" onclick="if(typeof openPhotoTheater === 'function') openPhotoTheater('${src}', 'media_${i}')">
            <img class="media-item" src="${src}" style="width:100%; height:100%; display:block;">
            <a href="${src}" download="media_${i}.jpg" title="Download Image" style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.6); color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; text-decoration:none;" onclick="event.stopPropagation();">
              <ion-icon name="download-outline"></ion-icon>
            </a>
          </div>
        `).join('');
      } else {
        mediaGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-secondary); font-size:0.85rem; padding:2rem 0;">No media shared yet</p>`;
      }
    }
    
    body.scrollTop = body.scrollHeight;
  };
  
  // Render typing indicator if there's no messages or randomly (1 in 3 chance) just for effect
  if (!forceNoIndicator && messages.length > 0 && Math.random() > 0.6) {
    body.innerHTML = `
      <div class="chat-msg-row received">
        <img class="chat-msg-avatar" src="${targetUser.avatar}" alt="Avatar">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    setTimeout(() => {
      renderMessages();
    }, 1500);
  } else {
    renderMessages();
  }

  // Toggle active view state on mobile
  const chatContainer = document.querySelector('.chat-container');
  if (chatContainer) {
    chatContainer.classList.add('chat-active-window');
  }
}

// Media Panel Toggle
window.toggleMediaPanel = function(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('chat-media-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  }
};

// Close media panel on mobile if clicking outside of it
document.addEventListener('click', (e) => {
  const panel = document.getElementById('chat-media-panel');
  // Only apply this logic if we are on a narrow screen where panel is fixed/floating
  if (panel && panel.style.display === 'flex' && window.innerWidth <= 767) {
    if (!panel.contains(e.target) && !e.target.closest('ion-icon[name="information-circle"]')) {
      panel.style.display = 'none';
    }
  }
});

// Bind mobile back button
const chatBackBtn = document.getElementById('btn-chat-back');
if (chatBackBtn) {
  chatBackBtn.onclick = () => {
    activeChatThread = null;
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.classList.remove('chat-active-window');
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
      const dataUrl = ev.target.result;
      if (file.type.startsWith('image/')) {
        compressImage(dataUrl, 800, async (compressedData) => {
          const chatId = activeChatThread.isGroup ? activeChatThread.uid : [activeUser.uid, activeChatThread.uid].sort().join('_');
          await dbService.sendMessage(chatId, activeUser.uid, '', { name: file.name, type: file.type, data: compressedData });
          chatPhotoInput.value = '';
          openChatWindow(activeChatThread);
          if (typeof activeFloatingChatThread !== 'undefined' && activeFloatingChatThread && activeFloatingChatThread.uid === activeChatThread.uid) {
            if (typeof openFloatingChat === 'function') openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)).replace(/'/g, "%27"));
          }
          showToast('Image sent!');
        });
      } else {
        // Generic file, send directly without compression
        const chatId = activeChatThread.isGroup ? activeChatThread.uid : [activeUser.uid, activeChatThread.uid].sort().join('_');
        dbService.sendMessage(chatId, activeUser.uid, '', { name: file.name, type: file.type, data: dataUrl }).then(() => {
          chatPhotoInput.value = '';
          openChatWindow(activeChatThread);
          if (typeof activeFloatingChatThread !== 'undefined' && activeFloatingChatThread && activeFloatingChatThread.uid === activeChatThread.uid) {
            if (typeof openFloatingChat === 'function') openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)).replace(/'/g, "%27"));
          }
          showToast('File sent!');
        });
      }
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
    
    const chatId = activeChatThread.isGroup ? activeChatThread.uid : [activeUser.uid, activeChatThread.uid].sort().join('_');
    await dbService.sendMessage(chatId, activeUser.uid, text, null);
    input.value = '';
    
    openChatWindow(activeChatThread, true);
    if (typeof activeFloatingChatThread !== 'undefined' && activeFloatingChatThread && activeFloatingChatThread.uid === activeChatThread.uid) {
      if (typeof openFloatingChat === 'function') openFloatingChat(encodeURIComponent(JSON.stringify(activeFloatingChatThread)).replace(/'/g, "%27"));
    }
    
    if (typeof updateMessengerDropdownList === 'function') {
      updateMessengerDropdownList();
    }
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
