import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Use 10.0.2.2 for Android Emulator, or localhost for iOS/web.
  static const String baseUrl = 'http://10.0.2.2:3333';
  
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<http.Response> post(String path, Map<String, dynamic> body) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _getHeaders();
    return await http.post(
      url,
      headers: headers,
      body: jsonEncode(body),
    );
  }

  static Future<http.Response> get(String path) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _getHeaders();
    return await http.get(url, headers: headers);
  }

  static Future<http.Response> put(String path, Map<String, dynamic> body) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _getHeaders();
    return await http.put(
      url,
      headers: headers,
      body: jsonEncode(body),
    );
  }
}
