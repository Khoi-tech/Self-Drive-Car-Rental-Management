import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiConstants {
  static const String prefCustomBaseUrlKey = 'custom_api_base_url';

  // Preset IP options for easy demo switching
  static const String defaultLocalhostUrl = 'http://localhost:5171';
  static const String defaultEmulatorUrl = 'http://10.0.2.2:5171';
  static const String defaultLanWifiUrl = 'http://192.168.2.209:5171';

  static String _cachedBaseUrl = '';

  static String get defaultBaseUrl {
    if (kIsWeb) {
      return defaultLocalhostUrl;
    }
    // Android emulator or device
    if (defaultTargetPlatform == TargetPlatform.android) {
      return defaultEmulatorUrl;
    }
    // Windows / macOS / iOS
    return defaultLocalhostUrl;
  }

  static Future<String> getBaseUrl() async {
    if (_cachedBaseUrl.isNotEmpty) return _cachedBaseUrl;
    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString(prefCustomBaseUrlKey);
    if (customUrl != null && customUrl.trim().isNotEmpty) {
      _cachedBaseUrl = customUrl.trim();
    } else {
      _cachedBaseUrl = defaultBaseUrl;
    }
    return _cachedBaseUrl;
  }

  static Future<void> setBaseUrl(String newUrl) async {
    final prefs = await SharedPreferences.getInstance();
    final cleanUrl = newUrl.trim().replaceAll(RegExp(r'/+$'), '');
    await prefs.setString(prefCustomBaseUrlKey, cleanUrl);
    _cachedBaseUrl = cleanUrl;
  }

  // API Endpoints
  static const String authLogin = '/api/auth/login';
  static const String authRegister = '/api/auth/register';
  static const String authMe = '/api/auth/me';

  static const String vehicles = '/api/Vehicles';
  static const String vehiclesSearch = '/api/Vehicles/search';
  static String vehicleDetail(String id) => '/api/Vehicles/$id';
}
