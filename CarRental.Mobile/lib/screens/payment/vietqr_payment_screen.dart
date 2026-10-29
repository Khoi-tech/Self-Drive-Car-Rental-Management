import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/payment_model.dart';
import '../../services/payment_service.dart';
import '../home/home_screen.dart';

class VietQrPaymentScreen extends StatefulWidget {
  final String requestId;
  final String? contractId;
  final String carName;
  final String licensePlate;

  const VietQrPaymentScreen({
    super.key,
    required this.requestId,
    this.contractId,
    required this.carName,
    required this.licensePlate,
  });

  @override
  State<VietQrPaymentScreen> createState() => _VietQrPaymentScreenState();
}

class _VietQrPaymentScreenState extends State<VietQrPaymentScreen> {
  final PaymentService _paymentService = PaymentService();

  PaymentModel? _payment;
  bool _isLoading = true;
  bool _isConfirming = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadPayment();
  }

  Future<void> _loadPayment() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final payment = await _paymentService.createDepositPayment(
        requestId: widget.requestId,
        contractId: widget.contractId,
      );
      if (mounted) {
        setState(() {
          _payment = payment;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã sao chép $label: $text'),
        backgroundColor: const Color(0xFF10B981),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _handleConfirmPayment() async {
    if (_payment == null) return;

    setState(() => _isConfirming = true);

    try {
      final updated = await _paymentService.confirmPayment(_payment!.transactionCode);
      if (!mounted) return;
      setState(() {
        _payment = updated;
        _isConfirming = false;
      });

      _showSuccessDialog();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isConfirming = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 28),
            SizedBox(width: 8),
            Text('Thanh Toán Thành Công!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Số tiền: ${_payment?.formattedAmount ?? ""}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text('Mã giao dịch: ${_payment?.transactionCode ?? ""}'),
            const SizedBox(height: 6),
            const Text(
              'Trạng thái: ĐÃ XÁC NHẬN CỌC (CONFIRMED)',
              style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold),
            ),
            const Divider(height: 20),
            const Text(
              'Đơn thuê đã sẵn sàng! Nhân viên VELORA sẽ kiểm tra xe và liên hệ bàn giao xe cho bạn theo lịch hẹn.',
              style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const HomeScreen()),
                (route) => false,
              );
            },
            child: const Text('Về Trang Chủ'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán cọc VietQR'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(strokeWidth: 2.5),
            SizedBox(height: 16),
            Text('Đang tạo mã VietQR thanh toán cọc...', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, size: 54, color: Color(0xFFEF4444)),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Color(0xFFCBD5E1)),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadPayment,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    final payment = _payment!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Order Summary Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.qr_code_2_rounded, color: Color(0xFF60A5FA), size: 28),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tiền cọc xe ${widget.carName}',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Biển số: ${widget.licensePlate} • Mã GD: ${payment.transactionCode}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Dynamic VietQR Box (White background container for high scanner contrast)
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.25),
                    blurRadius: 15,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Bank Logo Bar
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E3A8A),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'MBBANK',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'VietQR • Napas247',
                        style: TextStyle(
                          color: Color(0xFF1E3A8A),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // VietQR Image
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.network(
                      payment.qrCodeUrl,
                      width: 230,
                      height: 230,
                      fit: BoxFit.contain,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          width: 230,
                          height: 230,
                          color: Colors.grey.shade100,
                          child: const Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        );
                      },
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 230,
                        height: 230,
                        color: Colors.grey.shade100,
                        child: const Center(
                          child: Icon(Icons.qr_code_rounded, size: 60, color: Colors.grey),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    payment.formattedAmount,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF1E3A8A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Quét mã bằng ứng dụng Ngân hàng',
                    style: TextStyle(fontSize: 10, color: Colors.black54),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Bank Account Details List with 1-Click Copy
          Container(
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
                    Icon(Icons.account_balance_rounded, size: 16, color: Color(0xFF2563EB)),
                    SizedBox(width: 8),
                    Text(
                      'Thông tin chuyển khoản thủ công:',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildCopyRow('Ngân hàng', payment.bankName, 'Tên ngân hàng'),
                const Divider(height: 16),
                _buildCopyRow('Số tài khoản', payment.accountNumber, 'Số tài khoản'),
                const Divider(height: 16),
                _buildCopyRow('Chủ tài khoản', payment.accountName, 'Tên người thụ hưởng'),
                const Divider(height: 16),
                _buildCopyRow('Số tiền cọc', payment.formattedAmount, 'Số tiền'),
                const Divider(height: 16),
                _buildCopyRow(
                  'Nội dung chuyển khoản',
                  payment.transferContent,
                  'Nội dung CK',
                  isImportant: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Security & Escrow Note
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.shield_outlined, size: 18, color: Color(0xFF10B981)),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Tiền cọc được khóa bảo chứng trong tài khoản Escrow của VELORA và được hoàn trả tự động sau khi kết thúc hợp đồng thuê xe.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8), height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Confirm Button
          ElevatedButton.icon(
            onPressed: _isConfirming ? null : _handleConfirmPayment,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: const Color(0xFF10B981),
            ),
            icon: _isConfirming
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.check_circle_outline_rounded),
            label: Text(
              _isConfirming ? 'Đang đối soát giao dịch...' : 'Tôi Đã Chuyển Tiền Thành Công',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 12),

          // Return Home Option
          OutlinedButton(
            onPressed: () {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const HomeScreen()),
                (route) => false,
              );
            },
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text('Thanh toán sau (Về trang chủ)'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildCopyRow(String label, String value, String copyName, {bool isImportant = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isImportant ? const Color(0xFFF59E0B) : Colors.white,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Sao chép',
          icon: const Icon(Icons.copy_rounded, size: 18, color: Color(0xFF60A5FA)),
          onPressed: () => _copyToClipboard(value, copyName),
        ),
      ],
    );
  }
}
