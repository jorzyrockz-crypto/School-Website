// SESSION MANAGEMENT (REVAMPED SIGN-IN & AUTH SUITE)
// ==========================================

window.guestBrowsingAllowed = false;

window.openLoginOverlay = function() {
  const loginOverlay = document.getElementById('login-screen-overlay');
  if (loginOverlay) {
    loginOverlay.style.display = 'flex';
    if (typeof switchSigninTab === 'function') switchSigninTab('fast');
  }
};

window.switchSigninTab = function(tabKey) {
  const fastView = document.getElementById('signin-view-fast');
  const credsView = document.getElementById('signin-view-creds');
  const btnFast = document.getElementById('tab-btn-fast-access');
  const btnCreds = document.getElementById('tab-btn-credentials');
  if (!fastView || !credsView) return;

  if (tabKey === 'creds') {
    fastView.style.display = 'none';
    credsView.style.display = 'flex';
    if (btnFast) btnFast.classList.remove('active');
    if (btnCreds) btnCreds.classList.add('active');
    const emailInput = document.getElementById('signin-email-input');
    if (emailInput && !emailInput.value) emailInput.focus();
  } else {
    fastView.style.display = 'flex';
    credsView.style.display = 'none';
    if (btnFast) btnFast.classList.add('active');
    if (btnCreds) btnCreds.classList.remove('active');
  }
};

window.fillSigninEmail = function(email) {
  const emailInput = document.getElementById('signin-email-input');
  const pwdInput = document.getElementById('signin-password-input');
  if (emailInput) {
    emailInput.value = email;
    emailInput.focus();
  }
  if (pwdInput && !pwdInput.value) {
    pwdInput.value = 'password123';
  }
};

window.handleForgotPassword = function() {
  if (typeof showToast === 'function') {
    showToast("Password Reset: Default passwords are 'password123' for all school personas.");
  }
};

window.openPrivacyModal = function() {
  if (typeof showToast === 'function') {
    showToast("Apex Institutional Privacy Policy: Compliant with national learner data protection.");
  }
};

window.openTermsModal = function() {
  if (typeof showToast === 'function') {
    showToast("Apex Terms of Service: Authorized institutional educational portal access only.");
  }
};

// Delegated click handler for mock login triggers
document.addEventListener('click', async (e) => {
  const trigger = e.target.closest('.btn-mock-login');
  if (!trigger) return;
  e.preventDefault();
  e.stopPropagation();

  const email = trigger.dataset.email;
  if (!email) return;

  const user = await dbService.getUser(email);
  if (user) {
    activeUser = user;
    window.guestBrowsingAllowed = false;
    try { sessionStorage.setItem('activeUser', JSON.stringify(user)); } catch(err) {}
    if (typeof showToast === 'function') showToast(`Welcome back, ${user.name}!`);
    
    // Update layouts and hide login overlay
    const loginOverlay = document.getElementById('login-screen-overlay');
    if (loginOverlay) loginOverlay.style.display = 'none';

    syncSidebarProfile();
    toggleAuthUIElements(true);
    
    // Force routing and panel rendering immediately
    window.location.hash = "#/home";
    if (typeof switchView === 'function') switchView("home");
  } else {
    if (typeof showToast === 'function') showToast("Login failed: user not found in database.");
  }
});

