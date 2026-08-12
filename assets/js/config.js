/**
 * Eventify - Central Configuration & Constants
 */
const CONFIG = {
  API_BASE_URL: 'https://eventify-backend-roan.vercel.app/api/v1',
  AUTH_STORAGE_KEY: 'eventify_auth_token',
  USER_STORAGE_KEY: 'eventify_user_data',
  THEME_STORAGE_KEY: 'eventify_theme',

  ROLES: {
    SYSTEM_OWNER: 'SYSTEM_OWNER',
    MANAGER: 'MANAGER',
    STAFF: 'STAFF',
    USER: 'USER',
  },

  EVENT_STATUS: {
    DRAFT: 'DRAFT',
    UPCOMING: 'UPCOMING',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },

  BOOKING_STATUS: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    ATTENDED: 'ATTENDED',
    REFUNDED: 'REFUNDED',
  },

  PAYMENT_STATUS: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
  },

  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      GOOGLE_URL: '/auth/google/url',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh-token',
      FORGOT_PASSWORD: '/auth/forgot-password',
      VERIFY_FORGOT_OTP: '/auth/verify-forgot-password-otp',
      RESET_PASSWORD: '/auth/reset-password',
      CHANGE_PASSWORD: '/auth/change-password',
    },
    USER: {
      REGISTER: '/user/register',
      PROFILE_ME: '/user/profile/me',
      UPDATE_PROFILE: '/user/update-profile',
      UPLOAD_AVATAR: '/user/upload-avatar',
      ALL_USERS: '/user/all',
      UPDATE_USER: '/user/update-user',
      USER_DETAILS: (id) => `/user/user-details/${id}`,
    },
    OTP: {
      SEND: '/otp/send',
      VERIFY: '/otp/verify',
    },
    EVENTS: {
      LIST: '/events',
      GET_ONE: (id) => `/events/${id}`,
      CREATE: '/events',
      UPDATE: (id) => `/events/${id}`,
      DELETE: (id) => `/events/${id}`,
      UPLOAD_BANNER: (id) => `/events/${id}/upload-banner`,
      UPLOAD_IMAGES: (id) => `/events/${id}/upload-images`,
    },
    CATEGORIES: {
      LIST: '/event-category',
      GET_ONE: (id) => `/event-category/${id}`,
      CREATE: '/event-category',
      UPDATE: (id) => `/event-category/${id}`,
      DELETE: (id) => `/event-category/${id}`,
    },
    BOOKINGS: {
      BOOK: '/user/booking/book',
      MY_BOOKINGS: '/user/booking/my-bookings',
      MY_ONE_BOOKING: (id) => `/user/booking/my-bookings/${id}`,
      CANCEL_MY_BOOKING: (id) => `/user/booking/my-bookings/${id}/cancel`,
      ALL_BOOKINGS: '/bookings',
      GET_ONE_BOOKING: (id) => `/bookings/${id}`,
      UPDATE_BOOKING: (id) => `/bookings/${id}`,
      DELETE_BOOKING: (id) => `/bookings/${id}`,
      VERIFY_TICKET: '/bookings/verify-ticket',
    },
    REVIEWS: {
      LIST_ALL: '/reviews',
      GET_EVENT_REVIEWS: (eventId) => `/reviews/event/${eventId}`,
      MY_REVIEWS: '/reviews/my-reviews',
      CREATE: '/reviews',
      GET_ONE: (id) => `/reviews/${id}`,
      UPDATE: (id) => `/reviews/${id}`,
      DELETE: (id) => `/reviews/${id}`,
    },
    MANAGERS: {
      CREATE: '/system-owner/create-manager',
      LIST: '/system-owner/managers',
      GET_ONE: (id) => `/system-owner/managers/${id}`,
      UPDATE: (id) => `/system-owner/managers/${id}`,
      DELETE: (id) => `/system-owner/managers/${id}`,
    },
    STAFF: {
      CREATE: '/staff/create-staff',
      LIST: '/staff',
      GET_ONE: (id) => `/staff/${id}`,
      UPDATE: (id) => `/staff/${id}`,
      DELETE: (id) => `/staff/${id}`,
    },
    DASHBOARD: {
      OVERVIEW: '/dashboard/overview',
    },
    NOTIFICATIONS: {
      MY: '/notifications/my-notifications',
      ALL: '/notifications',
      CREATE: '/notifications/create',
      MARK_ALL_READ: '/notifications/mark-all-as-read',
      MARK_READ: (id) => `/notifications/${id}/read`,
      CLEAR_ALL: '/notifications/clear-all',
      DELETE: (id) => `/notifications/${id}`,
    },
    ACTIVITY_LOGS: {
      MY: '/activity-logs/my-logs',
      ALL: '/activity-logs',
      BY_USER: (userId) => `/activity-logs/user/${userId}`,
    },
  },
};

// Export to window
window.CONFIG = CONFIG;
