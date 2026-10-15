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
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Upload, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  User,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
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

  const startTimeStr = searchParams.get('startTime') || '';
  const endTimeStr = searchParams.get('endTime') || '';
  const pickupLocation = searchParams.get('pickupLocation') || 'VP VELORA (Trụ sở Tân Bình)';
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

    // Validation
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

    if (hasAdditionalDriver) {
      if (!additionalDriver.fullName?.trim() || !additionalDriver.phoneNumber?.trim()) {
        setError('Vui lòng nhập đầy đủ thông tin tài xế phụ.');
        return;
      }
    }

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
      if (err.response?.data?.message) errMsg = err.response.data.message;
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-300 border-t-blue-900 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Đang chuẩn bị hồ sơ thuê xe...</span>
        </div>
      </div>
    );
  }

  // SUCCESS CONFIRMATION VIEW
  if (successResponse) {
    return (
      <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
        <Navbar isVisible={true} />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16 flex-1 w-full flex items-center justify-center">
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm text-center space-y-6 w-full">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Gửi Hồ Sơ Thành Công
              </span>
              <h1 className="text-2xl font-extrabold text-zinc-950 mt-3 mb-2">
                Đơn thuê xe của bạn đã được tiếp nhận!
              </h1>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Mã đơn thuê: <strong className="text-zinc-950 tabular-nums">#{successResponse.id?.substring(0, 8) || 'VELORA-BOOKING'}</strong>. 
                Đội ngũ điều hành VELORA đang tiến hành thẩm định CCCD & GPLX của bạn.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Phương tiện:</span>
                <span className="font-bold text-zinc-950">{vehicle?.make} {vehicle?.model} ({vehicle?.licensePlate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Người đặt:</span>
                <span className="font-bold text-zinc-950">{formData.customerName} - {formData.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tiền đặt cọc xe:</span>
                <span className="font-bold text-blue-900 tabular-nums">{formatCurrencyVND(vehicle?.depositAmount || 15000000)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                to="/profile"
                className="px-6 py-2.5 bg-slate-900 hover:bg-blue-900 text-white rounded-md text-xs font-bold transition-colors"
              >
                Xem tiến độ duyệt trong Hồ sơ cá nhân
              </Link>
              <Link
                to="/cars"
                className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition-colors"
              >
                Tiếp tục xem xe khác
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      <Navbar isVisible={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex-1 w-full">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1 hover:text-blue-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại xe</span>
          </button>
          <span>/</span>
          <span className="text-zinc-900 font-bold">Đặt xe & Thẩm định hồ sơ</span>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: FORM ĐẶT XE (7 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Box 1: Thông tin người thuê chính */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-900" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                    1. Thông tin người thuê xe (Khách hàng chính)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="NGUYEN VAN A"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 uppercase focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="0901234567"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Địa chỉ Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      placeholder="customer@example.com"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Số CCCD / CMND gắn chip <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerIdCard"
                      value={formData.customerIdCard}
                      onChange={handleInputChange}
                      placeholder="079099xxxxxx"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Số Giấy phép lái xe (GPLX B1/B2) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="driverLicenseNumber"
                      value={formData.driverLicenseNumber}
                      onChange={handleInputChange}
                      placeholder="790123456789"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Tải ảnh hồ sơ định danh (4 slots) */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                    2. Tải ảnh giấy tờ định danh (CCCD & GPLX)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Slot 1: CCCD Mặt Trước */}
                  <div className="border border-dashed border-slate-300 rounded-md p-4 bg-slate-50 text-center hover:bg-white transition-colors">
                    <div className="text-xs font-bold text-zinc-900 mb-1">CCCD Mặt trước</div>
                    <div className="text-[11px] text-slate-500 mb-3">Rõ số, quốc huy và ảnh chân dung</div>
                    {idCardFrontPreview ? (
                      <div className="relative aspect-[3/2] rounded overflow-hidden mb-2 border border-slate-200">
                        <img src={idCardFrontPreview} alt="CCCD Trước" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:border-slate-400">
                        <Upload className="w-3.5 h-3.5 text-blue-900" />
                        <span>Chọn ảnh tải lên</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setIdCardFrontFile, setIdCardFrontPreview)} />
                      </label>
                    )}
                  </div>

                  {/* Slot 2: CCCD Mặt Sau */}
                  <div className="border border-dashed border-slate-300 rounded-md p-4 bg-slate-50 text-center hover:bg-white transition-colors">
                    <div className="text-xs font-bold text-zinc-900 mb-1">CCCD Mặt sau</div>
                    <div className="text-[11px] text-slate-500 mb-3">Rõ chip điện tử & đặc điểm nhận dạng</div>
                    {idCardBackPreview ? (
                      <div className="relative aspect-[3/2] rounded overflow-hidden mb-2 border border-slate-200">
                        <img src={idCardBackPreview} alt="CCCD Sau" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:border-slate-400">
                        <Upload className="w-3.5 h-3.5 text-blue-900" />
                        <span>Chọn ảnh tải lên</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setIdCardBackFile, setIdCardBackPreview)} />
                      </label>
                    )}
                  </div>

                  {/* Slot 3: GPLX Mặt Trước */}
                  <div className="border border-dashed border-slate-300 rounded-md p-4 bg-slate-50 text-center hover:bg-white transition-colors">
                    <div className="text-xs font-bold text-zinc-900 mb-1">GPLX Mặt trước</div>
                    <div className="text-[11px] text-slate-500 mb-3">Rõ hạng bằng B1/B2 và ngày hết hạn</div>
                    {licenseFrontPreview ? (
                      <div className="relative aspect-[3/2] rounded overflow-hidden mb-2 border border-slate-200">
                        <img src={licenseFrontPreview} alt="GPLX Trước" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:border-slate-400">
                        <Upload className="w-3.5 h-3.5 text-blue-900" />
                        <span>Chọn ảnh tải lên</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setLicenseFrontFile, setLicenseFrontPreview)} />
                      </label>
                    )}
                  </div>

                  {/* Slot 4: GPLX Mặt Sau */}
                  <div className="border border-dashed border-slate-300 rounded-md p-4 bg-slate-50 text-center hover:bg-white transition-colors">
                    <div className="text-xs font-bold text-zinc-900 mb-1">GPLX Mặt sau</div>
                    <div className="text-[11px] text-slate-500 mb-3">Mặt sau giấy phép lái xe</div>
                    {licenseBackPreview ? (
                      <div className="relative aspect-[3/2] rounded overflow-hidden mb-2 border border-slate-200">
                        <img src={licenseBackPreview} alt="GPLX Sau" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:border-slate-400">
                        <Upload className="w-3.5 h-3.5 text-blue-900" />
                        <span>Chọn ảnh tải lên</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setLicenseBackFile, setLicenseBackPreview)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Box 3: Người lái bổ sung (Additional Drivers) */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-900" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                      3. Người lái bổ sung (Tùy chọn)
                    </h2>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAdditionalDriver}
                      onChange={(e) => setHasAdditionalDriver(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                    />
                    <span>Thêm người lái phụ</span>
                  </label>
                </div>

                {hasAdditionalDriver && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">Họ tên người lái phụ</label>
                      <input
                        type="text"
                        name="fullName"
                        value={additionalDriver.fullName}
                        onChange={handleAdditionalDriverChange}
                        placeholder="TRAN VAN B"
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={additionalDriver.phoneNumber}
                        onChange={handleAdditionalDriverChange}
                        placeholder="0987654321"
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">Số CCCD lái phụ</label>
                      <input
                        type="text"
                        name="idCardNumber"
                        value={additionalDriver.idCardNumber}
                        onChange={handleAdditionalDriverChange}
                        placeholder="079099xxxxxx"
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">Số GPLX lái phụ</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={additionalDriver.licenseNumber}
                        onChange={handleAdditionalDriverChange}
                        placeholder="790123456789"
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Box 4: Ghi chú & Đồng ý điều khoản */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Ghi chú thêm cho chuyến đi
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Ví dụ: Xin giao xe tại sảnh khách sạn lúc 8h sáng..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 mt-0.5"
                    />
                    <span>
                      Tôi xác nhận đã đọc và đồng ý với toàn bộ <strong>Điều kiện thuê xe</strong>, <strong>Biểu phí bồi thường</strong> và cam kết xuất trình giấy tờ gốc khi nhận bàn giao xe.
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

            </form>

          </div>

          {/* CỘT PHẢI: TỔNG QUAN ĐƠN THUÊ & THANH TOÁN (5 Cols Sticky) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-24 bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
              
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-16 h-12 bg-slate-100 rounded overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={vehicle?.imageUrl || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80'}
                    alt="Car"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-950 leading-tight">
                    {vehicle?.make} {vehicle?.model}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span className="license-plate text-[10px] px-1.5 py-0.2">{vehicle?.licensePlate}</span>
                    <span>• {vehicle?.seats} chỗ</span>
                  </div>
                </div>
              </div>

              {/* Itinerary info */}
              <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-md border border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhận xe:</span>
                  <span className="font-semibold text-zinc-950 tabular-nums">
                    {new Date(startTimeStr).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trả xe:</span>
                  <span className="font-semibold text-zinc-950 tabular-nums">
                    {new Date(endTimeStr).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Địa điểm:</span>
                  <span className="font-semibold text-zinc-950 text-right truncate max-w-[180px]">
                    {pickupLocation}
                  </span>
                </div>
              </div>

              {/* Financial Breakdown */}
              {preview && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tiền thuê ({preview.rentalDays} ngày)</span>
                    <span className="tabular-nums font-semibold text-zinc-950">
                      {formatCurrencyVND((preview.basePrice || vehicle?.dailyRate) * preview.rentalDays)}
                    </span>
                  </div>

                  {preview.discountPercentage > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Chiết khấu ({preview.discountPercentage}%)</span>
                      <span className="tabular-nums">
                        -{formatCurrencyVND(((preview.basePrice || vehicle?.dailyRate) * preview.rentalDays) - preview.rentalPrice)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                    <span>Tiền cọc xe (Hoàn trả 100%)</span>
                    <span className="tabular-nums font-semibold text-zinc-950">
                      {formatCurrencyVND(vehicle?.depositAmount || 15000000)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-zinc-950">Tổng tiền thuê</span>
                    <span className="text-xl font-extrabold text-blue-900 tabular-nums">
                      {formatCurrencyVND(preview.rentalPrice)}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold text-xs py-3.5 px-4 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                {submitting ? (
                  <span>Đang khởi tạo hồ sơ...</span>
                ) : (
                  <>
                    <span>Gửi yêu cầu thuê xe</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                Hồ sơ sẽ được thẩm định trực tuyến trong 10-15 phút. Bạn sẽ nhận được thông báo ký hợp đồng điện tử qua hệ thống.
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default BookingPage;
