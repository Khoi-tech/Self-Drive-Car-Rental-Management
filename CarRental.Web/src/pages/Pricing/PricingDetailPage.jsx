import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Save,
  X,
  Calculator,
  CheckCircle,
  Sparkles,
  Info,
  AlertTriangle,
  BatteryCharging,
  Fuel
} from 'lucide-react';
import vehicleService from '../../services/vehicleService';
import pricingService from '../../services/pricingService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrencyVND } from '../../utils/formatters';

const DEFAULT_PRICING_DEFAULTS = {
  defaultExtraKmRate: 5000,
  fuelTolerancePercent: 3,
  vietQrDiscountPercent: 5
};

const PricingDetailPage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { isManagement } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [pricingDefaults, setPricingDefaults] = useState(DEFAULT_PRICING_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Policy Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [modalForm, setModalForm] = useState({ minDays: 1, discountPercentage: 0, holidaySurcharge: 0 });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [applyingStandard, setApplyingStandard] = useState(false);

  // Base Rate Modal State (Khối A)
  const [isBaseRateModalOpen, setIsBaseRateModalOpen] = useState(false);
  const [baseRateForm, setBaseRateForm] = useState({ dailyRate: '', depositAmount: '' });
  const [baseRateSaving, setBaseRateSaving] = useState(false);
  const [baseRateError, setBaseRateError] = useState(null);

  // Config Modals State (Khối B & C)
  const [isKmModalOpen, setIsKmModalOpen] = useState(false);
  const [kmForm, setKmForm] = useState({ includedKmPerDay: '', extraKmRate: '' });
  const [kmSaving, setKmSaving] = useState(false);

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ fuelReturnPolicy: 'SAME_LEVEL' });
  const [fuelSaving, setFuelSaving] = useState(false);

  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Preview State
  const [previewDays, setPreviewDays] = useState('');
  const [previewIsHoliday, setPreviewIsHoliday] = useState(false);
  const [previewIsVietQr, setPreviewIsVietQr] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [vehicleData, policiesData, defaultsData] = await Promise.all([
        vehicleService.getVehicleById(vehicleId),
        pricingService.getPoliciesByVehicleId(vehicleId),
        pricingService.getPricingDefaults().catch(() => null)
      ]);
      setVehicle(vehicleData?.data || vehicleData);
      const list = Array.isArray(policiesData)
        ? policiesData
        : (policiesData?.data ?? policiesData?.items ?? []);
      setPolicies(list);
      if (defaultsData) {
        const d = defaultsData?.data || defaultsData;
        setPricingDefaults({
          defaultExtraKmRate: Number(d.defaultExtraKmRate ?? 5000),
          fuelTolerancePercent: Number(d.fuelTolerancePercent ?? 3),
          vietQrDiscountPercent: Number(d.vietQrDiscountPercent ?? 5)
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Không tìm thấy xe.');
      } else {
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải thông tin.');
      }
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Preview logic
  const handlePreview = useCallback(async (days, isHoliday = previewIsHoliday, isVietQrPrepaid = previewIsVietQr) => {
    if (!days || isNaN(days) || Number(days) < 1) {
      setPreviewResult(null);
      return;
    }
    try {
      setPreviewLoading(true);
      const res = await pricingService.previewPricing(vehicleId, Number(days), {
        isHoliday,
        isVietQrPrepaid
      });
      setPreviewResult(res?.data || res);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  }, [vehicleId, previewIsHoliday, previewIsVietQr]);

  const onPreviewDaysChange = (e) => {
    const v = e.target.value;
    setPreviewDays(v);
    if (v) handlePreview(v, previewIsHoliday, previewIsVietQr);
    else setPreviewResult(null);
  };

  const onTogglePreviewHoliday = (e) => {
    const checked = e.target.checked;
    setPreviewIsHoliday(checked);
    if (previewDays) handlePreview(previewDays, checked, previewIsVietQr);
  };

  const onTogglePreviewVietQr = (e) => {
    const checked = e.target.checked;
    setPreviewIsVietQr(checked);
    if (previewDays) handlePreview(previewDays, previewIsHoliday, checked);
  };

  // Helper build vehicle update payload keeping all untouched fields
  const buildVehicleUpdatePayload = (overrides = {}) => ({
    seats: vehicle.seats,
    transmission: vehicle.transmission,
    dailyRate: vehicle.dailyRate,
    depositAmount: vehicle.depositAmount,
    currentMileage: vehicle.currentMileage,
    nextMaintenanceDate: vehicle.nextMaintenanceDate,
    nextMaintenanceMileage: vehicle.nextMaintenanceMileage,
    pickupLocation: vehicle.pickupLocation,
    imageUrl: vehicle.imageUrl,
    mileageLimit: vehicle.mileageLimit,
    extraKmRate: vehicle.extraKmRate,
    fuelReturnPolicy: vehicle.fuelReturnPolicy,
    ...overrides
  });

  // Khối A: Base Rate Modal Handlers
  const openBaseRateModal = () => {
    setBaseRateForm({
      dailyRate: vehicle.dailyRate ?? '',
      depositAmount: vehicle.depositAmount ?? ''
    });
    setBaseRateError(null);
    setIsBaseRateModalOpen(true);
  };

  const handleSaveBaseRate = async (e) => {
    e.preventDefault();
    setBaseRateError(null);

    const dailyRateNum = Number(baseRateForm.dailyRate);
    const depositNum = Number(baseRateForm.depositAmount);

    if (!baseRateForm.dailyRate || isNaN(dailyRateNum) || dailyRateNum <= 0) {
      setBaseRateError('Giá thuê tiêu chuẩn / ngày phải lớn hơn 0.');
      return;
    }
    if (baseRateForm.depositAmount === '' || isNaN(depositNum) || depositNum < 0) {
      setBaseRateError('Tiền thế chân / cọc không hợp lệ.');
      return;
    }

    try {
      setBaseRateSaving(true);
      const payload = buildVehicleUpdatePayload({
        dailyRate: dailyRateNum,
        depositAmount: depositNum
      });
      await vehicleService.updateVehicle(vehicleId, payload);
      setSuccessMsg('Đã cập nhật giá thuê cơ bản và tiền cọc.');
      setIsBaseRateModalOpen(false);
      await fetchData();
      if (previewDays) handlePreview(previewDays, previewIsHoliday, previewIsVietQr);
    } catch (err) {
      setBaseRateError(err.response?.data?.message || 'Lỗi cập nhật giá thuê cơ bản.');
    } finally {
      setBaseRateSaving(false);
    }
  };

  // Khối D: Policy Modal Handlers
  const openAddModal = () => {
    setModalMode('add');
    setModalForm({ minDays: 1, discountPercentage: 0, holidaySurcharge: 20 });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (policy) => {
    setModalMode('edit');
    setCurrentPolicy(policy);
    setModalForm({
      minDays: policy.minDays,
      discountPercentage: policy.discountPercentage,
      holidaySurcharge: policy.holidaySurcharge
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalForm(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    if (modalForm.minDays < 1) {
      setModalError('Số ngày tối thiểu phải lớn hơn hoặc bằng 1.');
      setModalSaving(false);
      return;
    }
    if (modalForm.discountPercentage < 0 || modalForm.discountPercentage > 100) {
      setModalError('Phần trăm giảm giá phải từ 0 đến 100.');
      setModalSaving(false);
      return;
    }
    if (modalForm.holidaySurcharge < 0 || modalForm.holidaySurcharge > 100) {
      setModalError('Phần trăm phụ thu lễ phải từ 0 đến 100.');
      setModalSaving(false);
      return;
    }

    const duplicate = policies.find(
      p => p.minDays === modalForm.minDays && (modalMode === 'add' || p.id !== currentPolicy?.id)
    );
    if (duplicate) {
      setModalError(`Đã tồn tại chính sách cho từ ${modalForm.minDays} ngày.`);
      setModalSaving(false);
      return;
    }

    try {
      if (modalMode === 'add') {
        await pricingService.createPolicy(vehicleId, modalForm);
        setSuccessMsg('Đã thêm chính sách mới.');
      } else {
        await pricingService.updatePolicy(vehicleId, currentPolicy.id, modalForm);
        setSuccessMsg('Đã cập nhật chính sách.');
      }
      setIsModalOpen(false);
      await fetchData();
      if (previewDays) handlePreview(previewDays, previewIsHoliday, previewIsVietQr);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Lỗi lưu chính sách.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleApplyStandardPackage = async () => {
    try {
      setApplyingStandard(true);
      setError(null);
      await pricingService.applyStandardPackage(vehicleId);
      setSuccessMsg('Đã áp dụng gói chuẩn VELORA (≥ 3 ngày: -5%, ≥ 7 ngày: -10%, ≥ 30 ngày: -20%, phụ thu lễ +20%).');
      await fetchData();
      if (previewDays) handlePreview(previewDays, previewIsHoliday, previewIsVietQr);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi áp dụng gói chuẩn VELORA.');
    } finally {
      setApplyingStandard(false);
    }
  };

  // Khối B: Km Config Handlers
  const openKmModal = () => {
    setKmForm({
      includedKmPerDay: vehicle.mileageLimit ?? '',
      extraKmRate: vehicle.extraKmRate ?? ''
    });
    setIsKmModalOpen(true);
  };

  const handleSaveKm = async (e) => {
    e.preventDefault();
    setKmSaving(true);

    if (kmForm.includedKmPerDay !== '' && Number(kmForm.includedKmPerDay) < 0) {
      setError('Km miễn phí không hợp lệ.');
      setKmSaving(false);
      return;
    }
    if (kmForm.extraKmRate !== '' && Number(kmForm.extraKmRate) < 0) {
      setError('Phí vượt km không hợp lệ.');
      setKmSaving(false);
      return;
    }

    try {
      const payload = buildVehicleUpdatePayload({
        mileageLimit: kmForm.includedKmPerDay === '' ? null : Number(kmForm.includedKmPerDay),
        extraKmRate: kmForm.extraKmRate === '' || Number(kmForm.extraKmRate) === 0 ? null : Number(kmForm.extraKmRate)
      });
      await vehicleService.updateVehicle(vehicleId, payload);
      setSuccessMsg('Đã cập nhật chính sách hạn mức km.');
      setIsKmModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi cập nhật chính sách km.');
      setIsKmModalOpen(false);
    } finally {
      setKmSaving(false);
    }
  };

  // Khối C: Fuel / Battery Config Handlers
  const openFuelModal = () => {
    setFuelForm({ fuelReturnPolicy: vehicle.fuelReturnPolicy || 'SAME_LEVEL' });
    setIsFuelModalOpen(true);
  };

  const handleSaveFuel = async (e) => {
    e.preventDefault();
    setFuelSaving(true);
    try {
      const payload = buildVehicleUpdatePayload({
        fuelReturnPolicy: fuelForm.fuelReturnPolicy
      });
      await vehicleService.updateVehicle(vehicleId, payload);
      setSuccessMsg(
        String(vehicle.fuelType || '').toUpperCase() === 'ELECTRIC'
          ? 'Đã cập nhật chính sách pin khi trả.'
          : 'Đã cập nhật chính sách nhiên liệu khi trả.'
      );
      setIsFuelModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi cập nhật chính sách nhiên liệu/pin.');
      setIsFuelModalOpen(false);
    } finally {
      setFuelSaving(false);
    }
  };

  const openDeleteModal = (policy) => {
    setDeleteModal(policy);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleteLoading(true);
      await pricingService.deletePolicy(vehicleId, deleteModal.id);
      setSuccessMsg('Đã xóa chính sách.');
      setDeleteModal(null);
      await fetchData();
      if (previewDays) handlePreview(previewDays, previewIsHoliday, previewIsVietQr);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi xóa chính sách.');
      setDeleteModal(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500">
        <RefreshCw className="animate-spin mb-3" size={32} />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="bg-red-50 p-6 rounded-md flex items-start mt-4">
        <AlertCircle className="text-red-500 mr-3 mt-0.5" size={24} />
        <div>
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={() => navigate('/admin/pricing')} className="mt-3 text-sm text-red-700 hover:underline">
            Quay lại bảng giá
          </button>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  const isElectric = String(vehicle.fuelType || '').toUpperCase() === 'ELECTRIC';
  const hasCustomExtraKmRate = vehicle.extraKmRate !== null && vehicle.extraKmRate !== undefined && Number(vehicle.extraKmRate) > 0;
  const effectiveExtraKmRate = hasCustomExtraKmRate ? Number(vehicle.extraKmRate) : pricingDefaults.defaultExtraKmRate;
  const currentFuelPolicy = vehicle.fuelReturnPolicy || 'SAME_LEVEL';

  const getFuelPolicyDisplayLabel = (policyCode) => {
    if (policyCode === 'FULL_TO_FULL') {
      return isElectric ? 'Đầy pin 100% (FULL_TO_FULL)' : 'Đầy bình (FULL_TO_FULL)';
    }
    return isElectric ? 'Bằng mức pin (%) lúc bàn giao' : 'Bằng mức vạch xăng/dầu lúc bàn giao';
  };

  // Safe fallback calculations if backend ever omits breakdown fields
  const previewBaseSubtotal = previewResult
    ? (previewResult.baseSubtotal ?? (previewResult.basePrice * previewResult.rentalDays))
    : 0;
  const previewDiscountAmt = previewResult
    ? (previewResult.discountAmount ?? Math.round(previewBaseSubtotal * ((previewResult.discountPercentage || 0) / 100)))
    : 0;
  const previewHolidayAmt = previewResult
    ? (previewResult.holidaySurchargeAmount ?? Math.round(previewBaseSubtotal * ((previewResult.holidaySurcharge || 0) / 100)))
    : 0;
  const previewVietQrAmt = previewResult
    ? (previewResult.vietQrDiscountAmount ?? 0)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/admin/pricing')} className="p-2 text-slate-500 hover:text-zinc-950 bg-white border border-slate-200 rounded-md shadow-sm transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Biểu Phí & Chính Sách Giá</h1>
            <span className="license-plate text-xs px-2.5 py-0.5">
              {vehicle.licensePlate}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {vehicle.make} {vehicle.model} • {vehicle.seats} chỗ • {vehicle.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'} • {isElectric ? 'Xe điện (EV)' : (vehicle.fuelType === 'DIESEL' ? 'Dầu Diesel' : 'Xe xăng')}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md flex items-center">
          <CheckCircle className="text-emerald-600 mr-2.5 shrink-0" size={18} />
          <p className="text-emerald-800 text-xs font-medium">{successMsg}</p>
        </div>
      )}

      {error && vehicle && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-md flex items-center">
          <AlertCircle className="text-rose-600 mr-2.5 shrink-0" size={18} />
          <p className="text-rose-800 text-xs font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Fixed Configs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Khối A: Giá Thuê Cơ Bản */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">A. Giá Thuê Cơ Bản</h3>
              {isManagement && (
                <button
                  onClick={openBaseRateModal}
                  className="text-xs font-semibold text-[#0F172A] hover:text-[#1D4ED8] transition-colors"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Giá thuê tiêu chuẩn / ngày</label>
                <div className="font-bold text-base text-zinc-950 font-mono tabular-nums mt-1">{formatCurrencyVND(vehicle.dailyRate)}</div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tiền thế chân / cọc</label>
                <div className="font-bold text-base text-zinc-950 font-mono tabular-nums mt-1">{formatCurrencyVND(vehicle.depositAmount)}</div>
              </div>
            </div>
          </div>

          {/* Khối B: Hạn Mức Kilomet (ODO) */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">B. Hạn Mức Kilomet (ODO)</h3>
              {isManagement && (
                <button onClick={openKmModal} className="text-xs font-semibold text-[#0F172A] hover:text-[#1D4ED8] transition-colors">
                  Chỉnh sửa
                </button>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hạn mức ODO / ngày</label>
                <div className="font-mono text-xs font-semibold text-zinc-950 tabular-nums mt-1">
                  {vehicle.mileageLimit ? `${vehicle.mileageLimit.toLocaleString()} km` : 'Không giới hạn'}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Đơn giá phụ thu vượt km</label>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-semibold text-zinc-950 tabular-nums">
                    {formatCurrencyVND(effectiveExtraKmRate)} / km
                  </span>
                  {!hasCustomExtraKmRate && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                      Mặc định hệ thống
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Khối C: Nhiên Liệu / Pin Khi Trả */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                {isElectric ? <BatteryCharging size={14} className="text-emerald-600" /> : <Fuel size={14} className="text-slate-600" />}
                {isElectric ? 'C. Pin Khi Trả' : 'C. Nhiên Liệu Khi Trả'}
              </h3>
              {isManagement && (
                <button onClick={openFuelModal} className="text-xs font-semibold text-[#0F172A] hover:text-[#1D4ED8] transition-colors">
                  Chỉnh sửa
                </button>
              )}
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {isElectric ? 'Quy chuẩn mức pin (%)' : 'Mức vạch xăng/dầu'}
                </label>
                <div className="text-xs font-bold text-zinc-950 mt-1">
                  {getFuelPolicyDisplayLabel(currentFuelPolicy)}
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] text-slate-600 leading-relaxed">
                <Info size={14} className="text-blue-700 shrink-0 mt-0.5" />
                <span>
                  Dung sai miễn phạt đang áp dụng: <strong className="text-zinc-950">{pricingDefaults.fuelTolerancePercent}%</strong> (tính theo mốc thực tế lúc giao cho khách).
                </span>
              </div>

              {currentFuelPolicy === 'FULL_TO_FULL' && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 leading-relaxed">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Lưu ý: Với đơn giao xe tận nơi, hệ thống vẫn ưu tiên đối chiếu theo mức thực tế lúc giao khách (<code className="font-mono text-[10px] bg-amber-100/80 px-1 rounded">handover_fuel_level</code>) để tránh phạt oan chặng trung chuyển.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Policies & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Khối D: Chính Sách Chiết Khấu Theo Ngày */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">D. Chính Sách Chiết Khấu Theo Ngày & Phụ Thu Lễ</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Giảm giá lũy tiến cho khách thuê dài hạn và phụ thu dịp Lễ/Tết</p>
              </div>
              {isManagement && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyStandardPackage}
                    disabled={applyingStandard}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 hover:bg-blue-100 transition-colors shadow-xs disabled:opacity-60"
                    title="Tự động tạo/cập nhật 3 bậc chuẩn: ≥3 ngày -5%, ≥7 ngày -10%, ≥30 ngày -20%, lễ +20%"
                  >
                    {applyingStandard ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Áp dụng gói chuẩn VELORA
                  </button>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F172A] rounded-md px-3 py-1.5 hover:bg-[#1D4ED8] transition-colors shadow-sm"
                  >
                    <Plus size={14} /> Thêm chính sách
                  </button>
                </div>
              )}
            </div>
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-white text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left">Thời gian thuê</th>
                  <th className="px-5 py-3 text-left">Chiết khấu (%)</th>
                  <th className="px-5 py-3 text-left">Phụ thu ngày lễ (%)</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {policies.length > 0 ? policies.map(policy => (
                  <tr key={policy.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-zinc-950">
                      Từ {policy.minDays} ngày trở lên
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold font-mono text-emerald-700 tabular-nums">
                      -{policy.discountPercentage}%
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold font-mono text-amber-700 tabular-nums">
                      +{policy.holidaySurcharge}%
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                      {isManagement && (
                        <>
                          <button onClick={() => openEditModal(policy)} className="text-slate-600 hover:text-zinc-950 mr-3" title="Chỉnh sửa">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => openDeleteModal(policy)} className="text-rose-600 hover:text-rose-800" title="Xóa">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-xs">
                      Chưa có chính sách ưu đãi ngày thuê nào. Bấm <strong>"Áp dụng gói chuẩn VELORA"</strong> để khởi tạo nhanh 3 bậc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Công Cụ Ước Tính Giá Thuê (Pricing Preview) */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center bg-white">
              <Calculator size={16} className="text-[#0F172A] mr-2" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Công Cụ Ước Tính Giá Thuê</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Số ngày thuê dự kiến</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={previewDays}
                      onChange={onPreviewDaysChange}
                      className="block w-full px-3.5 py-2 border border-slate-200 rounded-md bg-white text-xs text-zinc-950 focus:outline-none focus:border-[#0F172A] tabular-nums font-mono"
                      placeholder="Nhập số ngày (VD: 1, 3, 7, 30)..."
                    />
                    {previewLoading && <RefreshCw size={15} className="absolute right-3 top-2.5 animate-spin text-slate-400" />}
                  </div>
                </div>

                {/* 2 Checkboxes: Dịp Lễ/Tết & Trả trước VietQR */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-md bg-white border border-slate-200 hover:border-slate-300 transition">
                    <input
                      type="checkbox"
                      checked={previewIsHoliday}
                      onChange={onTogglePreviewHoliday}
                      className="w-4 h-4 rounded border-slate-300 text-[#0F172A] focus:ring-[#0F172A]"
                    />
                    <span className="text-xs font-medium text-slate-700">Áp dụng dịp Lễ/Tết</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-md bg-white border border-slate-200 hover:border-slate-300 transition">
                    <input
                      type="checkbox"
                      checked={previewIsVietQr}
                      onChange={onTogglePreviewVietQr}
                      className="w-4 h-4 rounded border-slate-300 text-[#0F172A] focus:ring-[#0F172A]"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Trả trước VietQR <span className="text-blue-700 font-semibold">(giảm {pricingDefaults.vietQrDiscountPercent}%)</span>
                    </span>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Thuật toán tự động chọn bậc chiết khấu cao nhất phù hợp với số ngày thuê và áp dụng phụ thu lễ nhất quán kể cả đơn 1–2 ngày.
                </p>
              </div>

              {previewResult ? (
                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">
                      Giá gốc ({previewResult.rentalDays} ngày × {formatCurrencyVND(previewResult.basePrice)}):
                    </span>
                    <span className="font-bold text-zinc-950 font-mono tabular-nums">{formatCurrencyVND(previewBaseSubtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">
                      Chiết khấu dài ngày ({previewResult.selectedMinDays ? `≥ ${previewResult.selectedMinDays} ngày • -${previewResult.discountPercentage}%` : 'Mặc định 0%'}):
                    </span>
                    <span className={`font-bold font-mono tabular-nums ${previewDiscountAmt > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {previewDiscountAmt > 0 ? `-${formatCurrencyVND(previewDiscountAmt)}` : '0 ₫'}
                    </span>
                  </div>

                  {(previewIsHoliday || previewHolidayAmt > 0) && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">
                        Phụ thu dịp Lễ/Tết (+{previewResult.holidaySurcharge || 0}%):
                      </span>
                      <span className={`font-bold font-mono tabular-nums ${previewHolidayAmt > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {previewHolidayAmt > 0 ? `+${formatCurrencyVND(previewHolidayAmt)}` : '0 ₫'}
                      </span>
                    </div>
                  )}

                  {(previewIsVietQr || previewVietQrAmt > 0) && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">
                        Ưu đãi trả trước VietQR (-{previewResult.vietQrDiscountPercentage || pricingDefaults.vietQrDiscountPercent}%):
                      </span>
                      <span className={`font-bold font-mono tabular-nums ${previewVietQrAmt > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                        {previewVietQrAmt > 0 ? `-${formatCurrencyVND(previewVietQrAmt)}` : '0 ₫'}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-600">Đơn giá thực tế / ngày:</span>
                    <span className="text-xs font-bold text-zinc-950 font-mono tabular-nums">{formatCurrencyVND(previewResult.adjustedDailyPrice)}</span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 mt-1">
                    <span className="text-xs font-bold text-zinc-950">Tổng tiền dự kiến ({previewResult.rentalDays} ngày):</span>
                    <span className="text-base font-bold text-[#0F172A] font-mono tabular-nums">{formatCurrencyVND(previewResult.rentalPrice)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white/70 border border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center text-xs text-slate-400">
                  <Calculator size={24} className="mb-2 text-slate-300" />
                  Nhập số ngày thuê dự kiến ở bên trái để xem bảng bóc tách chi phí.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Base Rate Modal (Khối A) */}
      {isBaseRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !baseRateSaving && setIsBaseRateModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 border border-slate-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-zinc-950">Chỉnh sửa giá thuê cơ bản</h3>
              <button onClick={() => setIsBaseRateModalOpen(false)} className="text-slate-400 hover:text-zinc-950">
                <X size={18} />
              </button>
            </div>

            {baseRateError && (
              <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-700 flex items-center">
                <AlertCircle size={15} className="mr-2 shrink-0" /> {baseRateError}
              </div>
            )}

            <form onSubmit={handleSaveBaseRate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giá thuê tiêu chuẩn / ngày</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="1000"
                    step="1000"
                    value={baseRateForm.dailyRate}
                    onChange={e => setBaseRateForm({ ...baseRateForm, dailyRate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums pr-14"
                    placeholder="VD: 1200000"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-xs">VNĐ</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiền thế chân / cọc</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="0"
                    step="100000"
                    value={baseRateForm.depositAmount}
                    onChange={e => setBaseRateForm({ ...baseRateForm, depositAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums pr-14"
                    placeholder="VD: 15000000"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-xs">VNĐ</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsBaseRateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={baseRateSaving}
                  className={`inline-flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-md text-xs font-semibold shadow-sm transition ${baseRateSaving ? 'opacity-70' : 'hover:bg-[#1D4ED8]'}`}
                >
                  {baseRateSaving ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />} Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Policy Modal (Khối D) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !modalSaving && setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 border border-slate-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-zinc-950">{modalMode === 'add' ? 'Thêm chính sách giá' : 'Sửa chính sách giá'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-zinc-950">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-700 flex items-center">
                <AlertCircle size={16} className="mr-2 shrink-0" /> {modalError}
              </div>
            )}

            <form onSubmit={handleSavePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Áp dụng từ (Ngày)</label>
                <input
                  required
                  type="number"
                  min="1"
                  name="minDays"
                  value={modalForm.minDays}
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chiết khấu thuê dài ngày (%)</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  name="discountPercentage"
                  value={modalForm.discountPercentage}
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phụ thu dịp Lễ/Tết (%)</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  name="holidaySurcharge"
                  value={modalForm.holidaySurcharge}
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                  Phụ thu lễ áp dụng nhất quán cho cả đơn thuê ngắn ngày (1–2 ngày): nếu xe chưa có bậc riêng từ 1 ngày, hệ thống tự kế thừa mức phụ thu lễ từ bậc thấp nhất có cấu hình.
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition">
                  Hủy
                </button>
                <button type="submit" disabled={modalSaving} className={`inline-flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-md text-xs font-semibold shadow-sm transition ${modalSaving ? 'opacity-70' : 'hover:bg-[#1D4ED8]'}`}>
                  {modalSaving ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />} Lưu chính sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteModal(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 z-10 text-center border border-slate-200">
            <AlertCircle size={40} className="mx-auto text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-zinc-950 mb-1.5">Xác nhận xóa</h3>
            <p className="text-xs text-slate-500 mb-6">Bạn có chắc muốn xóa chính sách từ {deleteModal.minDays} ngày?</p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition">Hủy</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-4 py-2 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-70 shadow-sm">
                {deleteLoading ? 'Đang xóa...' : 'Xóa chính sách'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Km Policy Modal (Khối B) */}
      {isKmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !kmSaving && setIsKmModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 border border-slate-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-zinc-950">Cấu hình hạn mức Kilomet (ODO)</h3>
              <button onClick={() => setIsKmModalOpen(false)} className="text-slate-400 hover:text-zinc-950">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveKm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Km miễn phí / ngày</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={kmForm.includedKmPerDay}
                    onChange={e => setKmForm({ ...kmForm, includedKmPerDay: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums pr-12"
                    placeholder="Để trống = Không giới hạn"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-xs">km</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn giá phụ thu vượt km</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={kmForm.extraKmRate}
                    onChange={e => setKmForm({ ...kmForm, extraKmRate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums pr-16"
                    placeholder={`Mặc định: ${pricingDefaults.defaultExtraKmRate}`}
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-xs">đ/km</span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Để trống nếu muốn dùng mức mặc định hệ thống (<strong>{formatCurrencyVND(pricingDefaults.defaultExtraKmRate)}/km</strong>).
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsKmModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition">
                  Hủy
                </button>
                <button type="submit" disabled={kmSaving} className={`inline-flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-md text-xs font-semibold shadow-sm transition ${kmSaving ? 'opacity-70' : 'hover:bg-[#1D4ED8]'}`}>
                  {kmSaving ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />} Lưu thiết lập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fuel / Battery Policy Modal (Khối C) */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !fuelSaving && setIsFuelModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 border border-slate-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-zinc-950">
                {isElectric ? 'Chính sách pin khi trả xe' : 'Chính sách nhiên liệu khi trả xe'}
              </h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-zinc-950">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFuel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isElectric ? 'Quy chuẩn mức pin (%) khi trả xe' : 'Mức nhiên liệu khi trả xe'}
                </label>
                <select
                  value={fuelForm.fuelReturnPolicy}
                  onChange={e => setFuelForm({ ...fuelForm, fuelReturnPolicy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] bg-white text-xs"
                >
                  <option value="SAME_LEVEL">
                    {isElectric
                      ? 'Cùng mức pin (%) lúc nhận — Khuyến nghị (SAME_LEVEL)'
                      : 'Cùng mức vạch lúc nhận — Khuyến nghị (SAME_LEVEL)'}
                  </option>
                  <option value="FULL_TO_FULL">
                    {isElectric ? 'Đầy pin 100% (FULL_TO_FULL)' : 'Đầy bình (FULL_TO_FULL)'}
                  </option>
                </select>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 leading-relaxed">
                <Info size={14} className="text-blue-700 shrink-0 mt-0.5" />
                <span>
                  Dung sai miễn phạt đang áp dụng: <strong className="text-zinc-950">{pricingDefaults.fuelTolerancePercent}%</strong> (tính theo mốc thực tế lúc giao cho khách).
                </span>
              </div>

              {fuelForm.fuelReturnPolicy === 'FULL_TO_FULL' && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 leading-relaxed">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Lưu ý: Với đơn giao xe tận nơi, hệ thống vẫn ưu tiên đối chiếu theo mức thực tế lúc giao khách (<code className="font-mono text-[10px] bg-amber-100/80 px-1 rounded">handover_fuel_level</code>) để tránh phạt oan chặng trung chuyển.
                  </span>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsFuelModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition">
                  Hủy
                </button>
                <button type="submit" disabled={fuelSaving} className={`inline-flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-md text-xs font-semibold shadow-sm transition ${fuelSaving ? 'opacity-70' : 'hover:bg-[#1D4ED8]'}`}>
                  {fuelSaving ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />} Lưu quy định
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingDetailPage;
