import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5171/api';

const compensationPolicyService = {
  getAllPolicies: async () => {
    const response = await axios.get(`${API_URL}/compensation-policies`);
    return response.data;
  },

  getPolicyById: async (id) => {
    const response = await axios.get(`${API_URL}/compensation-policies/${id}`);
    return response.data;
  },

  createPolicy: async (data) => {
    const response = await axios.post(`${API_URL}/compensation-policies`, data);
    return response.data;
  },

  updatePolicy: async (id, data) => {
    const response = await axios.put(`${API_URL}/compensation-policies/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, isActive) => {
    const response = await axios.patch(`${API_URL}/compensation-policies/${id}/status`, { isActive });
    return response.data;
  }
};

export default compensationPolicyService;
