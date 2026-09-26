import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, RefreshCw, AlertCircle, Car, Power, ChevronDown, X } from 'lucide-react';
import vehicleService from '../../services/vehicleService';
import { formatCurrencyVND, getVehicleStatusDisplay, getTransmissionDisplay, getFuelTypeDisplay } from '../../utils/formatters';

const VEHICLE_STATUSES = [
  { value: 'READY', label: 'Sẵn sàng' },
  { value: 'BOOKED', label: 'Đã đặt trước' },
  { value: 'RENTED', label: 'Đang cho thuê' },
  { value: 'INSPECTION', label: 'Đang kiểm tra' },
  { value: 'MAINTENANCE', label: 'Đang bảo trì' },
  { value: 'REPAIR', label: 'Đang sửa chữa' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
];

const InfoRow = ({ label, value }) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-medium text-zinc-500">{label}</dt>
    <dd className="mt-1 text-sm text-zinc-900 sm:col-span-2 sm:mt-0">{value || '—'}</dd>
  </div>
);

const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status update
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // Deactivate
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getVehicleById(id);
      setVehicle(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Không tìm thấy xe với mã này.');
      } else {
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải thông tin xe.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    try {
      setStatusLoading(true);
      setStatusError(null);
      await vehicleService.updateVehicleStatus(id, newStatus);
      setShowStatusModal(false);
      setNewStatus('');
      await fetchVehicle();
    } catch (err) {
      setStatusError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setDeactivateLoading(true);
      await vehicleService.deleteVehicle(id);
      navigate('/admin/vehicles', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi ngừng hoạt động xe.');
      setShowDeactivateModal(false);
      setDeactivateLoading(false);
    }
  };

  const openStatusModal = () => {
    if (vehicle) {
      setNewStatus(vehicle.status);
      setStatusError(null);
    }
    setShowStatusModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500">
        <RefreshCw className="animate-spin mb-3" size={32} />
        <p>Đang tải thông tin xe...</p>
      </div>
    );
  }

  // Error state
  if (error && !vehicle) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="text-red-500 mr-3 mt-0.5 shrink-0" size={24} />
            <div>
              <p className="text-red-700 font-medium">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => navigate('/admin/vehicles')}
                  className="text-sm font-medium text-red-700 hover:text-red-600 flex items-center"
                >
                  <ArrowLeft size={14} className="mr-1" /> Quay lại danh sách
                </button>
                <button
                  onClick={fetchVehicle}
                  className="text-sm font-medium text-red-700 hover:text-red-600 flex items-center"
                >
                  <RefreshCw size={14} className="mr-1" /> Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  const statusDisplay = getVehicleStatusDisplay(vehicle.status);
  const formatDate = (isoString) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/vehicles')}
            className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors bg-white border border-zinc-200 rounded-md shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-zinc-500 mt-0.5">{vehicle.licensePlate}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/admin/vehicles/${id}/edit`)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
          >
            <Edit2 size={16} className="mr-1.5" /> Chỉnh sửa
          </button>
          <button
            onClick={openStatusModal}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
          >
            <ChevronDown size={16} className="mr-1.5" /> Đổi trạng thái
          </button>
          <button
            onClick={() => setShowDeactivateModal(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            <Power size={16} className="mr-1.5" /> Ngừng hoạt động
          </button>
        </div>
      </div>

      {/* Error banner (for inline errors after load) */}
      {error && vehicle && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
          <AlertCircle className="text-red-500 mr-3 shrink-0" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Status badge */}
      <div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
          {statusDisplay.label}
        </span>
      </div>

      {/* Vehicle image */}
      {vehicle.imageUrl && (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      {/* Info sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Thông tin xe */}
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">Thông tin xe</h2>
          </div>
          <div className="px-6 divide-y divide-zinc-100">
            <InfoRow label="Hãng xe" value={vehicle.make} />
            <InfoRow label="Mẫu xe (Model)" value={vehicle.model} />
            <InfoRow label="Biển số" value={vehicle.licensePlate} />
            <InfoRow label="Năm sản xuất" value={vehicle.manufactureYear} />
            <InfoRow label="Số chỗ ngồi" value={`${vehicle.seats} chỗ`} />
            <InfoRow label="Hộp số" value={getTransmissionDisplay(vehicle.transmission)} />
            <InfoRow label="Nhiên liệu" value={getFuelTypeDisplay(vehicle.fuelType)} />
          </div>
        </div>

        {/* Section: Giá & vận hành */}
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">Giá & vận hành</h2>
          </div>
          <div className="px-6 divide-y divide-zinc-100">
            <InfoRow label="Giá thuê / ngày" value={formatCurrencyVND(vehicle.dailyRate)} />
            <InfoRow label="Tiền cọc" value={formatCurrencyVND(vehicle.depositAmount)} />
            <InfoRow label="Km hiện tại (ODO)" value={vehicle.currentMileage != null ? `${vehicle.currentMileage.toLocaleString('vi-VN')} km` : null} />
            <InfoRow label="Km bao gồm / ngày" value={vehicle.mileageLimit != null ? `${vehicle.mileageLimit.toLocaleString('vi-VN')} km` : null} />
            <InfoRow label="Địa điểm nhận xe" value={vehicle.pickupLocation} />
            <InfoRow label="Bảo trì tiếp theo" value={formatDate(vehicle.nextMaintenanceDate)} />
            <InfoRow label="Km bảo trì tiếp theo" value={vehicle.nextMaintenanceMileage != null ? `${vehicle.nextMaintenanceMileage.toLocaleString('vi-VN')} km` : null} />
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Thông tin hệ thống</h2>
        </div>
        <div className="px-6 divide-y divide-zinc-100">
          <InfoRow label="Mã xe (ID)" value={vehicle.id} />
          <InfoRow label="Ngày tạo" value={formatDate(vehicle.createdAt)} />
          <InfoRow label="Cập nhật lần cuối" value={formatDate(vehicle.updatedAt)} />
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowStatusModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">Đổi trạng thái xe</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-500 mb-4">
              Xe: <span className="font-medium text-zinc-900">{vehicle.make} {vehicle.model}</span> — {vehicle.licensePlate}
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
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={statusLoading || newStatus === vehicle.status}
                className={`px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md transition-colors ${statusLoading || newStatus === vehicle.status ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zinc-800'}`}
              >
                {statusLoading ? 'Đang cập nhật...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowDeactivateModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">Xác nhận ngừng hoạt động</h3>
              <button onClick={() => setShowDeactivateModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-600 mb-6">
              Bạn có chắc chắn muốn ngừng hoạt động xe{' '}
              <span className="font-semibold text-zinc-900">{vehicle.make} {vehicle.model}</span>{' '}
              (Biển số: <span className="font-semibold">{vehicle.licensePlate}</span>)?
              <br />
              <span className="text-zinc-500 mt-2 block">Xe sẽ không còn xuất hiện trong danh sách xe đang hoạt động.</span>
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
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

export default VehicleDetailPage;
