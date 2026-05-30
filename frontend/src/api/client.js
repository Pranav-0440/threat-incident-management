import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT interceptor — auto-attach token to every request
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 by clearing auth
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== Auth API ==========
export const authAPI = {
  login: (credentials) => client.post('/auth/login', credentials),
  register: (data) => client.post('/auth/register', data),
};

// ========== Incidents API ==========
export const incidentsAPI = {
  getAll: () => client.get('/incidents'),
  getById: (id) => client.get(`/incidents/${id}`),
  create: (incident) => client.post('/incidents', incident),
  update: (id, incident) => client.put(`/incidents/${id}`, incident),
  updateStatus: (id, status) => client.patch(`/incidents/${id}/status?status=${status}`),
  delete: (id) => client.delete(`/incidents/${id}`),
  search: (query) => client.get(`/incidents/search?q=${encodeURIComponent(query)}`),
  getBySeverity: (severity) => client.get(`/incidents/severity/${severity}`),
  getByStatus: (status) => client.get(`/incidents/status/${status}`),
  getStats: () => client.get('/incidents/stats'),
};

export default client;
