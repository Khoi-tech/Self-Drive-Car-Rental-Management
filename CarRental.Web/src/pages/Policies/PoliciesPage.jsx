import React, { useState, useEffect } from 'react';
import {
  Search,
  Settings,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Save,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckSquare,
  Square,
  Layers,
  Award
} from 'lucide-react';
import vehicleService from '../../services/vehicleService';
import rentalConditionService from '../../services/rentalConditionService';

const CONDITION_PRESETS = [
  {
    id: 'STANDARD',
    label: 'Phổ thông',
    desc: '21+ tuổi • 1 năm • B1 • 0 chuyến',
    values: {
      minAge: 21,
      requireDrivingYears: 1,
      requiredLicenseClass: 'B1',
      minCompletedTrips: 0,
      requireVerifiedKyc: false,
      otherConditions: 'Khách hàng mang theo CCCD gắn chip và GPLX bản gốc khi nhận xe.'
    }
  },
  {
    id: 'PREMIUM',
    label: 'Cao cấp / 7 chỗ',
    desc: '23+ tuổi • 2 năm • B1 • ≥1 chuyến • KYC',
    values: {
      minAge: 23,
      requireDrivingYears: 2,
      requiredLicenseClass: 'B1',
      minCompletedTrips: 1,
      requireVerifiedKyc: true,
      otherConditions: 'Yêu cầu xác minh KYC trước khi đặt. Không hút thuốc hoặc chở thú cưng trong khoang xe.'
    }
  },
  {
    id: 'SPORT',
    label: 'Siêu xe / Thể thao',
    desc: '25+ tuổi • 3 năm • B2 • ≥2 chuyến • KYC',
    values: {
      minAge: 25,
      requireDrivingYears: 3,
      requiredLicenseClass: 'B2',
      minCompletedTrips: 2,
      requireVerifiedKyc: true,
      otherConditions: 'Dòng xe hiệu suất cao: bắt buộc duyệt KYC, GPLX từ hạng B2 trở lên và lịch sử thuê tốt.'
    }
  }
];

const DEFAULT_FORM = {
  minAge: 21,
  requireDrivingYears: 1,
  requiredLicenseClass: 'B1',
  minCompletedTrips: 0,
  requireVerifiedKyc: false,
  otherConditions: ''
};

const PoliciesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State ('add' | 'edit' | 'bulk')
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete State (Reset back to System Default)
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getAllVehicles(searchTerm);
      const list = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      setVehicles(list);
      // Keep only selections still in list
      setSelectedIds(prev => prev.filter(id => list.some(v => v.id === id)));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách xe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVehicles();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const allSelected = vehicles.length > 0 && selectedIds.length === vehicles.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(vehicles.map(v => v.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const applyPreset = (preset) => {
    setFormData({ ...preset.values });
    setModalError(null);
  };

  const openAddModal = (vehicle) => {
    setModalMode('add');
    setCurrentVehicle(vehicle);
    setFormData({
      minAge: vehicle.rentalConditionMinAge ?? 21,
      requireDrivingYears: vehicle.rentalConditionRequireDrivingYears ?? 1,
      requiredLicenseClass: vehicle.rentalConditionRequiredLicenseClass || (vehicle.transmission === 'MANUAL' ? 'B2' : 'B1'),
      minCompletedTrips: vehicle.rentalConditionMinCompletedTrips ?? 0,
      requireVerifiedKyc: Boolean(vehicle.rentalConditionRequireVerifiedKyc),
      otherConditions: vehicle.rentalConditionOtherConditions || ''
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (vehicle) => {
    setModalMode('edit');
    setCurrentVehicle(vehicle);
    setModalError(null);
    setIsModalOpen(true);
    setModalLoading(true);

    try {
      const condition = await rentalConditionService.getConditionByVehicleId(vehicle.id);
      if (condition) {
        setFormData({
          minAge: condition.minAge ?? 21,
          requireDrivingYears: condition.requireDrivingYears ?? 1,
          requiredLicenseClass: condition.requiredLicenseClass || 'B1',
          minCompletedTrips: condition.minCompletedTrips ?? 0,
          requireVerifiedKyc: Boolean(condition.requireVerifiedKyc),
          otherConditions: condition.otherConditions ?? ''
        });
        if (!condition.isCustom) {
          setModalMode('add');
        }
      } else {
        setFormData(DEFAULT_FORM);
        setModalMode('add');
      }
    } catch {
      setModalError('Không thể tải thông tin điều kiện thuê.');
    } finally {
      setModalLoading(false);
    }
  };

  const openBulkModal = () => {
    if (selectedIds.length === 0) return;
    setModalMode('bulk');
    setCurrentVehicle(null);
    setFormData(DEFAULT_FORM);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    const minAge = formData.minAge === '' ? 21 : Number(formData.minAge);
    const reqYears = formData.requireDrivingYears === '' ? 0 : Number(formData.requireDrivingYears);
    const minTrips = formData.minCompletedTrips === '' ? 0 : Number(formData.minCompletedTrips);

    if (minAge < 18 || minAge > 100) {
      setModalError('Tuổi tối thiểu phải từ 18 đến 100.');
      setModalSaving(false);
      return;
    }
    if (reqYears < 0) {
      setModalError('Kinh nghiệm lái không được âm.');
      setModalSaving(false);
      return;
    }
    if (minTrips < 0) {
      setModalError('Số chuyến hoàn tất tối thiểu không được âm.');
      setModalSaving(false);
      return;
    }

    try {
      if (modalMode === 'bulk') {
        const res = await rentalConditionService.bulkApply({
          vehicleIds: selectedIds,
          minAge,
          minDrivingYears: reqYears,
          requiredLicenseClass: formData.requiredLicenseClass || 'B1',
          minCompletedTrips: minTrips,
          requireVerifiedKyc: Boolean(formData.requireVerifiedKyc),
          otherNotes: formData.otherConditions?.trim() || null
        });
        setSuccessMsg(res?.message || `Đã áp dụng điều kiện thuê cho ${selectedIds.length} xe thành công.`);
        setSelectedIds([]);
      } else {
        const payload = {
          minAge,
          requireDrivingYears: reqYears,
          requiredLicenseClass: formData.requiredLicenseClass || 'B1',
          minCompletedTrips: minTrips,
          requireVerifiedKyc: Boolean(formData.requireVerifiedKyc),
          otherConditions: formData.otherConditions?.trim() || null
        };

        if (modalMode === 'add') {
          await rentalConditionService.createCondition(currentVehicle.id, payload);
          setSuccessMsg(`Đã thiết lập điều kiện riêng cho xe ${currentVehicle.licensePlate}.`);
        } else {
          await rentalConditionService.updateCondition(currentVehicle.id, payload);
          setSuccessMsg(`Đã cập nhật điều kiện thuê cho xe ${currentVehicle.licensePlate}.`);
        }
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Lỗi khi lưu điều kiện thuê.');
    } finally {
      setModalSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleteLoading(true);
      await rentalConditionService.deleteCondition(deleteModal.id);
      setSuccessMsg(`Đã đưa xe ${deleteModal.licensePlate} về điều kiện Mặc định hệ thống.`);
      setDeleteModal(null);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa điều kiện thuê.');
      setDeleteModal(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const customCount = vehicles.filter(v => v.hasRentalCondition).length;
  const defaultCount = vehicles.length - customCount;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2.5 flex-wrap">
            <span>Điều Kiện & Chính Sách Thuê Xe</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
              {vehicles.length} xe
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              {customCount} tùy chỉnh
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
              {defaultCount} mặc định hệ thống
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mọi phương tiện chưa tùy chỉnh sẽ tự động áp dụng chuẩn <strong>Mặc định hệ thống</strong> (21+ tuổi, 1 năm lái, B1; xe số sàn tự nâng tối thiểu B2).
          </p>
        </div>

        <button
          onClick={fetchVehicles}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition shadow-2xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Search & Bulk Action Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={15} className="text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-xs text-zinc-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
            placeholder="Tìm theo hãng xe, model, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2.5">
          {selectedIds.length > 0 && (
            <>
              <span className="text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-md whitespace-nowrap">
                Đã chọn {selectedIds.length} xe
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-500 hover:text-zinc-900 px-2 py-1.5 transition"
              >
                Bỏ chọn
              </button>
            </>
          )}
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={openBulkModal}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold transition shadow-xs whitespace-nowrap ${
              selectedIds.length > 0
                ? 'bg-[#0F172A] hover:bg-blue-900 text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Layers size={14} />
            <span>Áp dụng hàng loạt{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg flex items-center justify-between">
          <p className="text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            {successMsg}
          </p>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-rose-600" size={16} />
            <p className="text-rose-700 text-xs font-medium">{error}</p>
          </div>
          <button onClick={fetchVehicles} className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1">
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {/* Vehicles Rental Conditions Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3 text-center w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-500 hover:text-zinc-950 transition"
                    title={allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  >
                    {allSelected ? <CheckSquare size={16} className="text-blue-900" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-3.5 py-3 text-left whitespace-nowrap">Biển số & Phương tiện</th>
                <th className="px-3.5 py-3 text-center whitespace-nowrap">Tuổi / Kinh nghiệm</th>
                <th className="px-3.5 py-3 text-center whitespace-nowrap">Hạng GPLX & Điều kiện</th>
                <th className="px-3.5 py-3 text-center whitespace-nowrap">Loại áp dụng</th>
                <th className="px-3.5 py-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="animate-spin mb-2 text-[#0F172A]" size={22} />
                      <p className="text-xs">Đang tải danh sách điều kiện thuê...</p>
                    </div>
                  </td>
                </tr>
              ) : vehicles.length > 0 ? (
                vehicles.map((vehicle) => {
                  const isCustom = Boolean(vehicle.hasRentalCondition);
                  const isSelected = selectedIds.includes(vehicle.id);
                  const minAge = vehicle.rentalConditionMinAge ?? 21;
                  const drivingYears = vehicle.rentalConditionRequireDrivingYears ?? 1;
                  const reqLicense = vehicle.rentalConditionRequiredLicenseClass || (vehicle.transmission === 'MANUAL' ? 'B2' : 'B1');
                  const minTrips = vehicle.rentalConditionMinCompletedTrips ?? 0;
                  const reqKyc = Boolean(vehicle.rentalConditionRequireVerifiedKyc);

                  return (
                    <tr
                      key={vehicle.id}
                      className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="px-3.5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(vehicle.id)}
                          className="text-slate-400 hover:text-blue-900 transition"
                        >
                          {isSelected ? <CheckSquare size={16} className="text-blue-900" /> : <Square size={16} />}
                        </button>
                      </td>

                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="license-plate text-[11px] px-2 py-0.5 shrink-0">
                            {vehicle.licensePlate}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-zinc-950">{vehicle.make} {vehicle.model}</div>
                            <div className="text-[11px] text-slate-500">
                              {vehicle.seats} chỗ • {vehicle.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3.5 py-3 whitespace-nowrap text-center">
                        <div className="font-bold text-zinc-950 tabular-nums">
                          ≥ {minAge} tuổi • ≥ {drivingYears} năm lái
                        </div>
                      </td>

                      <td className="px-3.5 py-3 whitespace-nowrap text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold text-[11px]">
                            GPLX {reqLicense}+
                          </span>
                          {minTrips > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold text-[10px]">
                              <Award size={10} /> ≥{minTrips} chuyến
                            </span>
                          )}
                          {reqKyc && (
                            <span
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[10px]"
                              title="Khách hàng bắt buộc phải được duyệt KYC trước khi đặt xe này"
                            >
                              <Lock size={10} className="text-amber-700" /> Bắt buộc KYC
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3.5 py-3 whitespace-nowrap text-center">
                        {isCustom ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Tùy chỉnh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            Mặc định hệ thống
                          </span>
                        )}
                      </td>

                      <td className="px-3.5 py-3 whitespace-nowrap text-right text-xs font-medium space-x-1.5">
                        {isCustom ? (
                          <>
                            <button
                              onClick={() => openEditModal(vehicle)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition"
                            >
                              <Edit2 size={13} /> Sửa
                            </button>
                            <button
                              onClick={() => setDeleteModal(vehicle)}
                              className="inline-flex items-center p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Xóa tùy chỉnh (quay về Mặc định hệ thống)"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openAddModal(vehicle)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F172A] rounded-md hover:bg-[#1D4ED8] transition shadow-2xs"
                          >
                            <Settings size={13} /> Tùy chỉnh
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-xs text-slate-400">
                    Không tìm thấy xe phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setup / Edit / Bulk Apply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-2xs" onClick={() => !modalSaving && setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 z-10 border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  {modalMode === 'bulk'
                    ? `Áp dụng điều kiện hàng loạt (${selectedIds.length} xe)`
                    : modalMode === 'add'
                      ? 'Thiết lập điều kiện thuê riêng'
                      : 'Chỉnh sửa điều kiện thuê'}
                </h3>
                {currentVehicle && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Xe: <strong className="text-zinc-900">{currentVehicle.make} {currentVehicle.model}</strong> ({currentVehicle.licensePlate})
                  </p>
                )}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-zinc-950 p-1">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center rounded-md">
                <AlertCircle size={15} className="mr-2 shrink-0 text-rose-600" /> {modalError}
              </div>
            )}

            {modalLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <RefreshCw className="animate-spin text-[#0F172A] mb-2" size={22} />
                <p className="text-xs text-slate-500">Đang tải cấu hình...</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {/* 3 Quick Presets */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <Sparkles size={13} className="text-blue-700" />
                    <span>Chọn nhanh cấu hình mẫu (Preset)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {CONDITION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-400 text-left transition cursor-pointer"
                      >
                        <div className="text-xs font-extrabold text-zinc-950">{preset.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{preset.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numeric Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tuổi tối thiểu</label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      name="minAge"
                      value={formData.minAge}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums"
                      placeholder="VD: 21"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kinh nghiệm lái (Năm)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      name="requireDrivingYears"
                      value={formData.requireDrivingYears}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums"
                      placeholder="VD: 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hạng GPLX tối thiểu</label>
                    <select
                      name="requiredLicenseClass"
                      value={formData.requiredLicenseClass}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-[#0F172A] text-xs font-semibold"
                    >
                      <option value="B1">Hạng B1 (Số tự động & phổ thông)</option>
                      <option value="B2">Hạng B2 (Số sàn / Cao cấp)</option>
                      <option value="C">Hạng C trở lên</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số chuyến hoàn tất tối thiểu</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="minCompletedTrips"
                      value={formData.minCompletedTrips}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums"
                      placeholder="VD: 0"
                    />
                  </div>
                </div>

                {/* Require Verified KYC Toggle */}
                <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                  formData.requireVerifiedKyc
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}>
                  <div className="flex items-start gap-2.5 pr-3">
                    <Lock size={15} className={`mt-0.5 shrink-0 ${formData.requireVerifiedKyc ? 'text-amber-700' : 'text-slate-400'}`} />
                    <div>
                      <span className="block text-xs font-bold text-zinc-950">
                        Bắt buộc đã duyệt KYC trước khi đặt
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        Chặn ngay khách chưa xác minh CCCD/GPLX thành công trên hệ thống (khuyến nghị cho xe cao cấp & siêu xe).
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="requireVerifiedKyc"
                    checked={Boolean(formData.requireVerifiedKyc)}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 shrink-0"
                  />
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quy định khác kèm theo</label>
                  <textarea
                    name="otherConditions"
                    value={formData.otherConditions}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs"
                    placeholder="Các điều kiện bổ sung (VD: Không hút thuốc, mang giấy tờ bản gốc)..."
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={modalSaving}
                    className={`inline-flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-md text-xs font-semibold shadow-sm transition ${
                      modalSaving ? 'opacity-70' : 'hover:bg-[#1D4ED8]'
                    }`}
                  >
                    {modalSaving ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />}
                    {modalMode === 'bulk' ? `Áp dụng cho ${selectedIds.length} xe` : 'Lưu điều kiện'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Reset to System Default) */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteModal(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 z-10 text-center border border-slate-200">
            <AlertCircle size={40} className="mx-auto text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-zinc-950 mb-1.5">Đưa về Mặc định hệ thống?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Bạn có chắc muốn xóa bộ điều kiện tùy chỉnh của xe <span className="font-mono font-bold text-zinc-950">{deleteModal.licensePlate}</span> để áp dụng lại chuẩn mặc định hệ thống không?
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-70 shadow-sm"
              >
                {deleteLoading ? 'Đang xử lý...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliciesPage;
