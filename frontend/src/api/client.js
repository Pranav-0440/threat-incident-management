import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL must be configured for the active Vite mode');
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout to handle backend cold starts & redeployments
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

// Response interceptor — auto-retry on cold-starts/redeployments and handle 401 auth expiry
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Handle 401 Unauthorized
    if (response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Auto-retry on Network Errors, Timeouts, or 502/503/504 Gateway errors (Server redeploying/sleeping)
    const isServerRebuildingOrSleeping = !response || (response.status >= 502 && response.status <= 504) || error.code === 'ECONNABORTED';

    if (isServerRebuildingOrSleeping && config && (!config._retryCount || config._retryCount < 3)) {
      config._retryCount = (config._retryCount || 0) + 1;
      const delay = Math.pow(2, config._retryCount) * 1000; // 2s, 4s, 8s exponential backoff
      console.warn(`[ThreatGuard API] Server is starting or deploying (Retry ${config._retryCount}/3). Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return client(config);
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
  assignAnalyst: (id, analystUsername, analystName) => client.patch(`/incidents/${id}/assign`, { analystUsername, analystName }),
  toggleChecklist: (id, itemId) => client.patch(`/incidents/${id}/checklist/${itemId}/toggle`),
  getRelated: (id) => client.get(`/incidents/${id}/related`),
  delete: (id) => client.delete(`/incidents/${id}`),
  search: (query) => client.get(`/incidents/search?q=${encodeURIComponent(query)}`),
  getBySeverity: (severity) => client.get(`/incidents/severity/${severity}`),
  getByStatus: (status) => client.get(`/incidents/status/${status}`),
  getStats: () => client.get('/incidents/stats'),
};

// ========== Comments API ==========
export const commentsAPI = {
  getByIncident: (incidentId) => client.get(`/incidents/${incidentId}/comments`),
  add: (incidentId, content) => client.post(`/incidents/${incidentId}/comments`, { content }),
  delete: (incidentId, commentId) => client.delete(`/incidents/${incidentId}/comments/${commentId}`),
};

// ========== Attachments API ==========
export const attachmentsAPI = {
  getByIncident: (incidentId) => client.get(`/attachments/incident/${incidentId}`),
  upload: (incidentId, formData) => client.post(`/attachments/upload/${incidentId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => client.delete(`/attachments/${id}`),
};

// ========== Audit Logs API ==========
export const auditLogsAPI = {
  getByIncident: (incidentId) => client.get(`/audit-logs/incident/${incidentId}`),
  getAll: () => client.get('/audit-logs'),
};

// ========== Notifications API ==========
export const notificationsAPI = {
  getAll: () => client.get('/notifications'),
  getUnreadCount: () => client.get('/notifications/unread-count'),
  markAsRead: (id) => client.patch(`/notifications/${id}/read`),
  markAllAsRead: () => client.patch('/notifications/read-all'),
};

// ========== Users API ==========
export const usersAPI = {
  getAll: () => client.get('/users'),
  updateRole: (id, role) => client.patch(`/users/${id}/role`, { role }),
};

export default client;
