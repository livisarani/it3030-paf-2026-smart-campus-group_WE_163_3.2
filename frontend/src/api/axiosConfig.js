import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add user email and name
api.interceptors.request.use(
  (config) => {
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    
    if (userEmail) {
      config.headers['X-User-Email'] = userEmail;
    }
    if (userName) {
      config.headers['X-User-Name'] = userName;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = (error.config?.url || '').toString();

      // Do not force navigation to login for action endpoints like cancel.
      // Let the UI surface the error and keep the user on the same page.
      if (!requestUrl.includes('/cancel')) {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;