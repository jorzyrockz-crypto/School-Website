/**
 * ============================================================================
 * APEX SCHOOL MESSENGER - CORE CONTROLLER
 * Dedicated real-time academic messenger for faculty, learners & parents.
 * ============================================================================
 */

(function () {
  'use strict';

  // State
  let activeUser = null;
  let activeThread = null;
  let allThreads = [];
  let currentFilter = 'all';
  let stagedAttachment = null;
  let callTimerInterval = null;
  let callSeconds = 0;

  // Reusable Shared AudioContext to prevent browser memory leaks & max-instance limits
  let sharedAudioCtx = null;
  function getAudioContext() {
    try {
      if (!sharedAudioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) sharedAudioCtx = new AudioCtxClass();
      }
      if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(() => {});
      }
      return sharedAudioCtx;
    } catch (e) {
      return null;
    }
  }

  // Audio effects (synthesized with Web Audio API for zero external dependencies)
  function playTone(freq, type, duration) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playSendSound() {
    playTone(880, 'sine', 0.12);
  }

  function playReceiveSound() {
    playTone(523.25, 'triangle', 0.15);
  }

  // High-performance Debounce Helper
  function debounce(fn, delay = 120) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function showToast(message) {
    const container = document.getElementById('msg-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'msg-toast';
    toast.innerHTML = `<ion-icon name="information-circle"></ion-icon> <span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Format timestamps nicely for school messenger
  function formatMsgTime(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const isSameYear = date.getFullYear() === now.getFullYear();
    if (isSameYear) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatFullDateHeader(ts) {
    if (!ts) return 'Today';
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Initialize Active User
  async function initUserSession() {
    try {
      const stored = sessionStorage.getItem('activeUser');
      if (stored) {
        activeUser = JSON.parse(stored);
      }
    } catch (e) {}

    // Fallback: Default to admin1 if not found
    if (!activeUser || !activeUser.uid) {
      const user = await dbService.getUser('admin@school.edu');
      activeUser = user || {
        uid: 'admin1',
        name: 'Dr. Maria Santos',
        email: 'admin@school.edu',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=MariaSantos'
      };
      try {
        sessionStorage.setItem('activeUser', JSON.stringify(activeUser));
      } catch (e) {}
    }

    syncUserTopBar();
  }

  function syncUserTopBar() {
    if (!activeUser) return;
    const nameEl = document.getElementById('msg-user-name');
    const roleEl = document.getElementById('msg-user-role-badge');
    const avatarEl = document.getElementById('msg-user-avatar');

    if (nameEl) nameEl.textContent = activeUser.name;
    if (roleEl) {
      roleEl.textContent = (activeUser.role || 'USER').toUpperCase();
      roleEl.className = `msg-persona-role-badge ${activeUser.role || ''}`;
    }
    if (avatarEl && activeUser.avatar) {
      avatarEl.src = activeUser.avatar;
    }
  }

  // Switch Active School Persona
  window.switchPersona = async function (uid, email) {
    const user = await dbService.getUser(email);
    if (!user) {
      showToast('Could not load user profile: ' + email);
      return;
    }

    activeUser = user;
    try {
      sessionStorage.setItem('activeUser', JSON.stringify(user));
    } catch (e) {}

    syncUserTopBar();
    closePersonaDropdown();
    showToast(`Switched persona to ${user.name} (${user.role.toUpperCase()})`);

    // Reset thread state and reload
    activeThread = null;
    await loadThreads();
    renderWelcomeState();
  };

  function closePersonaDropdown() {
    const dd = document.getElementById('msg-persona-dropdown');
    if (dd) dd.classList.remove('show');
  }

  // ==========================================
  // THREADS & DIRECTORY
  // ==========================================

  async function loadThreads() {
    if (!activeUser) return;
    const container = document.getElementById('msg-thread-list-container');
    if (!container) return;

    allThreads = await dbService.getChatThreads(activeUser.uid);

    // Fetch last message for each thread to calculate preview and sort by latest
    for (let t of allThreads) {
      const chatId = t.isGroup ? t.uid : [activeUser.uid, t.uid].sort().join('_');
      const msgs = await dbService.getMessages(chatId);
      if (msgs && msgs.length > 0) {
        t.lastMsg = msgs[msgs.length - 1];
        t.unreadCount = msgs.filter(m => m.senderId !== activeUser.uid && (!m.readBy || !m.readBy.includes(activeUser.uid))).length;
      } else {
        t.lastMsg = null;
        t.unreadCount = 0;
      }
    }

    // Sort by latest message timestamp
    allThreads.sort((a, b) => {
      const aTime = a.lastMsg ? a.lastMsg.timestamp : 0;
      const bTime = b.lastMsg ? b.lastMsg.timestamp : 0;
      return bTime - aTime;
    });

    renderThreadsList();
  }

  function renderThreadsList() {
    const container = document.getElementById('msg-thread-list-container');
    if (!container) return;

    const searchTerm = (document.getElementById('msg-search-input')?.value || '').toLowerCase().trim();

    const filtered = allThreads.filter(t => {
      // Category filter
      if (currentFilter === 'channel') {
        if (!t.isGroup) return false;
      } else if (currentFilter === 'teacher') {
        if (t.isGroup || t.role !== 'teacher') return false;
      } else if (currentFilter === 'learner') {
        if (t.isGroup || t.role !== 'learner') return false;
      } else if (currentFilter === 'parent') {
        if (t.isGroup || t.role !== 'parent') return false;
      }

      // Search term filter
      if (searchTerm) {
        const nameMatch = (t.name || '').toLowerCase().includes(searchTerm);
        const roleMatch = (t.role || '').toLowerCase().includes(searchTerm);
        const msgMatch = t.lastMsg && (t.lastMsg.text || '').toLowerCase().includes(searchTerm);
        return nameMatch || roleMatch || msgMatch;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="padding:2.5rem 1rem; text-align:center; color:var(--text-secondary);">
          <ion-icon name="search-outline" style="font-size:2.5rem; opacity:0.4; margin-bottom:0.5rem;"></ion-icon>
          <div style="font-weight:700; font-size:0.95rem; color:var(--text-primary);">No conversations found</div>
          <div style="font-size:0.78rem; opacity:0.8; margin-top:0.25rem;">Try adjusting your search or category filter</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(t => {
      const isActive = activeThread && activeThread.uid === t.uid;
      const roleClass = t.isGroup ? 'channel' : (t.role || 'user');
      const roleDisplay = t.isGroup ? (t.category === 'channel' ? 'CHANNEL' : 'GROUP') : (t.role || 'USER').toUpperCase();
      
      let preview = 'No messages yet';
      let previewTime = '';
      if (t.lastMsg) {
        previewTime = formatMsgTime(t.lastMsg.timestamp);
        if (t.lastMsg.voiceNote) {
          preview = '🎤 Voice note (' + (t.lastMsg.voiceNote.duration || '0:05') + ')';
        } else if (t.lastMsg.imageData) {
          preview = '📷 Photo attachment';
        } else if (t.lastMsg.fileAttachment) {
          preview = '📄 ' + (t.lastMsg.fileAttachment.name || 'Attachment');
        } else if (t.lastMsg.text) {
          preview = t.lastMsg.text;
        }
      }

      const hasUnread = t.unreadCount > 0;

      return `
        <div class="msg-thread-item ${isActive ? 'active' : ''} ${hasUnread ? 'thread-item-unread' : ''}" 
             onclick="selectThread('${t.uid}')">
          <div class="msg-thread-avatar-wrap">
            <img class="msg-thread-avatar clay-avatar" src="${escapeHTML(t.avatar)}" alt="${escapeHTML(t.name)}">
            <span class="thread-online-dot ${t.isGroup ? 'offline' : 'online'}"></span>
          </div>
          <div class="msg-thread-content">
            <div class="thread-row-top">
              <span class="thread-name">${escapeHTML(t.name)}</span>
              <span class="thread-time">${previewTime}</span>
            </div>
            <div class="thread-row-sub">
              <span class="thread-role-tag ${roleClass}">${roleDisplay}</span>
              <span class="thread-preview-text">${escapeHTML(preview)}</span>
              ${hasUnread ? `<span class="thread-unread-badge">${t.unreadCount}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Select Thread & Render Active Conversation
  window.selectThread = async function (threadUid) {
    activeThread = allThreads.find(t => t.uid === threadUid);
    if (!activeThread) return;

    // Mobile layout toggle
    const appRoot = document.getElementById('msg-app-root');
    if (appRoot) appRoot.classList.add('mobile-chat-active');

    // Update active state in sidebar
    renderThreadsList();

    // Render active chat headers
    renderChatHeader();
    await renderMessages();
    renderInfoPane();

    // Mark as read
    if (activeThread.unreadCount > 0) {
      activeThread.unreadCount = 0;
      renderThreadsList();
    }
  };

  function renderWelcomeState() {
    const stage = document.getElementById('msg-messages-viewport');
    if (stage) {
      stage.innerHTML = `
        <div class="msg-welcome-empty-state" id="msg-empty-placeholder">
          <div class="empty-icon-wrap">
            <ion-icon name="chatbubbles-outline"></ion-icon>
          </div>
          <h3>Apex School Messenger</h3>
          <p>Select a faculty member, learner group, or school advisory channel from the left sidebar to start collaborating.</p>
          <div class="empty-quick-shortcuts">
            <button type="button" class="quick-start-btn" onclick="openPresetThread('teacher1')">
              <ion-icon name="school"></ion-icon> Message Teacher Jose
            </button>
            <button type="button" class="quick-start-btn" onclick="openPresetThread('group_faculty')">
              <ion-icon name="people"></ion-icon> Faculty Lounge
            </button>
            <button type="button" class="quick-start-btn" onclick="openPresetThread('group_grade10_advisory')">
              <ion-icon name="calendar"></ion-icon> Grade 10 Advisory
            </button>
          </div>
        </div>
      `;
    }
  }

  window.openPresetThread = function (uid) {
    selectThread(uid);
  };

  function renderChatHeader() {
    if (!activeThread) return;
    const nameEl = document.getElementById('msg-active-name');
    const rolePill = document.getElementById('msg-active-role-pill');
    const subEl = document.getElementById('msg-active-sub');
    const avatarEl = document.getElementById('msg-active-avatar');
    const dotEl = document.getElementById('msg-active-status-dot');

    if (nameEl) nameEl.textContent = activeThread.name;
    if (avatarEl) avatarEl.src = activeThread.avatar;
    if (rolePill) {
      const roleText = activeThread.isGroup ? (activeThread.category === 'channel' ? 'SCHOOL CHANNEL' : 'GROUP CHAT') : (activeThread.role || 'USER').toUpperCase();
      rolePill.textContent = roleText;
      rolePill.className = `msg-chat-role-pill ${activeThread.isGroup ? 'channel' : activeThread.role}`;
    }
    if (subEl) {
      if (activeThread.isGroup) {
        subEl.textContent = `${activeThread.participants ? activeThread.participants.length : 3} Participants • Official Advisory`;
      } else if (activeThread.role === 'teacher') {
        subEl.textContent = 'STEM & Math Faculty • Room 204 • Active Now';
      } else if (activeThread.role === 'learner') {
        subEl.textContent = 'Grade 10 - Rizal • Learner ID: 2026-1049 • Active Now';
      } else if (activeThread.role === 'parent') {
        subEl.textContent = 'Parent of Juan Cruz • PTA Committee • Available';
      } else {
        subEl.textContent = 'Principal Administration • Executive Suite • Online';
      }
    }
    if (dotEl) {
      dotEl.className = `active-status-dot ${activeThread.isGroup ? 'offline' : 'online'}`;
    }
  }

  // ==========================================
  // MESSAGES RENDERING & INTERACTIONS
  // ==========================================

  function buildMessageContentHTML(msg) {
    let contentHTML = '';
    // 1. Text
    if (msg.text) {
      contentHTML += `<div>${escapeHTML(msg.text)}</div>`;
    }
    // 2. Photo
    if (msg.imageData) {
      contentHTML += `
        <div style="margin-top:0.4rem; border-radius:12px; overflow:hidden; cursor:pointer;" onclick="openLightbox('${escapeHTML(msg.imageData)}')">
          <img src="${escapeHTML(msg.imageData)}" alt="Photo Attachment" decoding="async" style="max-width:100%; max-height:260px; object-fit:cover; border-radius:8px; display:block;">
        </div>
      `;
    }
    // 3. Document / File Attachment
    if (msg.fileAttachment) {
      contentHTML += `
        <a class="msg-file-card" href="${escapeHTML(msg.fileAttachment.data || '#')}" download="${escapeHTML(msg.fileAttachment.name || 'document.pdf')}" target="_blank">
          <div class="file-icon-wrap"><ion-icon name="document-text"></ion-icon></div>
          <div class="file-info">
            <span class="file-name">${escapeHTML(msg.fileAttachment.name || 'Academic File.pdf')}</span>
            <span class="file-meta">${escapeHTML(msg.fileAttachment.size || '320 KB')} • Click to open</span>
          </div>
          <ion-icon name="download-outline" style="font-size:1.2rem;"></ion-icon>
        </a>
      `;
    }
    // 4. Voice Note
    if (msg.voiceNote) {
      contentHTML += `
        <div class="msg-voice-card">
          <button type="button" class="voice-play-btn" onclick="playVoiceSim(this)">
            <ion-icon name="play"></ion-icon>
          </button>
          <div class="voice-waveform-sim">
            <span class="wave-bar" style="height:8px;"></span>
            <span class="wave-bar" style="height:14px;"></span>
            <span class="wave-bar" style="height:20px;"></span>
            <span class="wave-bar" style="height:10px;"></span>
            <span class="wave-bar" style="height:18px;"></span>
            <span class="wave-bar" style="height:12px;"></span>
            <span class="wave-bar" style="height:16px;"></span>
            <span class="wave-bar" style="height:6px;"></span>
          </div>
          <span class="voice-duration">${escapeHTML(msg.voiceNote.duration || '0:05')}</span>
        </div>
      `;
    }
    return contentHTML;
  }

  function buildReactionsHTML(reactions, chatId, idx) {
    if (!reactions || Object.keys(reactions).length === 0) return '';
    let reactionsHTML = '<div class="msg-reactions-row">';
    for (let [emoji, userList] of Object.entries(reactions)) {
      const hasUser = userList.includes(activeUser.uid);
      reactionsHTML += `
        <span class="msg-reaction-badge ${hasUser ? 'user-reacted' : ''}" 
              onclick="handleReactionClick('${chatId}', ${idx}, '${emoji}')" 
              title="${userList.length} reaction(s)">
          <span>${emoji}</span>
          <span style="font-weight:700;">${userList.length}</span>
        </span>
      `;
    }
    reactionsHTML += '</div>';
    return reactionsHTML;
  }

  // Fast Append for 0ms Send/Receive Latency without full DOM teardown
  function appendSingleMessageToDOM(msg, isSent) {
    const viewport = document.getElementById('msg-messages-viewport');
    if (!viewport) return;

    // Remove empty placeholder if present
    const placeholder = document.getElementById('msg-empty-placeholder');
    if (placeholder) placeholder.remove();

    const chatId = activeThread.isGroup ? activeThread.uid : [activeUser.uid, activeThread.uid].sort().join('_');
    const local = getLocalDB();
    const usersMap = local.users || {};

    let senderName = '';
    let senderAvatar = '';
    if (!isSent && activeThread.isGroup) {
      const senderUser = usersMap[msg.senderId];
      senderName = senderUser ? senderUser.name : 'Participant';
      senderAvatar = senderUser ? senderUser.avatar : 'https://api.dicebear.com/7.x/initials/svg?seed=User';
    }

    const row = document.createElement('div');
    row.className = `msg-row ${isSent ? 'sent' : 'recv'}`;
    row.innerHTML = `
      ${!isSent && activeThread.isGroup ? `<img class="msg-row-avatar clay-avatar" src="${escapeHTML(senderAvatar)}" alt="${escapeHTML(senderName)}" decoding="async">` : ''}
      <div class="msg-bubble-wrap">
        ${!isSent && activeThread.isGroup ? `<span class="msg-sender-label">${escapeHTML(senderName)}</span>` : ''}
        <div class="msg-bubble">
          ${buildMessageContentHTML(msg)}
          <div class="msg-meta-row">
            <span>${formatMsgTime(msg.timestamp)}</span>
            ${isSent ? `<ion-icon name="checkmark-done" class="msg-check-icons" style="color:#6ee7b7;"></ion-icon>` : ''}
          </div>
        </div>
      </div>
    `;

    viewport.appendChild(row);
    scrollChatToBottom();
  }

  async function renderMessages() {
    if (!activeThread || !activeUser) return;
    const viewport = document.getElementById('msg-messages-viewport');
    if (!viewport) return;

    const chatId = activeThread.isGroup ? activeThread.uid : [activeUser.uid, activeThread.uid].sort().join('_');
    const messages = await dbService.getMessages(chatId);

    if (messages.length === 0) {
      viewport.innerHTML = `
        <div class="msg-welcome-empty-state" id="msg-empty-placeholder" style="padding:4rem 1.5rem; text-align:center; color:var(--text-secondary);">
          <div style="width:64px; height:64px; border-radius:50%; background:var(--bg-tint); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 1rem;">
            <ion-icon name="chatbubble-ellipses"></ion-icon>
          </div>
          <h4 style="font-size:1.15rem; font-weight:800; color:var(--text-primary); margin-bottom:0.35rem;">Academic Thread Started</h4>
          <p style="font-size:0.85rem; max-width:320px; margin:0 auto; opacity:0.85;">Send a direct message or share instructional materials with ${escapeHTML(activeThread.name)}.</p>
        </div>
      `;
      return;
    }

    // Hoist users lookup outside the loop for O(1) performance
    const local = getLocalDB();
    const usersMap = local.users || {};

    let html = '';
    let lastDate = '';

    messages.forEach((msg, idx) => {
      const isSent = msg.senderId === activeUser.uid;
      const msgDate = new Date(msg.timestamp).toDateString();

      // Date divider
      if (msgDate !== lastDate) {
        html += `
          <div class="msg-date-divider">
            <span class="msg-date-pill">${formatFullDateHeader(msg.timestamp)}</span>
          </div>
        `;
        lastDate = msgDate;
      }

      // Sender meta for group chats
      let senderName = '';
      let senderAvatar = '';
      if (!isSent && activeThread.isGroup) {
        const senderUser = usersMap[msg.senderId];
        senderName = senderUser ? senderUser.name : 'Participant';
        senderAvatar = senderUser ? senderUser.avatar : 'https://api.dicebear.com/7.x/initials/svg?seed=User';
      }

      const contentHTML = buildMessageContentHTML(msg);
      const reactionsHTML = buildReactionsHTML(msg.reactions, chatId, idx);

      html += `
        <div class="msg-row ${isSent ? 'sent' : 'recv'}">
          ${!isSent && activeThread.isGroup ? `<img class="msg-row-avatar clay-avatar" src="${escapeHTML(senderAvatar)}" alt="${escapeHTML(senderName)}" decoding="async">` : ''}
          <div class="msg-bubble-wrap">
            ${!isSent && activeThread.isGroup ? `<span class="msg-sender-label">${escapeHTML(senderName)}</span>` : ''}
            <div class="msg-bubble">
              ${contentHTML}
              <div class="msg-meta-row">
                <span>${formatMsgTime(msg.timestamp)}</span>
                ${isSent ? `<ion-icon name="checkmark-done" class="msg-check-icons" style="color:#6ee7b7;"></ion-icon>` : ''}
              </div>
            </div>
            ${reactionsHTML}
          </div>
        </div>
      `;
    });

    viewport.innerHTML = html;
    scrollChatToBottom();
  }

  function scrollChatToBottom() {
    const viewport = document.getElementById('msg-messages-viewport');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }

  window.handleReactionClick = async function (chatId, msgIdx, emoji) {
    await dbService.toggleReaction(chatId, msgIdx, emoji, activeUser.uid);
    renderMessages();
  };

  // Simulated Voice Player
  window.playVoiceSim = function (btn) {
    const icon = btn.querySelector('ion-icon');
    if (icon) {
      icon.setAttribute('name', 'pause');
      playTone(440, 'sine', 0.5);
      setTimeout(() => {
        icon.setAttribute('name', 'play');
      }, 1500);
    }
  };

  // ==========================================
  // MESSAGE COMPOSER & SENDING
  // ==========================================

  async function sendMessage() {
    if (!activeThread || !activeUser) return;
    const input = document.getElementById('msg-text-input');
    const text = input ? input.value.trim() : '';

    if (!text && !stagedAttachment) {
      return;
    }

    const chatId = activeThread.isGroup ? activeThread.uid : [activeUser.uid, activeThread.uid].sort().join('_');

    const newMsg = await dbService.sendMessage(chatId, activeUser.uid, text, stagedAttachment);

    // Reset composer state
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    clearStaging();
    playSendSound();

    // Fast Append single message for 0ms perceptible latency
    appendSingleMessageToDOM(newMsg, true);
    
    // Update thread preview
    updateThreadPreviewDirect(activeThread.uid, newMsg);

    // Simulated responsive reply for demo immersion
    simulateIncomingReply(chatId);
  }

  function updateThreadPreviewDirect(threadUid, msg) {
    const thread = allThreads.find(t => t.uid === threadUid);
    if (thread) {
      thread.lastMsg = msg;
      // Re-sort thread list in background
      allThreads.sort((a, b) => {
        const aTime = a.lastMsg ? a.lastMsg.timestamp : 0;
        const bTime = b.lastMsg ? b.lastMsg.timestamp : 0;
        return bTime - aTime;
      });
      renderThreadsList();
    }
  }

  function clearStaging() {
    stagedAttachment = null;
    const bar = document.getElementById('msg-attachment-staging');
    if (bar) bar.style.display = 'none';
  }

  function stageFileAttachment(file, isImage) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const dataUrl = e.target.result;
      if (isImage) {
        stagedAttachment = {
          type: file.type,
          data: dataUrl,
          name: file.name
        };
        const img = document.getElementById('staging-img-preview');
        const fileWrap = document.getElementById('staging-file-preview');
        if (img) { img.src = dataUrl; img.style.display = 'block'; }
        if (fileWrap) fileWrap.style.display = 'none';
      } else {
        stagedAttachment = {
          type: file.type || 'application/pdf',
          name: file.name,
          size: Math.round(file.size / 1024) + ' KB',
          data: dataUrl
        };
        const img = document.getElementById('staging-img-preview');
        const fileWrap = document.getElementById('staging-file-preview');
        const fileNameEl = document.getElementById('staging-file-name');
        if (img) img.style.display = 'none';
        if (fileWrap) fileWrap.style.display = 'flex';
        if (fileNameEl) fileNameEl.textContent = file.name;
      }

      const bar = document.getElementById('msg-attachment-staging');
      const title = document.getElementById('staging-title');
      const size = document.getElementById('staging-size');
      if (title) title.textContent = file.name;
      if (size) size.textContent = Math.round(file.size / 1024) + ' KB ready to send';
      if (bar) bar.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  // Simulated Automatic Teacher / Bot Feedback
  function simulateIncomingReply(chatId) {
    if (!activeThread || activeThread.isGroup) return;

    // Simulate only for specific peers when user is not the peer
    const targetPeerUid = activeThread.uid;
    if (targetPeerUid === activeUser.uid) return;

    setTimeout(async () => {
      let replyText = "Received! Thank you for the update. I will review this promptly.";
      if (activeThread.role === 'teacher') {
        replyText = "Thank you! I have noted this in our academic advisory log. Let me know if you need consultation during office hours.";
      } else if (activeThread.role === 'learner') {
        replyText = "Understood sir/ma'am! I will complete the module and review the materials tonight.";
      } else if (activeThread.role === 'parent') {
        replyText = "Thank you for informing me! We appreciate the proactive communication from the school.";
      }

      const replyMsg = await dbService.sendMessage(chatId, targetPeerUid, replyText, null);
      playReceiveSound();
      if (activeThread && activeThread.uid === targetPeerUid) {
        appendSingleMessageToDOM(replyMsg, false);
      }
      updateThreadPreviewDirect(targetPeerUid, replyMsg);
    }, 1800);
  }

  // ==========================================
  // RIGHT ACADEMIC INFO PANE
  // ==========================================

  function renderInfoPane() {
    if (!activeThread) return;
    const avatarEl = document.getElementById('info-avatar');
    const nameEl = document.getElementById('info-name');
    const roleEl = document.getElementById('info-role-badge');
    const emailEl = document.getElementById('info-email');
    const deptEl = document.getElementById('info-department');
    const roomEl = document.getElementById('info-room');
    const hoursEl = document.getElementById('info-hours');

    if (avatarEl) avatarEl.src = activeThread.avatar;
    if (nameEl) nameEl.textContent = activeThread.name;
    if (roleEl) {
      roleEl.textContent = activeThread.isGroup ? 'SCHOOL CHANNEL' : (activeThread.role || 'USER').toUpperCase();
    }
    if (emailEl) {
      emailEl.textContent = activeThread.isGroup ? 'advisory-group@school.edu' : (activeThread.email || 'user@school.edu');
    }
    if (deptEl) {
      deptEl.textContent = activeThread.isGroup ? 'Integrated High School Department' : (activeThread.role === 'teacher' ? 'STEM & Mathematics Department' : 'Academic Advisory');
    }
    if (roomEl) {
      roomEl.textContent = activeThread.isGroup ? 'Digital Channel & Gymnasium' : (activeThread.role === 'teacher' ? 'Room 204 - STEM Laboratory' : 'Campus Main Wing');
    }
    if (hoursEl) {
      hoursEl.textContent = 'Mon - Fri, 8:00 AM - 4:00 PM';
    }

    // Render shared academic files from conversation
    renderSharedFiles();
  }

  async function renderSharedFiles() {
    if (!activeThread || !activeUser) return;
    const container = document.getElementById('info-files-list');
    const countBadge = document.getElementById('info-files-count');
    if (!container) return;

    const chatId = activeThread.isGroup ? activeThread.uid : [activeUser.uid, activeThread.uid].sort().join('_');
    const messages = await dbService.getMessages(chatId);
    const files = messages.filter(m => m.fileAttachment || m.imageData);

    if (countBadge) countBadge.textContent = files.length;

    if (files.length === 0) {
      container.innerHTML = `<div class="empty-files-text">No documents shared yet in this thread.</div>`;
      return;
    }

    container.innerHTML = files.slice(0, 5).map(f => {
      const isImg = !!f.imageData;
      const fileName = isImg ? 'Shared Photo / Diagram' : (f.fileAttachment?.name || 'Academic File');
      const icon = isImg ? 'image' : 'document-text';
      return `
        <div class="info-data-row" style="padding:0.4rem 0; border-bottom:1px solid var(--border-color); display:flex; flex-direction:row; align-items:center; gap:0.5rem;">
          <ion-icon name="${icon}" style="font-size:1.2rem; color:var(--primary);"></ion-icon>
          <span style="font-size:0.78rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${escapeHTML(fileName)}</span>
          <span style="font-size:0.65rem; color:var(--text-secondary);">${formatMsgTime(f.timestamp)}</span>
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // SIMULATED AUDIO & VIDEO CALLS
  // ==========================================

  window.startSchoolCall = function (callType) {
    if (!activeThread) {
      showToast('Please select a faculty member or conversation first!');
      return;
    }

    const modal = document.getElementById('modal-call-interface');
    const remoteAvatar = document.getElementById('call-remote-avatar');
    const remoteName = document.getElementById('call-remote-name');
    const statusText = document.getElementById('call-status-state');
    const videoFeed = document.getElementById('call-simulated-video');

    if (remoteAvatar) remoteAvatar.src = activeThread.avatar;
    if (remoteName) remoteName.textContent = activeThread.name;
    if (statusText) statusText.textContent = callType === 'video' ? 'Connecting to School Video Feed...' : 'Connecting to Encrypted Audio...';
    if (videoFeed) videoFeed.style.display = callType === 'video' ? 'block' : 'none';

    if (modal) modal.style.display = 'flex';

    // Start timer simulation
    callSeconds = 0;
    const timerEl = document.getElementById('call-duration-timer');
    if (timerEl) timerEl.textContent = '00:00';

    clearInterval(callTimerInterval);
    callTimerInterval = setInterval(() => {
      callSeconds++;
      const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
      const secs = String(callSeconds % 60).padStart(2, '0');
      if (timerEl) timerEl.textContent = `${mins}:${secs}`;
      if (callSeconds === 2 && statusText) {
        statusText.textContent = 'Academic Call in Progress';
      }
    }, 1000);

    playTone(600, 'sine', 0.2);
  };

  window.endSchoolCall = function () {
    clearInterval(callTimerInterval);
    const modal = document.getElementById('modal-call-interface');
    if (modal) modal.style.display = 'none';
    showToast('Call ended. Total duration: ' + document.getElementById('call-duration-timer')?.textContent);
  };

  // ==========================================
  // LIGHTBOX & MODALS
  // ==========================================

  window.openLightbox = function (imgSrc) {
    const box = document.getElementById('msg-lightbox');
    const img = document.getElementById('lightbox-img');
    if (box && img) {
      img.src = imgSrc;
      box.style.display = 'flex';
    }
  };

  window.closeLightbox = function () {
    const box = document.getElementById('msg-lightbox');
    if (box) box.style.display = 'none';
  };

  window.closeModal = function (modalId) {
    const m = document.getElementById(modalId);
    if (m) m.style.display = 'none';
  };

  // ==========================================
  // CLAYMORPHISM BUILT-IN AVATAR LIBRARY
  // ==========================================

  const CLAY_PALETTES = {
    mint: { name: 'Mint Forest', hex: 'bbf7d0', bg: 'linear-gradient(145deg, #f0fdf4, #bbf7d0)' },
    sky: { name: 'Sky Academic', hex: 'bfdbfe', bg: 'linear-gradient(145deg, #eff6ff, #bfdbfe)' },
    peach: { name: 'Coral Peach', hex: 'fed7aa', bg: 'linear-gradient(145deg, #fff7ed, #fed7aa)' },
    lavender: { name: 'Lilac Scholar', hex: 'ddd6fe', bg: 'linear-gradient(145deg, #faf5ff, #ddd6fe)' },
    amber: { name: 'Golden Honey', hex: 'fde68a', bg: 'linear-gradient(145deg, #fffbeb, #fde68a)' },
    rose: { name: 'Rose Quartz', hex: 'fbcfe8', bg: 'linear-gradient(145deg, #fdf2f8, #fbcfe8)' }
  };

  const CLAY_AVATARS = [
    // 1. Faculty & Staff
    {
      id: 'clay-admin-1',
      name: 'Dr. Maria Santos',
      role: 'Principal / Admin',
      category: 'faculty',
      seed: 'MariaSantos',
      hair: 'dougFunny',
      style: 'micah',
      clayColor: 'mint'
    },
    {
      id: 'clay-teacher-1',
      name: 'Teacher Jose',
      role: 'STEM & Math Faculty',
      category: 'faculty',
      seed: 'TeacherJose',
      hair: 'mrT',
      style: 'micah',
      clayColor: 'sky'
    },
    {
      id: 'clay-teacher-2',
      name: 'Prof. Elena Ramos',
      role: 'Languages & Literature',
      category: 'faculty',
      seed: 'ProfElena',
      hair: 'full',
      style: 'micah',
      clayColor: 'peach'
    },
    {
      id: 'clay-teacher-3',
      name: 'Coach Marcus',
      role: 'Athletics & PE Dept',
      category: 'faculty',
      seed: 'CoachMarcus',
      hair: 'pixie',
      style: 'micah',
      clayColor: 'amber'
    },
    {
      id: 'clay-teacher-4',
      name: 'Counselor Grace',
      role: 'Guidance Services',
      category: 'faculty',
      seed: 'CounselorGrace',
      hair: 'full',
      style: 'micah',
      clayColor: 'lavender'
    },

    // 2. Scholars & Learners
    {
      id: 'clay-student-1',
      name: 'Juan Cruz',
      role: 'Grade 10 STEM Scholar',
      category: 'student',
      seed: 'JuanCruz',
      hair: 'fonze',
      style: 'micah',
      clayColor: 'mint'
    },
    {
      id: 'clay-student-2',
      name: 'Maya Lin',
      role: 'Math Olympiad Team',
      category: 'student',
      seed: 'MayaScholar',
      hair: 'dannyPhantom',
      style: 'micah',
      clayColor: 'lavender'
    },
    {
      id: 'clay-student-3',
      name: 'Leo Park',
      role: 'Robotics Club Captain',
      category: 'student',
      seed: 'LeoRobotics',
      hair: 'turban',
      style: 'micah',
      clayColor: 'sky'
    },
    {
      id: 'clay-student-4',
      name: 'Chloe Tan',
      role: 'Arts & Music Society',
      category: 'student',
      seed: 'ChloeArts',
      hair: 'full',
      style: 'micah',
      clayColor: 'rose'
    },
    {
      id: 'clay-student-5',
      name: 'Alex Gomez',
      role: 'Debate Council Lead',
      category: 'student',
      seed: 'AlexScience',
      hair: 'dougFunny',
      style: 'micah',
      clayColor: 'amber'
    },
    {
      id: 'clay-student-6',
      name: 'Sofia Reyes',
      role: 'Senior High President',
      category: 'student',
      seed: 'SofiaDebate',
      hair: 'pixie',
      style: 'micah',
      clayColor: 'peach'
    },

    // 3. Parents & Guardians
    {
      id: 'clay-parent-1',
      name: 'Mrs. Elena Cruz',
      role: 'PTA Vice President',
      category: 'parent',
      seed: 'MrsCruz',
      hair: 'full',
      style: 'micah',
      clayColor: 'peach'
    },
    {
      id: 'clay-parent-2',
      name: 'Mr. Ramon Cruz',
      role: 'Alumni Association',
      category: 'parent',
      seed: 'MrRamon',
      hair: 'fonze',
      style: 'micah',
      clayColor: 'sky'
    },
    {
      id: 'clay-parent-3',
      name: 'Dr. David Lim',
      role: 'Parent Advisory Board',
      category: 'parent',
      seed: 'AttyDavid',
      hair: 'mrT',
      style: 'micah',
      clayColor: 'mint'
    },

    // 4. Mascots & 3D Clay Figures
    {
      id: 'clay-mascot-1',
      name: 'Apex Robo-Guide',
      role: 'STEM AI Mascot',
      category: 'mascot',
      seed: 'ApexRobo',
      style: 'bottts',
      clayColor: 'sky'
    },
    {
      id: 'clay-mascot-2',
      name: 'Cyber-Bot 2026',
      role: 'Coding Club Mascot',
      category: 'mascot',
      seed: 'CyberBot',
      style: 'bottts',
      clayColor: 'mint'
    },
    {
      id: 'clay-mascot-3',
      name: 'Joyful Star',
      role: 'Academic Star Award',
      category: 'mascot',
      seed: 'StarScholar',
      style: 'fun-emoji',
      clayColor: 'amber'
    },
    {
      id: 'clay-mascot-4',
      name: 'Apex Falcon',
      role: 'School Sports Mascot',
      category: 'mascot',
      seed: 'Falcon',
      style: 'icons',
      clayColor: 'rose'
    }
  ];

  function getClayAvatarUrl(item, colorKey) {
    const palette = CLAY_PALETTES[colorKey] || CLAY_PALETTES.mint;
    const bg = palette.hex;
    if (item.style === 'bottts') {
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.seed)}&backgroundColor=${bg}`;
    }
    if (item.style === 'fun-emoji') {
      return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(item.seed)}&backgroundColor=${bg}`;
    }
    if (item.style === 'icons') {
      return `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(item.seed)}&backgroundColor=${bg}`;
    }
    const hairParam = item.hair ? `&hair=${item.hair}` : '';
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(item.seed)}&backgroundColor=${bg}${hairParam}`;
  }

  let selectedClayAvatar = CLAY_AVATARS[0];
  let currentClayColor = 'mint';
  let clayCategoryFilter = 'all';

  window.openClayAvatarModal = function () {
    const modal = document.getElementById('modal-clay-avatar-picker');
    if (!modal) return;

    // Default to matching active user or first avatar
    const existing = CLAY_AVATARS.find(a => activeUser && activeUser.avatar && activeUser.avatar.includes(a.seed));
    if (existing) {
      selectedClayAvatar = existing;
      currentClayColor = existing.clayColor || 'mint';
    } else {
      selectedClayAvatar = CLAY_AVATARS[0];
      currentClayColor = 'mint';
    }

    clayCategoryFilter = 'all';
    
    // Update count
    const totalEl = document.getElementById('clay-total-count');
    if (totalEl) totalEl.textContent = CLAY_AVATARS.length;

    renderClayCategoryPills();
    renderClayAvatarsGrid();
    updateClayPreviewHero();
    modal.style.display = 'flex';
  };

  function renderClayCategoryPills() {
    document.querySelectorAll('.clay-cat-pill').forEach(pill => {
      const cat = pill.dataset.cat || 'all';
      pill.classList.toggle('active', cat === clayCategoryFilter);
      pill.onclick = () => {
        clayCategoryFilter = cat;
        renderClayCategoryPills();
        renderClayAvatarsGrid();
      };
    });
  }

  function renderClayAvatarsGrid() {
    const grid = document.getElementById('clay-avatars-grid');
    if (!grid) return;

    const filtered = CLAY_AVATARS.filter(a => {
      if (clayCategoryFilter === 'all') return true;
      return a.category === clayCategoryFilter;
    });

    grid.innerHTML = filtered.map(item => {
      const isSelected = selectedClayAvatar && selectedClayAvatar.id === item.id;
      const avatarUrl = getClayAvatarUrl(item, currentClayColor);
      const palette = CLAY_PALETTES[currentClayColor] || CLAY_PALETTES.mint;

      return `
        <div class="clay-card-item ${isSelected ? 'selected' : ''}" 
             onclick="selectClayAvatar('${item.id}')"
             title="${escapeHTML(item.name)} (${escapeHTML(item.role)})">
          <div class="clay-card-check"><ion-icon name="checkmark"></ion-icon></div>
          <div class="clay-card-thumb-wrap" style="background:${palette.bg};">
            <img src="${avatarUrl}" alt="${escapeHTML(item.name)}">
          </div>
          <span class="clay-card-name">${escapeHTML(item.name)}</span>
          <span class="clay-card-role">${escapeHTML(item.role)}</span>
        </div>
      `;
    }).join('');
  }

  window.selectClayAvatar = function (avatarId) {
    const item = CLAY_AVATARS.find(a => a.id === avatarId);
    if (!item) return;
    selectedClayAvatar = item;
    renderClayAvatarsGrid();
    updateClayPreviewHero();
  };

  function updateClayPreviewHero() {
    if (!selectedClayAvatar) return;
    const stage = document.getElementById('clay-preview-stage');
    const img = document.getElementById('clay-preview-avatar-img');
    const nameEl = document.getElementById('clay-preview-name');
    const roleEl = document.getElementById('clay-preview-role');
    const captionEl = document.getElementById('clay-preview-caption');

    const palette = CLAY_PALETTES[currentClayColor] || CLAY_PALETTES.mint;
    const avatarUrl = getClayAvatarUrl(selectedClayAvatar, currentClayColor);

    if (stage) stage.style.background = palette.bg;
    if (img) img.src = avatarUrl;
    if (nameEl) nameEl.textContent = selectedClayAvatar.name;
    if (roleEl) roleEl.textContent = (selectedClayAvatar.category || 'USER').toUpperCase();
    if (captionEl) captionEl.textContent = `${selectedClayAvatar.role} • ${palette.name} Tint`;

    // Update active swatch
    document.querySelectorAll('.clay-swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color === currentClayColor);
    });
  }

  function wireClaySwatches() {
    document.querySelectorAll('.clay-swatch').forEach(sw => {
      sw.onclick = () => {
        currentClayColor = sw.dataset.color || 'mint';
        updateClayPreviewHero();
        renderClayAvatarsGrid();
      };
    });

    const applyBtn = document.getElementById('btn-apply-clay-avatar');
    if (applyBtn) {
      applyBtn.onclick = applySelectedClayAvatar;
    }
  }

  async function applySelectedClayAvatar() {
    if (!selectedClayAvatar || !activeUser) return;
    const newAvatarUrl = getClayAvatarUrl(selectedClayAvatar, currentClayColor);

    activeUser.avatar = newAvatarUrl;

    // Save permanently in database
    await dbService.saveUser(activeUser.uid, { avatar: newAvatarUrl });
    try {
      sessionStorage.setItem('activeUser', JSON.stringify(activeUser));
    } catch (e) {}

    // Live update all avatar elements on page
    syncUserTopBar();
    const infoAvatar = document.getElementById('info-avatar');
    if (infoAvatar) {
      infoAvatar.src = newAvatarUrl;
    }

    // Re-render chat messages and threads to reflect new avatar
    renderMessages();
    loadThreads();

    closeModal('modal-clay-avatar-picker');
    playTone(880, 'sine', 0.2);
    showToast(`Claymorphic avatar updated to ${selectedClayAvatar.name}!`);
  }

  // ==========================================
  // EVENT WIRINGS & LIFECYCLE
  // ==========================================

  function wireEvents() {
    wireClaySwatches();

    // Theme Toggle
    const themeBtn = document.getElementById('msg-theme-toggle');
    const themeIcon = document.getElementById('msg-theme-icon');
    if (themeBtn) {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
      if (themeIcon) themeIcon.setAttribute('name', activeTheme === 'dark' ? 'sunny-outline' : 'moon-outline');
      themeBtn.setAttribute('title', activeTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');

      themeBtn.onclick = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        try { localStorage.setItem('theme', nextTheme); } catch (e) {}
        if (themeIcon) themeIcon.setAttribute('name', nextTheme === 'dark' ? 'sunny-outline' : 'moon-outline');
        themeBtn.setAttribute('title', nextTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      };
    }

    // Persona Switcher Toggle
    const personaBtn = document.getElementById('btn-msg-persona');
    const personaDropdown = document.getElementById('msg-persona-dropdown');
    if (personaBtn && personaDropdown) {
      personaBtn.onclick = (e) => {
        e.stopPropagation();
        personaDropdown.classList.toggle('show');
      };
    }

    document.querySelectorAll('.persona-option').forEach(opt => {
      opt.onclick = () => {
        const uid = opt.dataset.uid;
        const email = opt.dataset.email;
        window.switchPersona(uid, email);
      };
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#msg-persona-wrap')) {
        closePersonaDropdown();
      }
      if (!e.target.closest('#btn-msg-school-tools') && !e.target.closest('#msg-tools-popover')) {
        const p = document.getElementById('msg-tools-popover');
        if (p) p.style.display = 'none';
      }
      if (!e.target.closest('#btn-msg-emoji') && !e.target.closest('#msg-emoji-popover')) {
        const ep = document.getElementById('msg-emoji-popover');
        if (ep) ep.style.display = 'none';
      }
    });

    // Category Tabs
    document.querySelectorAll('.msg-cat-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.msg-cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter || 'all';
        renderThreadsList();
      };
    });

    // Search Box
    const searchInput = document.getElementById('msg-search-input');
    const clearBtn = document.getElementById('btn-clear-msg-search');
    if (searchInput) {
      const debouncedSearch = debounce(() => renderThreadsList(), 120);
      searchInput.oninput = () => {
        if (clearBtn) clearBtn.style.display = searchInput.value ? 'block' : 'none';
        debouncedSearch();
      };
    }
    if (clearBtn) {
      clearBtn.onclick = () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        clearBtn.style.display = 'none';
        renderThreadsList();
      };
    }

    // Composer Input & Auto-Grow
    const msgInput = document.getElementById('msg-text-input');
    if (msgInput) {
      msgInput.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      };
      msgInput.oninput = function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      };
    }

    // Send Button
    const sendBtn = document.getElementById('btn-msg-send');
    if (sendBtn) sendBtn.onclick = sendMessage;

    // Mobile Back Button
    const mobileBackBtn = document.getElementById('btn-msg-mobile-back');
    if (mobileBackBtn) {
      mobileBackBtn.onclick = () => {
        const appRoot = document.getElementById('msg-app-root');
        if (appRoot) appRoot.classList.remove('mobile-chat-active');
      };
    }

    // Attach Photo Trigger
    const btnAttachPhoto = document.getElementById('btn-msg-attach-photo');
    const photoInput = document.getElementById('msg-photo-input');
    if (btnAttachPhoto && photoInput) {
      btnAttachPhoto.onclick = () => photoInput.click();
      photoInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          stageFileAttachment(e.target.files[0], true);
        }
      };
    }

    // Attach Document Trigger
    const btnAttachDoc = document.getElementById('btn-msg-attach-doc');
    const docInput = document.getElementById('msg-document-input');
    if (btnAttachDoc && docInput) {
      btnAttachDoc.onclick = () => docInput.click();
      docInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          stageFileAttachment(e.target.files[0], false);
        }
      };
    }

    // Cancel Staging
    const cancelStagingBtn = document.getElementById('btn-cancel-staging');
    if (cancelStagingBtn) cancelStagingBtn.onclick = clearStaging;

    // Simulated Voice Note
    const voiceBtn = document.getElementById('btn-msg-voice-note');
    if (voiceBtn) {
      voiceBtn.onclick = () => {
        showToast('Recording 5s academic voice note...');
        playTone(550, 'sine', 0.2);
        setTimeout(() => {
          stagedAttachment = {
            isVoice: true,
            duration: '0:05',
            audioData: null
          };
          const bar = document.getElementById('msg-attachment-staging');
          const title = document.getElementById('staging-title');
          const size = document.getElementById('staging-size');
          const img = document.getElementById('staging-img-preview');
          const fileWrap = document.getElementById('staging-file-preview');
          const fileNameEl = document.getElementById('staging-file-name');
          if (img) img.style.display = 'none';
          if (fileWrap) fileWrap.style.display = 'flex';
          if (fileNameEl) fileNameEl.textContent = 'Voice Note (0:05)';
          if (title) title.textContent = 'Voice Memo / Pronunciation Note';
          if (size) size.textContent = 'Audio ready to send';
          if (bar) bar.style.display = 'flex';
          showToast('Voice note recorded and staged! Press Send.');
        }, 1200);
      };
    }

    // School Tools Popover Trigger
    const toolsBtn = document.getElementById('btn-msg-school-tools');
    const toolsPopover = document.getElementById('msg-tools-popover');
    if (toolsBtn && toolsPopover) {
      toolsBtn.onclick = (e) => {
        e.stopPropagation();
        toolsPopover.style.display = toolsPopover.style.display === 'block' ? 'none' : 'block';
      };
    }

    // Quick Tool Actions
    document.querySelectorAll('.popover-item').forEach(item => {
      item.onclick = () => {
        const action = item.dataset.action;
        const input = document.getElementById('msg-text-input');
        if (!input) return;

        if (action === 'assignment') {
          input.value = "📚 Assignment: Please complete Module 4 exercises on page 82. Due Friday 5:00 PM.";
        } else if (action === 'consultation') {
          input.value = "⏱️ Request for Consultation: Seeking academic guidance regarding Second Quarter research competencies.";
        } else if (action === 'location') {
          input.value = "📍 Location: Main Science Wing - STEM Laboratory Room 204.";
        } else if (action === 'excuse') {
          input.value = "📝 Medical Excuse Notice: Please excuse my learner due to health consultation. Medical certificate will be submitted.";
        } else if (action === 'resource') {
          input.value = "📂 Learning Resource: Supplementary reference module uploaded to portal library.";
        }

        input.focus();
        if (toolsPopover) toolsPopover.style.display = 'none';
      };
    });

    // Emoji Popover Trigger
    const emojiBtn = document.getElementById('btn-msg-emoji');
    const emojiPopover = document.getElementById('msg-emoji-popover');
    if (emojiBtn && emojiPopover) {
      emojiBtn.onclick = (e) => {
        e.stopPropagation();
        emojiPopover.style.display = emojiPopover.style.display === 'block' ? 'none' : 'block';
      };
    }

    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.onclick = () => {
        const input = document.getElementById('msg-text-input');
        if (input) {
          input.value += btn.textContent;
          input.focus();
        }
        if (emojiPopover) emojiPopover.style.display = 'none';
      };
    });

    // Call Buttons
    const audioCallBtn = document.getElementById('btn-msg-audio-call');
    const videoCallBtn = document.getElementById('btn-msg-video-call');
    const endCallBtn = document.getElementById('btn-call-hangup');

    if (audioCallBtn) audioCallBtn.onclick = () => window.startSchoolCall('audio');
    if (videoCallBtn) videoCallBtn.onclick = () => window.startSchoolCall('video');
    if (endCallBtn) endCallBtn.onclick = window.endSchoolCall;

    // Toggle Info Pane
    const infoToggleBtn = document.getElementById('btn-msg-toggle-info');
    const infoCloseBtn = document.getElementById('btn-close-info-pane');
    const infoPane = document.getElementById('msg-info-pane');
    if (infoToggleBtn && infoPane) {
      infoToggleBtn.onclick = () => infoPane.classList.toggle('hidden');
    }
    if (infoCloseBtn && infoPane) {
      infoCloseBtn.onclick = () => infoPane.classList.add('hidden');
    }

    // Clear Chat
    const clearChatBtn = document.getElementById('btn-info-clear-chat');
    if (clearChatBtn) {
      clearChatBtn.onclick = async () => {
        if (!activeThread) return;
        if (confirm(`Clear all messages in conversation with ${activeThread.name}?`)) {
          const chatId = activeThread.isGroup ? activeThread.uid : [activeUser.uid, activeThread.uid].sort().join('_');
          await dbService.clearMessages(chatId);
          renderMessages();
          loadThreads();
          showToast('Conversation cleared.');
        }
      };
    }

    // In-Chat Search
    const searchChatBtn = document.getElementById('btn-msg-search-chat');
    const inChatSearchWrap = document.getElementById('msg-in-chat-search');
    const closeInChatSearch = document.getElementById('btn-close-in-chat-search');
    const inChatSearchInput = document.getElementById('msg-in-chat-search-input');

    if (searchChatBtn && inChatSearchWrap) {
      searchChatBtn.onclick = () => {
        inChatSearchWrap.style.display = inChatSearchWrap.style.display === 'flex' ? 'none' : 'flex';
        if (inChatSearchInput) inChatSearchInput.focus();
      };
    }
    if (closeInChatSearch && inChatSearchWrap) {
      closeInChatSearch.onclick = () => {
        inChatSearchWrap.style.display = 'none';
        if (inChatSearchInput) inChatSearchInput.value = '';
      };
    }
    if (inChatSearchInput) {
      const debouncedInChatFilter = debounce((query) => {
        document.querySelectorAll('.msg-bubble').forEach(b => {
          if (!query) {
            b.style.opacity = '1';
          } else {
            const matches = b.innerText.toLowerCase().includes(query);
            b.style.opacity = matches ? '1' : '0.25';
          }
        });
      }, 100);
      inChatSearchInput.oninput = () => {
        debouncedInChatFilter(inChatSearchInput.value.toLowerCase().trim());
      };
    }

    // New Direct Message Modal Trigger
    const btnNewChat = document.getElementById('btn-msg-new-chat');
    if (btnNewChat) {
      btnNewChat.onclick = () => {
        const modal = document.getElementById('modal-new-dm');
        const list = document.getElementById('dm-directory-list');
        if (modal && list) {
          const local = getLocalDB();
          const users = Object.values(local.users).filter(u => u.uid !== activeUser.uid);
          list.innerHTML = users.map(u => `
            <div class="persona-option" style="padding:0.6rem; border-bottom:1px solid var(--border-color); cursor:pointer;" 
                 onclick="startDirectMessageWith('${u.uid}')">
              <img class="clay-avatar" src="${escapeHTML(u.avatar)}" alt="${escapeHTML(u.name)}" style="width:40px; height:40px;">
              <div class="option-details" style="margin-left:0.5rem;">
                <span class="option-name">${escapeHTML(u.name)}</span>
                <span class="option-sub"><span class="badge-tag ${u.role}">${u.role.toUpperCase()}</span> &bull; ${escapeHTML(u.email)}</span>
              </div>
            </div>
          `).join('');
          modal.style.display = 'flex';
        }
      };
    }

    window.startDirectMessageWith = function (targetUid) {
      closeModal('modal-new-dm');
      selectThread(targetUid);
    };

    // New Channel Modal Trigger
    const btnNewGroup = document.getElementById('btn-msg-new-group');
    if (btnNewGroup) {
      btnNewGroup.onclick = () => {
        const modal = document.getElementById('modal-new-group');
        const selector = document.getElementById('group-participants-selector');
        if (modal && selector) {
          const local = getLocalDB();
          const users = Object.values(local.users).filter(u => u.uid !== activeUser.uid);
          selector.innerHTML = users.map(u => `
            <label style="display:flex; align-items:center; gap:0.5rem; padding:0.4rem 0; font-size:0.85rem; cursor:pointer;">
              <input type="checkbox" value="${u.uid}" checked>
              <span>${escapeHTML(u.name)} (${u.role.toUpperCase()})</span>
            </label>
          `).join('');
          modal.style.display = 'flex';
        }
      };
    }

    const btnSubmitCreateGroup = document.getElementById('btn-submit-create-group');
    if (btnSubmitCreateGroup) {
      btnSubmitCreateGroup.onclick = async () => {
        const nameInput = document.getElementById('group-name-input');
        const categorySelect = document.getElementById('group-category-select');
        const name = nameInput ? nameInput.value.trim() : '';
        const category = categorySelect ? categorySelect.value : 'channel';

        if (!name) {
          showToast('Please enter a channel name!');
          return;
        }

        const checkedBoxes = document.querySelectorAll('#group-participants-selector input:checked');
        const participants = [activeUser.uid, ...Array.from(checkedBoxes).map(cb => cb.value)];

        const groupId = await dbService.createGroupChat(name, participants, category);
        closeModal('modal-new-group');
        if (nameInput) nameInput.value = '';
        showToast(`School Channel "${name}" created!`);

        await loadThreads();
        selectThread(groupId);
      };
    }
  }

  // App Initialization
  async function init() {
    await initUserSession();
    wireEvents();
    await loadThreads();

    // Check if a specific conversation/user was requested via query param (e.g. ?uid=teacher1 or ?chat=teacher1)
    const urlParams = new URLSearchParams(window.location.search);
    const targetUid = urlParams.get('uid') || urlParams.get('chat') || urlParams.get('user');
    const matchedThread = targetUid ? allThreads.find(t => t.uid === targetUid) : null;

    if (matchedThread) {
      selectThread(matchedThread.uid);
    } else if (targetUid) {
      // If thread doesn't exist yet in allThreads, try to fetch the user and open direct message
      const targetUser = await dbService.getUser(targetUid);
      if (targetUser) {
        allThreads.unshift({
          uid: targetUser.uid,
          name: targetUser.name,
          avatar: targetUser.avatar,
          role: targetUser.role,
          isGroup: false,
          unreadCount: 0
        });
        renderThreadsList();
        selectThread(targetUser.uid);
      } else if (allThreads.length > 0 && window.innerWidth > 768) {
        selectThread(allThreads[0].uid);
      } else {
        renderWelcomeState();
      }
    } else if (window.innerWidth > 768 && allThreads.length > 0) {
      selectThread(allThreads[0].uid);
    } else {
      renderWelcomeState();
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();
