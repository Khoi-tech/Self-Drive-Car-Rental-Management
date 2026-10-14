import api from './api';

const analyticsService = {
  // Lấy dữ liệu tổng quan Dashboard KPI (US-25)
  getDashboardOverview: async () => {
    const res = await api.get('/analytics/dashboard-overview');
    return res?.data || res;
  },

  // Báo cáo tỷ lệ khai thác đội xe (Fleet Utilization)
  getFleetUtilization: async () => {
    const res = await api.get('/analytics/fleet-utilization');
    return res?.data || res;
  }
};

export default analyticsService;
