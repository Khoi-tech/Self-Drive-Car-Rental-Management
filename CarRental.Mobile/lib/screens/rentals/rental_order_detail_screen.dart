import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/rental_request_model.dart';
import '../../models/settlement_model.dart';
import '../../services/rental_service.dart';
import '../../services/settlement_service.dart';
import '../contract/contract_sign_screen.dart';
import '../payment/vietqr_payment_screen.dart';

class RentalOrderDetailScreen extends StatefulWidget {
  final RentalRequestModel request;

  const RentalOrderDetailScreen({super.key, required this.request});

  @override
  State<RentalOrderDetailScreen> createState() => _RentalOrderDetailScreenState();
}

class _RentalOrderDetailScreenState extends State<RentalOrderDetailScreen> {
  final RentalService _rentalService = RentalService();
  final SettlementService _settlementService = SettlementService();

  SettlementModel? _settlement;
  bool _isLoadingSettlement = false;
  bool _isNavigating = false;

  @override
  void initState() {
    super.initState();
    _loadSettlement();
  }

  Future<void> _loadSettlement() async {
    setState(() => _isLoadingSettlement = true);
    final settlement = await _settlementService.getSettlementByRequestId(widget.request.id);
    if (mounted) {
      setState(() {
        _settlement = settlement;
        _isLoadingSettlement = false;
      });
    }
  }

