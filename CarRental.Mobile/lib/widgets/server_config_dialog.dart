import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';

class ServerConfigDialog extends StatefulWidget {
  const ServerConfigDialog({super.key});

  @override
  State<ServerConfigDialog> createState() => _ServerConfigDialogState();
}

class _ServerConfigDialogState extends State<ServerConfigDialog> {
  final TextEditingController _customController = TextEditingController();
  String _currentUrl = '';

  @override
  void initState() {
    super.initState();
    _loadUrl();
  }

  Future<void> _loadUrl() async {
    final url = await ApiConstants.getBaseUrl();
    setState(() {
      _currentUrl = url;
      _customController.text = url;
    });
  }

  Future<void> _saveUrl(String url) async {
    await ApiConstants.setBaseUrl(url);
    if (mounted) {
      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã cập nhật máy chủ: $url'),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
    }
  }

  @override
  void dispose() {
    _customController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.dns_rounded, color: Color(0xFF2563EB)),
          SizedBox(width: 10),
          Text('Cấu hình Máy chủ API', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Chọn địa chỉ IP kết nối đến Backend .NET 10 API:',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            _buildOption(
              label: 'Chrome / Web / Windows',
              url: ApiConstants.defaultLocalhostUrl,
              desc: 'localhost:5171',
            ),
            _buildOption(
              label: 'Android Emulator',
              url: ApiConstants.defaultEmulatorUrl,
              desc: '10.0.2.2:5171',
            ),
            _buildOption(
              label: 'Thiết bị thật (Mạng Wi-Fi)',
              url: ApiConstants.defaultLanWifiUrl,
              desc: '192.168.2.209:5171',
            ),
            const Divider(height: 24),
            const Text(
              'Hoặc nhập IP tùy chỉnh:',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _customController,
              decoration: const InputDecoration(
                hintText: 'http://192.168.x.x:5171',
                prefixIcon: Icon(Icons.link_rounded),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Đóng'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_customController.text.trim().isNotEmpty) {
              _saveUrl(_customController.text.trim());
            }
          },
          child: const Text('Lưu & Áp dụng'),
        ),
      ],
    );
  }

  Widget _buildOption({
    required String label,
    required String url,
    required String desc,
  }) {
    final isSelected = _currentUrl == url;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: isSelected ? const Color(0xFF2563EB).withValues(alpha: 0.15) : null,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: isSelected ? const Color(0xFF2563EB) : Colors.white.withValues(alpha: 0.08),
        ),
      ),
      child: ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        subtitle: Text(desc, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        trailing: isSelected
            ? const Icon(Icons.check_circle_rounded, color: Color(0xFF2563EB), size: 18)
            : null,
        onTap: () => _saveUrl(url),
      ),
    );
  }
}
