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
          <h1 className="text-2xl font-bold text-zinc-900">Chính sách thuê</h1>
          <p className="text-zinc-500 mt-1">Thiết lập điều kiện bắt buộc (tuổi, kinh nghiệm lái) cho khách thuê từng xe.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md leading-5 bg-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
            placeholder="Tìm theo hãng, model, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <p className="text-green-700 text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-3" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button onClick={fetchVehicles} className="text-sm font-medium text-red-700 hover:text-red-600 flex items-center">
            <RefreshCw size={14} className="mr-1" /> Thử lại
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Mã xe (Biển số)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Xe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Tuổi tối thiểu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Kinh nghiệm lái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Trạng thái cấu hình</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <RefreshCw className="animate-spin mb-2" size={24} />
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-zinc-900">{vehicle.licensePlate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-zinc-900">{vehicle.make}</div>
                      <div className="text-sm text-zinc-500">{vehicle.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                      {vehicle.hasRentalCondition ? (vehicle.rentalConditionMinAge ? `${vehicle.rentalConditionMinAge} tuổi` : 'Không yêu cầu') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                      {vehicle.hasRentalCondition ? (vehicle.rentalConditionRequireDrivingYears ? `${vehicle.rentalConditionRequireDrivingYears} năm` : 'Không yêu cầu') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.hasRentalCondition ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đã cấu hình
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                          Chưa thiết lập
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {vehicle.hasRentalCondition ? (
                        <>
                          <button
                            onClick={() => openEditModal(vehicle.id)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 size={16} className="mr-1" /> Chỉnh sửa
                          </button>
                          <button
                            onClick={() => openDeleteModal(vehicle)}
                            className="inline-flex items-center text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openAddModal(vehicle.id)}
                          className="inline-flex items-center text-zinc-700 bg-white border border-zinc-300 rounded px-3 py-1 hover:bg-zinc-50 transition-colors"
                        >
                          <Settings size={16} className="mr-1.5" /> Thiết lập
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-zinc-500">
                    Không tìm thấy dữ liệu xe phù hợp.
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
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-zinc-900">{modalMode === 'add' ? 'Thiết lập điều kiện thuê' : 'Chỉnh sửa điều kiện thuê'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 flex items-center">
                <AlertCircle size={16} className="mr-2 shrink-0" /> {modalError}
              </div>
            )}

            {modalLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <RefreshCw className="animate-spin text-zinc-400 mb-2" size={24} />
                <p className="text-sm text-zinc-500">Đang tải...</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Tuổi tối thiểu</label>
                  <input type="number" min="18" name="minAge" value={formData.minAge} onChange={handleChange}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900" placeholder="VD: 18" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Kinh nghiệm lái xe tối thiểu (Năm)</label>
                  <input type="number" min="0" name="requireDrivingYears" value={formData.requireDrivingYears} onChange={handleChange}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900" placeholder="VD: 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Điều kiện khác</label>
                  <textarea name="otherConditions" value={formData.otherConditions} onChange={handleChange} rows="3"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900" placeholder="Các điều kiện bổ sung..."></textarea>
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
            )}
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
            <p className="text-sm text-zinc-500 mb-6">Bạn có chắc muốn xóa bộ điều kiện thuê của xe {deleteModal.licensePlate} không?</p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50">Hủy</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-70">
                {deleteLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PoliciesPage;
