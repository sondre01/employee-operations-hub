// Pure, vanilla fetch wrapper for API communication
// If running through Vite or Docker reverse proxy, '/api' is used.
// If running statically via VS Code Live Server on port 5500 without a proxy, it falls back directly to http://localhost:5000/api.
const API_BASE = 
  (typeof window !== 'undefined' && !import.meta.env.DEV && window.location.port !== '8080')
    ? 'http://localhost:5000/api'
    : '/api';

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
