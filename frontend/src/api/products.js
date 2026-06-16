import api from './client'

export const productsApi = {
  getAll: (params = {}) => api.get('/products/', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getLowStock: (threshold = 10) => api.get('/products/low-stock', { params: { threshold } }),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  restock: (id, data) => api.post(`/products/${id}/restock`, data),
  adjust: (id, data) => api.post(`/products/${id}/adjust-stock`, data),
  getTransactions: (id, limit = 50) => api.get(`/products/${id}/transactions`, { params: { limit } }),
}
