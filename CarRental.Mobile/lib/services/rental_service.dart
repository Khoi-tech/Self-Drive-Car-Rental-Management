import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/contract_model.dart';
import '../models/handover_protocol_model.dart';
import '../models/rental_request_model.dart';
import '../models/return_protocol_model.dart';
import 'auth_service.dart';

class RentalService {
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

  String _extractErrorMessage(String body, String fallback) {
    try {
      final err = jsonDecode(body);
      if (err is Map) {
        if (err['message'] != null) return err['message'].toString();
        if (err['Message'] != null) return err['Message'].toString();
        if (err['details'] != null) return err['details'].toString();
      }
    } catch (_) {}
    return fallback;
  }

  Future<RentalRequestModel> createRentalRequest(CreateRentalRequestDto dto) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-requests');
    final headers = await _buildHeaders();

    final response = await http
        .post(
          url,
          headers: headers,
          body: jsonEncode(dto.toJson()),
        )
        .timeout(const Duration(seconds: 15));

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return RentalRequestModel.fromJson(data);
    } else {
      throw Exception(_extractErrorMessage(response.body, 'Không thể tạo đơn đặt xe'));
    }
  }

  Future<RentalRequestModel?> getRentalRequestById(String id) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-requests/$id');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 12));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) {
          return RentalRequestModel.fromJson(data);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>> cancelRentalRequest(String id) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-requests/$id/cancel');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .put(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': (data is Map ? (data['message'] ?? data['Message']) : null) ??
              'Đã hủy đơn thuê xe thành công.',
        };
      }
      return {
        'success': false,
        'message': _extractErrorMessage(response.body, 'Không thể hủy đơn thuê xe.'),
      };
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<Map<String, dynamic>> updateRentalDocuments(
    String requestId, {
    String? customerIdCard,
    String? driverLicenseNumber,
    String? driverLicenseClass,
    String? idCardFrontUrl,
    String? idCardBackUrl,
    String? driverLicenseFrontUrl,
    String? driverLicenseBackUrl,
  }) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-requests/$requestId/documents');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .put(
            url,
            headers: headers,
            body: jsonEncode({
              if (customerIdCard != null && customerIdCard.trim().isNotEmpty)
                'customerIdCard': customerIdCard.trim(),
              if (driverLicenseNumber != null && driverLicenseNumber.trim().isNotEmpty)
                'driverLicenseNumber': driverLicenseNumber.trim(),
              if (driverLicenseClass != null && driverLicenseClass.trim().isNotEmpty)
                'driverLicenseClass': driverLicenseClass.trim(),
              if (idCardFrontUrl != null && idCardFrontUrl.trim().isNotEmpty)
                'idCardFrontUrl': idCardFrontUrl.trim(),
              if (idCardBackUrl != null && idCardBackUrl.trim().isNotEmpty)
                'idCardBackUrl': idCardBackUrl.trim(),
              if (driverLicenseFrontUrl != null && driverLicenseFrontUrl.trim().isNotEmpty)
                'driverLicenseFrontUrl': driverLicenseFrontUrl.trim(),
              if (driverLicenseBackUrl != null && driverLicenseBackUrl.trim().isNotEmpty)
                'driverLicenseBackUrl': driverLicenseBackUrl.trim(),
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': (data is Map ? (data['message'] ?? data['Message']) : null) ??
              'Bổ sung hồ sơ định danh thành công.',
        };
      }
      return {
        'success': false,
        'message': _extractErrorMessage(response.body, 'Không thể cập nhật giấy tờ.'),
      };
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<RentalContractModel> getOrCreateContractByRequestId(String requestId) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-contracts/request/$requestId');
    final headers = await _buildHeaders();

    var response = await http
        .get(url, headers: headers)
        .timeout(const Duration(seconds: 15));

    if (response.statusCode == 401) {
      final newToken = await _authService.refreshAccessToken();
      if (newToken != null && newToken.isNotEmpty) {
        headers['Authorization'] = 'Bearer $newToken';
        response = await http
            .get(url, headers: headers)
            .timeout(const Duration(seconds: 15));
      }
    }

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return RentalContractModel.fromJson(data);
    } else {
      throw Exception(_extractErrorMessage(response.body, 'Không thể lấy thông tin hợp đồng'));
    }
  }

  Future<RentalContractModel> signContract(String contractId, String signatureName) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-contracts/$contractId/sign');
    final headers = await _buildHeaders();

    final response = await http
        .post(
          url,
          headers: headers,
          body: jsonEncode({
            'signature': signatureName.trim(),
            'agreeTerms': true,
          }),
        )
        .timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final contractData = data['data'] ?? data;
      return RentalContractModel.fromJson(contractData);
    } else {
      throw Exception(_extractErrorMessage(response.body, 'Ký hợp đồng không thành công'));
    }
  }

  Future<HandoverProtocolModel?> getHandoverByRequestId(String requestId) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/handover-protocols/request/$requestId');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) {
          return HandoverProtocolModel.fromJson(data);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>> confirmHandover(
    String protocolId, {
    required String customerSignature,
    String? notes,
  }) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/handover-protocols/$protocolId/confirm');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({
              'customerSignature': customerSignature.trim(),
              if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': (data is Map ? data['message'] : null) ??
              'Xác nhận bàn giao xe thành công! Chuyến đi đã được kích hoạt.',
        };
      }
      return {
        'success': false,
        'message': _extractErrorMessage(response.body, 'Không thể xác nhận bàn giao xe.'),
      };
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<ReturnProtocolModel?> getReturnProtocolByRequestId(String requestId) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/return-protocols/by-request/$requestId');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) {
          return ReturnProtocolModel.fromJson(data);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>> createRentalExtension({
    required String rentalRequestId,
    required DateTime newEndTime,
    required String reason,
  }) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-extensions');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({
              'rentalRequestId': rentalRequestId,
              'newEndTime': newEndTime.toUtc().toIso8601String(),
              'reason': reason.trim(),
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': 'Đã gửi yêu cầu gia hạn thuê xe thành công! Nhân viên VELORA sẽ duyệt sớm.',
        };
      }
      return {
        'success': false,
        'message': _extractErrorMessage(response.body, 'Không thể gửi yêu cầu gia hạn.'),
      };
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<Map<String, dynamic>> createIncidentReport({
    required String rentalRequestId,
    required String incidentType,
    required String severity,
    required String location,
    required String description,
    bool hasInjuries = false,
  }) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/incidents');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({
              'rentalRequestId': rentalRequestId,
              'incidentType': incidentType,
              'severity': severity,
              'location': location.trim(),
              'description': description.trim(),
              'hasInjuries': hasInjuries,
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': 'Đã gửi báo cáo sự cố khẩn cấp! Đội cứu hộ VELORA 24/7 đã tiếp nhận.',
        };
      }
      return {
        'success': false,
        'message': _extractErrorMessage(response.body, 'Không thể gửi báo cáo sự cố.'),
      };
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<List<RentalRequestModel>> getMyRentals() async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final token = await _authService.getToken();
    final user = await _authService.getCachedUser();

    if (token == null || token.isEmpty) {
      throw Exception('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    final queryParams = <String, String>{};
    if (user != null && user.isStaff && user.email.isNotEmpty) {
      queryParams['email'] = user.email;
    }

    final url = Uri.parse('$baseUrl/api/rental-requests/my-requests').replace(
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );

    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };

    var response = await http
        .get(url, headers: headers)
        .timeout(const Duration(seconds: 15));

    if (response.statusCode == 401) {
      final newToken = await _authService.refreshAccessToken();
      if (newToken != null && newToken.isNotEmpty) {
        headers['Authorization'] = 'Bearer $newToken';
        response = await http
            .get(url, headers: headers)
            .timeout(const Duration(seconds: 15));
      }
    }

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
          .map((item) => RentalRequestModel.fromJson(item))
          .toList();
    } else if (response.statusCode == 401) {
      throw Exception('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    } else {
      throw Exception(
        _extractErrorMessage(
          response.body,
          'Không thể tải danh sách đơn thuê (${response.statusCode})',
        ),
      );
    }
  }
}
