import * as signalR from '@microsoft/signalr';
import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5171/api';
const HUB_URL = API_BASE_URL.replace(/\/api\/?$/, '') + '/hubs/notifications';

const notificationService = {
  // Lấy danh sách thông báo người dùng (có phân trang & lọc loại)
  getMyNotifications: async (params = {}) => {
    return await api.get('/notifications', { params });
  },

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: async () => {
    return await api.get('/notifications/unread-count');
  },

  // Đánh dấu 1 thông báo đã đọc
  markAsRead: async (id) => {
    return await api.patch(`/notifications/${id}/read`);
  },

  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: async () => {
    return await api.patch('/notifications/mark-all-read');
  },

  // Xóa thông báo
  deleteNotification: async (id) => {
    return await api.delete(`/notifications/${id}`);
  },

  // Khởi tạo kết nối SignalR Hub cho thông báo thời gian thực
  createHubConnection: (handlers = {}) => {
    const token = localStorage.getItem('velora_token') || localStorage.getItem('token');
    if (!token) return null;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('velora_token') || localStorage.getItem('token') || '',
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    if (handlers.onReceiveNotification) {
      connection.on('ReceiveNotification', handlers.onReceiveNotification);
    }
    if (handlers.onUnreadCountUpdated) {
      connection.on('UnreadCountUpdated', handlers.onUnreadCountUpdated);
    }

    return connection;
  }
};

export default notificationService;
