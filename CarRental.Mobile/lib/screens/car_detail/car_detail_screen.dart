import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/car_model.dart';
import '../../models/pricing_policy_model.dart';
import '../../models/rental_condition_model.dart';
import '../../services/car_service.dart';
import '../booking/booking_screen.dart';

class CarDetailScreen extends StatefulWidget {
  final CarModel car;

  const CarDetailScreen({super.key, required this.car});

  @override
  State<CarDetailScreen> createState() => _CarDetailScreenState();
}

class _CarDetailScreenState extends State<CarDetailScreen> {
  final CarService _carService = CarService();

  RentalConditionModel? _condition;
  List<PricingPolicyModel> _policies = [];
  bool _isLoadingExtras = true;

  CarModel get car => widget.car;

  @override
  void initState() {
    super.initState();
    _loadVehicleDetails();
  }

  Future<void> _loadVehicleDetails() async {
    setState(() => _isLoadingExtras = true);
    try {
      final results = await Future.wait([
        _carService.getEffectiveCondition(car.id),
        _carService.getPricingPolicies(car.id),
      ]);
      if (!mounted) return;
      setState(() {
        _condition = results[0] as RentalConditionModel?;
        _policies = results[1] as List<PricingPolicyModel>;
        _isLoadingExtras = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingExtras = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isElectric = car.isElectric;
    final condition = _condition;
    final minAge = condition?.minAge ?? car.rentalConditionMinAge ?? 21;
    final drivingYears =
        condition?.requireDrivingYears ?? car.rentalConditionRequireDrivingYears ?? 1;
    final requiredLicense = condition?.requiredLicenseClass ??
        (car.transmission.toUpperCase() == 'MANUAL' ? 'B2' : 'B1');
    final minCompletedTrips = condition?.minCompletedTrips ?? 0;
    final requireVerifiedKyc = condition?.requireVerifiedKyc ?? false;
    final isCustomCondition = condition?.isCustom ?? car.hasRentalCondition;
    final extraKmFormatted = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ')
        .format(car.extraKmRate != null && car.extraKmRate! > 0 ? car.extraKmRate! : 5000);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar with Vehicle Image Header
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: _buildHeaderImage(),
            ),
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),

          // Vehicle Detail Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Status Row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              car.displayName,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.6),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                                  ),
                                  child: Text(
                                    car.licensePlate,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    car.pickupLocation ?? 'Bãi xe Trung tâm VELORA',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: car.statusColor.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: car.statusColor),
                        ),
                        child: Text(
                          car.statusDisplayName,
                          style: TextStyle(
                            color: car.statusColor,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Pricing & Deposit Overview Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF2563EB).withValues(alpha: 0.2),
                          const Color(0xFF1E293B),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF2563EB).withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Giá thuê mỗi ngày', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                            const SizedBox(height: 4),
                            Text(
                              car.formattedDailyRate,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF2563EB),
                              ),
                            ),
                          ],
                        ),
                        Container(width: 1, height: 40, color: Colors.white.withValues(alpha: 0.1)),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Tiền cọc bảo đảm', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                            const SizedBox(height: 4),
                            Text(
                              car.formattedDeposit,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFF59E0B),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Specifications Section
                  const Text(
                    'Thông số kỹ thuật',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 2.7,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    children: [
                      _buildSpecItem(Icons.airline_seat_recline_normal_rounded, 'Số chỗ ngồi', '${car.seats} chỗ'),
                      _buildSpecItem(Icons.settings_outlined, 'Hộp số', car.transmissionDisplayName),
                      _buildSpecItem(
                        isElectric ? Icons.battery_charging_full_rounded : Icons.local_gas_station_outlined,
                        isElectric ? 'Động cơ / Pin' : 'Nhiên liệu',
                        car.fuelDisplayName,
                      ),
                      _buildSpecItem(Icons.calendar_today_outlined, 'Năm sản xuất', '${car.manufactureYear}'),
                      _buildSpecItem(Icons.speed_rounded, 'Số km hiện tại (ODO)', '${car.currentMileage} km'),
                      _buildSpecItem(
                        Icons.social_distance_rounded,
                        'Giới hạn di chuyển',
                        car.mileageLimit != null ? '${car.mileageLimit} km/ngày' : 'Không giới hạn',
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Promotions & Long-Term Discount Section
                  const Text(
                    'Ưu đãi & Chiết khấu thuê xe',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF1D4ED8).withValues(alpha: 0.28),
                          const Color(0xFF1E293B),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.45)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.qr_code_2_rounded, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'Ưu đãi trả trước VietQR',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                  SizedBox(width: 8),
                                  Badge(
                                    label: Text('GIẢM 5%', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                                    backgroundColor: Color(0xFF2563EB),
                                  ),
                                ],
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Giảm trực tiếp 5% tiền thuê khi chọn chuyển khoản VietQR + tặng thêm 50km/ngày & miễn phí rửa xe khi hoàn trả.',
                                style: TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), height: 1.4),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_policies.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Chiết khấu thuê dài ngày',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _policies.map((p) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981).withValues(alpha: 0.14),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
                                ),
                                child: Text(
                                  'Từ ${p.minDays} ngày: -${p.discountPercentage.toStringAsFixed(0)}%'
                                  '${p.holidaySurcharge > 0 ? ' (Lễ +${p.holidaySurcharge.toStringAsFixed(0)}%)' : ''}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF34D399),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // Rental Conditions & Escrow Policy (Dynamic from Effective Condition API)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Text(
                          'Điều kiện thuê & Chính sách cọc',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isCustomCondition
                              ? const Color(0xFF10B981).withValues(alpha: 0.18)
                              : const Color(0xFF0EA5E9).withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isCustomCondition
                                ? const Color(0xFF10B981)
                                : const Color(0xFF38BDF8),
                          ),
                        ),
                        child: Text(
                          isCustomCondition ? 'Yêu cầu riêng cho xe này' : 'Chuẩn mặc định VELORA',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isCustomCondition
                                ? const Color(0xFF34D399)
                                : const Color(0xFF38BDF8),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (_isLoadingExtras)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                    )
                  else ...[
                    if (requireVerifiedKyc)
                      Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.16),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFF59E0B)),
                        ),
                        child: const Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.lock_person_rounded, size: 20, color: Color(0xFFFBBF24)),
                            SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Bắt buộc xác minh KYC trước khi đặt',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFFFDE68A),
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Tài khoản cần được VELORA duyệt CCCD & GPLX thành công trước khi gửi yêu cầu thuê dòng xe này.',
                                    style: TextStyle(fontSize: 11, color: Color(0xFFFCD34D)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                    _buildPolicyTile(
                      Icons.badge_outlined,
                      'Độ tuổi, GPLX & Lịch sử thuê',
                      'Từ $minAge tuổi trở lên • Kinh nghiệm lái tối thiểu $drivingYears năm • Bằng lái tối thiểu hạng $requiredLicense'
                          '${minCompletedTrips > 0 ? ' • Tối thiểu $minCompletedTrips chuyến hoàn tất' : ''}.',
                    ),
                    if (condition?.otherConditions != null &&
                        condition!.otherConditions!.trim().isNotEmpty)
                      _buildPolicyTile(
                        Icons.info_outline_rounded,
                        'Lưu ý riêng của xe',
                        condition.otherConditions!.trim(),
                      ),
                    _buildPolicyTile(
                      Icons.security_rounded,
                      'Quy trình hoàn cọc 2 Đợt (Escrow)',
                      'Đợt 1 hoàn cọc dư ngay sau khi chốt quyết toán trả xe; Đợt 2 tạm giữ 2.000.000đ đối soát phạt nguội và hoàn lại sau 15–30 ngày.',
                    ),
                    _buildPolicyTile(
                      isElectric ? Icons.battery_charging_full_rounded : Icons.local_gas_station_outlined,
                      isElectric ? 'Chính sách pin (%) & Phụ phí' : 'Chính sách nhiên liệu & Phụ phí',
                      isElectric
                          ? 'Trả xe cùng mức pin (%) lúc bàn giao (dung sai miễn phạt 3% tính theo mốc thực tế lúc giao). Phí vượt hạn mức km: $extraKmFormatted/km. Phí vệ sinh 200.000đ nếu khoang xe bẩn/có mùi.'
                          : 'Trả xe cùng mức vạch nhiên liệu lúc bàn giao (dung sai miễn phạt 3% tính theo mốc thực tế lúc giao). Phí vượt hạn mức km: $extraKmFormatted/km. Phí vệ sinh 200.000đ nếu khoang xe bẩn/có mùi.',
                    ),
                  ],
                  const SizedBox(height: 90),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.4),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Đơn giá tiêu chuẩn', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    Text(
                      car.formattedDailyRate,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: car.isReady
                      ? () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => BookingScreen(car: car),
                            ),
                          );
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: car.isReady ? const Color(0xFF2563EB) : Colors.grey,
                  ),
                  icon: const Icon(Icons.car_rental_rounded),
                  label: Text(car.isReady ? 'Đặt xe ngay' : 'Xe chưa sẵn sàng'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderImage() {
    if (car.imageUrl != null && car.imageUrl!.trim().isNotEmpty) {
      return Image.network(
        car.imageUrl!,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildPlaceholderHeader(),
      );
    }
    return _buildPlaceholderHeader();
  }

  Widget _buildPlaceholderHeader() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF2563EB), Color(0xFF0F172A)],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 40),
            Icon(
              Icons.directions_car_filled_rounded,
              size: 80,
              color: Colors.white.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 8),
            Text(
              car.displayName.toUpperCase(),
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecItem(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF2563EB)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                Text(
                  value,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyTile(IconData icon, String title, String description) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: const Color(0xFF10B981)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 3),
                Text(description, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
