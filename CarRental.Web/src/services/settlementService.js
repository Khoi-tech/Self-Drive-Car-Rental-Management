import api from './api';

const settlementService = {
  // Lấy danh sách phiếu quyết toán
  getAll: async () => {
    const res = await api.get('/settlements');
    return res?.data || res;
  },

  // Chi tiết phiếu quyết toán
  getById: async (id) => {
    const res = await api.get(`/settlements/${id}`);
    return res?.data || res;
  },

  // Lấy phiếu quyết toán theo đơn thuê (requestId)
  getByRequestId: async (requestId) => {
    const res = await api.get(`/settlements/by-request/${requestId}`);
    return res?.data || res;
  },

  // Xem trước bảng tính quyết toán tự động
  preview: async (requestId) => {
    const res = await api.get(`/settlements/preview/${requestId}`);
    return res?.data || res;
  },

  // Tạo/Chốt phiếu quyết toán (US-23)
  create: async (data) => {
    const res = await api.post('/settlements', data);
    return res?.data || res;
  },

  // Xác nhận đã hoàn cọc cho khách qua VietQR
  confirmRefund: async (id, data) => {
    const res = await api.post(`/settlements/${id}/confirm-refund`, data);
    return res?.data || res;
  },

  // Xác nhận khách đã đóng tiền phạt thiếu
  confirmAdditionalPayment: async (id, data) => {
    const res = await api.post(`/settlements/${id}/confirm-additional-payment`, data);
    return res?.data || res;
  }
};

export default settlementService;
