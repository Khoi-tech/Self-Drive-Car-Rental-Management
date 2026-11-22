import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/handover_protocol_model.dart';
import '../../models/rental_request_model.dart';
import '../../models/return_protocol_model.dart';
import '../../models/settlement_model.dart';
import '../../services/rental_service.dart';
import '../../services/settlement_service.dart';
import '../contract/contract_sign_screen.dart';
import '../handover/handover_confirm_screen.dart';
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

  late RentalRequestModel _request;
  HandoverProtocolModel? _handover;
  ReturnProtocolModel? _returnProtocol;
  SettlementModel? _settlement;

  bool _isLoadingExtras = false;
  bool _isNavigating = false;

  Timer? _countdownTimer;
  Duration _holdRemaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _request = widget.request;
    _initHoldTimer();
    _refreshAll();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _initHoldTimer() {
    _countdownTimer?.cancel();
    final expiresAt = _request.holdExpiresAt;
    if (expiresAt == null) return;

    void updateRemaining() {
      final diff = expiresAt.toUtc().difference(DateTime.now().toUtc());
      if (mounted) {
        setState(() {
          _holdRemaining = diff.isNegative ? Duration.zero : diff;
        });
      }
    }

    updateRemaining();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      updateRemaining();
    });
  }

  Future<void> _refreshAll() async {
    setState(() => _isLoadingExtras = true);
    try {
      final results = await Future.wait([
        _rentalService.getRentalRequestById(_request.id),
        _rentalService.getHandoverByRequestId(_request.id),
        _rentalService.getReturnProtocolByRequestId(_request.id),
        _settlementService.getSettlementByRequestId(_request.id),
      ]);

      if (!mounted) return;
      setState(() {
        if (results[0] != null) {
          _request = results[0] as RentalRequestModel;
        }
        _handover = results[1] as HandoverProtocolModel?;
        _returnProtocol = results[2] as ReturnProtocolModel?;
        _settlement = results[3] as SettlementModel?;
        _isLoadingExtras = false;
      });
      _initHoldTimer();
    } catch (_) {
      if (mounted) setState(() => _isLoadingExtras = false);
    }
  }

  String _formatCountdown(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  // Maps status to 10-step progress index (0..9)
  int _progressStepIndex(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'PENDING_HOLD_PAYMENT':
      case 'HOLD_PENDING':
        return 1;
      case 'HOLD_CONFIRMED':
        return 2;
      case 'APPROVED':
      case 'PENDING_SIGNATURE':
        return 3;
      case 'SIGNED':
        return 4;
      case 'CONFIRMED':
      case 'DEPOSIT_PAID':
      case 'IN_TRANSIT':
        return 5;
      case 'ACTIVE':
      case 'IN_PROGRESS':
      case 'RENTED':
        return 6;
      case 'RETURNED':
      case 'SETTLEMENT_PENDING':
        return 7;
      case 'SETTLED':
      case 'PARTIALLY_SETTLED':
      case 'HOLDING':
      case 'DISPUTED':
        return 8;
      case 'COMPLETED':
      case 'CLOSED':
        return 9;
      default:
        return 0;
    }
  }

  bool get _canCancel {
    final st = _request.status.toUpperCase();
    return st == 'PENDING' ||
        st == 'PENDING_HOLD_PAYMENT' ||
        st == 'HOLD_PENDING' ||
        st == 'HOLD_CONFIRMED' ||
        st == 'APPROVED' ||
        st == 'SIGNED' ||
        st == 'CONFIRMED' ||
        st == 'DEPOSIT_PAID';
  }

  Future<void> _openContractScreen() async {
    setState(() => _isNavigating = true);
    try {
      final contract = await _rentalService.getOrCreateContractByRequestId(_request.id);
      if (!mounted) return;
      setState(() => _isNavigating = false);
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ContractSignScreen(contract: contract)),
      );
      _refreshAll();
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

  Future<void> _openPaymentScreen() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => VietQrPaymentScreen(
          requestId: _request.id,
          carName: _request.carDisplayName,
          licensePlate: _request.carLicensePlate ?? '',
        ),
      ),
    );
    _refreshAll();
  }

  Future<void> _openHandoverConfirmScreen() async {
    if (_handover == null) return;
    final confirmed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => HandoverConfirmScreen(
          protocol: _handover!,
          customerName: _request.customerName,
        ),
      ),
    );
    if (confirmed == true) {
      _refreshAll();
    }
  }

  void _showSupplementDocumentsDialog() {
    final idCardCtrl = TextEditingController(text: _request.customerIdCard);
    final licenseCtrl = TextEditingController(text: _request.driverLicenseNumber);
    final cccdFrontCtrl = TextEditingController();
    final cccdBackCtrl = TextEditingController();
    final gplxFrontCtrl = TextEditingController();
    final gplxBackCtrl = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.upload_file_rounded, color: Color(0xFF3B82F6)),
              SizedBox(width: 8),
              Expanded(child: Text('Bổ sung CCCD & GPLX', style: TextStyle(fontSize: 16))),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: idCardCtrl,
                  decoration: const InputDecoration(labelText: 'Số CCCD/CMND'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: licenseCtrl,
                  decoration: const InputDecoration(labelText: 'Số GPLX'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: cccdFrontCtrl,
                  decoration: const InputDecoration(labelText: 'Link ảnh mặt trước CCCD'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: cccdBackCtrl,
                  decoration: const InputDecoration(labelText: 'Link ảnh mặt sau CCCD'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: gplxFrontCtrl,
                  decoration: const InputDecoration(labelText: 'Link ảnh mặt trước GPLX'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: gplxBackCtrl,
                  decoration: const InputDecoration(labelText: 'Link ảnh mặt sau GPLX'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSaving ? null : () => Navigator.of(ctx).pop(),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: isSaving
                  ? null
                  : () async {
                      setDialogState(() => isSaving = true);
                      final res = await _rentalService.updateRentalDocuments(
                        _request.id,
                        customerIdCard: idCardCtrl.text,
                        driverLicenseNumber: licenseCtrl.text,
                        idCardFrontUrl: cccdFrontCtrl.text,
                        idCardBackUrl: cccdBackCtrl.text,
                        driverLicenseFrontUrl: gplxFrontCtrl.text,
                        driverLicenseBackUrl: gplxBackCtrl.text,
                      );
                      setDialogState(() => isSaving = false);
                      if (!mounted) return;
                      if (ctx.mounted) Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(res['message'] ?? ''),
                          backgroundColor: res['success'] == true
                              ? const Color(0xFF10B981)
                              : const Color(0xFFEF4444),
                        ),
                      );
                      _refreshAll();
                    },
              child: Text(isSaving ? 'Đang gửi...' : 'Cập nhật hồ sơ'),
            ),
          ],
        ),
      ),
    );
  }

  void _showExtensionDialog() {
    DateTime newEnd = _request.endTime.add(const Duration(days: 1));
    final reasonCtrl = TextEditingController();
    final dateFmt = DateFormat('dd/MM/yyyy HH:mm');
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.more_time_rounded, color: Color(0xFF3B82F6)),
              SizedBox(width: 8),
              Expanded(child: Text('Yêu cầu gia hạn thuê xe', style: TextStyle(fontSize: 16))),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hạn trả hiện tại: ${dateFmt.format(_request.endTime.toLocal())}',
                style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 12),
              InkWell(
                onTap: () async {
                  final pickedDate = await showDatePicker(
                    context: ctx,
                    initialDate: newEnd,
                    firstDate: _request.endTime,
                    lastDate: _request.endTime.add(const Duration(days: 30)),
                  );
                  if (pickedDate != null && ctx.mounted) {
                    final pickedTime = await showTimePicker(
                      context: ctx,
                      initialTime: TimeOfDay.fromDateTime(newEnd),
                    );
                    setDialogState(() {
                      newEnd = DateTime(
                        pickedDate.year,
                        pickedDate.month,
                        pickedDate.day,
                        pickedTime?.hour ?? newEnd.hour,
                        pickedTime?.minute ?? newEnd.minute,
                      );
                    });
                  }
                },
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Thời gian trả xe mới',
                    prefixIcon: Icon(Icons.calendar_month_rounded, size: 18),
                  ),
                  child: Text(dateFmt.format(newEnd), style: const TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reasonCtrl,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Lý do gia hạn *',
                  hintText: 'VD: Kéo dài lịch công tác thêm 1 ngày...',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: isSaving ? null : () => Navigator.of(ctx).pop(),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: isSaving
                  ? null
                  : () async {
                      if (reasonCtrl.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Vui lòng nhập lý do gia hạn.'),
                            backgroundColor: Color(0xFFEF4444),
                          ),
                        );
                        return;
                      }
                      setDialogState(() => isSaving = true);
                      final res = await _rentalService.createRentalExtension(
                        rentalRequestId: _request.id,
                        newEndTime: newEnd,
                        reason: reasonCtrl.text,
                      );
                      setDialogState(() => isSaving = false);
                      if (!mounted) return;
                      if (ctx.mounted) Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(res['message'] ?? ''),
                          backgroundColor: res['success'] == true
                              ? const Color(0xFF10B981)
                              : const Color(0xFFEF4444),
                        ),
                      );
                    },
              child: Text(isSaving ? 'Đang gửi...' : 'Gửi yêu cầu'),
            ),
          ],
        ),
      ),
    );
  }

  void _showIncidentDialog() {
    String incidentType = 'BREAKDOWN';
    String severity = 'MEDIUM';
    bool hasInjuries = false;
    final locationCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.emergency_rounded, color: Color(0xFFEF4444)),
              SizedBox(width: 8),
              Expanded(child: Text('Báo sự cố khẩn cấp 24/7', style: TextStyle(fontSize: 16))),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: incidentType,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Loại sự cố'),
                  items: const [
                    DropdownMenuItem(value: 'COLLISION', child: Text('Va chạm / Tai nạn', overflow: TextOverflow.ellipsis)),
                    DropdownMenuItem(value: 'BREAKDOWN', child: Text('Hỏng máy / Chết máy', overflow: TextOverflow.ellipsis)),
                    DropdownMenuItem(value: 'FLAT_TIRE', child: Text('Nổ lốp / Xì lốp', overflow: TextOverflow.ellipsis)),
                    DropdownMenuItem(value: 'FLOOD', child: Text('Ngập nước', overflow: TextOverflow.ellipsis)),
                    DropdownMenuItem(value: 'OTHER', child: Text('Sự cố khác', overflow: TextOverflow.ellipsis)),
                  ],
                  onChanged: (v) {
                    if (v != null) setDialogState(() => incidentType = v);
                  },
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  initialValue: severity,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Mức độ nghiêm trọng'),
                  items: const [
                    DropdownMenuItem(value: 'LOW', child: Text('Nhẹ (Vẫn di chuyển được)', overflow: TextOverflow.ellipsis)),
                    DropdownMenuItem(value: 'MEDIUM', child: Text('Trung bình (Cần hỗ trợ kỹ thuật)', overflow: TextOverflow.ellipsis)),
                    DropdownMenuItem(value: 'HIGH', child: Text('Khẩn cấp (Cần xe cứu hộ ngay)', overflow: TextOverflow.ellipsis)),
                  ],
                  onChanged: (v) {
                    if (v != null) setDialogState(() => severity = v);
                  },
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: locationCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Vị trí hiện tại *',
                    hintText: 'VD: Cao tốc Long Thành - Dầu Giây Km12',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Mô tả tình trạng xe *',
                    hintText: 'Mô tả ngắn gọn sự cố để đội cứu hộ chuẩn bị...',
                  ),
                ),
                CheckboxListTile(
                  value: hasInjuries,
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text('Có người bị thương cần cấp cứu', style: TextStyle(fontSize: 12)),
                  onChanged: (v) => setDialogState(() => hasInjuries = v == true),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSaving ? null : () => Navigator.of(ctx).pop(),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
              onPressed: isSaving
                  ? null
                  : () async {
                      if (locationCtrl.text.trim().isEmpty || descCtrl.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Vui lòng nhập vị trí và mô tả sự cố.'),
                            backgroundColor: Color(0xFFEF4444),
                          ),
                        );
                        return;
                      }
                      setDialogState(() => isSaving = true);
                      final res = await _rentalService.createIncidentReport(
                        rentalRequestId: _request.id,
                        incidentType: incidentType,
                        severity: severity,
                        location: locationCtrl.text,
                        description: descCtrl.text,
                        hasInjuries: hasInjuries,
                      );
                      setDialogState(() => isSaving = false);
                      if (!mounted) return;
                      if (ctx.mounted) Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(res['message'] ?? ''),
                          backgroundColor: res['success'] == true
                              ? const Color(0xFF10B981)
                              : const Color(0xFFEF4444),
                        ),
                      );
                    },
              child: Text(isSaving ? 'Đang gửi...' : 'Gửi báo sự cố'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmCancelOrder() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận hủy đơn thuê'),
        content: const Text(
          'Bạn có chắc chắn muốn hủy đơn thuê xe này? Thao tác này không thể hoàn tác.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Không'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            onPressed: () async {
              Navigator.of(ctx).pop();
              final res = await _rentalService.cancelRentalRequest(_request.id);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(res['message'] ?? ''),
                  backgroundColor: res['success'] == true
                      ? const Color(0xFF10B981)
                      : const Color(0xFFEF4444),
                ),
              );
              if (res['success'] == true) {
                _refreshAll();
              }
            },
            child: const Text('Hủy đơn'),
          ),
        ],
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
            Expanded(child: Text('Gửi Khiếu Nại Quyết Toán', style: TextStyle(fontSize: 16))),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Nếu bạn không đồng ý với các khoản khấu trừ phụ phí (vượt km, xăng/pin, vệ sinh, vết xước), vui lòng nhập lý do để Quản lý VELORA thẩm tra:',
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
                    backgroundColor: res['success'] == true
                        ? const Color(0xFF10B981)
                        : const Color(0xFFEF4444),
                  ),
                );
                _refreshAll();
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
    final req = _request;
    final st = req.status.toUpperCase();

    final showReturnOrSettlement = _returnProtocol != null ||
        _settlement != null ||
        st == 'RETURNED' ||
        st == 'SETTLED' ||
        st == 'PARTIALLY_SETTLED' ||
        st == 'HOLDING' ||
        st == 'DISPUTED' ||
        st == 'COMPLETED' ||
        st == 'CLOSED';

    return Scaffold(
      appBar: AppBar(
        title: Text('Đơn thuê #${req.id.substring(0, 8).toUpperCase()}'),
        actions: [
          IconButton(
            tooltip: 'Làm mới',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refreshAll,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshAll,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 10-step Progress Tracker (hide if CANCELLED/REJECTED)
              if (st != 'CANCELLED' && st != 'REJECTED') ...[
                _buildProgressBar(st),
                const SizedBox(height: 16),
              ],

              // Status Header Banner
              _buildStatusHeader(req),
              const SizedBox(height: 16),

              // Fast Hold 4h Countdown Banner
              if ((st == 'PENDING_HOLD_PAYMENT' || st == 'HOLD_PENDING' || st == 'HOLD_CONFIRMED') &&
                  req.holdExpiresAt != null) ...[
                _buildHoldCountdownCard(req),
                const SizedBox(height: 16),
              ],

              // Smart Action Buttons based on V2.0 State Machine
              _buildActionButtons(req),
              const SizedBox(height: 16),

              // Return Protocol Card (Quãng đường khách dùng = customerReturnOdo - handoverOdo)
              if (showReturnOrSettlement && _returnProtocol != null) ...[
                _buildReturnProtocolCard(_returnProtocol!),
                const SizedBox(height: 16),
              ],

              // 2-Stage Escrow Settlement Tracker Section
              if (showReturnOrSettlement && (_settlement != null || _isLoadingExtras)) ...[
                _buildSettlementSection(),
                const SizedBox(height: 16),
              ],

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

              // Cancel Order Button (only before handover)
              if (_canCancel) ...[
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFEF4444),
                      side: const BorderSide(color: Color(0xFFEF4444)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: _confirmCancelOrder,
                    icon: const Icon(Icons.cancel_outlined, size: 18),
                    label: const Text('Hủy đơn thuê xe', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProgressBar(String status) {
    final step = _progressStepIndex(status);
    const labels = [
      'Đặt xe',
      'Duyệt / Giữ chỗ',
      'Ký HĐ & Cọc',
      'Bàn giao',
      'Đang thuê',
      'Trả xe & Quyết toán',
      'Hoàn tất',
    ];
    int activeIdx = 0;
    if (step <= 1) {
      activeIdx = 0;
    } else if (step == 2) {
      activeIdx = 1;
    } else if (step <= 4) {
      activeIdx = 2;
    } else if (step == 5) {
      activeIdx = 3;
    } else if (step == 6) {
      activeIdx = 4;
    } else if (step <= 8) {
      activeIdx = 5;
    } else {
      activeIdx = 6;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Tiến trình quy trình VELORA',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              Text(
                'Bước ${activeIdx + 1}/${labels.length}: ${labels[activeIdx]}',
                style: const TextStyle(fontSize: 11, color: Color(0xFF60A5FA), fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: List.generate(labels.length, (i) {
              final done = i <= activeIdx;
              return Expanded(
                child: Container(
                  height: 5,
                  margin: EdgeInsets.only(right: i < labels.length - 1 ? 4 : 0),
                  decoration: BoxDecoration(
                    color: done ? const Color(0xFF2563EB) : Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildHoldCountdownCard(RentalRequestModel req) {
    final isExpired = _holdRemaining == Duration.zero;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: (isExpired ? const Color(0xFFEF4444) : const Color(0xFFF59E0B)).withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isExpired ? const Color(0xFFEF4444) : const Color(0xFFF59E0B)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.timer_rounded,
            color: isExpired ? const Color(0xFFEF4444) : const Color(0xFFFBBF24),
            size: 26,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isExpired ? 'Đã hết hạn giữ chỗ 4 giờ' : 'Thời gian giữ chỗ Fast Hold còn lại',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  isExpired
                      ? 'Vui lòng liên hệ nhân viên VELORA hoặc tạo đơn mới.'
                      : _formatCountdown(_holdRemaining),
                  style: TextStyle(
                    fontSize: isExpired ? 11 : 18,
                    fontWeight: FontWeight.bold,
                    color: isExpired ? const Color(0xFFFCA5A5) : const Color(0xFFFDE68A),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusHeader(RentalRequestModel req) {
    Color color;
    String label;
    String desc;

    switch (req.status.toUpperCase()) {
      case 'PENDING_HOLD_PAYMENT':
      case 'HOLD_PENDING':
        color = const Color(0xFFF59E0B);
        label = 'CHỜ NỘP CỌC GIỮ CHỖ 500K';
        desc = 'Vui lòng chuyển khoản 500.000đ qua VietQR trong 4 giờ để khóa xe độc quyền.';
        break;
      case 'HOLD_CONFIRMED':
        color = const Color(0xFF0EA5E9);
        label = 'ĐÃ GIỮ CHỖ 500K (HOLD_CONFIRMED)';
        desc = 'Xe đã được khóa giữ cho bạn. Hãy bổ sung ảnh CCCD & GPLX để nhân viên duyệt hồ sơ nhanh.';
        break;
      case 'PENDING':
        color = const Color(0xFFF59E0B);
        label = 'CHỜ DUYỆT HỒ SƠ (PENDING)';
        desc = 'Yêu cầu đặt xe đã được gửi tới VELORA. Nhân viên sẽ kiểm tra hồ sơ và phê duyệt trong ít phút.';
        break;
      case 'APPROVED':
      case 'PENDING_SIGNATURE':
        color = const Color(0xFF3B82F6);
        label = 'ĐÃ DUYỆT • CHỜ KÝ HỢP ĐỒNG';
        desc = 'Hồ sơ của bạn đã được duyệt! Vui lòng xem hợp đồng pháp lý và ký điện tử ngay.';
        break;
      case 'SIGNED':
        color = const Color(0xFF6366F1);
        label = 'ĐÃ KÝ HĐ • CHỜ ĐẶT CỌC';
        desc = 'Hợp đồng đã ký thành công. Vui lòng thanh toán cọc thế chân VietQR để hoàn tất giữ xe.';
        break;
      case 'CONFIRMED':
      case 'DEPOSIT_PAID':
      case 'IN_TRANSIT':
        color = const Color(0xFF10B981);
        label = _handover != null && !_handover!.isCompleted
            ? 'CHỜ XÁC NHẬN BÀN GIAO XE'
            : (req.isCashDeposit ? 'ĐÃ XÁC NHẬN • CỌC TIỀN MẶT' : 'ĐÃ XÁC NHẬN & CỌC');
        desc = _handover != null && !_handover!.isCompleted
            ? 'Nhân viên đã lập biên bản bàn giao xe. Hãy kiểm tra ODO, xăng/pin và ký xác nhận nhận xe!'
            : 'Xe đang được chuẩn bị bàn giao đúng lịch hẹn.';
        break;
      case 'ACTIVE':
      case 'IN_PROGRESS':
      case 'RENTED':
        color = const Color(0xFF8B5CF6);
        label = 'ĐANG THUÊ XE (ACTIVE)';
        desc = 'Chúc bạn thượng lộ bình an! Có thể gửi yêu cầu gia hạn hoặc báo sự cố khẩn cấp 24/7 ngay tại đây.';
        break;
      case 'RETURNED':
      case 'SETTLEMENT_PENDING':
        color = const Color(0xFF06B6D4);
        label = 'ĐÃ TRẢ XE • CHỜ QUYẾT TOÁN';
        desc = 'Đã hoàn tất nghiệm thu trả xe. Quản lý đang lập bảng quyết toán cọc 2 đợt.';
        break;
      case 'PARTIALLY_SETTLED':
      case 'HOLDING':
        color = const Color(0xFFF97316);
        label = 'ĐANG GIỮ PHẠT NGUỘI 2TR (ĐỢT 2)';
        desc = 'Đợt 1 hoàn cọc dư đã xử lý. Quỹ 2.000.000đ đang tạm giữ đối soát phạt nguội CSGT 15–30 ngày.';
        break;
      case 'SETTLED':
      case 'COMPLETED':
      case 'CLOSED':
        color = const Color(0xFF059669);
        label = 'HOÀN TẤT CHUYẾN ĐI';
        desc = 'Hợp đồng thuê xe và toàn bộ thủ tục hoàn cọc 2 đợt đã kết thúc.';
        break;
      case 'DISPUTED':
        color = const Color(0xFFEF4444);
        label = 'ĐANG XỬ LÝ KHIẾU NẠI (DISPUTED)';
        desc = 'Đơn thuê đang được Ban Quản Trị VELORA thẩm tra và phân xử khiếu nại.';
        break;
      case 'CANCELLED':
        color = const Color(0xFF64748B);
        label = 'ĐƠN ĐÃ HỦY (CANCELLED)';
        desc = 'Yêu cầu thuê xe này đã được hủy.';
        break;
      case 'REJECTED':
        color = const Color(0xFFEF4444);
        label = 'HỒ SƠ BỊ TỪ CHỐI (REJECTED)';
        desc = req.rejectReason ?? 'Hồ sơ chưa đáp ứng điều kiện thuê xe của VELORA.';
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
                    letterSpacing: 0.4,
                  ),
                ),
                if (desc.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    desc,
                    style: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1), height: 1.35),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(RentalRequestModel req) {
    final st = req.status.toUpperCase();

    if (st == 'PENDING_HOLD_PAYMENT' || st == 'HOLD_PENDING') {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _openPaymentScreen,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 15),
                backgroundColor: const Color(0xFFD97706),
              ),
              icon: const Icon(Icons.qr_code_2_rounded),
              label: const Text('Nộp 500k giữ chỗ qua VietQR', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _showSupplementDocumentsDialog,
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 13)),
              icon: const Icon(Icons.upload_file_rounded, size: 18),
              label: const Text('Bổ sung ảnh CCCD & GPLX'),
            ),
          ),
        ],
      );
    }

    if (st == 'HOLD_CONFIRMED') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _showSupplementDocumentsDialog,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 15),
            backgroundColor: const Color(0xFF2563EB),
          ),
          icon: const Icon(Icons.upload_file_rounded),
          label: const Text('Bổ sung ảnh CCCD & GPLX ngay', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      );
    }

    if (st == 'APPROVED' || st == 'PENDING_SIGNATURE') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _isNavigating ? null : _openContractScreen,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: const Color(0xFF2563EB),
          ),
          icon: _isNavigating
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Icon(Icons.draw_rounded),
          label: const Text('Xem & Ký Hợp Đồng Điện Tử', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      );
    }

    if (st == 'SIGNED') {
      return Column(
        children: [
          if (!req.isCashDeposit)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _openPaymentScreen,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: const Color(0xFF10B981),
                ),
                icon: const Icon(Icons.qr_code_2_rounded),
                label: const Text('Nộp Cọc Thế Chân qua VietQR', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _isNavigating ? null : _openContractScreen,
              icon: const Icon(Icons.description_outlined, size: 18),
              label: const Text('Xem Hợp Đồng Đã Ký'),
            ),
          ),
        ],
      );
    }

    if ((st == 'CONFIRMED' || st == 'DEPOSIT_PAID' || st == 'IN_TRANSIT') &&
        _handover != null &&
        !_handover!.isCompleted) {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _openHandoverConfirmScreen,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFF10B981),
              ),
              icon: const Icon(Icons.fact_check_rounded),
              label: const Text('Xác nhận & Ký Biên Bản Bàn Giao', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _isNavigating ? null : _openContractScreen,
              icon: const Icon(Icons.description_outlined, size: 18),
              label: const Text('Xem Hợp Đồng Điện Tử'),
            ),
          ),
        ],
      );
    }

    if (st == 'ACTIVE' || st == 'IN_PROGRESS' || st == 'RENTED') {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _showExtensionDialog,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: const Color(0xFF2563EB),
                  ),
                  icon: const Icon(Icons.more_time_rounded, size: 18),
                  label: const Text('Gia hạn thuê', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _showIncidentDialog,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: const Color(0xFFEF4444),
                  ),
                  icon: const Icon(Icons.emergency_rounded, size: 18),
                  label: const Text('Báo sự cố', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _isNavigating ? null : _openContractScreen,
              icon: const Icon(Icons.description_outlined, size: 18),
              label: const Text('Xem Hợp Đồng Điện Tử'),
            ),
          ),
        ],
      );
    }

    if (st == 'PENDING') {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: _showSupplementDocumentsDialog,
          style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 13)),
          icon: const Icon(Icons.upload_file_rounded, size: 18),
          label: const Text('Bổ sung ảnh CCCD & GPLX'),
        ),
      );
    }

    if (st == 'CANCELLED' || st == 'REJECTED') {
      return const SizedBox.shrink();
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

  Widget _buildReturnProtocolCard(ReturnProtocolModel ret) {
    final startOdo = _handover?.handoverOdo ?? ret.startOdo;
    final customerDrivenKm = ret.customerReturnOdo >= startOdo
        ? (ret.customerReturnOdo - startOdo)
        : ret.totalKmDriven;
    final customerDamages = ret.customerRentalDamages;
    final numFmt = NumberFormat('#,###', 'vi_VN');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.assignment_return_rounded, color: Color(0xFF22D3EE), size: 20),
              SizedBox(width: 8),
              Text('Biên Bản Nghiệm Thu Trả Xe', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow('ODO lúc bàn giao (handoverOdo)', '${numFmt.format(startOdo)} km'),
          _buildInfoRow('ODO lúc khách trả (customerReturnOdo)', '${numFmt.format(ret.customerReturnOdo)} km'),
          _buildInfoRow('Quãng đường khách đã dùng', '${numFmt.format(customerDrivenKm)} km', isHighlight: true),
          if (ret.maxKmAllowed != null)
            _buildInfoRow('Hạn mức cho phép / Vượt km', '${numFmt.format(ret.maxKmAllowed!)} km • Vượt ${numFmt.format(ret.excessKm)} km'),
          const Divider(height: 14),
          _buildInfoRow(
            'Mức xăng/pin giao → trả',
            '${ret.initialFuelLevel}% → ${ret.customerReturnFuelLevel.toStringAsFixed(0)}% (dung sai miễn phạt 3%)',
          ),
          if (customerDamages.isNotEmpty) ...[
            const Divider(height: 14),
            Text(
              'Vết xước phát sinh trong chuyến đi (${customerDamages.length} điểm - CUSTOMER_RENTAL):',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFFCA5A5)),
            ),
            const SizedBox(height: 4),
            ...customerDamages.map((d) => Padding(
                  padding: const EdgeInsets.only(bottom: 3),
                  child: Text(
                    '• ${d.note}${d.fee > 0 ? " (${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(d.fee)})" : ""}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1)),
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _buildSettlementSection() {
    if (_isLoadingExtras && _settlement == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    final s = _settlement;
    if (s == null) return const SizedBox.shrink();

    final canDispute = !s.isDisputed && s.status.toUpperCase() == 'PENDING';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Row(
                  children: [
                    Icon(Icons.shield_rounded, color: Color(0xFFF59E0B), size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Quyết Toán Hoàn Cọc 2 Đợt',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              if (s.isDisputed)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFEF4444)),
                  ),
                  child: const Text('ĐANG KHIẾU NẠI',
                      style: TextStyle(fontSize: 10, color: Color(0xFFEF4444), fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 14),

          const Text('Chi tiết phụ phí khấu trừ:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
          const SizedBox(height: 6),
          _buildInfoRow('Phí vượt hạn mức km', s.formatCurrency(s.extraKmFee)),
          _buildInfoRow('Phí trễ hạn trả xe', s.formatCurrency(s.lateReturnFee)),
          _buildInfoRow('Phí chênh lệch xăng/pin (có dung sai 3%)', s.formatCurrency(s.fuelFee)),
          _buildInfoRow('Phí vệ sinh khoang xe', s.formatCurrency(s.cleaningFee)),
          _buildInfoRow('Bồi thường vết xước (CUSTOMER_RENTAL)', s.formatCurrency(s.damageFee)),
          if (s.otherFee > 0) _buildInfoRow('Phụ phí khác', s.formatCurrency(s.otherFee)),
          const Divider(height: 16),
          _buildInfoRow('Tổng tiền khấu trừ', s.formatCurrency(s.totalDeduction), isHighlight: true),
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
                    const Expanded(
                      child: Text('ĐỢT 1: Hoàn cọc dư sau quyết toán',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF60A5FA))),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: s.isRound1Refunded
                            ? const Color(0xFF10B981).withValues(alpha: 0.2)
                            : const Color(0xFFF59E0B).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        s.isRound1Refunded ? 'ĐÃ HOÀN VIETQR' : 'CHỜ XỬ LÝ',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: s.isRound1Refunded ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  s.additionalAmountDue > 0
                      ? 'Cần thu thêm: ${s.formatCurrency(s.additionalAmountDue)}'
                      : 'Số tiền hoàn đợt 1: ${s.formatCurrency(s.refundAmount)}',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Round 2 Traffic Fine Hold (2,000,000đ)
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
                    const Expanded(
                      child: Text('ĐỢT 2: Quỹ phạt nguội CSGT (15–30 ngày)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: s.trafficFineRefundStatus == 'REFUNDED'
                            ? const Color(0xFF10B981).withValues(alpha: 0.2)
                            : const Color(0xFFF59E0B).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        s.trafficFineRefundStatus == 'REFUNDED' ? 'ĐÃ HOÀN TRẢ' : 'ĐANG TẠM GIỮ',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: s.trafficFineRefundStatus == 'REFUNDED'
                              ? const Color(0xFF10B981)
                              : const Color(0xFFF59E0B),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Số tiền tạm giữ: ${s.formatCurrency(s.trafficFineHoldAmount > 0 ? s.trafficFineHoldAmount : 2000000)}',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                if (s.trafficFineNotes != null && s.trafficFineNotes!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text('Ghi chú: ${s.trafficFineNotes}',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                ],
              ],
            ),
          ),

          if (canDispute) ...[
            const SizedBox(height: 16),
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
              Text('Lịch trình & Hình thức nhận xe', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            'Hình thức',
            req.isDelivery
                ? 'Giao xe tận nơi (~${(req.estimatedDeliveryDistanceKm ?? 0).toStringAsFixed(0)} km)'
                : 'Nhận tại bãi VELORA (0 km)',
          ),
          const Divider(height: 14),
          _buildInfoRow('Nhận xe', '${dateFormat.format(req.startTime.toLocal())} • ${req.pickupLocation}'),
          const Divider(height: 14),
          _buildInfoRow('Trả xe', '${dateFormat.format(req.endTime.toLocal())} • ${req.dropoffLocation}'),
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
          _buildInfoRow('CCCD / CMND', req.customerIdCard.isNotEmpty ? req.customerIdCard : 'Chưa bổ sung'),
          const Divider(height: 14),
          _buildInfoRow(
            'Giấy phép lái xe',
            '${req.driverLicenseNumber.isNotEmpty ? req.driverLicenseNumber : "Chưa bổ sung"} (${req.driverLicenseClass ?? "B2"})',
          ),
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
          _buildInfoRow(
            'Chế độ đặt xe',
            req.isFastHold
                ? 'Fast Hold 500k (Giữ xe 4h)'
                : (req.isCashDeposit ? 'Cọc tiền mặt khi nhận xe' : 'Chuyển khoản VietQR (-5%)'),
          ),
          const Divider(height: 14),
          _buildInfoRow('Tiền thuê xe dự tính', req.formattedTotalFee),
          const Divider(height: 14),
          _buildInfoRow('Tiền cọc thế chân (Escrow)', req.formattedDeposit, isHighlight: true),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 3,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isHighlight ? const Color(0xFFF59E0B) : Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
