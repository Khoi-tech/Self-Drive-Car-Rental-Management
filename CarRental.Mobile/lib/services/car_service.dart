import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/car_model.dart';
import 'auth_service.dart';

class CarService {
  final AuthService _authService = AuthService();

  Future<List<CarModel>> getVehicles({String? search, String? status}) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final queryParams = <String, String>{};
    if (search != null && search.trim().isNotEmpty) {
      queryParams['search'] = search.trim();
    }
    if (status != null && status.isNotEmpty) {
      queryParams['status'] = status;
    }

    final uri = Uri.parse('$baseUrl${ApiConstants.vehicles}').replace(
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );

    final token = await _authService.getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    try {
      final response = await http
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => CarModel.fromJson(item)).toList();
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
        return CarModel.fromJson(data);
      }
    } catch (_) {}
    return null;
  }
}
