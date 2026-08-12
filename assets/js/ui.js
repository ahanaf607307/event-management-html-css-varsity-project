/**
 * Eventify - UI Utility Engine (Toasts, Modals, Formatters, Skeleton Loaders)
 */
const UI = {
  /**
   * Initialize Toast Container
   */
  initToastContainer() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  },

  /**
   * Display modern toast alerts
   */
  toast(message, type = 'info', duration = 3500) {
    this.initToastContainer();
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    toast.innerHTML = `
      <i class="fas fa-${icon} toast-icon"></i>
      <div class="toast-content">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
      <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Open modal by ID
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * Close modal by ID
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  },

  /**
   * Show custom confirmation dialog
   */
  confirm(title, message, onConfirm, onCancel = null) {
    let confirmModal = document.getElementById('global-confirm-modal');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'global-confirm-modal';
      confirmModal.className = 'modal glass-modal';
      confirmModal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title" id="confirm-title">Confirmation</h3>
              <button class="close-btn" id="confirm-close">&times;</button>
            </div>
            <div class="modal-body">
              <p id="confirm-message"></p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
              <button class="btn btn-danger" id="confirm-action">Confirm</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;

    const actionBtn = document.getElementById('confirm-action');
    const cancelBtn = document.getElementById('confirm-cancel');
    const closeBtn = document.getElementById('confirm-close');

    const cleanup = () => {
      confirmModal.classList.remove('show');
      document.body.style.overflow = '';
    };

    actionBtn.onclick = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = () => {
      cleanup();
      if (onCancel) onCancel();
    };

    closeBtn.onclick = cleanup;

    confirmModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  },

  /**
   * Render loading spinner overlay
   */
  showLoader() {
    let loader = document.getElementById('global-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.className = 'global-loader-overlay';
      loader.innerHTML = `<div class="loader-spinner"></div>`;
      document.body.appendChild(loader);
    }
    loader.classList.add('show');
  },

  /**
   * Hide loading spinner
   */
  hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
      loader.classList.remove('show');
    }
  },

  /**
   * Create skeleton loading cards/grids
   */
  renderSkeleton(containerSelector, count = 3, type = 'card') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    let html = '';
    for (let i = 0; i < count; i++) {
      if (type === 'card') {
        html += `
          <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-body">
              <div class="skeleton-title"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text short"></div>
            </div>
          </div>
        `;
      } else if (type === 'table') {
        html += `
          <tr class="skeleton-row">
            <td><div class="skeleton-cell"></div></td>
            <td><div class="skeleton-cell"></div></td>
            <td><div class="skeleton-cell"></div></td>
            <td><div class="skeleton-cell"></div></td>
            <td><div class="skeleton-cell"></div></td>
          </tr>
        `;
      } else if (type === 'category') {
        html += `
          <div class="skeleton-category-pill"></div>
        `;
      }
    }
    container.innerHTML = html;
  },

  /**
   * Format numeric currency to Taka (BDT) standard formatting
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  },

  /**
   * Format ISO date string into human readable format
   */
  formatDate(dateStr, withTime = false) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    if (withTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('en-US', options);
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

// Auto initialize toast stylesheet
document.addEventListener('DOMContentLoaded', () => UI.initToastContainer());

window.UI = UI;
