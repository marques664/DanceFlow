import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, X, User, Info, FileText, Trash2, Check, Loader } from 'lucide-react';
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

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchStudents();
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
    setFormError('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !birthDate || !phone.trim() || !guardianName.trim() || !guardianPhone.trim()) {
      setFormError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      await api.post('/students', {
        name,
        birthDate,
        phone,
        plan,
        notes: notes.trim() || undefined,
        guardian: {
          name: guardianName.trim(),
          phone: guardianPhone.trim(),
          email: guardianEmail.trim() || undefined,
          kinship: guardianKinship
        }
      });
      setShowCreateModal(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.message || 'Erro ao cadastrar aluna.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleOpenInactivate = (student) => {
    if (!isAdmin) return;
    setSelectedStudent(student);
    setFormError('');
    setShowInactivateModal(true);
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
    (s.guardian && s.guardian.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
                      <span className="font-semibold text-white">{s.name}</span>
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
                      {/* Turmas are mocked for now as classes table is pending */}
                      {(s.classes || ['Ballet Infantil A']).map((cls, idx) => (
                        <span key={idx} className="class-badge-item">{cls}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="badge-status active">
                      {s.status}
                    </span>
                  </td>
                  <td className="text-right actions-cell">
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
                  <span className="info-value">{(selectedStudent.classes || ['Ballet Infantil A']).join(', ')}</span>
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
          <div className="modal-content glass-card animate-fade-in student-form-modal">
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

            <form onSubmit={handleCreate} className="modal-form student-form-grid">
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
                      disabled={true}
                      value="1"
                    >
                      <option value="1">Ballet Infantil A</option>
                    </select>
                  </div>
                </div>

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
                </div>
              </div>

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
    </div>
  );
}
export default Students;
