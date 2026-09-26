import api from './api';

const rentalRequestService = {
  createRequest: async (data) => {
    try {
      const response = await api.post('/rental-requests', data);
      return response;
    } catch (error) {
      console.error('Error creating rental request:', error);
      throw error;
    }
  },

  getRequestById: async (id) => {
    try {
      const response = await api.get(`/rental-requests/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching rental request:', error);
      throw error;
    }
  }
};

export default rentalRequestService;
