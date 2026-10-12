import api from './api';

const extensionService = {
  getAll: async (status = null) => {
    const params = status ? { status } : {};
    const res = await api.get('/rental-extensions', { params });
    return res?.data || res;
  },

  getById: async (id) => {
    const res = await api.get(`/rental-extensions/${id}`);
    return res?.data || res;
  },

  getByRequestId: async (requestId) => {
    const res = await api.get(`/rental-extensions/request/${requestId}`);
    return res?.data || res;
  },

  create: async (data) => {
    const res = await api.post('/rental-extensions', data);
    return res?.data || res;
  },

  approve: async (id, data = {}) => {
    const res = await api.post(`/rental-extensions/${id}/approve`, data);
    return res?.data || res;
  },

  reject: async (id, data = {}) => {
    const res = await api.post(`/rental-extensions/${id}/reject`, data);
    return res?.data || res;
  }
};

export default extensionService;
