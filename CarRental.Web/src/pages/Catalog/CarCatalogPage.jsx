import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, Users, Fuel, Settings, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import vehicleService from '../../services/vehicleService';

const BRANDS = ['BMW', 'Mercedes', 'Audi', 'Toyota', 'VinFast', 'Hyundai', 'Kia', 'Ford', 'Honda', 'Mazda'];
const LOCATIONS = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

const CarCatalogPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search Params
  const [pickupLocation, setPickupLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Filter Params
  const [filters, setFilters] = useState({
    brand: '',
    seats: '',
    transmission: '',
    fuelType: '',
    minPrice: '',
    maxPrice: ''
  });

  const [sortBy, setSortBy] = useState('price_asc');

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        pickupLocation: pickupLocation,
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
  }, [filters, pickupLocation]); // Refetch on filter or location change

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
    
    // We update a dummy state or just rely on the new filters object reference to trigger useEffect.
    // Since setFilters creates a new object {}, useEffect([filters]) will trigger and call fetchVehicles 
    // with the latest empty states (pickupLocation, startTime, etc.).
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Sort vehicles locally
  const sortedVehicles = [...vehicles].sort((a, b) => {
    const priceA = a.estimatedTotalFee > 0 ? a.estimatedTotalFee : a.vehicle.dailyRate;
    const priceB = b.estimatedTotalFee > 0 ? b.estimatedTotalFee : b.vehicle.dailyRate;
    
    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'newest') return new Date(b.vehicle.createdAt) - new Date(a.vehicle.createdAt);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar isVisible={true} />
      
      {/* Header & Quick Search */}
      <div className="pt-28 pb-10 px-6 bg-gradient-to-b from-zinc-900 to-[#0a0a0a] border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-light mb-8">Bộ Sưu Tập Xe Khả Dụng</h1>
          
          <form onSubmit={handleSearch} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row gap-4 backdrop-blur-sm">
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <select 
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-white transition-colors appearance-none"
              >
                <option value="">Tất cả địa điểm</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="datetime-local" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="Ngày nhận xe"
              />
            </div>
            
            <div className="flex-1 relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="datetime-local" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="Ngày trả xe"
              />
            </div>
            
            <button type="submit" className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              Tìm kiếm xe
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar Filters */}
        <div className="w-full lg:w-1/4 flex-shrink-0 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium flex items-center gap-2">
              <Filter className="w-5 h-5" /> Lọc kết quả
            </h3>
            <button onClick={resetFilters} className="text-sm text-zinc-400 hover:text-white transition-colors">
              Xóa bộ lọc
            </button>
          </div>

          {/* Brand Filter */}
          <div className="space-y-4">
            <h4 className="font-medium text-zinc-300">Hãng xe</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleFilterChange('brand', '')}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${filters.brand === '' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500'}`}
              >
                Tất cả
              </button>
              {BRANDS.map(b => (
                <button 
                  key={b}
                  onClick={() => handleFilterChange('brand', b)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${filters.brand === b ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Seats Filter */}
          <div className="space-y-4">
            <h4 className="font-medium text-zinc-300">Số chỗ ngồi</h4>
            <div className="flex flex-wrap gap-2">
              {[ {l: 'Tất cả', v: ''}, {l: '4-5 chỗ', v: '4'}, {l: '7 chỗ', v: '7'} ].map(opt => (
                <button 
                  key={opt.l}
                  onClick={() => handleFilterChange('seats', opt.v)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${filters.seats === opt.v ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission & Fuel */}
          <div className="space-y-4">
             <h4 className="font-medium text-zinc-300">Hộp số</h4>
             <select 
               value={filters.transmission}
               onChange={(e) => handleFilterChange('transmission', e.target.value)}
               className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-500"
             >
               <option value="">Tất cả</option>
               <option value="AUTO">Tự động (AUTO)</option>
               <option value="MANUAL">Số sàn (MANUAL)</option>
             </select>
          </div>
          
          <div className="space-y-4">
             <h4 className="font-medium text-zinc-300">Nhiên liệu</h4>
             <select 
               value={filters.fuelType}
               onChange={(e) => handleFilterChange('fuelType', e.target.value)}
               className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-500"
             >
               <option value="">Tất cả</option>
               <option value="PETROL">Xăng (PETROL)</option>
               <option value="DIESEL">Dầu (DIESEL)</option>
               <option value="ELECTRIC">Điện (ELECTRIC)</option>
             </select>
          </div>

        </div>

        {/* Main Content Area */}
        <div className="w-full lg:w-3/4">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-zinc-800/50">
            <h2 className="text-xl font-light">
              <span className="font-medium">{vehicles.length}</span> xe phù hợp
            </h2>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <span className="text-zinc-500 text-sm">Sắp xếp theo:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none cursor-pointer"
              >
                <option value="price_asc" className="bg-zinc-900">Giá tăng dần</option>
                <option value="price_desc" className="bg-zinc-900">Giá giảm dần</option>
                <option value="newest" className="bg-zinc-900">Mới nhất</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p>Đang tìm kiếm xe...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center text-red-400">
              <p>{error}</p>
            </div>
          ) : sortedVehicles.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-xl font-medium mb-2">Không tìm thấy xe phù hợp</h3>
              <p className="text-zinc-500 max-w-md mx-auto">
                Không tìm thấy xe phù hợp trong khoảng thời gian này. Vui lòng thử đổi ngày, địa điểm hoặc tiêu chí lọc.
              </p>
              <button onClick={resetFilters} className="mt-6 px-6 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors">
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedVehicles.map((item) => (
                <div key={item.vehicle.id} className="group bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all duration-300 flex flex-col">
                  {/* Image container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
                    {item.vehicle.imageUrl ? (
                      <img 
                        src={item.vehicle.imageUrl} 
                        alt={`${item.vehicle.make} ${item.vehicle.model}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 group-hover:scale-105 transition-transform duration-500">
                        <Fuel className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-sm">Chưa có hình ảnh</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                      {item.vehicle.make}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-medium mb-1 truncate" title={`${item.vehicle.make} ${item.vehicle.model}`}>
                      {item.vehicle.make} {item.vehicle.model}
                    </h3>
                    
                    <div className="flex items-center text-zinc-400 text-sm mb-4">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      <span className="truncate">{item.vehicle.pickupLocation}</span>
                    </div>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="inline-flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-300">
                        <Users className="w-3 h-3" /> {item.vehicle.seats} chỗ
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-300">
                        <Settings className="w-3 h-3" /> {item.vehicle.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-300">
                        <Fuel className="w-3 h-3" /> {item.vehicle.fuelType === 'PETROL' ? 'Xăng' : item.vehicle.fuelType === 'ELECTRIC' ? 'Điện' : 'Dầu'}
                      </span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-zinc-800 flex items-end justify-between">
                      <div>
                        {item.totalDays > 0 ? (
                          <>
                            <div className="text-xs text-zinc-500 mb-1">
                              Tổng cộng {item.totalDays} ngày 
                              {item.appliedDiscountPercent > 0 && <span className="text-green-500 ml-1">(-{item.appliedDiscountPercent}%)</span>}
                            </div>
                            <div className="text-xl font-medium text-white">
                              {formatCurrency(item.estimatedTotalFee)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs text-zinc-500 mb-1">Giá mỗi ngày</div>
                            <div className="text-xl font-medium text-white">
                              {formatCurrency(item.vehicle.dailyRate)}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Link 
                        to={`/cars/${item.vehicle.id}?startTime=${startTime}&endTime=${endTime}&pickupLocation=${pickupLocation}`} 
                        className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarCatalogPage;
