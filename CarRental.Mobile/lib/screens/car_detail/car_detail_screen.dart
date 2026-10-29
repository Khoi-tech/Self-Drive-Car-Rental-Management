import 'package:flutter/material.dart';
import '../../models/car_model.dart';
import '../booking/booking_screen.dart';

class CarDetailScreen extends StatelessWidget {
  final CarModel car;

  const CarDetailScreen({super.key, required this.car});

  @override
  Widget build(BuildContext context) {
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
                                Text(
                                  car.pickupLocation ?? 'Bãi xe Trung tâm VELORA',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
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
                    childAspectRatio: 2.8,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    children: [
                      _buildSpecItem(Icons.airline_seat_recline_normal_rounded, 'Số chỗ ngồi', '${car.seats} chỗ'),
                      _buildSpecItem(Icons.settings_outlined, 'Hộp số', car.transmissionDisplayName),
                      _buildSpecItem(Icons.local_gas_station_outlined, 'Nhiên liệu', car.fuelDisplayName),
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

                  // Rental Conditions & Escrow Policy
                  const Text(
                    'Điều kiện thuê & Chính sách cọc',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  _buildPolicyTile(
                    Icons.badge_outlined,
                    'Giấy phép lái xe hợp lệ',
                    'Yêu cầu bằng lái xe ô tô hạng B1/B2 còn hạn sử dụng tối thiểu 1 năm.',
                  ),
                  _buildPolicyTile(
                    Icons.security_rounded,
                    'Quy trình hoàn cọc 2 Đợt (Escrow)',
                    'Đợt 1 hoàn trả ngay sau khi kết thúc bàn giao xe. Đợt 2 đối soát vi phạm CSGT sau 15-30 ngày.',
                  ),
                  _buildPolicyTile(
                    Icons.cleaning_services_outlined,
                    'Chính sách vệ sinh & nhiên liệu',
                    'Phí vệ sinh tiêu chuẩn 200.000đ nếu xe bẩn. Bàn giao xăng theo mức xăng ban đầu (Same-level).',
                  ),
                  const SizedBox(height: 80),
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
                    const Text('Tổng phí ước tính', style: TextStyle(fontSize: 11, color: Colors.grey)),
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
                const SizedBox(height: 2),
                Text(description, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
