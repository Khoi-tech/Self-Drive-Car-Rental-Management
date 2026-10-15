import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Car, 
  Search, 
  ShieldCheck, 
  FileSignature, 
  QrCode, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Gauge, 
  ChevronRight,
  Sparkles,
  Play
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import IntroVideo from '../components/intro/IntroVideo';
import vehicleService from '../services/vehicleService';
import { formatCurrency } from '../utils/formatters';

const LOCATIONS = [
  'Hồ Chí Minh (Trụ sở Tân Bình)',
  'Hồ Chí Minh (Quận 1 / Landmark)',
  'Hà Nội (Cầu Giấy / Nội Bài)',
  'Đà Nẵng (Sân bay Đà Nẵng)'
];

const CAR_TYPES = [
  { label: 'Tất cả dòng xe', value: '' },
  { label: 'Sedan sang trọng', value: 'Sedan' },
  { label: 'SUV gầm cao', value: 'SUV' },
  { label: 'Coupe thể thao', value: 'Coupe' }
];

const Home = () => {
  const navigate = useNavigate();
  const [isIntroComplete, setIsIntroComplete] = useState(false);

  // Floating Booking Bar state
  const [pickupLocation, setPickupLocation] = useState('Hồ Chí Minh (Trụ sở Tân Bình)');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [carType, setCarType] = useState('');

  // Featured cars for preview
  const [featuredCars, setFeaturedCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);

  // Set default dates: tomorrow 08:00 to 3 days later 18:00
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const returnDay = new Date(tomorrow);
    returnDay.setDate(returnDay.getDate() + 3);
    returnDay.setHours(18, 0, 0, 0);

    const pad = (n) => String(n).padStart(2, '0');
    const toIsoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setStartTime(toIsoLocal(tomorrow));
    setEndTime(toIsoLocal(returnDay));

    // Fetch initial featured cars
    const loadFeatured = async () => {
      try {
        setLoadingCars(true);
        const res = await vehicleService.getAllVehicles();
        const data = res?.data || res;
        if (Array.isArray(data)) {
          // Take top 3 cars
          setFeaturedCars(data.slice(0, 3));
        }
      } catch (err) {
        console.warn('Failed to load featured cars:', err);
      } finally {
        setLoadingCars(false);
      }
    };
    loadFeatured();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickupLocation) params.set('pickupLocation', pickupLocation);
    if (startTime) params.set('startTime', startTime);
    if (endTime) params.set('endTime', endTime);
    if (carType) params.set('brand', carType);
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      {/* Intro Video Overlay */}
      {!isIntroComplete && (
        <IntroVideo onComplete={() => setIsIntroComplete(true)} />
      )}

      {/* Primary Header */}
      <Navbar isVisible={isIntroComplete} />

      {/* Main Content */}
      <main 
        className={`flex-1 pt-18 transition-opacity duration-1000 ease-in-out ${
          isIntroComplete ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!isIntroComplete}
      >
        
        {/* HERO SECTION - Editorial Automotive */}
        <section className="relative bg-white border-b border-slate-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 lg:pt-16 lg:pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 tracking-wide uppercase">
                  <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                  Nền Tảng Quản Lý Thuê Xe Tự Lái Chuẩn Đức
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.15]">
                  Tự do làm chủ hành trình với đội xe <span className="text-blue-900 underline decoration-slate-300 decoration-2 underline-offset-8">đẳng cấp</span>.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
                  Trải nghiệm thuê xe tự lái minh bạch 100%: Ký hợp đồng số tức thì, kiểm định ODO & nhiên liệu thực tế, thanh toán và hoàn cọc VietQR chuẩn ngân hàng chỉ trong 30 giây.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href="#booking-bar"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-blue-900 text-white font-semibold text-sm rounded-md shadow-xs transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    <span>Đặt xe trực tuyến</span>
                  </a>
                  <Link
                    to="/cars"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-sm rounded-md transition-colors"
                  >
                    <span>Khám phá 27 mẫu xe</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </Link>
                  <button
                    onClick={() => setIsIntroComplete(false)}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-sm rounded-md transition-colors"
                    title="Xem lại video mở đầu"
                  >
                    <Play className="w-3.5 h-3.5 text-blue-900 fill-blue-900" />
                    <span>Xem Intro</span>
                  </button>
                </div>

                {/* Micro trust indicators */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Xe đời 2023 - 2026</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Bảo hiểm 2 chiều PVI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Hoàn cọc 24/7 tức thì</span>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="lg:col-span-5 relative">
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm relative aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80"
                    alt="Porsche Taycan VELORA Fleet"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-md flex items-center gap-2.5 shadow-xs">
                    <span className="license-plate">51K-911.88</span>
                    <span className="text-xs font-bold text-zinc-950">Porsche Taycan 4S</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FLOATING BOOKING BAR (Search Component) */}
        <section id="booking-bar" className="relative -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
          <form 
            onSubmit={handleSearchSubmit}
            className="bg-white rounded-lg border border-slate-200 shadow-md p-4 sm:p-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              
              {/* Field 1: Pickup Location */}
              <div className="px-2 pt-2 md:pt-0">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-900" />
                  Địa điểm nhận xe
                </label>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Field 2: Start Date Time */}
              <div className="px-2 pt-3 md:pt-0">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-900" />
                  Thời gian nhận xe
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                />
              </div>

              {/* Field 3: End Date Time */}
              <div className="px-2 pt-3 md:pt-0">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-900" />
                  Thời gian trả xe
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                />
              </div>

              {/* Field 4: Car Type & Action */}
              <div className="px-2 pt-3 md:pt-0 flex flex-col justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-blue-900" />
                  Phân khúc
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={carType}
                    onChange={(e) => setCarType(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                  >
                    {CAR_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="shrink-0 px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tìm xe trống</span>
                  </button>
                </div>
              </div>

            </div>
          </form>
        </section>

        {/* FEATURED CARS SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-900 mb-1">
                Bộ sưu tập xe sẵn sàng
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
                Các dòng xe nổi bật trong tháng
              </h2>
            </div>
            <Link
              to="/cars"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-950 transition-colors uppercase tracking-wider"
            >
              <span>Xem toàn bộ 27 xe</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingCars ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="velora-card p-4 animate-pulse space-y-4">
                  <div className="aspect-[16/10] bg-slate-200 rounded-md"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-8 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCars.map((car) => {
                const isReady = car.status === 'READY';
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
                      
                      {/* Top left status badge */}
                      <div className="absolute top-3 left-3">
                        <span className={isReady ? 'badge-ready' : 'badge-rented'}>
                          {isReady ? 'Sẵn sàng giao' : 'Đang cho thuê'}
                        </span>
                      </div>

                      {/* Top right transmission tag */}
                      <div className="absolute top-3 right-3 bg-white/95 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        {car.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Name & Plate */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-bold text-base text-zinc-950 group-hover:text-blue-900 transition-colors leading-snug">
                            {car.make} {car.model}
                          </h3>
                          <span className="license-plate shrink-0">
                            {car.licensePlate}
                          </span>
                        </div>

                        {/* 3-grid specs */}
                        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] font-semibold text-slate-600 mb-4">
                          <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] text-slate-600 font-medium">Chỗ ngồi</span>
                            <span className="font-bold text-zinc-900 tabular-nums">{car.seats || 5} chỗ</span>
                          </div>
                          <div className="flex flex-col items-center justify-center text-center border-x border-slate-200">
                            <span className="text-[10px] text-slate-600 font-medium">Nhiên liệu</span>
                            <span className="font-bold text-zinc-900">{car.fuelType || 'Xăng'}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] text-slate-600 font-medium">Định mức</span>
                            <span className="font-bold text-zinc-900 tabular-nums">{car.dailyMileageLimit || 300} km/ngày</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-slate-600 tracking-wider">
                            Giá thuê ngày
                          </div>
                          <div className="text-base font-extrabold text-blue-900 tabular-nums">
                            {formatCurrency(car.dailyRate)}
                            <span className="text-xs font-normal text-slate-600 ml-0.5">/ngày</span>
                          </div>
                          <div className="text-[10px] text-slate-600 font-medium">
                            Cọc {formatCurrency(car.depositAmount || 15000000)}
                          </div>
                        </div>

                        <Link
                          to={`/cars/${car.id}`}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-blue-900 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
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
        </section>

        {/* FUNCTIONAL VALUE PROPOSITIONS (Strictly Anti-AI, Pure Facts) */}
        <section id="experience" className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-900 mb-1">
                Quy trình vận hành khép kín
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
                Thuê xe tự lái chuẩn mực và minh bạch tài chính
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Không thủ tục rườm rà, không giữ giấy tờ tùy thân gốc, giải quyết bài toán cọc và hoàn cọc minh bạch 100%.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-900 shadow-xs">
                  <FileSignature className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-950">1. Ký HĐ Điện Tử 100%</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Thẩm định CCCD & GPLX trực tuyến. Ký chữ ký số ngay trên trình duyệt, không cần in hợp đồng giấy.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-900 shadow-xs">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-950">2. Đặt Cọc Chuẩn VietQR</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mã QR động NAPAS 24/7 tự động điền số tiền và mã đơn. Xác nhận giữ chỗ xe thành công tức thì.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-900 shadow-xs">
                  <Gauge className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-950">3. Biên Bản ODO Số Hóa</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nhân viên và khách đồng kiểm số km xuất phát, mức xăng và chụp ảnh hiện trạng 4 góc trước khi lăn bánh.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-900 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-950">4. Quyết Toán Hoàn Cọc Live</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nghiệm thu trả xe tự động đối trừ phụ phí vượt km/xăng. Hoàn trả tiền cọc về tài khoản ngân hàng ngay tại quầy.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <span className="text-lg font-extrabold tracking-widest uppercase text-white">VELORA</span>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hệ thống vận hành dịch vụ thuê xe tự lái cao cấp. Tiêu chuẩn minh bạch, xe sang đời mới và an toàn tuyệt đối trên từng cây số.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Về VELORA</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/cars" className="hover:text-white transition-colors">Bộ sưu tập xe</Link></li>
              <li><Link to="/cars#pricing" className="hover:text-white transition-colors">Bảng giá & Chiết khấu</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Tra cứu đơn thuê</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Chính sách & An toàn</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Quy định độ tuổi & bằng lái B1/B2</li>
              <li>Bảo hiểm vật chất 2 chiều PTI/PVI</li>
              <li>Chính sách hoàn cọc trong 24h</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Hỗ trợ khẩn cấp 24/7</h4>
            <div className="text-amber-400 font-bold text-base tabular-nums">1900 8888 99</div>
            <p className="text-slate-400 mt-1">Trụ sở chính: Tòa nhà VELORA, 128 Nguyễn Đình Hoàn, Cầu Giấy, Hà Nội & Chi nhánh TP.HCM</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>© 2026 VELORA Car Rental Management Platform. All rights reserved.</span>
          <span>Bản quyền đồ án CNPM_NC — HUFLIT</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
