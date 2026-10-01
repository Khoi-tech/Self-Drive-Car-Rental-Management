import api from './api';

const contractService = {
  getContractByRequestId: async (requestId) => {
    try {
      const response = await api.get(`/rental-contracts/request/${requestId}`);
      return response;
    } catch (error) {
      console.error('Error fetching contract by request id:', error);
      throw error;
    }
  },

  getContractById: async (contractId) => {
    try {
      const response = await api.get(`/rental-contracts/${contractId}`);
      return response;
    } catch (error) {
      console.error('Error fetching contract by id:', error);
      throw error;
    }
  },

  signContract: async (contractId, data) => {
    try {
      const response = await api.post(`/rental-contracts/${contractId}/sign`, data);
      return response;
    } catch (error) {
      console.error('Error signing contract:', error);
      throw error;
    }
  },

  getAllContracts: async (status = '') => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/rental-contracts', { params });
      return response;
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  }
};

export default contractService;
