import axios from 'axios';

const envApi = process.env.NEXT_PUBLIC_API_URL;

// When unset: use dynamic hostname (works from other machines). When '' = same-origin /api (nginx/Docker). When set: use it.
const getApiBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return `${protocol}//${hostname}:5000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL =
  envApi === ''
    ? '/api'
    : envApi
      ? (envApi.endsWith('/api') ? envApi : envApi + '/api')
      : getApiBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
