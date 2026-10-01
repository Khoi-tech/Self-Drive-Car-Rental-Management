import api from './api';

const paymentService = {
  createDepositPayment: async (data) => {
    try {
      const response = await api.post('/payments/deposit', data);
      return response;
    } catch (error) {
      console.error('Error creating deposit payment:', error);
      throw error;
    }
  },

  confirmPayment: async (transactionCode) => {
    try {
      const response = await api.post('/payments/confirm', { transactionCode });
      return response;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  getPaymentByRequestId: async (requestId) => {
    try {
      const response = await api.get(`/payments/request/${requestId}`);
      return response;
    } catch (error) {
      console.error('Error fetching payment by request id:', error);
      throw error;
    }
  }
};

export default paymentService;
