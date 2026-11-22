import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/handover_protocol_model.dart';
import '../../services/rental_service.dart';
import '../../widgets/signature_pad.dart';

class HandoverConfirmScreen extends StatefulWidget {
  final HandoverProtocolModel protocol;
  final String customerName;

  const HandoverConfirmScreen({
    super.key,
    required this.protocol,
    required this.customerName,
  });

  @override
  State<HandoverConfirmScreen> createState() => _HandoverConfirmScreenState();
}

class _HandoverConfirmScreenState extends State<HandoverConfirmScreen> {
  final RentalService _rentalService = RentalService();
  final SignaturePadController _sigController = SignaturePadController();
  final TextEditingController _notesController = TextEditingController();

  bool _agreed = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _sigController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitConfirm() async {
    if (_sigController.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng vẽ chữ ký xác nhận nhận xe trên khung ký.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }
    if (!_agreed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng tích chọn xác nhận đã kiểm tra thực tế tình trạng xe.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    final res = await _rentalService.confirmHandover(
      widget.protocol.id,
      customerSignature: '${widget.customerName} (Signed Mobile)',
      notes: _notesController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(res['message'] ?? ''),
        backgroundColor: res['success'] == true
            ? const Color(0xFF10B981)
            : const Color(0xFFEF4444),
      ),
    );

    if (res['success'] == true) {
      Navigator.of(context).pop(true);
    }
  }

  Color _stageColor(String stage) {
    switch (stage.toUpperCase()) {
      case 'TRANSIT_DELIVERY':
        return const Color(0xFFF59E0B);
      case 'CUSTOMER_RENTAL':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF38BDF8); // PRE_EXISTING
    }
  }

  String _stageLabel(String stage) {
    switch (stage.toUpperCase()) {
      case 'TRANSIT_DELIVERY':
        return 'Phát sinh chặng giao xe (Miễn trừ khách)';
      case 'CUSTOMER_RENTAL':
        return 'Phát sinh trong chuyến đi';
      default:
        return 'Vết xước có sẵn (Miễn trừ khách)';
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.protocol;
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    final markers = p.markers;
    final accessories = p.accessoriesChecklist
        .split(';')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Text('Xác nhận bàn giao #${p.protocolNumber}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Info
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${p.carMake ?? ''} ${p.carModel ?? ''} • ${p.licensePlate ?? ''}'.trim(),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Nhân viên bàn giao: ${p.staffName} • ${dateFormat.format(p.handoverDate)}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ODO & Fuel/Battery Metrics (Single Source of Truth)
            const Text(
              '1. Chỉ số ODO & Mức xăng/pin lúc nhận xe',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    icon: Icons.speed_rounded,
                    color: const Color(0xFF3B82F6),
                    label: 'ODO bàn giao (handoverOdo)',
                    value: '${NumberFormat('#,###', 'vi_VN').format(p.handoverOdo)} km',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricCard(
                    icon: Icons.local_gas_station_rounded,
                    color: const Color(0xFF10B981),
                    label: 'Mức xăng / pin giao',
                    value: '${p.handoverFuelLevel.toStringAsFixed(0)}%',
                  ),
                ),
              ],
            ),

            if (p.hasTransitAnomaly) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF59E0B)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, color: Color(0xFFFBBF24), size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Ghi chú chặng trung chuyển: ${p.transitAnomalyNote ?? "Hệ thống đã khóa mốc ODO và xăng/pin theo thời điểm bàn giao thực tế cho bạn."}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFFFDE68A)),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Dashboard Photo Evidence
            if (p.handoverDashPhotoUrl != null && p.handoverDashPhotoUrl!.trim().isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text(
                '2. Ảnh chụp Taplo (ODO & Nhiên liệu/Pin)',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.network(
                  p.handoverDashPhotoUrl!,
                  height: 190,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                    height: 100,
                    color: const Color(0xFF1E293B),
                    alignment: Alignment.center,
                    child: const Text('Không thể tải ảnh taplo', style: TextStyle(color: Colors.grey)),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),

            // Layered 2D Damage Map
            const Text(
              '3. Sơ đồ vết xước 2D phân tầng (Miễn trừ trước chuyến đi)',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
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
                  // 2D Top-Down Car Canvas with Markers
                  Container(
                    height: 170,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        return Stack(
                          children: [
                            // Stylized car silhouette outline
                            Center(
                              child: Container(
                                width: constraints.maxWidth * 0.72,
                                height: 110,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(32),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.25),
                                    width: 2,
                                  ),
                                  color: Colors.white.withValues(alpha: 0.03),
                                ),
                                child: const Center(
                                  child: Text(
                                    'MẶT BẰNG THÂN XE 2D',
                                    style: TextStyle(
                                      fontSize: 10,
                                      letterSpacing: 1.5,
                                      color: Color(0xFF64748B),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            ...markers.asMap().entries.map((entry) {
                              final idx = entry.key;
                              final m = entry.value;
                              final left = (m.x.clamp(5, 95) / 100.0) * constraints.maxWidth - 11;
                              final top = (m.y.clamp(5, 95) / 100.0) * constraints.maxHeight - 11;
                              final c = _stageColor(m.stage);
                              return Positioned(
                                left: left,
                                top: top,
                                child: Container(
                                  width: 22,
                                  height: 22,
                                  decoration: BoxDecoration(
                                    color: c,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 1.5),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '${idx + 1}',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              );
                            }),
                          ],
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (markers.isEmpty)
                    const Text(
                      'Không ghi nhận vết xước nào trước khi bàn giao.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF10B981)),
                    )
                  else
                    ...markers.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final m = entry.value;
                      final c = _stageColor(m.stage);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 18,
                              height: 18,
                              decoration: BoxDecoration(color: c, shape: BoxShape.circle),
                              alignment: Alignment.center,
                              child: Text(
                                '${idx + 1}',
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(m.note, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                  Text(_stageLabel(m.stage), style: TextStyle(fontSize: 10, color: c)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Accessories Checklist
            if (accessories.isNotEmpty) ...[
              const Text(
                '4. Danh mục giấy tờ & phụ kiện bàn giao',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: accessories.map((item) {
                  return Chip(
                    avatar: const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF10B981)),
                    label: Text(item, style: const TextStyle(fontSize: 11)),
                    backgroundColor: const Color(0xFF1E293B),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],

            // Dual Signature Section
            const Text(
              '5. Ký xác nhận kép nhận bàn giao xe',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Ghi chú thêm của khách (không bắt buộc)',
                hintText: 'VD: Đã kiểm tra đủ giấy tờ, tình trạng xe đúng biên bản...',
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Chữ ký khách hàng:', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                TextButton.icon(
                  onPressed: _sigController.clear,
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: const Text('Ký lại', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
            SignaturePad(controller: _sigController, height: 160),
            const SizedBox(height: 10),
            CheckboxListTile(
              value: _agreed,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: const Text(
                'Tôi xác nhận đã kiểm tra thực tế ODO, mức xăng/pin và sơ đồ vết xước trùng khớp với biên bản bàn giao.',
                style: TextStyle(fontSize: 12),
              ),
              onChanged: (v) => setState(() => _agreed = v == true),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitConfirm,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: const Color(0xFF10B981),
                ),
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.verified_rounded),
                label: Text(
                  _isSubmitting
                      ? 'Đang xác nhận...'
                      : 'Ký xác nhận nhận xe (Kích hoạt chuyến đi)',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required IconData icon,
    required Color color,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
