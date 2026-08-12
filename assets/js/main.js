/**
 * Eventify - Main Shared Layouts (Navbar, Footer, General Listeners)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject Unified Navigation Bar
  injectNavbar();

  // 2. Inject Unified Footer
  injectFooter();

  // 3. Initialize Mobile Menu Action
  initMobileMenu();

  // 4. Initialize User Actions & Dropdown
  initUserDropdown();

  // 5. Handle global route validations
  handleGlobalUrlParams();
});

/**
 * Render and Inject modern responsive Navbar into <header id="header-nav">
 */
function injectNavbar() {
  const header = document.getElementById('header-nav');
  if (!header) return;

  const currentPath = window.location.pathname;
  const isHome = currentPath.endsWith('/') || currentPath.endsWith('index.html');
  const isEvents = currentPath.endsWith('events.html');
  const isDashboard = currentPath.endsWith('dashboard.html');

  const loggedIn = AUTH.isLoggedIn();
  const user = AUTH.getUser();

  let authSectionHtml = '';
  if (loggedIn && user) {
    const avatarUrl = user.avatarUrl || 'https://i.ibb.co/tPp28rV/avatar-placeholder.png';
    const roleBadge = user.role === 'USER' ? 'Attendee' : user.role;

    authSectionHtml = `
      <div class="user-menu-container" id="user-menu-container">
        <div class="user-avatar-trigger" id="user-avatar-trigger">
          <img src="${avatarUrl}" alt="${UI.escapeHTML(user.name)}" onerror="this.src='https://i.ibb.co/tPp28rV/avatar-placeholder.png'">
          <span>${UI.escapeHTML(user.name.split(' ')[0])}</span>
          <i class="fas fa-chevron-down" style="font-size: 11px; color: var(--text-secondary);"></i>
        </div>
        <div class="user-dropdown glass-panel" id="user-dropdown">
          <div style="padding: 12px 16px;">
            <p style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${UI.escapeHTML(user.name)}</p>
            <p style="font-size: 12px; color: var(--text-muted);">${UI.escapeHTML(user.email)}</p>
            <span class="badge badge-upcoming" style="margin-top: 8px; font-size: 10px; padding: 2px 8px;">${roleBadge}</span>
          </div>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="dashboard.html"><i class="fas fa-th-large"></i> Dashboard</a>
          <a class="dropdown-item" href="dashboard.html?tab=profile"><i class="fas fa-user-cog"></i> Edit Profile</a>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item logout" id="logout-button"><i class="fas fa-sign-out-alt"></i> Sign Out</div>
        </div>
      </div>
    `;
  } else {
    authSectionHtml = `
      <a href="login.html" class="btn btn-secondary btn-sm">Sign In</a>
      <a href="login.html?tab=register" class="btn btn-primary btn-sm">Get Started</a>
    `;
  }

  header.innerHTML = `
    <nav class="navbar">
      <div class="container">
        <a href="index.html" class="logo">
          <i class="fas fa-rocket"></i> Eventify
        </a>
        
        <ul class="nav-links">
          <li><a href="index.html" class="nav-item ${isHome ? 'active' : ''}">Home</a></li>
          <li><a href="events.html" class="nav-item ${isEvents ? 'active' : ''}">Explore Events</a></li>
          ${loggedIn ? `<li><a href="dashboard.html" class="nav-item ${isDashboard ? 'active' : ''}">Dashboard</a></li>` : ''}
        </ul>

        <div class="auth-nav">
          ${authSectionHtml}
          <button class="close-btn mobile-menu-toggle" id="mobile-menu-toggle" style="display: none; font-size: 24px; margin-left: 15px;">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </nav>
  `;

  // Apply logout action
  const logoutBtn = document.getElementById('logout-button');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => AUTH.logout());
  }
}

/**
 * Render and Inject Footer into <footer id="footer-nav">
 */
function injectFooter() {
  const footer = document.getElementById('footer-nav');
  if (!footer) return;

  footer.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col" style="grid-column: span 2;">
            <a href="index.html" class="logo" style="margin-bottom: 20px;">
              <i class="fas fa-rocket"></i> Eventify
            </a>
            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 20px; max-width: 320px;">
              Discover and book tickets for the most popular upcoming concerts, technology conferences, sports tournaments, and webinars globally.
            </p>
            <div class="footer-socials">
              <a href="#"><i class="fab fa-facebook-f"></i></a>
              <a href="#"><i class="fab fa-twitter"></i></a>
              <a href="#"><i class="fab fa-instagram"></i></a>
              <a href="#"><i class="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          
          <div class="footer-col">
            <h4>Quick Links</h4>
            <ul class="footer-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="events.html">Browse Events</a></li>
              <li><a href="login.html">Login Portal</a></li>
              <li><a href="dashboard.html">Member Dashboard</a></li>
            </ul>
          </div>
          
          <div class="footer-col">
            <h4>Support</h4>
            <ul class="footer-links">
              <li><a href="#">Contact Support</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} Eventify Ltd. All Rights Reserved. Built with ❤️ for outstanding events.</p>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Handle mobile toggle drawer visibility
 */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  if (!toggle) return;

  // Responsive styling check to display toggler on mobile sizes
  const handleResize = () => {
    if (window.innerWidth <= 768) {
      toggle.style.display = 'block';
    } else {
      toggle.style.display = 'none';
    }
  };
  window.addEventListener('resize', handleResize);
  handleResize();

  toggle.addEventListener('click', () => {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '80px';
      navLinks.style.left = '0';
      navLinks.style.width = '100%';
      navLinks.style.background = 'var(--bg-primary)';
      navLinks.style.borderBottom = '1px solid var(--glass-border)';
      navLinks.style.padding = '20px';
      navLinks.style.zIndex = '999';
    }
  });
}

/**
 * Handle User Dropdown toggle functionality
 */
function initUserDropdown() {
  const trigger = document.getElementById('user-avatar-trigger');
  const dropdown = document.getElementById('user-dropdown');

  if (!trigger || !dropdown) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });
}

/**
 * Monitor URL query strings for system actions or error prompts
 */
function handleGlobalUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('unauthorized') === 'true') {
    UI.toast('Access Denied. You do not have permissions for this page.', 'error');
  }
  if (params.get('expired') === 'true') {
    UI.toast('Your session has expired. Please sign in again.', 'warning');
  }
}
