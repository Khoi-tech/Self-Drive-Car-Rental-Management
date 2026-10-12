import api from './api';

const maintenanceService = {
  getAll: async (status = null, carId = null) => {
    const params = {};
    if (status) params.status = status;
    if (carId) params.carId = carId;
    const res = await api.get('/maintenance', { params });
    return res?.data || res;
  },

  getAlerts: async () => {
    const res = await api.get('/maintenance/alerts');
    return res?.data || res;
  },

  getById: async (id) => {
    const res = await api.get(`/maintenance/${id}`);
    return res?.data || res;
  },

  create: async (data) => {
    const res = await api.post('/maintenance', data);
    return res?.data || res;
  },

  complete: async (id, data) => {
    const res = await api.post(`/maintenance/${id}/complete`, data);
    return res?.data || res;
  },

  delete: async (id) => {
    const res = await api.delete(`/maintenance/${id}`);
    return res?.data || res;
  }
};

export default maintenanceService;