// Setup Signin Events
function initSigninInteractions() {
  // Theme Toggle Button on Signin Screen
  const signinThemeBtn = document.getElementById('signin-theme-toggle');
  const signinThemeIcon = document.getElementById('signin-theme-icon');
  if (signinThemeBtn) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (signinThemeIcon) signinThemeIcon.setAttribute('name', currentTheme === 'dark' ? 'sunny-outline' : 'moon-outline');

    signinThemeBtn.onclick = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const nextTheme = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      try { localStorage.setItem('theme', nextTheme); } catch (e) {}
      if (signinThemeIcon) signinThemeIcon.setAttribute('name', nextTheme === 'dark' ? 'sunny-outline' : 'moon-outline');
    };
  }

  // Browse as Guest Button
  const guestBtn = document.getElementById('btn-signin-guest');
  if (guestBtn) {
    guestBtn.onclick = () => {
      window.guestBrowsingAllowed = true;
      const loginOverlay = document.getElementById('login-screen-overlay');
      if (loginOverlay) loginOverlay.style.display = 'none';
      syncSidebarProfile();
      toggleAuthUIElements(false);
      if (typeof showToast === 'function') showToast("Browsing public school portal as Guest.");
      window.location.hash = "#/home";
      if (typeof switchView === 'function') switchView("home");
    };
  }

  // Password Visibility Toggle
  const togglePwdBtn = document.getElementById('btn-toggle-signin-pwd');
  if (togglePwdBtn) {
    togglePwdBtn.onclick = () => {
      const pwdInput = document.getElementById('signin-password-input');
      const eyeIcon = document.getElementById('signin-pwd-eye');
      if (!pwdInput) return;
      const isPwd = pwdInput.type === 'password';
      pwdInput.type = isPwd ? 'text' : 'password';
      if (eyeIcon) eyeIcon.setAttribute('name', isPwd ? 'eye-off-outline' : 'eye-outline');
    };
  }

  // Credential Form Submit
  const credForm = document.getElementById('signin-view-creds');
  if (credForm) {
    credForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = (document.getElementById('signin-email-input')?.value || '').trim();
      const errEl = document.getElementById('signin-error-msg');
      if (errEl) errEl.style.display = 'none';

      const user = await dbService.getUser(email);
      if (user) {
        activeUser = user;
        window.guestBrowsingAllowed = false;
        try { sessionStorage.setItem('activeUser', JSON.stringify(user)); } catch(err) {}
        if (typeof showToast === 'function') showToast(`Welcome back, ${user.name}!`);
        
        const loginOverlay = document.getElementById('login-screen-overlay');
        if (loginOverlay) loginOverlay.style.display = 'none';

        syncSidebarProfile();
        toggleAuthUIElements(true);
        window.location.hash = "#/home";
        if (typeof switchView === 'function') switchView("home");
      } else {
        if (errEl) {
          errEl.innerText = "Account not found with this email. Please check your spelling or use Quick Personas.";
          errEl.style.display = 'block';
        } else if (typeof showToast === 'function') {
          showToast("Account not found. Please try another email.");
        }
      }
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSigninInteractions);
} else {
  initSigninInteractions();
}

const loginMenuBtn = document.getElementById('btn-login-menu');
if (loginMenuBtn) {
  loginMenuBtn.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('login-menu-dropdown').classList.toggle('show');
  };

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

const logoutBtn = document.getElementById('header-btn-logout');
if (logoutBtn) {
  logoutBtn.onclick = () => {
    activeUser = null;
    activeChatThread = null;
    window.guestBrowsingAllowed = false;
    sessionStorage.removeItem('activeUser');
    if (typeof showToast === 'function') showToast("Signed out successfully.");
    
    // Clear sidebar/header layout
    syncSidebarProfile();
    toggleAuthUIElements(false);
    
    // Close dropdowns
    const profileDropdown = document.getElementById('profile-dropdown-menu');
    if (profileDropdown) profileDropdown.style.display = 'none';

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
  const profileLink = document.getElementById('dropdown-user-profile-link');
  const settingsProfileBtn = document.getElementById('settings-view-profile-btn');

  if (activeUser) {
    if (headerAvatar) headerAvatar.src = activeUser.avatar;
    if (dropdownAvatar) dropdownAvatar.src = activeUser.avatar;
    if (name) name.innerText = activeUser.name;
    if (profileLink) profileLink.href = `#/user/${activeUser.uid}`;
    if (settingsProfileBtn) settingsProfileBtn.href = `#/user/${activeUser.uid}`;
  } else {
    if (headerAvatar) headerAvatar.src = "https://api.dicebear.com/7.x/micah/svg?seed=guest";
    if (dropdownAvatar) dropdownAvatar.src = "https://api.dicebear.com/7.x/micah/svg?seed=guest";
    if (name) name.innerText = "Guest User";
    if (profileLink) profileLink.href = `#/home`;
    if (settingsProfileBtn) settingsProfileBtn.href = `#/home`;
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

  // Toggle Header Guest Sign In Button
  const guestSignInBtn = document.getElementById('header-guest-signin-btn');
  if (guestSignInBtn) guestSignInBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';

  // Toggle Chat Heads Dock
  const chatDock = document.getElementById('chat-heads-dock');
  if (chatDock) chatDock.style.display = isLoggedIn ? 'flex' : 'none';
  
  if (isLoggedIn && typeof initFloatingChatHeads === 'function') {
    initFloatingChatHeads();
  }

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
