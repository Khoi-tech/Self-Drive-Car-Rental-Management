import 'package:flutter/material.dart';
import '../../models/contract_model.dart';
import '../../services/rental_service.dart';
import '../../widgets/signature_pad.dart';
import '../home/home_screen.dart';
import '../payment/vietqr_payment_screen.dart';

class ContractSignScreen extends StatefulWidget {
  final RentalContractModel contract;

  const ContractSignScreen({super.key, required this.contract});

  @override
  State<ContractSignScreen> createState() => _ContractSignScreenState();
}

class _ContractSignScreenState extends State<ContractSignScreen> {
  final RentalService _rentalService = RentalService();
  final SignaturePadController _padController = SignaturePadController();
  final TextEditingController _signerNameController = TextEditingController();

  bool _agreeTerms = true;
  bool _isSigning = false;
  late RentalContractModel _currentContract;

  @override
  void initState() {
    super.initState();
    _currentContract = widget.contract;
    _signerNameController.text = (widget.contract.customerName ?? '').toUpperCase();
  }

  @override
  void dispose() {
    _padController.dispose();
    _signerNameController.dispose();
    super.dispose();
  }

  Future<void> _handleSignContract() async {
    if (!_agreeTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đồng ý với các điều khoản hợp đồng trước khi ký!'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_padController.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng ký tên của bạn lên bảng cảm ứng!'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_signerNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập họ tên người ký để xác thực pháp lý!'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() => _isSigning = true);

    try {
      final signed = await _rentalService.signContract(
        _currentContract.id,
        _signerNameController.text.trim(),
      );

      if (!mounted) return;
      setState(() {
        _currentContract = signed;
        _isSigning = false;
      });

      _showSuccessDialog();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSigning = false);
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
            Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 28),
            SizedBox(width: 8),
            Text('Ký Hợp Đồng Thành Công!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Số hợp đồng: ${_currentContract.contractNumber}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text('Người ký: ${_signerNameController.text.trim()}'),
            const SizedBox(height: 6),
            const Text('Trạng thái: ĐÃ KÝ ĐIỆN TỬ (SIGNED)', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
            const Divider(height: 20),
            const Text(
              'Hợp đồng đã được lưu trữ vĩnh viễn trên hệ thống và chuyển sang giai đoạn Chờ thanh toán cọc VietQR.',
              style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const HomeScreen()),
                (route) => false,
              );
            },
            child: const Text('Để sau'),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (_) => VietQrPaymentScreen(
                    requestId: _currentContract.requestId ?? '',
                    contractId: _currentContract.id,
                    carName: '${_currentContract.carMake ?? ""} ${_currentContract.carModel ?? ""}'.trim(),
                    licensePlate: _currentContract.carLicensePlate ?? '',
                  ),
                ),
              );
            },
            icon: const Icon(Icons.qr_code_2_rounded, size: 18),
            label: const Text('Thanh Toán Cọc VietQR'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final contract = _currentContract;

    return Scaffold(
      appBar: AppBar(
        title: Text('Hợp đồng ${contract.contractNumber}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Legal Header Emblem
            Center(
              child: Column(
                children: [
                  const Text(
                    'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Độc lập - Tự do - Hạnh phúc',
                    style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF2563EB).withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      'HỢP ĐỒNG THUÊ XE TỰ LÁI • ${contract.contractNumber}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF60A5FA),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Contracting Parties Card
            _buildContractOverview(contract),
            const SizedBox(height: 20),

            // Terms & Conditions Container
            const Text(
              'Điều khoản & Cam kết pháp lý',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            _buildTermsContainer(contract),
            const SizedBox(height: 24),

            // Signature Section
            if (contract.isSigned)
              _buildAlreadySignedBadge(contract)
            else
              _buildSignaturePadSection(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildContractOverview(RentalContractModel contract) {
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
              Icon(Icons.apartment_rounded, size: 18, color: Color(0xFF2563EB)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'BÊN CHO THUÊ (BÊN A): CÔNG TY TNHH VELORA VIỆT NAM',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const Divider(height: 16),
          Row(
            children: [
              const Icon(Icons.person_rounded, size: 18, color: Color(0xFF10B981)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'BÊN THUÊ XE (BÊN B): ${contract.customerName ?? "Khách hàng"}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'CCCD: ${contract.customerIdCard ?? "---"} • GPLX: ${contract.driverLicenseNumber ?? "---"} • SĐT: ${contract.customerPhone ?? "---"}',
            style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
          ),
          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Phương tiện thuê', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                  Text(
                    '${contract.carMake ?? ""} ${contract.carModel ?? ""}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  Text('Biển số: ${contract.carLicensePlate ?? ""}', style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1))),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('Tiền cọc bảo đảm', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                  Text(
                    contract.formattedDeposit,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTermsContainer(RentalContractModel contract) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTermItem(
            'Điều 1: Bàn giao xe & Tình trạng kỹ thuật',
            'Bên A bàn giao xe đúng chủng loại, hồ sơ lưu hành hợp pháp. Hai bên cùng ký nhận Biên bản bàn giao về số ODO, mức nhiên liệu Same-Level và sơ đồ vết xước hiện trạng.',
          ),
          _buildTermItem(
            'Điều 2: Cơ chế Quyết toán Hoàn cọc 2 Đợt (Escrow)',
            '• Đợt 1: Hoàn cọc còn lại ngay khi hoàn tất kiểm tra trả xe (giữ lại 2.000.000đ cọc phạt nguội).\n• Đợt 2: Đối soát vi phạm CSGT (phatnguoi.vn) sau 15–30 ngày và hoàn trả toàn bộ số tiền còn lại.',
          ),
          _buildTermItem(
            'Điều 3: Trách nhiệm & Phụ phí phát sinh',
            'Khách hàng chịu trách nhiệm với các vi phạm luật giao thông trong thời gian thuê. Phí vệ sinh 200.000đ nếu xe bẩn. Bù trừ nhiên liệu thiếu theo giá thị trường.',
          ),
        ],
      ),
    );
  }

  Widget _buildTermItem(String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF60A5FA))),
          const SizedBox(height: 2),
          Text(desc, style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), height: 1.4)),
        ],
      ),
    );
  }

  Widget _buildAlreadySignedBadge(RentalContractModel contract) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981).withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF10B981)),
      ),
      child: Column(
        children: [
          const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 48),
          const SizedBox(height: 10),
          const Text(
            'HỢP ĐỒNG ĐÃ ĐƯỢC KÝ ĐIỆN TỬ HỢP LỆ',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
          ),
          const SizedBox(height: 4),
          Text(
            'Chữ ký số: ${contract.customerSignature ?? contract.customerName}',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildSignaturePadSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Row(
              children: [
                Icon(Icons.draw_rounded, size: 18, color: Color(0xFF2563EB)),
                SizedBox(width: 8),
                Text(
                  'Bảng Ký Điện Tử Cảm Ứng (Touchscreen)',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            if (_padController.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('Đã có nét ký', style: TextStyle(fontSize: 10, color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
              ),
          ],
        ),
        const SizedBox(height: 6),
        const Text(
          'Dùng ngón tay hoặc bút cảm ứng vẽ trực tiếp chữ ký của bạn vào khung bên dưới:',
          style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 12),

        // Signature Pad Canvas
        SignaturePad(
          controller: _padController,
          height: 190,
          strokeColor: const Color(0xFF93C5FD),
          strokeWidth: 3.0,
        ),
        const SizedBox(height: 16),

        // Typed Full Name Input (Legal validation)
        TextFormField(
          controller: _signerNameController,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(
            labelText: 'Họ và tên người ký xác nhận (Chữ in hoa)',
            prefixIcon: Icon(Icons.badge_outlined, size: 20),
            hintText: 'NGUYEN VAN A',
          ),
        ),
        const SizedBox(height: 14),

        // Agreement Checkbox
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          value: _agreeTerms,
          onChanged: (val) {
            setState(() => _agreeTerms = val ?? false);
          },
          title: const Text(
            'Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ điều khoản hợp đồng thuê xe điện tử VELORA.',
            style: TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
          ),
          controlAffinity: ListTileControlAffinity.leading,
          activeColor: const Color(0xFF2563EB),
        ),
        const SizedBox(height: 20),

        // Submit Sign Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isSigning ? null : _handleSignContract,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: const Color(0xFF2563EB),
            ),
            icon: _isSigning
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.verified_user_rounded),
            label: Text(
              _isSigning ? 'Đang xác thực chữ ký...' : 'Xác Nhận Ký Hợp Đồng Số',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }
}
