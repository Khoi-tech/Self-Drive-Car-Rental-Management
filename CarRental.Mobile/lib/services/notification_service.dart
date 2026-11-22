import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/notification_model.dart';
import 'auth_service.dart';

class NotificationService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _buildHeaders() async {
    final token = await _authService.getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<List<NotificationModel>> getNotifications({int page = 1, int pageSize = 30}) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/notifications').replace(
      queryParameters: {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      },
    );
    final headers = await _buildHeaders();

    final response = await http
        .get(url, headers: headers)
        .timeout(const Duration(seconds: 12));

    if (response.statusCode == 200) {
      final decoded = jsonDecode(response.body);
      final List<dynamic> list = decoded is List
          ? decoded
          : (decoded is Map<String, dynamic> && decoded['items'] is List
              ? decoded['items'] as List<dynamic>
              : (decoded is Map<String, dynamic> && decoded['data'] is List
                  ? decoded['data'] as List<dynamic>
                  : []));
      return list
          .whereType<Map<String, dynamic>>()
          .map(NotificationModel.fromJson)
          .toList();
    }
    throw Exception('Không thể tải thông báo (${response.statusCode})');
  }

  Future<int> getUnreadCount() async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/notifications/unread-count');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['unreadCount'] is num) {
          return (data['unreadCount'] as num).toInt();
        }
      }
    } catch (_) {}
    return 0;
  }

  Future<bool> markAsRead(String id) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/notifications/$id/read');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .patch(url, headers: headers)
          .timeout(const Duration(seconds: 10));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<bool> markAllAsRead() async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/notifications/mark-all-read');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .patch(url, headers: headers)
          .timeout(const Duration(seconds: 10));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
