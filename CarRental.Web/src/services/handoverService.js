import api from './api';

const handoverService = {
  // Lấy toàn bộ danh sách biên bản bàn giao
  getAll: async (status = null) => {
    const params = status ? { status } : {};
    const res = await api.get('/handover-protocols', { params });
    return res?.data || res;
  },

  // Chi tiết biên bản bàn giao
  getById: async (id) => {
    const res = await api.get(`/handover-protocols/${id}`);
    return res?.data || res;
  },

  // Lấy biên bản bàn giao theo mã đơn thuê (requestId)
  getByRequestId: async (requestId) => {
    const res = await api.get(`/handover-protocols/request/${requestId}`);
    return res?.data || res;
  },

  // Lập biên bản bàn giao mới
  create: async (data) => {
    const res = await api.post('/handover-protocols', data);
    return res?.data || res;
  },

  // Cập nhật biên bản bàn giao
  update: async (id, data) => {
    const res = await api.put(`/handover-protocols/${id}`, data);
    return res?.data || res;
  },

  // Xóa biên bản
  delete: async (id) => {
    const res = await api.delete(`/handover-protocols/${id}`);
    return res?.data || res;
  }
};

export default handoverService;
