/**
 * Eventify - Authentication Module
 */
const AUTH = {
  /**
   * Check if a user is currently logged in
   */
  isLoggedIn() {
    return !!API.getToken() && !!this.getUser();
  },

  /**
   * Get stored user profile data
   */
  getUser() {
    const data = localStorage.getItem(CONFIG.USER_STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  /**
   * Set user data in localStorage
   */
  setUser(userData) {
    if (userData) {
      localStorage.setItem(CONFIG.USER_STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
    }
  },

  /**
   * Perform login with credentials
   */
  async login(email, password) {
    const res = await API.post(CONFIG.ENDPOINTS.AUTH.LOGIN, { email, password });
    if (res.success && res.data) {
      API.setToken(res.data.accessToken);
      this.setUser(res.data.user);
      return res;
    }
    return res;
  },

  /**
   * Log out from application
   */
  async logout() {
    // Send logout request to backend (ignores failure)
    await API.post(CONFIG.ENDPOINTS.AUTH.LOGOUT);
    API.setToken('');
    this.setUser(null);
    window.location.href = 'index.html';
  },

  /**
   * Fetch current user profile to verify state and update storage
   */
  async fetchProfile() {
    const res = await API.get(CONFIG.ENDPOINTS.USER.PROFILE_ME);
    if (res.success && res.data) {
      this.setUser(res.data);
      return res.data;
    } else if (res.statusCode === 401) {
      this.logout();
    }
    return null;
  },

  /**
   * Register new user (handles multipart avatar upload)
   */
  async register(name, email, password, avatarFile) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    return await API.upload(CONFIG.ENDPOINTS.USER.REGISTER, formData);
  },

  /**
   * Send verification OTP for registering
   */
  async sendOtp(email, name = '') {
    return await API.post(CONFIG.ENDPOINTS.OTP.SEND, { email, name });
  },

  /**
   * Verify registration OTP to activate account
   */
  async verifyOtp(email, otp) {
    return await API.post(CONFIG.ENDPOINTS.OTP.VERIFY, { email, otp });
  },

  /**
   * Trigger Google Login redirection
   */
  async triggerGoogleLogin() {
    const res = await API.get(CONFIG.ENDPOINTS.AUTH.GOOGLE_URL);
    if (res.success && res.data && res.data.url) {
      window.location.href = res.data.url;
    } else {
      UI.toast('Failed to get Google login URL', 'error');
    }
  },

  /**
   * Handle authentication redirect or verification flow
   */
  handleGoogleCallback() {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    if (success === 'true') {
      // Typically the backend sets secure httpOnly cookies on callback, but if it redirects,
      // we can fetch the user details to see if we're authenticated.
      this.fetchProfile().then(user => {
        if (user) {
          window.location.href = 'dashboard.html';
        }
      });
    }
  },

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email) {
    return await API.post(CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  /**
   * Verify forgot password OTP
   */
  async verifyForgotPasswordOtp(email, otp) {
    return await API.post(CONFIG.ENDPOINTS.AUTH.VERIFY_FORGOT_OTP, { email, otp });
  },

  /**
   * Reset password with reset token (passed in Authorization header)
   */
  async resetPassword(newPassword, resetToken) {
    return await API.post(CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, { newPassword }, {
      headers: { 'Authorization': `Bearer ${resetToken}` }
    });
  },

  /**
   * Change current password (requires active session)
   */
  async changePassword(oldPassword, newPassword) {
    return await API.post(CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, { oldPassword, newPassword });
  },

  /**
   * Get role-based dashboard URL
   */
  getDashboardUrl() {
    return 'dashboard.html';
  },

  /**
   * Protect route to require a specific role, redirecting if unauthorized
   */
  guardRoute(allowedRoles = []) {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      return false;
    }

    const user = this.getUser();
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      window.location.href = 'index.html?unauthorized=true';
      return false;
    }

    return true;
  }
};

window.AUTH = AUTH;
