import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, RefreshCw } from 'lucide-react';
import vehicleService from '../../services/vehicleService';
import { getTransmissionDisplay, getFuelTypeDisplay } from '../../utils/formatters';

const EditVehiclePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Read-only fields from the vehicle record
  const [vehicleInfo, setVehicleInfo] = useState(null);

  // Editable form data (matches UpdateVehicleDto)
  const [formData, setFormData] = useState({
    seats: 4,
    transmission: 'AUTO',
    dailyRate: '',
    depositAmount: '',
    currentMileage: 0,
    mileageLimit: '',
    nextMaintenanceDate: '',
    nextMaintenanceMileage: '',
    pickupLocation: '',
    imageUrl: '',
  });

  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().split('T')[0];
  };

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await vehicleService.getVehicleById(id);

      setVehicleInfo({
        make: data.make,
        model: data.model,
        licensePlate: data.licensePlate,
        fuelType: data.fuelType,
        manufactureYear: data.manufactureYear,
        mileageLimit: data.mileageLimit,
        extraKmRate: data.extraKmRate,
        fuelReturnPolicy: data.fuelReturnPolicy,
      });

      setFormData({
        seats: data.seats,
        transmission: data.transmission,
        dailyRate: data.dailyRate,
        depositAmount: data.depositAmount,
        currentMileage: data.currentMileage,
        mileageLimit: data.mileageLimit ?? '',
        nextMaintenanceDate: formatDateForInput(data.nextMaintenanceDate),
        nextMaintenanceMileage: data.nextMaintenanceMileage ?? '',
        pickupLocation: data.pickupLocation ?? '',
        imageUrl: data.imageUrl ?? '',
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setFetchError('Không tìm thấy xe với mã này.');
      } else {
        setFetchError(err.response?.data?.message || err.message || 'Lỗi khi tải thông tin xe.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === 'number' && value !== '' && Number(value) < 0) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Client-side validation
    if (formData.seats <= 0) {
      setError('Số chỗ ngồi phải lớn hơn 0.');
      setSaving(false);
      return;
    }
    if (formData.dailyRate < 0 || formData.depositAmount < 0) {
      setError('Giá tiền không được là số âm.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        seats: formData.seats,
        transmission: formData.transmission,
        dailyRate: Number(formData.dailyRate),
        depositAmount: Number(formData.depositAmount),
        currentMileage: Number(formData.currentMileage),
        mileageLimit: vehicleInfo.mileageLimit, // Keep unchanged
        extraKmRate: vehicleInfo.extraKmRate,   // Keep unchanged
        fuelReturnPolicy: vehicleInfo.fuelReturnPolicy, // Keep unchanged
        nextMaintenanceDate: formData.nextMaintenanceDate ? new Date(formData.nextMaintenanceDate).toISOString() : null,
        nextMaintenanceMileage: formData.nextMaintenanceMileage === '' ? null : Number(formData.nextMaintenanceMileage),
        pickupLocation: formData.pickupLocation || null,
        imageUrl: formData.imageUrl || null,
      };

      await vehicleService.updateVehicle(id, payload);
      navigate(`/admin/vehicles/${id}`, { replace: true });
    } catch (err) {
      if (err.response?.data?.errors) {
        const messages = Object.values(err.response.data.errors).flat().join(' ');
        setError(messages);
      } else {
        setError(err.response?.data?.message || err.response?.data?.Message || err.message || 'Lỗi khi cập nhật xe.');
      }
    } finally {
      setSaving(false);
    }
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

  // Fetch error state
  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="text-red-500 mr-3 mt-0.5 shrink-0" size={24} />
            <div>
              <p className="text-red-700 font-medium">{fetchError}</p>
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/admin/vehicles/${id}`)}
          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors bg-white border border-zinc-200 rounded-md shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Chỉnh sửa xe</h1>
          <p className="text-zinc-500 mt-1">
            {vehicleInfo?.make} {vehicleInfo?.model} — {vehicleInfo?.licensePlate}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <AlertCircle className="text-red-500 mr-3 mt-0.5 shrink-0" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">

          {/* Read-only info */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-3">Thông tin cố định</h3>
            <p className="text-xs text-zinc-500 mb-3">Các trường dưới đây không thể thay đổi sau khi tạo xe.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Hãng xe</label>
                <input type="text" disabled value={vehicleInfo?.make || ''} className="w-full px-3 py-2 border border-zinc-200 rounded-md bg-zinc-50 text-zinc-500 sm:text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Mẫu xe (Model)</label>
                <input type="text" disabled value={vehicleInfo?.model || ''} className="w-full px-3 py-2 border border-zinc-200 rounded-md bg-zinc-50 text-zinc-500 sm:text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Biển số</label>
                <input type="text" disabled value={vehicleInfo?.licensePlate || ''} className="w-full px-3 py-2 border border-zinc-200 rounded-md bg-zinc-50 text-zinc-500 sm:text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Năm sản xuất</label>
                <input type="text" disabled value={vehicleInfo?.manufactureYear || ''} className="w-full px-3 py-2 border border-zinc-200 rounded-md bg-zinc-50 text-zinc-500 sm:text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Nhiên liệu</label>
                <input type="text" disabled value={getFuelTypeDisplay(vehicleInfo?.fuelType)} className="w-full px-3 py-2 border border-zinc-200 rounded-md bg-zinc-50 text-zinc-500 sm:text-sm cursor-not-allowed" />
              </div>
            </div>
          </div>

          <hr className="border-zinc-200" />

          {/* Editable fields */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-3">Thông tin có thể chỉnh sửa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Số chỗ */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Số chỗ ngồi</label>
                <input type="number" name="seats" min="1" value={formData.seats} onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>

              {/* Hộp số */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Hộp số</label>
                <select name="transmission" value={formData.transmission} onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm bg-white">
                  <option value="AUTO">Tự động (AUTO)</option>
                  <option value="MANUAL">Số sàn (MANUAL)</option>
                </select>
              </div>

              {/* Giá thuê */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Giá thuê 1 ngày (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input type="number" name="dailyRate" required min="0" value={formData.dailyRate} onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>

              {/* Tiền cọc */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tiền cọc (VNĐ)</label>
                <input type="number" name="depositAmount" min="0" value={formData.depositAmount} onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>

              {/* Km hiện tại */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Số Km hiện tại (ODO)</label>
                <input type="number" name="currentMileage" min="0" value={formData.currentMileage} onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>


              {/* Bảo trì - ngày */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Ngày bảo trì tiếp theo</label>
                <input type="date" name="nextMaintenanceDate" value={formData.nextMaintenanceDate} onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>

              {/* Bảo trì - km */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Km bảo trì tiếp theo</label>
                <input type="number" name="nextMaintenanceMileage" min="0" value={formData.nextMaintenanceMileage} onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>

              {/* Vị trí */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Vị trí giao xe</label>
                <input type="text" name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} placeholder="VD: Trụ sở chính"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">URL hình ảnh</label>
                <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>

            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-zinc-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-zinc-200">
          <button
            type="button"
            onClick={() => navigate(`/admin/vehicles/${id}`)}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zinc-900 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zinc-800'}`}
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang cập nhật...
              </span>
            ) : (
              <span className="flex items-center">
                <Save size={16} className="mr-2" />
                Cập nhật
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditVehiclePage;
