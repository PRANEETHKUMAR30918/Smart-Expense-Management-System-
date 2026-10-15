import api from './api'

export const expenseService = {
  getAll: (page = 0, size = 10, category = '', search = '') => {
    let url = `/api/expenses?page=${page}&size=${size}`
    if (category) url += `&category=${encodeURIComponent(category)}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    return api.get(url).then(r => r.data)
  },
  getByCategory: (cat) =>
    api.get(`/api/expenses/category/${encodeURIComponent(cat)}`).then(r => r.data),
  create: (data) =>
    api.post('/api/expenses', data).then(r => r.data),
  update: (id, data) =>
    api.put(`/api/expenses/${id}`, data).then(r => r.data),
  delete: (id) =>
    api.delete(`/api/expenses/${id}`),
}
