/**
 * Eventify - Central Dashboard Application Engine
 * Unified Router, Metric Loaders, Data Tables, QR Ticket Verification Engine, CRUD Forms
 */

let activeTab = 'overview';
let activeUserRole = 'USER';
let loadedCategories = []; // Cached categories for form selectors
let dashboardOverviewData = null; // Cache dashboard statistics

// QR Scanner reference
let html5QrcodeScanner = null;

document.addEventListener('DOMContentLoaded', () => {
  // Guard route - require login
  if (!AUTH.guardRoute()) return;

  const user = AUTH.getUser();
  activeUserRole = user.role;

  // Initialize sidebar options
  renderSidebar();

  // Load target tab from URL hash
  const hash = window.location.hash.replace('#', '') || 'overview';
  switchTab(hash);

  // Bind forms submit listeners
  bindDashboardForms();

  // Load categories cache
  loadCategoriesCache();

  // Load unread notification indicator
  loadUnreadNotificationsIndicator();
});

/**
 * Switch active dashboard panel tab
 */
function switchTab(tabId) {
  // Shutdown active scanner stream if changing tabs
  stopQRScanner();

  activeTab = tabId;
  window.location.hash = tabId;

  // Highlight active sidebar menu
  document.querySelectorAll('.sidebar-item').forEach(item => {
    if (item.getAttribute('onclick') === `switchTab('${tabId}')`) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Render appropriate panel template
  renderPanel(tabId);
}

/**
 * Render dynamic navigation links depending on active user role
 */
function renderSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  if (!sidebar) return;

  const role = activeUserRole;
  let linksHtml = '';

  const commonTop = `
    <div class="sidebar-item" onclick="switchTab('overview')">
      <i class="fas fa-chart-line"></i> Overview
    </div>
  `;

  const commonBottom = `
    <div class="sidebar-item" onclick="switchTab('notifications')">
      <i class="fas fa-bell"></i> Notifications
    </div>
    <div class="sidebar-item" onclick="switchTab('profile')">
      <i class="fas fa-user-cog"></i> Profile Settings
    </div>
    <div class="sidebar-item" onclick="switchTab('logs')">
      <i class="fas fa-history"></i> Activity Logs
    </div>
  `;

  if (role === CONFIG.ROLES.USER) {
    linksHtml = `
      ${commonTop}
      <div class="sidebar-item" onclick="switchTab('user-bookings')">
        <i class="fas fa-ticket-alt"></i> My Bookings
      </div>
      <div class="sidebar-item" onclick="switchTab('user-reviews')">
        <i class="fas fa-star"></i> My Reviews
      </div>
      ${commonBottom}
    `;
  } else if (role === CONFIG.ROLES.STAFF) {
    linksHtml = `
      ${commonTop}
      <div class="sidebar-item" onclick="switchTab('staff-scanner')">
        <i class="fas fa-qrcode"></i> Ticket Scanner
      </div>
      <div class="sidebar-item" onclick="switchTab('staff-bookings')">
        <i class="fas fa-users"></i> Attendee List
      </div>
      <div class="sidebar-item" onclick="switchTab('staff-schedule')">
        <i class="fas fa-calendar-alt"></i> Event Schedule
      </div>
      ${commonBottom}
    `;
  } else if (role === CONFIG.ROLES.MANAGER) {
    linksHtml = `
      ${commonTop}
      <div class="sidebar-item" onclick="switchTab('mng-events')">
        <i class="fas fa-calendar-plus"></i> Manage Events
      </div>
      <div class="sidebar-item" onclick="switchTab('mng-bookings')">
        <i class="fas fa-receipt"></i> Event Bookings
      </div>
      <div class="sidebar-item" onclick="switchTab('mng-staff')">
        <i class="fas fa-user-shield"></i> Manage Staff
      </div>
      <div class="sidebar-item" onclick="switchTab('mng-reviews')">
        <i class="fas fa-star-half-alt"></i> Moderation
      </div>
      <div class="sidebar-item" onclick="switchTab('broadcast')">
        <i class="fas fa-paper-plane"></i> Broadcast Message
      </div>
      ${commonBottom}
    `;
  } else if (role === CONFIG.ROLES.SYSTEM_OWNER) {
    linksHtml = `
      ${commonTop}
      <div class="sidebar-item" onclick="switchTab('sys-managers')">
        <i class="fas fa-user-tie"></i> Manage Managers
      </div>
      <div class="sidebar-item" onclick="switchTab('sys-users')">
        <i class="fas fa-users-cog"></i> Manage Users
      </div>
      <div class="sidebar-item" onclick="switchTab('sys-categories')">
        <i class="fas fa-tags"></i> Event Categories
      </div>
      <div class="sidebar-item" onclick="switchTab('mng-events')">
        <i class="fas fa-calendar-plus"></i> Manage Events
      </div>
      <div class="sidebar-item" onclick="switchTab('mng-bookings')">
        <i class="fas fa-receipt"></i> Event Bookings
      </div>
      <div class="sidebar-item" onclick="switchTab('mng-staff')">
        <i class="fas fa-user-shield"></i> Manage Staff
      </div>
      <div class="sidebar-item" onclick="switchTab('broadcast')">
        <i class="fas fa-paper-plane"></i> Broadcast Message
      </div>
      ${commonBottom}
    `;
  }

  sidebar.innerHTML = `
    <div class="sidebar-menu">
      ${linksHtml}
    </div>
  `;
}

/**
 * Cache categories list for category form dropdown selector
 */
async function loadCategoriesCache() {
  const res = await API.get(CONFIG.ENDPOINTS.CATEGORIES.LIST);
  if (res.success && Array.isArray(res.data)) {
    loadedCategories = res.data.filter(c => c.isActive);
    // Populate Event Select Option in Event Modal form
    const sel = document.getElementById('evt-category');
    if (sel) {
      sel.innerHTML = loadedCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  }
}

/**
 * Handle routing and render panel contents dynamically
 */
function renderPanel(tabId) {
  const panel = document.getElementById('tab-panels-content');
  const greetingTitle = document.getElementById('welcome-title');
  const greetingSubtitle = document.getElementById('welcome-subtitle');
  const user = AUTH.getUser();

  greetingTitle.textContent = `Hello, ${UI.escapeHTML(user.name)}!`;
  greetingSubtitle.textContent = `Account Role: ${activeUserRole === 'USER' ? 'Attendee' : activeUserRole.replace('_', ' ')}`;

  // Clear container
  panel.innerHTML = '';

  switch (tabId) {
    case 'overview':
      renderOverviewTab(panel);
      break;
    case 'notifications':
      renderNotificationsTab(panel);
      break;
    case 'profile':
      renderProfileTab(panel);
      break;
    case 'logs':
      renderLogsTab(panel);
      break;

    // USER TABS
    case 'user-bookings':
      renderUserBookingsTab(panel);
      break;
    case 'user-reviews':
      renderUserReviewsTab(panel);
      break;

    // STAFF TABS
    case 'staff-scanner':
      renderStaffScannerTab(panel);
      break;
    case 'staff-bookings':
      renderStaffBookingsTab(panel);
      break;
    case 'staff-schedule':
      renderStaffScheduleTab(panel);
      break;

    // MANAGER & ADMIN SHARED TABS
    case 'mng-events':
      renderManagerEventsTab(panel);
      break;
    case 'mng-bookings':
      renderManagerBookingsTab(panel);
      break;
    case 'mng-staff':
      renderManagerStaffTab(panel);
      break;
    case 'mng-reviews':
      renderManagerReviewsTab(panel);
      break;
    case 'broadcast':
      renderBroadcastTab(panel);
      break;

    // ADMIN TABS
    case 'sys-managers':
      renderSystemManagersTab(panel);
      break;
    case 'sys-users':
      renderSystemUsersTab(panel);
      break;
    case 'sys-categories':
      renderSystemCategoriesTab(panel);
      break;

    default:
      panel.innerHTML = `<h3>Tab ${tabId} coming soon.</h3>`;
  }
}

/* ======================================================== */
/* 1. TAB: OVERVIEW METRICS */

async function renderOverviewTab(container) {
  container.innerHTML = `
    <!-- Stats Cards Grid -->
    <div class="stats-grid" id="overview-stats-cards">
      <div style="grid-column: 1/-1; text-align: center; padding: 20px;">
        <div class="loader-spinner" style="margin: 0 auto; width: 30px; height: 30px;"></div>
      </div>
    </div>

    <!-- Chart Panel -->
    <div class="glass-panel" id="overview-chart-panel" style="padding: 30px; margin-top: 30px; display: none;">
      <h3 style="font-size: 18px; margin-bottom: 20px;"><i class="fas fa-chart-bar"></i> Analytics Chart</h3>
      <div style="position: relative; height: 300px; width: 100%;">
        <canvas id="overview-analytics-chart"></canvas>
      </div>
    </div>
  `;

  const res = await API.get(CONFIG.ENDPOINTS.DASHBOARD.OVERVIEW);
  if (res.success && res.data) {
    dashboardOverviewData = res.data;
    const stats = res.data.stats || {};
    const cardsContainer = document.getElementById('overview-stats-cards');
    let cardsHtml = '';

    if (activeUserRole === CONFIG.ROLES.USER) {
      cardsHtml = `
        <div class="stat-card glass-panel indigo">
          <div class="stat-info"><h3>Total Bookings</h3><div class="stat-value">${stats.totalBookings || 0}</div></div>
          <div class="stat-icon"><i class="fas fa-ticket-alt"></i></div>
        </div>
        <div class="stat-card glass-panel success">
          <div class="stat-info"><h3>Attended Events</h3><div class="stat-value">${stats.attendedBookings || 0}</div></div>
          <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
        </div>
        <div class="stat-card glass-panel pink">
          <div class="stat-info"><h3>Total Spent</h3><div class="stat-value">${UI.formatCurrency(stats.totalSpent || 0)}</div></div>
          <div class="stat-icon"><i class="fas fa-wallet"></i></div>
        </div>
        <div class="stat-card glass-panel info">
          <div class="stat-info"><h3>Total Reviews</h3><div class="stat-value">${stats.totalReviews || 0}</div></div>
          <div class="stat-icon"><i class="fas fa-star"></i></div>
        </div>
      `;
    } else if (activeUserRole === CONFIG.ROLES.STAFF) {
      cardsHtml = `
        <div class="stat-card glass-panel indigo">
          <div class="stat-info"><h3>Today's Check-ins</h3><div class="stat-value">${stats.todayCheckIns || 0}</div></div>
          <div class="stat-icon"><i class="fas fa-qrcode"></i></div>
        </div>
        <div class="stat-card glass-panel success">
          <div class="stat-info"><h3>Verified Bookings</h3><div class="stat-value">${stats.verifiedTickets || 0}</div></div>
          <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
        </div>
        <div class="stat-card glass-panel info">
          <div class="stat-info"><h3>Total Events Schedule</h3><div class="stat-value">${stats.totalEvents || 0}</div></div>
          <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
        </div>
      `;
    } else {
      // Manager & System Owner counters
      cardsHtml = `
        <div class="stat-card glass-panel indigo">
          <div class="stat-info"><h3>Total Revenue</h3><div class="stat-value">${UI.formatCurrency(stats.totalRevenue || 0)}</div></div>
          <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
        </div>
        <div class="stat-card glass-panel success">
          <div class="stat-info"><h3>Tickets Sold</h3><div class="stat-value">${stats.totalBookings || 0}</div></div>
          <div class="stat-icon"><i class="fas fa-ticket-alt"></i></div>
        </div>
        <div class="stat-card glass-panel pink">
          <div class="stat-info"><h3>Active Events</h3><div class="stat-value">${stats.totalEvents || 0}</div></div>
          <div class="stat-icon"><i class="fas fa-rocket"></i></div>
        </div>
        <div class="stat-card glass-panel info">
          <div class="stat-info"><h3>Staff Members</h3><div class="stat-value">${stats.totalStaff || 0}</div></div>
          <div class="stat-icon"><i class="fas fa-users-cog"></i></div>
        </div>
      `;
    }

    cardsContainer.innerHTML = cardsHtml;

    // Load Charts for Managers and Admins
    if (activeUserRole !== CONFIG.ROLES.USER && activeUserRole !== CONFIG.ROLES.STAFF && res.data.chartData) {
      document.getElementById('overview-chart-panel').style.display = 'block';
      renderOverviewChart(res.data.chartData);
    }
  } else {
    document.getElementById('overview-stats-cards').innerHTML = `<p style="color: var(--danger); text-align: center;">${res.message}</p>`;
  }
}

function renderOverviewChart(chartData) {
  const ctx = document.getElementById('overview-analytics-chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Monthly Revenue (BDT)',
        data: chartData.data || [0, 0, 0, 0, 0, 0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
      },
      plugins: {
        legend: { labels: { color: '#f8fafc' } }
      }
    }
  });
}

