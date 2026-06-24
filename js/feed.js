// ==========================================
// DYNAMIC VIEW RENDERERS (FB SCHOOL NEWSFEED)
// ==========================================

function generateStories() {
  const container = document.getElementById('stories-container-feed');
  if (!container) return;
  
  let html = `
    <div class="story-card add-story">
      <div class="story-avatar"><ion-icon name="add"></ion-icon></div>
      <span class="story-name">Create Story</span>
    </div>
  `;

  // Scrape pinned memos from the sidebar
  document.querySelectorAll('.pinned-item').forEach(item => {
    const title = item.querySelector('span:nth-child(2)').innerText;
    const isEmergency = item.querySelector('span:first-child').innerText.toLowerCase() === 'emergency';
    const bgSrc = isEmergency ? 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=150&auto=format&fit=crop&q=80' : 'https://api.dicebear.com/7.x/micah/svg?seed=' + encodeURIComponent(title);
    
    html += `
      <div class="story-card has-story" title="Pinned: ${title}">
        <img src="${bgSrc}" class="story-avatar">
        <span class="story-name">${title}</span>
      </div>
    `;
  });

  // Scrape agenda items
  const agendaList = document.getElementById('agenda-widget-list');
  if (agendaList) {
    agendaList.querySelectorAll('li').forEach(item => {
      // The agenda title is the first div inside the second flex child
      const textDivs = item.querySelectorAll('div > div');
      if (textDivs.length >= 3) {
        const title = textDivs[2].innerText; // The title is the 3rd deepest div text
        html += `
          <div class="story-card has-story" title="Agenda: ${title}">
            <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=150&auto=format&fit=crop&q=80" class="story-avatar">
            <span class="story-name">${title}</span>
          </div>
        `;
      }
    });
  }

  container.innerHTML = html;
}

let currentFeedFilter = 'all';

