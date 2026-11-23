import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/auth_service.dart';
import '../../services/car_service.dart';
import '../../services/notification_service.dart';
import '../../widgets/server_config_dialog.dart';
import '../auth/login_screen.dart';
import 'kyc_verification_screen.dart';
import 'notifications_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AuthService _authService = AuthService();
  final CarService _carService = CarService();
  final NotificationService _notificationService = NotificationService();

  String _currentServerUrl = '';
  int _unreadCount = 0;
  List<Map<String, dynamic>> _allTiers = [];

  @override
  void initState() {
    super.initState();
    _loadServerUrl();
    _refreshProfileAndBadge();
  }

  Future<void> _loadServerUrl() async {
    final url = await ApiConstants.getBaseUrl();
    if (mounted) {
      setState(() {
        _currentServerUrl = url;
      });
    }
  }

  Future<void> _refreshProfileAndBadge() async {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      await Provider.of<AuthProvider>(context, listen: false).checkAuthStatus();
      final results = await Future.wait([
        _notificationService.getUnreadCount(),
        _carService.getMembershipTiers(),
      ]);
      if (mounted) {
        setState(() {
          _unreadCount = results[0] as int;
          _allTiers = results[1] as List<Map<String, dynamic>>;
        });
      }
    });
  }

  void _showChangePasswordDialog() {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.lock_reset_rounded, color: Color(0xFF3B82F6)),
              SizedBox(width: 8),
              Text('Đổi mật khẩu'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: currentCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Mật khẩu hiện tại',
                  prefixIcon: Icon(Icons.lock_outline, size: 18),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: newCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Mật khẩu mới (tối thiểu 6 ký tự)',
                  prefixIcon: Icon(Icons.vpn_key_outlined, size: 18),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: confirmCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Nhập lại mật khẩu mới',
                  prefixIcon: Icon(Icons.check_circle_outline, size: 18),
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
                      final curr = currentCtrl.text.trim();
                      final next = newCtrl.text.trim();
                      final conf = confirmCtrl.text.trim();

                      if (curr.isEmpty || next.length < 6) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới tối thiểu 6 ký tự.'),
                            backgroundColor: Color(0xFFEF4444),
                          ),
                        );
                        return;
                      }
                      if (next != conf) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Xác nhận mật khẩu mới không khớp.'),
                            backgroundColor: Color(0xFFEF4444),
                          ),
                        );
                        return;
                      }

                      setDialogState(() => isSaving = true);
                      final res = await _authService.changePassword(
                        currentPassword: curr,
                        newPassword: next,
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
              child: Text(isSaving ? 'Đang lưu...' : 'Cập nhật'),
            ),
          ],
        ),
      ),
    );
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            onPressed: () async {
              Navigator.of(ctx).pop();
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );
  }

  Color _kycColor(String? status) {
    switch ((status ?? '').toUpperCase()) {
      case 'VERIFIED':
        return const Color(0xFF10B981);
      case 'PENDING':
        return const Color(0xFFF59E0B);
      case 'REJECTED':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  Color _tierColor(String? tier) {
    switch ((tier ?? 'STANDARD').toUpperCase()) {
      case 'PLATINUM':
        return const Color(0xFF818CF8);
      case 'GOLD':
        return const Color(0xFFF59E0B);
      case 'SILVER':
        return const Color(0xFFCBD5E1);
      default:
        return const Color(0xFF60A5FA);
    }
  }

  Color _trustColor(int score) {
    if (score >= 90) return const Color(0xFF10B981);
    if (score >= 80) return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  void _showAllTiersBottomSheet(String currentTier) {
    final currencyFmt = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.72,
        maxChildSize: 0.9,
        minChildSize: 0.45,
        builder: (_, scrollController) => Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              const Row(
                children: [
                  Icon(Icons.workspace_premium_rounded, color: Color(0xFFF59E0B)),
                  SizedBox(width: 8),
                  Text(
                    'Bảng Quyền Lợi Hạng Thành Viên',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Điều kiện xét hạng tính trên số chuyến đã hoàn thành (COMPLETED), tổng chi tiêu và điểm tín nhiệm.',
                style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 14),
              Expanded(
                child: _allTiers.isEmpty
                    ? const Center(
                        child: Text(
                          'Chưa tải được bảng cấu hình hạng từ máy chủ.',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                        ),
                      )
                    : ListView.separated(
                        controller: scrollController,
                        itemCount: _allTiers.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (_, idx) {
                          final item = _allTiers[idx];
                          final tierCode = (item['tier']?.toString() ?? 'STANDARD').toUpperCase();
                          final isCurrent = tierCode == currentTier.toUpperCase();
                          final color = _tierColor(tierCode);
                          final minTrips = (item['minCompletedTrips'] is num)
                              ? (item['minCompletedTrips'] as num).toInt()
                              : 0;
                          final minSpend = (item['minTotalSpend'] is num)
                              ? (item['minTotalSpend'] as num).toDouble()
                              : 0.0;
                          final minTrust = (item['minTrustScore'] is num)
                              ? (item['minTrustScore'] as num).toInt()
                              : 0;
                          final earlyPct = (item['earlyBookingDiscountPercent'] is num)
                              ? (item['earlyBookingDiscountPercent'] as num).toDouble()
                              : 0.0;
                          final earlyDays = (item['earlyBookingDays'] is num)
                              ? (item['earlyBookingDays'] as num).toInt()
                              : 7;
                          final freeWash = item['freeCarWash'] == true;
                          final bonusKm = (item['bonusKmPerDay'] is num)
                              ? (item['bonusKmPerDay'] as num).toInt()
                              : 0;
                          final perksText = item['perksText']?.toString() ?? '';

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isCurrent
                                  ? color.withValues(alpha: 0.12)
                                  : const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isCurrent
                                    ? color
                                    : Colors.white.withValues(alpha: 0.08),
                                width: isCurrent ? 1.5 : 1,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.workspace_premium_rounded, color: color, size: 18),
                                        const SizedBox(width: 6),
                                        Text(
                                          item['label']?.toString() ?? tierCode,
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: color,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (isCurrent)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: color,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: const Text(
                                          'HẠNG HIỆN TẠI',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: Color(0xFF0F172A),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  tierCode == 'STANDARD'
                                      ? 'Điều kiện: Mặc định khi đăng ký tài khoản'
                                      : 'Điều kiện: ≥ $minTrips chuyến hoàn thành hoặc ≥ ${currencyFmt.format(minSpend)}${minTrust > 0 ? " • Tín nhiệm ≥ $minTrust" : ""}',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                ),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: [
                                    if (earlyPct > 0)
                                      _buildMiniPerkChip(
                                        'Giảm ${earlyPct.toStringAsFixed(0)}% đặt trước ≥ $earlyDays ngày',
                                        const Color(0xFFF59E0B),
                                      ),
                                    if (freeWash)
                                      _buildMiniPerkChip(
                                        'Miễn phí rửa xe tiêu chuẩn',
                                        const Color(0xFF10B981),
                                      ),
                                    if (bonusKm > 0)
                                      _buildMiniPerkChip(
                                        '+$bonusKm km/ngày',
                                        const Color(0xFF60A5FA),
                                      ),
                                  ],
                                ),
                                if (perksText.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    perksText,
                                    style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), height: 1.4),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMiniPerkChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }

  Widget _buildMembershipCard(UserModel user) {
    final tierColor = _tierColor(user.membershipTier);
    final trustColor = _trustColor(user.trustScore);
    final currencyFmt = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);
    final progressValue = (user.tierProgressPercent.clamp(0, 100)) / 100.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            tierColor.withValues(alpha: 0.16),
            const Color(0xFF1E293B),
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: tierColor.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: tierColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.workspace_premium_rounded, color: tierColor, size: 22),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.membershipTierLabel,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: tierColor,
                      ),
                    ),
                    Text(
                      'Hạng ${user.membershipTier}',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: trustColor.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: trustColor.withValues(alpha: 0.6)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_rounded, color: trustColor, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      'Tín nhiệm ${user.trustScore}/100',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: trustColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Stats row: Completed trips & Total spent
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Chuyến hoàn thành',
                        style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${user.completedTrips} chuyến',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Tổng chi tiêu tích lũy',
                        style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        currencyFmt.format(user.totalSpent),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Progress bar to next tier
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  user.nextTier != null
                      ? (user.completedTripsToNextTier > 0
                          ? 'Còn ${user.completedTripsToNextTier} chuyến hoàn thành để lên ${user.nextTierLabel ?? user.nextTier}'
                          : 'Đủ chuyến — cần Tín nhiệm ≥ ${user.requiredTrustScoreForNextTier} để lên ${user.nextTierLabel ?? user.nextTier}')
                      : 'Bạn đang ở hạng thành viên cao nhất (Platinum)',
                  style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), fontWeight: FontWeight.w500),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${user.tierProgressPercent}%',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: tierColor),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progressValue,
              minHeight: 7,
              backgroundColor: Colors.white.withValues(alpha: 0.1),
              valueColor: AlwaysStoppedAnimation<Color>(tierColor),
            ),
          ),

          if (user.membershipPerks.isNotEmpty) ...[
            const SizedBox(height: 14),
            const Text(
              'Quyền lợi hiện tại của bạn:',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
            ),
            const SizedBox(height: 6),
            ...user.membershipPerks.map(
              (perk) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.auto_awesome_rounded, size: 13, color: tierColor),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        perk,
                        style: const TextStyle(fontSize: 12, color: Colors.white, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              style: TextButton.styleFrom(
                foregroundColor: tierColor,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              icon: const Icon(Icons.info_outline_rounded, size: 15),
              label: const Text('Xem bảng quyền lợi 4 hạng', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              onPressed: () => _showAllTiersBottomSheet(user.membershipTier),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final dateFmt = DateFormat('dd/MM/yyyy');
    final kycColor = _kycColor(user?.kycStatus);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tài khoản của tôi'),
        actions: [
          IconButton(
            tooltip: 'Làm mới hồ sơ',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refreshProfileAndBadge,
          ),
          if (kDebugMode)
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () async {
                final updated = await showDialog<bool>(
                  context: context,
                  builder: (_) => const ServerConfigDialog(),
                );
                if (updated == true) {
                  _loadServerUrl();
                }
              },
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshProfileAndBadge,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Avatar & Name Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF2563EB).withValues(alpha: 0.18),
                      const Color(0xFF1E293B),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF2563EB).withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 34,
                      backgroundColor: const Color(0xFF2563EB),
                      child: Text(
                        user?.fullName.isNotEmpty == true
                            ? user!.fullName.substring(0, 1).toUpperCase()
                            : 'U',
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.fullName ?? 'Khách hàng VELORA',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user?.email ?? '',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              if (user != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: _tierColor(user.membershipTier).withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: _tierColor(user.membershipTier)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.workspace_premium_rounded,
                                        size: 11,
                                        color: _tierColor(user.membershipTier),
                                      ),
                                      const SizedBox(width: 3),
                                      Text(
                                        user.membershipTierLabel,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: _tierColor(user.membershipTier),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: kycColor.withValues(alpha: 0.18),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: kycColor),
                                ),
                                child: Text(
                                  user?.kycStatusDisplayName ?? 'Chưa xác minh KYC',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: kycColor,
                                  ),
                                ),
                              ),
                              if (user?.effectiveLicenseClass != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF3B82F6).withValues(alpha: 0.18),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFF3B82F6)),
                                  ),
                                  child: Text(
                                    'GPLX ${user!.effectiveLicenseClass}',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF60A5FA),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Membership Tier & TrustScore Card (Single Source of Truth from Backend)
              if (user != null) ...[
                _buildMembershipCard(user),
                const SizedBox(height: 20),
              ],

              // Real Profile & KYC Info (NO raw UUID User ID)
              const Text(
                'Thông tin cá nhân & Hồ sơ lái xe',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 8),
              _buildInfoCard([
                _buildListTile(Icons.phone_outlined, 'Số điện thoại', user?.phoneNumber ?? 'Chưa cập nhật'),
                const Divider(height: 1),
                _buildListTile(
                  Icons.cake_outlined,
                  'Ngày sinh',
                  user?.dateOfBirth != null ? dateFmt.format(user!.dateOfBirth!) : 'Chưa cập nhật',
                ),
                const Divider(height: 1),
                _buildListTile(
                  Icons.credit_card_outlined,
                  'Hạng GPLX & Ngày cấp',
                  '${user?.effectiveLicenseClass != null ? "Hạng ${user!.effectiveLicenseClass}" : "Chưa khai báo"}'
                      '${user?.licenseIssueDate != null ? " • Cấp ngày ${dateFmt.format(user!.licenseIssueDate!)}" : ""}',
                ),
              ]),
              const SizedBox(height: 20),

              // 3 Core Account Actions: KYC, Change Password, Notifications
              const Text(
                'Tiện ích & Bảo mật tài khoản',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 8),
              _buildInfoCard([
                ListTile(
                  leading: Icon(Icons.verified_user_outlined, color: kycColor, size: 22),
                  title: const Text('Xác minh danh tính (CCCD & GPLX)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    user?.isKycVerified == true
                        ? 'Hồ sơ đã được VELORA duyệt hợp lệ'
                        : 'Cập nhật ngày sinh, hạng bằng & ảnh giấy tờ để thuê xe cao cấp',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B)),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const KycVerificationScreen()),
                    ).then((_) => _refreshProfileAndBadge());
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.notifications_outlined, color: Color(0xFF60A5FA), size: 22),
                  title: const Text('Hộp thư thông báo', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    _unreadCount > 0 ? 'Bạn có $_unreadCount thông báo chưa đọc' : 'Xem cập nhật đơn thuê, thanh toán & quyết toán',
                    style: TextStyle(
                      fontSize: 11,
                      color: _unreadCount > 0 ? const Color(0xFF60A5FA) : const Color(0xFF94A3B8),
                    ),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_unreadCount > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '$_unreadCount',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B)),
                    ],
                  ),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                    ).then((_) => _refreshProfileAndBadge());
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.lock_reset_rounded, color: Color(0xFFF59E0B), size: 22),
                  title: const Text('Đổi mật khẩu', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: const Text(
                    'Thay đổi mật khẩu đăng nhập và thu hồi các phiên cũ',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B)),
                  onTap: _showChangePasswordDialog,
                ),
              ]),

              if (kDebugMode) ...[
                const SizedBox(height: 16),
                _buildInfoCard([
                  ListTile(
                    leading: const Icon(Icons.dns_rounded, color: Color(0xFF2563EB)),
                    title: const Text('Máy chủ Backend .NET 10 (Debug)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text(
                      _currentServerUrl.isNotEmpty ? _currentServerUrl : 'Chưa thiết lập',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    ),
                    trailing: TextButton(
                      onPressed: () async {
                        final updated = await showDialog<bool>(
                          context: context,
                          builder: (_) => const ServerConfigDialog(),
                        );
                        if (updated == true) {
                          _loadServerUrl();
                        }
                      },
                      child: const Text('Đổi IP', style: TextStyle(fontSize: 12)),
                    ),
                  ),
                ]),
              ],
              const SizedBox(height: 24),

              // Logout Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    side: const BorderSide(color: Color(0xFFEF4444)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Đăng xuất tài khoản', style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: _handleLogout,
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildListTile(IconData icon, String title, String value) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFF94A3B8), size: 20),
      title: Text(title, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
      subtitle: Text(
        value,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white),
      ),
    );
  }
}
