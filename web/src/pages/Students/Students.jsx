import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, X, User, Info, FileText, Trash2, Check, Loader, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import './Students.css';

export function Students() {
  const user = getCurrentUser();
  const isAdmin = user && user.role === 'ADMIN';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInactivateModal, setShowInactivateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('Mensal');
  const [notes, setNotes] = useState('');

  // Guardian fields (no CPF as per MVP specs)
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianKinship, setGuardianKinship] = useState('Mãe');
  const [isAdult, setIsAdult] = useState(false);

  // Details Modal tabs state
  const [activeTab, setActiveTab] = useState('general');
  const [studentHistory, setStudentHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [classesList, setClassesList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedScheduleIds, setSelectedScheduleIds] = useState([]);

  // Conversion Modal states
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertName, setConvertName] = useState('');
  const [convertPhone, setConvertPhone] = useState('');
  const [convertBirthDate, setConvertBirthDate] = useState('');
  const [convertPlan, setConvertPlan] = useState('Mensal');
  const [convertNotes, setConvertNotes] = useState('');
  const [convertIsAdult, setConvertIsAdult] = useState(false);
  const [convertGuardianName, setConvertGuardianName] = useState('');
  const [convertGuardianPhone, setConvertGuardianPhone] = useState('');
  const [convertGuardianEmail, setConvertGuardianEmail] = useState('');
  const [convertGuardianKinship, setConvertGuardianKinship] = useState('Mãe');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/students');
      setStudents(data || []);
    } catch (err) {
      setError(err.message || 'Falha ao carregar as alunas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await api.get('/classes');
      setClassesList(data || []);
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    }
  };

  const handleOpenCreate = () => {
    if (!isAdmin) return;
    setName('');
    setBirthDate('');
    setPhone('');
    setPlan('Mensal');
    setNotes('');
    setGuardianName('');
    setGuardianPhone('');
    setGuardianEmail('');
    setGuardianKinship('Mãe');
    setIsAdult(false);

    const defaultClassId = classesList[0]?.id || '';
    setSelectedClassId(defaultClassId);
    if (defaultClassId) {
      const targetClass = classesList.find(c => c.id === defaultClassId);
      setSelectedScheduleIds(targetClass?.schedules?.map(s => s.id) || []);
    } else {
      setSelectedScheduleIds([]);
    }

    setFormError('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const hasGuardian = !isAdult;
    if (!name.trim() || !birthDate || !phone.trim() || (hasGuardian && (!guardianName.trim() || !guardianPhone.trim()))) {
      setFormError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const newStudent = await api.post('/students', {
        name,
        birthDate,
        phone,
        plan,
        notes: notes.trim() || undefined,
        guardian: hasGuardian ? {
          name: guardianName.trim(),
          phone: guardianPhone.trim(),
          email: guardianEmail.trim() || undefined,
          kinship: guardianKinship
        } : null
      });

      if (selectedClassId) {
        await api.post(`/classes/${selectedClassId}/students`, {
          studentId: newStudent.id,
          scheduleIds: selectedScheduleIds
        });
      }

      setShowCreateModal(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.message || 'Erro ao cadastrar aluna.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDetails = async (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
    setActiveTab('general');
    setStudentHistory(null);
    setHistoryLoading(true);
    try {
      const historyData = await api.get(`/students/${student.id}/history`);
      setStudentHistory(historyData);
    } catch (err) {
      console.error('Falha ao buscar histórico de frequência:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenInactivate = (student) => {
    if (!isAdmin) return;
    setSelectedStudent(student);
    setFormError('');
    setShowInactivateModal(true);
  };

  const handleOpenConvert = (student) => {
    setSelectedStudent(student);
    const cleanName = student.name.replace(' (Experimental)', '');
    setConvertName(cleanName);
    setConvertPhone(student.phone === 'Experimental' ? '' : student.phone);
    setConvertBirthDate('');
    setConvertPlan(student.plan || 'Mensal');
    setConvertNotes(student.notes === 'Aluna experimental cadastrada via diário de classe.' ? '' : student.notes || '');

    if (student.guardian) {
      setConvertGuardianName(student.guardian.name.startsWith('Responsável de') ? '' : student.guardian.name);
      setConvertGuardianPhone(student.guardian.phone === 'Experimental' ? '' : student.guardian.phone);
      setConvertGuardianEmail(student.guardian.email || '');
      setConvertGuardianKinship(student.guardian.kinship || 'Mãe');
    } else {
      setConvertGuardianName('');
      setConvertGuardianPhone('');
      setConvertGuardianEmail('');
      setConvertGuardianKinship('Mãe');
    }
    setConvertIsAdult(false);
    setFormError('');
    setShowConvertModal(true);
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!convertName.trim() || !convertBirthDate || !convertPhone.trim()) {
      setFormError('Por favor, preencha o nome, telefone e data de nascimento.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const body = {
        name: convertName.trim(),
        birthDate: convertBirthDate,
        phone: convertPhone.trim(),
        plan: convertPlan,
        notes: convertNotes.trim() || undefined,
        guardian: convertIsAdult ? null : {
          name: convertGuardianName.trim(),
          phone: convertGuardianPhone.trim(),
          email: convertGuardianEmail.trim() || undefined,
          kinship: convertGuardianKinship
        }
      };

      if (!convertIsAdult) {
        if (!body.guardian.name || !body.guardian.phone) {
          setFormError('Por favor, preencha o nome e telefone do responsável financeiro.');
          setFormLoading(false);
          return;
        }
      }

      await api.put(`/students/${selectedStudent.id}`, body);
      setShowConvertModal(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.message || 'Erro ao converter aluna.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleInactivate = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      await api.delete(`/students/${selectedStudent.id}`);
      setShowInactivateModal(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.message || 'Erro ao inativar aluna.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.guardian && s.guardian.name && s.guardian.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="students-container">
      <header className="page-header">
        <div>
          <h1>Alunas e Responsáveis</h1>
          <p className="subtitle">Gerencie o cadastro de alunas, planos e contatos dos responsáveis.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Cadastrar Aluna</span>
          </button>
        )}
      </header>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn-close-alert" onClick={fetchStudents}>Recarregar</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="table-toolbar glass-card">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Pesquisar por nome da aluna ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="total-badge">
          <span>{filteredStudents.length} {filteredStudents.length === 1 ? 'aluna' : 'alunas'}</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <Loader size={36} className="loader-spin" />
          <p>Carregando alunas...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="empty-state glass-card">
          <User size={48} className="empty-icon" />
          <h3>Nenhuma aluna encontrada</h3>
          <p>{searchTerm ? 'Tente ajustar sua busca.' : 'Comece cadastrando uma nova aluna no sistema.'}</p>
        </div>
      ) : (
        <div className="table-wrapper-card glass-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Idade</th>
                <th>Telefone</th>
                <th>Plano</th>
                <th>Turma(s)</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id} className="table-row">
                  <td>
                    <div className="student-name-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="font-semibold text-white">{s.name}</span>
                        {s.name.endsWith(' (Experimental)') && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              backgroundColor: 'rgba(236, 72, 153, 0.15)',
                              color: '#ec4899',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(236, 72, 153, 0.3)'
                            }}
                          >
                            Experimental
                          </span>
                        )}
                      </div>
                      {s.guardian && (
                        <span className="guardian-sub">{s.guardian.kinship}: {s.guardian.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="text-white">{s.age} anos</td>
                  <td className="text-muted">{s.phone}</td>
                  <td>
                    <span className="plan-badge">{s.plan}</span>
                  </td>
                  <td>
                    <div className="classes-badges-list">
                      {(s.classes || []).length > 0 ? (
                        (s.classes || []).map((cls, idx) => (
                          <span key={idx} className="class-badge-item">{cls}</span>
                        ))
                      ) : (
                        <span className="text-muted text-xs">Sem turma</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge-status active">
                      {s.status}
                    </span>
                  </td>
                  <td className="text-right actions-cell">
                    {isAdmin && s.name.endsWith(' (Experimental)') && (
                      <button
                        className="action-btn convert-btn"
                        onClick={() => handleOpenConvert(s)}
                        title="Converter em aluna regular"
                        style={{ color: '#10b981', marginRight: '0.5rem' }}
                      >
                        <UserCheck size={16} />
                      </button>
                    )}
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleOpenDetails(s)}
                      title="Visualizar ficha completa"
                    >
                      <Info size={16} />
                    </button>
                    {isAdmin && (
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleOpenInactivate(s)}
                        title="Inativar aluna"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedStudent && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in student-details-modal">
            <div className="modal-header">
              <h2>Ficha da Aluna</h2>
              <button className="modal-close-btn" onClick={() => setShowDetailsModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body scrollable-modal-body">
              {/* Profile section */}
              <div className="profile-summary">
                <div className="profile-avatar">
                  <User size={32} />
                </div>
                <div>
                  <h3>{selectedStudent.name}</h3>
                  <span className="badge-status active">
                    Aluna Ativa
                  </span>
                </div>
              </div>

              {/* Tab navigation */}
              <div className="modal-tabs" style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'transparent',
                    border: 'none',
                    color: activeTab === 'general' ? 'var(--color-pink-primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'general' ? '2px solid var(--color-pink-primary)' : 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  Dados Gerais
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'transparent',
                    border: 'none',
                    color: activeTab === 'history' ? 'var(--color-pink-primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'history' ? '2px solid var(--color-pink-primary)' : 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  Histórico de Frequência
                </button>
              </div>

              {activeTab === 'general' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Grid info */}
                  <div className="info-grid">
                    <div className="info-block">
                      <span className="info-label">Data de Nascimento</span>
                      <span className="info-value">
                        {new Date(selectedStudent.birthDate).toLocaleDateString('pt-BR')} ({selectedStudent.age} anos)
                      </span>
                    </div>
                    <div className="info-block">
                      <span className="info-label">Plano de Matrícula</span>
                      <span className="info-value">{selectedStudent.plan}</span>
                    </div>
                    <div className="info-block">
                      <span className="info-label">Telefone de Contato</span>
                      <span className="info-value">{selectedStudent.phone}</span>
                    </div>
                    <div className="info-block">
                      <span className="info-label">Turmas Vinculadas</span>
                      <span className="info-value">
                        {(selectedStudent.classes || []).length > 0
                          ? (selectedStudent.classes || []).join(', ')
                          : 'Nenhuma turma vinculada'}
                      </span>
                    </div>
                  </div>

                  {/* Responsible Info (Spec 3.3) */}
                  {selectedStudent.guardian && (
                    <div className="details-section-card">
                      <h4>Responsável Financeiro / Operacional</h4>
                      <div className="info-grid">
                        <div className="info-block">
                          <span className="info-label">Nome Completo</span>
                          <span className="info-value">{selectedStudent.guardian.name}</span>
                        </div>
                        <div className="info-block">
                          <span className="info-label">Parentesco</span>
                          <span className="info-value">{selectedStudent.guardian.kinship}</span>
                        </div>
                        <div className="info-block">
                          <span className="info-label">Telefone</span>
                          <span className="info-value">{selectedStudent.guardian.phone}</span>
                        </div>
                        <div className="info-block">
                          <span className="info-label">E-mail</span>
                          <span className="info-value">{selectedStudent.guardian.email || 'Não cadastrado'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedStudent.notes && (
                    <div className="details-section-card notes-card">
                      <h4><FileText size={16} /> Observações Médicas / Gerais</h4>
                      <p>{selectedStudent.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="attendance-history-tab">
                  {historyLoading ? (
                    <div className="loading-state" style={{ padding: '2rem 0' }}>
                      <Loader size={24} className="loader-spin" />
                      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Carregando histórico...</p>
                    </div>
                  ) : !studentHistory ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum histórico disponível.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Metrics Card */}
                      <div
                        className="details-section-card"
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem 1.25rem',
                          background: 'rgba(255, 255, 255, 0.02)'
                        }}
                      >
                        <div>
                          <h4 style={{ margin: 0, border: 'none', padding: 0 }}>Frequência Geral</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Aulas assistidas: {studentHistory.metrics.presents} de {studentHistory.metrics.totalConcluded}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            color: studentHistory.metrics.attendanceRate >= 80
                              ? '#10b981'
                              : studentHistory.metrics.attendanceRate >= 50
                                ? '#f59e0b'
                                : '#ef4444'
                          }}
                        >
                          {studentHistory.metrics.attendanceRate}%
                        </div>
                      </div>

                      {/* History Log List */}
                      {studentHistory.history.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
                          Nenhum registro de chamada concluído encontrado.
                        </p>
                      ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                          <table className="custom-table" style={{ margin: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Data</th>
                                <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Turma</th>
                                <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Presença</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentHistory.history.map((record, index) => (
                                <tr key={index} className="table-row">
                                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                    {new Date(record.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                  </td>
                                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span className="text-white">{record.className}</span>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{record.modality}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                    {record.isDraft ? (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Rascunho</span>
                                    ) : record.status === 'PRESENT' ? (
                                      <span style={{ color: '#10b981', fontWeight: 600 }}>Presente</span>
                                    ) : (
                                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Falta</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STUDENT MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className={`modal-content glass-card animate-fade-in student-form-modal ${isAdult ? 'no-guardian' : ''}`}>
            <div className="modal-header">
              <h2>Cadastrar Nova Aluna</h2>
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

            <form onSubmit={handleCreate} className={`modal-form student-form-grid ${isAdult ? 'no-guardian' : ''}`}>
              <div className="student-fields-section">
                <h3>Dados da Aluna</h3>

                <div className="form-group">
                  <label className="form-label" htmlFor="student-name">Nome Completo *</label>
                  <input
                    id="student-name"
                    type="text"
                    className="form-input"
                    placeholder="Nome da aluna"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={formLoading}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-birth">Data de Nascimento *</label>
                    <input
                      id="student-birth"
                      type="date"
                      className="form-input"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      disabled={formLoading}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-phone">Telefone *</label>
                    <input
                      id="student-phone"
                      type="text"
                      className="form-input"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={formLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-plan">Plano *</label>
                    <select
                      id="student-plan"
                      className="form-input form-select"
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      disabled={formLoading}
                    >
                      <option value="Mensal">Mensal</option>
                      <option value="Semestral">Semestral</option>
                      <option value="Anual">Anual</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-class">Vincular à Turma</label>
                    <select
                      id="student-class"
                      className="form-input form-select"
                      value={selectedClassId}
                      onChange={(e) => handleClassChange(e.target.value)}
                      disabled={formLoading}
                    >
                      <option value="">Nenhuma turma</option>
                      {classesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedClassId && (
                  (() => {
                    const targetClass = classesList.find(c => c.id === selectedClassId);
                    if (targetClass && targetClass.schedules && targetClass.schedules.length > 0) {
                      return (
                        <div className="form-group student-schedule-selection-group animate-fade-in">
                          <label className="form-label">Selecionar Horários de Aula *</label>
                          <div className="student-schedules-checkbox-list">
                            {targetClass.schedules.map(s => (
                              <label key={s.id} className="student-schedule-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={selectedScheduleIds.includes(s.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedScheduleIds([...selectedScheduleIds, s.id]);
                                    } else {
                                      setSelectedScheduleIds(selectedScheduleIds.filter(id => id !== s.id));
                                    }
                                  }}
                                  disabled={formLoading}
                                />
                                <span>{s.dayOfWeek} das {s.timeStart} às {s.timeEnd}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="student-notes">Observações</label>
                  <textarea
                    id="student-notes"
                    className="form-input form-textarea"
                    placeholder="Restrições médicas, observações pedagógicas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={formLoading}
                    rows="3"
                  />
                </div>                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1.2rem', marginBottom: '0.2rem' }}>
                  <input
                    id="student-is-adult"
                    type="checkbox"
                    checked={isAdult}
                    onChange={(e) => setIsAdult(e.target.checked)}
                    disabled={formLoading}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="student-is-adult" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-white)', fontWeight: 500 }}>
                    Aluna maior de idade (+18 anos - dispensa responsável)
                  </label>
                </div>
              </div>

              {!isAdult && (
                <div className="guardian-fields-section">
                  <h3>Dados do Responsável (Sem CPF)</h3>

                  <div className="form-group">
                    <label className="form-label" htmlFor="guard-name">Nome Completo *</label>
                    <input
                      id="guard-name"
                      type="text"
                      className="form-input"
                      placeholder="Nome do responsável"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      disabled={formLoading}
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="guard-kinship">Parentesco *</label>
                      <select
                        id="guard-kinship"
                        className="form-input form-select"
                        value={guardianKinship}
                        onChange={(e) => setGuardianKinship(e.target.value)}
                        disabled={formLoading}
                      >
                        <option value="Mãe">Mãe</option>
                        <option value="Pai">Pai</option>
                        <option value="Avó/Avô">Avó/Avô</option>
                        <option value="Tio/Tia">Tio/Tia</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="guard-phone">Telefone *</label>
                      <input
                        id="guard-phone"
                        type="text"
                        className="form-input"
                        placeholder="(11) 99999-9999"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        disabled={formLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="guard-email">E-mail</label>
                    <input
                      id="guard-email"
                      type="email"
                      className="form-input"
                      placeholder="responsavel@email.com"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      disabled={formLoading}
                    />
                  </div>
                </div>
              )}

              <div className="modal-footer full-width-footer">
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
                  {formLoading ? 'Salvando...' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INACTIVATE CONFIRM MODAL */}
      {showInactivateModal && selectedStudent && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in modal-confirm">
            <div className="modal-header header-danger">
              <h2>Inativar Registro de Aluna</h2>
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
              <p>Tem certeza de que deseja inativar a aluna <strong>{selectedStudent.name}</strong>?</p>
              <p className="confirm-warning-text">
                Ela será removida das chamadas futuras, mas seu histórico de frequência e dados pessoais continuarão armazenados no banco de dados (inativação lógica).
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
                {formLoading ? 'Inativando...' : 'Inativar Aluna'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT EXPERIMENTAL STUDENT MODAL */}
      {showConvertModal && selectedStudent && (
        <div className="modal-backdrop">
          <div className={`modal-content glass-card animate-fade-in student-form-modal ${convertIsAdult ? 'no-guardian' : ''}`}>
            <div className="modal-header">
              <h2>Matricular Aluna Regular</h2>
              <button className="modal-close-btn" onClick={() => setShowConvertModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="modal-error">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleConvert} className={`modal-form student-form-grid ${convertIsAdult ? 'no-guardian' : ''}`}>
              <div className="student-fields-section">
                <h3>Dados da Aluna</h3>

                <div className="form-group">
                  <label className="form-label" htmlFor="convert-name">Nome Completo *</label>
                  <input
                    id="convert-name"
                    type="text"
                    className="form-input"
                    placeholder="Nome da aluna"
                    value={convertName}
                    onChange={(e) => setConvertName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="convert-birthDate">Data de Nascimento *</label>
                  <input
                    id="convert-birthDate"
                    type="date"
                    className="form-input"
                    value={convertBirthDate}
                    onChange={(e) => setConvertBirthDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="convert-phone">Telefone de Contato *</label>
                  <input
                    id="convert-phone"
                    type="text"
                    className="form-input"
                    placeholder="Ex: (11) 99999-9999"
                    value={convertPhone}
                    onChange={(e) => setConvertPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="convert-plan">Plano de Matrícula *</label>
                  <select
                    id="convert-plan"
                    className="form-input"
                    value={convertPlan}
                    onChange={(e) => setConvertPlan(e.target.value)}
                    required
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="convert-notes">Observações</label>
                  <textarea
                    id="convert-notes"
                    className="form-input text-area"
                    rows="3"
                    placeholder="Alergias, observações médicas..."
                    value={convertNotes}
                    onChange={(e) => setConvertNotes(e.target.value)}
                  />
                </div>

                {/* Checklist condition: +18 removes guardian required fields */}
                <div className="form-checkbox-group">
                  <input
                    type="checkbox"
                    id="convert-isAdult"
                    checked={convertIsAdult}
                    onChange={(e) => setConvertIsAdult(e.target.checked)}
                  />
                  <label htmlFor="convert-isAdult">Aluna maior de idade (+18 anos - dispensa responsável)</label>
                </div>
              </div>

              {/* Responsible Info Section */}
              {!convertIsAdult && (
                <div className="guardian-fields-section">
                  <h3>Responsável Financeiro / Operacional</h3>

                  <div className="form-group">
                    <label className="form-label" htmlFor="convert-guardian-name">Nome do Responsável *</label>
                    <input
                      id="convert-guardian-name"
                      type="text"
                      className="form-input"
                      placeholder="Nome do pai, mãe ou tutor"
                      value={convertGuardianName}
                      onChange={(e) => setConvertGuardianName(e.target.value)}
                      required={!convertIsAdult}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="convert-guardian-kinship">Parentesco *</label>
                    <select
                      id="convert-guardian-kinship"
                      className="form-input"
                      value={convertGuardianKinship}
                      onChange={(e) => setConvertGuardianKinship(e.target.value)}
                      required={!convertIsAdult}
                    >
                      <option value="Mãe">Mãe</option>
                      <option value="Pai">Pai</option>
                      <option value="Avó/Avô">Avó/Avô</option>
                      <option value="Tio/Tia">Tio/Tia</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="convert-guardian-phone">Telefone do Responsável *</label>
                    <input
                      id="convert-guardian-phone"
                      type="text"
                      className="form-input"
                      placeholder="Telefone de contato do responsável"
                      value={convertGuardianPhone}
                      onChange={(e) => setConvertGuardianPhone(e.target.value)}
                      required={!convertIsAdult}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="convert-guardian-email">E-mail do Responsável</label>
                    <input
                      id="convert-guardian-email"
                      type="email"
                      className="form-input"
                      placeholder="email@exemplo.com"
                      value={convertGuardianEmail}
                      onChange={(e) => setConvertGuardianEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Form Actions Footer inside grid span */}
              <div className="form-grid-actions-span">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConvertModal(false)}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Salvando...' : 'Confirmar Matrícula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Students;
