import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Car, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  FileSignature, 
  CreditCard, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  ChevronRight, 
  Search, 
  X,
  Eye,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import rentalRequestService from '../../services/rentalRequestService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ duyệt hồ sơ',
    subtext: 'Đội ngũ VELORA đang kiểm duyệt CCCD & GPLX của bạn',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: Clock,
    color: 'text-amber-400'
  },
  APPROVED: {
    label: 'Đã duyệt - Cần ký HĐ',
    subtext: 'Hồ sơ hợp lệ! Vui lòng ký hợp đồng điện tử để tiến hành cọc xe',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
    color: 'text-emerald-400'
  },
  SIGNED: {
    label: 'Đã ký HĐ - Chờ đặt cọc',
    subtext: 'Hợp đồng đã ký kết. Vui lòng thanh toán cọc để giữ xe',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    icon: FileSignature,
    color: 'text-blue-400'
  },
  CONFIRMED: {
    label: 'Đã đặt cọc thành công',
    subtext: 'Đã giữ xe thành công! Hẹn gặp quý khách vào ngày nhận xe',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    icon: ShieldCheck,
    color: 'text-emerald-300'
  },
  ACTIVE: {
    label: 'Đang trong chuyến đi',
    subtext: 'Xe đang được bàn giao và lưu hành. Chúc bạn chuyến đi an toàn!',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    icon: Car,
    color: 'text-purple-400'
  },
  COMPLETED: {
    label: 'Chuyến đi hoàn tất',
    subtext: 'Xe đã được bàn giao và hoàn tất kiểm toán hợp đồng',
    badgeBg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    icon: CheckCircle2,
    color: 'text-zinc-400'
  },
  REJECTED: {
    label: 'Hồ sơ bị từ chối',
    subtext: 'Hồ sơ chưa đạt yêu cầu. Xem lý do chi tiết bên dưới',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    icon: XCircle,
    color: 'text-rose-400'
  },
  CANCELLED: {
    label: 'Đơn thuê đã hủy',
    subtext: 'Đơn thuê đã bị hủy bởi khách hàng hoặc quá hạn',
    badgeBg: 'bg-zinc-800 text-zinc-500 border-zinc-700',
    icon: XCircle,
    color: 'text-zinc-500'
  }
};

