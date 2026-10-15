import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Wrench, 
  PhoneCall, 
  Car, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  MapPin, 
  FileText, 
  DollarSign, 
  User, 
  ArrowRight, 
  Image, 
  X,
  ShieldCheck,
  Truck
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import vehicleService from '../../services/vehicleService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const SEVERITY_CONFIG = {
  LOW: { label: 'Nhẹ', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  MEDIUM: { label: 'Trung bình', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  HIGH: { label: 'Nghiêm trọng', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
};

const INCIDENT_TYPE_MAP = {
  COLLISION: 'Va quẹt / Tai nạn',
  BREAKDOWN: 'Chết máy / Hỏng động cơ',
  FLAT_TIRE: 'Nổ lốp / Thủng lốp',
  FLOOD: 'Thủy kích / Ngập nước',
  OTHER: 'Sự cố khác'
};

const STATUS_CONFIG = {
  REPORTED: { label: 'Mới báo cáo', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertTriangle },
  INVESTIGATING: { label: 'Đang điều phối', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  RESOLVED: { label: 'Đã giải quyết', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200', icon: X }
};

const ACTION_MAP = {
  RESCUE_TOW: 'Điều cứu hộ kéo xe về gara',
  REPAIR_ON_SITE: 'Sửa chữa lưu động tại chỗ',
  REPLACE_CAR: 'Đổi xe thay thế cho khách',
  NONE: 'Khách tự khắc phục / Khác'
};

const INSURANCE_STATUS_MAP = {
  PENDING_CLAIM: 'Đang chờ thẩm định bảo hiểm',
  COVERED: 'Bảo hiểm chi trả toàn phần',
  REJECTED: 'Bảo hiểm từ chối bồi thường',
  NOT_APPLICABLE: 'Không áp dụng bảo hiểm'
};

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // View / Resolve Modal states
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);

  // Resolve Form State
  const [resolveForm, setResolveForm] = useState({
    resolutionAction: 'RESCUE_TOW',
    replacementCarId: '',
    estimatedDamageCost: 0,
    insuranceCoverageStatus: 'PENDING_CLAIM',
    customerPayAmount: 0,
    companyPayAmount: 0,
    staffNotes: '',
    staffName: 'Trần Văn Hưng (Kỹ thuật VELORA)',
    vehicleStatusAfterIncident: 'REPAIR'
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await incidentService.getAll();
      setIncidents(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách sự cố khẩn cấp.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVehicles = async () => {
    try {
      const res = await vehicleService.getAllVehicles('', 'READY');
      setAvailableVehicles(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      console.error('Lỗi lấy danh sách xe thay thế:', err);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchAvailableVehicles();
  }, []);

  const filteredIncidents = incidents.filter(item => {
    const matchTab = activeTab === 'ALL' || item.status === activeTab;
    const s = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      item.incidentCode?.toLowerCase().includes(s) ||
      item.customerName?.toLowerCase().includes(s) ||
      item.customerPhone?.toLowerCase().includes(s) ||
      item.carLicensePlate?.toLowerCase().includes(s) ||
      item.carModel?.toLowerCase().includes(s) ||
      item.location?.toLowerCase().includes(s);
    return matchTab && matchSearch;
  });

  const reportedCount = incidents.filter(i => i.status === 'REPORTED').length;
  const investigatingCount = incidents.filter(i => i.status === 'INVESTIGATING').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;
  const highSeverityCount = incidents.filter(i => i.severity === 'HIGH' && i.status !== 'RESOLVED').length;

  const handleStartInvestigating = async (incident) => {
    try {
      setActionLoading(true);
      await incidentService.updateStatus(incident.id, {
        status: 'INVESTIGATING',
        staffNotes: 'Nhân viên đã tiếp nhận thông tin và đang liên hệ cứu hộ khẩn cấp.',
        staffName: 'Trần Văn Hưng (Kỹ thuật VELORA)'
      });
      alert('Đã tiếp nhận xử lý ca sự cố!');
      fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật trạng thái.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenResolveModal = (incident) => {
    setSelectedIncident(incident);
    setResolveForm({
      resolutionAction: incident.resolutionAction || (incident.severity === 'HIGH' ? 'RESCUE_TOW' : 'REPAIR_ON_SITE'),
      replacementCarId: incident.replacementCarId || '',
      estimatedDamageCost: incident.estimatedDamageCost || 0,
      insuranceCoverageStatus: incident.insuranceCoverageStatus || 'PENDING_CLAIM',
      customerPayAmount: incident.customerPayAmount || 0,
      companyPayAmount: incident.companyPayAmount || 0,
      staffNotes: incident.staffNotes || '',
      staffName: 'Trần Văn Hưng (Kỹ thuật VELORA)',
      vehicleStatusAfterIncident: 'REPAIR'
    });
    setIsResolveModalOpen(true);
  };

  const handleSubmitResolve = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      setActionLoading(true);
      const payload = {
        resolutionAction: resolveForm.resolutionAction,
        replacementCarId: resolveForm.resolutionAction === 'REPLACE_CAR' && resolveForm.replacementCarId ? resolveForm.replacementCarId : null,
        estimatedDamageCost: Number(resolveForm.estimatedDamageCost) || 0,
        insuranceCoverageStatus: resolveForm.insuranceCoverageStatus,
        customerPayAmount: Number(resolveForm.customerPayAmount) || 0,
        companyPayAmount: Number(resolveForm.companyPayAmount) || 0,
        staffNotes: resolveForm.staffNotes.trim(),
        staffName: resolveForm.staffName,
        vehicleStatusAfterIncident: resolveForm.vehicleStatusAfterIncident
      };

      await incidentService.resolve(selectedIncident.id, payload);
      alert('Đã hoàn tất xử lý và lập biên bản giải quyết sự cố thành công!');
      setIsResolveModalOpen(false);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi hoàn tất giải quyết sự cố.');
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
            Điều Phối Cứu Hộ & Xử Lý Sự Cố (US-21)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-900 text-white font-mono">
              Sprint 4
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Tiếp nhận báo cáo khẩn cấp từ khách thuê xe, điều phối cứu hộ, đổi xe thay thế, ghi nhận bồi thường & bảo hiểm
          </p>
        </div>

        <button
          onClick={fetchIncidents}
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
            <p className="text-xs text-slate-500 uppercase font-semibold">Tổng ca sự cố</p>
            <p className="text-2xl font-bold text-zinc-950 mt-1 tabular-nums">{incidents.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-700 uppercase font-semibold">Khẩn cấp cần tiếp nhận</p>
            <p className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">{reportedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 uppercase font-semibold">Đang cứu hộ / điều phối</p>
            <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{investigatingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 uppercase font-semibold">Đã hoàn tất xử lý</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{resolvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex border-b border-slate-200 w-full md:w-auto overflow-x-auto">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'REPORTED', label: `Mới báo cáo (${reportedCount})` },
              { key: 'INVESTIGATING', label: `Đang xử lý (${investigatingCount})` },
              { key: 'RESOLVED', label: `Đã giải quyết (${resolvedCount})` }
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
              placeholder="Tìm mã, khách, xe, địa điểm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-md text-xs text-zinc-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
            />
          </div>
        </div>

        {/* Incidents Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Mã ca / Thời gian</th>
                <th className="px-4 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Xe gặp nạn</th>
                <th className="px-4 py-3.5">Loại sự cố / Mức độ</th>
                <th className="px-4 py-3.5">Vị trí hiện trường</th>
                <th className="px-4 py-3.5 text-center">Ảnh hiện trường</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Phương án xử lý</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-zinc-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Đang tải danh sách sự cố...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-zinc-400">
                    <AlertTriangle size={36} className="mx-auto mb-2 text-zinc-300" />
                    <p className="font-medium text-zinc-600">Chưa có sự cố nào ghi nhận</p>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.REPORTED;
                  const StatusIcon = statusInfo.icon;
                  const severityInfo = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.MEDIUM;
                  const photos = item.photoUrls ? item.photoUrls.split(',').filter(Boolean) : [];

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition group">
                      
                      {/* Code & Time */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-zinc-950 text-xs">{item.incidentCode || 'INC-PENDING'}</div>
                        <div className="text-[11px] text-slate-400 tabular-nums">{formatDateTime(item.createdAt)}</div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-zinc-950">{item.customerName}</div>
                        <div className="text-[11px] text-slate-500 tabular-nums">{item.customerPhone}</div>
                      </td>

                      {/* Car */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-950">{item.carMake} {item.carModel}</div>
                        <div className="mt-1">
                          <span className="license-plate text-[10px] px-2 py-0.5">
                            {item.carLicensePlate}
                          </span>
                        </div>
                      </td>

                      {/* Type & Severity */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-zinc-950 text-xs">
                          {INCIDENT_TYPE_MAP[item.incidentType] || item.incidentType}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${severityInfo.bg}`}>
                            {severityInfo.label}
                          </span>
                          {item.hasInjuries && (
                            <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              CÓ THƯƠNG TÍCH
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location & Desc */}
                      <td className="px-4 py-3.5 max-w-[180px] text-xs">
                        <div className="flex items-start gap-1 text-zinc-900 font-medium truncate" title={item.location}>
                          <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] truncate mt-0.5" title={item.description}>
                          {item.description}
                        </p>
                      </td>

                      {/* Photos */}
                      <td className="px-4 py-3.5 text-center">
                        {photos.length > 0 ? (
                          <button
                            onClick={() => {
                              setActivePhoto(photos[0]);
                              setIsPhotoModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                          >
                            <Image size={13} />
                            <span>{photos.length} ảnh</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Không có</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusInfo.bg}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Resolution details */}
                      <td className="px-4 py-3.5 text-right text-xs">
                        {item.status === 'RESOLVED' ? (
                          <div>
                            <div className="font-semibold text-zinc-950">
                              {ACTION_MAP[item.resolutionAction] || item.resolutionAction}
                            </div>
                            {item.replacementCarLicensePlate && (
                              <div className="mt-1 flex justify-end">
                                <span className="license-plate text-[9px] px-1.5 py-0.5">
                                  {item.replacementCarLicensePlate}
                                </span>
                              </div>
                            )}
                            <div className="text-[11px] text-rose-700 font-medium tabular-nums mt-0.5">
                              Thiệt hại: {formatCurrency(item.estimatedDamageCost)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa giải quyết</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'REPORTED' && (
                            <button
                              onClick={() => handleStartInvestigating(item)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                              title="Tiếp nhận ca sự cố"
                            >
                              <PhoneCall size={13} />
                              <span>Tiếp nhận</span>
                            </button>
                          )}

                          {item.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleOpenResolveModal(item)}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                              title="Điều phối & Giải quyết sự cố"
                            >
                              <Wrench size={13} />
                              <span>Xử lý</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedIncident(item);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                            title="Xem chi tiết"
                          >
                            <FileText size={16} />
                          </button>
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

      {/* Modal Xử lý & Giải quyết Sự cố (US-21) */}
      {isResolveModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-xl w-full p-5 shadow-xl border border-slate-200 space-y-4 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                <Wrench size={18} />
                <span>Biên Bản Điều Phối & Giải Quyết Sự Cố (US-21)</span>
              </h3>
              <button 
                onClick={() => { setIsResolveModalOpen(false); setSelectedIncident(null); }}
                className="text-slate-400 hover:text-zinc-950 p-1 rounded-md transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Thông tin sự cố tóm tắt */}
            <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>Khách hàng: <strong className="text-zinc-950">{selectedIncident.customerName}</strong> ({selectedIncident.customerPhone})</span>
                <span className="font-mono font-bold text-rose-700">{selectedIncident.incidentCode}</span>
              </div>
              <div>Xe gặp nạn: <strong className="text-zinc-950">{selectedIncident.carMake} {selectedIncident.carModel}</strong> ({selectedIncident.carLicensePlate})</div>
              <div>Hiện trường: <strong className="text-zinc-950">{selectedIncident.location}</strong></div>
              <div>Mô tả của khách: <span className="italic text-slate-600">"{selectedIncident.description}"</span></div>
            </div>

            <form onSubmit={handleSubmitResolve} className="space-y-4 text-xs">
              
              {/* Phương án điều phối */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-950 flex items-center gap-1">
                  <Truck size={14} className="text-rose-600" />
                  Phương án điều phối cứu hộ:
                </label>
                <select
                  value={resolveForm.resolutionAction}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionAction: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-xs bg-white text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                >
                  <option value="RESCUE_TOW">Điều cứu hộ kéo xe về gara kiểm tra (RESCUE_TOW)</option>
                  <option value="REPLACE_CAR">Đổi xe thay thế cho khách tiếp tục lộ trình (REPLACE_CAR)</option>
                  <option value="REPAIR_ON_SITE">Sửa chữa lưu động tại chỗ (REPAIR_ON_SITE)</option>
                  <option value="NONE">Khách tự khắc phục / Không điều xe (NONE)</option>
                </select>
              </div>

              {/* Nếu chọn Đổi xe thay thế -> hiển thị chọn xe */}
              {resolveForm.resolutionAction === 'REPLACE_CAR' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-1.5">
                  <label className="font-bold text-blue-950 flex items-center gap-1">
                    <Car size={14} />
                    Chọn xe thay thế (Đang sẵn sàng - READY):
                  </label>
                  <select
                    value={resolveForm.replacementCarId}
                    onChange={(e) => setResolveForm({ ...resolveForm, replacementCarId: e.target.value })}
                    required={resolveForm.resolutionAction === 'REPLACE_CAR'}
                    className="w-full p-2.5 border border-blue-300 rounded-md text-xs bg-white text-zinc-950 focus:outline-none focus:border-blue-700"
                  >
                    <option value="">-- Chọn xe thay thế từ kho xe --</option>
                    {availableVehicles
                      .filter(v => v.id !== selectedIncident.carId)
                      .map(v => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} ({v.licensePlate}) - {formatCurrency(v.dailyRate)}/ngày
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-blue-700">
                    Xe thay thế sẽ được tự động kích hoạt trạng thái RENTED gán vào lộ trình của khách.
                  </p>
                </div>
              )}

              {/* Trạng thái xe gặp nạn sau sự cố */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-950">Trạng thái xe gặp nạn sau sự cố:</label>
                <select
                  value={resolveForm.vehicleStatusAfterIncident}
                  onChange={(e) => setResolveForm({ ...resolveForm, vehicleStatusAfterIncident: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-xs bg-white text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                >
                  <option value="REPAIR">REPAIR - Chuyển sang khu sửa chữa gara (Khuyên dùng)</option>
                  <option value="MAINTENANCE">MAINTENANCE - Đưa vào bảo dưỡng bảo trì</option>
                  <option value="READY">READY - Xe vẫn hoạt động tốt, hoàn trả về kho</option>
                </select>
              </div>

              {/* Chi phí & Bảo hiểm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Ước tính tổng thiệt hại (VNĐ):</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={resolveForm.estimatedDamageCost}
                    onChange={(e) => setResolveForm({ ...resolveForm, estimatedDamageCost: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md text-xs text-zinc-950 font-mono tabular-nums focus:outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Trách nhiệm bảo hiểm:</label>
                  <select
                    value={resolveForm.insuranceCoverageStatus}
                    onChange={(e) => setResolveForm({ ...resolveForm, insuranceCoverageStatus: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md text-xs bg-white text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                  >
                    <option value="PENDING_CLAIM">Chờ bảo hiểm thẩm định (PENDING_CLAIM)</option>
                    <option value="COVERED">Bảo hiểm bồi thường (COVERED)</option>
                    <option value="REJECTED">Bảo hiểm từ chối (REJECTED)</option>
                    <option value="NOT_APPLICABLE">Không áp dụng (NOT_APPLICABLE)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Khách hàng bồi thường (VNĐ):</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={resolveForm.customerPayAmount}
                    onChange={(e) => setResolveForm({ ...resolveForm, customerPayAmount: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md text-xs text-zinc-950 font-mono tabular-nums focus:outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Công ty chịu chi phí (VNĐ):</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={resolveForm.companyPayAmount}
                    onChange={(e) => setResolveForm({ ...resolveForm, companyPayAmount: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md text-xs text-zinc-950 font-mono tabular-nums focus:outline-none focus:border-[#0F172A]"
                  />
                </div>
              </div>

              {/* Ghi chú biên bản */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nội dung biên bản & Ghi chú xử lý:</label>
                <textarea
                  rows="3"
                  value={resolveForm.staffNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, staffNotes: e.target.value })}
                  placeholder="Ghi chú chi tiết thỏa thuận bồi thường, số xe cứu hộ, biên bản hiện trường..."
                  className="w-full p-2 border border-slate-300 rounded-md text-xs text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                />
              </div>

              {/* Tên nhân viên */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nhân viên lập biên bản:</label>
                <input
                  type="text"
                  value={resolveForm.staffName}
                  onChange={(e) => setResolveForm({ ...resolveForm, staffName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-xs text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition shadow-sm"
                >
                  {actionLoading ? 'Đang lưu...' : 'Xác Nhận Giải Quyết Ca Sự Cố'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Chi Tiết Ca Sự Cố */}
      {isDetailModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <FileText size={18} className="text-rose-600" />
                <span>Chi Tiết Sự Cố {selectedIncident.incidentCode}</span>
              </h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-zinc-950 p-1 rounded-md transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                <div>Khách: <strong className="text-zinc-950">{selectedIncident.customerName}</strong></div>
                <div>SĐT: <strong className="text-zinc-950 tabular-nums">{selectedIncident.customerPhone}</strong></div>
                <div>Xe: <strong className="text-zinc-950">{selectedIncident.carMake} {selectedIncident.carModel}</strong></div>
                <div>
                  Biển số: <span className="license-plate text-[10px] px-1.5 py-0.5">{selectedIncident.carLicensePlate}</span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-500 text-[11px]">Địa điểm hiện trường:</p>
                <p className="text-zinc-950 font-medium mt-0.5">{selectedIncident.location}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-500 text-[11px]">Mô tả sự cố:</p>
                <p className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-slate-800 mt-0.5">{selectedIncident.description}</p>
              </div>

              {selectedIncident.status === 'RESOLVED' && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md space-y-1.5">
                  <div className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    <span>Phương án xử lý: {ACTION_MAP[selectedIncident.resolutionAction]}</span>
                  </div>
                  {selectedIncident.replacementCarLicensePlate && (
                    <div className="text-emerald-800 flex items-center gap-1.5">
                      <span>Xe thay thế bàn giao:</span>
                      <strong>{selectedIncident.replacementCarMake} {selectedIncident.replacementCarModel}</strong>
                      <span className="license-plate text-[10px] px-1.5 py-0.5">{selectedIncident.replacementCarLicensePlate}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1 text-emerald-900 pt-1 border-t border-emerald-200 text-[11px]">
                    <div>Tổng thiệt hại: <span className="tabular-nums font-semibold">{formatCurrency(selectedIncident.estimatedDamageCost)}</span></div>
                    <div>Bảo hiểm: {INSURANCE_STATUS_MAP[selectedIncident.insuranceCoverageStatus]}</div>
                    <div>Khách đền bù: <span className="tabular-nums font-semibold">{formatCurrency(selectedIncident.customerPayAmount)}</span></div>
                    <div>Công ty bù: <span className="tabular-nums font-semibold">{formatCurrency(selectedIncident.companyPayAmount)}</span></div>
                  </div>
                  {selectedIncident.staffNotes && (
                    <div className="text-[11px] text-slate-600 italic pt-1">
                      Ghi chú: "{selectedIncident.staffNotes}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-[#0F172A] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold shadow-sm transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Ảnh Hiện Trường */}
      {isPhotoModalOpen && activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-lg p-4 shadow-xl border border-slate-200">
            <button
              onClick={() => { setIsPhotoModalOpen(false); setActivePhoto(null); }}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-zinc-950 bg-slate-100 rounded-md"
            >
              <X size={18} />
            </button>
            <p className="text-zinc-950 text-xs font-semibold mb-3">Ảnh hiện trường sự cố</p>
            <img 
              src={activePhoto} 
              alt="Hiện trường sự cố" 
              className="w-full max-h-[70vh] object-contain rounded-md border border-slate-200" 
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default IncidentsPage;
