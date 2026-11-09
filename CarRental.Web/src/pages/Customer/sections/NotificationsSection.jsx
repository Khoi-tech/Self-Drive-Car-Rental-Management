import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Car, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  CheckCheck,
  Zap,
  ArrowRight,
  Filter,
  Search,
  Settings,
  Mail,
  Smartphone,
  MessageSquare,
  AlertTriangle,
  X,
  FileCheck2,
  FileSignature,
  QrCode,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'RENTAL',
    priority: 'HIGH',
    typeBadge: 'KÝ HỢP ĐỒNG',
    title: 'Hồ sơ thuê xe Porsche Taycan 4S đã được phê duyệt',
    description: 'Hồ sơ CCCD gắn chip & Giấy phép lái xe của bạn đã được Pháp chế VELORA xác thực cấp 2 hợp lệ. Vui lòng ký hợp đồng điện tử để khóa xe giao tận nơi.',
    timestamp: '10 phút trước',
    fullTime: '14:35 • Hôm nay',
    isRead: false,
    actionType: 'LINK',
    actionText: 'Ký hợp đồng số ngay',
    actionLink: '/profile?tab=documents'
  },
  {
    id: 'notif-2',
    category: 'PAYMENT',
    priority: 'NORMAL',
    typeBadge: 'CỌC GIỮ XE',
    title: 'Xác nhận cọc giữ xe 500.000đ (Fast Hold) thành công',
    description: 'Hệ thống đã nhận thanh toán 500.000đ qua VietQR Napas 247. Xe Porsche Taycan 4S đã được giữ lịch trong 4 giờ để bạn kiểm tra hợp đồng.',
    timestamp: '2 giờ trước',
    fullTime: '12:45 • Hôm nay',
    isRead: false,
    actionType: 'VIEW_RECEIPT',
    actionText: 'Xem sổ cái tiền cọc',
    actionLink: '/profile?tab=payments'
  },
  {
    id: 'notif-3',
    category: 'ACCOUNT',
    priority: 'NORMAL',
    typeBadge: 'ĐỊNH DANH KYC',
    title: 'Xác thực định danh Cấp 2 thành công',
    description: 'Căn cước công dân gắn chip (079092004568) và Giấy phép lái xe Hạng B2 (790184920194) đã đồng bộ dữ liệu chuẩn mực theo Nghị định 13/2023/NĐ-CP.',
    timestamp: '1 ngày trước',
    fullTime: '09:15 • Hôm qua',
    isRead: true,
    actionType: 'LINK',
    actionText: 'Xem hồ sơ định danh',
    actionLink: '/profile?tab=identity'
  },
  {
    id: 'notif-4',
    category: 'PAYMENT',
    priority: 'NORMAL',
    typeBadge: 'HOÀN CỌC VIETQR',
    title: 'Hoàn trả tiền cọc thế chân 44.800.000đ hoàn tất',
    description: 'Đã hoàn tất thanh lý hợp đồng và đối soát phạt nguội chuyến đi BMW 530i. Tiền cọc đã được chuyển hoàn tự động về tài khoản Techcombank (1903 8920 4910).',
    timestamp: '3 ngày trước',
    fullTime: '17:05 • 06/11/2026',
    isRead: true,
    actionType: 'VIEW_RECEIPT',
    actionText: 'Xem chi tiết biên nhận',
    actionLink: '/profile?tab=payments'
  },
  {
    id: 'notif-5',
    category: 'RENTAL',
    priority: 'NORMAL',
    typeBadge: 'NHẮC LỊCH NHẬN XE',
    title: 'Nhắc nhở: Lịch nhận bàn giao xe BMW 320i SportLine vào ngày mai',
    description: 'Chuyên viên giao nhận VELORA sẽ bàn giao xe tại 15 Lê Lợi, Phường Bến Nghé, Quận 1 vào lúc 08:00 sáng mai. Vui lòng mang theo bản gốc CCCD & GPLX.',
    timestamp: '4 ngày trước',
    fullTime: '10:00 • 05/11/2026',
    isRead: true,
    actionType: 'LINK',
    actionText: 'Xem đơn sắp nhận',
    actionLink: '/profile?tab=rentals'
  },
  {
    id: 'notif-6',
    category: 'SECURITY',
    priority: 'ALERT',
    typeBadge: 'AN TOÀN',
    title: 'Phát hiện đăng nhập từ thiết bị mới',
    description: 'Tài khoản của bạn vừa đăng nhập từ thiết bị iPhone 15 Pro (Safari Mobile) tại TP. Hồ Chí Minh (IP: 14.169.89.201). Nếu không phải bạn, hãy đổi mật khẩu ngay.',
    timestamp: '1 tuần trước',
    fullTime: '21:12 • 02/11/2026',
    isRead: true,
    actionType: 'LINK',
    actionText: 'Quản lý phiên đăng nhập',
    actionLink: '/profile?tab=settings'
  }
];