  Future<void> _openContractScreen() async {
    setState(() => _isNavigating = true);
    try {
      final contract = await _rentalService.getOrCreateContractByRequestId(widget.request.id);
      if (!mounted) return;
      setState(() => _isNavigating = false);
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ContractSignScreen(contract: contract)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isNavigating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  void _openPaymentScreen() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => VietQrPaymentScreen(
          requestId: widget.request.id,
          carName: widget.request.carDisplayName,
          licensePlate: widget.request.carLicensePlate ?? '',
        ),
      ),
    );
  }

  void _showDisputeDialog() {
    if (_settlement == null) return;
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.report_problem_rounded, color: Color(0xFFF59E0B)),
            SizedBox(width: 8),
            Text('Gửi Khiếu Nại Quyết Toán'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Nếu bạn không đồng ý với các khoản khấu trừ phụ phí (vệ sinh, nhiên liệu, vết xước), vui lòng nhập lý do để Hội đồng quản trị xem xét:',
              style: TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Nhập chi tiết khiếu nại của bạn...',
                contentPadding: EdgeInsets.all(12),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B)),
            onPressed: () async {
              final reason = reasonController.text.trim();
              if (reason.isEmpty) return;
              Navigator.of(ctx).pop();

              final res = await _settlementService.disputeSettlement(_settlement!.id, reason);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(res['message'] ?? ''),
                    backgroundColor: res['success'] == true ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                  ),
                );
                _loadSettlement();
              }
            },
            child: const Text('Gửi Khiếu Nại'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    final req = widget.request;

    return Scaffold(
      appBar: AppBar(
        title: Text('Đơn thuê #${req.id.substring(0, 8).toUpperCase()}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Header Banner
            _buildStatusHeader(req),
            const SizedBox(height: 20),

            // Vehicle Information Card
            _buildVehicleCard(req),
            const SizedBox(height: 16),

            // Schedule & Locations Card
            _buildScheduleCard(req, dateFormat),
            const SizedBox(height: 16),

            // Customer Verification Info
            _buildCustomerCard(req),
            const SizedBox(height: 16),

            // Financial Summary Card
            _buildFinancialCard(req),
            const SizedBox(height: 20),

            // Action Buttons based on status
            _buildActionButtons(req),
            const SizedBox(height: 20),

            // 2-Stage Escrow Settlement Tracker Section
            if (_settlement != null || _isLoadingSettlement || req.status == 'HOLDING' || req.status == 'COMPLETED')
              _buildSettlementSection(),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusHeader(RentalRequestModel req) {
    Color color;
    String label;
    String desc;

    switch (req.status.toUpperCase()) {
      case 'PENDING':
        color = const Color(0xFFF59E0B);
        label = 'CHỜ KÝ HỢP ĐỒNG';
        desc = 'Đơn thuê đã được khởi tạo. Vui lòng ký hợp đồng điện tử để tiếp tục.';
        break;
      case 'SIGNED':
        color = const Color(0xFF3B82F6);
        label = 'ĐÃ KÝ HĐ • CHỜ ĐẶT CỌC';
        desc = 'Hợp đồng đã ký thành công. Vui lòng thanh toán cọc VietQR để hoàn tất giữ xe.';
        break;
      case 'CONFIRMED':
        color = const Color(0xFF10B981);
        label = 'ĐÃ ĐẶT CỌC (CONFIRMED)';
        desc = 'Đơn thuê đã xác nhận cọc thành công! Xe đang sẵn sàng bàn giao theo lịch hẹn.';
        break;
      case 'ACTIVE':
        color = const Color(0xFF8B5CF6);
        label = 'ĐANG THUÊ XE (ACTIVE)';
        desc = 'Khách hàng đang lưu hành và sử dụng phương tiện.';
        break;
      case 'HOLDING':
        color = const Color(0xFFF97316);
        label = 'ĐỐI SOÁT ESCROW 2 ĐỢT (HOLDING)';
        desc = 'Đã hoàn tất trả xe. Hệ thống đang tiến hành đối soát hoàn cọc 2 đợt minh bạch.';
        break;
      case 'COMPLETED':
        color = const Color(0xFF059669);
        label = 'HOÀN TẤT (COMPLETED)';
        desc = 'Hợp đồng thuê xe và toàn bộ thủ tục hoàn cọc đã kết thúc mỹ mãn.';
        break;
      case 'DISPUTED':
        color = const Color(0xFFEF4444);
        label = 'ĐANG XỬ LÝ KHIẾU NẠI (DISPUTED)';
        desc = 'Đơn thuê đang được Ban Quản Trị VELORA thẩm tra và phân xử khiếu nại.';
        break;
      default:
        color = Colors.grey;
        label = req.status;
        desc = '';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.info_outline_rounded, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: color,
                    letterSpacing: 0.5,
                  ),
                ),
                if (desc.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    desc,
                    style: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleCard(RentalRequestModel req) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
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
            child: req.carImageUrl != null && req.carImageUrl!.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(req.carImageUrl!, fit: BoxFit.cover),
                  )
                : const Icon(Icons.directions_car_filled_rounded, color: Color(0xFF2563EB), size: 36),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  req.carDisplayName.isNotEmpty ? req.carDisplayName : 'Xe tự lái VELORA',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Biển số: ${req.carLicensePlate ?? "---"}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 4),
                Text(
                  'Giá thuê: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(req.dailyRate)}/ngày',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleCard(RentalRequestModel req, DateFormat dateFormat) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.calendar_today_rounded, size: 16, color: Color(0xFF2563EB)),
              SizedBox(width: 8),
              Text('Lịch trình & Địa điểm', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow('Nhận xe', '${dateFormat.format(req.startTime)} (${req.pickupLocation})'),
          const Divider(height: 14),
          _buildInfoRow('Trả xe', '${dateFormat.format(req.endTime)} (${req.dropoffLocation})'),
          const Divider(height: 14),
          _buildInfoRow('Tổng thời gian thuê', '${req.totalDays} ngày'),
        ],
      ),
    );
  }

  Widget _buildCustomerCard(RentalRequestModel req) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.person_outline_rounded, size: 16, color: Color(0xFF10B981)),
              SizedBox(width: 8),
              Text('Thông tin người thuê', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow('Họ và tên', req.customerName),
          const Divider(height: 14),
          _buildInfoRow('Số điện thoại', req.customerPhone),
          const Divider(height: 14),
          _buildInfoRow('CCCD / CMND', req.customerIdCard),
          const Divider(height: 14),
          _buildInfoRow('Giấy phép lái xe', '${req.driverLicenseNumber} (${req.driverLicenseClass ?? "B2"})'),
        ],
      ),
    );
  }

  Widget _buildFinancialCard(RentalRequestModel req) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.monetization_on_outlined, size: 16, color: Color(0xFFF59E0B)),
              SizedBox(width: 8),
              Text('Tài chính & Tiền cọc', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow('Tiền thuê xe dự tính', req.formattedTotalFee),
          const Divider(height: 14),
          _buildInfoRow('Tiền cọc bảo đảm (Escrow)', req.formattedDeposit, isHighlight: true),
        ],
      ),
    );
  }

  Widget _buildActionButtons(RentalRequestModel req) {
    final status = req.status.toUpperCase();

    if (status == 'PENDING') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _isNavigating ? null : _openContractScreen,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: const Color(0xFF2563EB),
          ),
          icon: _isNavigating
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.draw_rounded),
          label: const Text('Ký Hợp Đồng Điện Tử Ngay', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      );
    }

    if (status == 'SIGNED') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _openPaymentScreen,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: const Color(0xFF10B981),
          ),
          icon: const Icon(Icons.qr_code_2_rounded),
          label: const Text('Thanh Toán Cọc VietQR Ngay', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _isNavigating ? null : _openContractScreen,
        style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
        icon: const Icon(Icons.description_outlined),
        label: const Text('Xem Hợp Đồng Điện Tử'),
      ),
    );
  }

  Widget _buildSettlementSection() {
    if (_isLoadingSettlement) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    final s = _settlement;
    if (s == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF1E293B), const Color(0xFF0F172A)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.shield_rounded, color: Color(0xFFF59E0B), size: 20),
                  SizedBox(width: 8),
                  Text('Quyết Toán Hoàn Cọc Escrow 2 Đợt', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                ],
              ),
              if (s.isDisputed)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFEF4444)),
                  ),
                  child: const Text('ĐANG KHIẾU NẠI', style: TextStyle(fontSize: 10, color: Color(0xFFEF4444), fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 14),

          // Deductions detail
          Text('Khoản khấu trừ phụ phí:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
          const SizedBox(height: 6),
          _buildInfoRow('Phí trễ hạn trả xe', s.formatCurrency(s.lateReturnFee)),
          _buildInfoRow('Phí thiếu nhiên liệu', s.formatCurrency(s.fuelFee)),
          _buildInfoRow('Phí vệ sinh xe (200.000đ)', s.formatCurrency(s.cleaningFee)),
          _buildInfoRow('Phí hư hại / trầy xước', s.formatCurrency(s.damageFee)),
          const Divider(height: 16),
          _buildInfoRow('Tổng tiền đã khấu trừ', s.formatCurrency(s.totalDeduction), isHighlight: true),
          const SizedBox(height: 14),

          // Round 1 Escrow Refund
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('ĐỢT 1: Hoàn cọc thừa sau bàn giao', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF60A5FA))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: s.isRound1Refunded ? const Color(0xFF10B981).withValues(alpha: 0.2) : const Color(0xFFF59E0B).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        s.isRound1Refunded ? 'ĐÃ HOÀN TRẢ VIETQR' : 'ĐANG XỬ LÝ',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: s.isRound1Refunded ? const Color(0xFF10B981) : const Color(0xFFF59E0B)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text('Số tiền hoàn trả: ${s.formatCurrency(s.refundAmount)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Round 2 Escrow Traffic Fine Hold
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('ĐỢT 2: Giữ cọc phạt nguội CSGT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: s.trafficFineRefundStatus == 'REFUNDED'
                            ? const Color(0xFF10B981).withValues(alpha: 0.2)
                            : const Color(0xFFF59E0B).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        s.trafficFineRefundStatus == 'REFUNDED' ? 'ĐÃ HOÀN CỌC CSGT' : 'ĐANG ĐỐI SOÁT (15-30 NGÀY)',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: s.trafficFineRefundStatus == 'REFUNDED' ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text('Số tiền bảo chứng: ${s.formatCurrency(s.trafficFineHoldAmount)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                if (s.trafficFineNotes != null) ...[
                  const SizedBox(height: 4),
                  Text('Ghi chú: ${s.trafficFineNotes}', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Dispute Button
          if (!s.isDisputed && widget.request.status != 'COMPLETED')
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFF59E0B),
                  side: const BorderSide(color: Color(0xFFF59E0B)),
                ),
                onPressed: _showDisputeDialog,
                icon: const Icon(Icons.report_problem_outlined, size: 18),
                label: const Text('Gửi Khiếu Nại Quyết Toán (Dispute)'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)))),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isHighlight ? const Color(0xFFF59E0B) : Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
