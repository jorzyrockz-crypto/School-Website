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
    if (viewName === 'messages') {
      activeView.style.display = 'flex';
      activeView.style.flexDirection = 'column';
      activeView.style.flex = '1';
    } else {
      activeView.style.display = 'block';
    }
  }

  // Remove workspace padding when in messaging view for full-height layout
  const workspace = document.querySelector('.portal-workspace');
  if (workspace) {
    if (viewName === 'messages') {
      workspace.classList.add('no-padding');
    } else {
      workspace.classList.remove('no-padding');
    }
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

