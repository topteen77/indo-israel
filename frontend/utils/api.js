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

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response (network error)
      console.error('Network Error: Could not connect to API at', API_BASE_URL);
      console.error('Make sure the backend server is running and accessible');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
