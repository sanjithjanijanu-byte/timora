// Use Vite proxy or explicit IPv4 127.0.0.1 to avoid Windows IPv6 (::1) localhost resolution timeouts
export const API_BASE = (typeof window !== 'undefined' && window.location.port === '5173')
  ? '/api'
  : 'http://127.0.0.1:8000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  try {
    const res = await fetch(url, config);

    if (res.status === 204) return null;

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return res.json();
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err);
    throw err;
  }
}

const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export default api;

