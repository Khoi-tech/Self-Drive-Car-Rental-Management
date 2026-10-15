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
  FileText,
  Phone
} from 'lucide-react';
import extensionService from '../../services/extensionService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ duyệt', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
  APPROVED: { label: 'Đã duyệt gia hạn', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  REJECTED: { label: 'Đã từ chối', bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle }
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Calendar size={20} />
            </div>
            Quản Lý Gia Hạn Thuê Xe (US-20)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xét duyệt yêu cầu kéo dài thời gian thuê của khách hàng, kiểm tra tự động chống kẹt lịch xe tiếp theo
          </p>
        </div>

        <button
          onClick={fetchExtensions}
          disabled={loading}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition flex items-center gap-2 text-xs font-medium shadow-sm self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center justify-between text-xs font-medium">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Tổng yêu cầu</p>
            <p className="text-2xl font-bold text-zinc-950 mt-1 tabular-nums">{extensions.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 uppercase font-semibold">Chờ xét duyệt</p>
            <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 uppercase font-semibold">Đã phê duyệt</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-700 uppercase font-semibold">Cảnh báo kẹt lịch</p>
            <p className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">{conflictCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex border-b border-slate-200 w-full md:w-auto overflow-x-auto">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'PENDING', label: `Chờ duyệt (${pendingCount})` },
              { key: 'APPROVED', label: `Đã duyệt (${approvedCount})` },
              { key: 'REJECTED', label: `Từ chối (${rejectedCount})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-[#0F172A] text-zinc-950'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Tìm khách hàng, SĐT, biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-md text-xs text-zinc-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
            />
          </div>
        </div>

        {/* Extensions Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Xe thuê</th>
                <th className="px-4 py-3.5">Lịch trả cũ → Mới</th>
                <th className="px-4 py-3.5 text-center">Gia hạn thêm</th>
                <th className="px-4 py-3.5 text-right">Phụ phí phát sinh</th>
                <th className="px-4 py-3.5">Lý do khách đưa ra</th>
                <th className="px-4 py-3.5 text-center">Trạng thái / Trùng lịch</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-[#0F172A]" />
                      <span>Đang tải danh sách yêu cầu gia hạn...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredExtensions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Chưa có yêu cầu gia hạn nào</p>
                  </td>
                </tr>
              ) : (
                filteredExtensions.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                      
                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-zinc-950">{item.customerName}</div>
                        <div className="text-[11px] text-slate-500 tabular-nums flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-slate-400" />
                          {item.customerPhone}
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-950">{item.carMake} {item.carModel}</div>
                        <div className="mt-1">
                          <span className="license-plate text-[10px] px-2 py-0.5">
                            {item.carLicensePlate}
                          </span>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-4 py-3.5 text-xs">
                        <div className="text-slate-400 line-through tabular-nums text-[11px]">
                          {formatDateTime(item.oldEndTime).slice(0, 16)}
                        </div>
                        <div className="font-semibold text-blue-700 flex items-center gap-1 mt-0.5 tabular-nums">
                          <ArrowRight size={12} />
                          <span>{formatDateTime(item.newEndTime).slice(0, 16)}</span>
                        </div>
                      </td>

                      {/* Extended Duration */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[11px] border border-blue-200 tabular-nums">
                          +{item.extendedDays} ngày
                        </span>
                      </td>

                      {/* Additional Fee */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-bold text-zinc-950 tabular-nums">
                          {formatCurrency(item.additionalFee)}
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          {formatCurrency(item.dailyRate)}/ngày
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3.5 text-xs max-w-[200px]">
                        <p className="truncate text-slate-700" title={item.reason}>
                          "{item.reason}"
                        </p>
                        {item.staffNotes && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate" title={item.staffNotes}>
                            Staff: {item.staffNotes}
                          </p>
                        )}
                      </td>

                      {/* Status & Conflict Alert */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusInfo.bg}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>

                        {item.status === 'PENDING' && item.hasScheduleConflict && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle size={11} />
                            <span>Kẹt lịch khách sau!</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        {item.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAction(item, 'APPROVE')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                              title="Phê duyệt gia hạn"
                            >
                              <CheckCircle2 size={13} />
                              <span>Duyệt</span>
                            </button>
                            <button
                              onClick={() => handleOpenAction(item, 'REJECT')}
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-md text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                              title="Từ chối yêu cầu"
                            >
                              <XCircle size={13} />
                              <span>Từ chối</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Đã xử lý</span>
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${actionType === 'APPROVE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {actionType === 'APPROVE' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <span>{actionType === 'APPROVE' ? 'Xác Nhận Duyệt Gia Hạn' : 'Từ Chối Yêu Cầu Gia Hạn'}</span>
              </h3>
              <button onClick={() => setSelectedExt(null)} className="text-slate-400 hover:text-zinc-950 p-1 rounded-md transition">
                <X size={18} />
              </button>
            </div>

            {selectedExt.hasScheduleConflict && actionType === 'APPROVE' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle size={14} className="text-rose-600" />
                  <span>CẢNH BÁO TRÙNG LỊCH:</span>
                </div>
                <p>Xe này đã có đơn đặt sau khung giờ hiện tại. Nếu phê duyệt, đơn đặt sau sẽ bị ảnh hưởng!</p>
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200">
              <div>Khách hàng: <strong className="text-zinc-950">{selectedExt.customerName}</strong> ({selectedExt.customerPhone})</div>
              <div>Xe: <strong className="text-zinc-950">{selectedExt.carMake} {selectedExt.carModel}</strong> ({selectedExt.carLicensePlate})</div>
              <div>Thời gian trả mới: <strong className="text-zinc-950 tabular-nums">{formatDateTime(selectedExt.newEndTime)}</strong> (+{selectedExt.extendedDays} ngày)</div>
              <div>Phụ phí tăng thêm: <strong className="text-emerald-700 font-mono font-bold text-sm tabular-nums">{formatCurrency(selectedExt.additionalFee)}</strong></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {actionType === 'APPROVE' ? 'Ghi chú phê duyệt của nhân viên:' : 'Lý do từ chối gửi cho khách:'}
              </label>
              <textarea
                rows="3"
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-md text-xs text-zinc-950 focus:outline-none focus:border-[#0F172A]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedExt(null)}
                className="px-4 py-2 border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                className={`px-5 py-2 text-white rounded-md text-xs font-semibold transition shadow-sm ${
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
