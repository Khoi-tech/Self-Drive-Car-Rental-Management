import api from './api';

const customerService = {
  getCustomers: async (params = {}) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v != null && v !== '')
      );
      const response = await api.get('/customers', { params: cleanParams });
      return response;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  toggleStatus: async (id, status, reason = '') => {
    try {
      const response = await api.put(`/customers/${id}/toggle-status`, { status, reason });
      return response;
    } catch (error) {
      console.error('Error toggling customer status:', error);
      throw error;
    }
  },

  updateKycStatus: async (id, kycStatus, rejectReason = '') => {
    try {
      const response = await api.put(`/customers/${id}/kyc-status`, { kycStatus, rejectReason });
      return response;
    } catch (error) {
      console.error('Error updating customer KYC status:', error);
      throw error;
    }
  },

  addViolation: async (id, type, pointsAdjustment, notes = '') => {
    try {
      const response = await api.post(`/customers/${id}/violations`, {
        type,
        pointsAdjustment,
        notes
      });
      return response;
    } catch (error) {
      console.error('Error adding violation/adjusting score:', error);
      throw error;
    }
  }
};

export default customerService;
