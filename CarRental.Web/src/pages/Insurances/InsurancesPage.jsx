import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Car, 
  FileText, 
  Trash2, 
  Edit3, 
  RefreshCw,
  X,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import insuranceService from '../../services/insuranceService';
import vehicleService from '../../services/vehicleService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const INSURANCE_TYPES = [
  { value: 'TNDS', label: 'TNDS bắt buộc (Theo luật)' },
  { value: 'PHYSICAL', label: 'Bảo hiểm vật chất 2 chiều (Thân vỏ)' },
  { value: 'OCCUPANT', label: 'Bảo hiểm tai nạn người ngồi trên xe' },
  { value: 'TWO_WAY', label: 'Bảo hiểm toàn diện hai chiều cao cấp' }
];

const InsurancesPage = () => {
  const [insurances, setInsurances] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' or 'EDIT'
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    carId: '',
    insuranceType: 'TNDS',
    insuranceCompany: '',
    policyNumber: '',
    startDate: '',
    expiryDate: '',
    coverageSummary: '',
    deductibleAmount: 0,
    premiumAmount: 0,
    certificateImageUrl: '',
    status: 'ACTIVE'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [insRes, alertRes, vehRes] = await Promise.all([
        insuranceService.getAll(),
        insuranceService.getAlerts(),
        vehicleService.getAllVehicles()
      ]);

      setInsurances(Array.isArray(insRes) ? insRes : (insRes?.data || []));
      setAlerts(Array.isArray(alertRes) ? alertRes : (alertRes?.data || []));
      setVehicles(Array.isArray(vehRes) ? vehRes : (vehRes?.data || []));
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu bảo hiểm xe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setSelectedInsurance(null);
    setFormData({
      carId: vehicles[0]?.id || '',
      insuranceType: 'TNDS',
      insuranceCompany: 'Bảo hiểm Bảo Việt',
      policyNumber: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      coverageSummary: 'Bồi thường trách nhiệm dân sự bắt buộc đối với bên thứ ba theo quy định nhà nước.',
      deductibleAmount: 0,
      premiumAmount: 1200000,
      certificateImageUrl: '',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ins) => {
    setModalMode('EDIT');
    setSelectedInsurance(ins);
    setFormData({
      carId: ins.carId,
      insuranceType: ins.insuranceType,
      insuranceCompany: ins.insuranceCompany,
      policyNumber: ins.policyNumber || '',
      startDate: ins.startDate ? ins.startDate.split('T')[0] : '',
      expiryDate: ins.expiryDate ? ins.expiryDate.split('T')[0] : '',
      coverageSummary: ins.coverageSummary || '',
      deductibleAmount: ins.deductibleAmount || 0,
      premiumAmount: ins.premiumAmount || 0,
      certificateImageUrl: ins.certificateImageUrl || '',
      status: ins.status || 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (modalMode === 'CREATE') {
        await insuranceService.create({
          ...formData,
          deductibleAmount: Number(formData.deductibleAmount),
          premiumAmount: Number(formData.premiumAmount)
        });
        alert('Đã thêm hợp đồng bảo hiểm thành công!');
      } else {
        await insuranceService.update(selectedInsurance.id, {
          ...formData,
          deductibleAmount: Number(formData.deductibleAmount),
          premiumAmount: Number(formData.premiumAmount)
        });
        alert('Đã cập nhật hợp đồng bảo hiểm thành công!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bảo hiểm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hợp đồng bảo hiểm này không?')) {
      try {
        await insuranceService.delete(id);
        alert('Đã xóa bảo hiểm thành công!');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa.');
      }
    }
  };

  // Filter list
  const filteredList = insurances.filter(item => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      item.carMake?.toLowerCase().includes(s) ||
      item.carModel?.toLowerCase().includes(s) ||
      item.licensePlate?.toLowerCase().includes(s) ||
      item.insuranceCompany?.toLowerCase().includes(s) ||
      item.policyNumber?.toLowerCase().includes(s);

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchType = typeFilter === 'ALL' || item.insuranceType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  const totalCount = insurances.length;
  const activeCount = insurances.filter(i => i.status === 'ACTIVE').length;
  const expiringSoonCount = insurances.filter(i => i.status === 'EXPIRING_SOON').length;
  const expiredCount = insurances.filter(i => i.status === 'EXPIRED').length;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck size={20} />
            </div>
            Quản Lý Bảo Hiểm Phương Tiện (US-19)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi hợp đồng bảo hiểm TNDS bắt buộc và bảo hiểm vật chất 2 chiều, tự động cảnh báo ngày hết hạn
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition shadow-sm"
            title="Làm mới"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-[#0F172A] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            <span>Thêm hợp đồng bảo hiểm</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center justify-between text-xs font-medium">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Expiry Warning Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>Cảnh Báo: Phát hiện {alerts.length} phương tiện có bảo hiểm sắp hết hạn hoặc đã hết hạn!</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {alerts.map(a => (
              <div 
                key={a.insuranceId}
                className={`p-3 rounded-md border text-xs flex justify-between items-center ${
                  a.alertLevel === 'EXPIRED' 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-white border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <div className="font-semibold flex items-center gap-1.5">
                    <span>{a.carName}</span>
                    <span className="license-plate text-[9px] px-1 py-0">{a.licensePlate}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {a.insuranceType === 'TNDS' ? 'TNDS bắt buộc' : 'Vật chất thân vỏ'} • {a.insuranceCompany}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] tabular-nums ${
                    a.alertLevel === 'EXPIRED' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {a.alertLevel === 'EXPIRED' ? `Hết hạn ${Math.abs(a.daysRemaining)} ngày` : `Còn ${a.daysRemaining} ngày`}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">Hạn: {formatDate(a.expiryDate)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng số hợp đồng</span>
            <FileText size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-950 mt-2 tabular-nums">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đã cấp cho {vehicles.length} xe trong đội</div>
        </div>

        <div className="bg-white border border-emerald-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Đang có hiệu lực</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đủ điều kiện pháp lý lưu hành</div>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>Sắp hết hạn (&lt; 30 ngày)</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2 tabular-nums">{expiringSoonCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Cần liên hệ gia hạn sớm</div>
        </div>

        <div className="bg-white border border-rose-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>Đã hết hạn</span>
            <AlertCircle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2 tabular-nums">{expiredCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Cảnh báo không cho thuê</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo biển số, dòng xe, công ty bảo hiểm, số GCN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-4 py-2 text-xs text-zinc-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-xs text-zinc-950 rounded-md px-3 py-2 focus:outline-none focus:border-[#0F172A]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Còn hiệu lực</option>
            <option value="EXPIRING_SOON">Sắp hết hạn</option>
            <option value="EXPIRED">Đã hết hạn</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 text-xs text-zinc-950 rounded-md px-3 py-2 focus:outline-none focus:border-[#0F172A]"
          >
            <option value="ALL">Tất cả loại bảo hiểm</option>
            <option value="TNDS">TNDS bắt buộc</option>
            <option value="PHYSICAL">Vật chất thân vỏ</option>
            <option value="OCCUPANT">Tai nạn người ngồi trên xe</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Phương tiện</th>
                <th className="py-3.5 px-4">Loại bảo hiểm</th>
                <th className="py-3.5 px-4">Đơn vị & Số GCN</th>
                <th className="py-3.5 px-4">Thời hạn hiệu lực</th>
                <th className="py-3.5 px-4 text-right">Phí & Khấu trừ</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#0F172A]" />
                    <span>Đang tải danh sách bảo hiểm...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Không tìm thấy hợp đồng bảo hiểm nào phù hợp</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((ins) => {
                  return (
                    <tr key={ins.id} className="hover:bg-slate-50/80 transition">
                      {/* Phương tiện */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-950">
                          {ins.carMake} {ins.carModel}
                        </div>
                        <div className="mt-1">
                          <span className="license-plate text-[10px] px-2 py-0.5">
                            {ins.licensePlate}
                          </span>
                        </div>
                      </td>

                      {/* Loại bảo hiểm */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-zinc-950">
                          {ins.insuranceType === 'TNDS' ? 'TNDS bắt buộc' : 
                           ins.insuranceType === 'PHYSICAL' ? 'Vật chất 2 chiều' : 
                           ins.insuranceType === 'OCCUPANT' ? 'Tai nạn người lái & phụ' : ins.insuranceType}
                        </span>
                        {ins.coverageSummary && (
                          <p className="text-[11px] text-slate-400 max-w-xs truncate mt-0.5" title={ins.coverageSummary}>
                            {ins.coverageSummary}
                          </p>
                        )}
                      </td>

                      {/* Đơn vị & Số GCN */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-950">{ins.insuranceCompany}</div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          GCN: {ins.policyNumber || 'Đang cập nhật'}
                        </div>
                      </td>

                      {/* Thời hạn */}
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-950 tabular-nums">
                          {formatDate(ins.startDate)} → {formatDate(ins.expiryDate)}
                        </div>
                        <div className="text-[11px] mt-0.5 tabular-nums">
                          {ins.daysUntilExpiry > 0 ? (
                            <span className={ins.daysUntilExpiry <= 30 ? 'text-amber-700 font-semibold' : 'text-slate-400'}>
                              Còn {ins.daysUntilExpiry} ngày
                            </span>
                          ) : (
                            <span className="text-rose-700 font-semibold">
                              Quá hạn {Math.abs(ins.daysUntilExpiry)} ngày
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phí & Khấu trừ */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="text-zinc-950 font-bold tabular-nums">{formatCurrency(ins.premiumAmount)}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          Khấu trừ: {formatCurrency(ins.deductibleAmount)}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {ins.status === 'ACTIVE' && (
                          <span className="badge-ready inline-flex text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Còn hiệu lực
                          </span>
                        )}
                        {ins.status === 'EXPIRING_SOON' && (
                          <span className="badge-maint inline-flex text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Sắp hết hạn
                          </span>
                        )}
                        {ins.status === 'EXPIRED' && (
                          <span className="badge-repair inline-flex text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Đã hết hạn
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(ins)}
                            className="p-1.5 text-slate-600 hover:text-zinc-950 hover:bg-slate-100 rounded-md transition"
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(ins.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
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

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={18} />
                <span>{modalMode === 'CREATE' ? 'Thêm Hợp Đồng Bảo Hiểm' : 'Cập Nhật Hợp Đồng Bảo Hiểm'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-zinc-950 p-1 rounded-md transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Phương tiện */}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Chọn phương tiện áp dụng *</label>
                <select
                  disabled={modalMode === 'EDIT'}
                  value={formData.carId}
                  onChange={(e) => setFormData({ ...formData, carId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                  required
                >
                  <option value="">-- Chọn xe --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.licensePlate}) - {v.pickupLocation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loại bảo hiểm & Đơn vị */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Loại bảo hiểm *</label>
                  <select
                    value={formData.insuranceType}
                    onChange={(e) => setFormData({ ...formData, insuranceType: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                  >
                    {INSURANCE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Công ty bảo hiểm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bảo Việt, PVI, PTI, MIC..."
                    value={formData.insuranceCompany}
                    onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                  />
                </div>
              </div>

              {/* Số GCN & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Số hợp đồng / GCN bảo hiểm *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: BV-TNDS-2026-69696"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 font-mono focus:outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Trạng thái hiệu lực</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                  >
                    <option value="ACTIVE">Còn hiệu lực (Active)</option>
                    <option value="EXPIRING_SOON">Sắp hết hạn (Expiring Soon)</option>
                    <option value="EXPIRED">Đã hết hạn (Expired)</option>
                  </select>
                </div>
              </div>

              {/* Ngày bắt đầu & Ngày hết hạn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Ngày bắt đầu hiệu lực *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Ngày hết hạn hiệu lực *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                  />
                </div>
              </div>

              {/* Phí bảo hiểm & Khấu trừ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Phí bảo hiểm đã đóng (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.premiumAmount}
                    onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 tabular-nums focus:outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Mức khấu trừ/vụ (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.deductibleAmount}
                    onChange={(e) => setFormData({ ...formData, deductibleAmount: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 tabular-nums focus:outline-none focus:border-[#0F172A]"
                  />
                </div>
              </div>

              {/* Phạm vi bảo hiểm */}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Phạm vi bảo hiểm & Ghi chú bồi thường</label>
                <textarea
                  rows="3"
                  placeholder="VD: Bồi thường toàn bộ thân vỏ khi va chạm, ngập nước, cháy nổ. Hạn mức bồi thường người ngồi trên xe 50 triệu/người."
                  value={formData.coverageSummary}
                  onChange={(e) => setFormData({ ...formData, coverageSummary: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-zinc-950 focus:outline-none focus:border-[#0F172A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-medium transition text-xs shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F172A] hover:bg-[#1D4ED8] text-white font-semibold rounded-md transition shadow-sm text-xs disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : (modalMode === 'CREATE' ? 'Thêm hợp đồng' : 'Cập nhật')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default InsurancesPage;
