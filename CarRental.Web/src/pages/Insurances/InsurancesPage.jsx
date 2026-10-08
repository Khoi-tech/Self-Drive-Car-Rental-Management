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
      premiumAmount: 873400,
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
      } else {
        await insuranceService.update(selectedInsurance.id, {
          ...formData,
          deductibleAmount: Number(formData.deductibleAmount),
          premiumAmount: Number(formData.premiumAmount)
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hợp đồng bảo hiểm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi bảo hiểm này không?')) return;
    try {
      await insuranceService.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa bản ghi bảo hiểm.');
    }
  };

  // KPIs
  const totalCount = insurances.length;
  const activeCount = insurances.filter(i => i.status === 'ACTIVE').length;
  const expiringSoonCount = insurances.filter(i => i.status === 'EXPIRING_SOON').length;
  const expiredCount = insurances.filter(i => i.status === 'EXPIRED').length;

  // Filtered list
  const filteredList = insurances.filter(item => {
    const matchSearch = 
      item.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.carMake?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.carModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.insuranceCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.policyNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchType = typeFilter === 'ALL' || item.insuranceType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="text-emerald-400" size={28} />
            Quản Lý Bảo Hiểm Phương Tiện (US-17)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Theo dõi thời hạn hiệu lực, phạm vi bồi thường và cảnh báo hết hạn bảo hiểm cho từng xe
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition"
            title="Làm mới"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} />
            <span>Thêm hợp đồng bảo hiểm</span>
          </button>
        </div>
      </div>

      {/* Expiry Warning Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle size={18} className="animate-pulse" />
            <span>Cảnh Báo: Phát hiện {alerts.length} phương tiện có bảo hiểm sắp hết hạn hoặc đã hết hạn!</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map(a => (
              <div 
                key={a.insuranceId}
                className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                  a.alertLevel === 'EXPIRED' 
                    ? 'bg-rose-950/50 border-rose-800 text-rose-300' 
                    : 'bg-amber-900/30 border-amber-700/60 text-amber-200'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{a.carName}</span>
                    <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-[11px]">{a.licensePlate}</span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {a.insuranceType === 'TNDS' ? 'TNDS bắt buộc' : 'Vật chất thân vỏ'} • {a.insuranceCompany}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                    a.alertLevel === 'EXPIRED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {a.alertLevel === 'EXPIRED' ? `Hết hạn ${Math.abs(a.daysRemaining)} ngày` : `Còn ${a.daysRemaining} ngày`}
                  </span>
                  <div className="text-[10px] opacity-70 mt-0.5">Hạn: {formatDate(a.expiryDate)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Tổng số hợp đồng</span>
            <FileText size={16} />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Đã cấp cho {vehicles.length} xe trong đội</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span>Đang có hiệu lực</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{activeCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Đủ điều kiện pháp lý lưu hành</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span>Sắp hết hạn (&lt; 30 ngày)</span>
            <Clock size={16} />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{expiringSoonCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Cần gia hạn sớm</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-rose-400 text-xs">
            <span>Đã hết hạn</span>
            <AlertCircle size={16} />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{expiredCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Cảnh báo không cho thuê</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo biển số, dòng xe, công ty bảo hiểm, số GCN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-600"
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
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-600"
          >
            <option value="ALL">Tất cả loại bảo hiểm</option>
            <option value="TNDS">TNDS bắt buộc</option>
            <option value="PHYSICAL">Vật chất thân vỏ</option>
            <option value="OCCUPANT">Tai nạn người ngồi trên xe</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
              <tr>
                <th className="py-4 px-6">Phương tiện</th>
                <th className="py-4 px-6">Loại bảo hiểm</th>
                <th className="py-4 px-6">Đơn vị & Số GCN</th>
                <th className="py-4 px-6">Thời hạn hiệu lực</th>
                <th className="py-4 px-6">Phí & Khấu trừ</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-zinc-500">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-500" />
                    Đang tải danh sách bảo hiểm...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-zinc-500">
                    Không tìm thấy hợp đồng bảo hiểm nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredList.map((ins) => {
                  return (
                    <tr key={ins.id} className="hover:bg-zinc-800/40 transition">
                      {/* Phương tiện */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-sm">
                          {ins.carMake} {ins.carModel}
                        </div>
                        <div className="font-mono text-xs text-amber-400 mt-0.5">
                          {ins.licensePlate}
                        </div>
                      </td>

                      {/* Loại bảo hiểm */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-zinc-200">
                          {ins.insuranceType === 'TNDS' ? 'TNDS bắt buộc' : 
                           ins.insuranceType === 'PHYSICAL' ? 'Vật chất 2 chiều' : 
                           ins.insuranceType === 'OCCUPANT' ? 'Tai nạn người lái & phụ' : ins.insuranceType}
                        </span>
                        {ins.coverageSummary && (
                          <p className="text-[11px] text-zinc-400 max-w-xs truncate mt-0.5" title={ins.coverageSummary}>
                            {ins.coverageSummary}
                          </p>
                        )}
                      </td>

                      {/* Đơn vị & Số GCN */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-zinc-100">{ins.insuranceCompany}</div>
                        <div className="font-mono text-[11px] text-zinc-400 mt-0.5">
                          GCN: {ins.policyNumber || 'Đang cập nhật'}
                        </div>
                      </td>

                      {/* Thời hạn */}
                      <td className="py-4 px-6">
                        <div className="text-zinc-200">
                          {formatDate(ins.startDate)} → {formatDate(ins.expiryDate)}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {ins.daysUntilExpiry > 0 ? (
                            <span className={ins.daysUntilExpiry <= 30 ? 'text-amber-400 font-semibold' : 'text-zinc-400'}>
                              Còn {ins.daysUntilExpiry} ngày
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold">
                              Quá hạn {Math.abs(ins.daysUntilExpiry)} ngày
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phí & Khấu trừ */}
                      <td className="py-4 px-6">
                        <div className="text-zinc-200 font-medium">{formatCurrency(ins.premiumAmount)}</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          Khấu trừ: {formatCurrency(ins.deductibleAmount)}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-6">
                        {ins.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Còn hiệu lực
                          </span>
                        )}
                        {ins.status === 'EXPIRING_SOON' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Sắp hết hạn
                          </span>
                        )}
                        {ins.status === 'EXPIRED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Đã hết hạn
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(ins)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(ins.id)}
                            className="p-1.5 bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} />
                <span>{modalMode === 'CREATE' ? 'Thêm Hợp Đồng Bảo Hiểm' : 'Cập Nhật Hợp Đồng Bảo Hiểm'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Phương tiện */}
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Chọn phương tiện áp dụng *</label>
                <select
                  disabled={modalMode === 'EDIT'}
                  value={formData.carId}
                  onChange={(e) => setFormData({ ...formData, carId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-zinc-400 mb-1 font-medium">Loại bảo hiểm *</label>
                  <select
                    value={formData.insuranceType}
                    onChange={(e) => setFormData({ ...formData, insuranceType: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {INSURANCE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Công ty bảo hiểm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bảo Việt, PVI, PTI, MIC..."
                    value={formData.insuranceCompany}
                    onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Số GCN & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Số hợp đồng / GCN bảo hiểm *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: BV-TNDS-2026-69696"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Trạng thái hiệu lực</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-zinc-400 mb-1 font-medium">Ngày bắt đầu hiệu lực *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Ngày hết hạn hiệu lực *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Phí bảo hiểm & Khấu trừ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Phí bảo hiểm đã đóng (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.premiumAmount}
                    onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Mức khấu trừ/vụ (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.deductibleAmount}
                    onChange={(e) => setFormData({ ...formData, deductibleAmount: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Phạm vi bảo hiểm */}
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Phạm vi bảo hiểm & Ghi chú bồi thường</label>
                <textarea
                  rows="3"
                  placeholder="VD: Bồi thường toàn bộ thân vỏ khi va chạm, ngập nước, cháy nổ. Hạn mức bồi thường người ngồi trên xe 50 triệu/người."
                  value={formData.coverageSummary}
                  onChange={(e) => setFormData({ ...formData, coverageSummary: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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
