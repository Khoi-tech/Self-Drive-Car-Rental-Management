import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/delivery_zones.dart';
import '../../models/car_model.dart';
import '../../models/pricing_policy_model.dart';
import '../../models/rental_condition_model.dart';
import '../../models/rental_request_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/car_service.dart';
import '../../services/rental_service.dart';
import '../payment/vietqr_payment_screen.dart';
import '../profile/profile_screen.dart';
import '../rentals/rental_order_detail_screen.dart';

class BookingScreen extends StatefulWidget {
  final CarModel car;

  const BookingScreen({super.key, required this.car});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final RentalService _rentalService = RentalService();
  final CarService _carService = CarService();

  late DateTime _startDate;
  late TimeOfDay _startTime;
  late DateTime _endDate;
  late TimeOfDay _endTime;

  // Delivery method state
  String _deliveryMethod = 'SELF_PICKUP'; // 'SELF_PICKUP' | 'DELIVERY'
  String _selectedZoneId = 'Q1';
  final TextEditingController _deliveryAddressController = TextEditingController();

  // Customer & KYC self-declaration controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _idCardController = TextEditingController();
  final TextEditingController _licenseController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  String _licenseClass = 'B2';
  DateTime? _declaredDob;
  DateTime? _declaredLicenseIssueDate;

  // 3 payment modes: 'CASH', 'VIETQR', 'FAST_HOLD'
  String _paymentMode = 'VIETQR';
  bool _isSubmitting = false;

  // Dynamic data from Backend
  RentalConditionModel? _condition;
  PricingPreviewModel? _pricingPreview;
  bool _isLoadingPreview = false;

