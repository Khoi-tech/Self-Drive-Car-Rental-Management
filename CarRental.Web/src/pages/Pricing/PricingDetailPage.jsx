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
        <button onClick={() => navigate('/admin/pricing')} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Bảng giá & tiền cọc</h1>
          <p className="text-zinc-500 mt-1">{vehicle.make} {vehicle.model} — {vehicle.licensePlate}</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-center">
          <CheckCircle className="text-green-500 mr-3 shrink-0" size={20} />
          <p className="text-green-700 text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {error && vehicle && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
          <AlertCircle className="text-red-500 mr-3 shrink-0" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Fixed Configs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-200"><h3 className="font-semibold text-zinc-900">A. Giá cơ bản</h3></div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase">Giá thuê / ngày</label>
                <div className="font-medium text-zinc-900 mt-1">{formatCurrencyVND(vehicle.dailyRate)}</div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase">Tiền cọc</label>
                <div className="font-medium text-zinc-900 mt-1">{formatCurrencyVND(vehicle.depositAmount)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900">B. Chính sách km</h3>
              <button onClick={openKmModal} className="text-sm font-medium text-blue-600 hover:text-blue-800">Sửa</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase">Km miễn phí / ngày</label>
                <div className="font-medium text-zinc-900 mt-1">{vehicle.mileageLimit ? `${vehicle.mileageLimit} km` : 'Không giới hạn'}</div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase">Phí vượt km</label>
                <div className="font-medium text-zinc-900 mt-1">{vehicle.extraKmRate ? formatCurrencyVND(vehicle.extraKmRate) + ' / km' : 'Chưa cấu hình'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900">C. Nhiên liệu</h3>
              <button onClick={openFuelModal} className="text-sm font-medium text-blue-600 hover:text-blue-800">Sửa</button>
            </div>
            <div className="p-5">
              <label className="text-xs text-zinc-500 uppercase">Mức trả xe (Fuel Return Policy)</label>
              <div className="font-medium text-zinc-900 mt-1">{vehicle.fuelReturnPolicy === 'SAME_LEVEL' ? 'Cùng mức lúc nhận' : (vehicle.fuelReturnPolicy || 'SAME_LEVEL')}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Policies & Preview */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h3 className="font-semibold text-zinc-900">D. Chính sách giá</h3>
              <button onClick={openAddModal} className="inline-flex items-center text-sm font-medium text-white bg-zinc-900 rounded px-3 py-1.5 hover:bg-zinc-800 transition-colors">
                <Plus size={16} className="mr-1.5" /> Thêm chính sách
              </button>
            </div>
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Từ ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Giảm giá</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Phụ thu lễ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {policies.length > 0 ? policies.map(policy => (
                  <tr key={policy.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                      &ge; {policy.minDays} ngày
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {policy.discountPercentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      {policy.holidaySurcharge}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => openEditModal(policy)} className="text-blue-600 hover:text-blue-800 mr-4" title="Sửa">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => openDeleteModal(policy)} className="text-red-600 hover:text-red-800" title="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-zinc-500 text-sm">Chưa có chính sách giá nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center">
              <Calculator size={18} className="text-zinc-500 mr-2" />
              <h3 className="font-semibold text-zinc-900">Xem trước giá</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Số ngày thuê dự kiến</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={previewDays}
                    onChange={onPreviewDaysChange}
                    className="block w-full px-4 py-2 border border-zinc-300 rounded-md focus:ring-zinc-900 focus:border-zinc-900"
                    placeholder="Nhập số ngày..."
                  />
                  {previewLoading && <RefreshCw size={16} className="absolute right-3 top-3 animate-spin text-zinc-400" />}
                </div>
                <p className="mt-2 text-xs text-zinc-500">Giá cuối cùng = Giá cơ bản &times; (1 - % Giảm + % Lễ)</p>
              </div>

              {previewResult && (
                <div className="bg-white p-4 border border-zinc-200 rounded-md shadow-sm space-y-3 relative">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Giá cơ bản / ngày:</span>
                    <span className="font-medium text-zinc-900">{formatCurrencyVND(previewResult.basePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Discount áp dụng ({previewResult.selectedMinDays ? `≥ ${previewResult.selectedMinDays} ngày` : 'Không có'}):</span>
                    <span className="font-medium text-green-600">-{previewResult.discountPercentage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Phụ thu lễ:</span>
                    <span className="font-medium text-orange-600">+{previewResult.holidaySurcharge}%</span>
                  </div>
                  <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-900">Giá sau điều chỉnh:</span>
                    <span className="text-lg font-bold text-zinc-900">{formatCurrencyVND(previewResult.adjustedDailyPrice)}<span className="text-xs font-normal text-zinc-500">/ngày</span></span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-50 p-3 rounded -mx-4 -mb-4 mt-2 border-t border-zinc-200">
                    <span className="text-sm font-bold text-zinc-900">Tổng tiền thuê ({previewResult.rentalDays} ngày):</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrencyVND(previewResult.rentalPrice)}</span>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50">
                  Hủy
                </button>
                <button type="submit" disabled={modalSaving} className={`inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium ${modalSaving ? 'opacity-70' : 'hover:bg-zinc-800'}`}>
                  {modalSaving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Lưu
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
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 z-10 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-zinc-500 mb-6">Bạn có chắc muốn xóa chính sách từ {deleteModal.minDays} ngày?</p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50">Hủy</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-70">
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
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-zinc-900">Cấu hình chính sách km</h3>
              <button onClick={() => setIsKmModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveKm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Km miễn phí / ngày</label>
                <div className="relative">
                  <input type="number" min="0" value={kmForm.includedKmPerDay} onChange={e => setKmForm({...kmForm, includedKmPerDay: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 pr-12" placeholder="VD: 100" />
                  <span className="absolute right-3 top-2 text-zinc-500 text-sm">km</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Phí vượt km</label>
                <div className="relative">
                  <input type="number" min="0" value={kmForm.extraKmRate} onChange={e => setKmForm({...kmForm, extraKmRate: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 pr-16" placeholder="VD: 5000" />
                  <span className="absolute right-3 top-2 text-zinc-500 text-sm">đ/km</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsKmModalOpen(false)} className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50">
                  Hủy
                </button>
                <button type="submit" disabled={kmSaving} className={`inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium ${kmSaving ? 'opacity-70' : 'hover:bg-zinc-800'}`}>
                  {kmSaving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Lưu
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
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-zinc-900">Chính sách nhiên liệu</h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFuel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Mức nhiên liệu khi trả xe</label>
                <select value={fuelForm.fuelReturnPolicy} onChange={e => setFuelForm({...fuelForm, fuelReturnPolicy: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white">
                  <option value="SAME_LEVEL">Cùng mức lúc nhận (SAME_LEVEL)</option>
                  <option value="FULL_TO_FULL">Đầy bình (FULL_TO_FULL)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsFuelModalOpen(false)} className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50">
                  Hủy
                </button>
                <button type="submit" disabled={fuelSaving} className={`inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium ${fuelSaving ? 'opacity-70' : 'hover:bg-zinc-800'}`}>
                  {fuelSaving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Lưu
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
