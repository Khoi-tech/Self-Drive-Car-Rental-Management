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

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(userKey);
  }
}
