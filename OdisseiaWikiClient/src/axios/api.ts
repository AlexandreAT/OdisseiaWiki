import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (!configuredApiUrl && import.meta.env.PROD) {
  throw new Error('VITE_API_URL não foi configurada para o build de produção.');
}

const apiUrl = (configuredApiUrl || 'http://localhost:5146/api').replace(/\/$/, '');

if (!/^https?:\/\//i.test(apiUrl)) {
  throw new Error('VITE_API_URL deve ser uma URL HTTP(S) absoluta.');
}

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
