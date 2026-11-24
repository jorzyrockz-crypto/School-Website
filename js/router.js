// CENTRAL APPLICATION ROUTER (HASH BASED)
// ==========================================

function initRouter() {
  const handleRouting = () => {
    const hash = window.location.hash || '#/home';
    
    let viewName = 'home';
    let pathParam = '';
    if (hash.startsWith('#/')) {
      const parts = hash.split('#/')[1].split('/');
      viewName = parts[0];
      pathParam = parts[1] || '';
    }

    // Guard portal routes
    const authRoutes = ['dashboard', 'messages', 'profile'];
    if (authRoutes.includes(viewName) && !activeUser) {
      window.location.hash = '#/home';
      showToast("Please log in to access this portal section!");
      return;
    }

    // Direct routing for Apex Messenger as the primary messenger app
    if (viewName === 'messages' || viewName === 'messenger') {
      window.location.href = pathParam ? `messenger.html?uid=${encodeURIComponent(pathParam)}` : 'messenger.html';
      return;
    }

    switchView(viewName, pathParam);
  };

  window.addEventListener('hashchange', handleRouting);
  handleRouting();
}

function switchView(viewName, pathParam) {
  // Check auth and show login screen if not authenticated
  const loginOverlay = document.getElementById('login-screen-overlay');
  const authRequiredViews = ['dashboard', 'profile'];
  if (!activeUser) {
    if (authRequiredViews.includes(viewName) || !window.guestBrowsingAllowed) {
      if (loginOverlay) loginOverlay.style.display = 'flex';
    } else {
      if (loginOverlay) loginOverlay.style.display = 'none';
    }
  } else {
    if (loginOverlay) loginOverlay.style.display = 'none';
  }

  // Restore saved theme on navigation
  const currentSchoolId = activeUser ? activeUser.schoolId : "default-school";
  dbService.getSchool(currentSchoolId).then(school => {
    applyTheme(school.theme, school.logo);
  });
  
  // Handle Special Routes
  let domViewId = viewName;
  if (viewName === 'user') {
    if (!pathParam && activeUser) {
      window.location.hash = `#/user/${activeUser.uid}`;
      return;
    } else if (!pathParam) {
      window.location.hash = `#/home`;
      return;
    }
    
    domViewId = 'user-profile';
    if (typeof renderPublicProfile === 'function') {
      renderPublicProfile(pathParam);
    }
  }

  // Toggle visibility of route blocks
  document.querySelectorAll('.route-view').forEach(view => {
    view.style.display = 'none';
    view.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${domViewId}`);
  if (activeView) {
    activeView.classList.add('active');
    if (domViewId === 'messages') {
      activeView.style.display = 'flex';
      activeView.style.flexDirection = 'column';
      activeView.style.flex = '1';
    } else {
      activeView.style.display = 'block';
    }
  }

  // Reset scroll position on route switch so views don't start scrolled halfway down
  const workspace = document.querySelector('.portal-workspace');
  if (workspace) {
    workspace.scrollTop = 0;
    if (viewName === 'messages') {
      workspace.classList.add('no-padding');
    } else {
      workspace.classList.remove('no-padding');
    }
  }
  window.scrollTo(0, 0);
  const mainEl = document.querySelector('.portal-main');
  if (mainEl) mainEl.scrollTop = 0;

  // Toggle route-messages class on body for responsive CSS rules
  document.body.classList.toggle('route-messages', viewName === 'messages');

  // Floating chat dock & window management
  const chatDock = document.getElementById('chat-heads-dock');
  if (chatDock) {
    if (viewName === 'messages') {
      chatDock.classList.add('view-messages-hidden');
      chatDock.style.display = 'none';
    } else {
      chatDock.classList.remove('view-messages-hidden');
      chatDock.style.display = '';
    }
  }
  const floatingWindow = document.getElementById('floating-chat-window');
  if (floatingWindow && viewName === 'messages') {
    floatingWindow.classList.remove('show');
    floatingWindow.style.display = 'none';
  }

  // Tablet bottom nav management (hide in messages view to prevent collision with chat composer)
  const bottomNav = document.getElementById('tablet-bottom-nav');
  if (bottomNav) {
    if (viewName === 'messages') {
      bottomNav.style.display = 'none';
      bottomNav.classList.add('nav-hidden-messages');
    } else {
      bottomNav.style.display = '';
      bottomNav.classList.remove('nav-hidden-messages');
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

