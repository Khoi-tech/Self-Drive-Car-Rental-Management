import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/settlement_model.dart';
import 'auth_service.dart';

class SettlementService {
  final AuthService _authService = AuthService();

  Future<SettlementModel?> getSettlementByRequestId(String requestId) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-settlements/by-request/$requestId');
    final token = await _authService.getToken();

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return SettlementModel.fromJson(data);
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>> disputeSettlement(String settlementId, String reason) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-settlements/$settlementId/dispute');
    final token = await _authService.getToken();

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    try {
      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({'reason': reason.trim()}),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'message': data['message'] ?? 'Đã gửi khiếu nại thành công'};
      } else {
        String msg = 'Không thể gửi khiếu nại';
        try {
          final err = jsonDecode(response.body);
          if (err['message'] != null) msg = err['message'];
        } catch (_) {}
        return {'success': false, 'message': msg};
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }
}