  final List<String> _licenseClasses = ['B1_AUTO', 'B1', 'B2', 'C', 'D'];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _startDate = DateTime(now.year, now.month, now.day + 1);
    _startTime = const TimeOfDay(hour: 8, minute: 0);
    _endDate = DateTime(now.year, now.month, now.day + 3);
    _endTime = const TimeOfDay(hour: 20, minute: 0);

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      // Refresh user from /api/auth/me to get latest KYC status, DOB, license info
      await authProvider.checkAuthStatus();
      final user = authProvider.user;
      if (mounted && user != null) {
        setState(() {
          _nameController.text = user.fullName;
          _emailController.text = user.email;
          if (user.phoneNumber != null && user.phoneNumber!.isNotEmpty) {
            _phoneController.text = user.phoneNumber!;
          }
          if (user.dateOfBirth != null) {
            _declaredDob = user.dateOfBirth;
          }
          if (user.licenseIssueDate != null) {
            _declaredLicenseIssueDate = user.licenseIssueDate;
          }
          final userLic = user.effectiveLicenseClass;
          if (userLic != null && _licenseClasses.contains(userLic.toUpperCase())) {
            _licenseClass = userLic.toUpperCase();
          }
        });
      }
      _loadConditionAndPreview();
    });
  }

  Future<void> _loadConditionAndPreview() async {
    final cond = await _carService.getEffectiveCondition(widget.car.id);
    if (mounted) {
      setState(() => _condition = cond);
    }
    await _refreshPricingPreview();
  }

  Future<void> _refreshPricingPreview() async {
    if (!mounted) return;
    setState(() => _isLoadingPreview = true);
    final preview = await _carService.previewPricing(
      widget.car.id,
      _rentalDays,
      isHoliday: false,
      isVietQrPrepaid: _paymentMode == 'VIETQR',
      startTime: _startDate,
      customerEmail: _emailController.text.trim(),
    );
    if (mounted) {
      setState(() {
        _pricingPreview = preview;
        _isLoadingPreview = false;
      });
    }
  }

  @override
  void dispose() {
    _deliveryAddressController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _idCardController.dispose();
    _licenseController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  DateTime get _startDateTime {
    return DateTime(
      _startDate.year,
      _startDate.month,
      _startDate.day,
      _startTime.hour,
      _startTime.minute,
    );
  }

  DateTime get _endDateTime {
    return DateTime(
      _endDate.year,
      _endDate.month,
      _endDate.day,
      _endTime.hour,
      _endTime.minute,
    );
  }

  int get _rentalDays {
    final diffHours = _endDateTime.difference(_startDateTime).inHours;
    if (diffHours <= 0) return 1;
    return (diffHours / 24.0).ceil();
  }

  DeliveryZone get _selectedZone => getDeliveryZoneById(_selectedZoneId);

  String get _yardAddress => formatYardAddress(widget.car.pickupLocation);

  String get _resolvedLocation {
    if (_deliveryMethod == 'SELF_PICKUP') {
      return _yardAddress;
    }
    final detail = _deliveryAddressController.text.trim();
    if (detail.isEmpty) {
      return '${_selectedZone.label}, TP.HCM';
    }
    return '$detail, ${_selectedZone.label}, TP.HCM';
  }

  double get _estimatedDeliveryDistanceKm {
    return _deliveryMethod == 'DELIVERY' ? _selectedZone.estimatedKm : 0;
  }

  int _licenseRank(String cls) {
    switch (cls.toUpperCase()) {
      case 'B1_AUTO':
        return 1;
      case 'B1':
        return 2;
      case 'B2':
        return 3;
      case 'C':
        return 4;
      case 'D':
      case 'E':
        return 5;
      default:
        return 0;
    }
  }

  bool get _isLicenseIncompatible {
    if (_licenseClass == 'B1_AUTO' &&
        widget.car.transmission.toUpperCase() == 'MANUAL') {
      return true;
    }
    if ((_licenseClass == 'B1_AUTO' || _licenseClass == 'B1' || _licenseClass == 'B2') &&
        widget.car.seats > 9) {
      return true;
    }
    final reqClass = _condition?.requiredLicenseClass;
    if (reqClass != null && reqClass.isNotEmpty) {
      if (_licenseRank(_licenseClass) < _licenseRank(reqClass)) {
        return true;
      }
    }
    return false;
  }

  int? get _calculatedAge {
    if (_declaredDob == null) return null;
    final now = DateTime.now();
    int age = now.year - _declaredDob!.year;
    if (now.month < _declaredDob!.month ||
        (now.month == _declaredDob!.month && now.day < _declaredDob!.day)) {
      age--;
    }
    return age;
  }

  int? get _calculatedDrivingYears {
    if (_declaredLicenseIssueDate == null) return null;
    final now = DateTime.now();
    int years = now.year - _declaredLicenseIssueDate!.year;
    if (now.month < _declaredLicenseIssueDate!.month ||
        (now.month == _declaredLicenseIssueDate!.month &&
            now.day < _declaredLicenseIssueDate!.day)) {
      years--;
    }
    return years < 0 ? 0 : years;
  }

  String? get _conditionMismatchMessage {
    final minAge = _condition?.minAge ?? 21;
    final minYears = _condition?.requireDrivingYears ?? 1;

    final age = _calculatedAge;
    if (age != null && age < minAge) {
      return 'Tuổi của bạn ($age tuổi) chưa đạt yêu cầu tối thiểu $minAge tuổi của xe này.';
    }
    final yrs = _calculatedDrivingYears;
    if (yrs != null && yrs < minYears) {
      return 'Kinh nghiệm lái ($yrs năm) chưa đạt yêu cầu tối thiểu $minYears năm tính từ ngày cấp GPLX.';
    }
    return null;
  }

  bool _isKycBlocked(AuthProvider authProvider) {
    final requireKyc = _condition?.requireVerifiedKyc ?? false;
    final isVerified = authProvider.user?.isKycVerified ?? false;
    return requireKyc && !isVerified;
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final initial = isStart ? _startDate : _endDate;
    final first = isStart ? DateTime.now() : _startDate;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(first) ? first : initial,
      firstDate: first,
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate.isBefore(_startDate)) {
            _endDate = _startDate.add(const Duration(days: 1));
          }
        } else {
          _endDate = picked;
        }
      });
      _refreshPricingPreview();
    }
  }

  Future<void> _selectTime(BuildContext context, bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _startTime : _endTime,
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startTime = picked;
        } else {
          _endTime = picked;
        }
      });
      _refreshPricingPreview();
    }
  }

  Future<void> _selectDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _declaredDob ?? DateTime(now.year - 25, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime(now.year - 18, now.month, now.day),
    );
    if (picked != null) {
      setState(() => _declaredDob = picked);
    }
  }

  Future<void> _selectLicenseIssueDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _declaredLicenseIssueDate ?? DateTime(now.year - 2, 1, 1),
      firstDate: DateTime(1970),
      lastDate: now,
    );
    if (picked != null) {
      setState(() => _declaredLicenseIssueDate = picked);
    }
  }

  Future<void> _submitBooking(AuthProvider authProvider) async {
    if (!_formKey.currentState!.validate()) return;

    if (_isKycBlocked(authProvider)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Xe này bắt buộc xác minh KYC trước khi đặt.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_startDateTime.isAfter(_endDateTime) || _startDateTime == _endDateTime) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thời gian kết thúc phải sau thời gian bắt đầu!'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_deliveryMethod == 'DELIVERY' && _deliveryAddressController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập địa chỉ giao xe chi tiết.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_declaredDob == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn Ngày sinh để đối chiếu điều kiện thuê xe.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_declaredLicenseIssueDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn Ngày cấp GPLX để đối chiếu kinh nghiệm lái.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_isLicenseIncompatible) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Hạng bằng lái chưa đạt yêu cầu của xe này!'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    final mismatch = _conditionMismatchMessage;
    if (mismatch != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(mismatch),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final isFastHold = _paymentMode == 'FAST_HOLD';
      final bookingType = isFastHold ? 'FAST_HOLD' : 'STANDARD';
      final depositMethod = _paymentMode == 'CASH' ? 'CASH' : 'VIETQR';
      final holdDepositAmount = isFastHold ? 500000.0 : 0.0;

      final dto = CreateRentalRequestDto(
        carId: widget.car.id,
        startTime: _startDateTime,
        endTime: _endDateTime,
        pickupLocation: _resolvedLocation,
        dropoffLocation: _resolvedLocation,
        customerName: _nameController.text.trim(),
        customerPhone: _phoneController.text.trim(),
        customerEmail: _emailController.text.trim(),
        customerIdCard: _idCardController.text.trim(),
        driverLicenseNumber: _licenseController.text.trim(),
        driverLicenseClass: _licenseClass,
        declaredDob: _declaredDob,
        declaredLicenseClass: _licenseClass,
        declaredLicenseIssueDate: _declaredLicenseIssueDate,
        bookingType: bookingType,
        depositMethod: depositMethod,
        holdDepositAmount: holdDepositAmount,
        deliveryMethod: _deliveryMethod,
        estimatedDeliveryDistanceKm: _estimatedDeliveryDistanceKm,
        notes: _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : null,
      );

      final request = await _rentalService.createRentalRequest(dto);

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      if (isFastHold) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã tạo đơn giữ chỗ Fast Hold! Vui lòng chuyển khoản 500.000đ trong 4 giờ.'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => VietQrPaymentScreen(
              requestId: request.id,
              carName: widget.car.displayName,
              licensePlate: widget.car.licensePlate,
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã gửi yêu cầu đặt xe thành công! VELORA sẽ duyệt hồ sơ trong ít phút.'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => RentalOrderDetailScreen(request: request),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    final dateOnlyFormat = DateFormat('dd/MM/yyyy');

    final kycBlocked = _isKycBlocked(authProvider);
    final mismatchMsg = _conditionMismatchMessage;
    final canSubmit = !_isSubmitting && !_isLicenseIncompatible && !kycBlocked && mismatchMsg == null;

    // Pricing values from API preview (with safe local fallback while loading)
    final baseSubtotal = _pricingPreview?.baseSubtotal ?? (widget.car.dailyRate * _rentalDays);
    final longTermDiscountPct = _pricingPreview?.discountPercentage ?? 0.0;
    final longTermDiscountAmt = _pricingPreview?.discountAmount ?? 0.0;
    final vietQrDiscountPct = _pricingPreview?.vietQrDiscountPercentage ?? (_paymentMode == 'VIETQR' ? 5.0 : 0.0);
    final vietQrDiscountAmt = _pricingPreview?.vietQrDiscountAmount ??
        (_paymentMode == 'VIETQR' ? ((baseSubtotal - longTermDiscountAmt) * 0.05).roundToDouble() : 0.0);
    final finalRentalPrice = _pricingPreview?.rentalPrice ??
        (baseSubtotal - longTermDiscountAmt - vietQrDiscountAmt);

    final double payNowAmount;
    final String payNowLabel;
    if (_paymentMode == 'FAST_HOLD') {
      payNowAmount = 500000;
      payNowLabel = 'Cọc giữ chỗ ngay (Fast Hold 4h)';
    } else if (_paymentMode == 'CASH') {
      payNowAmount = 0;
      payNowLabel = 'Thanh toán ngay lúc này';
    } else {
      payNowAmount = finalRentalPrice + widget.car.depositAmount;
      payNowLabel = 'Dự kiến thanh toán sau khi duyệt';
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đặt thuê xe tự lái'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Vehicle Summary Card
              _buildVehicleBanner(),
              const SizedBox(height: 16),

              // KYC Mandatory Gate Banner (Lọc 2 lớp)
              if (kycBlocked)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFF59E0B)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.lock_person_rounded, color: Color(0xFFFBBF24), size: 22),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Xe này bắt buộc xác minh KYC trước khi đặt',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFFDE68A),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Trạng thái tài khoản hiện tại: ${authProvider.user?.kycStatusDisplayName ?? 'Chưa xác minh KYC'}. Vui lòng hoàn tất xác minh CCCD & GPLX trong mục Tài khoản để đặt dòng xe này.',
                        style: const TextStyle(fontSize: 11, color: Color(0xFFFCD34D), height: 1.4),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFFDE68A),
                            side: const BorderSide(color: Color(0xFFF59E0B)),
                          ),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const ProfileScreen()),
                            ).then((_) => authProvider.checkAuthStatus());
                          },
                          icon: const Icon(Icons.verified_user_outlined, size: 18),
                          label: const Text('Đi tới màn hình xác minh KYC', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ),

              // License / Condition Incompatibility Warning
              if (_isLicenseIncompatible || mismatchMsg != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFEF4444)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 26),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _isLicenseIncompatible
                              ? 'Hạng GPLX $_licenseClass chưa đáp ứng yêu cầu tối thiểu (hạng ${_condition?.requiredLicenseClass ?? (widget.car.transmission.toUpperCase() == 'MANUAL' ? 'B2' : 'B1')}) của xe này.'
                              : mismatchMsg!,
                          style: const TextStyle(fontSize: 12, color: Color(0xFFFCA5A5), fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),

              // Section 1: Rental Schedule & Dates
              _buildSectionTitle('1. Lịch trình thuê xe', Icons.event_available_rounded),
              const SizedBox(height: 12),
              _buildDateTimeCard(),
              const SizedBox(height: 20),

              // Section 2: Pickup / Delivery Method
              _buildSectionTitle('2. Hình thức & Địa điểm nhận xe', Icons.location_on_outlined),
              const SizedBox(height: 12),
              _buildDeliveryMethodSection(),
              const SizedBox(height: 20),

              // Section 3: Customer & License Verification (Lọc 2 lớp)
              _buildSectionTitle('3. Giấy tờ lái xe & Định danh', Icons.badge_outlined),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Họ và tên người thuê (theo CCCD)',
                  prefixIcon: Icon(Icons.person_outline_rounded, size: 20),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Vui lòng nhập họ tên' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Số điện thoại',
                        prefixIcon: Icon(Icons.phone_outlined, size: 20),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Vui lòng nhập SĐT' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _idCardController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Số CCCD/CMND',
                        prefixIcon: Icon(Icons.credit_card_rounded, size: 20),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Vui lòng nhập CCCD' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      controller: _licenseController,
                      decoration: const InputDecoration(
                        labelText: 'Số Giấy phép lái xe (GPLX)',
                        prefixIcon: Icon(Icons.car_crash_outlined, size: 20),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Vui lòng nhập số GPLX' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: DropdownButtonFormField<String>(
                      initialValue: _licenseClass,
                      decoration: const InputDecoration(
                        labelText: 'Hạng GPLX',
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 14),
                      ),
                      items: _licenseClasses.map((cls) {
                        return DropdownMenuItem(value: cls, child: Text(cls));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _licenseClass = val);
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Declared DOB & License Issue Date Pickers
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: _selectDob,
                      borderRadius: BorderRadius.circular(12),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Ngày sinh *',
                          prefixIcon: Icon(Icons.cake_outlined, size: 18),
                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                        ),
                        child: Text(
                          _declaredDob != null ? dateOnlyFormat.format(_declaredDob!) : 'Chọn ngày sinh',
                          style: TextStyle(
                            fontSize: 13,
                            color: _declaredDob != null ? Colors.white : const Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: _selectLicenseIssueDate,
                      borderRadius: BorderRadius.circular(12),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Ngày cấp GPLX *',
                          prefixIcon: Icon(Icons.event_note_rounded, size: 18),
                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                        ),
                        child: Text(
                          _declaredLicenseIssueDate != null
                              ? dateOnlyFormat.format(_declaredLicenseIssueDate!)
                              : 'Chọn ngày cấp',
                          style: TextStyle(
                            fontSize: 13,
                            color: _declaredLicenseIssueDate != null ? Colors.white : const Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Section 4: Deposit Method Selector (3 Modes)
              _buildSectionTitle('4. Phương thức đặt cọc thế chân', Icons.payments_rounded),
              const SizedBox(height: 12),
              _buildDepositModeSelector(),
              const SizedBox(height: 20),

              // Section 5: Cost Calculation Breakdown (Synced with pricing-preview API)
              _buildSectionTitle('5. Bảng kê dự toán chi phí', Icons.receipt_long_rounded),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: Column(
                  children: [
                    if (_isLoadingPreview)
                      const Padding(
                        padding: EdgeInsets.only(bottom: 10),
                        child: LinearProgressIndicator(minHeight: 2),
                      ),
                    _buildCostRow(
                      'Giá thuê gốc (${widget.car.formattedDailyRate} × $_rentalDays ngày)',
                      currencyFormatter.format(baseSubtotal),
                    ),
                    if (longTermDiscountAmt > 0) ...[
                      const SizedBox(height: 8),
                      _buildCostRow(
                        'Chiết khấu thuê dài ngày (-${longTermDiscountPct.toStringAsFixed(0)}%)',
                        '-${currencyFormatter.format(longTermDiscountAmt)}',
                        isHighlight: true,
                      ),
                    ],
                    if ((_pricingPreview?.vipEarlyBookingDiscountAmount ?? 0) > 0) ...[
                      const SizedBox(height: 8),
                      _buildCostRow(
                        _pricingPreview!.vipEarlyBookingNote ??
                            'Ưu đãi Hội viên ${_pricingPreview!.membershipTier} (-${_pricingPreview!.vipEarlyBookingDiscountPercentage.toStringAsFixed(0)}%)',
                        '-${currencyFormatter.format(_pricingPreview!.vipEarlyBookingDiscountAmount)}',
                        isHighlight: true,
                      ),
                    ],
                    if (_paymentMode == 'VIETQR' && vietQrDiscountAmt > 0) ...[
                      const SizedBox(height: 8),
                      _buildCostRow(
                        'Ưu đãi chuyển khoản VietQR (-${vietQrDiscountPct.toStringAsFixed(0)}%)',
                        '-${currencyFormatter.format(vietQrDiscountAmt)}',
                        isHighlight: true,
                      ),
                    ],
                    const SizedBox(height: 8),
                    _buildCostRow(
                      'Tổng tiền thuê xe dự kiến',
                      currencyFormatter.format(finalRentalPrice),
                    ),
                    const SizedBox(height: 8),
                    _buildCostRow(
                      _paymentMode == 'CASH'
                          ? 'Tiền cọc thế chân (Nộp khi nhận xe)'
                          : (_paymentMode == 'FAST_HOLD'
                              ? 'Tiền cọc thế chân (Đã trừ 500k giữ chỗ khi nộp)'
                              : 'Tiền cọc thế chân (Hoàn 2 đợt Escrow)'),
                      currencyFormatter.format(widget.car.depositAmount),
                      isHighlight: true,
                    ),
                    if (_deliveryMethod == 'DELIVERY') ...[
                      const SizedBox(height: 8),
                      _buildCostRow(
                        'Khoảng cách giao xe ước tính',
                        '~${_estimatedDeliveryDistanceKm.toStringAsFixed(0)} km (${_selectedZone.label})',
                      ),
                    ],
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            payNowLabel,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                        Text(
                          currencyFormatter.format(payNowAmount),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: _paymentMode == 'FAST_HOLD'
                                ? const Color(0xFFF59E0B)
                                : (_paymentMode == 'CASH'
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFF2563EB)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Submit Button (Aligned with 10-step workflow)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: canSubmit ? () => _submitBooking(authProvider) : null,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: !canSubmit
                        ? Colors.grey
                        : (_paymentMode == 'FAST_HOLD'
                            ? const Color(0xFFD97706)
                            : const Color(0xFF2563EB)),
                  ),
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Icon(_paymentMode == 'FAST_HOLD'
                          ? Icons.bolt_rounded
                          : Icons.send_rounded),
                  label: Text(
                    _isSubmitting
                        ? 'Đang gửi yêu cầu...'
                        : (_paymentMode == 'FAST_HOLD'
                            ? 'Giữ xe ngay 500k'
                            : 'Gửi yêu cầu đặt xe'),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDeliveryMethodSection() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: _buildDeliveryChoiceChip(
                  title: 'Nhận tại bãi',
                  subtitle: 'Miễn phí • 0 km',
                  icon: Icons.storefront_rounded,
                  selected: _deliveryMethod == 'SELF_PICKUP',
                  onTap: () => setState(() => _deliveryMethod = 'SELF_PICKUP'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildDeliveryChoiceChip(
                  title: 'Giao xe tận nơi',
                  subtitle: 'TP.HCM & Sân bay',
                  icon: Icons.local_shipping_outlined,
                  selected: _deliveryMethod == 'DELIVERY',
                  onTap: () => setState(() => _deliveryMethod = 'DELIVERY'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (_deliveryMethod == 'SELF_PICKUP')
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.pin_drop_rounded, color: Color(0xFF10B981), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Địa chỉ bãi xe VELORA',
                          style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _yardAddress,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          else ...[
            DropdownButtonFormField<String>(
              initialValue: _selectedZoneId,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Quận / Huyện TP.HCM & Sân bay',
                prefixIcon: Icon(Icons.map_outlined, size: 18),
              ),
              items: hcmcDeliveryZones.map((zone) {
                return DropdownMenuItem<String>(
                  value: zone.id,
                  child: Text(
                    '${zone.label} (~${zone.estimatedKm.toStringAsFixed(0)} km)',
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13),
                  ),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _selectedZoneId = val);
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _deliveryAddressController,
              decoration: const InputDecoration(
                labelText: 'Số nhà, tên đường, tòa nhà / sảnh đón *',
                prefixIcon: Icon(Icons.home_outlined, size: 18),
              ),
              validator: (v) {
                if (_deliveryMethod == 'DELIVERY' && (v == null || v.trim().isEmpty)) {
                  return 'Vui lòng nhập địa chỉ giao xe chi tiết';
                }
                return null;
              },
            ),
            const SizedBox(height: 8),
            Text(
              'Khoảng cách ước tính từ bãi VELORA: ~${_selectedZone.estimatedKm.toStringAsFixed(0)} km (dùng để kiểm soát ODO giao xe).',
              style: const TextStyle(fontSize: 11, color: Color(0xFF60A5FA)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDeliveryChoiceChip({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF2563EB).withValues(alpha: 0.18)
              : const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? const Color(0xFF3B82F6) : Colors.white.withValues(alpha: 0.1),
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: selected ? const Color(0xFF60A5FA) : const Color(0xFF94A3B8)),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: selected ? Colors.white : const Color(0xFFCBD5E1),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDepositModeSelector() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          _buildDepositOptionCard(
            mode: 'VIETQR',
            title: 'Chuyển khoản VietQR',
            badgeText: 'GIẢM 5%',
            badgeColor: const Color(0xFF2563EB),
            activeColor: const Color(0xFF2563EB),
            description: 'Giảm ngay 5% tiền thuê + tặng 50km/ngày và miễn phí rửa xe khi trả.',
          ),
          const SizedBox(height: 10),
          _buildDepositOptionCard(
            mode: 'FAST_HOLD',
            title: 'Giữ chỗ siêu tốc 500k (Fast Hold 4h)',
            badgeText: 'KHÓA XE NGAY',
            badgeColor: const Color(0xFFD97706),
            activeColor: const Color(0xFFF59E0B),
            description: 'Chuyển trước 500.000đ qua VietQR để giữ xe độc quyền trong 4 giờ (trừ vào tiền cọc khi ký HĐ).',
          ),
          const SizedBox(height: 10),
          _buildDepositOptionCard(
            mode: 'CASH',
            title: 'Cọc tiền mặt khi nhận xe',
            badgeText: 'TRẢ SAU',
            badgeColor: const Color(0xFF10B981),
            activeColor: const Color(0xFF10B981),
            description: 'Không cần trả trước hôm nay. Quý khách nộp cọc thế chân trực tiếp khi nhận bàn giao xe.',
          ),
        ],
      ),
    );
  }

  Widget _buildDepositOptionCard({
    required String mode,
    required String title,
    required String badgeText,
    required Color badgeColor,
    required Color activeColor,
    required String description,
  }) {
    final isSelected = _paymentMode == mode;
    return InkWell(
      onTap: () {
        setState(() => _paymentMode = mode);
        _refreshPricingPreview();
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withValues(alpha: 0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? activeColor : Colors.white.withValues(alpha: 0.1),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? activeColor : const Color(0xFF94A3B8),
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: badgeColor,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          badgeText,
                          style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    description,
                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8), height: 1.35),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVehicleBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2563EB).withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(12),
            ),
            child: widget.car.imageUrl != null && widget.car.imageUrl!.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(widget.car.imageUrl!, fit: BoxFit.cover),
                  )
                : const Icon(Icons.directions_car_filled_rounded, color: Color(0xFF2563EB), size: 36),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.car.displayName,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Biển số: ${widget.car.licensePlate} • ${widget.car.seats} chỗ • ${widget.car.transmissionDisplayName}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 4),
                Text(
                  widget.car.formattedDailyRate,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateTimeCard() {
    final dateFormat = DateFormat('dd/MM/yyyy');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildPickerTile(
                  label: 'Bắt đầu thuê',
                  dateStr: dateFormat.format(_startDate),
                  timeStr: _startTime.format(context),
                  onDateTap: () => _selectDate(context, true),
                  onTimeTap: () => _selectTime(context, true),
                ),
              ),
              Container(width: 1, height: 60, color: Colors.white.withValues(alpha: 0.1)),
              Expanded(
                child: _buildPickerTile(
                  label: 'Kết thúc thuê',
                  dateStr: dateFormat.format(_endDate),
                  timeStr: _endTime.format(context),
                  onDateTap: () => _selectDate(context, false),
                  onTimeTap: () => _selectTime(context, false),
                ),
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.timer_outlined, size: 16, color: Color(0xFF2563EB)),
              const SizedBox(width: 6),
              Text(
                'Tổng thời gian thuê: $_rentalDays ngày',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF60A5FA)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPickerTile({
    required String label,
    required String dateStr,
    required String timeStr,
    required VoidCallback onDateTap,
    required VoidCallback onTimeTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
          const SizedBox(height: 6),
          InkWell(
            onTap: onDateTap,
            child: Row(
              children: [
                const Icon(Icons.calendar_month_rounded, size: 16, color: Color(0xFF2563EB)),
                const SizedBox(width: 6),
                Text(dateStr, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 6),
          InkWell(
            onTap: onTimeTap,
            child: Row(
              children: [
                const Icon(Icons.access_time_rounded, size: 16, color: Color(0xFF10B981)),
                const SizedBox(width: 6),
                Text(timeStr, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: const Color(0xFF2563EB)),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildCostRow(String title, String amount, {bool isHighlight = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          amount,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: isHighlight ? const Color(0xFFF59E0B) : Colors.white,
          ),
        ),
      ],
    );
  }
}
