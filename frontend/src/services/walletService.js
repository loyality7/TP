import apiService from './api';

export const walletService = {
  getBalance: async () => {
    try {
      const response = await apiService.get('/vendor/wallet/balance');
      console.log('getBalance Response:', response); // Log the entire response
      return response.data;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error; // Re-throw the error to handle it in the calling function
    }
  },

  getTransactions: async () => {
    try {
      const response = await apiService.get('/vendor/wallet/transactions');
      console.log('getTransactions Response:', response); // Log the entire response
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error; // Re-throw the error to handle it in the calling function
    }
  },

  createOrder: async (amount) => {
    try {
      const response = await apiService.post('/vendor/wallet/order', { amount });
      console.log('createOrder Response:', response); // Log the entire response
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error; // Re-throw the error to handle it in the calling function
    }
  },

  verifyPayment: async (paymentData) => {
    try {
      const response = await apiService.post('/vendor/wallet/verify', paymentData);
      console.log('verifyPayment Response:', response); // Log the entire response
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error; // Re-throw the error to handle it in the calling function
    }
  }
};

export default walletService; 