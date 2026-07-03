const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('@DanceFlow:token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers,
  };
  
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let url = `${API_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  const response = await fetch(url, config);
  
  if (response.status === 204) {
    return null;
  }
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const error = new Error(data.message || 'Ocorreu um erro no servidor.');
    error.status = response.status;
    error.errors = data.errors;
    throw error;
  }
  
  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
