/**
 * Eventify - Central API Client with Token Interceptor & Error Handling
 */
const API = {
  /**
   * Get the current stored access token
   */
  getToken() {
    return localStorage.getItem(CONFIG.AUTH_STORAGE_KEY) || '';
  },

  /**
   * Set new auth token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.AUTH_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(CONFIG.AUTH_STORAGE_KEY);
    }
  },

  /**
   * Build complete API URL
   */
  buildUrl(endpoint, params = {}) {
    let url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParams.append(key, val);
      }
    });

    const queryString = queryParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  },

  /**
   * Base HTTP request wrapper
   */
  async request(endpoint, options = {}, isRetry = false) {
    const url = options.params ? this.buildUrl(endpoint, options.params) : this.buildUrl(endpoint);
    const headers = options.headers || {};
    const token = this.getToken();

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // If body is NOT FormData, set default Content-Type JSON
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchConfig = {
      method: options.method || 'GET',
      headers,
      credentials: 'omit', // We pass JWT in Bearer Authorization header
    };

    if (options.body) {
      if (options.body instanceof FormData) {
        fetchConfig.body = options.body;
      } else if (typeof options.body === 'object') {
        fetchConfig.body = JSON.stringify(options.body);
      } else {
        fetchConfig.body = options.body;
      }
    }

    try {
      const response = await fetch(url, fetchConfig);

      // Handle 401 Unauthorized - Attempt refresh or logout
      if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request
          return this.request(endpoint, options, true);
        } else {
          // Token expired and cannot refresh, clear session
          this.handleAuthExpiry();
          return {
            success: false,
            statusCode: 401,
            message: 'Session expired. Please log in again.',
          };
        }
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          message: data.message || data.error || `Request failed with status ${response.status}`,
          errors: data.errorSources || data.errors || null,
          data: null,
        };
      }

      return {
        success: true,
        statusCode: response.status,
        message: data.message || 'Success',
        meta: data.meta || null,
        stats: data.stats || null,
        data: data.data !== undefined ? data.data : data,
      };
    } catch (error) {
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error);
      return {
        success: false,
        statusCode: 0,
        message: error.message || 'Network error occurred. Please check your connection.',
        data: null,
      };
    }
  },

  /**
   * Helper HTTP methods
   */
  get(endpoint, params = {}) {
    return this.request(endpoint, { method: 'GET', params });
  },

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { method: 'POST', body, ...options });
  },

  patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { method: 'PATCH', body, ...options });
  },

  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { method: 'PUT', body, ...options });
  },

  delete(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { method: 'DELETE', body, ...options });
  },

  /**
   * Multipart Form Upload helper (for images/files)
   */
  upload(endpoint, formData, method = 'POST') {
    return this.request(endpoint, {
      method,
      body: formData,
      // Note: don't set Content-Type header so browser sets multipart boundary automatically
    });
  },

  /**
   * Try to refresh access token
   */
  async refreshToken() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.accessToken) {
          this.setToken(data.data.accessToken);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Trigger clean logout on session expiry
   */
  handleAuthExpiry() {
    localStorage.removeItem(CONFIG.AUTH_STORAGE_KEY);
    localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
    if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('ticket')) {
      window.location.href = 'login.html?expired=true';
    }
  },
};

window.API = API;
