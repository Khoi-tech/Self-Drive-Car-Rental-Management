import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Settings, RefreshCw, AlertCircle, Edit2, Trash2, X, Save } from 'lucide-react';
import vehicleService from '../../services/vehicleService';
import rentalConditionService from '../../services/rentalConditionService';

const PoliciesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentVehicleId, setCurrentVehicleId] = useState(null);
  const [formData, setFormData] = useState({ minAge: 18, requireDrivingYears: 1, otherConditions: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete State
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getAllVehicles(searchTerm);
      setVehicles(Array.isArray(data) ? data : data.data || []);
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
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const openAddModal = (vehicleId) => {
    setModalMode('add');
    setCurrentVehicleId(vehicleId);
    setFormData({ minAge: 18, requireDrivingYears: 1, otherConditions: '' });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (vehicleId) => {
    setModalMode('edit');
    setCurrentVehicleId(vehicleId);
    setModalError(null);
    setIsModalOpen(true);
    setModalLoading(true);

    try {
      const condition = await rentalConditionService.getConditionByVehicleId(vehicleId);
      if (condition) {
        setFormData({
          minAge: condition.minAge ?? '',
          requireDrivingYears: condition.requireDrivingYears ?? '',
          otherConditions: condition.otherConditions ?? ''
        });
      } else {
        // Fallback if not found despite UI thinking it exists
        setFormData({ minAge: 18, requireDrivingYears: 1, otherConditions: '' });
        setModalMode('add');
      }
    } catch (err) {
      setModalError('Không thể tải thông tin điều kiện thuê.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    // Validation
    const minAge = formData.minAge === '' ? null : Number(formData.minAge);
    const reqYears = formData.requireDrivingYears === '' ? null : Number(formData.requireDrivingYears);

    if (minAge !== null && minAge < 18) {
      setModalError('Tuổi tối thiểu phải từ 18 trở lên.');
      setModalSaving(false); return;
    }
    if (reqYears !== null && reqYears < 0) {
      setModalError('Kinh nghiệm lái không được âm.');
      setModalSaving(false); return;
    }

    const payload = {
      minAge,
      requireDrivingYears: reqYears,
      otherConditions: formData.otherConditions || null
    };

    try {
      if (modalMode === 'add') {
        await rentalConditionService.createCondition(currentVehicleId, payload);
        setSuccessMsg('Đã thiết lập điều kiện thuê.');
      } else {
        await rentalConditionService.updateCondition(currentVehicleId, payload);
        setSuccessMsg('Đã cập nhật điều kiện thuê.');
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Lỗi khi lưu điều kiện thuê.');
    } finally {
      setModalSaving(false);
    }
  };

  const openDeleteModal = (vehicle) => {
    setDeleteModal(vehicle);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleteLoading(true);
      await rentalConditionService.deleteCondition(deleteModal.id);
      setSuccessMsg('Đã xóa điều kiện thuê.');
      setDeleteModal(null);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa điều kiện thuê.');
      setDeleteModal(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            Điều Kiện & Chính Sách Thuê Xe
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
              {vehicles.length} xe
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập điều kiện ràng buộc pháp lý (độ tuổi tối thiểu, số năm kinh nghiệm bằng lái) cho từng phương tiện.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-xs text-zinc-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
            placeholder="Tìm theo hãng xe, model, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md">
          <p className="text-emerald-800 text-xs font-medium">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-rose-600" size={18} />
            <p className="text-rose-700 text-xs font-medium">{error}</p>
          </div>
          <button onClick={fetchVehicles} className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1">
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-left">Biển số</th>
                <th className="px-6 py-3.5 text-left">Phương tiện</th>
                <th className="px-6 py-3.5 text-center">Độ tuổi tối thiểu</th>
                <th className="px-6 py-3.5 text-center">Kinh nghiệm lái xe</th>
                <th className="px-6 py-3.5 text-center">Trạng thái điều kiện</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
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
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="license-plate text-[11px] px-2.5 py-0.5">
                        {vehicle.licensePlate}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-zinc-950">{vehicle.make} {vehicle.model}</div>
                      <div className="text-[11px] text-slate-500">{vehicle.seats} chỗ • {vehicle.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-zinc-950 font-medium">
                      {vehicle.hasRentalCondition ? (vehicle.rentalConditionMinAge ? `${vehicle.rentalConditionMinAge} tuổi` : 'Không yêu cầu') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-zinc-950 font-medium">
                      {vehicle.hasRentalCondition ? (vehicle.rentalConditionRequireDrivingYears ? `${vehicle.rentalConditionRequireDrivingYears} năm` : 'Không yêu cầu') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {vehicle.hasRentalCondition ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Đã cấu hình
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Chưa thiết lập
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                      {vehicle.hasRentalCondition ? (
                        <>
                          <button
                            onClick={() => openEditModal(vehicle.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition"
                          >
                            <Edit2 size={13} /> Sửa
                          </button>
                          <button
                            onClick={() => openDeleteModal(vehicle)}
                            className="inline-flex items-center p-1 text-rose-600 hover:text-rose-800 transition"
                            title="Xóa điều kiện"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openAddModal(vehicle.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F172A] rounded-md hover:bg-[#1D4ED8] transition shadow-sm"
                        >
                          <Settings size={13} /> Thiết lập
                        </button>
                      )}
                    </td>
                  </tr>
                ))
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

      {/* Setup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !modalSaving && setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 border border-slate-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-zinc-950">{modalMode === 'add' ? 'Thiết lập điều kiện thuê' : 'Chỉnh sửa điều kiện thuê'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-zinc-950">
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
                <p className="text-xs text-slate-500">Đang tải...</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tuổi tối thiểu</label>
                  <input type="number" min="18" name="minAge" value={formData.minAge} onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums" placeholder="VD: 18" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kinh nghiệm lái xe tối thiểu (Năm)</label>
                  <input type="number" min="0" name="requireDrivingYears" value={formData.requireDrivingYears} onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums" placeholder="VD: 1" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quy định khác kèm theo</label>
                  <textarea name="otherConditions" value={formData.otherConditions} onChange={handleChange} rows="3"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs" placeholder="Các điều kiện bổ sung..."></textarea>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition">
                    Hủy
                  </button>
                  <button type="submit" disabled={modalSaving} className={`inline-flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-md text-xs font-semibold shadow-sm transition ${modalSaving ? 'opacity-70' : 'hover:bg-[#1D4ED8]'}`}>
                    {modalSaving ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />} Lưu điều kiện
                  </button>
                </div>
              </form>
            )}
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
            <p className="text-xs text-slate-500 mb-6">Bạn có chắc muốn xóa bộ điều kiện thuê của xe <span className="font-mono font-bold text-zinc-950">{deleteModal.licensePlate}</span> không?</p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition">Hủy</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-4 py-2 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-70 shadow-sm">
                {deleteLoading ? 'Đang xóa...' : 'Xóa điều kiện'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PoliciesPage;
