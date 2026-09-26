import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5171/api';

const rentalConditionService = {
  getConditionByVehicleId: async (vehicleId) => {
    const response = await axios.get(`${API_URL}/vehicles/${vehicleId}/rental-condition`);
    return response.data;
  },

  createCondition: async (vehicleId, data) => {
    const response = await axios.post(`${API_URL}/vehicles/${vehicleId}/rental-condition`, data);
    return response.data;
  },

  updateCondition: async (vehicleId, data) => {
    const response = await axios.put(`${API_URL}/vehicles/${vehicleId}/rental-condition`, data);
    return response.data;
  },

  deleteCondition: async (vehicleId) => {
    const response = await axios.delete(`${API_URL}/vehicles/${vehicleId}/rental-condition`);
    return response.data;
  }
};

export default rentalConditionService;
