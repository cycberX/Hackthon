/**
 * =============================================================================
 * OneAPI Example Client - Centralized Base URL & Runtime Configuration
 * =============================================================================
 */

(function () {
  var DEFAULT_BASE_URL = 'https://hackthon-seven-gules.vercel.app';

  function resolveBaseUrl() {
    // 1. Check browser localStorage override (set via UI or settings)
    try {
      if (typeof localStorage !== 'undefined') {
        var stored = localStorage.getItem('oneapi_base_url');
        if (stored && stored.trim()) {
          return stored.trim().replace(/\/+$/, '');
        }
      }
    } catch (_) {}

    // 2. Check window explicit overrides
    if (typeof window !== 'undefined') {
      if (window.ONEAPI_BASE_URL) return window.ONEAPI_BASE_URL.replace(/\/+$/, '');
      if (window.API_BASE_URL) return window.API_BASE_URL.replace(/\/api\/v1\/?$/, '');

      // 3. Fallback to default base path
      return DEFAULT_BASE_URL;
    }

    return DEFAULT_BASE_URL;
  }

  var baseUrl = resolveBaseUrl();

  window.ONEAPI_CONFIG = {
    BASE_URL: baseUrl,
    API_BASE_URL: baseUrl + '/api/v1',
    setBaseUrl: function (url) {
      if (url) {
        localStorage.setItem('oneapi_base_url', url);
        window.location.reload();
      }
    },
    resetBaseUrl: function () {
      localStorage.removeItem('oneapi_base_url');
      window.location.reload();
    },
  };

  // Provide global aliases for maximum SDK and client compatibility
  window.ONEAPI_BASE_URL = window.ONEAPI_CONFIG.BASE_URL;
  window.API_BASE_URL = window.ONEAPI_CONFIG.API_BASE_URL;
})();
