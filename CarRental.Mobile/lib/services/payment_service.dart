import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/payment_model.dart';
import 'auth_service.dart';

class PaymentService {
  final AuthService _authService = AuthService();

  Future<PaymentModel> createDepositPayment({
    required String requestId,
    String? contractId,
  }) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/payments/deposit');
    final token = await _authService.getToken();

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    final body = jsonEncode({
      'rentalRequestId': requestId,
      'contractId': contractId,
      'paymentMethod': 'VIETQR',
    });

    final response = await http
        .post(url, headers: headers, body: body)
        .timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return PaymentModel.fromJson(data);
    } else {
      String msg = 'Không thể tạo giao dịch thanh toán cọc';
      try {
        final err = jsonDecode(response.body);
        if (err['message'] != null) msg = err['message'];
      } catch (_) {}
      throw Exception(msg);
    }
  }

  Future<PaymentModel> confirmPayment(String transactionCode) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/payments/confirm');
    final token = await _authService.getToken();

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    final body = jsonEncode({
      'transactionCode': transactionCode,
    });

    final response = await http
        .post(url, headers: headers, body: body)
        .timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final paymentData = data['data'] ?? data;
      return PaymentModel.fromJson(paymentData);
    } else {
      String msg = 'Không thể xác nhận thanh toán';
      try {
        final err = jsonDecode(response.body);
        if (err['message'] != null) msg = err['message'];
      } catch (_) {}
      throw Exception(msg);
    }
  }

  Future<PaymentModel?> getPaymentByRequestId(String requestId) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/payments/request/$requestId');
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
        return PaymentModel.fromJson(data);
      }
    } catch (_) {}
    return null;
  }
}