/* ======================================================== */
/* 2. TAB: MY BOOKINGS (USER) */

async function renderUserBookingsTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <h3 style="font-size: 18px; margin-bottom: 20px;"><i class="fas fa-ticket-alt"></i> My Event Tickets</h3>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Booking Date</th>
              <th>Seats</th>
              <th>Total Amount</th>
              <th>Check-in Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="user-bookings-rows">
            <!-- Row Loader -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  UI.renderSkeleton('#user-bookings-rows', 3, 'table');
  const res = await API.get(CONFIG.ENDPOINTS.BOOKINGS.MY_BOOKINGS);

  if (res.success && Array.isArray(res.data)) {
    const tbody = document.getElementById('user-bookings-rows');
    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">You have no active or historical bookings.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    res.data.forEach(bk => {
      const dateStr = UI.formatDate(bk.createdAt);
      const isPending = bk.status === 'PENDING';
      const isConfirmed = bk.status === 'CONFIRMED';
      const isAttended = bk.status === 'ATTENDED';

      const statusBadge = isAttended 
        ? '<span class="badge badge-completed">Attended</span>'
        : (bk.status === 'CANCELLED' ? '<span class="badge badge-cancelled">Cancelled</span>' : `<span class="badge badge-pending">${bk.status}</span>`);

      const cancelBtn = (isPending || isConfirmed)
        ? `<button class="btn btn-danger btn-sm" onclick="cancelUserBooking('${bk.id}')">Cancel</button>`
        : '';

      const viewBtn = bk.status !== 'CANCELLED'
        ? `<a href="ticket.html?id=${bk.id}" class="btn btn-primary btn-sm">View Pass</a>`
        : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${UI.escapeHTML(bk.event?.title || 'Unknown Event')}</strong></td>
        <td>${dateStr}</td>
        <td>${bk.seatCount} Seat${bk.seatCount > 1 ? 's' : ''}</td>
        <td>${UI.formatCurrency(bk.totalAmount)}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions-cell">
            ${viewBtn}
            ${cancelBtn}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('user-bookings-rows').innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">${res.message}</td></tr>`;
  }
}

// Cancel booking action (USER)
function cancelUserBooking(bookingId) {
  UI.confirm('Cancel Booking', 'Are you sure you want to cancel this ticket booking? This action cannot be undone.', async () => {
    UI.showLoader();
    const res = await API.patch(CONFIG.ENDPOINTS.BOOKINGS.CANCEL_MY_BOOKING(bookingId), {
      cancellationReason: 'Cancelled by Attendee from user dashboard.'
    });
    UI.hideLoader();

    if (res.success) {
      UI.toast('Booking cancelled successfully!', 'success');
      switchTab('user-bookings');
    } else {
      UI.toast(res.message || 'Failed to cancel booking.', 'error');
    }
  });
}

/* ======================================================== */
/* 3. TAB: MY REVIEWS (USER) */

async function renderUserReviewsTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <h3 style="font-size: 18px; margin-bottom: 20px;"><i class="fas fa-star"></i> My Submitted Reviews</h3>
      <div id="user-reviews-list">
        <!-- Loader -->
      </div>
    </div>
  `;

  const list = document.getElementById('user-reviews-list');
  list.innerHTML = `<div class="loader-spinner" style="margin: 0 auto;"></div>`;

  const res = await API.get(CONFIG.ENDPOINTS.REVIEWS.MY_REVIEWS);
  if (res.success && Array.isArray(res.data)) {
    if (res.data.length === 0) {
      list.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 30px;">You have not submitted any event reviews yet.</p>`;
      return;
    }

    list.innerHTML = '';
    res.data.forEach(rev => {
      const item = document.createElement('div');
      item.className = 'log-item';
      
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fa${i <= rev.rating ? 's' : 'r'} fa-star" style="color: var(--warning); font-size: 12px;"></i> `;
      }

      item.innerHTML = `
        <div class="log-icon"><i class="fas fa-star" style="color: var(--warning);"></i></div>
        <div class="log-body">
          <div class="log-title" style="display: flex; justify-content: space-between;">
            <span>Reviewed: <strong>${UI.escapeHTML(rev.event?.title || 'Unknown Event')}</strong></span>
            <div>${starsHtml}</div>
          </div>
          <div class="log-details" style="margin-top: 8px;">"${UI.escapeHTML(rev.comment || '')}"</div>
          <div class="log-time">${UI.formatDate(rev.createdAt, true)}</div>
        </div>
        <div style="align-self: center; display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="deleteUserReview('${rev.id}')"><i class="fas fa-trash"></i> Delete</button>
        </div>
      `;
      list.appendChild(item);
    });
  } else {
    list.innerHTML = `<p style="color: var(--danger); text-align: center;">${res.message}</p>`;
  }
}

