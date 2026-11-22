import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiConstants {
  static const String prefCustomBaseUrlKey = 'custom_api_base_url';

  // Environment variable passed via --dart-define=API_BASE_URL=...
  static const String envBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');

  // Preset IP options for easy demo switching
  static const String defaultLocalhostUrl = 'http://localhost:5171';
  static const String defaultEmulatorUrl = 'http://10.0.2.2:5171';
  static const String defaultLanWifiUrl = 'http://192.168.2.209:5171';

  static String _cachedBaseUrl = '';

  static String get defaultBaseUrl {
    // 1. Compile-time environment variable defined via --dart-define (dev/staging/prod)
    if (envBaseUrl.isNotEmpty) {
      return envBaseUrl;
    }
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
    // Prioritize compile-time env URL if specified
    if (envBaseUrl.isNotEmpty) {
      return envBaseUrl;
    }
    if (_cachedBaseUrl.isNotEmpty) return _cachedBaseUrl;
    // Allow runtime debug overriding only in debug mode
    if (kDebugMode) {
      final prefs = await SharedPreferences.getInstance();
      final customUrl = prefs.getString(prefCustomBaseUrlKey);
      if (customUrl != null && customUrl.trim().isNotEmpty) {
        _cachedBaseUrl = customUrl.trim();
        return _cachedBaseUrl;
      }
    }
    _cachedBaseUrl = defaultBaseUrl;
    return _cachedBaseUrl;
  }

  static Future<void> setBaseUrl(String newUrl) async {
    // Prevent base URL tampering in release builds
    if (!kDebugMode) return;
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
  static String vehicleRentalCondition(String id) => '/api/vehicles/$id/rental-condition';
  static String vehiclePricingPolicies(String id) => '/api/vehicles/$id/pricing-policies';
  static String vehiclePricingPreview(String id) => '/api/vehicles/$id/pricing-preview';
}
