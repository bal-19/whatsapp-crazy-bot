import axios from 'axios';
import { useUIStore } from '../stores/uiStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Terjadi kesalahan';
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    useUIStore.getState().addToast({ type: 'error', message });
    return Promise.reject(error);
  }
);