// Delete Review (USER)
function deleteUserReview(reviewId) {
  UI.confirm('Delete Review', 'Are you sure you want to permanently delete this review?', async () => {
    UI.showLoader();
    const res = await API.delete(CONFIG.ENDPOINTS.REVIEWS.DELETE(reviewId));
    UI.hideLoader();

    if (res.success) {
      UI.toast('Review deleted successfully!', 'success');
      switchTab('user-reviews');
    } else {
      UI.toast(res.message || 'Failed to delete review.', 'error');
    }
  });
}

/* ======================================================== */
/* 4. TAB: STAFF TICKET SCANNER & VERIFICATION */

function renderStaffScannerTab(container) {
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
      
      <!-- Left QR stream / Manual Input -->
      <div class="glass-panel" style="padding: 30px;">
        <h3 style="font-size: 18px; margin-bottom: 20px;"><i class="fas fa-qrcode"></i> Scan Pass</h3>
        
        <!-- Live camera view -->
        <div class="scanner-container">
          <div class="scanner-video-wrapper" id="reader-scanner-area">
            <!-- HTML5 QR Code will mount camera viewport here -->
          </div>
          <p style="font-size: 12px; color: var(--text-secondary);">Center the ticket QR code in the camera frame to scan.</p>
          <div style="display: flex; gap: 10px; width: 100%;">
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="startQRScanner()"><i class="fas fa-camera"></i> Start Scanner</button>
            <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="stopQRScanner()"><i class="fas fa-video-slash"></i> Stop</button>
          </div>
        </div>

        <div style="margin-top: 30px; border-top: 1px solid var(--glass-border); padding-top: 24px;">
          <h4 style="font-size: 15px; margin-bottom: 12px;">Manual Code Verification</h4>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="manual-ticket-code" class="form-control" placeholder="eg. EVNT-2026-X89">
            <button class="btn btn-primary" onclick="verifyTicketManual()"><i class="fas fa-check"></i> Verify</button>
          </div>
        </div>
      </div>

      <!-- Right Scan Results details card -->
      <div class="glass-panel" style="padding: 30px; display: flex; flex-direction: column; justify-content: center;" id="scanner-result-card">
        <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
          <i class="fas fa-ticket-alt" style="font-size: 48px; color: var(--text-muted); margin-bottom: 20px;"></i>
          <h3>No scanned result</h3>
          <p style="margin-top: 10px; font-size: 14px;">Scan a ticket or enter a booking code to display information.</p>
        </div>
      </div>

    </div>
  `;
}

// Start HTML5 Live QR Camera Scanner stream
function startQRScanner() {
  stopQRScanner(); // Stop existing

  const readerArea = document.getElementById('reader-scanner-area');
  if (!readerArea) return;

  readerArea.innerHTML = ''; // Clear

  html5QrcodeScanner = new Html5Qrcode('reader-scanner-area');
  html5QrcodeScanner.start(
    { facingMode: "environment" }, // Rear camera
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    async (decodedText) => {
      // QR successfully decoded
      stopQRScanner();
      UI.toast(`QR Pass scanned! Verifying code: ${decodedText}...`, 'info');
      verifyTicketCode(decodedText);
    },
    (errorMessage) => {
      // Ignore scanner search failures
    }
  ).catch(err => {
    console.error(err);
    UI.toast('Unable to access camera or grant permission.', 'error');
  });
}

function stopQRScanner() {
  if (html5QrcodeScanner) {
    try {
      html5QrcodeScanner.stop().then(() => {
        html5QrcodeScanner = null;
      }).catch(err => {
        html5QrcodeScanner = null;
      });
    } catch {
      html5QrcodeScanner = null;
    }
  }
}

// Trigger manual validation input
function verifyTicketManual() {
  const code = document.getElementById('manual-ticket-code').value.trim();
  if (!code) {
    UI.toast('Please enter a ticket booking code.', 'warning');
    return;
  }
  verifyTicketCode(code);
}

// Send booking code to `/bookings/verify-ticket`
async function verifyTicketCode(code) {
  const resultCard = document.getElementById('scanner-result-card');
  resultCard.innerHTML = `<div class="loader-spinner" style="margin: 0 auto;"></div>`;

  const res = await API.post(CONFIG.ENDPOINTS.BOOKINGS.VERIFY_TICKET, { bookingCode: code });
  
  if (res.success && res.data) {
    const booking = res.data;
    const evt = booking.event || {};
    const attendee = booking.user || {};

    const isAttended = booking.status === 'ATTENDED';
    const isCancelled = booking.status === 'CANCELLED';
    
    let actionBtn = '';
    if (!isAttended && !isCancelled) {
      actionBtn = `<button class="btn btn-primary btn-lg" style="width: 100%; margin-top: 24px;" onclick="checkInTicketAttendee('${booking.id}')"><i class="fas fa-check-double"></i> Check-in & Admit Attendee</button>`;
    } else if (isAttended) {
      actionBtn = `<div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); color: var(--success); padding: 12px; border-radius: var(--border-radius-sm); text-align: center; font-weight: 700; margin-top: 24px;">Already Checked In & Admitted</div>`;
    } else {
      actionBtn = `<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); color: var(--danger); padding: 12px; border-radius: var(--border-radius-sm); text-align: center; font-weight: 700; margin-top: 24px;">Booking Cancelled</div>`;
    }

    resultCard.innerHTML = `
      <div style="border-bottom: 1px solid var(--glass-border); padding-bottom: 16px; margin-bottom: 20px; text-align: center;">
        <span class="badge ${isAttended ? 'badge-completed' : (isCancelled ? 'badge-cancelled' : 'badge-pending')}" style="font-size: 14px; padding: 6px 16px;">
          ${booking.status === 'ATTENDED' ? 'ADMITTED' : booking.status}
        </span>
        <h3 style="font-size: 20px; margin-top: 10px; color: var(--accent-pink);">${booking.bookingCode}</h3>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
        <p><strong>Event:</strong> ${UI.escapeHTML(evt.title)}</p>
        <p><strong>Date/Time:</strong> ${UI.formatDate(evt.date)} @ ${evt.time}</p>
        <p><strong>Attendee Name:</strong> ${UI.escapeHTML(attendee.name)}</p>
        <p><strong>Attendee Email:</strong> ${UI.escapeHTML(attendee.email)}</p>
        <p><strong>Seat passes:</strong> <span style="font-size: 16px; font-weight: 800; color:#fff;">${booking.seatCount} Seat${booking.seatCount > 1 ? 's' : ''}</span></p>
        <p><strong>Payment Status:</strong> <strong class="${booking.paymentStatus === 'PAID' ? 'text-success' : 'text-danger'}">${booking.paymentStatus}</strong></p>
      </div>

      ${actionBtn}
    `;
  } else {
    UI.toast(res.message || 'Ticket code is invalid or not found.', 'error');
    resultCard.innerHTML = `
      <div style="text-align: center; color: var(--danger); padding: 40px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
        <h3>Verification Failed</h3>
        <p style="margin-top: 10px; font-size: 14px;">${res.message || 'Ticket booking code is invalid or does not exist.'}</p>
      </div>
    `;
  }
}

// Admit Check-In status update to Attended
async function checkInTicketAttendee(bookingId) {
  UI.showLoader();
  const res = await API.patch(CONFIG.ENDPOINTS.BOOKINGS.UPDATE_BOOKING(bookingId), {
    status: 'ATTENDED'
  });
  UI.hideLoader();

  if (res.success && res.data) {
    UI.toast('Attendee successfully checked in!', 'success');
    // Refresh card view
    verifyTicketCode(res.data.bookingCode);
  } else {
    UI.toast(res.message || 'Failed to check in ticket.', 'error');
  }
}

/* ======================================================== */
/* 5. TAB: ATTENDEE LIST & BOOKINGS (STAFF / MANAGER / ADMIN) */

