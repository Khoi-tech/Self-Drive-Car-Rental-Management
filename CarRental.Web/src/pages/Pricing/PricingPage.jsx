import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Settings, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import vehicleService from '../../services/vehicleService';
import { formatCurrencyVND } from '../../utils/formatters';

const PricingPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSetupPricing = (id) => {
    navigate(`/admin/pricing/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            Bảng Giá Thuê & Tiền Cọc
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
              {vehicles.length} xe
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập bảng giá tiêu chuẩn, tiền đặt cọc và chính sách giá theo ngày cho toàn bộ đội xe VELORA.
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
                <th className="px-6 py-3.5 text-left">Dòng xe</th>
                <th className="px-6 py-3.5 text-right">Giá thuê / ngày</th>
                <th className="px-6 py-3.5 text-right">Tiền cọc</th>
                <th className="px-6 py-3.5 text-right">Km miễn phí/ngày</th>
                <th className="px-6 py-3.5 text-right">Phí vượt km</th>
                <th className="px-6 py-3.5 text-center">Chính sách ưu đãi</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="animate-spin mb-2 text-[#0F172A]" size={22} />
                      <p className="text-xs">Đang tải biểu giá đội xe...</p>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold font-mono text-zinc-950 tabular-nums">
                      {formatCurrencyVND(vehicle.dailyRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono text-slate-600 tabular-nums">
                      {formatCurrencyVND(vehicle.depositAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono text-slate-600 tabular-nums">
                      {vehicle.mileageLimit ? `${vehicle.mileageLimit.toLocaleString()} km` : 'Không giới hạn'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono text-slate-600 tabular-nums">
                      {vehicle.extraKmRate ? `${formatCurrencyVND(vehicle.extraKmRate)}/km` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {vehicle.pricingPoliciesCount || 0} chính sách
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <button
                        onClick={() => handleSetupPricing(vehicle.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
                      >
                        <Settings size={14} className="text-slate-500" /> Thiết lập giá
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-xs text-slate-400">
                    Không tìm thấy xe nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
