import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit2, Eye, RefreshCw, AlertCircle, Power, ChevronDown, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import vehicleService from '../../services/vehicleService';
import { formatCurrencyVND, getVehicleStatusDisplay, getTransmissionDisplay } from '../../utils/formatters';

const VEHICLE_STATUSES = [
  { value: 'READY', label: 'Sẵn sàng' },
  { value: 'BOOKED', label: 'Đã đặt trước' },
  { value: 'RENTED', label: 'Đang cho thuê' },
  { value: 'INSPECTION', label: 'Đang kiểm tra' },
  { value: 'MAINTENANCE', label: 'Đang bảo trì' },
  { value: 'REPAIR', label: 'Đang sửa chữa' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
];

const VehiclesPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Action menu
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Status update modal
  const [statusModal, setStatusModal] = useState(null); // { id, make, model, licensePlate, currentStatus }
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // Deactivate modal
  const [deactivateModal, setDeactivateModal] = useState(null); // { id, make, model, licensePlate }
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Success feedback
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch vehicles function
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getAllVehicles(searchTerm, statusFilter);
      // Assuming backend returns an array directly, adjust if wrapped in { data: [...] }
      setVehicles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách xe.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVehicles();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleCreateNew = () => {
    navigate('/admin/vehicles/create');
  };

  const handleViewDetail = (id) => {
    navigate(`/admin/vehicles/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/admin/vehicles/${id}/edit`);
  };

  const openStatusModal = (vehicle) => {
    setActiveMenuId(null);
    setNewStatus(vehicle.status);
    setStatusError(null);
    setStatusModal({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      currentStatus: vehicle.status,
    });
  };

  const handleStatusUpdate = async () => {
    if (!statusModal || !newStatus) return;
    try {
      setStatusLoading(true);
      setStatusError(null);
      await vehicleService.updateVehicleStatus(statusModal.id, newStatus);
      setStatusModal(null);
      setSuccessMessage('Đã cập nhật trạng thái xe thành công.');
      await fetchVehicles();
    } catch (err) {
      setStatusError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái.');
    } finally {
      setStatusLoading(false);
    }
  };

  const openDeactivateModal = (vehicle) => {
    setActiveMenuId(null);
    setDeactivateModal({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
    });
  };

  const handleDeactivate = async () => {
    if (!deactivateModal) return;
    try {
      setDeactivateLoading(true);
      await vehicleService.deleteVehicle(deactivateModal.id);
      setDeactivateModal(null);
      setSuccessMessage('Đã ngừng hoạt động xe thành công.');
      await fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi ngừng hoạt động xe.');
      setDeactivateModal(null);
    } finally {
      setDeactivateLoading(false);
    }
  };

  const toggleMenu = (vehicleId) => {
    setActiveMenuId(activeMenuId === vehicleId ? null : vehicleId);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý xe</h1>
          <p className="text-zinc-500 mt-1">Quản lý danh sách phương tiện và trạng thái hoạt động.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Thêm xe mới
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-3" size={20} />
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Toolbar */}
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
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-zinc-400" />
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-zinc-300 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="READY">Sẵn sàng</option>
            <option value="BOOKED">Đã đặt trước</option>
            <option value="RENTED">Đang cho thuê</option>
            <option value="INSPECTION">Đang kiểm tra</option>
            <option value="MAINTENANCE">Đang bảo trì</option>
            <option value="REPAIR">Đang sửa chữa</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Error State */}
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

      {/* Table section */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Mã xe (Biển số)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Hãng / Model</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Thông số</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Giá thuê/Ngày</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Thao tác</span></th>
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
                vehicles.map((vehicle) => {
                  const statusDisplay = getVehicleStatusDisplay(vehicle.status);
                  return (
                    <tr key={vehicle.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-zinc-900">{vehicle.licensePlate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-zinc-900">{vehicle.make}</div>
                        <div className="text-sm text-zinc-500">{vehicle.model}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {vehicle.seats} chỗ • {getTransmissionDisplay(vehicle.transmission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                        {formatCurrencyVND(vehicle.dailyRate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3 relative">
                          <button
                            onClick={() => handleViewDetail(vehicle.id)}
                            className="text-zinc-400 hover:text-zinc-600 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(vehicle.id)}
                            className="text-zinc-400 hover:text-blue-600 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={18} />
                          </button>
                          <div className="relative" ref={activeMenuId === vehicle.id ? menuRef : null}>
                            <button
                              onClick={() => toggleMenu(vehicle.id)}
                              className="text-zinc-400 hover:text-zinc-900 transition-colors"
                              title="Thêm thao tác"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {activeMenuId === vehicle.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-md shadow-lg z-20">
                                <button
                                  onClick={() => openStatusModal(vehicle)}
                                  className="flex items-center w-full px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                                >
                                  <ChevronDown size={16} className="mr-2 text-zinc-400" />
                                  Đổi trạng thái
                                </button>
                                <button
                                  onClick={() => openDeactivateModal(vehicle)}
                                  className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Power size={16} className="mr-2" />
                                  Ngừng hoạt động
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Status Update Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setStatusModal(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">Đổi trạng thái xe</h3>
              <button onClick={() => setStatusModal(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-500 mb-4">
              Xe: <span className="font-medium text-zinc-900">{statusModal.make} {statusModal.model}</span> — {statusModal.licensePlate}
            </p>

            {statusError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md mb-4 flex items-center">
                <AlertCircle className="text-red-500 mr-2 shrink-0" size={16} />
                <p className="text-red-700 text-sm">{statusError}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Trạng thái mới</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm bg-white"
              >
                {VEHICLE_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={statusLoading || newStatus === statusModal.currentStatus}
                className={`px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md transition-colors ${statusLoading || newStatus === statusModal.currentStatus ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zinc-800'}`}
              >
                {statusLoading ? 'Đang cập nhật...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeactivateModal(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">Xác nhận ngừng hoạt động</h3>
              <button onClick={() => setDeactivateModal(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-600 mb-6">
              Bạn có chắc chắn muốn ngừng hoạt động xe{' '}
              <span className="font-semibold text-zinc-900">{deactivateModal.make} {deactivateModal.model}</span>{' '}
              (Biển số: <span className="font-semibold">{deactivateModal.licensePlate}</span>)?
              <br />
              <span className="text-zinc-500 mt-2 block">Xe sẽ không còn xuất hiện trong danh sách xe đang hoạt động.</span>
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeactivateModal(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivateLoading}
                className={`px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md transition-colors ${deactivateLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-700'}`}
              >
                {deactivateLoading ? 'Đang xử lý...' : 'Ngừng hoạt động'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesPage;
