import api from './api'

export const expenseService = {
  getAll: (page = 0, size = 10) =>
    api.get(`/api/expenses?page=${page}&size=${size}`).then(r => r.data),
  getByCategory: (cat) =>
    api.get(`/api/expenses/category/${encodeURIComponent(cat)}`).then(r => r.data),
  create: (data) =>
    api.post('/api/expenses', data).then(r => r.data),
  update: (id, data) =>
    api.put(`/api/expenses/${id}`, data).then(r => r.data),
  delete: (id) =>
    api.delete(`/api/expenses/${id}`),
}
