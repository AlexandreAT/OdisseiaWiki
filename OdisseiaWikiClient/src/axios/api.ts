import axios from 'axios';

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5146/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
