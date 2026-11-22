import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/contract_model.dart';
import '../models/rental_request_model.dart';
import 'auth_service.dart';

class RentalService {
  final AuthService _authService = AuthService();

  Future<RentalRequestModel> createRentalRequest(CreateRentalRequestDto dto) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-requests');
    final token = await _authService.getToken();

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

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
      String msg = 'Không thể tạo đơn đặt xe';
      try {
        final err = jsonDecode(response.body);
        if (err['message'] != null) {
          msg = err['message'];
        } else if (err['details'] != null) {
          msg = err['details'];
        }
      } catch (_) {}
      throw Exception(msg);
    }
  }

  Future<RentalContractModel> getOrCreateContractByRequestId(String requestId) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-contracts/request/$requestId');
    final token = await _authService.getToken();

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    final response = await http
        .get(url, headers: headers)
        .timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return RentalContractModel.fromJson(data);
    } else {
      String msg = 'Không thể lấy thông tin hợp đồng';
      try {
        final err = jsonDecode(response.body);
        if (err['message'] != null) msg = err['message'];
      } catch (_) {}
      throw Exception(msg);
    }
  }

  Future<RentalContractModel> signContract(String contractId, String signatureName) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/rental-contracts/$contractId/sign');
    final token = await _authService.getToken();

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

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
      String msg = 'Ký hợp đồng không thành công';
      try {
        final err = jsonDecode(response.body);
        if (err['message'] != null) msg = err['message'];
      } catch (_) {}
      throw Exception(msg);
    }
  }

  Future<List<RentalRequestModel>> getMyRentals() async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final token = await _authService.getToken();
    final user = await _authService.getCachedUser();

    if (token == null || token.isEmpty) {
      throw Exception('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    // Backend tự trích xuất danh tính CUSTOMER từ JWT Claim (NameIdentifier -> DB User).
    // Chỉ truyền email query param khi là nhân sự Operations (STAFF/MANAGER/ADMIN).
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

    final response = await http
        .get(url, headers: headers)
        .timeout(const Duration(seconds: 15));

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
      String msg = 'Không thể tải danh sách đơn thuê (${response.statusCode})';
      try {
        final err = jsonDecode(response.body);
        if (err is Map && err['message'] != null) {
          msg = err['message'].toString();
        }
      } catch (_) {}
      throw Exception(msg);
    }
  }
}
