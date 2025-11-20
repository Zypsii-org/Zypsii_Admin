import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../utils/base_url';

// API Config - Use the same base URL as the main app with /api prefix
const API_URL = `${base_url}/api/splits`;
const USER_API_URL = `${base_url}`;
console.log('Split API URL:', API_URL);
console.log('User API URL:', USER_API_URL);

// Create axios instance for splits API
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for user API
const userApi = axios.create({
  baseURL: USER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Request to:', config.url);
      console.log('Token available:', !!token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add the same interceptors to userApi
userApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('User API Request to:', config.url);
      console.log('Token available:', !!token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in user API request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    console.log('Response from:', response.config.url, 'Status:', response.status);
    return response;
  },
  async (error) => {
    console.log('Error from:', error.config?.url, 'Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message);
    
    if (error.response?.status === 401) {
      // Token is invalid or expired, clear it and redirect to login
      try {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user');
        // Trigger a global event to notify the app about logout
        console.log('Token expired, user should be redirected to login');
        // You can dispatch a custom event here if needed
      } catch (clearError) {
        console.error('Error clearing auth data:', clearError);
      }
    }
    return Promise.reject(error);
  }
);

// Add the same response interceptor to userApi
userApi.interceptors.response.use(
  (response) => {
    console.log('User API Response from:', response.config.url, 'Status:', response.status);
    return response;
  },
  async (error) => {
    console.log('User API Error from:', error.config?.url, 'Status:', error.response?.status);
    console.log('User API Error message:', error.response?.data?.message);
    
    if (error.response?.status === 401) {
      // Token is invalid or expired, clear it and redirect to login
      try {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user');
        // Trigger a global event to notify the app about logout
        console.log('Token expired, user should be redirected to login');
        // You can dispatch a custom event here if needed
      } catch (clearError) {
        console.error('Error clearing auth data:', clearError);
      }
    }
    return Promise.reject(error);
  }
);

// Groups API
export const groupsAPI = {
  getGroups: () => api.get('/groups'),
  getGroup: (id) => api.get(`/groups/${id}`),
  createGroup: (groupData) => api.post('/groups', groupData),
  updateGroup: (id, groupData) => api.put(`/groups/${id}`, groupData),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  addMember: (groupId, userData) => api.post(`/groups/${groupId}/members`, userData),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
};

// Expenses API
export const expensesAPI = {
  getExpenses: (params) => api.get('/expenses', { params }),
  getExpense: (id) => api.get(`/expenses/${id}`),
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  updateExpense: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
};

// Balances API
export const balancesAPI = {
  getBalances: () => api.get('/balances'),
  getGroupBalances: (groupId) => api.get(`/balances/group/${groupId}`),
  getDetailedGroupBalances: (groupId) => api.get(`/balances/group/${groupId}/detailed`),
  getBalanceHistory: (balanceId) => api.get(`/balances/history/${balanceId}`),
  settleBalance: (settlementData) => api.post('/balances/settle', settlementData),
  markBalanceAsReceived: (data) => api.post('/balances/mark-received', data),
  simplifyDebts: (groupId) => api.get(`/balances/simplify/${groupId}`),
  getBalanceSummary: () => api.get('/balances/summary'),
  getGroupBalanceSummary: (groupId) => api.get(`/balances/group/${groupId}/summary`),
};

// Payment Status API
export const paymentStatusAPI = {
  getPaymentStatuses: (params) => api.get('/payment-status', { params }),
  createPaymentStatus: (paymentData) => api.post('/payment-status', paymentData),
  requestConfirmation: (paymentId) => api.put(`/payment-status/${paymentId}/request-confirmation`),
  confirmPayment: (paymentId) => api.put(`/payment-status/${paymentId}/confirm`),
  cancelPayment: (paymentId) => api.put(`/payment-status/${paymentId}/cancel`),
};

// Users API
export const usersAPI = {
  searchUsers: (query, page = 1, limit = 20) => userApi.get(`/user/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
};

export default {
  groups: groupsAPI,
  expenses: expensesAPI,
  balances: balancesAPI,
  paymentStatus: paymentStatusAPI,
  users: usersAPI,
}; 