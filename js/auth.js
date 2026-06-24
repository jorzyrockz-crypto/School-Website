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

const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) {
  logoutBtn.onclick = () => {
    activeUser = null;
    activeChatThread = null;
    sessionStorage.removeItem('activeUser');
    showToast("Signed out successfully.");
    
    // Clear sidebar layout
    syncSidebarProfile();
    toggleAuthUIElements(false);
    
    // Show login overlay immediately upon logout
    const loginOverlay = document.getElementById('login-screen-overlay');
    if (loginOverlay) loginOverlay.style.display = 'flex';
    
    window.location.hash = "#/home"; // Redirect to homepage feed
  };
}

// LAYOUT HELPERS
// ==========================================

function syncSidebarProfile() {
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('user-name');
  const position = document.getElementById('user-position');
  const profileBox = document.querySelector('.sidebar-profile');

  if (activeUser) {
    avatar.src = activeUser.avatar;
    name.innerText = activeUser.name;
    
    // Position text logic
    let posText = '';
    const rd = activeUser.roleData || {};
    if (activeUser.role === 'admin' && rd.position) posText = rd.position;
    else if (activeUser.role === 'teacher') {
      if (rd.position) posText = rd.position;
      else if (rd.dept) posText = rd.dept + ' Teacher';
    }
    else if (activeUser.role === 'learner' && rd.grade) posText = `${rd.grade}${rd.section ? ' - ' + rd.section : ''}`;
    else if (activeUser.role === 'parent' && rd.learnerName) posText = `Parent of ${rd.learnerName}`;

    if (position) {
      if (posText) {
        position.innerText = posText;
        position.style.display = 'block';
      } else {
        position.style.display = 'none';
      }
    }

    // Role-based background color for the profile card
    if (profileBox) {
      // Reset all borders to avoid compounding if roles switch
      profileBox.style.border = 'none';
      profileBox.style.borderLeft = '4px solid transparent';
      
      if (activeUser.role === 'admin') {
        profileBox.style.background = 'linear-gradient(90deg, rgba(24, 119, 242, 0.35) 0%, rgba(24, 119, 242, 0.05) 100%)';
        profileBox.style.borderLeft = '4px solid #1877f2';
      } else if (activeUser.role === 'teacher') {
        profileBox.style.background = 'linear-gradient(90deg, rgba(45, 158, 107, 0.35) 0%, rgba(45, 158, 107, 0.05) 100%)';
        profileBox.style.borderLeft = '4px solid #2d9e6b';
      } else if (activeUser.role === 'learner') {
        profileBox.style.background = 'linear-gradient(90deg, rgba(245, 158, 11, 0.35) 0%, rgba(245, 158, 11, 0.05) 100%)';
        profileBox.style.borderLeft = '4px solid #f59e0b';
      } else if (activeUser.role === 'parent') {
        profileBox.style.background = 'linear-gradient(90deg, rgba(124, 58, 237, 0.35) 0%, rgba(124, 58, 237, 0.05) 100%)';
        profileBox.style.borderLeft = '4px solid #7c3aed';
      }
    }

  } else {
    avatar.src = "https://api.dicebear.com/7.x/micah/svg?seed=guest";
    name.innerText = "Guest User";
    if (position) position.style.display = 'none';
    if (profileBox) {
      profileBox.style.background = 'rgba(255, 255, 255, 0.03)';
      profileBox.style.border = 'none';
      profileBox.style.borderLeft = '4px solid transparent';
    }
  }
}

function toggleAuthUIElements(isLoggedIn) {
  // Show / Hide auth-only menu links
  document.querySelectorAll('.menu-item.auth-only').forEach(item => {
    item.style.display = isLoggedIn ? 'block' : 'none';
  });

  // Toggle logout dropdown
  const guestBox = document.getElementById('guest-login-box');
  if (guestBox) guestBox.style.display = isLoggedIn ? 'none' : 'block';
  
  const logoutBox = document.getElementById('auth-logout-box');
  if (logoutBox) logoutBox.style.display = isLoggedIn ? 'block' : 'none';

  // Toggle create-post box on newsfeed (Admin/Teacher only)
  const canPost = isLoggedIn && activeUser && (activeUser.role === 'admin' || activeUser.role === 'teacher');
  document.getElementById('fb-create-post-box').style.display = canPost ? 'block' : 'none';
  
  if (canPost && activeUser) {
    document.getElementById('post-box-avatar').src = activeUser.avatar;
  }
}

async function syncSchoolConfig(school) {
  document.getElementById('school-sidebar-name').innerText = school.name;
  document.getElementById('school-portal-name').innerText = school.name;
  document.getElementById('school-logo-img').src = school.logo;
}

