import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import vehicleService from '../../services/vehicleService';

const CreateVehiclePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    licensePlate: '',
    seats: 4,
    transmission: 'AUTO',
    fuelType: 'PETROL',
    manufactureYear: new Date().getFullYear(),
    dailyRate: '',
    depositAmount: '',
    currentMileage: '',
    mileageLimit: '',
    pickupLocation: '',
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Prevent negative numbers for all numeric fields
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
    setLoading(true);
    setError(null);

    // Basic Validation
    if (formData.seats <= 0) {
      setError('Số chỗ ngồi phải lớn hơn 0.');
      setLoading(false);
      return;
    }
    if (formData.dailyRate < 0 || formData.depositAmount < 0) {
      setError('Giá tiền không được là số âm.');
      setLoading(false);
      return;
    }

    try {
      await vehicleService.createVehicle(formData);
      navigate('/admin/vehicles', { replace: true });
    } catch (err) {
      if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const messages = Object.values(err.response.data.errors).flat().join(' ');
        setError(messages);
      } else {
        setError(err.response?.data?.message || err.message || 'Lỗi khi tạo xe mới.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/admin/vehicles')}
          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors bg-white border border-zinc-200 rounded-md shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Thêm xe mới</h1>
          <p className="text-zinc-500 mt-1">Nhập thông tin phương tiện để thêm vào hệ thống.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Hãng xe */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Hãng xe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="make"
                required
                value={formData.make}
                onChange={handleChange}
                placeholder="VD: Toyota"
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Mẫu xe (Model) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                required
                value={formData.model}
                onChange={handleChange}
                placeholder="VD: Camry"
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>

            {/* Biển số */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Biển số <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="licensePlate"
                required
                value={formData.licensePlate}
                onChange={handleChange}
                placeholder="VD: 51H-123.45"
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>

            {/* Năm sản xuất */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Năm sản xuất</label>
              <input
                type="number"
                name="manufactureYear"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.manufactureYear}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>

            {/* Thông số kỹ thuật */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Số chỗ ngồi</label>
              <input
                type="number"
                name="seats"
                min="1"
                value={formData.seats}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Hộp số</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm bg-white"
              >
                <option value="AUTO">Tự động (AUTO)</option>
                <option value="MANUAL">Số sàn (MANUAL)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nhiên liệu</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm bg-white"
              >
                <option value="PETROL">Xăng</option>
                <option value="DIESEL">Dầu Diesel</option>
                <option value="ELECTRIC">Điện</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Số Km hiện tại (ODO)</label>
              <input
                type="number"
                name="currentMileage"
                min="0"
                value={formData.currentMileage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Giá thuê 1 ngày (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="dailyRate"
                required
                min="0"
                value={formData.dailyRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tiền cọc (VNĐ)</label>
              <input
                type="number"
                name="depositAmount"
                min="0"
                value={formData.depositAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>
            
            {/* Others */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Giới hạn km / ngày</label>
              <input
                type="number"
                name="mileageLimit"
                min="0"
                value={formData.mileageLimit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Vị trí giao xe</label>
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                placeholder="VD: Trụ sở chính"
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-zinc-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-zinc-200">
          <button
            type="button"
            onClick={() => navigate('/admin/vehicles')}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zinc-900 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zinc-800'}`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </span>
            ) : (
              <span className="flex items-center">
                <Save size={16} className="mr-2" />
                Lưu phương tiện
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateVehiclePage;
