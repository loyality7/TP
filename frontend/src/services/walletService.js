import apiService from './api';

export const walletService = {
  getBalance: async () => {
    const response = await apiService.get('/vendor/wallet/balance');
    return response.data;
  },

  getTransactions: async () => {
    const response = await apiService.get('/vendor/wallet/transactions');
    return response.data;
  },

  createOrder: async (amount) => {
    const response = await apiService.post('/vendor/wallet/order', { amount });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await apiService.post('/vendor/wallet/verify', paymentData);
    return response.data;
  }
};

export default walletService; 