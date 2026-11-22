import api from './api';

const pricingService = {
  getPoliciesByVehicleId: async (vehicleId) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/pricing-policies`);
      return response;
    } catch (error) {
      console.error('Error fetching pricing policies:', error);
      throw error;
    }
  },

  createPolicy: async (vehicleId, policyData) => {
    try {
      const response = await api.post(`/vehicles/${vehicleId}/pricing-policies`, policyData);
      return response;
    } catch (error) {
      console.error('Error creating pricing policy:', error);
      throw error;
    }
  },

  updatePolicy: async (vehicleId, policyId, policyData) => {
    try {
      const response = await api.put(`/vehicles/${vehicleId}/pricing-policies/${policyId}`, policyData);
      return response;
    } catch (error) {
      console.error('Error updating pricing policy:', error);
      throw error;
    }
  },

  deletePolicy: async (vehicleId, policyId) => {
    try {
      const response = await api.delete(`/vehicles/${vehicleId}/pricing-policies/${policyId}`);
      return response;
    } catch (error) {
      console.error('Error deleting pricing policy:', error);
      throw error;
    }
  },

  getPricingDefaults: async () => {
    try {
      const response = await api.get('/pricing-defaults');
      return response;
    } catch (error) {
      console.error('Error fetching pricing defaults:', error);
      throw error;
    }
  },

  applyStandardPackage: async (vehicleId) => {
    try {
      const response = await api.post(`/vehicles/${vehicleId}/pricing-policies/apply-standard`);
      return response;
    } catch (error) {
      console.error('Error applying standard pricing package:', error);
      throw error;
    }
  },

  previewPricing: async (vehicleId, rentalDays, options = {}) => {
    try {
      const payload = {
        rentalDays,
        isHoliday: Boolean(options.isHoliday),
        isVietQrPrepaid: Boolean(options.isVietQrPrepaid)
      };
      const response = await api.post(`/vehicles/${vehicleId}/pricing-preview`, payload);
      return response;
    } catch (error) {
      console.error('Error previewing pricing:', error);
      throw error;
    }
  }
};

export default pricingService;
