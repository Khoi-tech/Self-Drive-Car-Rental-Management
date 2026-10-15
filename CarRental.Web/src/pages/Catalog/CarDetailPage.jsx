import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Fuel, 
  Settings, 
  MapPin, 
  Shield, 
  Clock, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  X,
  Camera,
  AlertCircle, 
  Info, 
  Tag, 
  Check, 
  Gauge, 
  FileCheck,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import vehicleService from '../../services/vehicleService';
import pricingService from '../../services/pricingService';
import rentalConditionService from '../../services/rentalConditionService';
import { formatCurrencyVND } from '../../utils/formatters';
import { parseVehicleImages } from '../../utils/imageGalleryHelper';

// Helper to construct a curated multi-photo gallery for a vehicle
const getVehicleGallery = (vehicle) => {
  if (!vehicle) return [];

  const configuredImages = parseVehicleImages(vehicle.imageUrl);
  const make = (vehicle.make || '').toLowerCase();

  // Curated photo angles tailored by brand / car category
  let interiorCockpit = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80';
  let rearCabin = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
  let rearProfile = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80';
  let detailWheels = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80';

  if (make.includes('porsche')) {
    interiorCockpit = 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80';
    rearCabin = 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80';
    rearProfile = 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80';
    detailWheels = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';
  } else if (make.includes('mercedes') || make.includes('maybach')) {
    interiorCockpit = 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80';
    rearCabin = 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80';
    rearProfile = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80';
    detailWheels = 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80';
  } else if (make.includes('bmw')) {
    interiorCockpit = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80';
    rearCabin = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
    rearProfile = 'https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&w=1200&q=80';
    detailWheels = 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=80';
  } else if (make.includes('audi')) {
    interiorCockpit = 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80';
    rearCabin = 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80';
    rearProfile = 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&w=1200&q=80';
    detailWheels = 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80';
  } else if (make.includes('vinfast')) {
    interiorCockpit = 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80';
    rearCabin = 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80';
    rearProfile = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';
    detailWheels = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80';
  }

  const defaultFallbacks = [
    {
      url: configuredImages[0]?.url || vehicle.imageUrl || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      title: 'Ngoại thất góc 3/4 trước',
      shortLabel: 'Ngoại thất',
      tag: 'Góc chính',
      description: 'Tổng thể ngoại thất phía trước, đường nét khí động học và cụm đèn LED sắc nét.'
    },
    {
      url: interiorCockpit,
      title: 'Khoang lái & Vô lăng kỹ thuật số',
      shortLabel: 'Khoang lái',
      tag: 'Nội thất',
      description: 'Vô lăng thể thao trợ lực điện, màn hình cảm ứng trung tâm và tiện nghi cao cấp.'
    },
    {
      url: rearCabin,
      title: 'Hàng ghế hành khách da cao cấp',
      shortLabel: 'Hàng ghế sau',
      tag: 'Không gian',
      description: 'Khoang ngồi phía sau rộng rãi với đệm êm ái, bệ tỳ tay và cửa gió điều hòa riêng biệt.'
    },
    {
      url: rearProfile,
      title: 'Đuôi xe & Cốp để hành lý rộng rãi',
      shortLabel: 'Đuôi xe & Cốp',
      tag: 'Góc sau',
      description: 'Thiết kế đuôi xe hiện đại cùng cốp xe dung tích thoải mái cho mọi hành trình.'
    },
    {
      url: detailWheels,
      title: 'Mâm xe hợp kim & Chi tiết hoàn thiện',
      shortLabel: 'Mâm xe',
      tag: 'Chi tiết',
      description: 'Bộ la-zăng thể thao nguyên bản sáng bóng, độ hoàn thiện tinh tế trong từng đường nét.'
    }
  ];

  // Merge configured images with fallbacks for the 5 standard slots
  const gallery = [];
  for (let i = 0; i < 5; i++) {
    const configured = configuredImages[i];
    const fallback = defaultFallbacks[i];

    if (configured && configured.url) {
      gallery.push({
        id: configured.id || `angle-${i}`,
        title: configured.title || fallback.title,
        shortLabel: configured.tag || fallback.shortLabel,
        tag: configured.tag || fallback.tag,
        url: configured.url,
        description: configured.description || fallback.description
      });
    } else {
      gallery.push({
        id: `angle-${i}`,
        title: fallback.title,
        shortLabel: fallback.shortLabel,
        tag: fallback.tag,
        url: fallback.url,
        description: fallback.description
      });
    }
  }

  // Any extra configured custom images
  if (configuredImages.length > 5) {
    for (let i = 5; i < configuredImages.length; i++) {
      const extra = configuredImages[i];
      if (extra && extra.url) {
        gallery.push({
          id: extra.id || `angle-extra-${i}`,
          title: extra.title || `Hình ảnh thực tế #${i + 1}`,
          shortLabel: extra.tag || `Ảnh ${i + 1}`,
          tag: extra.tag || 'Bổ sung',
          url: extra.url,
          description: extra.description || 'Hình ảnh chi tiết bổ sung của phương tiện.'
        });
      }
    }
  }

  return gallery;
};

const CarDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [condition, setCondition] = useState(null);
  const [loading, setLoading] = useState(true);

  // Multi-photo Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Widget State
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');
  const [preview, setPreview] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Default dates if missing
  useEffect(() => {
    if (!startTime || !endTime) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const returnDay = new Date(tomorrow);
      returnDay.setDate(returnDay.getDate() + 2);
      returnDay.setHours(18, 0, 0, 0);

      const pad = (n) => String(n).padStart(2, '0');
      const toIsoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

      if (!startTime) setStartTime(toIsoLocal(tomorrow));
      if (!endTime) setEndTime(toIsoLocal(returnDay));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehRes, polRes, condRes] = await Promise.all([
          vehicleService.getVehicleById(id),
          pricingService.getPoliciesByVehicleId(id),
          rentalConditionService.getConditionByVehicleId(id).catch(() => null)
        ]);
        
        setVehicle(vehRes.data || vehRes);
        setPolicies(polRes.data || polRes || []);
        setCondition(condRes?.data || condRes);
      } catch (err) {
        console.error('Error fetching car details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (startTime && endTime && vehicle) {
      calculatePreview();
    } else {
      setPreview(null);
    }
  }, [startTime, endTime, vehicle]);

  const calculatePreview = async () => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0 || isNaN(diffDays)) {
      setPreview(null);
      return;
    }

    setCalculating(true);
    try {
      const response = await pricingService.previewPricing(id, diffDays);
      setPreview(response.data || response);
    } catch (err) {
      console.error('Failed to preview price', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleBooking = () => {
    if (!startTime || !endTime) {
      setBookingError('Vui lòng chọn đầy đủ ngày nhận và ngày trả xe để tiếp tục.');
      return;
    }
    setBookingError('');
    const location = searchParams.get('pickupLocation') || vehicle?.pickupLocation || 'Tại Cửa Hàng VELORA';
    navigate(`/booking/${id}?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&pickupLocation=${encodeURIComponent(location)}`);
  };

  const gallery = getVehicleGallery(vehicle);
  const activeImage = gallery[activeImageIndex] || gallery[0] || {
    url: vehicle?.imageUrl || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    title: 'Ngoại thất góc 3/4 trước',
    shortLabel: 'Ngoại thất',
    tag: 'Góc chính',
    description: ''
  };

  const prevImage = (e) => {
    if (e) e.stopPropagation();
    if (!gallery.length) return;
    setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    if (e) e.stopPropagation();
    if (!gallery.length) return;
    setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for gallery & lightbox (Top-level hook)
  useEffect(() => {
    if (!gallery.length) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gallery.length, isLightboxOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-300 border-t-blue-900 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Đang tải hồ sơ phương tiện...</span>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col items-center justify-center p-6 font-sans">
        <h2 className="text-xl font-bold mb-2">Không tìm thấy thông tin xe</h2>
        <p className="text-xs text-slate-500 mb-4">Xe có thể đã ngừng khai thác hoặc đường dẫn không hợp lệ.</p>
        <button 
          onClick={() => navigate('/cars')} 
          className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold"
        >
          Quay lại danh mục
        </button>
      </div>
    );
  }

  const isReady = vehicle.status === 'READY';
  const fuelLabel = vehicle.fuelType === 'ELECTRIC' ? 'Thuần Điện' : vehicle.fuelType === 'DIESEL' ? 'Động cơ Dầu' : 'Động cơ Xăng';
  const transLabel = vehicle.transmission === 'AUTO' ? 'Tự động' : 'Số sàn';

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      <Navbar isVisible={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex-1 w-full">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <button 
            onClick={() => navigate('/cars')} 
            className="flex items-center gap-1 hover:text-blue-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Danh mục xe</span>
          </button>
          <span>/</span>
          <span className="text-zinc-900 font-bold">{vehicle.make} {vehicle.model}</span>
        </div>

        {/* Asymmetrical 2-Column Layout (65% Left / 35% Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI (65% - 8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Multi-Photo Vehicle Gallery Card */}
            <div className="velora-card overflow-hidden">
              {/* Main Photo Display */}
              <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden group select-none">
                <img 
                  src={activeImage.url} 
                  alt={`${vehicle.make} ${vehicle.model} - ${activeImage.title}`} 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                />

                {/* Subtle vignette gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className={isReady ? 'badge-ready shadow-xs' : 'badge-rented shadow-xs'}>
                    {isReady ? 'Sẵn sàng bàn giao' : 'Đang cho thuê'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white/95 text-slate-800 backdrop-blur-sm border border-white/20 shadow-xs">
                    {activeImage.tag}
                  </span>
                </div>

                {/* Top Right Counter & Lightbox Button */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-black/60 text-white backdrop-blur-md tabular-nums flex items-center gap-1.5 border border-white/10">
                    <Camera className="w-3.5 h-3.5 text-slate-300" />
                    <span>{activeImageIndex + 1} / {gallery.length}</span>
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1.5 rounded-md bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-colors"
                    title="Xem ảnh toàn màn hình"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Left & Right Chevrons */}
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md border border-slate-200/80 flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 hover:scale-105"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md border border-slate-200/80 flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 hover:scale-105"
                  aria-label="Ảnh tiếp theo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Bottom Angle Info & Maximize CTA */}
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
                  <div className="text-white drop-shadow-sm pr-2">
                    <p className="text-xs sm:text-sm font-semibold tracking-wide">
                      {activeImage.title}
                    </p>
                    <p className="hidden sm:block text-[11px] text-slate-200/90 line-clamp-1">
                      {activeImage.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="pointer-events-auto text-[11px] font-medium text-white/95 hover:text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2.5 py-1 rounded border border-white/20 transition-colors shrink-0"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>

              {/* Multi-Photo Thumbnails Strip */}
              <div className="p-3 bg-slate-50 border-t border-slate-200/80">
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {gallery.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`group relative rounded-md overflow-hidden aspect-[16/10] bg-slate-200 transition-all text-left ${
                        activeImageIndex === idx 
                          ? 'ring-2 ring-blue-900 border-2 border-white shadow-sm' 
                          : 'opacity-70 hover:opacity-100 border border-slate-200'
                      }`}
                    >
                      <img 
                        src={img.url} 
                        alt={img.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <span className="block text-[10px] font-medium text-white truncate text-center leading-tight">
                          {img.shortLabel}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Micro Info */}
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                    {vehicle.make} {vehicle.model}
                  </h1>
                  <span className="license-plate text-sm px-2.5 py-1">
                    {vehicle.licensePlate}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {vehicle.pickupLocation || 'VP VELORA (Trụ sở)'}
                  </span>
                  <span>•</span>
                  <span>Năm sản xuất: <strong className="text-zinc-900">{vehicle.manufactureYear || vehicle.year || 2024}</strong></span>
                  <span>•</span>
                  <span>Màu sắc: <strong className="text-zinc-900">{vehicle.color || 'Đen Obsidian'}</strong></span>
                </div>
              </div>
            </div>

            {/* 4-Grid Key Specs */}
            <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4">
                Thông số kỹ thuật vận hành
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-md">
                  <Users className="w-5 h-5 text-blue-900 mb-1.5" />
                  <div className="text-[11px] text-slate-500 font-medium">Số chỗ ngồi</div>
                  <div className="text-sm font-bold text-zinc-950 tabular-nums">{vehicle.seats} chỗ</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-md">
                  <Settings className="w-5 h-5 text-blue-900 mb-1.5" />
                  <div className="text-[11px] text-slate-500 font-medium">Hộp số</div>
                  <div className="text-sm font-bold text-zinc-950">{transLabel}</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-md">
                  <Fuel className="w-5 h-5 text-blue-900 mb-1.5" />
                  <div className="text-[11px] text-slate-500 font-medium">Nhiên liệu</div>
                  <div className="text-sm font-bold text-zinc-950">{fuelLabel}</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-md">
                  <Gauge className="w-5 h-5 text-blue-900 mb-1.5" />
                  <div className="text-[11px] text-slate-500 font-medium">ODO hiện tại</div>
                  <div className="text-sm font-bold text-zinc-950 tabular-nums">{vehicle.currentMileage?.toLocaleString() || '12,500'} km</div>
                </div>
              </div>
            </section>

            {/* Bảng Quy định phụ phí minh bạch (Transparent Surcharges) */}
            <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4">
                Bảng quy định phụ phí minh bạch
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-left">Hạng mục phụ phí</th>
                      <th className="py-2.5 px-3 text-left">Định mức tiêu chuẩn</th>
                      <th className="py-2.5 px-3 text-left">Mức thu vượt định mức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-900">Giới hạn quãng đường</td>
                      <td className="py-3 px-3 tabular-nums text-slate-600">{vehicle.mileageLimit || vehicle.dailyMileageLimit || 300} km / ngày</td>
                      <td className="py-3 px-3 tabular-nums font-bold text-blue-900">{formatCurrencyVND(vehicle.extraKmRate || 5000)} / km</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-900">Trả xe quá giờ quy định</td>
                      <td className="py-3 px-3 text-slate-600">Miễn phí trễ tối đa 30 phút</td>
                      <td className="py-3 px-3 tabular-nums font-bold text-blue-900">100.000đ / giờ (quá 5h tính 1 ngày)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-900">Quy định nhiên liệu</td>
                      <td className="py-3 px-3 text-slate-600">Trả cùng mức xăng/pin lúc nhận</td>
                      <td className="py-3 px-3 tabular-nums font-bold text-blue-900">Giá cây xăng + 50.000đ phí bơm</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-900">Vệ sinh khoang xe</td>
                      <td className="py-3 px-3 text-slate-600">Trả xe trong trạng thái bình thường</td>
                      <td className="py-3 px-3 tabular-nums font-bold text-blue-900">150.000đ - 300.000đ nếu quá bẩn/mùi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bảng Điều kiện thuê xe (Rental Conditions) */}
            <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4">
                Điều kiện thuê xe & Hồ sơ thẩm định
              </h2>
              <div className="space-y-4">
                
                <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-md">
                  <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-900 shrink-0 shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-950 mb-0.5">Độ tuổi & Giấy phép lái xe</div>
                    <p className="text-xs text-slate-600">
                      Người lái từ <strong className="text-zinc-950">{condition?.minAge || 21} tuổi</strong> trở lên, sở hữu bằng lái xe ô tô hạng B1/B2 còn hạn tối thiểu <strong className="text-zinc-950">{condition?.requireDrivingYears || 1} năm</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-md">
                  <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-900 shrink-0 shadow-xs">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-950 mb-0.5">Tiền đặt cọc thế chấp</div>
                    <p className="text-xs text-slate-600">
                      Khoản đặt cọc <strong className="text-zinc-950 tabular-nums">{formatCurrencyVND(vehicle.depositAmount || 15000000)}</strong> thanh toán chuyển khoản qua VietQR. Được hoàn trả 100% về tài khoản của bạn ngay khi nghiệm thu xe.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-md">
                  <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-900 shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-950 mb-0.5">Giấy tờ tùy thân đối chiếu</div>
                    <p className="text-xs text-slate-600">
                      Cung cấp ảnh chụp 2 mặt CCCD gắn chip và GPLX khi đặt xe trực tuyến. Xuất trình bản gốc để nhân viên đối chiếu 30 giây khi nhận xe (không giữ lại bản gốc).
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* Chiết khấu thuê dài ngày */}
            {policies && policies.length > 0 && (
              <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-3">
                  Chính sách chiết khấu thuê dài ngày
                </h2>
                <div className="flex flex-wrap gap-3">
                  {policies.map((p) => (
                    <div 
                      key={p.id} 
                      className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2 text-xs"
                    >
                      <Tag className="w-4 h-4 text-emerald-700" />
                      <span className="text-emerald-900 font-semibold">Thuê từ {p.minDays} ngày:</span>
                      <strong className="text-emerald-800 font-bold tabular-nums">Giảm {p.discountPercentage}%</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* CỘT PHẢI (35% - 4/5 Cols Sticky Summary Box) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-24 bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
              
              {/* Daily Rate Header */}
              <div className="pb-5 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Đơn giá thuê niêm yết
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-blue-900 tabular-nums">
                    {formatCurrencyVND(vehicle.dailyRate)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">/ngày</span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-1">
                  Giá minh bạch đã bao gồm bảo hiểm thân vỏ tiêu chuẩn
                </div>
              </div>

              {/* Date Pickers */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-900" />
                    Thời gian nhận xe
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-900" />
                    Thời gian trả xe
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Automated Pricing Calculation Breakdown */}
              {calculating ? (
                <div className="py-4 text-center text-xs text-slate-500 font-medium">
                  Đang tính toán bảng giá tối ưu...
                </div>
              ) : preview ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Đơn giá ngày ({preview.rentalDays} ngày)</span>
                    <span className="tabular-nums font-semibold text-zinc-950">
                      {formatCurrencyVND((preview.basePrice || vehicle.dailyRate) * preview.rentalDays)}
                    </span>
                  </div>

                  {preview.discountPercentage > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-semibold">
                      <span>Chiết khấu dài ngày ({preview.discountPercentage}%)</span>
                      <span className="tabular-nums">
                        -{formatCurrencyVND(((preview.basePrice || vehicle.dailyRate) * preview.rentalDays) - preview.rentalPrice)}
                      </span>
                    </div>
                  )}

                  {preview.holidaySurcharge > 0 && (
                    <div className="flex justify-between items-center text-amber-700 font-semibold">
                      <span>Phụ phí lễ tết (+{preview.holidaySurcharge}%)</span>
                      <span className="tabular-nums">
                        +{formatCurrencyVND((preview.basePrice || vehicle.dailyRate) * (preview.holidaySurcharge / 100))}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                    <span>Tiền cọc thế chấp (hoàn lại)</span>
                    <span className="tabular-nums font-semibold text-zinc-950">
                      {formatCurrencyVND(vehicle.depositAmount || 15000000)}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-zinc-950">Tổng tiền thuê xe</span>
                    <span className="text-xl font-extrabold text-blue-900 tabular-nums">
                      {formatCurrencyVND(preview.rentalPrice)}
                    </span>
                  </div>
                </div>
              ) : null}

              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleBooking}
                className="w-full bg-slate-900 hover:bg-blue-900 text-white font-bold text-xs py-3.5 px-4 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 tracking-wider uppercase cursor-pointer"
              >
                <span>Tiếp tục đặt xe & Thẩm định hồ sơ</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Guarantees */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Miễn phí hủy đơn trước 24 giờ nhận xe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Biên bản bàn giao ODO & xăng minh bạch</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-xs text-slate-400">
                {gallery[activeImageIndex]?.title} • <span className="tabular-nums">{activeImageIndex + 1} / {gallery.length}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Đóng (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Large Image in Lightbox */}
          <div 
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={gallery[activeImageIndex]?.url} 
              alt={gallery[activeImageIndex]?.title} 
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-all"
            />

            {/* Lightbox Prev / Next */}
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Bottom Thumbnails Rail */}
          <div 
            className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {gallery.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative rounded-md overflow-hidden w-16 sm:w-20 aspect-[16/10] shrink-0 transition-all cursor-pointer ${
                  activeImageIndex === idx 
                    ? 'ring-2 ring-white border-2 border-blue-500 scale-105' 
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt={img.shortLabel} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarDetailPage;
