import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'services/auth_service.dart';
import 'pages/login_page.dart';
import 'pages/lessons_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Portuguese date formatting locales
  await initializeDateFormatting('pt_BR', null);
  
  // Check if session token exists
  final loggedIn = await AuthService.isLoggedIn();

  runApp(MyApp(isLoggedIn: loggedIn));
}

class MyApp extends StatelessWidget {
  final bool isLoggedIn;

  const MyApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DanceFlow Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFEC4899), // Hot Pink
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFEC4899),
          secondary: Color(0xFFEC4899),
          surface: Color(0xFF1E293B),
          background: Color(0xFF0F172A),
        ),
        useMaterial3: true,
      ),
      home: isLoggedIn ? const LessonsPage() : const LoginPage(),
    );
  }
}