async function renderStaffBookingsTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <div class="table-controls">
        <h3 style="font-size: 18px;"><i class="fas fa-users"></i> Event Bookings List</h3>
      </div>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Booking Code</th>
              <th>Event Title</th>
              <th>Attendee Details</th>
              <th>Seat passes</th>
              <th>Check-in Status</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="staff-bookings-rows">
            <!-- Rows load here -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  UI.renderSkeleton('#staff-bookings-rows', 3, 'table');
  
  // Managers, staff, owners can list all bookings
  const res = await API.get(CONFIG.ENDPOINTS.BOOKINGS.ALL_BOOKINGS);

  if (res.success && Array.isArray(res.data)) {
    const tbody = document.getElementById('staff-bookings-rows');
    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">No attendee bookings are registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    res.data.forEach(bk => {
      const isPending = bk.status === 'PENDING';
      const isConfirmed = bk.status === 'CONFIRMED';
      const isAttended = bk.status === 'ATTENDED';

      const statusBadge = isAttended 
        ? '<span class="badge badge-completed">Attended</span>'
        : (bk.status === 'CANCELLED' ? '<span class="badge badge-cancelled">Cancelled</span>' : `<span class="badge badge-pending">${bk.status}</span>`);

      const paymentBadge = bk.paymentStatus === 'PAID'
        ? '<span class="badge badge-completed">PAID</span>'
        : `<span class="badge badge-pending">${bk.paymentStatus}</span>`;

      // Admit button
      let admitBtn = '';
      if (!isAttended && bk.status !== 'CANCELLED') {
        admitBtn = `<button class="btn btn-primary btn-sm" onclick="checkInTicketAttendee('${bk.id}').then(() => switchTab('staff-bookings'))">Check-In</button>`;
      }

      // Manager/Admin can delete or force refund
      let deleteBtn = '';
      if (activeUserRole === CONFIG.ROLES.SYSTEM_OWNER || activeUserRole === CONFIG.ROLES.MANAGER) {
        deleteBtn = `<button class="btn btn-secondary btn-sm" onclick="deleteBookingRecord('${bk.id}')"><i class="fas fa-trash"></i></button>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--accent-pink);">${bk.bookingCode}</strong></td>
        <td>${UI.escapeHTML(bk.event?.title || 'Unknown')}</td>
        <td>
          <div class="user-cell">
            <img src="${bk.user?.avatarUrl || 'https://i.ibb.co/tPp28rV/avatar-placeholder.png'}" onerror="this.src='https://i.ibb.co/tPp28rV/avatar-placeholder.png'">
            <div>
              <p style="font-weight:600;">${UI.escapeHTML(bk.user?.name || 'User')}</p>
              <p style="font-size:11px; color:var(--text-secondary);">${UI.escapeHTML(bk.user?.email || '')}</p>
            </div>
          </div>
        </td>
        <td>${bk.seatCount} Seat${bk.seatCount > 1 ? 's' : ''}</td>
        <td>${statusBadge}</td>
        <td>${paymentBadge}</td>
        <td>
          <div class="actions-cell">
            ${admitBtn}
            ${deleteBtn}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('staff-bookings-rows').innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">${res.message}</td></tr>`;
  }
}

// Delete/Void booking record (Manager/Admin)
function deleteBookingRecord(id) {
  UI.confirm('Delete Booking', 'Are you sure you want to permanently delete this booking registration from the system?', async () => {
    UI.showLoader();
    const res = await API.delete(CONFIG.ENDPOINTS.BOOKINGS.DELETE_BOOKING(id));
    UI.hideLoader();

    if (res.success) {
      UI.toast('Booking deleted successfully!', 'success');
      switchTab('staff-bookings');
    } else {
      UI.toast(res.message || 'Failed to delete booking.', 'error');
    }
  });
}

/* ======================================================== */
/* 6. TAB: EVENT SCHEDULE (STAFF) */

async function renderStaffScheduleTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <h3 style="font-size: 18px; margin-bottom: 20px;"><i class="fas fa-calendar-alt"></i> Events Schedule</h3>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date & Time</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="staff-schedule-rows">
            <!-- Loader -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  UI.renderSkeleton('#staff-schedule-rows', 3, 'table');
  const res = await API.get(CONFIG.ENDPOINTS.EVENTS.LIST);

  if (res.success && Array.isArray(res.data)) {
    const tbody = document.getElementById('staff-schedule-rows');
    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 30px;">No events are currently scheduled.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    res.data.forEach(evt => {
      const dateStr = UI.formatDate(evt.date);
      const badgeClass = evt.status === 'UPCOMING' ? 'badge-upcoming' : (evt.status === 'ONGOING' ? 'badge-ongoing' : 'badge-completed');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${UI.escapeHTML(evt.title)}</strong></td>
        <td>${dateStr} @ ${evt.time}</td>
        <td>${UI.escapeHTML(evt.location)}</td>
        <td>${evt.availableSeats} / ${evt.seatCount} Available</td>
        <td><span class="badge ${badgeClass}">${evt.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('staff-schedule-rows').innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">${res.message}</td></tr>`;
  }
}

/* ======================================================== */
/* 7. TAB: MANAGER / ADMIN EVENT CRUD */

async function renderManagerEventsTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <div class="table-controls">
        <div>
          <h3 style="font-size: 18px;"><i class="fas fa-calendar-plus"></i> Events Catalog Management</h3>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openEventCrudModal()"><i class="fas fa-plus"></i> Add Event</button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Date & Time</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="mng-events-rows">
            <!-- Loader -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  UI.renderSkeleton('#mng-events-rows', 3, 'table');
  const res = await API.get(CONFIG.ENDPOINTS.EVENTS.LIST);

  if (res.success && Array.isArray(res.data)) {
    const tbody = document.getElementById('mng-events-rows');
    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">No events created yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    res.data.forEach(evt => {
      const badgeClass = evt.status === 'UPCOMING' ? 'badge-upcoming' : (evt.status === 'ONGOING' ? 'badge-ongoing' : 'badge-completed');
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${UI.escapeHTML(evt.title)}</strong></td>
        <td>${UI.escapeHTML(evt.category?.name || 'General')}</td>
        <td>${evt.ticketPrice > 0 ? UI.formatCurrency(evt.ticketPrice) : 'Free'}</td>
        <td>${UI.formatDate(evt.date)} @ ${evt.time}</td>
        <td>${evt.availableSeats} / ${evt.seatCount}</td>
        <td><span class="badge ${badgeClass}">${evt.status}</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-secondary btn-sm" onclick="openEventCrudModal('${evt.id}')"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="deleteEventRecord('${evt.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('mng-events-rows').innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">${res.message}</td></tr>`;
  }
}

// Open modal for add or edit event
async function openEventCrudModal(editId = '') {
  const form = document.getElementById('event-crud-form');
  form.reset();

  document.getElementById('event-edit-id').value = editId;

  if (editId) {
    document.getElementById('event-modal-title').textContent = 'Edit Event Details';
    UI.showLoader();
    const res = await API.get(CONFIG.ENDPOINTS.EVENTS.GET_ONE(editId));
    UI.hideLoader();

    if (res.success && res.data) {
      const evt = res.data;
      document.getElementById('evt-title').value = evt.title;
      document.getElementById('evt-category').value = evt.categoryId;
      document.getElementById('evt-price').value = evt.ticketPrice;
      document.getElementById('evt-location').value = evt.location;
      document.getElementById('evt-seats').value = evt.seatCount;
      document.getElementById('evt-status').value = evt.status;
      document.getElementById('evt-desc').value = evt.description || evt.about || '';
      
      if (evt.date) {
        document.getElementById('evt-date').value = evt.date.split('T')[0];
      }
      document.getElementById('evt-time').value = evt.time;

      // Highlights
      const h = evt.eventHighlight || {};
      document.getElementById('evt-highlight-dress').value = h.dressCode || '';
      document.getElementById('evt-highlight-workshops').value = h.workshops || '';
      document.getElementById('evt-highlight-wifi').value = h.wifiAvailable === false ? 'false' : 'true';
      document.getElementById('evt-highlight-parking').value = h.parkingFacility || '';
    }
  } else {
    document.getElementById('event-modal-title').textContent = 'Create New Event';
  }

  UI.openModal('event-crud-modal');
}

