import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Car, 
  ShieldCheck, 
  Trash2, 
  CheckCheck,
  ArrowRight,
  Search,
  Settings,
  AlertTriangle,
  X,
  QrCode,
  Check,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import notificationService from '../../../services/notificationService';
import { formatDateTime } from '../../../utils/formatters';

const mapNotification = (n) => {
  const date = new Date(n.createdAt);
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  
  let timestamp = 'Vừa xong';
  if (diffSec >= 86400 * 2) {
    timestamp = `${Math.floor(diffSec / 86400)} ngày trước`;
  } else if (diffSec >= 86400) {
    timestamp = 'Hôm qua';
  } else if (diffSec >= 3600) {
    timestamp = `${Math.floor(diffSec / 3600)} giờ trước`;
  } else if (diffSec >= 60) {
    timestamp = `${Math.floor(diffSec / 60)} phút trước`;
  }

  const category = (n.type || 'SYSTEM').toUpperCase();
  let typeBadge = 'HỆ THỐNG';
  let actionText = 'Xem chi tiết';

  if (category === 'RENTAL') {
    typeBadge = 'THUÊ XE';
    actionText = n.actionUrl?.includes('documents') ? 'Ký hợp đồng số ngay' : 'Xem đơn thuê';
  } else if (category === 'PAYMENT') {
    typeBadge = 'THANH TOÁN';
    actionText = 'Xem sổ cái giao dịch';
  } else if (category === 'ACCOUNT') {
    typeBadge = 'TÀI KHOẢN';
    actionText = 'Xem hồ sơ định danh';
  } else if (category === 'SECURITY') {
    typeBadge = 'BẢO MẬT';
    actionText = 'Quản lý bảo mật';
  }

  return {
    id: n.id,
    category,
    priority: n.isRead ? 'NORMAL' : 'HIGH',
    typeBadge,
    title: n.title,
    description: n.message,
    timestamp,
    fullTime: formatDateTime(n.createdAt),
    isRead: n.isRead,
    actionType: 'LINK',
    actionText,
    actionLink: n.actionUrl || null
  };
};

