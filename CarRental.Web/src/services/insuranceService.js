import api from './api';

const insuranceService = {
  // Lấy toàn bộ danh sách bảo hiểm xe (hỗ trợ lọc theo carId, status)
  getAll: async (carId = null, status = null) => {
    const params = {};
    if (carId) params.carId = carId;
    if (status) params.status = status;
    const res = await api.get('/insurances', { params });
    return res?.data || res;
  },

  // Chi tiết hợp đồng bảo hiểm
  getById: async (id) => {
    const res = await api.get(`/insurances/${id}`);
    return res?.data || res;
  },

  // Lấy danh sách bảo hiểm theo xe
  getByVehicle: async (vehicleId) => {
    const res = await api.get(`/insurances/vehicle/${vehicleId}`);
    return res?.data || res;
  },

  // Cảnh báo bảo hiểm sắp hết hạn (< 30 ngày) hoặc đã hết hạn
  getAlerts: async () => {
    const res = await api.get('/insurances/alerts');
    return res?.data || res;
  },

  // Thêm mới bảo hiểm
  create: async (data) => {
    const res = await api.post('/insurances', data);
    return res?.data || res;
  },

  // Cập nhật bảo hiểm
  update: async (id, data) => {
    const res = await api.put(`/insurances/${id}`, data);
    return res?.data || res;
  },

  // Xóa bảo hiểm
  delete: async (id) => {
    const res = await api.delete(`/insurances/${id}`);
    return res?.data || res;
  }
};

export default insuranceService;