// Delete Event action
function deleteEventRecord(id) {
  UI.confirm('Delete Event', 'Are you sure you want to permanently delete this event? All related bookings will be removed.', async () => {
    UI.showLoader();
    const res = await API.delete(CONFIG.ENDPOINTS.EVENTS.DELETE(id));
    UI.hideLoader();

    if (res.success) {
      UI.toast('Event deleted successfully!', 'success');
      switchTab('mng-events');
    } else {
      UI.toast(res.message || 'Failed to delete event.', 'error');
    }
  });
}

/* ======================================================== */
/* 8. TAB: MANAGER BOOKINGS WRAPPER */

// We inherit same template structure as Staff Bookings view
function renderManagerBookingsTab(container) {
  renderStaffBookingsTab(container);
}

/* ======================================================== */
/* 9. TAB: CRUD STAFF (MANAGER / SYSTEM OWNER) */

async function renderManagerStaffTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <div class="table-controls">
        <h3 style="font-size: 18px;"><i class="fas fa-user-shield"></i> Staff Members Directory</h3>
        <button class="btn btn-primary btn-sm" onclick="openStaffCrudModal()"><i class="fas fa-plus"></i> Add Staff</button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Staff Details</th>
              <th>Email</th>
              <th>Status</th>
              <th>Date Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="mng-staff-rows">
            <!-- Loader -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  UI.renderSkeleton('#mng-staff-rows', 3, 'table');
  const res = await API.get(CONFIG.ENDPOINTS.STAFF.LIST);

  if (res.success && Array.isArray(res.data)) {
    const tbody = document.getElementById('mng-staff-rows');
    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 30px;">No staff accounts are registered.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    res.data.forEach(st => {
      const user = st.user || st;
      const statusBadge = user.status === 'ACTIVE' 
        ? '<span class="badge badge-completed">Active</span>'
        : '<span class="badge badge-cancelled">Suspended</span>';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="user-cell">
            <img src="${user.avatarUrl || 'https://i.ibb.co/tPp28rV/avatar-placeholder.png'}" onerror="this.src='https://i.ibb.co/tPp28rV/avatar-placeholder.png'">
            <strong>${UI.escapeHTML(user.name)}</strong>
          </div>
        </td>
        <td>${UI.escapeHTML(user.email)}</td>
        <td>${statusBadge}</td>
        <td>${UI.formatDate(user.createdAt)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-secondary btn-sm" onclick="openStaffCrudModal('${st.id}')"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="deleteStaffRecord('${st.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('mng-staff-rows').innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">${res.message}</td></tr>`;
  }
}

// Open staff CRUD modal form
async function openStaffCrudModal(editId = '') {
  const form = document.getElementById('staff-crud-form');
  form.reset();

  document.getElementById('staff-edit-id').value = editId;
  const passGroup = document.getElementById('stf-password-wrapper');

  if (editId) {
    document.getElementById('staff-modal-title').textContent = 'Edit Staff Details';
    passGroup.style.display = 'none'; // Cannot edit password from here
    document.getElementById('stf-password').required = false;

    UI.showLoader();
    const res = await API.get(CONFIG.ENDPOINTS.STAFF.GET_ONE(editId));
    UI.hideLoader();

    if (res.success && res.data) {
      const st = res.data;
      const u = st.user || st;
      document.getElementById('stf-name').value = u.name;
      document.getElementById('stf-email').value = u.email;
    }
  } else {
    document.getElementById('staff-modal-title').textContent = 'Create New Staff Member';
    passGroup.style.display = 'block';
    document.getElementById('stf-password').required = true;
  }

  UI.openModal('staff-crud-modal');
}

// Delete Staff record
function deleteStaffRecord(id) {
  UI.confirm('Delete Staff Member', 'Are you sure you want to permanently delete this staff member account?', async () => {
    UI.showLoader();
    const res = await API.delete(CONFIG.ENDPOINTS.STAFF.DELETE(id));
    UI.hideLoader();

    if (res.success) {
      UI.toast('Staff account deleted successfully!', 'success');
      switchTab('mng-staff');
    } else {
      UI.toast(res.message || 'Failed to delete staff account.', 'error');
    }
  });
}

/* ======================================================== */
/* 10. TAB: SYSTEM MANAGERS CRUD (ADMIN) */

async function renderSystemManagersTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <div class="table-controls">
        <h3 style="font-size: 18px;"><i class="fas fa-user-tie"></i> Event Managers Directory</h3>
        <button class="btn btn-primary btn-sm" onclick="openManagerCrudModal()"><i class="fas fa-plus"></i> Add Manager</button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Manager</th>
              <th>Contact Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="sys-managers-rows">
            <!-- Loader -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  UI.renderSkeleton('#sys-managers-rows', 3, 'table');
  const res = await API.get(CONFIG.ENDPOINTS.MANAGERS.LIST);

  if (res.success && Array.isArray(res.data)) {
    const tbody = document.getElementById('sys-managers-rows');
    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">No manager accounts registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    res.data.forEach(mng => {
      const u = mng.user || {};
      const statusBadge = u.status === 'ACTIVE' 
        ? '<span class="badge badge-completed">Active</span>'
        : '<span class="badge badge-cancelled">Suspended</span>';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="user-cell">
            <img src="${u.avatarUrl || 'https://i.ibb.co/tPp28rV/avatar-placeholder.png'}" onerror="this.src='https://i.ibb.co/tPp28rV/avatar-placeholder.png'">
            <strong>${UI.escapeHTML(u.name)}</strong>
          </div>
        </td>
        <td>${UI.escapeHTML(u.email)}</td>
        <td>${UI.escapeHTML(mng.phoneNumber || 'N/A')}</td>
        <td>${UI.escapeHTML(mng.location || 'N/A')}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-secondary btn-sm" onclick="openManagerCrudModal('${mng.id}')"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="deleteManagerRecord('${mng.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('sys-managers-rows').innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">${res.message}</td></tr>`;
  }
}

// Open manager CRUD modal
async function openManagerCrudModal(editId = '') {
  const form = document.getElementById('manager-crud-form');
  form.reset();

  document.getElementById('mng-edit-id').value = editId;
  const passGroup = document.getElementById('mng-password-wrapper');

  if (editId) {
    document.getElementById('manager-modal-title').textContent = 'Edit Manager Account';
    passGroup.style.display = 'none';
    document.getElementById('mng-password').required = false;

    UI.showLoader();
    const res = await API.get(CONFIG.ENDPOINTS.MANAGERS.GET_ONE(editId));
    UI.hideLoader();

    if (res.success && res.data) {
      const mng = res.data;
      const u = mng.user || {};
      document.getElementById('mng-name').value = u.name;
      document.getElementById('mng-email').value = u.email;
      document.getElementById('mng-phone').value = mng.phoneNumber || '';
      document.getElementById('mng-location').value = mng.location || '';
    }
  } else {
    document.getElementById('manager-modal-title').textContent = 'Create New Manager';
    passGroup.style.display = 'block';
    document.getElementById('mng-password').required = true;
  }

  UI.openModal('manager-crud-modal');
}

// Delete Manager record
function deleteManagerRecord(id) {
  UI.confirm('Delete Manager Account', 'Are you sure you want to permanently delete this manager? All events managed by them will remain but their profiles will be unlinked.', async () => {
    UI.showLoader();
    const res = await API.delete(CONFIG.ENDPOINTS.MANAGERS.DELETE(id));
    UI.hideLoader();

    if (res.success) {
      UI.toast('Manager deleted successfully!', 'success');
      switchTab('sys-managers');
    } else {
      UI.toast(res.message || 'Failed to delete manager account.', 'error');
    }
  });
}

/* ======================================================== */
/* 11. TAB: EVENT CATEGORIES CRUD (ADMIN) */

async function renderSystemCategoriesTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <div class="table-controls">
        <h3 style="font-size: 18px;"><i class="fas fa-tags"></i> Event Categories Management</h3>
        <button class="btn btn-primary btn-sm" onclick="openCategoryCrudModal()"><i class="fas fa-plus"></i> Add Category</button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="sys-categories-rows">
            <!-- Loader -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  UI.renderSkeleton('#sys-categories-rows', 3, 'table');
  const res = await API.get(CONFIG.ENDPOINTS.CATEGORIES.LIST);

  if (res.success && Array.isArray(res.data)) {
    const tbody = document.getElementById('sys-categories-rows');
    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 30px;">No categories created.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    res.data.forEach(cat => {
      const statusBadge = cat.isActive 
        ? '<span class="badge badge-completed">Active</span>'
        : '<span class="badge badge-cancelled">Inactive</span>';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <img src="${cat.iconUrl || 'https://i.ibb.co/gLxnPfv7/ee0e96d57acc.png'}" style="width:30px; height:30px; object-fit:contain;" onerror="this.src='https://i.ibb.co/gLxnPfv7/ee0e96d57acc.png'">
        </td>
        <td><strong>${UI.escapeHTML(cat.name)}</strong></td>
        <td><code>${UI.escapeHTML(cat.slug)}</code></td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-secondary btn-sm" onclick="openCategoryCrudModal('${cat.id}')"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="deleteCategoryRecord('${cat.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('sys-categories-rows').innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">${res.message}</td></tr>`;
  }
}

// Open Category CRUD modal
async function openCategoryCrudModal(editId = '') {
  const form = document.getElementById('category-crud-form');
  form.reset();

  document.getElementById('cat-edit-id').value = editId;

  if (editId) {
    document.getElementById('category-modal-title').textContent = 'Edit Category';
    UI.showLoader();
    const res = await API.get(CONFIG.ENDPOINTS.CATEGORIES.GET_ONE(editId));
    UI.hideLoader();

    if (res.success && res.data) {
      document.getElementById('cat-name').value = res.data.name;
      document.getElementById('cat-slug').value = res.data.slug;
    }
  } else {
    document.getElementById('category-modal-title').textContent = 'Create Event Category';
  }

  UI.openModal('category-crud-modal');
}

// Delete Category record
function deleteCategoryRecord(id) {
  UI.confirm('Delete Category', 'Are you sure you want to permanently delete this category? All related events will have category unlinked.', async () => {
    UI.showLoader();
    const res = await API.delete(CONFIG.ENDPOINTS.CATEGORIES.DELETE(id));
    UI.hideLoader();

    if (res.success) {
      UI.toast('Category deleted successfully!', 'success');
      loadCategoriesCache(); // Refresh cache
      switchTab('sys-categories');
    } else {
      UI.toast(res.message || 'Failed to delete category.', 'error');
    }
  });
}

/* ======================================================== */
/* 12. TAB: SYSTEM USERS MANAGEMENT (ADMIN) */

async function renderSystemUsersTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <h3 style="font-size: 18px; margin-bottom: 20px;"><i class="fas fa-users-cog"></i> Platform Users Directory</h3>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email Address</th>
              <th>Role Profile</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="sys-users-rows">
            <!-- Loader -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  UI.renderSkeleton('#sys-users-rows', 3, 'table');
  const res = await API.get(CONFIG.ENDPOINTS.USER.ALL_USERS);

  if (res.success && Array.isArray(res.data)) {
    const tbody = document.getElementById('sys-users-rows');
    tbody.innerHTML = '';

    res.data.forEach(u => {
      const isOwner = u.role === 'SYSTEM_OWNER';
      
      const badgeClass = u.status === 'ACTIVE' 
        ? 'badge-completed' 
        : (u.status === 'SUSPENDED' ? 'badge-pending' : 'badge-cancelled');
      
      const verifyBadge = u.isVerified 
        ? '<span class="text-success"><i class="fas fa-check-circle"></i> Verified</span>'
        : '<span class="text-danger"><i class="fas fa-times-circle"></i> Unverified</span>';

      // Status Change Toggle actions
      let toggleActionBtn = '';
      if (!isOwner) {
        if (u.status === 'ACTIVE') {
          toggleActionBtn = `<button class="btn btn-secondary btn-sm" onclick="changeUserStatus('${u.id}', 'SUSPENDED')">Suspend</button>`;
        } else {
          toggleActionBtn = `<button class="btn btn-primary btn-sm" onclick="changeUserStatus('${u.id}', 'ACTIVE')">Activate</button>`;
        }
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="user-cell">
            <img src="${u.avatarUrl || 'https://i.ibb.co/tPp28rV/avatar-placeholder.png'}" onerror="this.src='https://i.ibb.co/tPp28rV/avatar-placeholder.png'">
            <strong>${UI.escapeHTML(u.name)}</strong>
          </div>
        </td>
        <td>${UI.escapeHTML(u.email)}</td>
        <td><span class="badge badge-upcoming">${u.role}</span></td>
        <td><span class="badge ${badgeClass}">${u.status}</span></td>
        <td>${verifyBadge}</td>
        <td>
          <div class="actions-cell">
            ${toggleActionBtn}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('sys-users-rows').innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">${res.message}</td></tr>`;
  }
}

// Modify User account status
async function changeUserStatus(userId, status) {
  UI.showLoader();
  const res = await API.post(CONFIG.ENDPOINTS.USER.UPDATE_USER, {
    userId,
    status
  });
  UI.hideLoader();

  if (res.success) {
    UI.toast(`User status changed to ${status}!`, 'success');
    switchTab('sys-users');
  } else {
    UI.toast(res.message || 'Failed to update user status.', 'error');
  }
}

/* ======================================================== */
/* 13. TAB: REVIEWS MODERATION (MANAGER / ADMIN) */

async function renderManagerReviewsTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <h3 style="font-size: 18px; margin-bottom: 20px;"><i class="fas fa-star-half-alt"></i> Moderate Attendee Reviews</h3>
      <div id="mng-reviews-list">
        <!-- Loader -->
      </div>
    </div>
  `;

  const list = document.getElementById('mng-reviews-list');
  list.innerHTML = `<div class="loader-spinner" style="margin: 0 auto;"></div>`;

  const res = await API.get(CONFIG.ENDPOINTS.REVIEWS.LIST_ALL);
  if (res.success && Array.isArray(res.data)) {
    if (res.data.length === 0) {
      list.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 30px;">No reviews registered in the system yet.</p>`;
      return;
    }

    list.innerHTML = '';
    res.data.forEach(rev => {
      const item = document.createElement('div');
      item.className = 'log-item';
      
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fa${i <= rev.rating ? 's' : 'r'} fa-star" style="color: var(--warning); font-size: 12px;"></i> `;
      }

      item.innerHTML = `
        <div class="log-icon"><i class="fas fa-comments"></i></div>
        <div class="log-body">
          <div class="log-title" style="display: flex; justify-content: space-between;">
            <span>By: <strong>${UI.escapeHTML(rev.user?.name || 'Attendee')}</strong> for <strong>${UI.escapeHTML(rev.event?.title || 'Event')}</strong></span>
            <div>${starsHtml}</div>
          </div>
          <div class="log-details" style="margin-top: 8px;">"${UI.escapeHTML(rev.comment || '')}"</div>
          <div class="log-time">${UI.formatDate(rev.createdAt, true)}</div>
        </div>
        <div style="align-self: center;">
          <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="deleteModeratedReview('${rev.id}')"><i class="fas fa-trash"></i> Delete</button>
        </div>
      `;
      list.appendChild(item);
    });
  } else {
    list.innerHTML = `<p style="color: var(--danger); text-align: center;">${res.message}</p>`;
  }
}

