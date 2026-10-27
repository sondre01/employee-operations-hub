// Pure, vanilla fetch wrapper for API communication
// 1. If VITE_API_BASE_URL is provided in environment, use that (unless pointing to localhost in production).
// 2. If running statically via VS Code Live Server (port 5500), fall back to localhost:5000.
// 3. Otherwise default to '/api' (used by Vite dev proxy, Docker Nginx proxy, or Vercel rewrites).
function getApiBase() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // If VITE_API_BASE_URL points to localhost, but we are running on Vercel or a remote domain, ignore localhost and use /api
    if (envUrl) {
      if (envUrl.includes('localhost') && !isLocalhost) {
        return '/api';
      }
      return envUrl.replace(/\/+$/, '');
    }
    if (window.location.port === '5500') {
      return 'http://localhost:5000/api';
    }
  }
  return envUrl ? envUrl.replace(/\/+$/, '') : '/api';
}

const API_BASE = getApiBase();

export async function apiRequest(endpoint, options = {}) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalizedEndpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // response was not JSON
    }
    console.error(`API Request failed [${options.method || 'GET'} ${url}]:`, errorMessage);
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null; // No content
  }

  return await response.json();
}
