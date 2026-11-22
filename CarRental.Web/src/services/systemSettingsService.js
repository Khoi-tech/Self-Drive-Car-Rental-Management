import api from './api';

const systemSettingsService = {
  // Lấy toàn bộ danh sách cấu hình hệ thống
  getAllSettings: async () => {
    return await api.get('/system-settings');
  },

  // Cập nhật giá trị một cấu hình
  updateSetting: async (key, value) => {
    return await api.put(`/system-settings/${encodeURIComponent(key)}`, { value: String(value) });
  },

  // Cập nhật đồng loạt danh sách cấu hình
  updateBatch: async (settingsMap) => {
    return await api.put('/system-settings/batch', { settings: settingsMap });
  },

  // Lấy cấu hình 4 hạng thành viên & ưu đãi (Public / Authenticated)
  getMembershipTiers: async () => {
    return await api.get('/system-settings/membership-tiers');
  },

  // Lưu cấu hình 4 hạng thành viên & ưu đãi (AdminOnly)
  updateMembershipTiers: async (tiers) => {
    return await api.put('/system-settings/membership-tiers', { tiers });
  }
};

export default systemSettingsService;
