/**
 * MMI API SDK
 * JavaScript SDK for integrating with MobileMediaInteractions API
 * 
 * Usage:
 *   const api = new MMIApi('your-api-key-here');
 *   const content = await api.getContent();
 */

class MMIApi {
  constructor(apiKey, baseUrl = 'https://mobilemediainteractions.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Make an API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  /**
   * Get API information
   */
  async getInfo() {
    return this.request('/api/v1');
  }

  /**
   * Get content
   * @param {Object} options - Query options
   * @param {string} options.type - Filter by type: 'series', 'movie', or 'podcast'
   * @param {string} options.seriesId - Get episodes for a specific series
   */
  async getContent(options = {}) {
    const params = new URLSearchParams();
    if (options.type) params.append('type', options.type);
    if (options.seriesId) params.append('seriesId', options.seriesId);

    const queryString = params.toString();
    return this.request(`/api/v1/content${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Send a notification
   * @param {Object} notification - Notification data
   * @param {string[]} notification.userIds - Array of user IDs to notify
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {string} notification.type - Notification type: 'info', 'success', 'warning', 'error'
   * @param {string} notification.link - Optional link URL
   * @param {boolean} notification.openInAppBrowser - Open link in in-app browser
   */
  async sendNotification(notification) {
    return this.request('/api/v1/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  /**
   * Get users list
   */
  async getUsers() {
    return this.request('/api/v1/users');
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MMIApi;
}
if (typeof window !== 'undefined') {
  window.MMIApi = MMIApi;
}