async function renderNewsfeed(filterType = currentFeedFilter) {
  currentFeedFilter = filterType;
  generateStories();
  const container = document.getElementById('school-newsfeed-container');
  if (!container) return;

  const announcements = await dbService.getAnnouncements();
  
  const userRole = activeUser ? activeUser.role : 'guest';
  let filtered = announcements.filter(a => {
    // 1. Status Filter
    if (a.status !== 'approved') return false;
    
    // 2. Audience Filter
    if (a.audiences && !a.audiences.includes('all')) {
      if (!a.audiences.includes(userRole)) return false;
    }
    
    // 3. Type Filter
    if (filterType !== 'all') {
      // Map filter pills to types
      const typeMap = {
        'announcements': 'standard',
        'achievements': 'achievement',
        'events': 'event',
        'polls': 'poll'
      };
      if (a.type !== typeMap[filterType] && filterType !== 'resources') return false;
    }
    
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="padding: 2rem; text-align: center; color:var(--text-secondary)">No news or announcements found for this filter.</p>`;
    return;
  }

  container.innerHTML = filtered.map(a => {
    const likes = a.likes || [];
    const userHasLiked = activeUser ? likes.includes(activeUser.uid) : false;
    
    let innerCardHTML = '';
    const titleText = a.title ? `<h3 class="news-title" style="font-size:1.2rem; margin-bottom:0.75rem;">${a.title}</h3>` : '';
    const contentText = `<p style="color:var(--text-secondary); margin-bottom:1rem; font-size:0.95rem;">${a.content}</p>`;

    if (a.type === 'announcement') {
      innerCardHTML = `
        <div style="background:rgba(239, 68, 68, 0.1); color:var(--danger); font-size:0.75rem; font-weight:800; padding:0.3rem 0.6rem; border-radius:var(--radius-sm); display:inline-block; margin-bottom:0.75rem; border:1px solid rgba(239, 68, 68, 0.3);">
          <ion-icon name="megaphone"></ion-icon> OFFICIAL ANNOUNCEMENT
        </div>
        ${titleText}
        <p style="color:var(--text-primary); margin-bottom:1rem; font-size:1.05rem; font-weight:600;">${a.content}</p>
      `;
    } else if (a.type === 'achievement') {
      innerCardHTML = `
        <div class="achievement-badge"><ion-icon name="trophy"></ion-icon> Achievement</div>
        ${titleText}
        <p style="color:var(--text-secondary); margin-bottom:1rem; font-size:1rem; font-weight:500;">${a.content}</p>
      `;
    } else if (a.type === 'event') {
      const eData = a.extraData || {};
      const rsvps = eData.rsvps || [];
      const userGoing = activeUser ? rsvps.includes(activeUser.uid) : false;
      const goingBtnStyle = userGoing ? "background:var(--primary); color:white;" : "background:var(--bg-secondary); color:var(--primary);";
      
      innerCardHTML = `
        <h3 class="news-title" style="font-size:1.2rem; margin-bottom:0.75rem;">${eData.eventTitle || a.title || 'School Event'}</h3>
        ${contentText}
        <div class="event-details" style="background:var(--bg-secondary); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:1rem;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;"><ion-icon name="calendar" style="color:var(--primary);"></ion-icon> <strong>${eData.date || a.eventDate}</strong> at ${eData.time || a.eventTime}</div>
          <div style="display:flex; align-items:center; gap:0.5rem;"><ion-icon name="location" style="color:var(--primary);"></ion-icon> ${eData.location || a.eventLocation}</div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.75rem; border-top:1px dashed var(--border-color); padding-top:0.75rem;">
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">${rsvps.length || a.eventGoing || 0} people going</span>
            <button class="btn-action btn-rsvp" data-id="${a.id}" style="padding:0.4rem 1rem; font-size:0.8rem; border-radius:50px; ${goingBtnStyle}; border:1px solid var(--primary); font-weight:600;">${userGoing ? "I'm Going!" : "RSVP"}</button>
          </div>
        </div>
      `;
    } else if (a.type === 'poll') {
      const pData = a.extraData || {};
      const opts = pData.options || (a.pollOptions ? a.pollOptions.map(o => o.text) : []);
      const votes = pData.votes || (a.pollOptions ? a.pollOptions.map(o => o.votes) : []);
      const totalVotes = votes.reduce((sum, v) => sum + v, 0);
      const votedUsers = pData.votedUsers || {};
      const userVoteIndex = activeUser ? votedUsers[activeUser.uid] : undefined;

      const pollHTML = opts.map((optText, idx) => {
        const percent = totalVotes === 0 ? 0 : Math.round((votes[idx] / totalVotes) * 100);
        const isVoted = userVoteIndex === idx;
        const barColor = isVoted ? 'rgba(99,102,241,0.2)' : 'var(--bg-secondary)';
        return `
          <div class="poll-option btn-poll-vote" data-id="${a.id}" data-idx="${idx}" style="position:relative; margin-bottom:0.5rem; border:1px solid ${isVoted ? 'var(--primary)' : 'var(--border-color)'}; border-radius:var(--radius-sm); overflow:hidden; cursor:pointer;">
            <div class="poll-progress" style="width:${percent}%; background:${barColor}; height:100%; position:absolute; top:0; left:0; z-index:1;"></div>
            <div style="position:relative; z-index:2; padding:0.5rem 1rem; display:flex; justify-content:space-between; align-items:center;">
              <span class="poll-text" style="font-size:0.9rem; font-weight:500;">${optText}</span>
              <span class="poll-percent" style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);">${percent}%</span>
            </div>
          </div>
        `;
      }).join('');
      innerCardHTML = `
        ${titleText}
        ${contentText}
        <div class="poll-card" style="margin-bottom:1rem;">
          ${pollHTML}
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.5rem; text-align:right;">${totalVotes} total votes</div>
        </div>
      `;
    } else {
      // Default standard post
      innerCardHTML = `
        ${titleText}
        ${contentText}
      `;
    }

    // Global Photo Appending
    if (a.imageData) {
      innerCardHTML += `<img src="${a.imageData}" alt="Post image" style="width:100%; max-height:400px; object-fit:cover; border-radius:var(--radius-md); margin-bottom:1rem; border:1px solid var(--border-color);">`;
    }

    // Global Document Appending
    if (a.extraData && a.extraData.document) {
      const doc = a.extraData.document;
      innerCardHTML += `
        <div style="display:flex; align-items:center; gap:0.5rem; background:var(--bg-secondary); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:1rem;">
          <ion-icon name="document-text" style="color:var(--primary); font-size:1.75rem;"></ion-icon>
          <div style="flex:1;">
            <div style="font-size:0.9rem; font-weight:600;">${doc.name}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">${doc.size}</div>
          </div>
          <a href="${doc.fileData || '#'}" ${doc.fileData ? `download="${doc.name}"` : `onclick="showToast('Downloading ${doc.name}...')"`} style="background:none; border:none; color:var(--primary); cursor:pointer; font-weight:600; font-size:0.85rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.2rem;"><ion-icon name="download-outline" style="font-size:1.1rem;"></ion-icon> Download</a>
        </div>
      `;
    }

    // Reaction calculations
    const reactions = a.reactions || {};
    const totalReactions = Object.keys(reactions).length;
    let userReaction = activeUser ? reactions[activeUser.uid] : null;
    
    // Moderation Menu
    let contextMenuHTML = '';
    if (activeUser) {
      let menuItems = [];
      if (activeUser.name === a.author) {
        menuItems.push(`<button class="btn-edit-post" data-id="${a.id}" style="display:block; width:100%; padding:0.5rem; text-align:left; background:none; border:none; cursor:pointer; font-size:0.85rem;"><ion-icon name="create"></ion-icon> Edit</button>`);
      }
      if (activeUser.role === 'admin' || activeUser.name === a.author) {
        menuItems.push(`<button class="btn-delete-post" data-id="${a.id}" style="display:block; width:100%; padding:0.5rem; text-align:left; background:none; border:none; cursor:pointer; font-size:0.85rem; color:var(--danger);"><ion-icon name="trash"></ion-icon> Delete</button>`);
      }
      if (activeUser.role === 'teacher' && activeUser.name !== a.author) {
        menuItems.push(`<button class="btn-flag-post" data-id="${a.id}" style="display:block; width:100%; padding:0.5rem; text-align:left; background:none; border:none; cursor:pointer; font-size:0.85rem; color:#f59e0b;"><ion-icon name="flag"></ion-icon> Flag for Review</button>`);
      }
      if (activeUser.role === 'admin' || activeUser.role === 'teacher') {
        const pinText = a.isPinned ? "Unpin Post" : "Pin Post";
        const pinIcon = a.isPinned ? "close-circle" : "pin";
        menuItems.push(`<button class="btn-pin-post" data-id="${a.id}" style="display:block; width:100%; padding:0.5rem; text-align:left; background:none; border:none; cursor:pointer; font-size:0.85rem;"><ion-icon name="${pinIcon}"></ion-icon> ${pinText}</button>`);
      }
      if (menuItems.length > 0) {
        contextMenuHTML = `
          <div style="position:relative;" class="post-context-menu">
            <button class="btn-context-trigger" style="background:none; border:none; color:var(--text-secondary); font-size:1.2rem; cursor:pointer; padding:0.25rem;"><ion-icon name="ellipsis-horizontal"></ion-icon></button>
            <div class="context-dropdown" style="display:none; position:absolute; right:0; top:100%; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-sm); box-shadow:var(--shadow-sm); z-index:10; min-width:120px; overflow:hidden;">
              ${menuItems.join('')}
            </div>
          </div>
        `;
      }
    }

    return `
      <article class="news-card ${a.type === 'achievement' ? 'achievement-card' : (a.type === 'event' ? 'event-card' : '')}" style="margin-bottom:1.5rem;">
        <!-- Card Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <img class="thread-avatar" src="${a.authorAvatar || 'https://api.dicebear.com/7.x/micah/svg?seed=placeholder'}" alt="avatar">
            <div>
              <strong style="font-size:0.95rem; display:block;">${a.author}</strong>
              <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">${a.authorRole} &bull; ${a.date}</span>
            </div>
          </div>
          ${contextMenuHTML}
        </div>

        <div id="post-body-${a.id}">
          ${innerCardHTML}
        </div>
        
        <!-- Edit container -->
        <div id="post-edit-container-${a.id}" style="display:none; margin-bottom:1rem;">
          <textarea id="edit-input-${a.id}" class="form-control" style="width:100%; resize:vertical; min-height:80px; margin-bottom:0.5rem;">${a.content}</textarea>
          <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
            <button class="btn-secondary btn-cancel-edit" data-id="${a.id}" style="padding:0.3rem 0.75rem; font-size:0.8rem;">Cancel</button>
            <button class="btn-primary btn-save-edit" data-id="${a.id}" style="padding:0.3rem 0.75rem; font-size:0.8rem;">Save</button>
          </div>
        </div>
        
        <!-- Interactive Status bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          <span id="likes-count-${a.id}">👍 ${totalReactions} Reactions</span>
          <span style="cursor:pointer;" class="btn-expand-comments" data-id="${a.id}">💬 Comments</span>
        </div>

        <!-- Custom School Reactions Bar -->
        <div class="reactions-bar" style="display:flex; gap:0.5rem; padding-top:0.5rem; border-top:1px solid var(--border-color);">
          <button class="btn-reaction ${userReaction === 'love' ? 'active-reaction' : ''}" data-id="${a.id}" data-react="love"><ion-icon name="heart"></ion-icon> Love</button>
          <button class="btn-reaction ${userReaction === 'celebrate' ? 'active-reaction' : ''}" data-id="${a.id}" data-react="celebrate"><ion-icon name="medal"></ion-icon> Celebrate</button>
          <button class="btn-reaction ${userReaction === 'inspired' ? 'active-reaction' : ''}" data-id="${a.id}" data-react="inspired"><ion-icon name="bulb"></ion-icon> Inspired</button>
          <button class="btn-reaction ${userReaction === 'helpful' ? 'active-reaction' : ''}" data-id="${a.id}" data-react="helpful"><ion-icon name="information-circle"></ion-icon> Helpful</button>
        </div>

        <!-- Comments Area (Hidden by default) -->
        <div id="comments-box-${a.id}" class="comments-section" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-color);">
          <div id="comments-list-${a.id}" style="max-height: 300px; overflow-y: auto; padding-right: 0.5rem;"></div>
          ${activeUser ? `
            <form class="comment-form" data-ann-id="${a.id}" style="display:flex; gap:0.5rem; margin-top:0.5rem;">
              <input type="text" class="form-control" placeholder="Write a comment..." style="flex:1; border-radius:50px; font-size:0.85rem; padding:0.5rem 1rem;">
              <button type="submit" class="btn-primary" style="border-radius:50px; padding:0.5rem 1rem;"><ion-icon name="send"></ion-icon></button>
            </form>
          ` : `<p style="font-size:0.75rem; color:var(--text-secondary);">Log in to comment.</p>`}
        </div>
      </article>
    `;
  }).join('');

  // Interaction Bindings
  container.querySelectorAll('.btn-reaction').forEach(btn => {
    btn.onclick = async (e) => {
      if (!activeUser) return showToast("Please log in to react!");
      const annId = e.currentTarget.dataset.id;
      const reactType = e.currentTarget.dataset.react;
      await dbService.addReaction(annId, activeUser.uid, reactType);
      renderNewsfeed();
    };
  });

  container.querySelectorAll('.btn-rsvp').forEach(btn => {
    btn.onclick = async (e) => {
      if (!activeUser) return showToast("Please log in to RSVP!");
      const annId = e.currentTarget.dataset.id;
      await dbService.rsvpEvent(annId, activeUser.uid);
      renderNewsfeed();
    };
  });

  container.querySelectorAll('.btn-poll-vote').forEach(btn => {
    btn.onclick = async (e) => {
      if (!activeUser) return showToast("Please log in to vote!");
      const annId = e.currentTarget.dataset.id;
      const optIdx = parseInt(e.currentTarget.dataset.idx);
      await dbService.votePoll(annId, optIdx, activeUser.uid);
      renderNewsfeed();
    };
  });

  // Context Menu Toggle
  container.querySelectorAll('.btn-context-trigger').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const dropdown = e.currentTarget.nextElementSibling;
      const isVisible = dropdown.style.display === 'block';
      document.querySelectorAll('.context-dropdown').forEach(d => d.style.display = 'none');
      dropdown.style.display = isVisible ? 'none' : 'block';
    };
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.context-dropdown').forEach(d => d.style.display = 'none');
  });

  // Moderation Actions
  container.querySelectorAll('.btn-delete-post').forEach(btn => {
    btn.onclick = async (e) => {
      if (!confirm("Are you sure you want to delete this post?")) return;
      await dbService.deleteAnnouncement(e.currentTarget.dataset.id);
      renderNewsfeed();
    };
  });
  
  container.querySelectorAll('.btn-flag-post').forEach(btn => {
    btn.onclick = async (e) => {
      await dbService.flagAnnouncement(e.currentTarget.dataset.id);
      showToast("Post flagged and hidden for review.");
      renderNewsfeed();
    };
  });

  container.querySelectorAll('.btn-pin-post').forEach(btn => {
    btn.onclick = async (e) => {
      await dbService.togglePinAnnouncement(e.currentTarget.dataset.id);
      renderNewsfeed();
      renderPinnedPosts();
    };
  });

  // Edit Action
  container.querySelectorAll('.btn-edit-post').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      document.getElementById(`post-body-${id}`).style.display = 'none';
      document.getElementById(`post-edit-container-${id}`).style.display = 'block';
    };
  });
  container.querySelectorAll('.btn-cancel-edit').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      document.getElementById(`post-body-${id}`).style.display = 'block';
      document.getElementById(`post-edit-container-${id}`).style.display = 'none';
    };
  });
  container.querySelectorAll('.btn-save-edit').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      const newText = document.getElementById(`edit-input-${id}`).value.trim();
      if (!newText) return showToast("Post cannot be empty.");
      await dbService.updateAnnouncementText(id, newText);
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
      e.currentTarget.innerText = isHidden ? '💬 Hide Comments' : '💬 Comments';
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
      <div class="comment-item" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
        <img src="${c.authorAvatar || `https://api.dicebear.com/7.x/micah/svg?seed=${c.author}`}" alt="avatar" style="width:32px; height:32px; border-radius:50%; object-fit:cover; flex-shrink:0;">
        <div style="flex:1;">
          <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:1rem; padding:0.5rem 0.75rem; display:inline-block; min-width:150px;">
            <div class="comment-meta" style="font-weight:700; color:var(--primary); font-size:0.8rem; margin-bottom:0.1rem;">${c.author}</div>
            <div style="font-size:0.85rem; color:var(--text-primary); word-break:break-word;">${c.text}</div>
          </div>
          <div style="display:flex; gap:0.75rem; font-size:0.7rem; color:var(--text-secondary); font-weight:600; margin-top:0.25rem; margin-left:0.5rem;">
            <span style="cursor:pointer; transition:color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="if(this.innerText==='React') this.style.color='var(--text-secondary)'" onclick="this.innerText = this.innerText === 'React' ? 'Liked' : 'React'; this.style.color = this.innerText === 'Liked' ? 'var(--primary)' : 'var(--text-secondary)'; showToast(this.innerText === 'Liked' ? 'Reacted to comment' : 'Reaction removed');">React</span>
            <span style="cursor:pointer; transition:color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-secondary)'" onclick="const i = document.querySelector('.comment-form[data-ann-id=\\\'${annId}\\\'] input'); i.focus(); i.value = '@${c.author} ';">Reply</span>
          </div>
        </div>
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

// INLINE COMPOSER WIRING
// ==========================================

const composerInput = document.getElementById('composer-main-input');
const composerArea = document.getElementById('composer-expansion-area');
const btnCancel = document.getElementById('btn-composer-cancel');
const btnSubmit = document.getElementById('btn-composer-submit');
const audBtn = document.getElementById('btn-composer-audience');
const audDropdown = document.getElementById('composer-audience-dropdown');
const dynamicFields = document.getElementById('composer-dynamic-fields');
const fbPostBox = document.getElementById('fb-create-post-box');

let currentPostType = 'standard';
let composerImageData = null;
let composerDocData = null;

if (composerInput) {
  composerInput.onfocus = () => {
    composerArea.style.display = 'flex';
  };
  
  // Auto-resize textarea
  composerInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
}

if (btnCancel) {
  btnCancel.onclick = () => {
    composerArea.style.display = 'none';
    composerInput.value = '';
    composerInput.style.height = 'auto';
    dynamicFields.innerHTML = '';
    const attachmentsBox = document.getElementById('composer-attachments');
    if (attachmentsBox) attachmentsBox.innerHTML = '';
    currentPostType = 'standard';
    composerImageData = null;
    composerDocData = null;
    fbPostBox.style.border = 'none';
  };
}

if (audBtn) {
  audBtn.onclick = (e) => {
    e.stopPropagation();
    audDropdown.style.display = audDropdown.style.display === 'none' ? 'block' : 'none';
  };
  document.addEventListener('click', (e) => {
    if (audDropdown && !audDropdown.contains(e.target) && e.target !== audBtn) {
      audDropdown.style.display = 'none';
    }
  });
  
  // Handle Audience Checkboxes
  const audCbAll = document.getElementById('aud-all');
  const audCbOthers = document.querySelectorAll('.aud-cb');
  if (audCbAll) {
    audCbAll.onchange = (e) => {
      if (e.target.checked) audCbOthers.forEach(cb => cb.checked = false);
      updateAudienceBtnText();
    };
  }
  audCbOthers.forEach(cb => {
    cb.onchange = () => {
      if (document.querySelectorAll('.aud-cb:checked').length > 0) audCbAll.checked = false;
      else audCbAll.checked = true;
      updateAudienceBtnText();
    };
  });
}

function updateAudienceBtnText() {
  const all = document.getElementById('aud-all').checked;
  if (all) {
    audBtn.innerHTML = `<ion-icon name="earth"></ion-icon> Audience: All <ion-icon name="chevron-down"></ion-icon>`;
  } else {
    const selected = Array.from(document.querySelectorAll('.aud-cb:checked')).map(cb => cb.parentNode.innerText.trim());
    const text = selected.length > 1 ? `${selected.length} Selected` : selected[0];
    audBtn.innerHTML = `<ion-icon name="people"></ion-icon> ${text} <ion-icon name="chevron-down"></ion-icon>`;
  }
}

// Post Actions (Event, Poll, Photo, Achievement, Document)
document.querySelectorAll('.post-action-btn').forEach(btn => {
  btn.onclick = () => {
    composerArea.style.display = 'flex';
    const type = btn.dataset.type;
    
    // Photo Attachment Logic (Works across any post type)
    if (type === 'photo') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          compressImage(ev.target.result, 800, (compressedData) => {
            composerImageData = compressedData;
            document.getElementById('composer-attachments').innerHTML = `
              <div style="position:relative; display:inline-block; margin-top:0.5rem;">
                <img src="${compressedData}" style="max-height:150px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                <button id="btn-remove-composer-img" style="position:absolute; top:0.25rem; right:0.25rem; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer;">&times;</button>
              </div>
            `;
            document.getElementById('btn-remove-composer-img').onclick = () => {
              composerImageData = null;
              document.getElementById('composer-attachments').innerHTML = '';
            };
          });
        };
        reader.readAsDataURL(file);
      };
      fileInput.click();
      return;
    }

    // Document Attachment Logic
    if (type === 'document') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.doc,.docx,.txt';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        
        // Safety check for localStorage limits
        if (file.size > 2 * 1024 * 1024) {
          showToast("File too large! Max 2MB for prototype limits.");
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          composerDocData = {
            name: file.name,
            size: sizeMb + ' MB',
            fileData: ev.target.result // The base64 Data URL
          };
          
          document.getElementById('composer-attachments').innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; background:var(--bg-secondary); padding:0.5rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-top:0.5rem; width:100%;">
              <ion-icon name="document-text" style="color:var(--primary); font-size:1.5rem;"></ion-icon>
              <div style="flex:1;">
                <div style="font-size:0.85rem; font-weight:600;">${file.name}</div>
                <div style="font-size:0.7rem; color:var(--text-secondary);">${sizeMb} MB</div>
              </div>
              <button id="btn-remove-composer-doc" style="background:none; border:none; color:var(--danger); cursor:pointer;"><ion-icon name="close-circle"></ion-icon></button>
            </div>
          `;
          document.getElementById('btn-remove-composer-doc').onclick = () => {
            composerDocData = null;
            document.getElementById('composer-attachments').innerHTML = '';
          };
        };
        reader.readAsDataURL(file);
      };
      fileInput.click();
      return;
    }

    // Change Post Type Logic (Announcement, Event, Poll, Achievement)
    currentPostType = type;
    dynamicFields.innerHTML = '';
    fbPostBox.style.border = 'none';
    
    if (type === 'announcement') {
      fbPostBox.style.border = '2px solid var(--primary)';
      composerInput.placeholder = "Broadcast an official announcement...";
    } else if (type === 'achievement') {
      fbPostBox.style.border = '2px solid #f59e0b';
      composerInput.placeholder = "Share an achievement or milestone!";
    } else if (type === 'event') {
      composerInput.placeholder = "Describe your event...";
      dynamicFields.innerHTML = `
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem; background:var(--bg-secondary); padding:1rem; border-radius:var(--radius-sm);">
          <input type="text" id="ev-title" placeholder="Event Title" class="form-control" style="flex:1; min-width:200px;">
          <input type="date" id="ev-date" class="form-control" style="flex:1; min-width:140px;">
          <input type="time" id="ev-time" class="form-control" style="flex:1; min-width:120px;">
          <input type="text" id="ev-loc" placeholder="Location" class="form-control" style="flex:1; min-width:150px;">
        </div>
      `;
    } else if (type === 'poll') {
      composerInput.placeholder = "Ask a question...";
      dynamicFields.innerHTML = `
        <div id="poll-options-container" style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem; background:var(--bg-secondary); padding:1rem; border-radius:var(--radius-sm);">
          <input type="text" class="form-control poll-opt" placeholder="Option 1">
          <input type="text" class="form-control poll-opt" placeholder="Option 2">
          <button type="button" id="btn-add-poll-opt" class="btn-secondary" style="align-self:flex-start; margin-top:0.5rem; font-size:0.8rem;">+ Add Option</button>
        </div>
      `;
      document.getElementById('btn-add-poll-opt').onclick = (e) => {
        e.preventDefault();
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control poll-opt';
        input.placeholder = `Option ${document.querySelectorAll('.poll-opt').length + 1}`;
        document.getElementById('poll-options-container').insertBefore(input, e.target);
      };
    }
  };
});

if (btnSubmit) {
  btnSubmit.onclick = async () => {
    if (!activeUser) return showToast("Please log in to post.");
    const content = composerInput.value.trim();
    if (!content) return showToast('Post content cannot be empty.');

    // Gather Audience
    let audiences = [];
    if (document.getElementById('aud-all').checked) {
      audiences = ['all'];
    } else {
      document.querySelectorAll('.aud-cb:checked').forEach(cb => audiences.push(cb.value));
    }
    
    // Gather Extra Data
    let extraData = {};
    if (currentPostType === 'event') {
      const title = document.getElementById('ev-title').value.trim();
      if (!title) return showToast('Event title required');
      extraData = {
        eventTitle: title,
        date: document.getElementById('ev-date').value,
        time: document.getElementById('ev-time').value,
        location: document.getElementById('ev-loc').value,
        rsvps: []
      };
    } else if (currentPostType === 'poll') {
      const opts = Array.from(document.querySelectorAll('.poll-opt')).map(i => i.value.trim()).filter(v => v);
      if (opts.length < 2) return showToast('Provide at least 2 poll options');
      extraData = {
        options: opts,
        votes: opts.map(() => 0),
        votedUsers: {}
      };
    }
    
    if (composerDocData) {
      extraData.document = composerDocData;
    }
    
    const status = (activeUser.role === 'admin' || activeUser.role === 'teacher') ? 'approved' : 'pending';

    await dbService.addAnnouncement(content, currentPostType, composerImageData, audiences, extraData, status);
    
    btnCancel.click(); // Reset composer
    showToast(status === 'approved' ? "Post published!" : "Submitted for admin review.");
    renderNewsfeed();
    if (activeUser.role === 'admin') renderRolePortal();
  };
}

// Feed Filter Pill Wiring
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    const filterText = e.currentTarget.innerText.trim().toLowerCase();
    renderNewsfeed(filterText);
  });
});

// ==========================================
// DYNAMIC WIDGETS (SIDEBARS & CALENDAR)
// ==========================================

async function renderPinnedPosts() {
  const container = document.getElementById('pinned-posts-widget');
  if (!container) return;

  const announcements = await dbService.getAnnouncements();
  const pinned = announcements.filter(a => a.isPinned);

  if (pinned.length === 0) {
    container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:1rem;">No pinned posts yet.</div>`;
    return;
  }

  container.innerHTML = pinned.map(p => {
    let typeColor = 'var(--primary)';
    if (p.type === 'announcement') typeColor = 'var(--danger)';
    if (p.type === 'achievement') typeColor = '#f59e0b';
    if (p.type === 'event') typeColor = '#10b981';

    return `
      <div class="pinned-item" onclick="window.location.hash='#/home'; setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 100);" style="background:var(--bg-primary); padding:0.75rem 1rem; border-radius:var(--radius-sm); border-left:4px solid ${typeColor}; display:flex; flex-direction:column; gap:0.25rem; cursor:pointer; transition:var(--transition);">
        <span style="font-size:0.65rem; font-weight:700; color:${typeColor}; text-transform:uppercase;">${p.type === 'standard' ? 'Post' : p.type} &bull; ${p.author}</span>
        <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary); line-height:1.3; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${p.title || p.content || (p.extraData && p.extraData.eventTitle)}</span>
      </div>
    `;
  }).join('');
}

