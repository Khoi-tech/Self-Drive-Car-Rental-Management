import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/car_model.dart';
import '../models/pricing_policy_model.dart';
import '../models/rental_condition_model.dart';
import 'auth_service.dart';

class CarService {
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

  Future<List<CarModel>> getVehicles({String? search, String? status}) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final queryParams = <String, String>{'pageSize': '100'};
    if (search != null && search.trim().isNotEmpty) {
      queryParams['search'] = search.trim();
    }
    if (status != null && status.isNotEmpty) {
      queryParams['status'] = status;
    }

    final uri = Uri.parse('$baseUrl${ApiConstants.vehicles}').replace(
      queryParameters: queryParams,
    );

    final headers = await _buildHeaders();

    try {
      final response = await http
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List<dynamic> data = decoded is List
            ? decoded
            : (decoded is Map<String, dynamic> && decoded['items'] is List
                ? decoded['items'] as List<dynamic>
                : (decoded is Map<String, dynamic> && decoded['data'] is List
                    ? decoded['data'] as List<dynamic>
                    : []));
        return data
            .whereType<Map<String, dynamic>>()
            .map((item) => CarModel.fromJson(item))
            .toList();
      } else {
        throw Exception('Lỗi nạp danh sách xe: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Không thể kết nối đến máy chủ: $e');
    }
  }

  Future<CarModel?> getVehicleById(String id) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl${ApiConstants.vehicleDetail(id)}');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) {
          return CarModel.fromJson(data);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<RentalConditionModel?> getEffectiveCondition(String vehicleId) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url =
        Uri.parse('$baseUrl${ApiConstants.vehicleRentalCondition(vehicleId)}');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final map = decoded is Map<String, dynamic>
            ? (decoded['data'] is Map<String, dynamic>
                ? decoded['data'] as Map<String, dynamic>
                : decoded)
            : null;
        if (map != null) {
          return RentalConditionModel.fromJson(map);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<List<PricingPolicyModel>> getPricingPolicies(String vehicleId) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url =
        Uri.parse('$baseUrl${ApiConstants.vehiclePricingPolicies(vehicleId)}');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

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
            .map((e) => PricingPolicyModel.fromJson(e))
            .toList()
          ..sort((a, b) => a.minDays.compareTo(b.minDays));
      }
    } catch (_) {}
    return [];
  }

  Future<PricingPreviewModel?> previewPricing(
    String vehicleId,
    int rentalDays, {
    bool isHoliday = false,
    bool isVietQrPrepaid = false,
    DateTime? startTime,
    String? customerEmail,
  }) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url =
        Uri.parse('$baseUrl${ApiConstants.vehiclePricingPreview(vehicleId)}');
    final headers = await _buildHeaders();

    try {
      final bodyMap = <String, dynamic>{
        'rentalDays': rentalDays,
        'isHoliday': isHoliday,
        'isVietQrPrepaid': isVietQrPrepaid,
      };
      if (startTime != null) {
        bodyMap['startTime'] = startTime.toUtc().toIso8601String();
      }
      if (customerEmail != null && customerEmail.trim().isNotEmpty) {
        bodyMap['customerEmail'] = customerEmail.trim();
      }

      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode(bodyMap),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final map = decoded is Map<String, dynamic>
            ? (decoded['data'] is Map<String, dynamic>
                ? decoded['data'] as Map<String, dynamic>
                : decoded)
            : null;
        if (map != null) {
          return PricingPreviewModel.fromJson(map);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<List<Map<String, dynamic>>> getMembershipTiers() async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl${ApiConstants.membershipTiers}');
    final headers = await _buildHeaders();

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final list = decoded is Map<String, dynamic> && decoded['tiers'] is List
            ? decoded['tiers'] as List<dynamic>
            : (decoded is List ? decoded : <dynamic>[]);
        return list.whereType<Map<String, dynamic>>().toList();
      }
    } catch (_) {}
    return [];
  }
}
