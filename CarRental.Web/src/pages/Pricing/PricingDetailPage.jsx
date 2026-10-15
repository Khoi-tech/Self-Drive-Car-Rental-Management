import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, RefreshCw, AlertCircle, Save, X, Calculator, CheckCircle } from 'lucide-react';
import vehicleService from '../../services/vehicleService';
import pricingService from '../../services/pricingService';
import { formatCurrencyVND } from '../../utils/formatters';

const PricingDetailPage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  
  const [vehicle, setVehicle] = useState(null);
  const [policies, setPolicies] = useState([]);
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

  // Config Modals State
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
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vehicleData, policiesData] = await Promise.all([
        vehicleService.getVehicleById(vehicleId),
        pricingService.getPoliciesByVehicleId(vehicleId)
      ]);
      setVehicle(vehicleData);
      setPolicies(policiesData);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Không tìm thấy xe.');
      } else {
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vehicleId]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Modal Handlers
  const openAddModal = () => {
    setModalMode('add');
    setModalForm({ minDays: 1, discountPercentage: 0, holidaySurcharge: 0 });
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

    // Validation
    if (modalForm.minDays < 1) {
      setModalError('Số ngày tối thiểu phải lớn hơn hoặc bằng 1.');
      setModalSaving(false); return;
    }
    if (modalForm.discountPercentage < 0 || modalForm.discountPercentage > 100) {
      setModalError('Phần trăm giảm giá phải từ 0 đến 100.');
      setModalSaving(false); return;
    }
    if (modalForm.holidaySurcharge < 0 || modalForm.holidaySurcharge > 100) {
      setModalError('Phần trăm phụ thu lễ phải từ 0 đến 100.');
      setModalSaving(false); return;
    }

    // Check duplicate minDays locally for better UX, though backend also checks
    const duplicate = policies.find(p => p.minDays === modalForm.minDays && (modalMode === 'add' || p.id !== currentPolicy?.id));
    if (duplicate) {
      setModalError(`Đã tồn tại chính sách cho từ ${modalForm.minDays} ngày.`);
      setModalSaving(false); return;
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
      fetchData(); // Reload
      
      // Auto-refresh preview if active
      if (previewDays) handlePreview(previewDays);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Lỗi lưu chính sách.');
    } finally {
      setModalSaving(false);
    }
  };

  // Config Handlers
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
    
    // validation
    if (kmForm.includedKmPerDay !== '' && Number(kmForm.includedKmPerDay) < 0) {
       setError('Km miễn phí không hợp lệ.'); setKmSaving(false); return;
    }
    if (kmForm.extraKmRate !== '' && Number(kmForm.extraKmRate) < 0) {
       setError('Phí vượt km không hợp lệ.'); setKmSaving(false); return;
    }

    try {
      const payload = {
        seats: vehicle.seats,
        transmission: vehicle.transmission,
        dailyRate: vehicle.dailyRate,
        depositAmount: vehicle.depositAmount,
        currentMileage: vehicle.currentMileage,
        nextMaintenanceDate: vehicle.nextMaintenanceDate,
        nextMaintenanceMileage: vehicle.nextMaintenanceMileage,
        pickupLocation: vehicle.pickupLocation,
        imageUrl: vehicle.imageUrl,
        fuelReturnPolicy: vehicle.fuelReturnPolicy, // Keep unchanged
        mileageLimit: kmForm.includedKmPerDay === '' ? null : Number(kmForm.includedKmPerDay),
        extraKmRate: kmForm.extraKmRate === '' ? null : Number(kmForm.extraKmRate),
      };
      await vehicleService.updateVehicle(vehicleId, payload);
      setSuccessMsg('Đã cập nhật chính sách km.');
      setIsKmModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi cập nhật chính sách km.');
      setIsKmModalOpen(false);
    } finally {
      setKmSaving(false);
    }
  };

  const openFuelModal = () => {
    setFuelForm({ fuelReturnPolicy: vehicle.fuelReturnPolicy || 'SAME_LEVEL' });
    setIsFuelModalOpen(true);
  };

  const handleSaveFuel = async (e) => {
    e.preventDefault();
    setFuelSaving(true);
    try {
      const payload = {
        seats: vehicle.seats,
        transmission: vehicle.transmission,
        dailyRate: vehicle.dailyRate,
        depositAmount: vehicle.depositAmount,
        currentMileage: vehicle.currentMileage,
        nextMaintenanceDate: vehicle.nextMaintenanceDate,
        nextMaintenanceMileage: vehicle.nextMaintenanceMileage,
        pickupLocation: vehicle.pickupLocation,
        imageUrl: vehicle.imageUrl,
        mileageLimit: vehicle.mileageLimit, // Keep unchanged
        extraKmRate: vehicle.extraKmRate,   // Keep unchanged
        fuelReturnPolicy: fuelForm.fuelReturnPolicy,
      };
      await vehicleService.updateVehicle(vehicleId, payload);
      setSuccessMsg('Đã cập nhật chính sách nhiên liệu.');
      setIsFuelModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi cập nhật chính sách nhiên liệu.');
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
      fetchData();
      if (previewDays) handlePreview(previewDays);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi xóa chính sách.');
      setDeleteModal(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Preview logic
  const handlePreview = async (days) => {
    if (!days || isNaN(days) || Number(days) < 1) {
      setPreviewResult(null);
      return;
    }
    try {
      setPreviewLoading(true);
      const res = await pricingService.previewPricing(vehicleId, Number(days));
      setPreviewResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const onPreviewDaysChange = (e) => {
    const v = e.target.value;
    setPreviewDays(v);
    if (v) handlePreview(v);
    else setPreviewResult(null);
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
          <p className="text-xs text-slate-500 mt-1">{vehicle.make} {vehicle.model} • {vehicle.seats} chỗ • {vehicle.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</p>
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
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">A. Giá Thuê Cơ Bản</h3>
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

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">B. Hạn Mức Kilomet (ODO)</h3>
              <button onClick={openKmModal} className="text-xs font-semibold text-[#0F172A] hover:text-[#1D4ED8]">Chỉnh sửa</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hạn mức ODO / ngày</label>
                <div className="font-mono text-xs font-semibold text-zinc-950 tabular-nums mt-1">{vehicle.mileageLimit ? `${vehicle.mileageLimit.toLocaleString()} km` : 'Không giới hạn'}</div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Đơn giá phụ thu vượt km</label>
                <div className="font-mono text-xs font-semibold text-zinc-950 tabular-nums mt-1">{vehicle.extraKmRate ? `${formatCurrencyVND(vehicle.extraKmRate)} / km` : 'Chưa cấu hình'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">C. Nhiên Liệu Khi Trả</h3>
              <button onClick={openFuelModal} className="text-xs font-semibold text-[#0F172A] hover:text-[#1D4ED8]">Chỉnh sửa</button>
            </div>
            <div className="p-5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Quy chuẩn mức xăng/dầu</label>
              <div className="text-xs font-bold text-zinc-950 mt-1">{vehicle.fuelReturnPolicy === 'SAME_LEVEL' ? 'Bằng mức vạch lúc bàn giao' : (vehicle.fuelReturnPolicy || 'Bằng mức vạch lúc bàn giao')}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Policies & Preview */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">D. Chính Sách Chiết Khấu Theo Ngày</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Giảm giá lũy tiến cho khách thuê dài hạn và phụ thu ngày lễ</p>
              </div>
              <button onClick={openAddModal} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F172A] rounded-md px-3 py-1.5 hover:bg-[#1D4ED8] transition-colors shadow-sm">
                <Plus size={14} /> Thêm chính sách
              </button>
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
                      <button onClick={() => openEditModal(policy)} className="text-slate-600 hover:text-zinc-950 mr-3" title="Chỉnh sửa">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => openDeleteModal(policy)} className="text-rose-600 hover:text-rose-800" title="Xóa">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-xs">Chưa có chính sách ưu đãi ngày thuê nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center bg-white">
              <Calculator size={16} className="text-[#0F172A] mr-2" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Công Cụ Ước Tính Giá Thuê</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Số ngày thuê dự kiến</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={previewDays}
                    onChange={onPreviewDaysChange}
                    className="block w-full px-3.5 py-2 border border-slate-200 rounded-md bg-white text-xs text-zinc-950 focus:outline-none focus:border-[#0F172A] tabular-nums font-mono"
                    placeholder="Nhập số ngày (VD: 3, 7, 30)..."
                  />
                  {previewLoading && <RefreshCw size={15} className="absolute right-3 top-2.5 animate-spin text-slate-400" />}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Thuật toán tự động áp dụng bậc chiết khấu cao nhất phù hợp với số ngày thuê.</p>
              </div>

              {previewResult && (
                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm space-y-2.5 relative">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Đơn giá gốc / ngày:</span>
                    <span className="font-bold text-zinc-950 font-mono tabular-nums">{formatCurrencyVND(previewResult.basePrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Chiết khấu bậc ({previewResult.selectedMinDays ? `≥ ${previewResult.selectedMinDays} ngày` : 'Mặc định'}):</span>
                    <span className="font-bold text-emerald-700 font-mono tabular-nums">-{previewResult.discountPercentage}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Phụ thu lễ tết:</span>
                    <span className="font-bold text-amber-700 font-mono tabular-nums">+{previewResult.holidaySurcharge}%</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-950">Giá thực tế / ngày:</span>
                    <span className="text-sm font-bold text-zinc-950 font-mono tabular-nums">{formatCurrencyVND(previewResult.adjustedDailyPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 mt-2">
                    <span className="text-xs font-bold text-zinc-950">Tổng thanh toán ({previewResult.rentalDays} ngày):</span>
                    <span className="text-base font-bold text-[#0F172A] font-mono tabular-nums">{formatCurrencyVND(previewResult.rentalPrice)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !modalSaving && setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-zinc-900">{modalMode === 'add' ? 'Thêm chính sách giá' : 'Sửa chính sách giá'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 flex items-center">
                <AlertCircle size={16} className="mr-2" /> {modalError}
              </div>
            )}

            <form onSubmit={handleSavePolicy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Áp dụng từ (Ngày)</label>
                <input required type="number" min="1" name="minDays" value={modalForm.minDays} onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Giảm giá (%)</label>
                <input required type="number" min="0" max="100" step="0.01" name="discountPercentage" value={modalForm.discountPercentage} onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Phụ thu lễ (%)</label>
                <input required type="number" min="0" max="100" step="0.01" name="holidaySurcharge" value={modalForm.holidaySurcharge} onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900" />
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

      {/* Km Policy Modal */}
      {isKmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !kmSaving && setIsKmModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 border border-slate-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-zinc-950">Cấu hình chính sách km</h3>
              <button onClick={() => setIsKmModalOpen(false)} className="text-slate-400 hover:text-zinc-950">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveKm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Km miễn phí / ngày</label>
                <div className="relative">
                  <input type="number" min="0" value={kmForm.includedKmPerDay} onChange={e => setKmForm({...kmForm, includedKmPerDay: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums pr-12" placeholder="VD: 100" />
                  <span className="absolute right-3 top-2 text-slate-400 text-xs">km</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phí vượt km</label>
                <div className="relative">
                  <input type="number" min="0" value={kmForm.extraKmRate} onChange={e => setKmForm({...kmForm, extraKmRate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums pr-16" placeholder="VD: 5000" />
                  <span className="absolute right-3 top-2 text-slate-400 text-xs">đ/km</span>
                </div>
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

      {/* Fuel Policy Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !fuelSaving && setIsFuelModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 border border-slate-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-zinc-950">Chính sách nhiên liệu</h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-zinc-950">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFuel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mức nhiên liệu khi trả xe</label>
                <select value={fuelForm.fuelReturnPolicy} onChange={e => setFuelForm({...fuelForm, fuelReturnPolicy: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] bg-white text-xs">
                  <option value="SAME_LEVEL">Cùng mức lúc nhận (SAME_LEVEL)</option>
                  <option value="FULL_TO_FULL">Đầy bình (FULL_TO_FULL)</option>
                </select>
              </div>

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
