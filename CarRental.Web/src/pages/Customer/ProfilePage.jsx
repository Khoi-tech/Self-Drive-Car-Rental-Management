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
  ArrowRight,
  FileCheck,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import rentalRequestService from '../../services/rentalRequestService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import ExtensionModal from '../../components/operations/ExtensionModal';
import IncidentModal from '../../components/operations/IncidentModal';
import CustomerHandoverModal from '../../components/operations/CustomerHandoverModal';
import CustomerSettlementReceiptModal from '../../components/operations/CustomerSettlementReceiptModal';
import Navbar from '../../components/layout/Navbar';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ duyệt hồ sơ',
    subtext: 'Đội ngũ VELORA đang kiểm duyệt CCCD & GPLX của bạn',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Đã duyệt - Cần ký HĐ',
    subtext: 'Hồ sơ hợp lệ! Vui lòng ký hợp đồng điện tử để tiến hành cọc xe',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  SIGNED: {
    label: 'Đã ký HĐ - Chờ đặt cọc',
    subtext: 'Hợp đồng đã ký kết. Vui lòng thanh toán cọc để giữ xe',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: FileSignature,
  },
  CONFIRMED: {
    label: 'Đã đặt cọc thành công',
    subtext: 'Đã giữ xe thành công! Hẹn gặp quý khách vào ngày nhận xe',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: ShieldCheck,
  },
  ACTIVE: {
    label: 'Đang trong chuyến đi',
    subtext: 'Xe đang được bàn giao và lưu hành. Chúc bạn chuyến đi an toàn!',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: Car,
  },
  COMPLETED: {
    label: 'Chuyến đi hoàn tất',
    subtext: 'Xe đã được nghiệm thu và hoàn tất quyết toán hợp đồng',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Hồ sơ bị từ chối',
    subtext: 'Thông tin giấy tờ chưa hợp lệ hoặc xe đã bị trùng lịch',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Đơn đã hủy',
    subtext: 'Yêu cầu thuê xe đã được hủy bỏ',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: XCircle,
  }
};

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExtensionOpen, setIsExtensionOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [isHandoverConfirmOpen, setIsHandoverConfirmOpen] = useState(false);
  const [isSettlementReceiptOpen, setIsSettlementReceiptOpen] = useState(false);

  const fetchMyRequests = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const res = await rentalRequestService.getMyRequests();
      const data = res?.data || res;
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách đơn thuê xe của bạn.');
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyRequests(true);
  };

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'ACTIVE_GROUP' && !['CONFIRMED', 'ACTIVE'].includes(req.status)) return false;
    if (activeTab === 'ACTION_REQUIRED' && !['APPROVED', 'SIGNED'].includes(req.status)) return false;
    if (activeTab === 'COMPLETED' && req.status !== 'COMPLETED') return false;
    if (activeTab === 'PENDING' && req.status !== 'PENDING') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCar = `${req.carMake} ${req.carModel}`.toLowerCase().includes(q);
      const matchPlate = req.carLicensePlate?.toLowerCase().includes(q);
      const matchId = req.id?.toLowerCase().includes(q);
      return matchCar || matchPlate || matchId;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      <Navbar isVisible={true} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        {/* Customer Header Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-blue-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-zinc-950">
                    {user?.fullName || 'Khách hàng VELORA'}
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold">
                    {user?.role || 'CUSTOMER'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail size={13} className="text-slate-400" />
                    {user?.email || 'customer@velora.vn'}
                  </span>
                  {user?.phoneNumber && (
                    <span className="flex items-center gap-1 tabular-nums">
                      <Phone size={13} className="text-slate-400" />
                      {user?.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin text-blue-900' : ''} />
                <span>Cập nhật</span>
              </button>
              <Link
                to="/cars"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-slate-900 hover:bg-blue-900 text-white text-xs font-bold transition shadow-xs uppercase tracking-wider"
              >
                <Car size={13} />
                <span>Đặt thêm xe</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-x-auto w-full md:w-auto">
            {[
              { id: 'ALL', label: 'Tất cả đơn', count: requests.length },
              { id: 'ACTION_REQUIRED', label: 'Cần ký & Cọc', count: requests.filter(r => ['APPROVED', 'SIGNED'].includes(r.status)).length },
              { id: 'ACTIVE_GROUP', label: 'Đang lưu hành', count: requests.filter(r => ['CONFIRMED', 'ACTIVE'].includes(r.status)).length },
              { id: 'PENDING', label: 'Đang duyệt', count: requests.filter(r => r.status === 'PENDING').length },
              { id: 'COMPLETED', label: 'Đã hoàn tất', count: requests.filter(r => r.status === 'COMPLETED').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-zinc-950 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-bold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo xe, biển số hoặc mã..."
              className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 shadow-xs transition"
            />
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="velora-card p-6 animate-pulse space-y-4">
                <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center text-red-700">
            <p className="font-semibold text-xs mb-3">{error}</p>
            <button
              onClick={() => fetchMyRequests()}
              className="px-4 py-2 bg-red-700 text-white rounded-md text-xs font-semibold"
            >
              Thử lại
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-xs">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Car size={24} />
            </div>
            <h3 className="font-bold text-sm text-zinc-950 mb-1">Không tìm thấy đơn thuê nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              {searchTerm ? 'Không có đơn nào khớp với từ khóa tìm kiếm của bạn.' : 'Bạn chưa có yêu cầu thuê xe nào trong danh mục này.'}
            </p>
            <Link
              to="/cars"
              className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-md text-xs font-semibold transition"
            >
              Khám phá đội xe sẵn sàng
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const statusInfo = STATUS_CONFIG[req.status] || {
                label: req.status,
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                icon: AlertCircle
              };
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={req.id}
                  className="velora-card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Car & Booking info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Thumbnail */}
                    <div className="w-full sm:w-36 h-24 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                      <img
                        src={req.carImageUrl || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80'}
                        alt={req.carModel}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 left-1.5">
                        <span className="license-plate text-[9px] py-0.2">
                          {req.carLicensePlate || 'VELORA'}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-zinc-950 hover:text-blue-900 transition-colors">
                          {req.carMake} {req.carModel}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                          #{req.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1 tabular-nums">
                          <Calendar size={13} className="text-slate-400" />
                          {formatDateTime(req.startTime).slice(0, 16)} → {formatDateTime(req.endTime).slice(0, 16)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700 tabular-nums">
                          {req.totalDays} ngày
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-md">{req.pickupLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Financials & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    <div className="text-left lg:text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Tổng tiền thuê</div>
                      <div className="text-lg font-extrabold text-blue-900 tabular-nums">
                        {formatCurrency(req.estimatedTotalFee)}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums font-medium">
                        Cọc: {formatCurrency(req.depositAmount)}
                      </div>
                    </div>

                    {/* Badges & Triggers */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`px-2.5 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${statusInfo.badgeClass}`}>
                        <StatusIcon size={13} />
                        <span>{statusInfo.label}</span>
                      </div>

                      {/* APPROVED -> Sign Contract */}
                      {req.status === 'APPROVED' && (
                        <Link
                          to={`/contracts/sign/${req.id}`}
                          className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 uppercase tracking-wider"
                        >
                          <FileSignature size={13} />
                          <span>Ký hợp đồng</span>
                        </Link>
                      )}

                      {/* SIGNED -> Pay Deposit */}
                      {req.status === 'SIGNED' && (
                        <Link
                          to={`/payment/deposit/${req.id}`}
                          className="px-3.5 py-1.5 rounded-md bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 uppercase tracking-wider"
                        >
                          <CreditCard size={13} />
                          <span>Đặt cọc VietQR</span>
                        </Link>
                      )}

                      {/* CONFIRMED -> View receipt / Confirm handover */}
                      {req.status === 'CONFIRMED' && (
                        <>
                          <Link
                            to={`/payment/deposit/${req.id}`}
                            className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
                          >
                            <ShieldCheck size={13} className="text-blue-900" />
                            <span>Biên nhận cọc</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsHandoverConfirmOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                          >
                            <FileCheck size={13} />
                            <span>Xác nhận nhận xe</span>
                          </button>
                        </>
                      )}

                      {/* ACTIVE -> Extend or Incident */}
                      {req.status === 'ACTIVE' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsExtensionOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Calendar size={13} />
                            <span>Gia hạn</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsIncidentOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-md bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <AlertTriangle size={13} />
                            <span>Báo sự cố</span>
                          </button>
                        </>
                      )}

                      {/* COMPLETED -> View Settlement Receipt */}
                      {req.status === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsSettlementReceiptOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                        >
                          <Receipt size={13} />
                          <span>Phiếu quyết toán</span>
                        </button>
                      )}

                      {/* View Detail button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequest(req);
                          setIsDetailOpen(true);
                        }}
                        className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-zinc-950 transition cursor-pointer"
                        title="Xem chi tiết đơn"
                      >
                        <Eye size={15} />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* MODALS */}
      {selectedRequest && isDetailOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-lg w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
                Chi tiết yêu cầu #{selectedRequest.id.substring(0, 8)}
              </h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-zinc-950">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phương tiện:</span>
                <span className="font-bold text-zinc-950">{selectedRequest.carMake} {selectedRequest.carModel} ({selectedRequest.carLicensePlate})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Người đặt:</span>
                <span className="font-semibold text-zinc-950">{selectedRequest.customerName} - {selectedRequest.customerPhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">CCCD:</span>
                <span className="tabular-nums font-semibold">{selectedRequest.customerIdCard}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">GPLX:</span>
                <span className="tabular-nums font-semibold">{selectedRequest.driverLicenseNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Thời gian nhận:</span>
                <span className="tabular-nums">{formatDateTime(selectedRequest.startTime)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Thời gian trả:</span>
                <span className="tabular-nums">{formatDateTime(selectedRequest.endTime)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tổng tiền thuê:</span>
                <span className="font-bold text-blue-900 tabular-nums">{formatCurrency(selectedRequest.estimatedTotalFee)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Tiền đặt cọc:</span>
                <span className="font-bold text-zinc-950 tabular-nums">{formatCurrency(selectedRequest.depositAmount)}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRequest && (
        <>
          <CustomerHandoverModal
            isOpen={isHandoverConfirmOpen}
            onClose={() => setIsHandoverConfirmOpen(false)}
            rentalRequest={selectedRequest}
            onSuccess={() => {
              setIsHandoverConfirmOpen(false);
              fetchMyRequests(true);
            }}
          />

          <ExtensionModal
            isOpen={isExtensionOpen}
            onClose={() => setIsExtensionOpen(false)}
            rentalRequest={selectedRequest}
            onSuccess={() => {
              setIsExtensionOpen(false);
              fetchMyRequests(true);
            }}
          />

          <IncidentModal
            isOpen={isIncidentOpen}
            onClose={() => setIsIncidentOpen(false)}
            rentalRequest={selectedRequest}
            onSuccess={() => {
              setIsIncidentOpen(false);
              fetchMyRequests(true);
            }}
          />

          <CustomerSettlementReceiptModal
            isOpen={isSettlementReceiptOpen}
            onClose={() => setIsSettlementReceiptOpen(false)}
            rentalRequest={selectedRequest}
          />
        </>
      )}

    </div>
  );
};

export default ProfilePage;