const NotificationsSection = () => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  // User notification preferences
  const [preferences, setPreferences] = useState({
    smsHandover: true,
    emailContracts: true,
    zaloDepositRefund: true,
    appTripAlerts: true,
    promotions: false
  });

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
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchDesc = n.description.toLowerCase().includes(q);
        const matchBadge = n.typeBadge?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchBadge;
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Handlers
  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleToggleRead = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAllRead = () => {
    if (window.confirm('Quý khách có chắc chắn muốn xóa toàn bộ thông báo đã đọc?')) {
      setNotifications(prev => prev.filter(n => !n.isRead));
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
            Theo dõi thời gian thực tiến độ phê duyệt hồ sơ, giải ngân cọc VietQR, biên bản bàn giao và cảnh báo an toàn.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-900" />
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPreferencesOpen(true)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
            title="Cài đặt kênh nhận thông báo"
          >
            <Settings className="w-4 h-4" />
          </button>

          {notifications.some(n => n.isRead) && (
            <button
              type="button"
              onClick={handleClearAllRead}
              className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer shadow-2xs"
              title="Dọn dẹp thông báo đã đọc"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Quick Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setActiveTab('UNREAD')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'UNREAD' 
              ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300' 
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chưa đọc</span>
            <Bell className="w-3.5 h-3.5 text-blue-900" />
          </div>
          <div className="text-xl font-black text-slate-900 tabular-nums mt-1">
            {stats.unread}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('RENTAL')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'RENTAL' 
              ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-300' 
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Đơn thuê & Xe</span>
            <Car className="w-3.5 h-3.5 text-indigo-800" />
          </div>
          <div className="text-xl font-black text-indigo-950 tabular-nums mt-1">
            {stats.rentals}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('PAYMENT')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'PAYMENT' 
              ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300' 
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Cọc & VietQR</span>
            <CreditCard className="w-3.5 h-3.5 text-emerald-800" />
          </div>
          <div className="text-xl font-black text-emerald-950 tabular-nums mt-1">
            {stats.payments}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('ACCOUNT')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'ACCOUNT' 
              ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300' 
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
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
      {filteredNotifications.length === 0 ? (
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
                className="text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {preferencesSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã cập nhật tùy chọn nhận thông báo của quý khách!</span>
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
              
              {/* Option 1: SMS */}
              <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-900" />
                    Tin nhắn SMS khẩn cấp & Giờ giao nhận xe
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Nhận SMS nhắc lịch trước 2 giờ khi nhân viên VELORA xuất phát giao xe tận nơi.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.smsHandover}
                  onChange={(e) => setPreferences(p => ({ ...p, smsHandover: e.target.checked }))}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer mt-1"
                />
              </div>

              {/* Option 2: Email */}
              <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-700" />
                    Email Hợp đồng ký số & Biên lai tài chính
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Tự động gửi bản sao PDF Hợp đồng thuê xe có chữ ký SHA-256 và biên nhận quyết toán cọc.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailContracts}
                  onChange={(e) => setPreferences(p => ({ ...p, emailContracts: e.target.checked }))}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer mt-1"
                />
              </div>

              {/* Option 3: Zalo ZNS */}
              <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    Zalo ZNS Biến động tiền cọc VietQR
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Nhận thông báo Zalo chính thức khi tiền hoàn cọc được chuyển thành công về tài khoản ngân hàng.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.zaloDepositRefund}
                  onChange={(e) => setPreferences(p => ({ ...p, zaloDepositRefund: e.target.checked }))}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer mt-1"
                />
              </div>

              {/* Option 4: Cảnh báo phạt nguội & bảo hiểm */}
              <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    Cảnh báo đối soát phạt nguội & Nhắc hạn GPLX
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Thông báo khi hoàn tất 14 ngày đối soát vi phạm giao thông và nhắc gia hạn trước khi bằng lái hết hạn.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.appTripAlerts}
                  onChange={(e) => setPreferences(p => ({ ...p, appTripAlerts: e.target.checked }))}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer mt-1"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreferencesOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Lưu cấu hình nhận tin
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
