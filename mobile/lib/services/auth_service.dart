import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService {
  static Future<bool> login(String email, String password) async {
    try {
      final response = await ApiService.post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'];
        final user = data['user'];

        // Persist token and role details
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        await prefs.setString('userId', user['id']);
        await prefs.setString('userName', user['name']);
        await prefs.setString('userRole', user['role']);
        
        return true;
      }
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userId');
    await prefs.remove('userName');
    await prefs.remove('userRole');
  }

  static Future<bool> isLoggedIn() async {
    final token = await ApiService.getToken();
    return token != null;
  }

  static Future<String?> getUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userRole');
  }

  static Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userName');
  }
}
