import api from './api';

const returnProtocolService = {
  // Lấy toàn bộ danh sách biên bản hoàn trả
  getAll: async () => {
    const res = await api.get('/returnprotocols');
    return res?.data || res;
  },

  // Chi tiết biên bản hoàn trả
  getById: async (id) => {
    const res = await api.get(`/returnprotocols/${id}`);
    return res?.data || res;
  },

  // Lấy biên bản hoàn trả theo mã đơn thuê (requestId)
  getByRequestId: async (requestId) => {
    const res = await api.get(`/returnprotocols/by-request/${requestId}`);
    return res?.data || res;
  },

  // Lập biên bản hoàn trả xe mới (US-22)
  create: async (data) => {
    const res = await api.post('/returnprotocols', data);
    return res?.data || res;
  }
};

export default returnProtocolService;
