import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  CreditCard, 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  User,
  ShieldCheck,
  ArrowRight,
  Zap,
  Check,
  Lock,
  Sparkles,
  Wallet,
  QrCode,
  Info,
  Calendar,
  MapPin,
  Truck
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import vehicleService from '../../services/vehicleService';
import pricingService from '../../services/pricingService';
import rentalRequestService from '../../services/rentalRequestService';
import rentalConditionService from '../../services/rentalConditionService';
import { formatCurrencyVND } from '../../utils/formatters';
import { getPrimaryImageUrl, handleImageError } from '../../utils/imageGalleryHelper';
import { useAuth } from '../../context/AuthContext';
import { validateRentalDates } from '../../utils/dateTimeHelpers';
import { HCMC_DELIVERY_ZONES, getZoneById, formatYardAddress } from '../../utils/deliveryZones';
import { evaluateEligibility } from '../../utils/eligibilityHelper';

const BookingPage = () => {
  const { user, loading: authLoading } = useAuth();
  const isAccountSuspended = user?.isActive === false;
  const { carId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Redirect guest to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?returnUrl=${encodeURIComponent(currentUrl)}`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [vehicle, setVehicle] = useState(null);
  const [rentalCondition, setRentalCondition] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResponse, setSuccessResponse] = useState(null);

  // 2-Layer KYC Self-Declaration State (for users not yet KYC verified)
  const [declaredDob, setDeclaredDob] = useState('');
  const [declaredLicenseClass, setDeclaredLicenseClass] = useState('B2');
  const [declaredLicenseIssueDate, setDeclaredLicenseIssueDate] = useState('');

  const isUserKycVerified = String(user?.kycStatus || '').toUpperCase() === 'VERIFIED';
  const isKycHardBlocked = Boolean(rentalCondition?.requireVerifiedKyc && !isUserKycVerified);

  // Booking Type: 'FAST_HOLD' (Default / Recommended) vs 'STANDARD'
  const [bookingType, setBookingType] = useState(
    searchParams.get('type') === 'STANDARD' ? 'STANDARD' : 'FAST_HOLD'
  );

  // Deposit Method for Standard flow: 'CASH' (Tiền mặt khi nhận xe) vs 'VIETQR' (Chuyển khoản online)
  const [depositMethod, setDepositMethod] = useState('CASH');

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerIdCard: '',
    driverLicenseNumber: '',
    driverLicenseClass: 'B2',
    driverLicenseExpiry: '',
    notes: ''
  });

  const [licenseExpiryDisplay, setLicenseExpiryDisplay] = useState('');
  const datePickerRef = useRef(null);

  // Auto-prefill customer info if user is logged in
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        customerName: prev.customerName || user.fullName || user.name || '',
        customerPhone: prev.customerPhone || user.phoneNumber || user.phone || '',
        customerEmail: prev.customerEmail || user.email || '',
      }));
    }, 0);
    return () => clearTimeout(timer);
  }, [user]);

  const [hasAdditionalDriver, setHasAdditionalDriver] = useState(false);
  const [additionalDriver, setAdditionalDriver] = useState({
    fullName: '',
    phoneNumber: '',
    idCardNumber: '',
    licenseNumber: ''
  });

  const [agreed, setAgreed] = useState(false);

  // File Upload State - 4 slots (CCCD trước/sau, GPLX trước/sau)
  const [, setIdCardFrontFile] = useState(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState(null);
  const [, setIdCardBackFile] = useState(null);
  const [idCardBackPreview, setIdCardBackPreview] = useState(null);

  const [, setLicenseFrontFile] = useState(null);
  const [licenseFrontPreview, setLicenseFrontPreview] = useState(null);
  const [, setLicenseBackFile] = useState(null);
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

  // Pickup / Delivery Selection State (synced from CarDetailPage & preserved across LoginPage returnUrl)
  const [deliveryMethod, setDeliveryMethod] = useState(
    searchParams.get('deliveryMethod') === 'DELIVERY' ? 'DELIVERY' : 'SELF_PICKUP'
  );
  const [deliveryZoneId, setDeliveryZoneId] = useState(
    searchParams.get('deliveryZone') || 'Q1'
  );
  const [deliveryAddressDetail, setDeliveryAddressDetail] = useState(
    searchParams.get('deliveryAddress') || ''
  );

  const selectedDeliveryZone = getZoneById(deliveryZoneId);
  const yardAddress = formatYardAddress(vehicle?.pickupLocation);
  const effectiveDeliveryDistanceKm = deliveryMethod === 'DELIVERY' ? selectedDeliveryZone.estimatedKm : 0;
  const effectivePickupLocation = deliveryMethod === 'DELIVERY'
    ? (deliveryAddressDetail.trim()
        ? `${deliveryAddressDetail.trim()}, ${selectedDeliveryZone.label}`
        : selectedDeliveryZone.label)
    : yardAddress;
  const pickupLocation = effectivePickupLocation;
  const dropoffLocation = effectivePickupLocation;

  const dateValidation = validateRentalDates(startTimeStr, endTimeStr);
  const isInvalidBookingDates = Boolean(dateValidation.error);

  useEffect(() => {
    if (!startTimeStr || !endTimeStr) {
      navigate(`/cars/${carId}`);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehRes, condRes] = await Promise.allSettled([
          vehicleService.getVehicleById(carId),
          rentalConditionService.getConditionByVehicleId(carId)
        ]);
        if (vehRes.status === 'fulfilled') {
          setVehicle(vehRes.value?.data || vehRes.value);
        }
        if (condRes.status === 'fulfilled') {
          setRentalCondition(condRes.value?.data || condRes.value || null);
        }

        if (validateRentalDates(startTimeStr, endTimeStr).valid) {
          const start = new Date(startTimeStr);
          const end = new Date(endTimeStr);
          const diffTime = end - start;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

          const previewRes = await pricingService.previewPricing(carId, diffDays);
          setPreview(previewRes.data || previewRes);
        } else {
          setPreview(null);
          setError(validateRentalDates(startTimeStr, endTimeStr).error);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải thông tin thuê xe');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [carId, startTimeStr, endTimeStr, navigate]);

  const effectiveDobForCheck = isUserKycVerified && user?.dateOfBirth ? user.dateOfBirth : declaredDob;
  const effectiveLicenseClassForCheck = isUserKycVerified && (user?.licenseClass || user?.driverLicenseClass)
    ? (user.licenseClass || user.driverLicenseClass)
    : (declaredLicenseClass || formData.driverLicenseClass);
  const effectiveIssueDateForCheck = isUserKycVerified && user?.licenseIssueDate ? user.licenseIssueDate : declaredLicenseIssueDate;

  const eligibilityCheck = evaluateEligibility({
    condition: rentalCondition,
    vehicle,
    dob: effectiveDobForCheck,
    licenseClass: effectiveLicenseClassForCheck,
    licenseIssueDate: effectiveIssueDateForCheck
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitized = value;

    if (name === 'customerName') {
      // Chỉ cho phép chữ cái (tiếng Việt có dấu, Latin) và khoảng trắng, tối đa 50 ký tự, viết hoa
      sanitized = value
        .replace(/[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]/g, '')
        .slice(0, 50)
        .toUpperCase();
    } else if (name === 'customerPhone') {
      // Chỉ cho phép chữ số, tối đa 10 số
      sanitized = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'customerEmail') {
      // Không cho khoảng trắng, tối đa 80 ký tự
      sanitized = value.replace(/\s/g, '').slice(0, 80);
    } else if (name === 'customerIdCard') {
      // CCCD: chỉ chữ số, tối đa 12 số
      sanitized = value.replace(/\D/g, '').slice(0, 12);
    } else if (name === 'driverLicenseNumber') {
      // GPLX: chỉ chữ số, tối đa 12 số
      sanitized = value.replace(/\D/g, '').slice(0, 12);
    } else if (name === 'notes') {
      sanitized = value.slice(0, 500);
    }

    setFormData(prev => ({ ...prev, [name]: sanitized }));
    if (error) setError(null);
  };

  const handleAdditionalDriverChange = (e) => {
    const { name, value } = e.target;
    let sanitized = value;

    if (name === 'fullName') {
      sanitized = value
        .replace(/[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]/g, '')
        .slice(0, 50)
        .toUpperCase();
    } else if (name === 'phoneNumber') {
      sanitized = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'idCardNumber') {
      sanitized = value.replace(/\D/g, '').slice(0, 12);
    } else if (name === 'licenseNumber') {
      sanitized = value.replace(/\D/g, '').slice(0, 12);
    }

    setAdditionalDriver(prev => ({ ...prev, [name]: sanitized }));
    if (error) setError(null);
  };

  // Xử lý nhập ngày hết hạn GPLX định dạng DD/MM/YYYY linh hoạt
  const handleLicenseExpiryInputChange = (e) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, '').slice(0, 8);

    let formatted = '';
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    setLicenseExpiryDisplay(formatted);

    if (digits.length === 8) {
      const d = parseInt(digits.slice(0, 2), 10);
      const m = parseInt(digits.slice(2, 4), 10);
      const y = parseInt(digits.slice(4, 8), 10);

      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2020 && y <= 2099) {
        const daysInMonth = new Date(y, m, 0).getDate();
        if (d <= daysInMonth) {
          const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          setFormData(prev => ({ ...prev, driverLicenseExpiry: iso }));
          if (error) setError(null);
          return;
        }
      }
    }
    setFormData(prev => ({ ...prev, driverLicenseExpiry: '' }));
  };

  // Xử lý khi user chọn ngày từ native date picker
  const handleNativeDateChange = (e) => {
    const iso = e.target.value;
    if (iso) {
      const [y, m, d] = iso.split('-');
      setFormData(prev => ({ ...prev, driverLicenseExpiry: iso }));
      setLicenseExpiryDisplay(`${d}/${m}/${y}`);
      if (error) setError(null);
    }
  };

  // Nút chọn nhanh thời hạn GPLX (+3, +5, +10 năm)
  const handleQuickSetExpiry = (years) => {
    const target = new Date();
    target.setFullYear(target.getFullYear() + years);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    setFormData(prev => ({ ...prev, driverLicenseExpiry: iso }));
    setLicenseExpiryDisplay(`${d}/${m}/${y}`);
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    if (!user) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (isAccountSuspended) {
      setError(
        `Tài khoản của bạn đang bị TẠM KHÓA quyền đặt xe mới${user?.lockReason ? `: ${user.lockReason}` : '.'} Vui lòng liên hệ Hotline 1900 8888 để được hỗ trợ.`
      );
      return;
    }

    if (isInvalidBookingDates) {
      setError(dateValidation.error || 'Thời gian thuê xe không hợp lệ.');
      return;
    }

    // Common validations
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

    const isFastHold = bookingType === 'FAST_HOLD';

    // Strict validation ONLY for Standard booking
    if (!isFastHold) {
      if (!formData.customerIdCard?.trim()) {
        setError('Vui lòng nhập Số CCCD/CMND người thuê.');
        return;
      }
      if (!formData.driverLicenseNumber?.trim()) {
        setError('Vui lòng nhập Số Giấy phép lái xe người thuê.');
        return;
      }
      if (!formData.driverLicenseClass) {
        setError('Vui lòng chọn Hạng Giấy phép lái xe.');
        return;
      }
      if (!formData.driverLicenseExpiry) {
        setError('Vui lòng nhập Ngày hết hạn Giấy phép lái xe.');
        return;
      }

      const expiryDate = new Date(formData.driverLicenseExpiry);
      const returnDate = new Date(endTimeStr);
      if (expiryDate <= returnDate) {
        setError(`GPLX của bạn hết hạn vào ngày ${expiryDate.toLocaleDateString('vi-VN')}, trước hoặc đúng ngày trả xe (${returnDate.toLocaleDateString('vi-VN')}). Không đủ điều kiện thuê xe.`);
        return;
      }

      if (formData.driverLicenseClass === 'B1_AUTO' && vehicle?.transmission === 'MANUAL') {
        setError(`GPLX hạng B1 số tự động không được phép điều khiển dòng xe số sàn (${vehicle?.make} ${vehicle?.model}).`);
        return;
      }
    } else {
      // Fast Hold check: if user provided license expiry, check it
      if (formData.driverLicenseExpiry) {
        const expiryDate = new Date(formData.driverLicenseExpiry);
        const returnDate = new Date(endTimeStr);
        if (expiryDate <= returnDate) {
          setError(`GPLX của bạn hết hạn vào ngày ${expiryDate.toLocaleDateString('vi-VN')}, trước ngày trả xe.`);
          return;
        }
      }
    }

    if (hasAdditionalDriver) {
      if (!additionalDriver.fullName?.trim() || !additionalDriver.phoneNumber?.trim()) {
        setError('Vui lòng nhập đầy đủ thông tin tài xế phụ.');
        return;
      }
    }

    if (isKycHardBlocked) {
      setError('Xe này yêu cầu tài khoản đã duyệt KYC trước khi đặt. Vui lòng hoàn tất xác minh CCCD & GPLX trong Hồ sơ cá nhân.');
      return;
    }

    if (!isUserKycVerified) {
      if (!declaredDob) {
        setError('Vui lòng khai báo Ngày sinh để kiểm tra điều kiện độ tuổi thuê xe.');
        return;
      }
      if (!declaredLicenseIssueDate) {
        setError('Vui lòng khai báo Ngày cấp GPLX để kiểm tra điều kiện số năm kinh nghiệm lái xe.');
        return;
      }
    }

    if (!eligibilityCheck.isAllValid) {
      setError(eligibilityCheck.errors[0]);
      return;
    }

    if (deliveryMethod === 'DELIVERY' && !deliveryAddressDetail.trim()) {
      setError('Vui lòng nhập địa chỉ giao xe chi tiết (số nhà, tên đường, phường) để nhân viên VELORA giao xe tận nơi.');
      return;
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
        deliveryMethod,
        pickupLocation: effectivePickupLocation,
        dropoffLocation: effectivePickupLocation,
        estimatedDeliveryDistanceKm: effectiveDeliveryDistanceKm,
        declaredDob: effectiveDobForCheck ? new Date(effectiveDobForCheck).toISOString() : null,
        declaredLicenseClass: effectiveLicenseClassForCheck || formData.driverLicenseClass || 'B2',
        declaredLicenseIssueDate: effectiveIssueDateForCheck ? new Date(effectiveIssueDateForCheck).toISOString() : null,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerIdCard: formData.customerIdCard?.trim() || (isFastHold ? 'CHƯA_CẬP_NHẬT' : ''),
        driverLicenseNumber: formData.driverLicenseNumber?.trim() || (isFastHold ? 'CHƯA_CẬP_NHẬT' : ''),
        driverLicenseClass: formData.driverLicenseClass || 'B2',
        driverLicenseExpiry: formData.driverLicenseExpiry 
          ? new Date(formData.driverLicenseExpiry).toISOString() 
          : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        notes: formData.notes?.trim() || '',
        idCardFrontUrl: idCardFrontPreview || '',
        idCardBackUrl: idCardBackPreview || '',
        driverLicenseFrontUrl: licenseFrontPreview || '',
        driverLicenseBackUrl: licenseBackPreview || '',
        bookingType: isFastHold ? 'FAST_HOLD' : 'STANDARD',
        depositMethod: isFastHold ? 'VIETQR' : depositMethod,
        holdDepositAmount: isFastHold ? 500000 : 0
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
      const createdData = res.data || res;

      // Persist in localStorage so ProfilePage can immediately resolve bookings
      if (requestPayload.customerEmail) {
        localStorage.setItem('velora_last_booking_email', requestPayload.customerEmail);
      }
      if (requestPayload.customerPhone) {
        localStorage.setItem('velora_last_booking_phone', requestPayload.customerPhone);
      }
      if (createdData?.id) {
        localStorage.setItem('velora_last_booking_id', createdData.id);
      }

      // If FAST_HOLD: Immediately navigate to VietQR deposit payment page for 500k!
      if (isFastHold && createdData?.id) {
        navigate(`/payment/deposit/${createdData.id}`);
        return;
      }

      setSuccessResponse(createdData);
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

  // STANDARD SUCCESS CONFIRMATION VIEW
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
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Hình thức đặt cọc:</span>
                <span className="font-bold text-emerald-700">
                  {successResponse.depositMethod === 'CASH' || depositMethod === 'CASH'
                    ? 'Cọc khi nhận xe (Chưa cần trả trước)'
                    : 'Chuyển khoản VietQR'}
                </span>
              </div>
              {(successResponse.depositMethod === 'CASH' || depositMethod === 'CASH') && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-950 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Không lo bị giữ tiền trước:</strong> Bạn đã chọn phương thức thanh toán cọc khi nhận xe. Sau khi hồ sơ được duyệt và ký hợp đồng số, bạn có thể linh hoạt chuyển khoản hoặc thanh toán tiền mặt khi kiểm tra và nhận xe tại điểm bàn giao.
                  </div>
                </div>
              )}
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

  const isFastHold = bookingType === 'FAST_HOLD';

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

        {isAccountSuspended && (
          <div className="mb-6 p-4 sm:p-5 rounded-xl bg-red-50 border border-red-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-100 text-red-700 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-red-900">
                  Tài khoản đang ở trạng thái TẠM KHÓA đặt xe mới
                </h3>
                {user?.lockReason && (
                  <p className="text-xs font-semibold text-red-800">
                    Lý do tạm khóa: {user.lockReason}
                  </p>
                )}
                <p className="text-xs text-red-700 leading-relaxed">
                  Tính năng tạo đơn thuê mới và thanh toán cọc giữ xe đã bị vô hiệu hóa tạm thời. Các hợp đồng đang lưu hành (nếu có) vẫn tiếp tục bình thường.
                </p>
              </div>
            </div>
            <Link
              to="/profile?tab=RENTALS"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-white border border-red-200 text-red-800 hover:bg-red-100/60 font-bold text-xs transition-colors"
            >
              <span>Về hồ sơ cá nhân</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {isInvalidBookingDates && (
          <div className="mb-6 p-4 sm:p-5 rounded-xl bg-red-50 border border-red-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-100 text-red-700 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-red-900">
                  Thời gian nhận / trả xe không hợp lệ
                </h3>
                <p className="text-xs font-semibold text-red-800">
                  {dateValidation.error} Hệ thống đã khóa chức năng tạo đơn cho lịch trình này.
                </p>
              </div>
            </div>
            <Link
              to={`/cars/${carId}`}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors"
            >
              <span>Chọn lại ngày giờ hợp lệ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: FORM ĐẶT XE (7 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* METHOD SWITCHER: FAST HOLD VS STANDARD */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Hình thức đặt xe</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Chọn phương thức phù hợp</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Fast Hold Card */}
                <button
                  type="button"
                  onClick={() => setBookingType('FAST_HOLD')}
                  className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                    isFastHold
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Cọc Giữ Xe Siêu Tốc 500K
                    </span>
                    <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-extrabold uppercase">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Khóa giữ xe trong 4 giờ chỉ với 500.000đ. Chỉ cần Họ tên & SĐT. Giấy tờ CCCD & GPLX bổ sung sau trong Hồ sơ cá nhân.
                  </p>
                </button>

                {/* Standard Card */}
                <button
                  type="button"
                  onClick={() => setBookingType('STANDARD')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    !isFastHold
                      ? 'bg-blue-50/70 border-blue-900 ring-2 ring-blue-900/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs text-blue-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-900" />
                      Đặt Thuê Tiêu Chuẩn
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tải đầy đủ ảnh CCCD & GPLX 4 mặt. Đội ngũ kiểm duyệt hồ sơ thẩm định trước khi ký hợp đồng và thanh toán cọc thế chân xe.
                  </p>
                </button>
              </div>

              {/* TÙY CHỌN PHƯƠNG THỨC CỌC THẾ CHÂN CHO LUỒNG TIÊU CHUẨN */}
              {!isFastHold && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-slate-700" />
                      Phương thức đặt cọc thế chân xe:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Cash / Transfer at Handover */}
                    <button
                      type="button"
                      onClick={() => setDepositMethod('CASH')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        depositMethod === 'CASH'
                          ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-emerald-700" />
                          Cọc khi nhận xe
                        </span>
                        <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black uppercase">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-emerald-800">0đ thanh toán hôm nay!</strong> Bạn chỉ cần ký hợp đồng trước; khoản cọc thế chân sẽ được thanh toán trực tiếp bằng chuyển khoản hoặc tiền mặt khi bạn nhận bàn giao xe.
                      </p>
                    </button>

                    {/* Option 2: VietQR Online */}
                    <button
                      type="button"
                      onClick={() => setDepositMethod('VIETQR')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        depositMethod === 'VIETQR'
                          ? 'bg-blue-50/90 border-blue-900 ring-2 ring-blue-900/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-blue-700" />
                          Chuyển khoản VietQR (Napas 24/7)
                        </span>
                        <span className="text-[9px] bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5" />
                          Giảm 5% tiền thuê
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Thanh toán online trước nhận ngay <strong>chiết khấu 5%</strong> + tặng thêm <strong>50 km/ngày</strong> và <strong>miễn phí rửa xe 100%</strong> khi hoàn trả.
                      </p>
                    </button>
                  </div>

                  {depositMethod === 'CASH' && (
                    <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong>Tiện ích đặt xe trước ngày đi:</strong> Quý khách không lo bị giữ một khoản tiền lớn trong tài khoản. Khoản cọc thế chân được thanh toán linh hoạt bằng chuyển khoản hoặc tiền mặt khi bạn tận tay kiểm tra xe và ký biên bản giao nhận ODO/nhiên liệu.
                      </div>
                    </div>
                  )}

                  {depositMethod === 'VIETQR' && (
                    <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 rounded-lg text-xs text-blue-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-blue-900">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Đặc quyền ưu đãi độc quyền khi thanh toán online trước qua VietQR:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                        <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded border border-blue-100">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span><strong>Giảm trực tiếp 5%</strong> tổng tiền thuê</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded border border-blue-100">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span><strong>Tặng +50 km/ngày</strong> hạn mức di chuyển</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded border border-blue-100">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span><strong>Miễn phí 100%</strong> rửa xe & dọn nội thất</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded border border-blue-100">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span><strong>Luồng xanh VIP:</strong> Nhận xe 5 phút tại bãi</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Box Điều kiện bắt buộc & Khai báo 2 lớp */}
              {rentalCondition && (
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-900" />
                      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                        Điều kiện bắt buộc để thuê xe này
                      </h2>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      rentalCondition.isCustom
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-sky-50 text-sky-800 border-sky-200'
                    }`}>
                      {rentalCondition.isCustom ? 'Quy định riêng của xe' : 'Mặc định hệ thống'}
                    </span>
                  </div>

                  {/* Criteria Summary Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Độ tuổi</span>
                      <strong className="text-zinc-950">≥ {eligibilityCheck.minAge} tuổi</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kinh nghiệm lái</span>
                      <strong className="text-zinc-950">≥ {eligibilityCheck.minDrivingYears} năm</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Hạng GPLX</span>
                      <strong className="text-zinc-950">Hạng {eligibilityCheck.requiredLicense}+</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Yêu cầu thêm</span>
                      <strong className={rentalCondition.requireVerifiedKyc ? 'text-amber-800' : 'text-emerald-700'}>
                        {rentalCondition.requireVerifiedKyc
                          ? 'Bắt buộc KYC'
                          : (rentalCondition.minCompletedTrips > 0 ? `≥ ${rentalCondition.minCompletedTrips} chuyến` : 'Tiêu chuẩn')}
                      </strong>
                    </div>
                  </div>

                  {/* Hard Block Banner if requireVerifiedKyc && user not VERIFIED */}
                  {isKycHardBlocked ? (
                    <div className="p-4 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs leading-relaxed">
                          <strong className="block text-rose-950">
                            Xe này yêu cầu tài khoản đã duyệt xác minh danh tính (KYC) trước khi đặt!
                          </strong>
                          <p className="text-rose-800 mt-0.5">
                            Tài khoản hiện tại của bạn đang ở trạng thái <strong>{user?.kycStatus || 'CHƯA XÁC MINH'}</strong>. Vui lòng cập nhật CCCD & GPLX trong Hồ sơ cá nhân để quản lý duyệt KYC, sau đó quay lại đặt xe.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/profile"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition shadow-xs"
                      >
                        <span>Đi tới Hồ sơ xác minh KYC</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : !isUserKycVerified ? (
                    /* Self-declaration 3 fields for unverified user */
                    <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 space-y-3">
                      <div className="flex items-start gap-2 text-xs text-amber-950">
                        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>Khai báo nhanh thông tin đủ điều kiện lái xe:</strong>
                          <span className="block text-[11px] text-amber-800 mt-0.5">
                            Nhân viên VELORA sẽ đối chiếu thông tin bạn tự khai dưới đây với ảnh gốc CCCD/GPLX khi duyệt đơn.
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-900 mb-1">
                            Ngày sinh <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={declaredDob}
                            onChange={(e) => {
                              setDeclaredDob(e.target.value);
                              if (error) setError(null);
                            }}
                            max={new Date().toISOString().split('T')[0]}
                            required
                            className={`w-full bg-white border rounded-md px-2.5 py-2 text-xs font-semibold text-zinc-950 focus:outline-none ${
                              eligibilityCheck.ageOk === false ? 'border-rose-500 bg-rose-50/40' : 'border-slate-300 focus:border-blue-900'
                            }`}
                          />
                          {eligibilityCheck.age !== null && (
                            <span className={`text-[10px] font-semibold mt-0.5 block ${eligibilityCheck.ageOk ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {eligibilityCheck.ageOk ? `✓ Đủ tuổi (${eligibilityCheck.age} tuổi)` : `✗ Chưa đủ ${eligibilityCheck.minAge} tuổi (${eligibilityCheck.age} tuổi)`}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-900 mb-1">
                            Hạng GPLX <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={declaredLicenseClass}
                            onChange={(e) => {
                              setDeclaredLicenseClass(e.target.value);
                              setFormData(prev => ({ ...prev, driverLicenseClass: e.target.value }));
                              if (error) setError(null);
                            }}
                            className={`w-full bg-white border rounded-md px-2.5 py-2 text-xs font-semibold text-zinc-950 focus:outline-none ${
                              eligibilityCheck.licenseOk === false ? 'border-rose-500 bg-rose-50/40' : 'border-slate-300 focus:border-blue-900'
                            }`}
                          >
                            <option value="B1">Hạng B1 (Số tự động)</option>
                            <option value="B2">Hạng B2 (Số sàn & tự động)</option>
                            <option value="C">Hạng C trở lên</option>
                            <option value="D">Hạng D / E</option>
                          </select>
                          {eligibilityCheck.licenseOk !== null && (
                            <span className={`text-[10px] font-semibold mt-0.5 block ${eligibilityCheck.licenseOk ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {eligibilityCheck.licenseOk ? `✓ Đạt chuẩn (${eligibilityCheck.requiredLicense}+)` : `✗ Cần tối thiểu hạng ${eligibilityCheck.requiredLicense}`}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-900 mb-1">
                            Ngày cấp GPLX <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={declaredLicenseIssueDate}
                            onChange={(e) => {
                              setDeclaredLicenseIssueDate(e.target.value);
                              if (error) setError(null);
                            }}
                            max={new Date().toISOString().split('T')[0]}
                            required
                            className={`w-full bg-white border rounded-md px-2.5 py-2 text-xs font-semibold text-zinc-950 focus:outline-none ${
                              eligibilityCheck.expOk === false ? 'border-rose-500 bg-rose-50/40' : 'border-slate-300 focus:border-blue-900'
                            }`}
                          />
                          {eligibilityCheck.expYears !== null && (
                            <span className={`text-[10px] font-semibold mt-0.5 block ${eligibilityCheck.expOk ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {eligibilityCheck.expOk ? `✓ Đủ kinh nghiệm (${eligibilityCheck.expYears} năm)` : `✗ Cần ≥ ${eligibilityCheck.minDrivingYears} năm (${Math.max(0, eligibilityCheck.expYears)} năm)`}
                            </span>
                          )}
                        </div>
                      </div>

                      {!eligibilityCheck.isAllValid && (
                        <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold space-y-1">
                          {eligibilityCheck.errors.map((errItem, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{errItem}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tài khoản của bạn đã xác minh KYC thành công — hệ thống tự động đối chiếu hồ sơ định danh đã duyệt.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Box 0: Hình thức nhận & giao xe */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-900" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                      Hình thức nhận & giao xe
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {deliveryMethod === 'DELIVERY' ? `Giao tận nơi (~${effectiveDeliveryDistanceKm} km)` : 'Nhận tại bãi (Miễn phí)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Self Pickup at Yard */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('SELF_PICKUP');
                      if (error) setError(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      deliveryMethod === 'SELF_PICKUP'
                        ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-zinc-950 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                        Nhận xe tại bãi VELORA
                      </span>
                      <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black uppercase">
                        Miễn phí
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Đến trực tiếp bãi xe kiểm tra, chụp taplo và nhận chìa khóa ngay (<strong className="text-emerald-800">0 km trung chuyển</strong>).
                    </p>
                  </button>

                  {/* Option 2: Doorstep Delivery */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('DELIVERY');
                      if (error) setError(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      deliveryMethod === 'DELIVERY'
                        ? 'bg-blue-50/90 border-blue-900 ring-2 ring-blue-900/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-blue-700" />
                        Giao xe tận nơi
                      </span>
                      <span className="text-[9px] bg-blue-700 text-white px-2 py-0.5 rounded-full font-black uppercase">
                        TP.HCM & Sân bay
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Nhân viên VELORA điều xe từ bãi đến tận nhà, khách sạn hoặc Sân bay Tân Sơn Nhất (quy trình bàn giao 2 bước minh bạch ODO).
                    </p>
                  </button>
                </div>

                {deliveryMethod === 'SELF_PICKUP' ? (
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-950 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Địa điểm nhận & trả xe tại bãi:</span>
                      <span className="text-emerald-900">{yardAddress}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-900 mb-1">
                          Khu vực Quận / Huyện TP.HCM <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={deliveryZoneId}
                          onChange={(e) => setDeliveryZoneId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900"
                        >
                          {HCMC_DELIVERY_ZONES.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.label} (~{z.estimatedKm} km)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-900 mb-1">
                          Địa chỉ chi tiết (Số nhà, tên đường, phường) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryAddressDetail}
                          onChange={(e) => {
                            setDeliveryAddressDetail(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="VD: 88 Lê Lợi, Phường Bến Nghé..."
                          required={deliveryMethod === 'DELIVERY'}
                          className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 placeholder-slate-400 focus:outline-none focus:border-blue-900"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-200/70 text-[11px] text-blue-900">
                      <span>
                        Xuất phát từ: <strong>{yardAddress}</strong>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-blue-300 font-bold tabular-nums">
                        Quãng đường giao ước tính: ~{effectiveDeliveryDistanceKm} km
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Box 1: Thông tin người thuê chính */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-900" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                    1. Thông tin người thuê xe (Khách hàng chính)
                  </h2>
                </div>

                {isFastHold && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0 fill-amber-600 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Chế độ Cọc giữ xe siêu tốc 500K đang bật:</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Quý khách chỉ cần điền <strong>Họ tên, Số điện thoại & Email</strong>. Các trường CCCD, GPLX và ảnh chụp có thể để trống và bổ sung sau trong mục <em>Hồ sơ cá nhân</em> trước khi nhận xe.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ và tên: Chỉ chữ cái tiếng Việt/Latin, tối đa 50 ký tự */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-900">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {formData.customerName.length}/50
                      </span>
                    </div>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="NGUYEN VAN A"
                      maxLength={50}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 uppercase focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Số điện thoại: Chỉ số, tối đa 10 chữ số */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-900">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal tabular-nums">
                        {formData.customerPhone.length}/10 số
                      </span>
                    </div>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="0901234567"
                      maxLength={10}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Địa chỉ Email: Bỏ khoảng trắng, tối đa 80 ký tự */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-900">
                        Địa chỉ Email <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Tối đa 80 ký tự
                      </span>
                    </div>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      placeholder="customer@example.com"
                      maxLength={80}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Số CCCD / CMND: Chỉ số, tối đa 12 số */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-900">
                        Số CCCD / CMND gắn chip {!isFastHold ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal text-[10px]">(Bổ sung sau)</span>}
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal tabular-nums">
                        {formData.customerIdCard.length}/12 số
                      </span>
                    </div>
                    <input
                      type="text"
                      name="customerIdCard"
                      value={formData.customerIdCard}
                      onChange={handleInputChange}
                      placeholder={isFastHold ? "Có thể bổ sung sau..." : "079099xxxxxx (12 số)"}
                      maxLength={12}
                      required={!isFastHold}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Số Giấy phép lái xe: Chỉ số, tối đa 12 số */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-900">
                        Số Giấy phép lái xe {!isFastHold ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal text-[10px]">(Bổ sung sau)</span>}
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal tabular-nums">
                        {formData.driverLicenseNumber.length}/12 số
                      </span>
                    </div>
                    <input
                      type="text"
                      name="driverLicenseNumber"
                      value={formData.driverLicenseNumber}
                      onChange={handleInputChange}
                      placeholder={isFastHold ? "Có thể bổ sung sau..." : "790123456789 (12 số)"}
                      maxLength={12}
                      required={!isFastHold}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Hạng Giấy phép lái xe */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Hạng Giấy phép lái xe {!isFastHold ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal text-[10px]">(Tùy chọn)</span>}
                    </label>
                    <select
                      name="driverLicenseClass"
                      value={formData.driverLicenseClass}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                    >
                      <option value="B1_AUTO">Hạng B1 — Số tự động (Không được lái số sàn)</option>
                      <option value="B1">Hạng B1 — Cơ học (Số sàn & tự động)</option>
                      <option value="B2">Hạng B2 — Xe đến 9 chỗ (Số sàn & tự động)</option>
                      <option value="C">Hạng C — Xe tải & du lịch đến 9 chỗ</option>
                      <option value="D">Hạng D — Xe chở người đến 30 chỗ</option>
                    </select>
                  </div>

                  {/* Ngày hết hạn GPLX: Hỗ trợ gõ Ngày/Tháng/Năm (DD/MM/YYYY), nút Chọn Lịch & Chọn nhanh */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-900">
                        Ngày hết hạn GPLX {!isFastHold ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal text-[10px]">(Bổ sung sau)</span>}
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Nhập Ngày/Tháng/Năm (DD/MM/YYYY)
                      </span>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={licenseExpiryDisplay}
                        onChange={handleLicenseExpiryInputChange}
                        placeholder="VD: 25/11/2030 (hoặc bấm nút Chọn lịch bên cạnh)"
                        maxLength={10}
                        required={!isFastHold}
                        className={`w-full bg-slate-50 border rounded-md pl-3 pr-28 py-2 text-xs font-bold text-zinc-950 tabular-nums focus:outline-none focus:bg-white transition-colors ${
                          formData.driverLicenseExpiry && endTimeStr && new Date(formData.driverLicenseExpiry) <= new Date(endTimeStr)
                            ? 'border-red-400 focus:border-red-600 bg-red-50/40 text-red-900'
                            : formData.driverLicenseExpiry
                            ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20'
                            : 'border-slate-300 focus:border-blue-900'
                        }`}
                      />

                      {/* Native date picker trigger */}
                      <div className="absolute right-1 flex items-center">
                        <input
                          type="date"
                          ref={datePickerRef}
                          onChange={handleNativeDateChange}
                          value={formData.driverLicenseExpiry || ''}
                          min={endTimeStr ? new Date(new Date(endTimeStr).setDate(new Date(endTimeStr).getDate() + 1)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                          tabIndex={-1}
                          className="sr-only"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              datePickerRef.current?.showPicker();
                            } catch {
                              datePickerRef.current?.focus();
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-200/90 hover:bg-slate-300 text-slate-700 hover:text-slate-950 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer mr-0.5"
                          title="Bấm để mở lịch chọn ngày"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-900" />
                          <span className="text-[11px] font-bold">Chọn lịch</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-slate-500 font-semibold mr-1">
                        Chọn nhanh thời hạn:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickSetExpiry(3)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition cursor-pointer"
                      >
                        +3 năm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSetExpiry(5)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition cursor-pointer"
                      >
                        +5 năm (Hạng C/D)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSetExpiry(10)}
                        className="px-2.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-900 text-[10px] font-extrabold border border-blue-200 transition cursor-pointer shadow-2xs"
                      >
                        +10 năm (Chuẩn GPLX B2)
                      </button>
                    </div>

                    {/* Realtime Feedback */}
                    {formData.driverLicenseExpiry && endTimeStr && new Date(formData.driverLicenseExpiry) > new Date(endTimeStr) ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold mt-1.5 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Hợp lệ: GPLX còn hạn đến ngày {new Date(formData.driverLicenseExpiry).toLocaleDateString('vi-VN')} (sau thời điểm trả xe).</span>
                      </div>
                    ) : formData.driverLicenseExpiry && endTimeStr && new Date(formData.driverLicenseExpiry) <= new Date(endTimeStr) ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-red-700 font-bold mt-1.5 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Không hợp lệ: GPLX hết hạn vào {new Date(formData.driverLicenseExpiry).toLocaleDateString('vi-VN')}, trước hoặc đúng ngày trả xe ({new Date(endTimeStr).toLocaleDateString('vi-VN')}).</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 mt-1">
                        * Theo quy định pháp luật, ngày hết hạn GPLX phải sau thời điểm trả xe ({endTimeStr ? new Date(endTimeStr).toLocaleDateString('vi-VN') : 'khi kết thúc thuê'}).
                      </p>
                    )}
                  </div>

                  {/* Realtime Warnings for Compatibility */}
                  {formData.driverLicenseClass === 'B1_AUTO' && vehicle?.transmission === 'MANUAL' && (
                    <div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Không tương thích hộp số: </span>
                        Dòng xe <strong>{vehicle?.make} {vehicle?.model}</strong> là <strong>SỐ SÀN (MANUAL)</strong>. 
                        Người có GPLX hạng B1 số tự động không được phép điều khiển dòng xe này theo luật Giao thông Đường bộ.
                      </div>
                    </div>
                  )}

                  {!isFastHold && vehicle?.dailyRate >= 1500000 && (
                    <div className="sm:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Điều kiện phân khúc xe sang / cao cấp: </span>
                        Dòng xe giá trị cao yêu cầu khách hàng đã có ít nhất <strong>01 chuyến đi hoàn tất tốt</strong> trên hệ thống VELORA và không có lịch sử tranh chấp vi phạm.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Tải ảnh hồ sơ định danh (4 slots) */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-900" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                      2. Tải ảnh giấy tờ định danh (CCCD & GPLX)
                    </h2>
                  </div>
                  {isFastHold && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Tùy chọn bổ sung sau
                    </span>
                  )}
                </div>

                {isFastHold && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-600 text-xs leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <em>Quý khách có thể tải ảnh giấy tờ ngay nếu có sẵn, hoặc bỏ qua để hoàn tất thanh toán cọc giữ xe 500k trước và bổ sung sau trong mục <strong>Hồ sơ cá nhân</strong>.</em>
                    </div>
                  </div>
                )}

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
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-zinc-900">Họ tên người lái phụ</label>
                        <span className="text-[10px] text-slate-400 font-normal">{additionalDriver.fullName.length}/50</span>
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        value={additionalDriver.fullName}
                        onChange={handleAdditionalDriverChange}
                        placeholder="TRAN VAN B"
                        maxLength={50}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 uppercase focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-zinc-900">Số điện thoại lái phụ</label>
                        <span className="text-[10px] text-slate-400 font-normal tabular-nums">{additionalDriver.phoneNumber.length}/10 số</span>
                      </div>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={additionalDriver.phoneNumber}
                        onChange={handleAdditionalDriverChange}
                        placeholder="0987654321"
                        maxLength={10}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-zinc-900">Số CCCD lái phụ</label>
                        <span className="text-[10px] text-slate-400 font-normal tabular-nums">{additionalDriver.idCardNumber.length}/12 số</span>
                      </div>
                      <input
                        type="text"
                        name="idCardNumber"
                        value={additionalDriver.idCardNumber}
                        onChange={handleAdditionalDriverChange}
                        placeholder="079099xxxxxx (12 số)"
                        maxLength={12}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-zinc-900">Số GPLX lái phụ</label>
                        <span className="text-[10px] text-slate-400 font-normal tabular-nums">{additionalDriver.licenseNumber.length}/12 số</span>
                      </div>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={additionalDriver.licenseNumber}
                        onChange={handleAdditionalDriverChange}
                        placeholder="790123456789 (12 số)"
                        maxLength={12}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
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
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{error}</span>
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
                    src={getPrimaryImageUrl(vehicle?.imageUrl)}
                    alt={`${vehicle?.make || ''} ${vehicle?.model || 'Car'}`}
                    onError={handleImageError}
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
                  <span className="text-slate-500">Hình thức nhận:</span>
                  <span className={`font-bold text-right ${deliveryMethod === 'DELIVERY' ? 'text-blue-800' : 'text-emerald-700'}`}>
                    {deliveryMethod === 'DELIVERY'
                      ? `Giao tận nơi (~${effectiveDeliveryDistanceKm} km)`
                      : 'Nhận tại bãi (Miễn phí)'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Địa điểm:</span>
                  <span className="font-semibold text-zinc-950 text-right truncate max-w-[190px]" title={effectivePickupLocation}>
                    {effectivePickupLocation}
                  </span>
                </div>
              </div>

              {/* Financial Breakdown */}
              {preview && (() => {
                const isOnlinePrepay = !isFastHold && depositMethod === 'VIETQR';
                const onlineDiscountAmount = isOnlinePrepay ? Math.round((preview.rentalPrice || 0) * 0.05) : 0;
                const finalRentalPrice = Math.max(0, (preview.rentalPrice || 0) - onlineDiscountAmount);

                return (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Tiền thuê ({preview.rentalDays} ngày)</span>
                      <span className="tabular-nums font-semibold text-zinc-950">
                        {formatCurrencyVND((preview.basePrice || vehicle?.dailyRate) * preview.rentalDays)}
                      </span>
                    </div>

                    {preview.discountPercentage > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Chiết khấu thời gian ({preview.discountPercentage}%)</span>
                        <span className="tabular-nums">
                          -{formatCurrencyVND(((preview.basePrice || vehicle?.dailyRate) * preview.rentalDays) - preview.rentalPrice)}
                        </span>
                      </div>
                    )}

                    {isOnlinePrepay && (
                      <div className="flex justify-between text-blue-800 font-bold bg-blue-50/80 p-2 rounded-lg border border-blue-200">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          Ưu đãi thanh toán VietQR (5%)
                        </span>
                        <span className="tabular-nums text-blue-900">
                          -{formatCurrencyVND(onlineDiscountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                      <span>Tiền cọc thế chân xe (Hoàn trả 100%)</span>
                      <span className="tabular-nums font-semibold text-zinc-950">
                        {formatCurrencyVND(vehicle?.depositAmount || 15000000)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="font-bold text-zinc-950">Tổng tiền thuê</span>
                      <div className="text-right">
                        {isOnlinePrepay && (
                          <div className="text-[11px] text-slate-600 line-through tabular-nums">
                            {formatCurrencyVND(preview.rentalPrice)}
                          </div>
                        )}
                        <span className="text-lg font-extrabold text-blue-900 tabular-nums">
                          {formatCurrencyVND(finalRentalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Fast Hold vs Standard Deposit Callout */}
              {isFastHold ? (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                        Cọc giữ xe siêu tốc (Napas 247):
                      </span>
                      <span className="text-base font-black text-amber-800 tabular-nums">500.000 đ</span>
                    </div>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      * Khóa xe giữ chỗ trong 4 giờ. Cọc thế chân và tiền thuê sẽ thanh toán sau khi hoàn tất hồ sơ và nhận xe.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || isAccountSuspended || isInvalidBookingDates || isKycHardBlocked || !eligibilityCheck.isAllValid}
                    className={`w-full font-extrabold text-xs py-3.5 px-4 rounded-md shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
                      isAccountSuspended || isInvalidBookingDates || isKycHardBlocked || !eligibilityCheck.isAllValid
                        ? 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 text-white cursor-pointer hover:shadow-md'
                    }`}
                  >
                    {isAccountSuspended ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Đã khóa chức năng đặt xe mới</span>
                      </>
                    ) : isKycHardBlocked ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Cần duyệt KYC trước khi đặt</span>
                      </>
                    ) : !eligibilityCheck.isAllValid ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Chưa đáp ứng điều kiện thuê xe</span>
                      </>
                    ) : isInvalidBookingDates ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Đã khóa (Ngày giờ không hợp lệ)</span>
                      </>
                    ) : submitting ? (
                      <span>Đang khởi tạo giao dịch 500k...</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Tiến hành cọc giữ xe 500.000đ</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  {depositMethod === 'CASH' ? (
                    <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-emerald-700" />
                          Hình thức cọc:
                        </span>
                        <span className="text-xs font-black text-emerald-800 uppercase">Cọc khi nhận xe</span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-emerald-200">
                        <span className="text-xs text-emerald-900 font-semibold">Thanh toán ngay lúc này:</span>
                        <span className="text-base font-black text-emerald-700 tabular-nums">0 đ</span>
                      </div>
                      <p className="text-[10px] text-emerald-800 leading-relaxed">
                        * Tiền cọc thế chân ({formatCurrencyVND(vehicle?.depositAmount || 15000000)}) có thể thanh toán linh hoạt bằng chuyển khoản hoặc tiền mặt khi bạn đến nhận xe và ký biên bản bàn giao.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-blue-700" />
                          Hình thức cọc:
                        </span>
                        <span className="text-xs font-black text-blue-800 uppercase">Chuyển khoản VietQR</span>
                      </div>
                      <div className="text-[11px] text-blue-900 font-semibold flex items-center gap-1.5 bg-white/90 p-2 rounded border border-blue-100">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Đã áp dụng ưu đãi: <strong>Giảm 5% tiền thuê</strong> + Tặng 50km/ngày</span>
                      </div>
                      <p className="text-[10px] text-blue-800 leading-relaxed">
                        * Chuyển khoản trực tuyến qua mã VietQR sau khi hồ sơ giấy tờ được phê duyệt.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || isAccountSuspended || isInvalidBookingDates || isKycHardBlocked || !eligibilityCheck.isAllValid}
                    className={`w-full font-bold text-xs py-3.5 px-4 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 uppercase tracking-wider ${
                      isAccountSuspended || isInvalidBookingDates || isKycHardBlocked || !eligibilityCheck.isAllValid
                        ? 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed'
                        : depositMethod === 'CASH'
                        ? 'bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white cursor-pointer hover:shadow-md'
                        : 'bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white cursor-pointer hover:shadow-md'
                    }`}
                  >
                    {isAccountSuspended ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Đã khóa chức năng đặt xe mới</span>
                      </>
                    ) : isKycHardBlocked ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Cần duyệt KYC trước khi đặt</span>
                      </>
                    ) : !eligibilityCheck.isAllValid ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Chưa đáp ứng điều kiện thuê xe</span>
                      </>
                    ) : isInvalidBookingDates ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Đã khóa (Ngày giờ không hợp lệ)</span>
                      </>
                    ) : submitting ? (
                      <span>Đang gửi hồ sơ thẩm định...</span>
                    ) : depositMethod === 'CASH' ? (
                      <>
                        <span>Gửi hồ sơ & Xác nhận cọc khi nhận xe</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Gửi yêu cầu thuê & Nhận ưu đãi giảm 5%</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                {isFastHold 
                  ? 'Thanh toán trực tiếp qua cổng VietQR Napas 24/7. Nhận mã đơn và chuyển khoản tức thì.'
                  : 'Hồ sơ sẽ được thẩm định trực tuyến trong 10-15 phút. Bạn sẽ nhận được thông báo ký hợp đồng điện tử qua hệ thống.'}
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default BookingPage;
