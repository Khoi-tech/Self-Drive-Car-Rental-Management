import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, Users, Fuel, Settings, ChevronDown, Check, X, RotateCcw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import vehicleService from '../../services/vehicleService';
import { formatCurrency } from '../../utils/formatters';

const BRANDS = ['Porsche', 'Mercedes-Benz', 'BMW', 'Audi', 'Lexus', 'Land Rover', 'VinFast', 'Toyota', 'Ford'];
const LOCATIONS = [
  'Tất cả địa điểm',
  'Hồ Chí Minh (Trụ sở Tân Bình)',
  'Hồ Chí Minh (Quận 1 / Landmark)',
  'Hà Nội (Cầu Giấy / Nội Bài)',
  'Đà Nẵng (Sân bay Đà Nẵng)'
];

const CarCatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search Params initialized from URL
  const [pickupLocation, setPickupLocation] = useState(searchParams.get('pickupLocation') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');

  // Filter Params
  const [filters, setFilters] = useState({
    brand: searchParams.get('brand') || '',
    seats: searchParams.get('seats') || '',
    transmission: searchParams.get('transmission') || '',
    fuelType: searchParams.get('fuelType') || '',
    minPrice: '',
    maxPrice: ''
  });

  const [sortBy, setSortBy] = useState('price_asc');

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        pickupLocation: pickupLocation && pickupLocation !== 'Tất cả địa điểm' ? pickupLocation : '',
        startTime: startTime ? new Date(startTime).toISOString() : '',
        endTime: endTime ? new Date(endTime).toISOString() : '',
        brand: filters.brand,
        seats: filters.seats,
        transmission: filters.transmission,
        fuelType: filters.fuelType,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      };

      const response = await vehicleService.searchVehicles(params);
      const data = response.value || response.data || response;
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to search vehicles', err);
      setError('Đã có lỗi xảy ra khi tìm kiếm xe. Vui lòng thử lại sau.');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filters, pickupLocation]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      brand: '',
      seats: '',
      transmission: '',
      fuelType: '',
      minPrice: '',
      maxPrice: ''
    });
    setPickupLocation('');
    setStartTime('');
    setEndTime('');
  };

  // Sort vehicles locally
  const sortedVehicles = [...vehicles].sort((a, b) => {
    const priceA = a.estimatedTotalFee > 0 ? a.estimatedTotalFee : a.vehicle.dailyRate;
    const priceB = b.estimatedTotalFee > 0 ? b.estimatedTotalFee : b.vehicle.dailyRate;
    
    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'newest') return new Date(b.vehicle.createdAt || 0) - new Date(a.vehicle.createdAt || 0);
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      <Navbar isVisible={true} />

      {/* Top Search & Filter Bar */}
      <div className="pt-24 pb-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-1">
                Dịch Vụ Thuê Xe Tự Lái Chuẩn Đức
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                Danh Mục Xe Khả Dụng ({vehicles.length})
              </h1>
            </div>

            {/* Quick Sorter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sắp xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold text-zinc-950 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="newest">Xe mới nhất</option>
              </select>
            </div>
          </div>

          {/* Quick Location & Date Search Bar */}
          <form 
            onSubmit={handleSearch} 
            className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center"
          >
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 transition-colors"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc === 'Tất cả địa điểm' ? '' : loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 transition-colors"
                placeholder="Ngày nhận xe"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 transition-colors"
                placeholder="Ngày trả xe"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-blue-900 text-white font-bold text-xs py-2 px-4 rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Kiểm tra xe trống</span>
            </button>
          </form>

        </div>
      </div>

      {/* Main Catalog Layout: 280px Fixed Filter + 3-Col Cars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* CỘT TRÁI (280px, cố định khi cuộn) */}
          <aside className="w-full lg:w-[280px] shrink-0 sticky top-24 self-start space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-blue-900" />
                  Bộ lọc tìm kiếm
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-semibold text-slate-500 hover:text-blue-900 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Xóa lọc
                </button>
              </div>

              {/* Filter 1: Hãng xe */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                  Hãng sản xuất
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('brand', '')}
                    className={`px-2.5 py-1 text-xs rounded-md border font-semibold transition-colors ${
                      filters.brand === ''
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Tất cả
                  </button>
                  {BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleFilterChange('brand', filters.brand === b ? '' : b)}
                      className={`px-2.5 py-1 text-xs rounded-md border font-semibold transition-colors ${
                        filters.brand === b
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter 2: Số chỗ ngồi */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                  Số chỗ ngồi
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Tất cả', val: '' },
                    { label: '4-5 chỗ', val: '5' },
                    { label: '7 chỗ', val: '7' }
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => handleFilterChange('seats', s.val)}
                      className={`py-1.5 text-xs rounded-md border font-semibold transition-colors text-center ${
                        filters.seats === s.val
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter 3: Hộp số */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                  Loại hộp số
                </label>
                <select
                  value={filters.transmission}
                  onChange={(e) => handleFilterChange('transmission', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 transition-colors"
                >
                  <option value="">Tất cả hộp số</option>
                  <option value="AUTO">Số tự động (AUTO)</option>
                  <option value="MANUAL">Số sàn (MANUAL)</option>
                </select>
              </div>

              {/* Filter 4: Nhiên liệu */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                  Loại nhiên liệu
                </label>
                <select
                  value={filters.fuelType}
                  onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 transition-colors"
                >
                  <option value="">Tất cả nhiên liệu</option>
                  <option value="PETROL">Động cơ Xăng (PETROL)</option>
                  <option value="DIESEL">Động cơ Dầu (DIESEL)</option>
                  <option value="ELECTRIC">Thuần Điện (ELECTRIC)</option>
                </select>
              </div>

              {/* Transparency Notice */}
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-md text-[11px] text-blue-900 leading-relaxed space-y-1">
                <div className="font-bold">Chính sách cam kết:</div>
                <p>100% xe thật ODO thật, bảo hiểm vật chất 2 chiều và vệ sinh sạch sẽ trước khi bàn giao.</p>
              </div>

            </div>
          </aside>

          {/* CỘT PHẢI: LƯỚI XE (3 CỘT TRÊN DESKTOP) */}
          <main className="flex-1 w-full min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="velora-card p-4 animate-pulse space-y-4">
                    <div className="aspect-[16/10] bg-slate-200 rounded-md"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center text-red-700">
                <p className="font-semibold text-sm">{error}</p>
                <button
                  onClick={fetchVehicles}
                  className="mt-4 px-4 py-2 bg-red-700 text-white rounded-md text-xs font-semibold"
                >
                  Thử lại
                </button>
              </div>
            ) : sortedVehicles.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border border-slate-200 p-8 shadow-xs">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-1">
                  Không tìm thấy xe phù hợp
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  Không có xe nào khớp với tiêu chí tìm kiếm hoặc lịch trống hiện tại. Vui lòng đổi tiêu chí lọc hoặc ngày nhận/trả xe.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedVehicles.map((item) => {
                  const car = item.vehicle;
                  const isReady = car.status === 'READY';
                  const transmissionLabel = car.transmission === 'AUTO' ? 'Tự động' : 'Số sàn';
                  const fuelLabel = car.fuelType === 'ELECTRIC' ? 'Điện' : car.fuelType === 'DIESEL' ? 'Dầu' : 'Xăng';

                  return (
                    <div 
                      key={car.id}
                      className="velora-card overflow-hidden flex flex-col group hover:-translate-y-0.5"
                    >
                      {/* 16:10 Image Container */}
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                        <img
                          src={car.imageUrl || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />

                        {/* Top Left Status Badge */}
                        <div className="absolute top-3 left-3">
                          <span className={isReady ? 'badge-ready' : 'badge-rented'}>
                            {isReady ? 'Sẵn sàng giao' : 'Đang cho thuê'}
                          </span>
                        </div>

                        {/* Top Right Tag */}
                        <div className="absolute top-3 right-3 bg-white/95 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 tracking-wider">
                          {car.year || 2024} • {fuelLabel}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Name + License Plate */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-base text-zinc-950 group-hover:text-blue-900 transition-colors leading-snug truncate" title={`${car.make} ${car.model}`}>
                              {car.make} {car.model}
                            </h3>
                            <span className="license-plate shrink-0">
                              {car.licensePlate}
                            </span>
                          </div>

                          <div className="flex items-center text-xs text-slate-600 mb-3 truncate">
                            <MapPin className="w-3 h-3 mr-1 text-slate-500 shrink-0" />
                            <span className="truncate">{car.pickupLocation || 'VP VELORA (Trụ sở)'}</span>
                          </div>

                          {/* 3-grid specs */}
                          <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] font-semibold text-slate-600 mb-4">
                            <div className="flex flex-col items-center justify-center text-center">
                              <span className="text-[10px] text-slate-600 font-medium">Chỗ ngồi</span>
                              <span className="font-bold text-zinc-900 tabular-nums">{car.seats || 5} chỗ</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center border-x border-slate-200">
                              <span className="text-[10px] text-slate-600 font-medium">Hộp số</span>
                              <span className="font-bold text-zinc-900">{transmissionLabel}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                              <span className="text-[10px] text-slate-600 font-medium">Hạn mức</span>
                              <span className="font-bold text-zinc-900 tabular-nums">{car.dailyMileageLimit || 300} km/n</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            {item.totalDays > 0 ? (
                              <>
                                <div className="text-[10px] text-slate-600 font-medium">
                                  Tổng {item.totalDays} ngày {item.appliedDiscountPercent > 0 && <span className="text-emerald-600 font-bold">(-{item.appliedDiscountPercent}%)</span>}
                                </div>
                                <div className="text-base font-extrabold text-blue-900 tabular-nums">
                                  {formatCurrency(item.estimatedTotalFee)}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-[10px] uppercase font-semibold text-slate-600 tracking-wider">
                                  Giá thuê
                                </div>
                                <div className="text-base font-extrabold text-blue-900 tabular-nums">
                                  {formatCurrency(car.dailyRate)}
                                  <span className="text-xs font-normal text-slate-600 ml-0.5">/ngày</span>
                                </div>
                              </>
                            )}
                            <div className="text-[10px] text-slate-600 font-medium">
                              Cọc {formatCurrency(car.depositAmount || 15000000)}
                            </div>
                          </div>

                          <Link
                            to={`/cars/${car.id}?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&pickupLocation=${encodeURIComponent(pickupLocation)}`}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-blue-900 text-white text-xs font-bold rounded-md shadow-xs transition-colors shrink-0"
                          >
                            Xem chi tiết
                          </Link>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
};

export default CarCatalogPage;
