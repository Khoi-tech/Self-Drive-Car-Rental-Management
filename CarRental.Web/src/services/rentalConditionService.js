import api from './api';

const rentalConditionService = {
  getConditionByVehicleId: async (vehicleId) => {
    const response = await api.get(`/vehicles/${vehicleId}/rental-condition`);
    return response;
  },

  createCondition: async (vehicleId, data) => {
    const response = await api.post(`/vehicles/${vehicleId}/rental-condition`, data);
    return response;
  },

  updateCondition: async (vehicleId, data) => {
    const response = await api.put(`/vehicles/${vehicleId}/rental-condition`, data);
    return response;
  },

  deleteCondition: async (vehicleId) => {
    const response = await api.delete(`/vehicles/${vehicleId}/rental-condition`);
    return response;
  }
};

export default rentalConditionService;
