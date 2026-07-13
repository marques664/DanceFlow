import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, User, Clock, Users, X, AlertCircle, Trash2, Loader } from 'lucide-react';
import { api } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import './Classes.css';

export function Classes() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  const [classesList, setClassesList] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Creation modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Inactivation modal states (UX refactoring)
  const [showInactivateModal, setShowInactivateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Form states
  const [className, setClassName] = useState('');
  const [selectedModalityId, setSelectedModalityId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [secTeacher, setSecTeacher] = useState('');
  const [schedules, setSchedules] = useState([{ dayOfWeek: 'Segunda', timeStart: '', timeEnd: '' }]);

  const handleAddSchedule = () => {
    setSchedules([...schedules, { dayOfWeek: 'Segunda', timeStart: '', timeEnd: '' }]);
  };

  const handleRemoveSchedule = (index) => {
    if (schedules.length === 1) return;
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const classesData = await api.get('/classes');
      setClassesList(classesData || []);

      if (isAdmin) {
        const modalitiesData = await api.get('/modalities');
        setModalities(modalitiesData || []);

        const usersData = await api.get('/users');
        const teacherUsers = (usersData || []).filter(u => u.role === 'TEACHER');
        setTeachers(teacherUsers);

        // Pre-select defaults
        if (modalitiesData && modalitiesData.length > 0) {
          setSelectedModalityId(modalitiesData[0].id);
        }
        if (teacherUsers && teacherUsers.length > 0) {
          setSelectedTeacherId(teacherUsers[0].id);
        }
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar os dados de turmas.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    if (!isAdmin) return;
    setClassName('');
    if (modalities.length > 0) setSelectedModalityId(modalities[0].id);
    if (teachers.length > 0) setSelectedTeacherId(teachers[0].id);
    setSecTeacher('');
    setSchedules([{ dayOfWeek: 'Segunda', timeStart: '', timeEnd: '' }]);
    setFormError('');
    setShowCreateModal(true);
  };

  const handleToggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const invalidSchedule = schedules.some(s => !s.dayOfWeek || !s.timeStart || !s.timeEnd);
    if (!className.trim() || !selectedModalityId || !selectedTeacherId || invalidSchedule) {
      setFormError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      await api.post('/classes', {
        name: className.trim(),
        modalityId: selectedModalityId,
        mainTeacherId: selectedTeacherId,
        secondaryTeachers: secTeacher.trim() ? [secTeacher.trim()] : [],
        schedules
      });
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Erro ao criar turma.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenInactivate = (cls) => {
    if (!isAdmin) return;
    setSelectedClass(cls);
    setFormError('');
    setShowInactivateModal(true);
  };

  const handleInactivate = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      await api.delete(`/classes/${selectedClass.id}`);
      setShowInactivateModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Falha ao inativar a turma.');
    } finally {
      setFormLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const filteredClasses = classesList.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.modality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mainTeacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="classes-container">
      <header className="page-header">
        <div>
          <h1>Turmas</h1>
          <p className="subtitle">Gerencie as turmas, horários e professoras vinculadas.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nova Turma</span>
          </button>
        )}
      </header>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn-close-alert" onClick={fetchData}>Recarregar</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="table-toolbar glass-card">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Pesquisar por turma, modalidade ou professora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="total-badge">
          <span>{filteredClasses.length} {filteredClasses.length === 1 ? 'turma' : 'turmas'}</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <Loader size={36} className="loader-spin" />
          <p>Carregando turmas...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="empty-state glass-card">
          <Calendar size={48} className="empty-icon" />
          <h3>Nenhuma turma encontrada</h3>
          <p>{searchTerm ? 'Tente ajustar sua busca.' : 'Comece criando uma nova turma para a escola.'}</p>
        </div>
      ) : (
        <div className="classes-grid">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="class-card-item glass-card">
              <div className="class-card-header">
                <div>
                  <span className="class-modality-tag">{cls.modality}</span>
                  <h3>{cls.name}</h3>
                </div>
                <span className="badge-status active">
                  {cls.status}
                </span>
              </div>

              <div className="class-card-details">
                <div className="details-row">
                  <Clock size={16} className="details-icon" />
                  <span>{cls.schedule}</span>
                </div>
                <div className="details-row">
                  <User size={16} className="details-icon text-pink" />
                  <span>
                    Principal: <strong>{cls.mainTeacher}</strong>
                  </span>
                </div>
                {cls.secondaryTeachers && cls.secondaryTeachers.length > 0 && (
                  <div className="details-row">
                    <User size={16} className="details-icon text-purple" />
                    <span>Auxiliar: {cls.secondaryTeachers.join(', ')}</span>
                  </div>
                )}
                <div className="details-row font-medium">
                  <Users size={16} className="details-icon text-cyan" />
                  <span>{cls.studentCount} Alunas Matriculadas</span>
                </div>
              </div>

              {isAdmin && (
                <div className="class-card-footer">
                  <button 
                    className="btn btn-secondary btn-icon-only"
                    onClick={() => handleOpenInactivate(cls)}
                    title="Inativar turma"
                  >
                    <Trash2 size={16} className="text-red" />
                    <span>Inativar</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in class-form-modal">
            <div className="modal-header">
              <h2>Nova Turma</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            {formError && (
              <div className="modal-error">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="class-name">Nome da Turma *</label>
                <input
                  id="class-name"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Ballet Infantil A, Jazz Juvenil"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="class-modality">Modalidade *</label>
                  <select
                    id="class-modality"
                    className="form-input form-select"
                    value={selectedModalityId}
                    onChange={(e) => setSelectedModalityId(e.target.value)}
                    disabled={formLoading}
                  >
                    {modalities.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="class-main-teacher">Professora Principal *</label>
                  <select
                    id="class-main-teacher"
                    className="form-input form-select"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    disabled={formLoading}
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="class-sec-teacher">Professora Secundária / Auxiliar</label>
                <input
                  id="class-sec-teacher"
                  type="text"
                  className="form-input"
                  placeholder="Nome da professora secundária se houver"
                  value={secTeacher}
                  onChange={(e) => setSecTeacher(e.target.value)}
                  disabled={formLoading}
                />
              </div>

              {/* Schedules definition */}
              <div className="form-group schedules-form-section">
                <div className="schedules-section-header">
                  <label className="form-label">Horários / Encontros Semanais *</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddSchedule}
                    disabled={formLoading}
                  >
                    + Adicionar Horário
                  </button>
                </div>

                {schedules.map((sch, index) => (
                  <div key={index} className="schedule-form-row">
                    <div className="schedule-field day-field">
                      <select
                        className="form-input form-select"
                        value={sch.dayOfWeek}
                        onChange={(e) => handleScheduleChange(index, 'dayOfWeek', e.target.value)}
                        disabled={formLoading}
                        required
                      >
                        {weekDays.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="schedule-field time-field">
                      <input
                        type="time"
                        className="form-input"
                        value={sch.timeStart}
                        onChange={(e) => handleScheduleChange(index, 'timeStart', e.target.value)}
                        disabled={formLoading}
                        required
                      />
                    </div>
                    <span className="time-separator">às</span>
                    <div className="schedule-field time-field">
                      <input
                        type="time"
                        className="form-input"
                        value={sch.timeEnd}
                        onChange={(e) => handleScheduleChange(index, 'timeEnd', e.target.value)}
                        disabled={formLoading}
                        required
                      />
                    </div>
                    {schedules.length > 1 && (
                      <button
                        type="button"
                        className="btn-danger-link"
                        onClick={() => handleRemoveSchedule(index)}
                        disabled={formLoading}
                        title="Remover este horário"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Criando...' : 'Criar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INACTIVATE CONFIRM MODAL */}
      {showInactivateModal && selectedClass && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in modal-confirm">
            <div className="modal-header header-danger">
              <h2>Inativar Turma</h2>
              <button className="modal-close-btn" onClick={() => setShowInactivateModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="modal-error">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div className="confirm-body">
              <p>Tem certeza de que deseja inativar a turma <strong>{selectedClass.name}</strong>?</p>
              <p className="confirm-warning-text">
                As aulas agendadas para ela serão mantidas no histórico, mas ela não ficará mais disponível para novas chamadas (inativação lógica).
              </p>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowInactivateModal(false)}
                disabled={formLoading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleInactivate}
                disabled={formLoading}
              >
                {formLoading ? 'Inativando...' : 'Inativar Turma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Classes;
