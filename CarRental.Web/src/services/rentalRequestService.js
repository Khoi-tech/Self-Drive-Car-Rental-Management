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
  },

  getAllRequests: async (status = '') => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/rental-requests', { params });
      return response;
    } catch (error) {
      console.error('Error fetching rental requests:', error);
      throw error;
    }
  },

  approveRequest: async (id) => {
    try {
      const response = await api.put(`/rental-requests/${id}/approve`);
      return response;
    } catch (error) {
      console.error('Error approving rental request:', error);
      throw error;
    }
  },

  rejectRequest: async (id, reason) => {
    try {
      const response = await api.put(`/rental-requests/${id}/reject`, { reason });
      return response;
    } catch (error) {
      console.error('Error rejecting rental request:', error);
      throw error;
    }
  }
};

export default rentalRequestService;
