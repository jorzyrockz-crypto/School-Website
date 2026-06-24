// SESSION MANAGEMENT (MOCK BUTTONS & DROPDOWN)
// ==========================================

const loginMenuBtn = document.getElementById('btn-login-menu');
if (loginMenuBtn) {
  loginMenuBtn.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('login-menu-dropdown').classList.toggle('show');
  };

  // Stop clicks INSIDE the dropdown from bubbling up and auto-closing it
  const loginDropdown = document.getElementById('login-menu-dropdown');
  if (loginDropdown) {
    loginDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  document.addEventListener('click', () => {
    const dropdown = document.getElementById('login-menu-dropdown');
    if (dropdown) dropdown.classList.remove('show');
  });
}

const mockLoginTriggers = document.querySelectorAll('.btn-mock-login');
mockLoginTriggers.forEach(trigger => {
  trigger.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const email = trigger.dataset.email;

    const user = await dbService.getUser(email);
    if (user) {
      activeUser = user;
      try { sessionStorage.setItem('activeUser', JSON.stringify(user)); } catch(err) {}
      showToast(`Welcome back, ${user.name}!`);
      
      // Update layouts and hide login overlay
      const loginOverlay = document.getElementById('login-screen-overlay');
      if (loginOverlay) loginOverlay.style.display = 'none';

      syncSidebarProfile();
      toggleAuthUIElements(true);
      
      // Force routing and panel rendering immediately
      window.location.hash = "#/home";
      switchView("home");
    } else {
      showToast("Login failed: user not found in database.");
    }
  };
});

const logoutBtn = document.getElementById('header-btn-logout');
if (logoutBtn) {
  logoutBtn.onclick = () => {
    activeUser = null;
    activeChatThread = null;
    sessionStorage.removeItem('activeUser');
    showToast("Signed out successfully.");
    
    // Clear sidebar/header layout
    syncSidebarProfile();
    toggleAuthUIElements(false);
    
    // Close dropdowns
    document.getElementById('profile-dropdown-menu').style.display = 'none';

    // Show login overlay immediately upon logout
    const loginOverlay = document.getElementById('login-screen-overlay');
    if (loginOverlay) loginOverlay.style.display = 'flex';
    
    window.location.hash = "#/home"; // Redirect to homepage feed
  };
}

// LAYOUT HELPERS
// ==========================================

function syncSidebarProfile() {
  const headerAvatar = document.getElementById('header-user-avatar');
  const dropdownAvatar = document.getElementById('dropdown-user-avatar');
  const name = document.getElementById('header-user-name');

  if (activeUser) {
    if (headerAvatar) headerAvatar.src = activeUser.avatar;
    if (dropdownAvatar) dropdownAvatar.src = activeUser.avatar;
    if (name) name.innerText = activeUser.name;
  } else {
    if (headerAvatar) headerAvatar.src = "https://api.dicebear.com/7.x/micah/svg?seed=guest";
    if (dropdownAvatar) dropdownAvatar.src = "https://api.dicebear.com/7.x/micah/svg?seed=guest";
    if (name) name.innerText = "Guest User";
  }
}

function toggleAuthUIElements(isLoggedIn) {
  // Show / Hide auth-only menu links (in sidebar)
  document.querySelectorAll('.menu-item.auth-only').forEach(item => {
    item.style.display = isLoggedIn ? 'block' : 'none';
  });

  // Toggle guest login widget in sidebar
  const guestBox = document.getElementById('guest-login-box');
  if (guestBox) guestBox.style.display = isLoggedIn ? 'none' : 'block';
  
  // Toggle the new Profile Widget in the Header
  const profileWidget = document.getElementById('profile-widget-trigger');
  if (profileWidget) profileWidget.style.display = isLoggedIn ? 'block' : 'none';

  // Toggle Chat Heads Dock
  const chatDock = document.getElementById('chat-heads-dock');
  if (chatDock) chatDock.style.display = isLoggedIn ? 'flex' : 'none';

  const fbCreatePost = document.getElementById('fb-create-post-box');
  if (fbCreatePost) {
    // Show composer ONLY for Admins and Teachers
    const canPost = isLoggedIn && activeUser && (activeUser.role === 'admin' || activeUser.role === 'teacher');
    fbCreatePost.style.display = canPost ? 'block' : 'none';
    
    if (canPost) {
      const avatar = document.getElementById('post-box-avatar');
      if (avatar) avatar.src = activeUser.avatar || 'https://api.dicebear.com/7.x/micah/svg?seed=placeholder';
    }
  }
}

async function syncSchoolConfig(school) {
  document.getElementById('school-sidebar-name').innerText = school.name;
  document.getElementById('school-portal-name').innerText = school.name;
  document.getElementById('school-logo-img').src = school.logo;
}
