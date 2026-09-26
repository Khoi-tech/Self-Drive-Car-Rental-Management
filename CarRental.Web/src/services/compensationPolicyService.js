import api from './api';

const compensationPolicyService = {
  getAllPolicies: async () => {
    return await api.get('/compensation-policies');
  },

  getPolicyById: async (id) => {
    return await api.get(`/compensation-policies/${id}`);
  },

  createPolicy: async (data) => {
    return await api.post('/compensation-policies', data);
  },

  updatePolicy: async (id, data) => {
    return await api.put(`/compensation-policies/${id}`, data);
  },

  updateStatus: async (id, isActive) => {
    return await api.patch(`/compensation-policies/${id}/status`, { isActive });
  }
};

export default compensationPolicyService;

