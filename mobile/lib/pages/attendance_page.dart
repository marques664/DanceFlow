import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AttendancePage extends StatefulWidget {
  final String lessonId;
  final String className;
  final String modality;

  const AttendancePage({
    super.key,
    required this.lessonId,
    required this.className,
    required this.modality,
  });

  @override
  State<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends State<AttendancePage> {
  List<dynamic> _students = [];
  Map<String, String> _attendanceMap = {}; // studentId -> status (PRESENT/ABSENT)
  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;
  bool _isDraft = true;

  @override
  void initState() {
    super.initState();
    _fetchLessonDetails();
  }

  Future<void> _fetchLessonDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ApiService.get('/lessons/${widget.lessonId}');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> eligibleStudents = data['students'] ?? [];
        
        final Map<String, String> initialMap = {};
        for (var student in eligibleStudents) {
          if (student['status'] != null) {
            initialMap[student['id']] = student['status'];
          } else {
            // Default to PRESENT for easy logging as per usability best practices
            initialMap[student['id']] = 'PRESENT';
          }
        }

        setState(() {
          _students = eligibleStudents;
          _attendanceMap = initialMap;
          _isDraft = data['status'] == 'SCHEDULED';
        });
      } else {
        setState(() {
          _errorMessage = 'Falha ao carregar detalhes da aula.';
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

  Future<void> _submitAttendance(bool isDraft) async {
    // Validate that all students have a selection
    if (_attendanceMap.length < _students.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor, defina a frequência para todas as alunas.'),
          backgroundColor: Colors.orangeAccent,
        ),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final List<Map<String, dynamic>> records = _attendanceMap.entries.map((e) {
        return {
          'studentId': e.key,
          'status': e.value,
        };
      }).toList();

      final response = await ApiService.post('/lessons/${widget.lessonId}/attendance', {
        'isDraft': isDraft,
        'records': records,
      });

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                isDraft
                    ? 'Rascunho de chamada salvo com sucesso!'
                    : 'Frequência finalizada com sucesso!',
              ),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
          Navigator.of(context).pop();
        }
      } else {
        final body = jsonDecode(response.body);
        setState(() {
          _errorMessage = body['message'] ?? 'Falha ao registrar frequência.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro de rede: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  void _markAllPresent() {
    final Map<String, String> newMap = {};
    for (var s in _students) {
      newMap[s['id']] = 'PRESENT';
    }
    setState(() {
      _attendanceMap = newMap;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Text(widget.className),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation(Color(0xFFEC4899)),
              ),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Info Card
                Container(
                  padding: const EdgeInsets.all(16),
                  color: const Color(0xFF1E293B),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.modality,
                            style: const TextStyle(
                              color: Color(0xFFEC4899),
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Alunas Matriculadas: ${_students.length}',
                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                          ),
                        ],
                      ),
                      // Shortcut button to mark all present (matching usability spec)
                      ElevatedButton.icon(
                        onPressed: _isSaving ? null : _markAllPresent,
                        icon: const Icon(Icons.done_all, size: 16, color: Colors.white),
                        label: const Text('Presença Geral'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.08),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.redAccent),
                      ),
                    ),
                  ),

                // Students Attendance List
                Expanded(
                  child: _students.isEmpty
                      ? const Center(
                          child: Text(
                            'Nenhuma aluna vinculada a esta turma.',
                            style: TextStyle(color: Color(0xFF94A3B8)),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _students.length,
                          itemBuilder: (context, index) {
                            final student = _students[index];
                            final id = student['id'];
                            final status = _attendanceMap[id];

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.04),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          student['name'],
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 15,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${student['age']} anos • ${student['phone']}',
                                          style: const TextStyle(
                                            color: Color(0xFF94A3B8),
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  
                                  // segment controls: Present or Absent
                                  Row(
                                    children: [
                                      // Present Option
                                      GestureDetector(
                                        onTap: () {
                                          setState(() {
                                            _attendanceMap[id] = 'PRESENT';
                                          });
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          decoration: BoxDecoration(
                                            color: status == 'PRESENT'
                                                ? const Color(0xFF10B981)
                                                : const Color(0xFF0F172A),
                                            borderRadius: const BorderRadius.only(
                                              topLeft: Radius.circular(6),
                                              bottomLeft: Radius.circular(6),
                                            ),
                                          ),
                                          child: Text(
                                            'P',
                                            style: TextStyle(
                                              color: status == 'PRESENT' ? Colors.white : const Color(0xFF94A3B8),
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                      // Absent Option
                                      GestureDetector(
                                        onTap: () {
                                          setState(() {
                                            _attendanceMap[id] = 'ABSENT';
                                          });
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          decoration: BoxDecoration(
                                            color: status == 'ABSENT'
                                                ? const Color(0xFFEF4444)
                                                : const Color(0xFF0F172A),
                                            borderRadius: const BorderRadius.only(
                                              topRight: Radius.circular(6),
                                              bottomRight: Radius.circular(6),
                                            ),
                                          ),
                                          child: Text(
                                            'F',
                                            style: TextStyle(
                                              color: status == 'ABSENT' ? Colors.white : const Color(0xFF94A3B8),
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  )
                                ],
                              ),
                            );
                          },
                        ),
                ),

                // Save buttons
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: Color(0xFF1E293B),
                    border: Border(top: BorderSide(color: Colors.white10)),
                  ),
                  child: Row(
                    children: [
                      // Draft Save
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _isSaving ? null : () => _submitAttendance(true),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white24),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text('Salvar Rascunho'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Finalize Save
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : () => _submitAttendance(false),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEC4899),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 0,
                          ),
                          child: _isSaving
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation(Colors.white),
                                  ),
                                )
                              : const Text(
                                  'Finalizar Chamada',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
