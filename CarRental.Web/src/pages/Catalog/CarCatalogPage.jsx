import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Filter, 
  Users, 
  Fuel, 
  Settings, 
  ChevronDown, 
  Check, 
  X, 
  RotateCcw, 
  SlidersHorizontal, 
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Tag,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import vehicleService from '../../services/vehicleService';
import { formatCurrency } from '../../utils/formatters';
import { getPrimaryImageUrl, handleImageError } from '../../utils/imageGalleryHelper';

const BRANDS = [
  'Porsche', 
  'Mercedes-Benz', 
  'BMW', 
  'VinFast', 
  'Toyota', 
  'Hyundai', 
  'Kia', 
  'Mazda', 
  'Ford', 
  'Lexus', 
  'Land Rover', 
  'Audi', 
  'Honda', 
  'Mitsubishi', 
  'McLaren'
];

const LOCATIONS = [
  'Tất cả địa điểm',
  'Hồ Chí Minh',
  'Hồ Chí Minh (Trụ sở Tân Bình)',
  'Hồ Chí Minh (Quận 1 / Landmark)',
  'Hà Nội',
  'Hà Nội (Cầu Giấy / Nội Bài)',
  'Đà Nẵng',
  'Đà Nẵng (Sân bay Đà Nẵng)'
];

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới 1 triệu', min: '', max: '1000000' },
  { label: '1 - 2 triệu', min: '1000000', max: '2000000' },
  { label: '2 - 4 triệu', min: '2000000', max: '4000000' },
  { label: 'Trên 4 triệu', min: '4000000', max: '' }
];

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả xe' },
  { id: 'READY', label: '🟢 Sẵn sàng cho thuê' }
];

const CarCatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search input states
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [pickupLocation, setPickupLocation] = useState(searchParams.get('pickupLocation') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');

  // Filter States
  const [statusTab, setStatusTab] = useState(searchParams.get('status') || 'ALL');
  const [filters, setFilters] = useState({
    brand: searchParams.get('brand') || '',
    seats: searchParams.get('seats') || '',
    transmission: searchParams.get('transmission') || '',
    fuelType: searchParams.get('fuelType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });

  const [sortBy, setSortBy] = useState('price_asc');

  // Min datetime for date pickers
  const nowStr = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, []);

  const toSafeIso = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    } catch {
      return '';
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        keyword: keyword?.trim() || '',
        pickupLocation: pickupLocation && pickupLocation !== 'Tất cả địa điểm' ? pickupLocation : '',
        startTime: toSafeIso(startTime),
        endTime: toSafeIso(endTime),
        brand: filters.brand || '',
        seats: filters.seats || '',
        transmission: filters.transmission || '',
        fuelType: filters.fuelType || '',
        minPrice: filters.minPrice || '',
        maxPrice: filters.maxPrice || '',
        status: statusTab !== 'ALL' ? statusTab : '',
        sortBy
      };

      const response = await vehicleService.searchVehicles(params);
      const data = response?.value || response?.data || response;
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to search vehicles', err);
      setError('Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng bấm "Thử lại".');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filters, pickupLocation, statusTab, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePricePreset = (min, max) => {
    setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }));
  };

  const resetFilters = () => {
    setKeyword('');
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
    setStatusTab('ALL');
    setSortBy('price_asc');
  };

  // Estimate rental duration
  const rentalDuration = useMemo(() => {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;

    const diffHours = (end - start) / (1000 * 60 * 60);
    const days = Math.ceil(diffHours / 24);
    return {
      hours: Math.round(diffHours),
      days: days <= 0 ? 1 : days,
      hasDiscount: days >= 3
    };
  }, [startTime, endTime]);

  // Client-side quick sort fallback with statusTab filter
  const sortedVehicles = useMemo(() => {
    let list = Array.isArray(vehicles) ? vehicles.filter(item => item && item.vehicle) : [];
    if (statusTab === 'READY') {
      list = list.filter(item => item.isAvailable !== false && item.vehicle?.status === 'READY');
    }
    return list.sort((a, b) => {
      const priceA = (a?.estimatedTotalFee && a.estimatedTotalFee > 0) ? a.estimatedTotalFee : (a?.vehicle?.dailyRate || 0);
      const priceB = (b?.estimatedTotalFee && b.estimatedTotalFee > 0) ? b.estimatedTotalFee : (b?.vehicle?.dailyRate || 0);

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'newest') return new Date(b?.vehicle?.createdAt || 0) - new Date(a?.vehicle?.createdAt || 0);
      if (sortBy === 'year_desc') return (b?.vehicle?.manufactureYear || 0) - (a?.vehicle?.manufactureYear || 0);
      if (sortBy === 'name_asc') {
        const nameA = `${a?.vehicle?.make} ${a?.vehicle?.model}`;
        const nameB = `${b?.vehicle?.make} ${b?.vehicle?.model}`;
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  }, [vehicles, sortBy, statusTab]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.brand) count++;
    if (filters.seats) count++;
    if (filters.transmission) count++;
    if (filters.fuelType) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (keyword) count++;
    if (pickupLocation && pickupLocation !== 'Tất cả địa điểm') count++;
    if (statusTab !== 'ALL') count++;
    return count;
  }, [filters, keyword, pickupLocation, statusTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      <Navbar isVisible={true} />

      {/* Top Search & Filter Bar */}
      <div className="pt-24 pb-6 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                Dịch Vụ Thuê Xe Tự Lái Chuẩn Đức • Bảo Hiểm Toàn Diện
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-3">
                <span>Bộ Sưu Tập Xe VELORA</span>
                <span className="text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                  {vehicles.length} xe
                </span>
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
                <option value="price_asc">Giá thuê: Thấp → Cao</option>
                <option value="price_desc">Giá thuê: Cao → Thấp</option>
                <option value="year_desc">Đời xe mới nhất</option>
                <option value="newest">Vừa thêm vào đội xe</option>
                <option value="name_asc">Tên thương hiệu (A → Z)</option>
              </select>
            </div>
          </div>

          {/* Quick Location, Keyword & Date Search Bar */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
              
              {/* Keyword Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm tên xe, dòng xe, biển số..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 placeholder-slate-400 focus:outline-none focus:border-blue-900 transition-colors"
                />
                {keyword && (
                  <button 
                    type="button" 
                    onClick={() => { setKeyword(''); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Pickup Location */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 transition-colors cursor-pointer"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc === 'Tất cả địa điểm' ? '' : loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  value={startTime}
                  min={nowStr}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 transition-colors"
                  title="Ngày nhận xe"
                />
              </div>

              {/* End Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  value={endTime}
                  min={startTime || nowStr}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 transition-colors"
                  title="Ngày trả xe"
                />
              </div>

              {/* Submit Search Button */}
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-blue-900 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Kiểm tra xe trống</span>
              </button>
            </div>

            {/* Rental Duration Notice when dates are entered */}
            {rentalDuration && (
              <div className="flex flex-wrap items-center justify-between text-xs bg-white px-3.5 py-2 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-blue-950 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-blue-900" />
                  <span>Dự kiến hành trình: <strong className="text-zinc-950">{rentalDuration.days} ngày</strong> (~{rentalDuration.hours} giờ thuê)</span>
                </div>
                {rentalDuration.hasDiscount ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded font-bold text-[11px] border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Tự động áp dụng chiết khấu thuê dài ngày (-5% đến -15%)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    💡 Thuê từ 3 ngày trở lên để nhận chiết khấu tiết kiệm
                  </span>
                )}
              </div>
            )}
          </form>

          {/* Quick Status Toggle: Tất cả xe & Sẵn sàng cho thuê */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setStatusTab('ALL')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  statusTab === 'ALL'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-slate-600 hover:text-zinc-950'
                }`}
              >
                Tất cả xe ({vehicles.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('READY')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusTab === 'READY'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-zinc-950'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusTab === 'READY' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                Sẵn sàng cho thuê
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {statusTab === 'READY' 
                ? 'Đang lọc các xe trống lịch, sẵn sàng giao ngay' 
                : 'Hiển thị tất cả xe (bao gồm xe đang cho thuê và đã cọc)'}
            </div>
          </div>

        </div>
      </div>

      {/* Main Catalog Layout: 280px Fixed Filter + 3-Col Cars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* CỘT TRÁI (280px, cố định khi cuộn, có thanh cuộn riêng độc lập) */}
          <aside className="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col max-h-[calc(100vh-7.5rem)] overflow-hidden">
              
              {/* Header cố định trên đầu khung lọc */}
              <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-blue-900" />
                  Bộ lọc chi tiết {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Xóa lọc
                  </button>
                )}
              </div>

              {/* Vùng các tiêu chí lọc: Có thanh cuộn riêng biệt */}
              <div className="p-4 sm:p-5 pt-3 overflow-y-auto space-y-5 flex-1 pr-3">

              {/* Filter 1: Hãng xe */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                  Hãng sản xuất
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
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

              {/* Filter 2: Khoảng giá thuê (Presets & Inputs) */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                  Mức giá thuê (ngày)
                </label>
                <div className="space-y-1.5">
                  {PRICE_PRESETS.map((p) => {
                    const isSelected = filters.minPrice === p.min && filters.maxPrice === p.max;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handlePricePreset(p.min, p.max)}
                        className={`w-full py-1.5 px-2.5 text-xs rounded-md border font-semibold text-left transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 border-blue-300'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>{p.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-900" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter 3: Số chỗ ngồi */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                  Số chỗ ngồi
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Tất cả', val: '' },
                    { label: '2 chỗ', val: '2' },
                    { label: '4 - 5 chỗ', val: '5' },
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

              {/* Filter 4: Hộp số */}
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

              {/* Filter 5: Nhiên liệu */}
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

              {/* Fast Hold 500k Notice */}
              <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg text-[11px] text-amber-950 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-900">
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  Cọc giữ xe 500k siêu tốc:
                </div>
                <p>Khóa giữ xe ngay lập tức, không lo bị khách khác đặt trước. Bổ sung CCCD & GPLX sau trong trang cá nhân!</p>
              </div>

              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: LƯỚI XE (3 CỘT TRÊN DESKTOP) */}
          <main className="flex-1 w-full min-w-0">
            
            {/* Active Filters Summary Bar */}
            {activeFiltersCount > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-500 text-[11px] uppercase">Đang lọc:</span>
                {keyword && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                    Từ khóa: "{keyword}"
                    <button onClick={() => setKeyword('')}><X className="w-3 h-3 hover:text-red-600" /></button>
                  </span>
                )}
                {filters.brand && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                    Hãng: {filters.brand}
                    <button onClick={() => handleFilterChange('brand', '')}><X className="w-3 h-3 hover:text-red-600" /></button>
                  </span>
                )}
                {filters.seats && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                    Số chỗ: {filters.seats === '5' ? '4-5 chỗ' : `${filters.seats} chỗ`}
                    <button onClick={() => handleFilterChange('seats', '')}><X className="w-3 h-3 hover:text-red-600" /></button>
                  </span>
                )}
                {filters.transmission && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                    Hộp số: {filters.transmission}
                    <button onClick={() => handleFilterChange('transmission', '')}><X className="w-3 h-3 hover:text-red-600" /></button>
                  </span>
                )}
                {filters.fuelType && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                    Nhiên liệu: {filters.fuelType}
                    <button onClick={() => handleFilterChange('fuelType', '')}><X className="w-3 h-3 hover:text-red-600" /></button>
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                    Giá: {filters.minPrice ? formatCurrency(filters.minPrice) : '0đ'} - {filters.maxPrice ? formatCurrency(filters.maxPrice) : '∞'}
                    <button onClick={() => handlePricePreset('', '')}><X className="w-3 h-3 hover:text-red-600" /></button>
                  </span>
                )}
                {statusTab !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">
                    Trạng thái: {STATUS_TABS.find(t => t.id === statusTab)?.label}
                    <button onClick={() => setStatusTab('ALL')}><X className="w-3 h-3 hover:text-red-600" /></button>
                  </span>
                )}
                <button
                  onClick={resetFilters}
                  className="ml-auto text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

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
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-red-700 shadow-xs">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="font-semibold text-sm mb-1">{error}</p>
                <p className="text-xs text-red-500 mb-4">Không thể kết nối tới dịch vụ tra cứu xe.</p>
                <button
                  onClick={fetchVehicles}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : sortedVehicles.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-1">
                  Không tìm thấy xe phù hợp
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  Không có phương tiện nào khớp với tiêu chí tìm kiếm hoặc khoảng thời gian bạn đã chọn.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Xóa toàn bộ bộ lọc
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
                      className="velora-card overflow-hidden flex flex-col group hover:-translate-y-0.5 transition-all duration-200 border border-slate-200/90 hover:shadow-md"
                    >
                      {/* 16:10 Image Container */}
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                        <img
                          src={getPrimaryImageUrl(car.imageUrl)}
                          alt={`${car.make} ${car.model}`}
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />

                        {/* Top Left Status Badge */}
                        <div className="absolute top-3 left-3">
                          {car.status === 'READY' && item.isAvailable !== false ? (
                            <span className="badge-ready shadow-xs">Sẵn sàng giao</span>
                          ) : car.status === 'RENTED' ? (
                            <span className="badge-rented shadow-xs">Đang cho thuê</span>
                          ) : (
                            <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded shadow-xs">
                              Không khả dụng
                            </span>
                          )}
                        </div>

                        {/* Top Right Tag */}
                        <div className="absolute top-3 right-3 bg-white/95 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 tracking-wider shadow-xs">
                          {car.manufactureYear || car.year || 2024} • {fuelLabel}
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

                          {/* Pickup Location */}
                          <div className="flex items-center text-xs text-slate-600 mb-2 truncate">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
                            <span className="truncate">{car.pickupLocation || 'VP VELORA (Trụ sở Tân Bình)'}</span>
                          </div>

                          {/* Availability Note */}
                          {!item.isAvailable ? (
                            <div className={`mb-3 text-[11px] font-medium px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                              car.status === 'RENTED'
                                ? 'text-blue-900 bg-blue-50 border-blue-200'
                                : 'text-slate-700 bg-slate-100 border-slate-200'
                            }`} title={car.status === 'RENTED' ? 'Xe hiện đang được khách hàng thuê và sử dụng.' : 'Xe hiện không thể được đặt thuê vì bất kỳ lý do nào.'}>
                              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${car.status === 'RENTED' ? 'text-blue-600' : 'text-slate-500'}`} />
                              <span className="truncate">{car.status === 'RENTED' ? 'Xe hiện đang được khách hàng thuê và sử dụng.' : 'Xe hiện không thể được đặt thuê vì bất kỳ lý do nào.'}</span>
                            </div>
                          ) : (
                            <div className="mb-3 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Trống lịch • Có thể đặt giao xe ngay</span>
                            </div>
                          )}

                          {/* 3-grid specs */}
                          <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] font-semibold text-slate-600 mb-4">
                            <div className="flex flex-col items-center justify-center text-center">
                              <span className="text-[10px] text-slate-500 font-medium">Chỗ ngồi</span>
                              <span className="font-bold text-zinc-900 tabular-nums">{car.seats || 5} chỗ</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center border-x border-slate-200">
                              <span className="text-[10px] text-slate-500 font-medium">Hộp số</span>
                              <span className="font-bold text-zinc-900">{transmissionLabel}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                              <span className="text-[10px] text-slate-500 font-medium">Hạn mức</span>
                              <span className="font-bold text-zinc-900 tabular-nums">{car.mileageLimit || car.dailyMileageLimit || 300} km/n</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
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
                                <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                                  Giá thuê
                                </div>
                                <div className="text-base font-extrabold text-blue-900 tabular-nums">
                                  {formatCurrency(car.dailyRate)}
                                  <span className="text-xs font-normal text-slate-600 ml-0.5">/ngày</span>
                                </div>
                              </>
                            )}
                            <div className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                              <Zap className="w-3 h-3 text-amber-600" />
                              Cọc giữ xe 500.000đ
                            </div>
                          </div>

                          <Link
                            to={`/cars/${car.id}?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&pickupLocation=${encodeURIComponent(pickupLocation)}`}
                            className={`px-3.5 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1.5 ${
                              item.isAvailable
                                ? 'bg-slate-900 hover:bg-blue-900 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            <span>{item.isAvailable ? 'Đặt xe ngay' : 'Xem chi tiết'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
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
