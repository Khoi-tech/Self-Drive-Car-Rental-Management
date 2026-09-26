import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, Fuel, Settings, MapPin, Shield, Clock, CreditCard, ChevronLeft, AlertCircle, Info, CheckCircle, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import vehicleService from '../../services/vehicleService';
import pricingService from '../../services/pricingService';
import rentalRequestService from '../../services/rentalRequestService';
import { formatCurrencyVND } from '../../utils/formatters';

const BookingPage = () => {
  const { carId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResponse, setSuccessResponse] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerIdCard: '',
    driverLicenseNumber: '',
    notes: ''
  });

  const [hasAdditionalDriver, setHasAdditionalDriver] = useState(false);
  const [additionalDriver, setAdditionalDriver] = useState({
    fullName: '',
    phoneNumber: '',
    idCardNumber: '',
    licenseNumber: ''
  });

  const [agreed, setAgreed] = useState(false);

  // File Upload State - 4 slots (CCCD trước/sau, GPLX trước/sau)
  const [idCardFrontFile, setIdCardFrontFile] = useState(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState(null);
  const [idCardBackFile, setIdCardBackFile] = useState(null);
  const [idCardBackPreview, setIdCardBackPreview] = useState(null);

  const [licenseFrontFile, setLicenseFrontFile] = useState(null);
  const [licenseFrontPreview, setLicenseFrontPreview] = useState(null);
  const [licenseBackFile, setLicenseBackFile] = useState(null);
  const [licenseBackPreview, setLicenseBackPreview] = useState(null);

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // URLs derived from search query params
  const startTimeStr = searchParams.get('startTime') || '';
  const endTimeStr = searchParams.get('endTime') || '';
  const pickupLocation = searchParams.get('pickupLocation') || 'VP VELORA (Trụ sở)';
  const dropoffLocation = searchParams.get('dropoffLocation') || pickupLocation;

  useEffect(() => {
    if (!startTimeStr || !endTimeStr) {
      navigate(`/cars/${carId}`);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const vehRes = await vehicleService.getVehicleById(carId);
        setVehicle(vehRes.data || vehRes);

        const start = new Date(startTimeStr);
        const end = new Date(endTimeStr);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const previewRes = await pricingService.previewPricing(carId, diffDays);
        setPreview(previewRes.data || previewRes);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải thông tin thuê xe');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [carId, startTimeStr, endTimeStr, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(null);
  };

  const handleAdditionalDriverChange = (e) => {
    const { name, value } = e.target;
    setAdditionalDriver({ ...additionalDriver, [name]: value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    // 1. Kiểm tra thông tin người thuê
    if (!formData.customerName?.trim()) {
      setError('Vui lòng nhập Họ và tên người thuê.');
      return;
    }
    if (!formData.customerPhone?.trim()) {
      setError('Vui lòng nhập Số điện thoại người thuê.');
      return;
    }
    if (!formData.customerEmail?.trim()) {
      setError('Vui lòng nhập Email người thuê.');
      return;
    }
    if (!formData.customerIdCard?.trim()) {
      setError('Vui lòng nhập Số CCCD/CMND người thuê.');
      return;
    }
    if (!formData.driverLicenseNumber?.trim()) {
      setError('Vui lòng nhập Số Giấy phép lái xe người thuê.');
      return;
    }

    // 2. Kiểm tra thông tin tài xế phụ (nếu bật checkbox)
    if (hasAdditionalDriver) {
      if (!additionalDriver.fullName?.trim()) {
        setError('Vui lòng nhập Họ và tên của tài xế phụ.');
        return;
      }
      if (!additionalDriver.phoneNumber?.trim()) {
        setError('Vui lòng nhập Số điện thoại của tài xế phụ.');
        return;
      }
      if (!additionalDriver.idCardNumber?.trim()) {
        setError('Vui lòng nhập Số CCCD của tài xế phụ.');
        return;
      }
      if (!additionalDriver.licenseNumber?.trim()) {
        setError('Vui lòng nhập Số GPLX của tài xế phụ.');
        return;
      }
    }

    // 3. Kiểm tra đồng ý điều khoản
    if (!agreed) {
      setError('Vui lòng tích chọn đồng ý với Điều kiện thuê xe & Mẫu hợp đồng của VELORA.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const requestPayload = {
        carId,
        startTime: new Date(startTimeStr).toISOString(),
        endTime: new Date(endTimeStr).toISOString(),
        pickupLocation,
        dropoffLocation,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerIdCard: formData.customerIdCard.trim(),
        driverLicenseNumber: formData.driverLicenseNumber.trim(),
        notes: formData.notes?.trim() || '',
        // 4 ảnh giấy tờ định danh (CCCD 2 mặt & GPLX 2 mặt)
        idCardFrontUrl: idCardFrontPreview || 'https://example.com/id-front.jpg',
        idCardBackUrl: idCardBackPreview || 'https://example.com/id-back.jpg',
        driverLicenseFrontUrl: licenseFrontPreview || 'https://example.com/dl-front.jpg',
        driverLicenseBackUrl: licenseBackPreview || 'https://example.com/dl-back.jpg',
      };

      if (hasAdditionalDriver) {
        requestPayload.additionalDrivers = [{
          fullName: additionalDriver.fullName.trim(),
          phoneNumber: additionalDriver.phoneNumber.trim(),
          idCardNumber: additionalDriver.idCardNumber.trim(),
          licenseNumber: additionalDriver.licenseNumber.trim()
        }];
      }

      const res = await rentalRequestService.createRequest(requestPayload);
      setSuccessResponse(res.data || res);
    } catch (err) {
      console.error('Submit error:', err);
      let errMsg = 'Có lỗi xảy ra khi gửi yêu cầu thuê xe';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errMsg = err.response.data;
        } else if (err.response.data.message) {
          errMsg = err.response.data.message;
        } else if (err.response.data.Message) {
          errMsg = err.response.data.Message;
        } else if (err.response.data.errors) {
          const keys = Object.keys(err.response.data.errors);
          if (keys.length > 0) {
            errMsg = err.response.data.errors[keys[0]][0] || errMsg;
          }
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl mb-4 text-red-400">{error}</h2>
        <button onClick={() => navigate('/cars')} className="text-zinc-400 hover:text-white">Quay lại danh mục</button>
      </div>
    );
  }

  // SUCCESS SCREEN
  if (successResponse) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar isVisible={true} />
        <div className="pt-32 pb-20 px-4 flex justify-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-xl w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Gửi yêu cầu thuê xe thành công!</h1>
            <div className="bg-black/30 p-4 rounded-xl mb-6">
              <p className="text-sm text-zinc-400 mb-1">Mã đơn thuê</p>
              <p className="text-xl font-mono text-white tracking-widest">{successResponse.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Yêu cầu của bạn đang ở trạng thái <strong className="text-yellow-400 font-medium">CHỜ DUYỆT (Pending Review)</strong>. 
              Nhân viên VELORA sẽ kiểm tra hồ sơ và liên hệ với bạn qua số điện thoại <strong className="text-white">{successResponse.customerPhone}</strong> trong vòng 15 phút tới.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors"
              >
                Về trang chủ
              </button>
              <button 
                onClick={() => navigate('/cars')}
                className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Xem danh mục xe khác
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white/20">
      <Navbar isVisible={true} />

      <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Quay lại trang chi tiết
        </button>

        <h1 className="text-3xl md:text-4xl font-semibold mb-8 tracking-tight">Hoàn tất đặt xe</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* CỘT TRÁI: FORM */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Section: Thông tin liên hệ */}
            <section className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
              <h2 className="text-xl font-medium mb-6 flex items-center">
                <Users className="w-5 h-5 mr-3 text-zinc-400" />
                Thông tin người thuê
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Họ và tên *</label>
                  <input 
                    type="text" name="customerName"
                    value={formData.customerName} onChange={handleInputChange}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Số điện thoại *</label>
                  <input 
                    type="tel" name="customerPhone"
                    value={formData.customerPhone} onChange={handleInputChange}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                    placeholder="VD: 0912345678"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-zinc-400">Email *</label>
                  <input 
                    type="email" name="customerEmail"
                    value={formData.customerEmail} onChange={handleInputChange}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                    placeholder="VD: email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Số CCCD/CMND *</label>
                  <input 
                    type="text" name="customerIdCard"
                    value={formData.customerIdCard} onChange={handleInputChange}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                    placeholder="VD: 079123456789"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Số Giấy phép lái xe *</label>
                  <input 
                    type="text" name="driverLicenseNumber"
                    value={formData.driverLicenseNumber} onChange={handleInputChange}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                    placeholder="VD: B2-12345678"
                  />
                </div>
              </div>
            </section>

            {/* Section: Hồ sơ định danh */}
            <section className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-6">
              <div>
                <h2 className="text-xl font-medium mb-1 flex items-center">
                  <Shield className="w-5 h-5 mr-3 text-zinc-400" />
                  Hồ sơ định danh (2 mặt CCCD & GPLX)
                </h2>
                <p className="text-sm text-zinc-400">Vui lòng tải lên ảnh chụp rõ nét 2 mặt của Căn cước công dân và Giấy phép lái xe để chúng tôi xác minh hồ sơ.</p>
              </div>

              {/* Nhóm 1: CCCD */}
              <div>
                <div className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  1. Căn cước công dân (CCCD / CMND)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CCCD Mặt trước */}
                  <label className="border border-dashed border-zinc-700 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-zinc-800/50 hover:border-zinc-500 transition-all cursor-pointer group relative overflow-hidden min-h-[140px]">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, setIdCardFrontFile, setIdCardFrontPreview)} 
                      className="hidden" 
                    />
                    {idCardFrontPreview ? (
                      <div className="flex flex-col items-center w-full">
                        <img src={idCardFrontPreview} alt="CCCD Mặt trước" className="w-24 h-16 object-cover rounded-lg border border-zinc-600 mb-2 shadow" />
                        <div className="flex items-center text-xs text-green-400 font-medium truncate max-w-[180px]">
                          <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{idCardFrontFile?.name || 'Mặt trước CCCD'}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 mt-1 underline">Đổi ảnh</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors mb-2" />
                        <span className="text-sm font-medium">Mặt trước CCCD</span>
                        <span className="text-xs text-zinc-500 mt-1">Ảnh chụp rõ nét, không lóa</span>
                      </>
                    )}
                  </label>

                  {/* CCCD Mặt sau */}
                  <label className="border border-dashed border-zinc-700 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-zinc-800/50 hover:border-zinc-500 transition-all cursor-pointer group relative overflow-hidden min-h-[140px]">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, setIdCardBackFile, setIdCardBackPreview)} 
                      className="hidden" 
                    />
                    {idCardBackPreview ? (
                      <div className="flex flex-col items-center w-full">
                        <img src={idCardBackPreview} alt="CCCD Mặt sau" className="w-24 h-16 object-cover rounded-lg border border-zinc-600 mb-2 shadow" />
                        <div className="flex items-center text-xs text-green-400 font-medium truncate max-w-[180px]">
                          <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{idCardBackFile?.name || 'Mặt sau CCCD'}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 mt-1 underline">Đổi ảnh</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors mb-2" />
                        <span className="text-sm font-medium">Mặt sau CCCD</span>
                        <span className="text-xs text-zinc-500 mt-1">Chứa vân tay và chip</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Nhóm 2: GPLX */}
              <div>
                <div className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  2. Giấy phép lái xe (GPLX)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GPLX Mặt trước */}
                  <label className="border border-dashed border-zinc-700 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-zinc-800/50 hover:border-zinc-500 transition-all cursor-pointer group relative overflow-hidden min-h-[140px]">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, setLicenseFrontFile, setLicenseFrontPreview)} 
                      className="hidden" 
                    />
                    {licenseFrontPreview ? (
                      <div className="flex flex-col items-center w-full">
                        <img src={licenseFrontPreview} alt="GPLX Mặt trước" className="w-24 h-16 object-cover rounded-lg border border-zinc-600 mb-2 shadow" />
                        <div className="flex items-center text-xs text-green-400 font-medium truncate max-w-[180px]">
                          <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{licenseFrontFile?.name || 'Mặt trước GPLX'}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 mt-1 underline">Đổi ảnh</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors mb-2" />
                        <span className="text-sm font-medium">Mặt trước GPLX</span>
                        <span className="text-xs text-zinc-500 mt-1">Hạng bằng B1/B2 còn hạn</span>
                      </>
                    )}
                  </label>

                  {/* GPLX Mặt sau */}
                  <label className="border border-dashed border-zinc-700 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-zinc-800/50 hover:border-zinc-500 transition-all cursor-pointer group relative overflow-hidden min-h-[140px]">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, setLicenseBackFile, setLicenseBackPreview)} 
                      className="hidden" 
                    />
                    {licenseBackPreview ? (
                      <div className="flex flex-col items-center w-full">
                        <img src={licenseBackPreview} alt="GPLX Mặt sau" className="w-24 h-16 object-cover rounded-lg border border-zinc-600 mb-2 shadow" />
                        <div className="flex items-center text-xs text-green-400 font-medium truncate max-w-[180px]">
                          <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{licenseBackFile?.name || 'Mặt sau GPLX'}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 mt-1 underline">Đổi ảnh</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors mb-2" />
                        <span className="text-sm font-medium">Mặt sau GPLX</span>
                        <span className="text-xs text-zinc-500 mt-1">Các hạng xe được phép lái</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </section>

            {/* Section: Tài xế phụ */}
            <section className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setHasAdditionalDriver(!hasAdditionalDriver)}
              >
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={hasAdditionalDriver}
                    onChange={(e) => setHasAdditionalDriver(e.target.checked)}
                    className="w-5 h-5 mr-4 accent-white bg-zinc-800 border-zinc-700 rounded cursor-pointer"
                  />
                  <h2 className="text-xl font-medium flex items-center">Đăng ký thêm người lái phụ</h2>
                </div>
                {hasAdditionalDriver ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
              </div>

              {hasAdditionalDriver && (
                <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Họ và tên tài xế phụ *</label>
                    <input 
                      type="text" name="fullName"
                      value={additionalDriver.fullName} onChange={handleAdditionalDriverChange}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                      placeholder="VD: Trần Văn B"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Số điện thoại *</label>
                    <input 
                      type="tel" name="phoneNumber"
                      value={additionalDriver.phoneNumber} onChange={handleAdditionalDriverChange}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                      placeholder="VD: 0987654321"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Số CCCD/CMND *</label>
                    <input 
                      type="text" name="idCardNumber"
                      value={additionalDriver.idCardNumber} onChange={handleAdditionalDriverChange}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                      placeholder="VD: 079987654321"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Số Giấy phép lái xe *</label>
                    <input 
                      type="text" name="licenseNumber"
                      value={additionalDriver.licenseNumber} onChange={handleAdditionalDriverChange}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                      placeholder="VD: B2-87654321"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Section: Ghi chú */}
            <section className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
              <h2 className="text-xl font-medium mb-4">Ghi chú chuyến đi</h2>
              <textarea 
                name="notes"
                value={formData.notes} onChange={handleInputChange}
                rows="3"
                className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors resize-none"
                placeholder="Yêu cầu giao xe tận nơi, ghế trẻ em..."
              />
            </section>

          </div>

          {/* CỘT PHẢI: WIDGET TÓM TẮT */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <h3 className="text-lg font-medium mb-6">Tóm tắt chuyến đi</h3>
                
                {/* Vehicle Mini Card */}
                {vehicle && (
                  <div className="flex gap-4 items-center pb-6 border-b border-zinc-800 mb-6">
                    <div className="w-24 h-16 bg-black rounded-lg overflow-hidden shrink-0">
                      {vehicle.imageUrl ? (
                        <img src={vehicle.imageUrl} alt={vehicle.model} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">No Image</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">{vehicle.make} {vehicle.model}</h4>
                      <p className="text-sm text-zinc-400">{vehicle.manufactureYear} • {vehicle.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</p>
                    </div>
                  </div>
                )}

                {/* Itinerary */}
                <div className="space-y-4 mb-6 pb-6 border-b border-zinc-800">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-zinc-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-zinc-400">Nhận xe</div>
                      <div className="font-medium">{new Date(startTimeStr).toLocaleString('vi-VN')}</div>
                      <div className="text-sm text-zinc-500">{pickupLocation}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-zinc-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-zinc-400">Trả xe</div>
                      <div className="font-medium">{new Date(endTimeStr).toLocaleString('vi-VN')}</div>
                      <div className="text-sm text-zinc-500">{dropoffLocation}</div>
                    </div>
                  </div>
                </div>

                {/* Pricing Details */}
                {preview && vehicle && (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Đơn giá gốc ({preview.rentalDays} ngày)</span>
                      <span>{formatCurrencyVND((preview.basePrice || vehicle.dailyRate) * preview.rentalDays)}</span>
                    </div>
                    {preview.discountPercentage > 0 && (
                      <div className="flex justify-between text-sm text-green-400">
                        <span>Ưu đãi dài ngày ({preview.discountPercentage}%)</span>
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
                    
                    <div className="pt-4 mt-2 border-t border-zinc-800 flex justify-between items-center">
                      <span className="font-medium">Tổng tiền thuê</span>
                      <span className="text-2xl font-bold">{formatCurrencyVND(preview.rentalPrice)}</span>
                    </div>
                  </div>
                )}

                {/* Terms Agreement */}
                <div className={`mb-6 bg-black/30 p-4 rounded-xl border transition-all ${!agreed && error ? 'border-red-500/80 bg-red-500/10' : 'border-zinc-800'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={agreed}
                      onChange={(e) => {
                        setAgreed(e.target.checked);
                        if (error && error.includes('Điều kiện thuê xe')) setError(null);
                      }}
                      className="mt-1 w-5 h-5 accent-white bg-zinc-800 border-zinc-700 rounded cursor-pointer shrink-0" 
                    />
                    <span className="text-sm text-zinc-300 leading-relaxed">
                      Tôi xác nhận đã đọc và đồng ý với <a href="#" className="text-white underline underline-offset-2">Điều kiện thuê xe</a> & <a href="#" className="text-white underline underline-offset-2">Mẫu hợp đồng</a> của VELORA.
                    </span>
                  </label>
                </div>

                {/* Prominent Error Message right above Submit Button */}
                {error && (
                  <div className="mb-4 bg-red-500/15 border border-red-500/60 text-red-300 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="leading-snug font-medium">{error}</div>
                  </div>
                )}

                <button 
                  type="submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-white text-black py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận gửi yêu cầu thuê xe'
                  )}
                </button>

                <div className="mt-4 flex items-center gap-2 justify-center text-xs text-zinc-500">
                  <Shield className="w-4 h-4" /> Thông tin của bạn được bảo mật tuyệt đối
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;