const ProfilePage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const email = user?.email || '';
      const phone = user?.phoneNumber || '';
      const res = await rentalRequestService.getMyRequests(email, phone);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setRequests(list);
    } catch (err) {
      console.error('Error fetching customer bookings:', err);
      setError('Không thể tải lịch sử đơn thuê xe. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyBookings();
    }
  }, [isAuthenticated, user?.email]);

  // Tab Filtering
  const filteredRequests = requests.filter(item => {
    let matchTab = true;
    if (activeTab === 'PENDING') {
      matchTab = item.status === 'PENDING';
    } else if (activeTab === 'ACTION_NEEDED') {
      matchTab = item.status === 'APPROVED' || item.status === 'SIGNED';
    } else if (activeTab === 'CONFIRMED') {
      matchTab = item.status === 'CONFIRMED' || item.status === 'ACTIVE';
    } else if (activeTab === 'HISTORY') {
      matchTab = item.status === 'COMPLETED' || item.status === 'REJECTED' || item.status === 'CANCELLED';
    }

    const searchLower = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
      item.carModel?.toLowerCase().includes(searchLower) ||
      item.carMake?.toLowerCase().includes(searchLower) ||
      item.carLicensePlate?.toLowerCase().includes(searchLower) ||
      item.id?.toLowerCase().includes(searchLower);

    return matchTab && matchSearch;
  });

  // KPI counters
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const actionNeededCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'SIGNED').length;
  const confirmedCount = requests.filter(r => r.status === 'CONFIRMED' || r.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Customer Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* User Info */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center text-3xl font-light text-amber-400 shadow-inner">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'V'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-white">
                    {user?.fullName || 'Khách Hàng VELORA'}
                  </h1>
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    VIP Member
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-zinc-500" />
                    {user?.email || 'Chưa cập nhật email'}
                  </span>
                  {user?.phoneNumber && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} className="text-zinc-500" />
                      {user?.phoneNumber}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-zinc-500" />
                    Tham gia: {formatDateTime(user?.createdAt || new Date()).slice(0, 10)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchMyBookings}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-2"
                title="Làm mới danh sách đơn"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Làm mới</span>
              </button>
              <Link
                to="/cars"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <span>Đặt thêm xe</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-zinc-800/60">
            <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/40">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Tổng số đơn</p>
              <p className="text-2xl font-light text-white mt-1">{totalCount}</p>
            </div>
            <div className="bg-amber-950/20 rounded-xl p-4 border border-amber-900/30">
              <p className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Chờ xét duyệt</p>
              <p className="text-2xl font-light text-amber-300 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-emerald-950/20 rounded-xl p-4 border border-emerald-900/30">
              <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Cần ký & Cọc</p>
              <p className="text-2xl font-light text-emerald-300 mt-1">{actionNeededCount}</p>
            </div>
            <div className="bg-blue-950/20 rounded-xl p-4 border border-blue-900/30">
              <p className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">Đã giữ xe / Đang thuê</p>
              <p className="text-2xl font-light text-blue-300 mt-1">{confirmedCount}</p>
            </div>
          </div>
        </div>

        {/* Action Alert Banner for Approved / Awaiting Sign/Deposit */}
        {actionNeededCount > 0 && (
          <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 border border-emerald-500/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Bạn có <span className="text-emerald-400 font-semibold">{actionNeededCount} đơn thuê</span> đã được duyệt và sẵn sàng ký hợp đồng / đặt cọc!
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Vui lòng hoàn tất ký hợp đồng và chuyển khoản đặt cọc để hệ thống khóa lịch giữ xe cho bạn.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('ACTION_NEEDED')}
              className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 whitespace-nowrap transition-colors"
            >
              Xem đơn cần xử lý
            </button>
          </div>
        )}

        {/* Bookings Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-light tracking-wide text-white flex items-center gap-2">
              <FileText size={20} className="text-amber-400" />
              <span>Danh Sách Đơn Thuê Của Tôi</span>
            </h2>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Tìm xe, biển số, mã đơn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800 text-xs">
            {[
              { key: 'ALL', label: `Tất cả (${totalCount})` },
              { key: 'ACTION_NEEDED', label: `Cần ký & Cọc (${actionNeededCount})` },
              { key: 'PENDING', label: `Chờ duyệt (${pendingCount})` },
              { key: 'CONFIRMED', label: `Đã cọc / Đang thuê (${confirmedCount})` },
              { key: 'HISTORY', label: 'Lịch sử / Khác' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap font-medium ${
                  activeTab === tab.key
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </span>
              <button onClick={fetchMyBookings} className="underline hover:text-rose-300">
                Thử lại
              </button>
            </div>
          )}

          {/* Bookings List */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw size={28} className="animate-spin mx-auto text-amber-400/80" />
              <p className="text-xs text-zinc-400">Đang đồng bộ dữ liệu đơn thuê của bạn...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <Car size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-base font-light text-zinc-300">Không tìm thấy đơn thuê nào</p>
                <p className="text-xs text-zinc-500">
                  {searchTerm ? 'Không có đơn nào khớp với từ khóa tìm kiếm của bạn.' : 'Bạn chưa có yêu cầu đặt xe nào trong phân loại này.'}
                </p>
              </div>
              <Link
                to="/cars"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium transition-colors"
              >
                <span>Khám phá các dòng xe sẵn sàng</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map(req => {
                const statusInfo = STATUS_CONFIG[req.status] || {
                  label: req.status,
                  subtext: '',
                  badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                  icon: AlertCircle,
                  color: 'text-zinc-400'
                };
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={req.id}
                    className="group rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all p-5 sm:p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Car & Booking Summary */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        {/* Car Thumbnail */}
                        <div className="w-full sm:w-36 h-28 sm:h-24 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0 relative">
                          {req.carImageUrl ? (
                            <img
                              src={req.carImageUrl}
                              alt={req.carModel}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              <Car size={28} />
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-white/10">
                            {req.carLicensePlate || 'VELORA'}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-lg font-medium text-white group-hover:text-amber-300 transition-colors">
                              {req.carMake} {req.carModel}
                            </h3>
                            <span className="text-[11px] font-mono text-zinc-500">
                              #REQ-{req.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>

                          {/* Schedule & Location */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-zinc-500" />
                              {formatDateTime(req.startTime).slice(0, 16)} → {formatDateTime(req.endTime).slice(0, 16)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                              {req.totalDays} ngày
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <MapPin size={13} className="text-zinc-500" />
                            <span>Nhận xe: {req.pickupLocation}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Status Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-zinc-900">
                        {/* Financials */}
                        <div className="text-left lg:text-right">
                          <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Tổng tiền thuê</p>
                          <p className="text-lg font-medium text-amber-400">
                            {formatCurrency(req.estimatedTotalFee)}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Tiền cọc giữ xe: {formatCurrency(req.depositAmount)}
                          </p>
                        </div>

                        {/* Status Badge & Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Badge */}
                          <div className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${statusInfo.badgeBg}`}>
                            <StatusIcon size={14} className={statusInfo.color} />
                            <span>{statusInfo.label}</span>
                          </div>

                          {/* Contextual Action Button */}
                          {req.status === 'APPROVED' && (
                            <Link
                              to={`/contracts/sign/${req.id}`}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                            >
                              <FileSignature size={14} />
                              <span>Ký hợp đồng ngay</span>
                            </Link>
                          )}

                          {req.status === 'SIGNED' && (
                            <Link
                              to={`/payment/deposit/${req.id}`}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                            >
                              <CreditCard size={14} />
                              <span>Thanh toán đặt cọc</span>
                            </Link>
                          )}

                          {req.status === 'CONFIRMED' && (
                            <Link
                              to={`/payment/deposit/${req.id}`}
                              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                              <ShieldCheck size={14} className="text-emerald-400" />
                              <span>Xem biên nhận cọc</span>
                            </Link>
                          )}

                          {/* View Detail Modal Trigger */}
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Xem chi tiết đơn"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subtext info or Rejection reason */}
                    {req.status === 'REJECTED' && req.rejectReason && (
                      <div className="mt-4 pt-3 border-t border-rose-950/40 text-xs text-rose-400/90 flex items-start gap-2 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                        <AlertCircle size={15} className="text-rose-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-rose-300">Lý do từ chối: </span>
                          {req.rejectReason}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <span>Chi Tiết Đơn Thuê</span>
                  <span className="text-xs font-mono text-zinc-500">
                    #REQ-{selectedRequest.id.slice(0, 8).toUpperCase()}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ngày tạo đơn: {formatDateTime(selectedRequest.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
              >
                <X size={18} />
              </button>
            </div>

            {/* Vehicle Card */}
            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4 flex items-center gap-4">
              <div className="w-20 h-16 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                {selectedRequest.carImageUrl ? (
                  <img src={selectedRequest.carImageUrl} alt={selectedRequest.carModel} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600"><Car size={24} /></div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  {selectedRequest.carMake} {selectedRequest.carModel}
                </p>
                <p className="text-xs font-mono text-amber-400">
                  Biển số: {selectedRequest.carLicensePlate || 'Đang cập nhật'}
                </p>
                <p className="text-xs text-zinc-400">
                  Đơn giá ngày: {formatCurrency(selectedRequest.dailyRate)} / ngày
                </p>
              </div>
            </div>

            {/* Schedule & Locations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1">
                <span className="text-zinc-500 block">Thời gian nhận xe</span>
                <span className="text-white font-medium block">{formatDateTime(selectedRequest.startTime)}</span>
                <span className="text-zinc-400 block">Điểm nhận: {selectedRequest.pickupLocation}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1">
                <span className="text-zinc-500 block">Thời gian trả xe</span>
                <span className="text-white font-medium block">{formatDateTime(selectedRequest.endTime)}</span>
                <span className="text-zinc-400 block">Điểm trả: {selectedRequest.dropoffLocation}</span>
              </div>
            </div>

            {/* Renter Info */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 text-xs">
              <h4 className="font-semibold text-zinc-300">Thông tin người thuê</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400">
                <p>Họ tên: <span className="text-white font-medium">{selectedRequest.customerName}</span></p>
                <p>Số điện thoại: <span className="text-white font-medium">{selectedRequest.customerPhone}</span></p>
                <p>Email: <span className="text-white font-medium">{selectedRequest.customerEmail}</span></p>
                <p>CCCD/CMND: <span className="text-white font-medium">{selectedRequest.customerIdCard}</span></p>
                <p>Số GPLX: <span className="text-white font-medium">{selectedRequest.driverLicenseNumber}</span></p>
              </div>
              {selectedRequest.notes && (
                <div className="pt-2 border-t border-zinc-800/60 text-zinc-400">
                  <span>Ghi chú: </span>
                  <span className="text-zinc-300 italic">{selectedRequest.notes}</span>
                </div>
              )}
            </div>

            {/* Financial summary */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Số ngày thuê:</span>
                <span className="text-white">{selectedRequest.totalDays} ngày</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Chiết khấu / Phụ phí:</span>
                <span className="text-white">
                  -{selectedRequest.discountPercent}% / +{selectedRequest.holidaySurchargePercent}%
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tiền cọc giữ xe (hoàn lại):</span>
                <span className="text-white font-medium">{formatCurrency(selectedRequest.depositAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-zinc-800 text-white">
                <span>Tổng tiền thuê dự kiến:</span>
                <span className="text-amber-400">{formatCurrency(selectedRequest.estimatedTotalFee)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-colors"
              >
                Đóng
              </button>

              {selectedRequest.status === 'APPROVED' && (
                <Link
                  to={`/contracts/sign/${selectedRequest.id}`}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileSignature size={14} />
                  <span>Ký hợp đồng ngay</span>
                </Link>
              )}

              {selectedRequest.status === 'SIGNED' && (
                <Link
                  to={`/payment/deposit/${selectedRequest.id}`}
                  className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <CreditCard size={14} />
                  <span>Thanh toán đặt cọc</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
