import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  pinLogin: (storeId: string, pinCode: string) =>
    api.post('/auth/pin-login', { storeId, pinCode }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Items API
export const itemsApi = {
  getAll: (params?: { categoryId?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/items', { params }),
  getById: (id: string) => api.get(`/items/${id}`),
  getByBarcode: (barcode: string) => api.get(`/items/barcode/${barcode}`),
  create: (data: any) => api.post('/items', data),
  update: (id: string, data: any) => api.put(`/items/${id}`, data),
  delete: (id: string) => api.delete(`/items/${id}`),
};

// Tickets API
export const ticketsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post('/tickets', data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  hold: (id: string) => api.post(`/tickets/${id}/hold`),
  reopen: (id: string) => api.post(`/tickets/${id}/reopen`),
  addItem: (ticketId: string, data: any) => api.post(`/tickets/${ticketId}/items`, data),
  updateItem: (ticketId: string, itemId: string, data: any) =>
    api.put(`/tickets/${ticketId}/items/${itemId}`, data),
  removeItem: (ticketId: string, itemId: string) =>
    api.delete(`/tickets/${ticketId}/items/${itemId}`),
  pay: (ticketId: string, data: any) => api.post(`/tickets/${ticketId}/pay`, data),
  applyDiscount: (ticketId: string, data: any) => api.post(`/tickets/${ticketId}/discount`, data),
  split: (ticketId: string, itemIds: string[]) => api.post(`/tickets/${ticketId}/split`, { itemIds }),
  merge: (ticketId: string, mergeWithTicketId: string) =>
    api.post(`/tickets/${ticketId}/merge`, { mergeWithTicketId }),
  refund: (ticketId: string, data: any) => api.post(`/tickets/${ticketId}/refund`, data),
};

// Customers API
export const customersApi = {
  getAll: (params?: { search?: string; page?: number }) =>
    api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getHistory: (id: string) => api.get(`/customers/${id}/history`),
};

// Payments API
export const paymentsApi = {
  getAll: () => api.get('/payments'),
  create: (data: any) => api.post('/payments', data),
  update: (id: string, data: any) => api.put(`/payments/${id}`, data),
  delete: (id: string) => api.delete(`/payments/${id}`),
};

// Reports API
export const reportsApi = {
  sales: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/sales', { params }),
  salesByItem: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/sales-by-item', { params }),
  salesByPayment: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/sales-by-payment', { params }),
};

// Stores API
export const storesApi = {
  getAll: () => api.get('/stores'),
  getById: (id: string) => api.get(`/stores/${id}`),
  create: (data: any) => api.post('/stores', data),
  update: (id: string, data: any) => api.put(`/stores/${id}`, data),
};

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Shifts API
export const shiftsApi = {
  getAll: () => api.get('/shifts'),
  getCurrent: () => api.get('/shifts/current'),
  open: (openingCash: number) => api.post('/shifts/open', { openingCash }),
  close: (closingCash: number) => api.post('/shifts/close', { closingCash }),
  addCashEvent: (data: any) => api.post('/shifts/cash-event', data),
  getTimeClock: () => api.get('/shifts/timeclock'),
  clockIn: () => api.post('/shifts/timeclock', { action: 'clock_in' }),
  clockOut: () => api.post('/shifts/timeclock', { action: 'clock_out' }),
};

// Settings API
export const settingsApi = {
  getStore: () => api.get('/settings/store'),
  updateStore: (data: any) => api.put('/settings/store', data),
  getTaxes: () => api.get('/settings/taxes'),
  updateTaxes: (data: any) => api.put('/settings/taxes', data),
  getReceipt: () => api.get('/settings/receipt'),
  updateReceipt: (data: any) => api.put('/settings/receipt', data),
  getAll: () => api.get('/settings'),
};

// Inventory API
export const inventoryApi = {
  getStock: (params?: { lowStock?: boolean; categoryId?: string }) =>
    api.get('/inventory', { params }),
  adjustStock: (itemId: string, data: { quantity: number; reason: string }) =>
    api.post(`/inventory/${itemId}/adjust`, data),
  getPurchaseOrders: () => api.get('/inventory/purchase-orders'),
  createPurchaseOrder: (data: any) => api.post('/inventory/purchase-orders', data),
  updatePurchaseOrder: (id: string, data: any) => api.put(`/inventory/purchase-orders/${id}`, data),
  getTransfers: () => api.get('/inventory/transfers'),
  createTransfer: (data: any) => api.post('/inventory/transfers', data),
};

// Reports API
export const reportsApi = {
  sales: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/sales', { params }),
  salesByItem: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/sales-by-item', { params }),
  salesByCategory: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/sales-by-category', { params }),
  salesByPayment: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/sales-by-payment', { params }),
  salesByEmployee: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/sales-by-employee', { params }),
  hourlySales: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/hourly-sales', { params }),
  taxReport: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/tax', { params }),
  shiftReport: (params: { dateFrom: string; dateTo: string }) =>
    api.get('/reports/shift', { params }),
  exportCSV: (reportType: string, params: any) =>
    api.get(`/reports/export/${reportType}`, { params, responseType: 'blob' }),
};

// Kitchen API
export const kitchenApi = {
  getOrders: (params?: { status?: string }) => api.get('/kitchen', { params }),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/kitchen/${id}/status`, { status }),
  assignStation: (id: string, stationId: string) =>
    api.put(`/kitchen/${id}/station`, { stationId }),
  getStations: () => api.get('/kitchen/stations'),
  updateSettings: (data: any) => api.put('/kitchen/settings', data),
};

// Discounts API
export const discountsApi = {
  getAll: () => api.get('/discounts'),
  getById: (id: string) => api.get(`/discounts/${id}`),
  create: (data: any) => api.post('/discounts', data),
  update: (id: string, data: any) => api.put(`/discounts/${id}`, data),
  delete: (id: string) => api.delete(`/discounts/${id}`),
};

// Taxes API
export const taxesApi = {
  getAll: () => api.get('/taxes'),
  getById: (id: string) => api.get(`/taxes/${id}`),
  create: (data: any) => api.post('/taxes', data),
  update: (id: string, data: any) => api.put(`/taxes/${id}`, data),
  delete: (id: string) => api.delete(`/taxes/${id}`),
};

// Receipts API
export const receiptsApi = {
  getByTicketId: (ticketId: string) => api.get(`/receipts/${ticketId}`),
  print: (data: { ticketId: string; paymentMethod?: string; printerUrl?: string }) =>
    api.post('/receipts/print', data),
  email: (data: { ticketId: string; email: string }) =>
    api.post('/receipts/email', data),
};
