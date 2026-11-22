import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../models/user_model.dart';

class AuthService {
  static const String tokenKey = 'jwt_auth_token';
  static const String userKey = 'cached_user_info';

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  Future<UserModel?> getCachedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(userKey);
    if (userJson != null) {
      try {
        return UserModel.fromJson(jsonDecode(userJson));
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl${ApiConstants.authLogin}');

    try {
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': email.trim(),
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token']?.toString() ?? '';
        final user = UserModel.fromJson(data['user'] ?? {});

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(tokenKey, token);
        await prefs.setString(userKey, jsonEncode(user.toJson()));

        return {
          'success': true,
          'token': token,
          'user': user,
        };
      } else {
        String errorMsg = 'Đăng nhập không thành công';
        try {
          final errBody = jsonDecode(response.body);
          if (errBody['message'] != null) {
            errorMsg = errBody['message'];
          } else if (errBody['details'] != null) {
            errorMsg = errBody['details'];
          }
        } catch (_) {}
        return {
          'success': false,
          'message': errorMsg,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Không thể kết nối đến máy chủ ($baseUrl). Vui lòng kiểm tra địa chỉ IP backend.',
      };
    }
  }

  Future<UserModel?> fetchCurrentUser() async {
    final token = await getToken();
    if (token == null) return null;

    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl${ApiConstants.authMe}');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = UserModel.fromJson(data);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(userKey, jsonEncode(user.toJson()));
        return user;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final token = await getToken();
    if (token == null || token.isEmpty) {
      return {'success': false, 'message': 'Phiên đăng nhập đã hết hạn.'};
    }

    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/auth/change-password');

    try {
      final response = await http
          .post(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode({
              'currentPassword': currentPassword,
              'newPassword': newPassword,
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': (data is Map ? (data['message'] ?? data['Message']) : null) ??
              'Đổi mật khẩu thành công.',
        };
      }

      String msg = 'Không thể đổi mật khẩu.';
      try {
        final err = jsonDecode(response.body);
        if (err is Map) {
          msg = (err['message'] ?? err['Message'] ?? msg).toString();
        }
      } catch (_) {}
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<Map<String, dynamic>> updateMyKyc({
    required String idCardNumber,
    required String driverLicenseNumber,
    required String licenseClass,
    DateTime? dateOfBirth,
    DateTime? licenseIssueDate,
    String? idCardFrontUrl,
    String? idCardBackUrl,
    String? driverLicenseFrontUrl,
    String? driverLicenseBackUrl,
  }) async {
    final token = await getToken();
    if (token == null || token.isEmpty) {
      return {'success': false, 'message': 'Phiên đăng nhập đã hết hạn.'};
    }

    String? formatDate(DateTime? d) {
      if (d == null) return null;
      final y = d.year.toString().padLeft(4, '0');
      final m = d.month.toString().padLeft(2, '0');
      final day = d.day.toString().padLeft(2, '0');
      return '$y-$m-$day';
    }

    final baseUrl = await ApiConstants.getBaseUrl();
    final url = Uri.parse('$baseUrl/api/customers/me/kyc');

    try {
      final response = await http
          .put(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode({
              'idCardNumber': idCardNumber.trim(),
              'driverLicenseNumber': driverLicenseNumber.trim(),
              'driverLicenseClass': licenseClass,
              'licenseClass': licenseClass,
              if (dateOfBirth != null) 'dateOfBirth': formatDate(dateOfBirth),
              if (licenseIssueDate != null)
                'licenseIssueDate': formatDate(licenseIssueDate),
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
              'Đã gửi hồ sơ KYC thành công.',
        };
      }

      String msg = 'Không thể cập nhật hồ sơ KYC.';
      try {
        final err = jsonDecode(response.body);
        if (err is Map) {
          msg = (err['message'] ?? err['Message'] ?? msg).toString();
        }
      } catch (_) {}
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối máy chủ: $e'};
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(userKey);
  }
}
