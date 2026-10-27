// Pure, vanilla fetch wrapper for API communication
// 1. In production (Vercel or custom domain), always use '/api' to hit the app's own serverless endpoints.
//    This prevents placeholder domain poisoning (e.g. your-ticketing-desk.vercel.app) or cross-origin CORS failures.
// 2. If running statically via VS Code Live Server (port 5500), fall back to localhost:5000/api.
// 3. In local dev, default to '/api' which Vite proxies to localhost:5000.
function getApiBase() {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      return '/api';
    }
    if (window.location.port === '5500') {
      return 'http://localhost:5000/api';
    }
  }
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_API_BASE_URL : null;
  if (envUrl && !envUrl.includes('your-') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }
  return '/api';
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

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    console.error(`API fetch error [${options.method || 'GET'} ${url}]:`, err);
    throw new Error(`Failed to fetch (${err.message})`);
  }

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMessage = errorJson.message;
      } else if (errorJson.error) {
        errorMessage = errorJson.error;
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