function deleteModeratedReview(id) {
  UI.confirm('Delete Attendee Review', 'Are you sure you want to delete this review comment from the event page?', async () => {
    UI.showLoader();
    const res = await API.delete(CONFIG.ENDPOINTS.REVIEWS.DELETE(id));
    UI.hideLoader();

    if (res.success) {
      UI.toast('Review deleted successfully!', 'success');
      switchTab('mng-reviews');
    } else {
      UI.toast(res.message || 'Failed to delete review.', 'error');
    }
  });
}

/* ======================================================== */
/* 14. TAB: BROADCAST MANUAL SYSTEM NOTIFICATIONS */

function renderBroadcastTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 40px; max-width: 600px; margin: 0 auto;">
      <h3 style="font-size: 20px; margin-bottom: 12px;"><i class="fas fa-paper-plane"></i> Broadcast System Notification</h3>
      <p style="color:var(--text-secondary); font-size: 14px; margin-bottom: 30px;">Create and dispatch immediate web notifications targeting specific role categories or individual users.</p>
      
      <button class="btn btn-primary" onclick="UI.openModal('notification-dispatch-modal')" style="width:100%;"><i class="fas fa-bullhorn"></i> Launch Broadcast Dispatcher</button>
    </div>
  `;
}

/* ======================================================== */
/* 15. TAB: SYSTEM NOTIFICATIONS LIST */

async function renderNotificationsTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <div class="table-controls" style="margin-bottom: 24px;">
        <h3 style="font-size: 18px;"><i class="fas fa-bell"></i> System Notifications</h3>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary btn-sm" onclick="markAllNotificationsAsRead()"><i class="fas fa-check-double"></i> Mark all read</button>
          <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="clearAllNotificationsLog()"><i class="fas fa-trash-alt"></i> Clear All</button>
        </div>
      </div>

      <div id="notifications-list-block">
        <!-- Logs Load here -->
      </div>
    </div>
  `;

  const list = document.getElementById('notifications-list-block');
  list.innerHTML = `<div class="loader-spinner" style="margin: 0 auto;"></div>`;

  const res = await API.get(CONFIG.ENDPOINTS.NOTIFICATIONS.MY);
  if (res.success && Array.isArray(res.data)) {
    if (res.data.length === 0) {
      list.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 30px;">You have no notifications right now.</p>`;
      return;
    }

    list.innerHTML = '';
    res.data.forEach(notif => {
      const item = document.createElement('div');
      item.className = `log-item ${notif.isRead ? '' : 'unread-highlight'}`;
      item.style.position = 'relative';
      if (!notif.isRead) {
        item.style.borderLeft = '3px solid var(--accent-pink)';
      }

      item.innerHTML = `
        <div class="log-icon"><i class="fas fa-bell"></i></div>
        <div class="log-body">
          <div class="log-title">${UI.escapeHTML(notif.title)}</div>
          <div class="log-details">${UI.escapeHTML(notif.message)}</div>
          <div class="log-time">${UI.formatDate(notif.createdAt, true)}</div>
        </div>
        <div style="display: flex; gap: 8px; align-self: center;">
          ${!notif.isRead ? `<button class="btn btn-secondary btn-sm" onclick="markNotificationRead('${notif.id}')">Read</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="deleteNotificationRecord('${notif.id}')">&times;</button>
        </div>
      `;
      list.appendChild(item);
    });
  } else {
    list.innerHTML = `<p style="color: var(--danger); text-align: center;">${res.message}</p>`;
  }
}

// Mark single notification read
async function markNotificationRead(id) {
  const res = await API.patch(CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  if (res.success) {
    loadUnreadNotificationsIndicator();
    switchTab('notifications');
  }
}

// Mark all notifications read
async function markAllNotificationsAsRead() {
  const res = await API.patch(CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  if (res.success) {
    UI.toast('All notifications marked as read!', 'success');
    loadUnreadNotificationsIndicator();
    switchTab('notifications');
  }
}

// Clear all notifications
async function clearAllNotificationsLog() {
  UI.confirm('Clear Notifications', 'Are you sure you want to clear your entire notification history?', async () => {
    UI.showLoader();
    const res = await API.delete(CONFIG.ENDPOINTS.NOTIFICATIONS.CLEAR_ALL);
    UI.hideLoader();

    if (res.success) {
      UI.toast('Notification logs cleared!', 'success');
      loadUnreadNotificationsIndicator();
      switchTab('notifications');
    }
  });
}

// Delete single notification
async function deleteNotificationRecord(id) {
  const res = await API.delete(CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE(id));
  if (res.success) {
    loadUnreadNotificationsIndicator();
    switchTab('notifications');
  }
}

// Helper to pull unread count from API and update navbar indicator badge
async function loadUnreadNotificationsIndicator() {
  const badge = document.getElementById('unread-notif-count');
  if (!badge) return;

  const res = await API.get(CONFIG.ENDPOINTS.NOTIFICATIONS.MY);
  if (res.success && Array.isArray(res.data)) {
    const unread = res.data.filter(n => !n.isRead).length;
    if (unread > 0) {
      badge.textContent = unread;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

/* ======================================================== */
/* 16. TAB: USER ACTIVITY LOGS LOG */

async function renderLogsTab(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 30px;">
      <h3 style="font-size: 18px; margin-bottom: 20px;"><i class="fas fa-history"></i> My Activity Logs</h3>
      <div id="logs-list-block">
        <!-- Logs Load here -->
      </div>
    </div>
  `;

  const list = document.getElementById('logs-list-block');
  list.innerHTML = `<div class="loader-spinner" style="margin: 0 auto;"></div>`;

  // Admins get all logs, users get own
  const endpoint = (activeUserRole === CONFIG.ROLES.SYSTEM_OWNER || activeUserRole === CONFIG.ROLES.MANAGER)
    ? CONFIG.ENDPOINTS.ACTIVITY_LOGS.ALL
    : CONFIG.ENDPOINTS.ACTIVITY_LOGS.MY;

  const res = await API.get(endpoint);
  if (res.success && Array.isArray(res.data)) {
    if (res.data.length === 0) {
      list.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 30px;">No activity logs recorded yet.</p>`;
      return;
    }

    list.innerHTML = '';
    res.data.forEach(log => {
      const item = document.createElement('div');
      item.className = 'log-item';

      item.innerHTML = `
        <div class="log-icon"><i class="fas fa-terminal"></i></div>
        <div class="log-body">
          <div class="log-title">${UI.escapeHTML(log.action.replace('_', ' '))}</div>
          <div class="log-details">${UI.escapeHTML(log.details)}</div>
          <div class="log-time">
            <span>${UI.formatDate(log.createdAt, true)}</span>
            ${log.ipAddress ? `<span style="margin-left:15px; color:var(--text-muted);">IP: ${log.ipAddress}</span>` : ''}
          </div>
        </div>
      `;
      list.appendChild(item);
    });
  } else {
    list.innerHTML = `<p style="color: var(--danger); text-align: center;">${res.message}</p>`;
  }
}

/* ======================================================== */
/* 17. TAB: PROFILE & SECURITY CONFIGURATIONS */

function renderProfileTab(container) {
  const user = AUTH.getUser();
  const avatarUrl = user.avatarUrl || 'https://i.ibb.co/tPp28rV/avatar-placeholder.png';

  container.innerHTML = `
    <div class="profile-grid">
      
      <!-- Left Avatar upload card -->
      <div class="glass-panel profile-avatar-card">
        <div class="profile-avatar-wrapper">
          <img src="${avatarUrl}" alt="${UI.escapeHTML(user.name)}" id="profile-avatar-preview" onerror="this.src='https://i.ibb.co/tPp28rV/avatar-placeholder.png'">
          <label for="profile-avatar-file" class="avatar-upload-label">Change Photo</label>
        </div>
        <input type="file" id="profile-avatar-file" style="display: none;" accept="image/*" onchange="uploadProfileAvatar()">

        <h3 style="font-size: 18px; margin-bottom: 6px;">${UI.escapeHTML(user.name)}</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">${UI.escapeHTML(user.email)}</p>
        <span class="badge badge-upcoming">${user.role}</span>
      </div>

      <!-- Right Form blocks (Update Name and Change Password) -->
      <div style="display: flex; flex-direction: column; gap: 30px;">
        
        <!-- Form Update Name -->
        <div class="glass-panel" style="padding: 30px;">
          <h3 style="font-size: 18px; margin-bottom: 20px; border-bottom:1px solid var(--glass-border); padding-bottom:12px;">Edit Profile Information</h3>
          
          <form id="profile-update-info-form">
            <div class="form-group">
              <label class="form-label" for="profile-name">Full Name</label>
              <input type="text" id="profile-name" class="form-control" value="${UI.escapeHTML(user.name)}" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="profile-email">Email Address</label>
              <input type="email" id="profile-email" class="form-control" value="${UI.escapeHTML(user.email)}" required>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">Update Profile Details</button>
          </form>
        </div>

        <!-- Form Change Password -->
        <div class="glass-panel" style="padding: 30px;">
          <h3 style="font-size: 18px; margin-bottom: 20px; border-bottom:1px solid var(--glass-border); padding-bottom:12px;">Security & Password</h3>
          
          <form id="profile-update-password-form">
            <div class="form-group">
              <label class="form-label" for="profile-old-pass">Current Password</label>
              <input type="password" id="profile-old-pass" class="form-control" placeholder="••••••••" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="profile-new-pass">New Password</label>
              <input type="password" id="profile-new-pass" class="form-control" placeholder="Minimum 6 characters" required minlength="6">
            </div>
            <button type="submit" class="btn btn-primary btn-sm">Update Password</button>
          </form>
        </div>

      </div>

    </div>
  `;
}

// Upload Avatar helper (FormData)
async function uploadProfileAvatar() {
  const fileInput = document.getElementById('profile-avatar-file');
  const file = fileInput.files[0];
  if (!file) return;

  UI.showLoader();
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await API.upload(CONFIG.ENDPOINTS.USER.UPLOAD_AVATAR, formData, 'PATCH');
  UI.hideLoader();

  if (res.success && res.data) {
    UI.toast('Profile avatar uploaded successfully!', 'success');
    
    // Update local user details and avatar preview
    const user = AUTH.getUser();
    user.avatarUrl = res.data.avatarUrl || user.avatarUrl;
    AUTH.setUser(user);
    
    // Refresh avatar visuals
    document.getElementById('profile-avatar-preview').src = user.avatarUrl;
    injectNavbar(); // Re-render navbar
  } else {
    UI.toast(res.message || 'Avatar upload failed.', 'error');
  }
}

/* ======================================================== */
/* 18. DYNAMIC FORMS BINDINGS ENGINE */

function bindDashboardForms() {
  // Bind Profile Update Form
  document.addEventListener('submit', async (e) => {
    const target = e.target;
    
    // INFO UPDATE Form
    if (target.id === 'profile-update-info-form') {
      e.preventDefault();
      UI.showLoader();

      const name = document.getElementById('profile-name').value;
      const email = document.getElementById('profile-email').value;

      const res = await API.patch(CONFIG.ENDPOINTS.USER.UPDATE_PROFILE, { name, email });
      UI.hideLoader();

      if (res.success && res.data) {
        UI.toast('Profile information updated successfully!', 'success');
        const user = AUTH.getUser();
        user.name = res.data.name;
        user.email = res.data.email;
        AUTH.setUser(user);
        injectNavbar(); // Refresh navbar greetings
      } else {
        UI.toast(res.message || 'Failed to update profile details.', 'error');
      }
    }

    // PASSWORD UPDATE Form
    if (target.id === 'profile-update-password-form') {
      e.preventDefault();
      UI.showLoader();

      const oldPassword = document.getElementById('profile-old-pass').value;
      const newPassword = document.getElementById('profile-new-pass').value;

      const res = await AUTH.changePassword(oldPassword, newPassword);
      UI.hideLoader();

      if (res.success) {
        UI.toast('Account password updated successfully!', 'success');
        document.getElementById('profile-update-password-form').reset();
      } else {
        UI.toast(res.message || 'Failed to change password. Validate current password.', 'error');
      }
    }

    // EVENT CRUD Form
    if (target.id === 'event-crud-form') {
      e.preventDefault();
      UI.showLoader();

      const editId = document.getElementById('event-edit-id').value;
      
      const title = document.getElementById('evt-title').value;
      const categoryId = document.getElementById('evt-category').value;
      const price = document.getElementById('evt-price').value;
      const location = document.getElementById('evt-location').value;
      const date = document.getElementById('evt-date').value;
      const time = document.getElementById('evt-time').value;
      const seatCount = document.getElementById('evt-seats').value;
      const status = document.getElementById('evt-status').value;
      const description = document.getElementById('evt-desc').value;
      const banner = document.getElementById('evt-banner').files[0];

      // Formulate highlights object
      const highlights = {
        dressCode: document.getElementById('evt-highlight-dress').value || 'Casual',
        workshops: parseInt(document.getElementById('evt-highlight-workshops').value) || 0,
        wifiAvailable: document.getElementById('evt-highlight-wifi').value === 'true',
        parkingFacility: document.getElementById('evt-highlight-parking').value || 'Available'
      };

      const formData = new FormData();
      formData.append('title', title);
      formData.append('categoryId', categoryId);
      formData.append('ticketPrice', price);
      formData.append('location', location);
      formData.append('date', new Date(date).toISOString());
      formData.append('time', time);
      formData.append('seatCount', seatCount);
      formData.append('status', status);
      formData.append('description', description);
      formData.append('about', description);
      formData.append('eventHighlight', JSON.stringify(highlights));

      if (banner) {
        formData.append('banner', banner);
      }

      let res;
      if (editId) {
        // Update Event
        res = await API.upload(CONFIG.ENDPOINTS.EVENTS.UPDATE(editId), formData, 'PATCH');
      } else {
        // Create Event
        res = await API.upload(CONFIG.ENDPOINTS.EVENTS.CREATE, formData, 'POST');
      }

      UI.hideLoader();

      if (res.success) {
        UI.closeModal('event-crud-modal');
        UI.toast(editId ? 'Event updated successfully!' : 'Event created successfully!', 'success');
        switchTab('mng-events');
      } else {
        UI.toast(res.message || 'Failed to save event information.', 'error');
      }
    }

    // CATEGORY CRUD Form
    if (target.id === 'category-crud-form') {
      e.preventDefault();
      UI.showLoader();

      const editId = document.getElementById('cat-edit-id').value;
      const name = document.getElementById('cat-name').value;
      const slug = document.getElementById('cat-slug').value;
      const icon = document.getElementById('cat-icon').files[0];

      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      if (icon) {
        formData.append('icon', icon);
      }

      let res;
      if (editId) {
        res = await API.upload(CONFIG.ENDPOINTS.CATEGORIES.UPDATE(editId), formData, 'PATCH');
      } else {
        res = await API.upload(CONFIG.ENDPOINTS.CATEGORIES.CREATE, formData, 'POST');
      }

      UI.hideLoader();

      if (res.success) {
        UI.closeModal('category-crud-modal');
        UI.toast(editId ? 'Category updated successfully!' : 'Category created successfully!', 'success');
        loadCategoriesCache(); // Refresh cache
        switchTab('sys-categories');
      } else {
        UI.toast(res.message || 'Failed to save category.', 'error');
      }
    }

    // MANAGER CRUD Form
    if (target.id === 'manager-crud-form') {
      e.preventDefault();
      UI.showLoader();

      const editId = document.getElementById('mng-edit-id').value;
      const name = document.getElementById('mng-name').value;
      const email = document.getElementById('mng-email').value;
      const password = document.getElementById('mng-password').value;
      const phone = document.getElementById('mng-phone').value;
      const location = document.getElementById('mng-location').value;
      const avatar = document.getElementById('mng-avatar').files[0];

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phoneNumber', phone);
      formData.append('location', location);
      
      if (!editId) {
        formData.append('password', password);
      }
      if (avatar) {
        formData.append('avatar', avatar);
      }

      let res;
      if (editId) {
        res = await API.upload(CONFIG.ENDPOINTS.MANAGERS.UPDATE(editId), formData, 'PATCH');
      } else {
        res = await API.upload(CONFIG.ENDPOINTS.MANAGERS.CREATE, formData, 'POST');
      }

      UI.hideLoader();

      if (res.success) {
        UI.closeModal('manager-crud-modal');
        UI.toast(editId ? 'Manager account updated!' : 'Manager account created!', 'success');
        switchTab('sys-managers');
      } else {
        UI.toast(res.message || 'Failed to save manager details.', 'error');
      }
    }

    // STAFF CRUD Form
    if (target.id === 'staff-crud-form') {
      e.preventDefault();
      UI.showLoader();

      const editId = document.getElementById('staff-edit-id').value;
      const name = document.getElementById('stf-name').value;
      const email = document.getElementById('stf-email').value;
      const password = document.getElementById('stf-password').value;
      const avatar = document.getElementById('stf-avatar').files[0];

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (!editId) {
        formData.append('password', password);
      }
      if (avatar) {
        formData.append('avatar', avatar);
      }

      let res;
      if (editId) {
        res = await API.upload(CONFIG.ENDPOINTS.STAFF.UPDATE(editId), formData, 'PATCH');
      } else {
        res = await API.upload(CONFIG.ENDPOINTS.STAFF.CREATE, formData, 'POST');
      }

      UI.hideLoader();

      if (res.success) {
        UI.closeModal('staff-crud-modal');
        UI.toast(editId ? 'Staff account updated!' : 'Staff account created!', 'success');
        switchTab('mng-staff');
      } else {
        UI.toast(res.message || 'Failed to save staff details.', 'error');
      }
    }

    // NOTIFICATION BROADCAST DISPATCH Form
    if (target.id === 'notification-dispatch-form') {
      e.preventDefault();
      UI.showLoader();

      const title = document.getElementById('notif-title').value;
      const message = document.getElementById('notif-message').value;
      const userId = document.getElementById('notif-user-id').value.trim();
      const role = document.getElementById('notif-role').value;

      const payload = {
        title,
        message,
        userId: userId || undefined,
        role: userId ? undefined : role
      };

      const res = await API.post(CONFIG.ENDPOINTS.NOTIFICATIONS.CREATE, payload);
      UI.hideLoader();

      if (res.success) {
        UI.closeModal('notification-dispatch-modal');
        UI.toast('Notification broadcast successfully dispatched!', 'success');
        document.getElementById('notification-dispatch-form').reset();
      } else {
        UI.toast(res.message || 'Failed to dispatch notification broadcast.', 'error');
      }
    }
  });
}
