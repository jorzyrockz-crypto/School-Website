/**
 * Apex Integrated School - Claymorphic 3D Avatar System
 * Unified Handcrafted Tactile Clay Profile Suite
 */

(function () {
  'use strict';

  // ==========================================
  // PALETTES & PRESET LIBRARY
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

  // State
  let selectedClayAvatar = CLAY_AVATARS[0];
  let currentClayColor = 'mint';
  let clayCategoryFilter = 'all';

  function escapeHTML(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================
  // MODAL CONTROLS
  // ==========================================

  window.openClayAvatarModal = function () {
    const modal = document.getElementById('modal-clay-avatar-picker');
    if (!modal) return;

    // Match active user or default
    const user = (typeof activeUser !== 'undefined' && activeUser) ? activeUser : null;
    if (user && user.avatar) {
      const match = CLAY_AVATARS.find(a => user.avatar.includes(a.seed));
      if (match) {
        selectedClayAvatar = match;
        // Detect palette if present
        for (const [key, pal] of Object.entries(CLAY_PALETTES)) {
          if (user.avatar.includes(pal.hex)) {
            currentClayColor = key;
            break;
          }
        }
      } else {
        selectedClayAvatar = CLAY_AVATARS[0];
        currentClayColor = 'mint';
      }
    } else {
      selectedClayAvatar = CLAY_AVATARS[0];
      currentClayColor = 'mint';
    }

    clayCategoryFilter = 'all';

    const totalEl = document.getElementById('clay-total-count');
    if (totalEl) totalEl.textContent = CLAY_AVATARS.length;

    renderClayCategoryPills();
    renderClayAvatarsGrid();
    updateClayPreviewHero();
    wireClayModalEvents();

    modal.style.display = 'flex';
  };

  window.closeClayAvatarModal = function () {
    const modal = document.getElementById('modal-clay-avatar-picker');
    if (modal) modal.style.display = 'none';
  };

  // Generic closeModal fallback
  if (typeof window.closeModal !== 'function') {
    window.closeModal = function (id) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    };
  }

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

  let eventsWired = false;
  function wireClayModalEvents() {
    if (eventsWired) return;
    eventsWired = true;

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
    const user = (typeof activeUser !== 'undefined' && activeUser) ? activeUser : null;
    if (!selectedClayAvatar || !user) return;
    const newAvatarUrl = getClayAvatarUrl(selectedClayAvatar, currentClayColor);

    user.avatar = newAvatarUrl;

    // Save permanently in database
    if (typeof dbService !== 'undefined' && dbService.saveUser) {
      await dbService.saveUser(user.uid, { avatar: newAvatarUrl });
    }
    try {
      sessionStorage.setItem('activeUser', JSON.stringify(user));
    } catch (e) {}

    // Live update all elements across portal & messenger
    const headerAvatar = document.getElementById('header-user-avatar');
    if (headerAvatar) headerAvatar.src = newAvatarUrl;

    const dropdownAvatar = document.getElementById('dropdown-user-avatar');
    if (dropdownAvatar) dropdownAvatar.src = newAvatarUrl;

    const postBoxAvatar = document.getElementById('post-box-avatar');
    if (postBoxAvatar) postBoxAvatar.src = newAvatarUrl;

    const previewAvatar = document.getElementById('profile-avatar-preview');
    if (previewAvatar) previewAvatar.src = newAvatarUrl;

    const publicAvatar = document.getElementById('public-avatar');
    if (publicAvatar && window.location.hash.includes(user.uid)) {
      publicAvatar.src = newAvatarUrl;
    }

    const msgUserAvatar = document.getElementById('msg-user-avatar');
    if (msgUserAvatar) msgUserAvatar.src = newAvatarUrl;

    const infoAvatar = document.getElementById('info-avatar');
    if (infoAvatar) infoAvatar.src = newAvatarUrl;

    if (typeof syncSidebarProfile === 'function') {
      syncSidebarProfile();
    }
    if (typeof syncUserTopBar === 'function') {
      syncUserTopBar();
    }
    if (typeof renderMessages === 'function') {
      renderMessages();
    }
    if (typeof loadThreads === 'function') {
      loadThreads();
    }

    window.closeClayAvatarModal();

    if (typeof showToast === 'function') {
      showToast(`3D Clay Avatar updated to ${selectedClayAvatar.name}!`);
    }
  }

  // Auto-init swatches on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    wireClayModalEvents();
  });

  // Global Exports
  window.ClayAvatarManager = {
    palettes: CLAY_PALETTES,
    avatars: CLAY_AVATARS,
    getUrl: getClayAvatarUrl
  };
  window.CLAY_PALETTES = CLAY_PALETTES;
  window.CLAY_AVATARS = CLAY_AVATARS;
  window.getClayAvatarUrl = getClayAvatarUrl;

})();
