import api from './api'

export const budgetService = {
  getAll: (month, year) =>
    api.get(`/api/budgets?month=${month}&year=${year}`).then(r => r.data),
  create: (data) =>
    api.post('/api/budgets', data).then(r => r.data),
  update: (id, data) =>
    api.put(`/api/budgets/${id}`, data).then(r => r.data),
  delete: (id) =>
    api.delete(`/api/budgets/${id}`),
}
