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
            <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">${a.authorRole} â€¢ ${a.date}</span>
          </div>
        </div>

        ${innerCardHTML}
        
        <!-- Interactive Like & Comment Status bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          <span id="likes-count-${a.id}">ðŸ‘ ${likes.length} Reactions</span>
          <span style="cursor:pointer;" class="btn-expand-comments" data-id="${a.id}">ðŸ’¬ Comments</span>
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

