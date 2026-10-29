import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/car_model.dart';
import '../../models/rental_request_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/rental_service.dart';
import '../contract/contract_sign_screen.dart';

class BookingScreen extends StatefulWidget {
  final CarModel car;

  const BookingScreen({super.key, required this.car});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final RentalService _rentalService = RentalService();

  late DateTime _startDate;
  late TimeOfDay _startTime;
  late DateTime _endDate;
  late TimeOfDay _endTime;

  final TextEditingController _pickupController = TextEditingController();
  final TextEditingController _dropoffController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _idCardController = TextEditingController();
  final TextEditingController _licenseController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  String _licenseClass = 'B2';
  bool _isSubmitting = false;

  final List<String> _licenseClasses = ['B1_AUTO', 'B1', 'B2', 'C', 'D'];

  @override
  void initState() {
    super.initState();
    // Default: Start tomorrow 08:00, End in 3 days 20:00
    final now = DateTime.now();
    _startDate = DateTime(now.year, now.month, now.day + 1);
    _startTime = const TimeOfDay(hour: 8, minute: 0);
    _endDate = DateTime(now.year, now.month, now.day + 3);
    _endTime = const TimeOfDay(hour: 20, minute: 0);

    final defaultLocation = widget.car.pickupLocation?.isNotEmpty == true
        ? widget.car.pickupLocation!
        : 'Bãi xe Trung tâm VELORA (Quận 1, TP.HCM)';
    _pickupController.text = defaultLocation;
    _dropoffController.text = defaultLocation;

    // Pre-fill user information
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user != null) {
        setState(() {
          _nameController.text = user.fullName;
          _emailController.text = user.email;
          _phoneController.text = user.phoneNumber ?? '0901234567';
          _idCardController.text = '079201004567';
          _licenseController.text = 'GPLX-79123456';
        });
      }
    });
  }

  @override
  void dispose() {
    _pickupController.dispose();
    _dropoffController.dispose();
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

  double get _estimatedRentalFee {
    return widget.car.dailyRate * _rentalDays;
  }

  double get _totalInitialPayment {
    return _estimatedRentalFee + widget.car.depositAmount;
  }

  bool get _isLicenseIncompatible {
    // B1_AUTO cannot drive MANUAL
    if (_licenseClass == 'B1_AUTO' &&
        widget.car.transmission.toUpperCase() == 'MANUAL') {
      return true;
    }
    // B1/B2 cannot drive > 9 seats
    if ((_licenseClass == 'B1_AUTO' || _licenseClass == 'B1' || _licenseClass == 'B2') &&
        widget.car.seats > 9) {
      return true;
    }
    return false;
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
    }
  }

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate()) return;

    if (_startDateTime.isAfter(_endDateTime) || _startDateTime == _endDateTime) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thời gian kết thúc phải sau thời gian bắt đầu!'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_isLicenseIncompatible) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Hạng bằng lái không phù hợp với loại phương tiện!'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final dto = CreateRentalRequestDto(
        carId: widget.car.id,
        startTime: _startDateTime,
        endTime: _endDateTime,
        pickupLocation: _pickupController.text.trim(),
        dropoffLocation: _dropoffController.text.trim(),
        customerName: _nameController.text.trim(),
        customerPhone: _phoneController.text.trim(),
        customerEmail: _emailController.text.trim(),
        customerIdCard: _idCardController.text.trim(),
        driverLicenseNumber: _licenseController.text.trim(),
        driverLicenseClass: _licenseClass,
        notes: _notesController.text.trim(),
      );

      final request = await _rentalService.createRentalRequest(dto);

      // Fetch or generate legal contract
      final contract = await _rentalService.getOrCreateContractByRequestId(request.id);

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      // Navigate to Contract Sign Screen
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ContractSignScreen(contract: contract),
        ),
      );
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
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

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
              const SizedBox(height: 20),

              // License Incompatibility Warning Alert
              if (_isLicenseIncompatible)
                Container(
                  margin: const EdgeInsets.only(bottom: 20),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFEF4444)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Cảnh báo: Xe này là số sàn (${widget.car.transmissionDisplayName}). GPLX hạng $_licenseClass không được phép điều khiển theo quy định pháp luật.',
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

              // Section 2: Pickup & Dropoff Locations
              _buildSectionTitle('2. Địa điểm nhận & trả xe', Icons.location_on_outlined),
              const SizedBox(height: 12),
              TextFormField(
                controller: _pickupController,
                decoration: const InputDecoration(
                  labelText: 'Địa điểm nhận xe',
                  prefixIcon: Icon(Icons.pin_drop_rounded, size: 20),
                ),
                validator: (v) => v == null || v.isEmpty ? 'Vui lòng nhập địa điểm nhận xe' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _dropoffController,
                decoration: const InputDecoration(
                  labelText: 'Địa điểm trả xe',
                  prefixIcon: Icon(Icons.flag_rounded, size: 20),
                ),
                validator: (v) => v == null || v.isEmpty ? 'Vui lòng nhập địa điểm trả xe' : null,
              ),
              const SizedBox(height: 20),

              // Section 3: Customer & License Verification
              _buildSectionTitle('3. Giấy tờ lái xe & Định danh', Icons.badge_outlined),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Họ và tên người thuê (theo CCCD)',
                  prefixIcon: Icon(Icons.person_outline_rounded, size: 20),
                ),
                validator: (v) => v == null || v.isEmpty ? 'Vui lòng nhập họ tên' : null,
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
                      validator: (v) => v == null || v.isEmpty ? 'Vui lòng nhập SĐT' : null,
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
                      validator: (v) => v == null || v.isEmpty ? 'Vui lòng nhập CCCD' : null,
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
                      validator: (v) => v == null || v.isEmpty ? 'Vui lòng nhập số GPLX' : null,
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
              const SizedBox(height: 20),

              // Section 4: Cost Calculation Breakdown
              _buildSectionTitle('4. Bảng kê dự toán chi phí', Icons.receipt_long_rounded),
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
                    _buildCostRow(
                      'Tiền thuê xe (${widget.car.formattedDailyRate} × $_rentalDays ngày)',
                      currencyFormatter.format(_estimatedRentalFee),
                    ),
                    const SizedBox(height: 8),
                    _buildCostRow(
                      'Tiền cọc bảo đảm hoàn trả (Escrow)',
                      currencyFormatter.format(widget.car.depositAmount),
                      isHighlight: true,
                    ),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Tổng thanh toán cọc ban đầu',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          currencyFormatter.format(_totalInitialPayment),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2563EB),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Submit & Proceed Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting || _isLicenseIncompatible ? null : _submitBooking,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: _isLicenseIncompatible ? Colors.grey : const Color(0xFF2563EB),
                  ),
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.draw_rounded),
                  label: Text(
                    _isSubmitting ? 'Đang tạo đơn thuê...' : 'Xác nhận & Ký Hợp Đồng Cảm Ứng',
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
            style: TextStyle(
              fontSize: 12,
              color: isHighlight ? const Color(0xFFF59E0B) : const Color(0xFFCBD5E1),
              fontWeight: isHighlight ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
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
