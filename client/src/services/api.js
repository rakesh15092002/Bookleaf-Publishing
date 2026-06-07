import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — attach token dynamically to secure gateways
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — smooth 401 unauth session wipe
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth Control Core ──────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me')
}

// ─── Books Data Mapping ─────────────────────────────────
export const booksAPI = {
  myBooks: () => api.get('/api/books'),
  all: () => api.get('/api/books'),
  getById: (id) => api.get(`/api/books/${id}`)
}

// ─── Tickets Administration (VERBS PATCH ALIGNED) ───────
export const ticketsAPI = {
  create: (data) => api.post('/api/tickets', data),
  getAll: () => api.get('/api/tickets'),
  getById: (id) => api.get(`/api/tickets/${id}`),
  updateStatus: (id, status) => api.patch(`/api/tickets/${id}/status`, { status }),
  assign: (id, adminId) => api.patch(`/api/tickets/${id}/assign`, { admin_id: adminId }),
  updateCategory: (id, category) => api.patch(`/api/tickets/${id}/category`, { category }),
  updatePriority: (id, priority) => api.patch(`/api/tickets/${id}/priority`, { priority })
}

// ─── Communication Pipelines ────────────────────────────
export const messagesAPI = {
  getAll: (ticketId) => api.get(`/api/tickets/${ticketId}/messages`),
  send: (ticketId, content, is_internal = false) =>
    api.post(`/api/tickets/${ticketId}/messages`, { content, is_internal })
}

// ─── Internal Log Records ───────────────────────────────
export const notesAPI = {
  getAll: (ticketId) => api.get(`/api/tickets/${ticketId}/notes`),
  add: (ticketId, content) => api.post(`/api/tickets/${ticketId}/notes`, { content })
}

export default api