async function renderAgenda() {
  const container = document.getElementById('agenda-widget-list');
  if (!container) return;

  const announcements = await dbService.getAnnouncements();
  const events = announcements.filter(a => a.type === 'event' && a.extraData && a.extraData.date);

  // Sort by date ascending
  events.sort((a, b) => new Date(a.extraData.date) - new Date(b.extraData.date));

  // Filter for upcoming events only (today onwards)
  const today = new Date();
  today.setHours(0,0,0,0);

  const upcomingEvents = events.filter(e => {
    const d = new Date(e.extraData.date);
    return d >= today;
  }).slice(0, 5); // Take only the next 5 events

  if (upcomingEvents.length === 0) {
    container.innerHTML = `<li style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:1rem;">No upcoming events.</li>`;
    return;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  container.innerHTML = upcomingEvents.map(e => {
    const d = new Date(e.extraData.date);
    const month = monthNames[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    
    return `
      <li style="display:flex; gap:1rem; align-items:flex-start;">
        <div style="background:var(--bg-primary); padding:0.4rem; border-radius:8px; text-align:center; min-width:50px; border:1px solid var(--border-color);">
          <div style="font-size:0.7rem; color:var(--danger); font-weight:700; text-transform:uppercase;">${month}</div>
          <div style="font-size:1.2rem; font-weight:700; color:var(--text-primary); line-height:1; margin-top:2px;">${day}</div>
        </div>
        <div>
          <div style="font-weight:600; color:var(--text-primary); font-size:0.95rem;">${e.extraData.eventTitle || e.title}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary)">${e.extraData.time}</div>
        </div>
      </li>
    `;
  }).join('');
}

async function renderCalendar() {
  const container = document.getElementById('full-calendar-list');
  if (!container) return;

  const announcements = await dbService.getAnnouncements();
  const events = announcements.filter(a => a.type === 'event' && a.extraData && a.extraData.date);

  // Sort by date ascending
  events.sort((a, b) => new Date(a.extraData.date) - new Date(b.extraData.date));

  if (events.length === 0) {
    container.innerHTML = `<p style="color:var(--text-secondary); text-align:center;">No events have been scheduled yet.</p>`;
    return;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  today.setHours(0,0,0,0);

  container.innerHTML = events.map(e => {
    const d = new Date(e.extraData.date);
    const month = monthNames[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    const isPast = d < today;
    const opacity = isPast ? '0.6' : '1';
    
    return `
      <div style="display:flex; gap:1.5rem; align-items:center; background:var(--bg-secondary); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); opacity:${opacity};">
        <div style="background:var(--bg-primary); padding:0.5rem; border-radius:8px; text-align:center; min-width:60px; border:1px solid var(--border-color); box-shadow:var(--shadow-sm);">
          <div style="font-size:0.8rem; color:var(--danger); font-weight:700; text-transform:uppercase;">${month}</div>
          <div style="font-size:1.5rem; font-weight:700; color:var(--text-primary); line-height:1; margin-top:2px;">${day}</div>
        </div>
        <div style="flex:1;">
          <h3 style="margin-bottom:0.25rem; font-size:1.1rem; color:${isPast ? 'var(--text-secondary)' : 'var(--text-primary)'};">${e.extraData.eventTitle || e.title} ${isPast ? '(Past)' : ''}</h3>
          <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:0.5rem;"><ion-icon name="time-outline" style="vertical-align:middle;"></ion-icon> ${e.extraData.time} &nbsp;&bull;&nbsp; <ion-icon name="location-outline" style="vertical-align:middle;"></ion-icon> ${e.extraData.location}</p>
          <p style="font-size:0.95rem; color:var(--text-primary);">${e.content}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Intercept renderNewsfeed to also render widgets
const originalRenderNewsfeed = renderNewsfeed;
renderNewsfeed = async (filter) => {
  await originalRenderNewsfeed(filter);
  renderPinnedPosts();
  renderAgenda();
  renderCalendar();
};

setTimeout(() => {
  renderPinnedPosts();
  renderAgenda();
  renderCalendar();
}, 500);
