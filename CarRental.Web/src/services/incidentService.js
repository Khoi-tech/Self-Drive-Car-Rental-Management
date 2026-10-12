import api from './api';

const incidentService = {
  getAll: async (status = null, severity = null) => {
    const params = {};
    if (status) params.status = status;
    if (severity) params.severity = severity;
    const res = await api.get('/incidents', { params });
    return res?.data || res;
  },

  getById: async (id) => {
    const res = await api.get(`/incidents/${id}`);
    return res?.data || res;
  },

  getByRequestId: async (requestId) => {
    const res = await api.get(`/incidents/request/${requestId}`);
    return res?.data || res;
  },

  create: async (data) => {
    const res = await api.post('/incidents', data);
    return res?.data || res;
  },

  updateStatus: async (id, data) => {
    const res = await api.post(`/incidents/${id}/status`, data);
    return res?.data || res;
  },

  resolve: async (id, data) => {
    const res = await api.post(`/incidents/${id}/resolve`, data);
    return res?.data || res;
  }
};

export default incidentService;
