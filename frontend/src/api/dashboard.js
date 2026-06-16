import client from './client'

export const dashboardApi = {
  getStats: () => client.get('/dashboard/stats'),
  getRevenueByCategory: () => client.get('/dashboard/revenue-by-category'),
  getStockStatus: () => client.get('/dashboard/stock-status'),
  getLowStockTable: () => client.get('/dashboard/low-stock-table'),
  getRecentOrders: () => client.get('/dashboard/recent-orders'),
}
