import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'login_page.dart';
import 'attendance_page.dart';

class LessonsPage extends StatefulWidget {
  const LessonsPage({super.key});

  @override
  State<LessonsPage> createState() => _LessonsPageState();
}

class _LessonsPageState extends State<LessonsPage> {
  List<dynamic> _lessons = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _teacherName = 'Professora';

  @override
  void initState() {
    super.initState();
    _loadTeacherName();
    _fetchLessons();
  }

  Future<void> _loadTeacherName() async {
    final name = await AuthService.getUserName();
    if (name != null) {
      setState(() {
        _teacherName = name;
      });
    }
  }

  Future<void> _fetchLessons() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ApiService.get('/lessons');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _lessons = data;
        });
      } else {
        setState(() {
          _errorMessage = 'Falha ao buscar aulas.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro de rede: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogout() async {
    await AuthService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginPage()),
      );
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy (EEEE)', 'pt_BR').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'CONCLUDED':
        return const Color(0xFF10B981); // Emerald Green
      case 'CANCELED':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFF3B82F6); // Blue (Scheduled)
    }
  }

  String _translateStatus(String status) {
    switch (status) {
      case 'CONCLUDED':
        return 'Concluída';
      case 'CANCELED':
        return 'Cancelada';
      default:
        return 'Agendada';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'DanceFlow',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
            ),
            Text(
              'Olá, $_teacherName',
              style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _fetchLessons,
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            onPressed: _handleLogout,
          ),
        ],
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation(Color(0xFFEC4899)),
              ),
            )
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.white, fontSize: 16),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _fetchLessons,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEC4899),
                          ),
                          child: const Text('Tentar Novamente'),
                        )
                      ],
                    ),
                  ),
                )
              : _lessons.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.calendar_month, size: 64, color: Colors.white.withOpacity(0.2)),
                          const SizedBox(height: 16),
                          const Text(
                            'Nenhuma aula agendada encontrada.',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 16),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _lessons.length,
                      itemBuilder: (context, index) {
                        final lesson = _lessons[index];
                        final statusColor = _getStatusColor(lesson['status']);

                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          color: const Color(0xFF1E293B),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(
                              color: Colors.white.withOpacity(0.06),
                            ),
                          ),
                          child: InkWell(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => AttendancePage(
                                    lessonId: lesson['id'],
                                    className: lesson['className'],
                                    modality: lesson['modality'],
                                  ),
                                ),
                              ).then((_) => _fetchLessons()); // Refresh list on return
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          lesson['className'],
                                          style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: statusColor.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(
                                            color: statusColor.withOpacity(0.3),
                                          ),
                                        ),
                                        child: Text(
                                          _translateStatus(lesson['status']),
                                          style: TextStyle(
                                            color: statusColor,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Modalidade: ${lesson['modality']}',
                                    style: const TextStyle(
                                      color: Color(0xFF94A3B8),
                                      fontSize: 14,
                                    ),
                                  ),
                                  const Divider(height: 24, color: Colors.white10),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.calendar_today,
                                            size: 14,
                                            color: Color(0xFFEC4899),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            _formatDate(lesson['date']),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ],
                                      ),
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.access_time,
                                            size: 14,
                                            color: Color(0xFFEC4899),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            '${lesson['timeStart']} - ${lesson['timeEnd']}',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