const NotificationsSection = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  // User notification preferences (stored locally)
  const [preferences, setPreferences] = useState({
    smsHandover: true,
    emailContracts: true,
    zaloDepositRefund: true,
    appTripAlerts: true,
    promotions: false
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMyNotifications({ page: 1, pageSize: 50 });
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      setNotifications(list.map(mapNotification));
    } catch (err) {
      console.error('Lỗi nạp thông báo từ server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        setLoading(true);
        const res = await notificationService.getMyNotifications({ page: 1, pageSize: 50 });
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        setNotifications(list.map(mapNotification));
      } catch (err) {
        console.error('Lỗi nạp thông báo từ server:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initData();

    // SignalR Hub Connection
    const connection = notificationService.createHubConnection({
      onReceiveNotification: (newNotif) => {
        if (!isMounted || !newNotif) return;
        setNotifications(prev => {
          const exists = prev.some(n => n.id === newNotif.id);
          if (exists) return prev;
          return [mapNotification(newNotif), ...prev];
        });
      },
      onUnreadCountUpdated: () => {}
    });

    if (connection) {
      connection.start()
        .then(() => console.log('SignalR Notification Hub Connected'))
        .catch(err => console.warn('SignalR Hub Connection error:', err));
    }

    return () => {
      isMounted = false;
      if (connection) {
        connection.stop();
      }
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Statistics
  const stats = useMemo(() => {
    return {
      unread: notifications.filter(n => !n.isRead).length,
      rentals: notifications.filter(n => n.category === 'RENTAL').length,
      payments: notifications.filter(n => n.category === 'PAYMENT').length,
      kyc: notifications.filter(n => n.category === 'ACCOUNT').length
    };
  }, [notifications]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Category / Tab filter
      if (activeTab === 'UNREAD' && n.isRead) return false;
      if (activeTab !== 'ALL' && activeTab !== 'UNREAD' && n.category !== activeTab) return false;

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title?.toLowerCase().includes(q);
        const matchDesc = n.description?.toLowerCase().includes(q);
        const matchBadge = n.typeBadge?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchBadge;
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Handlers
  const handleMarkAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.warn('Lỗi markAsRead:', err);
    }
  };

  const handleToggleRead = async (id, e) => {
    e.stopPropagation();
    const target = notifications.find(n => n.id === id);
    if (!target) return;

    if (!target.isRead) {
      await handleMarkAsRead(id);
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('Lỗi markAllAsRead:', err);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.warn('Lỗi deleteNotification:', err);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setPreferencesSaved(true);
    setTimeout(() => {
      setPreferencesSaved(false);
      setIsPreferencesOpen(false);
    }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Trung tâm thông báo & Nhật ký hệ thống
            </h2>
            {unreadCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-900 text-white flex items-center gap-1 shadow-2xs animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300"></span>
                {unreadCount} mới
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Đã đọc hết
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thông báo trạng thái đơn đặt xe, biên bản bàn giao, cập nhật tiền cọc và đối soát phạt nguội thời gian thực qua SignalR.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition border border-slate-200 cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Cài đặt kênh</span>
          </button>
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-40 disabled:hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đọc tất cả</span>
          </button>
        </div>
      </div>

      {/* 2. Top Statistic Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setActiveTab('UNREAD')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'UNREAD' 
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-900/10' 
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Chưa đọc</span>
            <Bell className="w-3.5 h-3.5 text-blue-900" />
          </div>
          <div className="text-xl font-black text-blue-950 tabular-nums mt-1">
            {stats.unread}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('RENTAL')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'RENTAL' 
              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-900/10' 
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Hợp đồng & Xe</span>
            <Car className="w-3.5 h-3.5 text-indigo-900" />
          </div>
          <div className="text-xl font-black text-indigo-950 tabular-nums mt-1">
            {stats.rentals}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('PAYMENT')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'PAYMENT' 
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-900/10' 
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Tiền cọc & Quyết toán</span>
            <QrCode className="w-3.5 h-3.5 text-emerald-900" />
          </div>
          <div className="text-xl font-black text-emerald-950 tabular-nums mt-1">
            {stats.payments}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('ACCOUNT')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'ACCOUNT' 
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-900/10' 
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">KYC & Pháp lý</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
          </div>
          <div className="text-xl font-black text-amber-950 tabular-nums mt-1">
            {stats.kyc}
          </div>
        </div>
      </div>

      {/* 3. Search & Category Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
            { id: 'RENTAL', label: 'Đơn thuê xe' },
            { id: 'PAYMENT', label: 'Cọc & Quyết toán' },
            { id: 'ACCOUNT', label: 'Định danh KYC' },
            { id: 'SECURITY', label: 'Bảo mật' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo nội dung, xe, cọc..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-900 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Notification Items List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-7 h-7 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Đang tải thông báo từ máy chủ...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Không tìm thấy thông báo phù hợp</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Không có thông báo nào khớp với danh mục hoặc từ khóa tìm kiếm của quý khách.
          </p>
          <button
            onClick={() => { setActiveTab('ALL'); setSearchQuery(''); }}
            className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Xem tất cả thông báo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            let IconComponent = Bell;
            let iconWrapperStyle = 'bg-blue-100 text-blue-900 border-blue-200';
            let badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';

            if (item.category === 'RENTAL') {
              IconComponent = Car;
              iconWrapperStyle = 'bg-indigo-100 text-indigo-900 border-indigo-200';
              badgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200';
            } else if (item.category === 'PAYMENT') {
              IconComponent = QrCode;
              iconWrapperStyle = 'bg-emerald-100 text-emerald-900 border-emerald-200';
              badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            } else if (item.category === 'ACCOUNT') {
              IconComponent = ShieldCheck;
              iconWrapperStyle = 'bg-sky-100 text-sky-900 border-sky-200';
              badgeStyle = 'bg-sky-50 text-sky-800 border-sky-200';
            } else if (item.category === 'SECURITY') {
              IconComponent = AlertTriangle;
              iconWrapperStyle = 'bg-amber-100 text-amber-900 border-amber-200';
              badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
            }

            return (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id)}
                className={`relative rounded-xl border transition-all duration-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 cursor-pointer group ${
                  !item.isRead
                    ? 'bg-gradient-to-r from-blue-50/60 via-indigo-50/20 to-white border-blue-200 shadow-xs hover:border-blue-300'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                {/* Left Unread Indicator Bar */}
                {!item.isRead && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-900 rounded-r-full" />
                )}

                {/* Left Category Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5 ${iconWrapperStyle}`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Body Content */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider ${badgeStyle}`}>
                        {item.typeBadge}
                      </span>
                      <h4 className={`text-xs sm:text-sm ${
                        !item.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                      }`}>
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span title={item.fullTime}>{item.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pr-2">
                    {item.description}
                  </p>

                  {/* Direct Action Link if present */}
                  {item.actionLink && (
                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        to={item.actionLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-900 text-white text-xs font-bold transition shadow-2xs"
                      >
                        <span>{item.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        • {item.fullTime}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Quick Action Icons (Hover visible) */}
                <div className="flex sm:flex-col items-center justify-end gap-1 shrink-0 self-end sm:self-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleToggleRead(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded-md transition"
                    title={item.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                  >
                    <Check className={`w-4 h-4 ${!item.isRead ? 'text-blue-900' : 'text-slate-400'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    title="Xóa thông báo này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 5. Notification Preferences Modal */}
      {isPreferencesOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Cài đặt kênh nhận thông báo</h3>
                  <span className="text-[11px] text-slate-500">Tùy biến thông báo SMS, Email và ứng dụng</span>
                </div>
              </div>
              <button 
                onClick={() => setIsPreferencesOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="space-y-3">
                {[
                  { id: 'smsHandover', label: 'SMS nhắc lịch nhận & bàn giao xe', desc: 'Nhận tin nhắn thương hiệu VELORA 2 giờ trước giờ hẹn' },
                  { id: 'emailContracts', label: 'Email sao lưu Hợp đồng & Biên bản số', desc: 'Gửi bản PDF hợp đồng ngay khi ký số thành công' },
                  { id: 'zaloDepositRefund', label: 'Zalo / App thông báo hoàn tiền cọc', desc: 'Nhận thông báo biến động số dư hoàn cọc Đợt 1 & Đợt 2' },
                  { id: 'appTripAlerts', label: 'Thông báo ứng dụng theo thời gian thực', desc: 'Đẩy thông báo qua SignalR khi đơn được duyệt / cọc thành công' },
                  { id: 'promotions', label: 'Bản tin ưu đãi & Nâng hạng hội viên', desc: 'Chương trình tri ân khách hàng thân thiết vào cuối tuần' }
                ].map(opt => (
                  <label key={opt.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={preferences[opt.id]}
                      onChange={(e) => setPreferences({ ...preferences, [opt.id]: e.target.checked })}
                      className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{opt.label}</div>
                      <div className="text-[11px] text-slate-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {preferencesSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã lưu cài đặt kênh nhận thông báo của bạn.</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPreferencesOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 transition cursor-pointer shadow-xs"
                >
                  Lưu tùy chọn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default NotificationsSection;
