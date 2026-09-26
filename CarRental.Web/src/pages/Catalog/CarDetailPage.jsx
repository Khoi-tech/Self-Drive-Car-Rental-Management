import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, Fuel, Settings, MapPin, Shield, Clock, CreditCard, ChevronLeft, AlertCircle, Info, Tag, Check } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import vehicleService from '../../services/vehicleService';
import pricingService from '../../services/pricingService';
import rentalConditionService from '../../services/rentalConditionService';
import { formatCurrencyVND } from '../../utils/formatters';

const CarDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [condition, setCondition] = useState(null);
  const [loading, setLoading] = useState(true);

  // Widget State
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');
  const [preview, setPreview] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  const [bookingError, setBookingError] = useState('');

  const handleBooking = () => {
    if (!startTime || !endTime) {
      setBookingError('Vui lòng chọn đầy đủ ngày nhận và ngày trả xe để tiếp tục.');
      return;
    }
    setBookingError('');
    const location = searchParams.get('pickupLocation') || vehicle?.pickupLocation || 'Tại Cửa Hàng';
    navigate(`/booking/${id}?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&pickupLocation=${encodeURIComponent(location)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl mb-4">Không tìm thấy xe</h2>
        <button onClick={() => navigate('/cars')} className="text-zinc-400 hover:text-white">Quay lại danh mục</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar isVisible={true} />
      
      <main className="max-w-7xl mx-auto px-6 py-28 flex flex-col lg:flex-row gap-12">
        {/* LEFT COLUMN: DETAILS */}
        <div className="w-full lg:w-2/3 space-y-12">
          
          {/* Back Button */}
          <button onClick={() => navigate(-1)} className="flex items-center text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5 mr-1" /> Quay lại
          </button>

          {/* Hero Image & Header */}
          <div>
            <div className="relative aspect-[16/9] bg-zinc-900 rounded-2xl overflow-hidden mb-6 border border-zinc-800">
              {vehicle.imageUrl ? (
                <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Fuel className="w-16 h-16 opacity-30" />
                </div>
              )}
              <div className="absolute top-4 left-4 bg-green-500 text-black px-4 py-1.5 rounded-full text-sm font-medium">
                Sẵn sàng giao xe
              </div>
            </div>

            <h1 className="text-4xl font-light mb-2">{vehicle.make} {vehicle.model}</h1>
            <div className="flex items-center gap-4 text-zinc-400">
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {vehicle.pickupLocation || 'N/A'}</span>
              <span>•</span>
              <span>Sản xuất {vehicle.manufactureYear}</span>
              <span>•</span>
              <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{vehicle.licensePlate}</span>
            </div>
          </div>

          {/* Specs Grid */}
          <section>
            <h2 className="text-2xl font-medium mb-6">Thông số kỹ thuật</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <Users className="w-6 h-6 text-zinc-400 mb-2" />
                <div className="text-sm text-zinc-500">Số chỗ</div>
                <div className="font-medium">{vehicle.seats} chỗ</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <Settings className="w-6 h-6 text-zinc-400 mb-2" />
                <div className="text-sm text-zinc-500">Truyền động</div>
                <div className="font-medium">{vehicle.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <Fuel className="w-6 h-6 text-zinc-400 mb-2" />
                <div className="text-sm text-zinc-500">Nhiên liệu</div>
                <div className="font-medium">{vehicle.fuelType === 'ELECTRIC' ? 'Điện' : vehicle.fuelType === 'DIESEL' ? 'Dầu' : 'Xăng'}</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <Clock className="w-6 h-6 text-zinc-400 mb-2" />
                <div className="text-sm text-zinc-500">ODO hiện tại</div>
                <div className="font-medium">{vehicle.currentMileage} km</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 flex items-start gap-3">
                 <Info className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                 <div>
                   <div className="text-sm text-zinc-400 mb-1">Giới hạn quãng đường</div>
                   <div className="font-medium">{vehicle.mileageLimit} km/ngày</div>
                 </div>
               </div>
               <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                 <div>
                   <div className="text-sm text-zinc-400 mb-1">Phí phụ thu vượt km</div>
                   <div className="font-medium">{formatCurrencyVND(vehicle.extraKmRate)}/km</div>
                 </div>
               </div>
               <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 flex items-start gap-3">
                 <Fuel className="w-5 h-5 text-blue-400 flex-shrink-0" />
                 <div>
                   <div className="text-sm text-zinc-400 mb-1">Hoàn trả nhiên liệu</div>
                   <div className="font-medium truncate">{vehicle.fuelReturnPolicy === 'SAME_LEVEL' ? 'Cùng mức khi nhận' : 'Khác'}</div>
                 </div>
               </div>
            </div>
          </section>

          {/* Pricing Policies */}
          {policies && policies.length > 0 && (
            <section>
              <h2 className="text-2xl font-medium mb-6">Bảng giá ưu đãi thuê dài ngày</h2>
              <div className="flex flex-wrap gap-4 mb-4">
                {policies.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-700/50 px-4 py-3 rounded-lg">
                    <Tag className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-sm text-zinc-400">Thuê từ {p.minDays} ngày</div>
                      <div className="font-medium text-green-400">Giảm {p.discountPercentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-500 italic">* Chiết khấu được áp dụng trực tiếp trên đơn giá ngày.</p>
            </section>
          )}

          {/* Rental Conditions */}
          <section>
            <h2 className="text-2xl font-medium mb-6">Điều kiện thuê xe</h2>
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-medium text-lg mb-1">Độ tuổi & Kinh nghiệm</h4>
                  <p className="text-zinc-400">
                    Khách thuê phải từ <strong className="text-white">{condition?.minAge || 21} tuổi</strong> trở lên và 
                    có bằng lái xe từ <strong className="text-white">{condition?.requireDrivingYears || 1} năm</strong>.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-medium text-lg mb-1">Tài sản thế chấp / Đặt cọc</h4>
                  <p className="text-zinc-400">
                    Cần đặt cọc khoản tiền <strong className="text-white">{formatCurrencyVND(vehicle.depositAmount)}</strong>. Tiền cọc sẽ được hoàn trả đầy đủ sau khi kết thúc hợp đồng nếu không có phát sinh.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-medium text-lg mb-1">Giấy tờ tùy thân</h4>
                  <p className="text-zinc-400">
                    Yêu cầu xuất trình <strong className="text-white">CCCD/CMND gốc</strong> (có gắn chip) và <strong className="text-white">GPLX hợp lệ gốc</strong> để đối chiếu khi nhận xe.
                  </p>
                  {condition?.otherConditions && (
                    <p className="text-zinc-400 mt-2">Lưu ý thêm: {condition.otherConditions}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: BOOKING WIDGET */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-28 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
            <div className="mb-6 pb-6 border-b border-zinc-800">
              <div className="text-3xl font-medium mb-1">{formatCurrencyVND(vehicle.dailyRate)} <span className="text-lg text-zinc-500 font-normal">/ ngày</span></div>
              <div className="text-sm text-zinc-400">Giá chưa bao gồm VAT và phụ phí khác.</div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Ngày nhận xe</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="datetime-local" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Ngày trả xe</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="datetime-local" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Preview */}
            {calculating ? (
              <div className="mb-8 py-6 text-center text-zinc-500">Đang tính toán giá...</div>
            ) : preview ? (
              <div className="mb-8 space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Đơn giá gốc ({preview.rentalDays} ngày)</span>
                  <span>{formatCurrencyVND((preview.basePrice || vehicle.dailyRate) * preview.rentalDays)}</span>
                </div>
                
                {preview.discountPercentage > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Ưu đãi thuê dài ngày ({preview.discountPercentage}%)</span>
                    <span>-{formatCurrencyVND(((preview.basePrice || vehicle.dailyRate) * preview.rentalDays) - preview.rentalPrice)}</span>
                  </div>
                )}

                {preview.holidaySurcharge > 0 && (
                  <div className="flex justify-between text-sm text-orange-400">
                    <span>Phụ thu ngày lễ ({preview.holidaySurcharge}%)</span>
                    <span>+{formatCurrencyVND((preview.basePrice || vehicle.dailyRate) * (preview.holidaySurcharge / 100))}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Tiền đặt cọc</span>
                  <span>{formatCurrencyVND(vehicle.depositAmount)}</span>
                </div>

                <div className="border-t border-zinc-800 pt-3 flex justify-between items-center mt-2">
                  <span className="font-medium text-zinc-200">Tổng tiền thuê</span>
                  <span className="text-2xl font-semibold text-white">{formatCurrencyVND(preview.rentalPrice)}</span>
                </div>
                <div className="text-[11px] text-zinc-500 text-right">
                  (Tiền cọc {formatCurrencyVND(vehicle.depositAmount)} sẽ được hoàn trả khi trả xe)
                </div>
              </div>
            ) : null}

            {bookingError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}
            
            <button 
              onClick={handleBooking}
              className="w-full bg-white text-black py-4 rounded-xl font-medium text-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 relative z-20 cursor-pointer"
            >
              Tiến hành đặt xe
            </button>
            
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400 justify-center">
                <Shield className="w-4 h-4" /> Bảo hiểm thân vỏ đầy đủ
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400 justify-center">
                <Check className="w-4 h-4" /> Hỗ trợ sự cố 24/7
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default CarDetailPage;
