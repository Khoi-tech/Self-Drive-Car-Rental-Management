import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/server_config_dialog.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _currentServerUrl = '';

  @override
  void initState() {
    super.initState();
    _loadServerUrl();
  }

  Future<void> _loadServerUrl() async {
    final url = await ApiConstants.getBaseUrl();
    if (mounted) {
      setState(() {
        _currentServerUrl = url;
      });
    }
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

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tài khoản của tôi'),
        actions: [
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // User Avatar & Name Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF2563EB).withValues(alpha: 0.15),
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
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF10B981)),
                          ),
                          child: Text(
                            user?.role ?? 'CUSTOMER',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF10B981),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Profile Info List
            _buildInfoCard([
              _buildListTile(Icons.phone_outlined, 'Số điện thoại', user?.phoneNumber ?? 'Chưa cập nhật'),
              const Divider(height: 1),
              _buildListTile(Icons.badge_outlined, 'Mã định danh (User ID)', user?.id ?? ''),
              const Divider(height: 1),
              _buildListTile(Icons.verified_user_outlined, 'Trạng thái tài khoản', 'Đã xác thực CCCD & GPLX'),
            ]),
            const SizedBox(height: 16),

            // Server Connection Info Card
            _buildInfoCard([
              ListTile(
                leading: const Icon(Icons.dns_rounded, color: Color(0xFF2563EB)),
                title: const Text('Máy chủ Backend .NET 10', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
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
