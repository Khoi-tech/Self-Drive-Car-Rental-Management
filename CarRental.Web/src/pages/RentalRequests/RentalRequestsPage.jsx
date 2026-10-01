import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Car, 
  User, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  ChevronRight,
  AlertTriangle,
  ZoomIn,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  FileCheck
} from 'lucide-react';
import rentalRequestService from '../../services/rentalRequestService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ duyệt', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: Clock },
  APPROVED: { label: 'Đã duyệt', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle2 },
  REJECTED: { label: 'Đã từ chối', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', icon: XCircle },
  CONFIRMED: { label: 'Đã xác nhận & cọc', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: FileCheck },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200', icon: XCircle },
};

const REJECT_PRESETS = [
  'Ảnh chụp CCCD bị mờ, mất góc hoặc lóa sáng, không đọc được số.',
  'Giấy phép lái xe (GPLX) không đủ điều kiện hoặc đã hết hạn sử dụng.',
  'Thông tin họ tên/số định danh không khớp với hình ảnh giấy tờ đính kèm.',
  'Ảnh giấy tờ là bản photocopy hoặc có dấu hiệu chỉnh sửa kỹ thuật số.',
  'Xe hiện đã kín lịch trong khung giờ khách hàng yêu cầu.'
];

const RentalRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected for Details / Inspection Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Reject Action State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Lightbox Zoom Image Modal
  const [zoomedImage, setZoomedImage] = useState(null);

  // Fetch data
  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await rentalRequestService.getAllRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách đơn thuê xe. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Filter requests
  const filteredRequests = requests.filter(item => {
    const matchTab = activeTab === 'ALL' || item.status === activeTab;
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
      item.customerName?.toLowerCase().includes(searchLower) ||
      item.customerPhone?.toLowerCase().includes(searchLower) ||
      item.carLicensePlate?.toLowerCase().includes(searchLower) ||
      item.carModel?.toLowerCase().includes(searchLower) ||
      item.id?.toLowerCase().includes(searchLower);
    return matchTab && matchSearch;
  });

  // Stats count
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  // Handle Approve
  const handleApprove = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn PHÊ DUYỆT hồ sơ này không? Sau khi duyệt, khách hàng sẽ có thể tiến hành ký hợp đồng và thanh toán tiền cọc.')) {
      return;
    }

    try {
      setActionLoading(true);
      await rentalRequestService.approveRequest(id);
      setSuccessMsg('Hồ sơ đã được phê duyệt thành công!');
      setTimeout(() => setSuccessMsg(null), 4000);
      
      // Update local state
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED', updatedAt: new Date().toISOString() } : r));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(prev => ({ ...prev, status: 'APPROVED', updatedAt: new Date().toISOString() }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt hồ sơ.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reject Modal
  const openRejectDialog = (id) => {
    setRejectingId(id);
    setRejectReason(REJECT_PRESETS[0]);
    setIsRejectModalOpen(true);
  };

  // Submit Reject
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối hồ sơ.');
      return;
    }

    try {
      setActionLoading(true);
      await rentalRequestService.rejectRequest(rejectingId, rejectReason);
      setSuccessMsg('Đã từ chối đơn thuê xe thành công.');
      setTimeout(() => setSuccessMsg(null), 4000);

      setRequests(prev => prev.map(r => r.id === rejectingId ? { 
        ...r, 
        status: 'REJECTED', 
        rejectReason: rejectReason.trim(),
        updatedAt: new Date().toISOString() 
      } : r));

      if (selectedRequest && selectedRequest.id === rejectingId) {
        setSelectedRequest(prev => ({ 
          ...prev, 
          status: 'REJECTED', 
          rejectReason: rejectReason.trim(),
          updatedAt: new Date().toISOString() 
        }));
      }

      setIsRejectModalOpen(false);
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối hồ sơ.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            Quản Lý Đơn Thuê & Duyệt Hồ Sơ
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 text-white font-mono">
              Sprint 3 - US-16
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kiểm duyệt hồ sơ định danh (CCCD, GPLX), xét duyệt yêu cầu thuê xe và cấp phép bước hợp đồng
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition shadow-sm self-start"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-rose-600" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">Tất cả đơn</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{requests.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-amber-50/50 to-white">
          <div>
            <p className="text-xs text-amber-700 uppercase font-semibold">Chờ duyệt hồ sơ</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-emerald-50/50 to-white">
          <div>
            <p className="text-xs text-emerald-700 uppercase font-semibold">Đã phê duyệt</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-rose-50/50 to-white">
          <div>
            <p className="text-xs text-rose-700 uppercase font-semibold">Đã từ chối</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{rejectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 w-full md:w-auto overflow-x-auto">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'PENDING', label: `Chờ duyệt (${pendingCount})` },
              { key: 'APPROVED', label: `Đã duyệt (${approvedCount})` },
              { key: 'REJECTED', label: `Từ chối (${rejectedCount})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm khách hàng, SĐT, biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3">Mã đơn / Ngày tạo</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Xe thuê</th>
                <th className="px-4 py-3">Lịch thuê</th>
                <th className="px-4 py-3 text-right">Tổng tiền / Tiền cọc</th>
                <th className="px-4 py-3 text-center">Hồ sơ ảnh</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-zinc-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Đang tải danh sách đơn thuê...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-zinc-400">
                    <FileText size={36} className="mx-auto mb-2 text-zinc-300" />
                    <p className="font-medium text-zinc-600">Không tìm thấy đơn thuê nào</p>
                    <p className="text-xs text-zinc-400 mt-1">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const statusInfo = STATUS_CONFIG[req.status] || {
                    label: req.status,
                    bg: 'bg-zinc-100',
                    text: 'text-zinc-600',
                    border: 'border-zinc-200',
                    icon: Clock
                  };
                  const StatusIcon = statusInfo.icon;

                  const hasPhotos = req.idCardFrontUrl || req.idCardBackUrl || req.driverLicenseFrontUrl || req.driverLicenseBackUrl;

                  return (
                    <tr key={req.id} className="hover:bg-zinc-50/80 transition group">
                      {/* Code & Created */}
                      <td className="px-4 py-3 font-mono text-xs">
                        <span className="font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          {req.id.substring(0, 8).toUpperCase()}
                        </span>
                        <div className="text-[11px] text-zinc-400 mt-1">
                          {formatDateTime(req.createdAt)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{req.customerName}</div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-zinc-400" />
                          {req.customerPhone}
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-zinc-400" />
                          <span className="truncate max-w-[140px]">{req.customerEmail}</span>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {req.carImageUrl ? (
                            <img 
                              src={req.carImageUrl} 
                              alt={req.carModel} 
                              className="w-12 h-9 object-cover rounded border border-zinc-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 bg-zinc-100 rounded flex items-center justify-center text-zinc-400 flex-shrink-0">
                              <Car size={16} />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-zinc-900">{req.carMake} {req.carModel}</div>
                            <div className="text-xs text-zinc-500 font-mono">
                              Biển số: {req.carLicensePlate || 'Chưa gán'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="px-4 py-3 text-xs">
                        <div className="text-zinc-900 font-medium">
                          {req.totalDays} ngày thuê
                        </div>
                        <div className="text-zinc-500 mt-0.5">
                          {new Date(req.startTime).toLocaleDateString('vi-VN')} - {new Date(req.endTime).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[160px]">
                          {req.pickupLocation}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-zinc-900">
                          {formatCurrency(req.estimatedTotalFee)}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          Cọc: <span className="font-mono text-zinc-700">{formatCurrency(req.depositAmount)}</span>
                        </div>
                      </td>

                      {/* Photos Preview */}
                      <td className="px-4 py-3 text-center">
                        {hasPhotos ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 text-zinc-700 text-xs font-medium">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            <span>Đủ 4 ảnh</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Thiếu ảnh</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                        {req.status === 'REJECTED' && req.rejectReason && (
                          <p className="text-[11px] text-rose-600 mt-1 max-w-[130px] truncate mx-auto" title={req.rejectReason}>
                            {req.rejectReason}
                          </p>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detail & Inspection */}
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                            title="Soi hồ sơ định danh chi tiết"
                          >
                            <Eye size={18} />
                          </button>

                          {/* Quick Actions if PENDING */}
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={actionLoading}
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                title="Phê duyệt nhanh"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button
                                onClick={() => openRejectDialog(req.id)}
                                disabled={actionLoading}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                title="Từ chối yêu cầu"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}

                          {/* Link to Contract if APPROVED or CONFIRMED */}
                          {(req.status === 'APPROVED' || req.status === 'CONFIRMED') && (
                            <Link
                              to={`/contracts/sign/${req.id}`}
                              target="_blank"
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="Xem hợp đồng điện tử"
                            >
                              <FileText size={18} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: SOI HỒ SƠ & DUYỆT CHI TIẾT ================= */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">Thẩm Định Hồ Sơ Thuê Xe</h2>
                    <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                      MÃ: {selectedRequest.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Kiểm tra đối chiếu thông tin cá nhân và 4 ảnh giấy tờ định danh (CCCD & GPLX)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(() => {
                  const s = STATUS_CONFIG[selectedRequest.status] || STATUS_CONFIG.PENDING;
                  return (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  );
                })()}
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Rejected Alert Box if status is REJECTED */}
              {selectedRequest.status === 'REJECTED' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-900">Hồ sơ đã bị từ chối phê duyệt</h4>
                    <p className="text-sm text-rose-700 mt-1">
                      <span className="font-semibold">Lý do:</span> {selectedRequest.rejectReason || 'Không có lý do chi tiết'}
                    </p>
                  </div>
                </div>
              )}

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Customer & Rental Summary */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Customer Information Card */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} /> Thông tin khách hàng
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Họ và tên:</span>
                        <span className="font-semibold text-zinc-900">{selectedRequest.customerName}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Số điện thoại:</span>
                        <span className="font-medium text-zinc-900">{selectedRequest.customerPhone}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Email:</span>
                        <span className="text-zinc-900 break-all">{selectedRequest.customerEmail}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Số CCCD / CMND:</span>
                        <span className="font-mono font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {selectedRequest.customerIdCard || 'Chưa cung cấp'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Số GPLX (B2):</span>
                        <span className="font-mono font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {selectedRequest.driverLicenseNumber || 'Chưa cung cấp'}
                        </span>
                      </div>
                      {selectedRequest.notes && (
                        <div className="pt-1 text-xs">
                          <span className="text-zinc-500">Ghi chú từ khách:</span>
                          <p className="mt-1 p-2 bg-white rounded border border-zinc-200 text-zinc-700 italic">
                            "{selectedRequest.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle & Rent Schedule */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Car size={14} /> Thông tin xe & Lịch thuê
                    </h3>

                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-zinc-200">
                      {selectedRequest.carImageUrl ? (
                        <img 
                          src={selectedRequest.carImageUrl} 
                          alt={selectedRequest.carModel} 
                          className="w-16 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                          <Car size={20} />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-zinc-900">{selectedRequest.carMake} {selectedRequest.carModel}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">
                          Biển số: {selectedRequest.carLicensePlate || 'Chưa gắn'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Thời gian nhận xe:</span>
                        <span className="font-medium text-zinc-900">{formatDateTime(selectedRequest.startTime)}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Thời gian trả xe:</span>
                        <span className="font-medium text-zinc-900">{formatDateTime(selectedRequest.endTime)}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Tổng số ngày:</span>
                        <span className="font-bold text-zinc-900">{selectedRequest.totalDays} ngày</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Điểm nhận/trả xe:</span>
                        <span className="text-zinc-900 text-right truncate max-w-[200px]">{selectedRequest.pickupLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-zinc-900 text-white rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={14} className="text-amber-400" /> Chi phí & Tiền cọc
                    </h3>

                    <div className="space-y-1.5 text-xs text-zinc-300">
                      <div className="flex justify-between">
                        <span>Đơn giá ngày:</span>
                        <span>{formatCurrency(selectedRequest.dailyRate)}</span>
                      </div>
                      {selectedRequest.discountPercent > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Chiết khấu ({selectedRequest.discountPercent}%):</span>
                          <span>- Giảm trừ</span>
                        </div>
                      )}
                      {selectedRequest.holidaySurchargePercent > 0 && (
                        <div className="flex justify-between text-amber-400">
                          <span>Phụ phí lễ tết ({selectedRequest.holidaySurchargePercent}%):</span>
                          <span>+ Phụ thu</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-bold text-white">
                        <span>Dự tính tổng tiền thuê:</span>
                        <span className="text-emerald-400">{formatCurrency(selectedRequest.estimatedTotalFee)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-amber-300 pt-1">
                        <span>Tiền đặt cọc xe (Deposit):</span>
                        <span>{formatCurrency(selectedRequest.depositAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: 4-Photo Inspection Grid */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-amber-500" />
                      Bộ 4 Ảnh Hồ Sơ Định Danh Khách Hàng
                    </h3>
                    <span className="text-xs text-zinc-400 italic">Nhấp vào ảnh để phóng to</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* CCCD Mặt trước */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-zinc-700">
                        <span>1. CCCD / CMND (Mặt trước)</span>
                        <span className="text-[10px] text-zinc-400 font-mono">CCCD_FRONT</span>
                      </div>
                      <div 
                        onClick={() => selectedRequest.idCardFrontUrl && setZoomedImage({ url: selectedRequest.idCardFrontUrl, title: 'CCCD / CMND (Mặt trước)' })}
                        className="group relative h-48 bg-zinc-200 rounded-lg overflow-hidden border border-zinc-300 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition"
                      >
                        {selectedRequest.idCardFrontUrl ? (
                          <>
                            <img 
                              src={selectedRequest.idCardFrontUrl} 
                              alt="CCCD Mặt trước" 
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-2 transition">
                              <ZoomIn size={20} />
                              <span className="text-xs font-medium">Phóng to</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 text-zinc-400 text-xs">
                            <FileText size={28} className="mx-auto mb-1 opacity-50" />
                            Chưa có ảnh CCCD mặt trước
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CCCD Mặt sau */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-zinc-700">
                        <span>2. CCCD / CMND (Mặt sau)</span>
                        <span className="text-[10px] text-zinc-400 font-mono">CCCD_BACK</span>
                      </div>
                      <div 
                        onClick={() => selectedRequest.idCardBackUrl && setZoomedImage({ url: selectedRequest.idCardBackUrl, title: 'CCCD / CMND (Mặt sau)' })}
                        className="group relative h-48 bg-zinc-200 rounded-lg overflow-hidden border border-zinc-300 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition"
                      >
                        {selectedRequest.idCardBackUrl ? (
                          <>
                            <img 
                              src={selectedRequest.idCardBackUrl} 
                              alt="CCCD Mặt sau" 
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-2 transition">
                              <ZoomIn size={20} />
                              <span className="text-xs font-medium">Phóng to</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 text-zinc-400 text-xs">
                            <FileText size={28} className="mx-auto mb-1 opacity-50" />
                            Chưa có ảnh CCCD mặt sau
                          </div>
                        )}
                      </div>
                    </div>

                    {/* GPLX Mặt trước */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-zinc-700">
                        <span>3. Giấy phép lái xe (Mặt trước)</span>
                        <span className="text-[10px] text-zinc-400 font-mono">GPLX_FRONT</span>
                      </div>
                      <div 
                        onClick={() => selectedRequest.driverLicenseFrontUrl && setZoomedImage({ url: selectedRequest.driverLicenseFrontUrl, title: 'GPLX (Mặt trước)' })}
                        className="group relative h-48 bg-zinc-200 rounded-lg overflow-hidden border border-zinc-300 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition"
                      >
                        {selectedRequest.driverLicenseFrontUrl ? (
                          <>
                            <img 
                              src={selectedRequest.driverLicenseFrontUrl} 
                              alt="GPLX Mặt trước" 
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-2 transition">
                              <ZoomIn size={20} />
                              <span className="text-xs font-medium">Phóng to</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 text-zinc-400 text-xs">
                            <FileText size={28} className="mx-auto mb-1 opacity-50" />
                            Chưa có ảnh GPLX mặt trước
                          </div>
                        )}
                      </div>
                    </div>

                    {/* GPLX Mặt sau */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-zinc-700">
                        <span>4. Giấy phép lái xe (Mặt sau)</span>
                        <span className="text-[10px] text-zinc-400 font-mono">GPLX_BACK</span>
                      </div>
                      <div 
                        onClick={() => selectedRequest.driverLicenseBackUrl && setZoomedImage({ url: selectedRequest.driverLicenseBackUrl, title: 'GPLX (Mặt sau)' })}
                        className="group relative h-48 bg-zinc-200 rounded-lg overflow-hidden border border-zinc-300 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition"
                      >
                        {selectedRequest.driverLicenseBackUrl ? (
                          <>
                            <img 
                              src={selectedRequest.driverLicenseBackUrl} 
                              alt="GPLX Mặt sau" 
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-2 transition">
                              <ZoomIn size={20} />
                              <span className="text-xs font-medium">Phóng to</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 text-zinc-400 text-xs">
                            <FileText size={28} className="mx-auto mb-1 opacity-50" />
                            Chưa có ảnh GPLX mặt sau
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Review Guideline Checklist */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
                    <h5 className="font-semibold flex items-center gap-1.5 mb-1.5">
                      <ShieldCheck size={15} className="text-blue-600" /> Tiêu chuẩn kiểm duyệt bắt buộc:
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-blue-800">
                      <li>Họ tên trên CCCD và GPLX phải trùng khớp với tên người gửi yêu cầu.</li>
                      <li>Số CCCD ({selectedRequest.customerIdCard}) và GPLX ({selectedRequest.driverLicenseNumber}) phải đọc được rõ ràng, không bị che khuất.</li>
                      <li>Hạng bằng lái tối thiểu B2 (được phép điều khiển xe ô tô dưới 9 chỗ ngồi).</li>
                      <li>Không chấp nhận ảnh chụp qua màn hình, ảnh scan đen trắng hoặc ảnh cắt ghép.</li>
                    </ul>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-100 transition"
              >
                Đóng
              </button>

              <div className="flex items-center gap-3">
                {selectedRequest.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => openRejectDialog(selectedRequest.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-sm font-semibold hover:bg-rose-100 transition flex items-center gap-1.5"
                    >
                      <XCircle size={16} />
                      Từ chối hồ sơ
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={16} />
                      Phê duyệt hồ sơ
                    </button>
                  </>
                ) : (selectedRequest.status === 'APPROVED' || selectedRequest.status === 'CONFIRMED') ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-emerald-700 font-medium">Hồ sơ đã hợp lệ</span>
                    <Link
                      to={`/contracts/sign/${selectedRequest.id}`}
                      target="_blank"
                      className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText size={16} />
                      Xem hợp đồng điện tử
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: TỪ CHỐI HỒ SƠ ================= */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 text-rose-600">
                <XCircle size={22} />
                Lý Do Từ Chối Hồ Sơ
              </h3>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Lý do này sẽ được gửi thông báo cho khách hàng để họ cập nhật lại thông tin hoặc chụp lại ảnh giấy tờ định danh.
            </p>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Mẫu lý do thường gặp:</label>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {REJECT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className={`text-left text-xs p-2 rounded border transition ${
                      rejectReason === preset 
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">Nội dung lý do cụ thể:</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do chi tiết từ chối..."
                className="w-full p-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX: PHÓNG TO ẢNH ================= */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex justify-between items-center text-white mb-2 px-2">
              <h4 className="font-semibold text-sm">{zoomedImage.title}</h4>
              <button 
                onClick={() => setZoomedImage(null)} 
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            <img 
              src={zoomedImage.url} 
              alt={zoomedImage.title} 
              className="max-w-full max-h-[82vh] object-contain rounded-lg border border-zinc-700 shadow-2xl" 
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default RentalRequestsPage;
