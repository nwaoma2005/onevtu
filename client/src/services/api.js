import axios from 'axios';

// ✅ HARDCODED - No rebuild needed
const API_URL = 'https://onevtu.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  fundWallet: (data) => api.post('/wallet/fund', data),
  getHistory: () => api.get('/wallet/history'),
};

export const servicesAPI = {
  buyAirtime: (data) => api.post('/services/airtime', data),
  buyData: (data) => api.post('/services/data', data),
  payCableTV: (data) => api.post('/services/cable-tv', data),
  payElectricity: (data) => api.post('/services/electricity', data),
  getDataPlans: (network) => api.get(`/services/data-plans/${network}`),
  getCablePlans: (provider) => api.get(`/services/cable-plans/${provider}`),
  verifyMeter: (data) => api.post('/services/verify-meter', data),
  verifySmartCard: (data) => api.post('/services/verify-smartcard', data),
};

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  download: (id) => api.get(`/transactions/${id}/receipt`, { responseType: 'blob' }),
};

export default api;