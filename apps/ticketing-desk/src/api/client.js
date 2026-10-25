// Pure, vanilla fetch wrapper for API communication
// 1. If VITE_API_BASE_URL is provided in environment (e.g. on Vercel), use that.
// 2. If running statically via VS Code Live Server (port 5500), fall back to localhost:5000.
// 3. Otherwise default to '/api' (used by Vite dev proxy, Docker Nginx proxy, or Vercel rewrites).
const API_BASE = 
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.port === '5500'
    ? 'http://localhost:5000/api'
    : '/api');

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
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
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null; // No content
  }

  return await response.json();
}
