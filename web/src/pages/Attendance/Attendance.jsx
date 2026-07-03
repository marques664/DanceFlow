import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Calendar, 
  Users, 
  Save, 
  CheckSquare, 
  Plus, 
  UserPlus, 
  AlertCircle,
  FileText,
  Lock,
  Loader
} from 'lucide-react';
import { api } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import './Attendance.css';

export function Attendance() {
  const user = getCurrentUser();
  const isAdmin = user && user.role === 'ADMIN';

  // Filters
  const [classesList, setClassesList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  
  // Lesson state
  const [activeLesson, setActiveLesson] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Substitute states
  const [isSubstitute, setIsSubstitute] = useState(false);
  const [substituteTeacher, setSubstituteTeacher] = useState('');
  const [teachersList, setTeachersList] = useState([]);

  // Trial student inline form
  const [showAddTrial, setShowAddTrial] = useState(false);
  const [trialName, setTrialName] = useState('');
  const [trialAge, setTrialAge] = useState('');
  const [trialError, setTrialError] = useState('');

  // Loading indicator for actions
  const [formLoading, setFormLoading] = useState(false);

  // Call status: draft | finalized | unsaved | none
  const [callStatus, setCallStatus] = useState('none');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && date) {
      findOrCreateLesson();
    }
  }, [selectedClass, date]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const classesData = await api.get('/classes');
      setClassesList(classesData || []);
      if (classesData && classesData.length > 0) {
        setSelectedClass(classesData[0].id);
      }
      
      const usersData = await api.get('/users');
      const teachers = (usersData || []).filter(u => u.role === 'TEACHER');
      setTeachersList(teachers);
    } catch (err) {
      setError('Erro ao inicializar página: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const findOrCreateLesson = async () => {
    setLoading(true);
    setError('');
    setActiveLesson(null);
    setStudents([]);
    setCallStatus('none');
    try {
      // Find if there is a lesson scheduled for this class on this date
      const lessons = await api.get('/lessons', {
        params: {
          classId: selectedClass,
          dateStart: date,
          dateEnd: date
        }
      });

      if (lessons && lessons.length > 0) {
        const lesson = lessons[0];
        setActiveLesson(lesson);
        await fetchLessonDetails(lesson.id);
      } else {
        setCallStatus('none');
      }
    } catch (err) {
      setError('Erro ao carregar aula: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonDetails = async (lessonId) => {
    try {
      const details = await api.get(`/lessons/${lessonId}`);
      setActiveLesson(details);
      
      // Map students status for presentation
      const mappedStudents = details.students.map((s) => ({
        id: s.id,
        name: s.name,
        plan: s.plan,
        isActive: s.isActive,
        status: s.attendanceStatus ? s.attendanceStatus.toLowerCase() : null
      }));
      setStudents(mappedStudents);

      if (details.substituteTeacher) {
        setIsSubstitute(true);
        setSubstituteTeacher(details.substituteTeacher);
      } else {
        setIsSubstitute(false);
        setSubstituteTeacher('');
      }

      // Determine callStatus
      if (details.status === 'CONCLUDED') {
        setCallStatus('finalized');
      } else {
        const hasDraft = details.students.some(s => s.attendanceIsDraft);
        setCallStatus(hasDraft ? 'draft' : 'unsaved');
      }
    } catch (err) {
      setError('Erro ao buscar detalhes da chamada: ' + err.message);
    }
  };

  const handleMarkAttendance = (studentId, status) => {
    if (isAdmin) return; // Admin is read-only (Rule 3.6)
    
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, status } : s
    ));
    if (callStatus === 'finalized' || callStatus === 'draft') {
      setCallStatus('unsaved');
    }
  };

  const handleMarkAllPresent = () => {
    if (isAdmin) return; 

    setStudents(students.map(s => ({ ...s, status: 'present' })));
    setCallStatus('unsaved');
    triggerNotification('Todas as alunas marcadas como Presente.', 'success');
  };

  const saveAttendance = async (isDraft) => {
    if (isAdmin || !activeLesson) return;

    const records = students.map((s) => ({
      studentId: s.id,
      status: s.status ? s.status.toUpperCase() : 'ABSENT'
    }));

    setFormLoading(true);
    try {
      await api.post(`/lessons/${activeLesson.id}/attendance`, {
        isDraft,
        records
      });

      triggerNotification(
        isDraft ? 'Rascunho de chamada salvo com sucesso!' : 'Chamada finalizada e registrada no sistema!',
        isDraft ? 'warning' : 'success'
      );
      
      // Reload details
      fetchLessonDetails(activeLesson.id);
    } catch (err) {
      triggerNotification('Erro ao salvar chamada: ' + err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveDraft = () => saveAttendance(true);

  const handleFinalize = () => {
    const hasUnmarked = students.some(s => s.status === null);
    if (hasUnmarked) {
      triggerNotification('Por favor, marque a presença ou falta de todas as alunas.', 'error');
      return;
    }
    saveAttendance(false);
  };

  const handleAddTrialStudent = async (e) => {
    e.preventDefault();
    if (!trialName.trim() || !trialAge) {
      setTrialError('Preencha o nome e a idade da aluna experimental.');
      return;
    }

    setFormLoading(true);
    setTrialError('');
    try {
      // Estimate birth date from age
      const birthYear = new Date().getFullYear() - parseInt(trialAge);
      const birthDate = `${birthYear}-01-01`;

      // 1. Create experimental student (linked to school)
      const newStudent = await api.post('/students', {
        name: `${trialName.trim()} (Experimental)`,
        birthDate,
        phone: 'Experimental',
        plan: 'Mensal',
        notes: 'Aluna experimental cadastrada via diário de classe.',
        guardian: {
          name: `Responsável de ${trialName.trim()}`,
          phone: 'Experimental',
          kinship: 'Outro'
        }
      });

      // 2. Enroll student in class
      await api.post(`/classes/${selectedClass}/students`, {
        studentId: newStudent.id
      });

      // 3. Reload lesson details to show the new student
      await fetchLessonDetails(activeLesson.id);

      setShowAddTrial(false);
      setTrialName('');
      setTrialAge('');
      triggerNotification('Aluna experimental vinculada com sucesso!', 'success');
    } catch (err) {
      setTrialError(err.message || 'Falha ao vincular aluna.');
    } finally {
      setFormLoading(false);
    }
  };

  const triggerNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  return (
    <div className="attendance-container">
      <header className="page-header">
        <div>
          <h1>Diário de Classe / Chamada</h1>
          <p className="subtitle">
            {isAdmin 
              ? 'Visualização de chamada para administradores.' 
              : 'Faça a chamada de forma rápida e salve rascunhos se necessário.'
            }
          </p>
        </div>
      </header>

      {/* Admin Disclaimer (Rule 3.6) */}
      {isAdmin && (
        <div className="alert alert-admin-info glass-card">
          <Lock size={18} className="lock-icon" />
          <div className="alert-content">
            <strong>Modo Somente Leitura (Administrador)</strong>
            <p>De acordo com as regras do sistema, administradores podem apenas consultar frequências. O lançamento ou alteração de presenças é restrito às professoras.</p>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className={`toast-notification ${notification.type} animate-fade-in`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Controls Grid */}
      <section className="attendance-config glass-card">
        <div className="config-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="class-select">Turma</label>
            <select
              id="class-select"
              className="form-input form-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classesList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="date-select">Data da Aula</label>
            <input
              id="date-select"
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="type-select">Tipo de Aula</label>
            <select
              id="type-select"
              className="form-input form-select"
              value={activeLesson ? activeLesson.type.toLowerCase() : 'regular'}
              disabled={true}
            >
              <option value="regular">Aula Regular</option>
              <option value="experimental">Aula Experimental</option>
              <option value="particular">Aula Particular</option>
            </select>
          </div>
        </div>

        {/* Substitute Teacher Indicator */}
        {activeLesson && activeLesson.substituteTeacher && (
          <div className="substitute-teacher-wrapper">
            <div className="substitute-badge">
              <span>Substituição: <strong>{activeLesson.substituteTeacher}</strong> está ministrando esta aula.</span>
            </div>
          </div>
        )}
      </section>

      {/* Main List */}
      {loading ? (
        <div className="loading-state glass-card">
          <Loader size={36} className="loader-spin" />
          <p>Carregando dados da chamada...</p>
        </div>
      ) : !activeLesson ? (
        <div className="empty-state glass-card">
          <Calendar size={48} className="empty-icon" />
          <h3>Nenhuma aula encontrada</h3>
          <p>Não há aulas agendadas para esta turma na data selecionada.</p>
        </div>
      ) : (
        <section className="attendance-sheet glass-card">
          <div className="sheet-header">
            <div className="sheet-title-info">
              <Users size={18} />
              <h2>Alunas Matriculadas ({students.length})</h2>
            </div>

            <div className="sheet-header-actions">
              {!isAdmin && callStatus !== 'finalized' && (
                <>
                  <button className="btn btn-secondary btn-small" onClick={() => setShowAddTrial(true)}>
                    <UserPlus size={16} />
                    <span>Vincular Aluna Experimental</span>
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={handleMarkAllPresent}>
                    <CheckSquare size={16} />
                    <span>Marcar Todas Presentes</span>
                  </button>
                </>
              )}
              
              {callStatus === 'draft' && (
                <span className="status-badge badge-draft">Rascunho Salvo</span>
              )}
              {callStatus === 'finalized' && (
                <span className="status-badge badge-finalized">Chamada Concluída</span>
              )}
            </div>
          </div>

          {/* Add Trial Student Inline Form */}
          {showAddTrial && (
            <form onSubmit={handleAddTrialStudent} className="trial-inline-form glass-card animate-fade-in">
              <div className="trial-form-header">
                <h4>Adicionar Aluna Experimental à Aula</h4>
                <button type="button" className="close-inline-btn" onClick={() => setShowAddTrial(false)}>
                  <X size={16} />
                </button>
              </div>
              
              {trialError && <p className="trial-inline-error">{trialError}</p>}
              
              <div className="trial-form-grid">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome da aluna experimental"
                  value={trialName}
                  onChange={(e) => setTrialName(e.target.value)}
                  disabled={formLoading}
                  required
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="Idade"
                  value={trialAge}
                  onChange={(e) => setTrialAge(e.target.value)}
                  disabled={formLoading}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          )}

          {/* Students Check List */}
          <div className="attendance-students-list">
            {students.length === 0 ? (
              <p className="no-students-text">Nenhuma aluna matriculada nesta turma.</p>
            ) : (
              students.map((student) => (
                <div key={student.id} className={`student-row-item ${student.status || 'unmarked'}`}>
                  <div className="student-profile-info">
                    <div className="avatar-letter">
                      {student.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <span className="student-sheet-name">{student.name}</span>
                      <span className="student-sheet-meta">
                        {student.plan} • {student.name.includes('(Experimental)') ? 'Aula Experimental' : 'Aluna Regular'}
                      </span>
                    </div>
                  </div>

                  {/* Attendance Toggle Switches */}
                  <div className="attendance-action-switches">
                    <button
                      type="button"
                      className={`switch-btn btn-present ${student.status === 'present' ? 'active' : ''}`}
                      onClick={() => handleMarkAttendance(student.id, 'present')}
                      disabled={isAdmin || formLoading}
                    >
                      <Check size={16} />
                      <span>Presente</span>
                    </button>
                    <button
                      type="button"
                      className={`switch-btn btn-absent ${student.status === 'absent' ? 'active' : ''}`}
                      onClick={() => handleMarkAttendance(student.id, 'absent')}
                      disabled={isAdmin || formLoading}
                    >
                      <X size={16} />
                      <span>Falta</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {!isAdmin && (
            <div className="attendance-sheet-footer">
              <span className="call-info-status-text">
                {callStatus === 'finalized' && '✓ Chamada finalizada no sistema. Você pode alterar frequências se necessário.'}
                {callStatus === 'draft' && '⚡ Rascunho salvo em base de dados.'}
                {callStatus === 'unsaved' && '⚠️ Alterações pendentes de salvamento.'}
              </span>
              <div className="footer-action-buttons">
                <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={formLoading}>
                  <Save size={18} />
                  <span>Salvar Rascunho</span>
                </button>
                <button className="btn btn-primary" onClick={handleFinalize} disabled={formLoading}>
                  <Check size={18} />
                  <span>Finalizar Chamada</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
export default Attendance;
