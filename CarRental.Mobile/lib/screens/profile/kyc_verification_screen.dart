import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/auth_service.dart';

class KycVerificationScreen extends StatefulWidget {
  const KycVerificationScreen({super.key});

  @override
  State<KycVerificationScreen> createState() => _KycVerificationScreenState();
}

class _KycVerificationScreenState extends State<KycVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final AuthService _authService = AuthService();

  final TextEditingController _idCardController = TextEditingController();
  final TextEditingController _licenseNumberController = TextEditingController();
  final TextEditingController _cccdFrontUrlController = TextEditingController();
  final TextEditingController _cccdBackUrlController = TextEditingController();
  final TextEditingController _gplxFrontUrlController = TextEditingController();
  final TextEditingController _gplxBackUrlController = TextEditingController();

  String _licenseClass = 'B2';
  DateTime? _dateOfBirth;
  DateTime? _licenseIssueDate;
  bool _isSaving = false;

  final List<String> _licenseClasses = ['B1_AUTO', 'B1', 'B2', 'C', 'D'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user != null) {
        setState(() {
          _dateOfBirth = user.dateOfBirth;
          _licenseIssueDate = user.licenseIssueDate;
          final cls = user.effectiveLicenseClass;
          if (cls != null && _licenseClasses.contains(cls.toUpperCase())) {
            _licenseClass = cls.toUpperCase();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _idCardController.dispose();
    _licenseNumberController.dispose();
    _cccdFrontUrlController.dispose();
    _cccdBackUrlController.dispose();
    _gplxFrontUrlController.dispose();
    _gplxBackUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateOfBirth ?? DateTime(now.year - 25, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime(now.year - 18, now.month, now.day),
    );
    if (picked != null) setState(() => _dateOfBirth = picked);
  }

  Future<void> _pickLicenseIssueDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _licenseIssueDate ?? DateTime(now.year - 2, 1, 1),
      firstDate: DateTime(1970),
      lastDate: now,
    );
    if (picked != null) setState(() => _licenseIssueDate = picked);
  }

  Future<void> _submitKyc() async {
    if (!_formKey.currentState!.validate()) return;
    if (_dateOfBirth == null || _licenseIssueDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn đầy đủ Ngày sinh và Ngày cấp GPLX.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    final res = await _authService.updateMyKyc(
      idCardNumber: _idCardController.text.trim(),
      driverLicenseNumber: _licenseNumberController.text.trim(),
      licenseClass: _licenseClass,
      dateOfBirth: _dateOfBirth,
      licenseIssueDate: _licenseIssueDate,
      idCardFrontUrl: _cccdFrontUrlController.text.trim(),
      idCardBackUrl: _cccdBackUrlController.text.trim(),
      driverLicenseFrontUrl: _gplxFrontUrlController.text.trim(),
      driverLicenseBackUrl: _gplxBackUrlController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isSaving = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(res['message'] ?? ''),
        backgroundColor: res['success'] == true
            ? const Color(0xFF10B981)
            : const Color(0xFFEF4444),
      ),
    );

    if (res['success'] == true) {
      await Provider.of<AuthProvider>(context, listen: false).checkAuthStatus();
      if (mounted) Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final dateFmt = DateFormat('dd/MM/yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Xác minh danh tính (KYC)'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Current KYC status banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: (user?.isKycVerified == true
                          ? const Color(0xFF10B981)
                          : const Color(0xFFF59E0B))
                      .withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: user?.isKycVerified == true
                        ? const Color(0xFF10B981)
                        : const Color(0xFFF59E0B),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      user?.isKycVerified == true
                          ? Icons.verified_user_rounded
                          : Icons.gpp_maybe_outlined,
                      color: user?.isKycVerified == true
                          ? const Color(0xFF10B981)
                          : const Color(0xFFF59E0B),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Trạng thái hiện tại: ${user?.kycStatusDisplayName ?? "Chưa xác minh"}',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Cập nhật thông tin CCCD & GPLX để mở khóa đặt các dòng xe cao cấp / thể thao.',
                            style: TextStyle(fontSize: 11, color: Color(0xFFCBD5E1)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              const Text('1. Thông tin định danh & GPLX', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextFormField(
                controller: _idCardController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Số CCCD gắn chip *',
                  prefixIcon: Icon(Icons.credit_card_rounded, size: 20),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Vui lòng nhập số CCCD' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      controller: _licenseNumberController,
                      decoration: const InputDecoration(
                        labelText: 'Số Giấy phép lái xe *',
                        prefixIcon: Icon(Icons.badge_outlined, size: 20),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Vui lòng nhập số GPLX' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: DropdownButtonFormField<String>(
                      initialValue: _licenseClass,
                      decoration: const InputDecoration(labelText: 'Hạng bằng'),
                      items: _licenseClasses
                          .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => _licenseClass = v);
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: _pickDob,
                      borderRadius: BorderRadius.circular(12),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Ngày sinh *',
                          prefixIcon: Icon(Icons.cake_outlined, size: 18),
                        ),
                        child: Text(
                          _dateOfBirth != null ? dateFmt.format(_dateOfBirth!) : 'Chọn ngày',
                          style: TextStyle(
                            fontSize: 13,
                            color: _dateOfBirth != null ? Colors.white : const Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: _pickLicenseIssueDate,
                      borderRadius: BorderRadius.circular(12),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Ngày cấp GPLX *',
                          prefixIcon: Icon(Icons.event_note_rounded, size: 18),
                        ),
                        child: Text(
                          _licenseIssueDate != null ? dateFmt.format(_licenseIssueDate!) : 'Chọn ngày',
                          style: TextStyle(
                            fontSize: 13,
                            color: _licenseIssueDate != null ? Colors.white : const Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),

              const Text('2. Ảnh giấy tờ (URL hoặc Base64)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text(
                'Cung cấp đường dẫn ảnh chụp rõ nét 2 mặt CCCD & GPLX để Ban thẩm định VELORA đối chiếu nhanh.',
                style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _cccdFrontUrlController,
                decoration: const InputDecoration(
                  labelText: 'Ảnh mặt trước CCCD (URL)',
                  prefixIcon: Icon(Icons.image_outlined, size: 18),
                ),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _cccdBackUrlController,
                decoration: const InputDecoration(
                  labelText: 'Ảnh mặt sau CCCD (URL)',
                  prefixIcon: Icon(Icons.image_outlined, size: 18),
                ),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _gplxFrontUrlController,
                decoration: const InputDecoration(
                  labelText: 'Ảnh mặt trước GPLX (URL)',
                  prefixIcon: Icon(Icons.image_outlined, size: 18),
                ),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _gplxBackUrlController,
                decoration: const InputDecoration(
                  labelText: 'Ảnh mặt sau GPLX (URL)',
                  prefixIcon: Icon(Icons.image_outlined, size: 18),
                ),
              ),
              const SizedBox(height: 28),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _submitKyc,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: const Color(0xFF2563EB),
                  ),
                  icon: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.verified_user_rounded),
                  label: Text(
                    _isSaving ? 'Đang gửi hồ sơ KYC...' : 'Gửi hồ sơ xác minh KYC',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
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
}
