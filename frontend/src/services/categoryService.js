import api from './api'

export const categoryService = {
  getAll: () => api.get('/api/categories').then(r => r.data),
  create: (data) => api.post('/api/categories', data).then(r => r.data),
  update: (id, data) => api.put(`/api/categories/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/api/categories/${id}`),
}
