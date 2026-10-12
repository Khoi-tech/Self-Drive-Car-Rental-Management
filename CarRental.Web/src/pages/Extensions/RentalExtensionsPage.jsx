import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Car, 
  User, 
  DollarSign, 
  X,
  ArrowRight,
  ShieldAlert,
  FileText
} from 'lucide-react';
import extensionService from '../../services/extensionService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ duyệt', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  APPROVED: { label: 'Đã duyệt gia hạn', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  REJECTED: { label: 'Đã từ chối', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle }
};

const RentalExtensionsPage = () => {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Approve / Reject Action States
  const [selectedExt, setSelectedExt] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
  const [staffNotes, setStaffNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await extensionService.getAll();
      setExtensions(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách yêu cầu gia hạn thuê xe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const filteredExtensions = extensions.filter(item => {
    const matchTab = activeTab === 'ALL' || item.status === activeTab;
    const s = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      item.customerName?.toLowerCase().includes(s) ||
      item.customerPhone?.toLowerCase().includes(s) ||
      item.carLicensePlate?.toLowerCase().includes(s) ||
      item.carModel?.toLowerCase().includes(s) ||
      item.rentalRequestId?.toLowerCase().includes(s);
    return matchTab && matchSearch;
  });

  const pendingCount = extensions.filter(e => e.status === 'PENDING').length;
  const approvedCount = extensions.filter(e => e.status === 'APPROVED').length;
  const rejectedCount = extensions.filter(e => e.status === 'REJECTED').length;
  const conflictCount = extensions.filter(e => e.status === 'PENDING' && e.hasScheduleConflict).length;

  const handleOpenAction = (item, type) => {
    setSelectedExt(item);
    setActionType(type);
    setStaffNotes(type === 'APPROVE' 
      ? 'Đã kiểm tra lịch xe sẵn sàng, đồng ý gia hạn.' 
      : (item.hasScheduleConflict 
          ? 'Rất tiếc xe đã có khách hàng khác đặt trước trong khung giờ này, vui lòng trả xe đúng hẹn.' 
          : 'Không thể gia hạn theo thời gian yêu cầu.'));
  };

  const handleConfirmAction = async () => {
    if (!selectedExt || !actionType) return;
    try {
      setActionLoading(true);
      if (actionType === 'APPROVE') {
        await extensionService.approve(selectedExt.id, {
          staffName: 'Trần Văn Hưng (Staff VELORA)',
          staffNotes: staffNotes.trim()
        });
        alert('Đã phê duyệt gia hạn đơn thuê thành công!');
      } else {
        await extensionService.reject(selectedExt.id, {
          staffName: 'Trần Văn Hưng (Staff VELORA)',
          staffNotes: staffNotes.trim()
        });
        alert('Đã từ chối yêu cầu gia hạn.');
      }
      setSelectedExt(null);
      setActionType(null);
      fetchExtensions();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý yêu cầu gia hạn.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            Quản Lý Gia Hạn Thuê Xe (US-20)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-900 text-white font-mono">
              Sprint 4
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Xét duyệt yêu cầu kéo dài thời gian thuê của khách hàng, kiểm tra tự động chống kẹt lịch xe tiếp theo
          </p>
        </div>

        <button
          onClick={fetchExtensions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition shadow-sm self-start"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

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
            <p className="text-xs text-zinc-500 uppercase font-semibold">Tổng yêu cầu</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{extensions.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-amber-50/50 to-white">
          <div>
            <p className="text-xs text-amber-700 uppercase font-semibold">Chờ xét duyệt</p>
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
            <p className="text-xs text-rose-700 uppercase font-semibold">Cảnh báo kẹt lịch</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{conflictCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex border-b border-zinc-200 w-full md:w-auto overflow-x-auto">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'PENDING', label: `Chờ duyệt (${pendingCount})` },
              { key: 'APPROVED', label: `Đã duyệt (${approvedCount})` },
              { key: 'REJECTED', label: `Từ chối (${rejectedCount})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-purple-600 text-purple-600 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm khách hàng, SĐT, biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
            />
          </div>
        </div>

        {/* Extensions Table */}
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Xe thuê</th>
                <th className="px-4 py-3">Lịch trả cũ → Mới</th>
                <th className="px-4 py-3 text-center">Gia hạn thêm</th>
                <th className="px-4 py-3 text-right">Phụ phí phát sinh</th>
                <th className="px-4 py-3">Lý do khách đưa ra</th>
                <th className="px-4 py-3 text-center">Trạng thái / Trùng lịch</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-zinc-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Đang tải danh sách yêu cầu gia hạn...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredExtensions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-zinc-400">
                    <FileText size={36} className="mx-auto mb-2 text-zinc-300" />
                    <p className="font-medium text-zinc-600">Chưa có yêu cầu gia hạn nào</p>
                  </td>
                </tr>
              ) : (
                filteredExtensions.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition group">
                      
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{item.customerName}</div>
                        <div className="text-xs text-zinc-500">{item.customerPhone}</div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{item.carMake} {item.carModel}</div>
                        <div className="text-xs font-mono text-zinc-500">{item.carLicensePlate}</div>
                      </td>

                      {/* Timeline */}
                      <td className="px-4 py-3 text-xs">
                        <div className="text-zinc-500 line-through">
                          {formatDateTime(item.oldEndTime).slice(0, 16)}
                        </div>
                        <div className="font-bold text-purple-700 flex items-center gap-1 mt-0.5">
                          <ArrowRight size={12} />
                          <span>{formatDateTime(item.newEndTime).slice(0, 16)}</span>
                        </div>
                      </td>

                      {/* Extended Duration */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
                          +{item.extendedDays} ngày
                        </span>
                      </td>

                      {/* Additional Fee */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-zinc-900">
                          {formatCurrency(item.additionalFee)}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {formatCurrency(item.dailyRate)}/ngày
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3 text-xs max-w-[200px]">
                        <p className="truncate text-zinc-700" title={item.reason}>
                          "{item.reason}"
                        </p>
                        {item.staffNotes && (
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate" title={item.staffNotes}>
                            Staff: {item.staffNotes}
                          </p>
                        )}
                      </td>

                      {/* Status & Conflict Alert */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bg}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>

                        {item.status === 'PENDING' && item.hasScheduleConflict && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 animate-pulse">
                            <AlertTriangle size={12} />
                            <span>Kẹt lịch khách sau!</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {item.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAction(item, 'APPROVE')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                              title="Phê duyệt gia hạn"
                            >
                              <CheckCircle2 size={14} />
                              <span>Duyệt</span>
                            </button>
                            <button
                              onClick={() => handleOpenAction(item, 'REJECT')}
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              title="Từ chối yêu cầu"
                            >
                              <XCircle size={14} />
                              <span>Từ chối</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Đã xử lý</span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Duyệt / Từ chối gia hạn */}
      {selectedExt && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className={`text-base font-bold flex items-center gap-2 ${actionType === 'APPROVE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {actionType === 'APPROVE' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <span>{actionType === 'APPROVE' ? 'Xác Nhận Duyệt Gia Hạn' : 'Từ Chối Yêu Cầu Gia Hạn'}</span>
              </h3>
              <button onClick={() => setSelectedExt(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            {selectedExt.hasScheduleConflict && actionType === 'APPROVE' && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle size={14} />
                  <span>CẢNH BÁO TRÙNG LỊCH:</span>
                </div>
                <p>Xe này đã có đơn đặt sau khung giờ hiện tại. Nếu phê duyệt, đơn đặt sau sẽ bị ảnh hưởng!</p>
              </div>
            )}

            <div className="space-y-2 text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border">
              <div>Khách hàng: <strong>{selectedExt.customerName}</strong> ({selectedExt.customerPhone})</div>
              <div>Xe: <strong>{selectedExt.carMake} {selectedExt.carModel}</strong> ({selectedExt.carLicensePlate})</div>
              <div>Thời gian trả mới: <strong>{formatDateTime(selectedExt.newEndTime)}</strong> (+{selectedExt.extendedDays} ngày)</div>
              <div>Phụ phí tăng thêm: <strong className="text-purple-700 font-mono text-sm">{formatCurrency(selectedExt.additionalFee)}</strong></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                {actionType === 'APPROVE' ? 'Ghi chú phê duyệt của nhân viên:' : 'Lý do từ chối gửi cho khách:'}
              </label>
              <textarea
                rows="3"
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full p-2.5 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedExt(null)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                className={`px-5 py-2 text-white rounded-lg text-xs font-bold transition shadow-sm ${
                  actionType === 'APPROVE' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Đang xử lý...' : (actionType === 'APPROVE' ? 'Xác nhận duyệt' : 'Xác nhận từ chối')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RentalExtensionsPage;
