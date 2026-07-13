import React, { useState, useEffect } from 'react';
import { Plus, Search, User, Mail, Shield, Edit, Trash2, X, AlertCircle, Loader, Check, Copy, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import './Teachers.css';

export function Teachers() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  const [teachersList, setTeachersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInactivateModal, setShowInactivateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/teachers');
      setTeachersList(data || []);
    } catch (err) {
      setError(err.message || 'Falha ao carregar as professoras.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    if (!isAdmin) return;
    setName('');
    setEmail('');
    setFormError('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError('Por favor, preencha todos os campos.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await api.post('/teachers', {
        name: name.trim(),
        email: email.trim()
      });
      
      setInviteResult({
        name: name.trim(),
        email: email.trim(),
        activationUrl: response.activationUrl
      });
      
      setShowCreateModal(false);
      setShowInviteModal(true);
      fetchTeachers();
    } catch (err) {
      setFormError(err.message || 'Erro ao cadastrar professora.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEdit = (teacher) => {
    if (!isAdmin) return;
    setSelectedTeacher(teacher);
    setName(teacher.name);
    setEmail(teacher.email);
    setPassword('');
    setFormError('');
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('O nome é obrigatório.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      await api.put(`/teachers/${selectedTeacher.id}`, {
        name: name.trim(),
        email: email.trim() || undefined,
        password: password.trim() || undefined
      });
      setShowEditModal(false);
      fetchTeachers();
    } catch (err) {
      setFormError(err.message || 'Erro ao atualizar professora.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenInactivate = (teacher) => {
    if (!isAdmin) return;
    setSelectedTeacher(teacher);
    setFormError('');
    setShowInactivateModal(true);
  };

  const handleInactivate = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      await api.delete(`/teachers/${selectedTeacher.id}`);
      setShowInactivateModal(false);
      fetchTeachers();
    } catch (err) {
      setFormError(err.message || 'Erro ao inativar professora.');
    } finally {
      setFormLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const filteredTeachers = teachersList.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="teachers-container">
      <header className="page-header">
        <div>
          <h1>Professoras</h1>
          <p className="subtitle">Gerencie as professoras ativas do estúdio de dança.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Cadastrar Professora</span>
          </button>
        )}
      </header>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn-close-alert" onClick={fetchTeachers}>Recarregar</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="table-toolbar glass-card">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="total-badge">
          <span>{filteredTeachers.length} {filteredTeachers.length === 1 ? 'professora' : 'professoras'}</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <Loader size={36} className="loader-spin" />
          <p>Carregando professoras...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="empty-state glass-card">
          <User size={48} className="empty-icon" />
          <h3>Nenhuma professora encontrada</h3>
          <p>{searchTerm ? 'Tente ajustar sua busca.' : 'Comece cadastrando uma nova professora.'}</p>
        </div>
      ) : (
        <div className="table-wrapper-card glass-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Status</th>
                {isAdmin && <th className="text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((t) => (
                <tr key={t.id} className="table-row">
                  <td>
                    <div className="teacher-name-cell">
                      <div className="teacher-avatar">
                        <User size={16} />
                      </div>
                      <span className="font-semibold text-white">{t.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">{t.email}</td>
                  <td>
                    <div className="role-cell">
                      <Shield size={14} className="text-pink" />
                      <span>Professora</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge-status active">Ativa</span>
                  </td>
                  {isAdmin && (
                    <td className="text-right actions-cell">
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => handleOpenEdit(t)}
                        title="Editar cadastro"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleOpenInactivate(t)}
                        title="Inativar professora"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE TEACHER MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in teacher-modal">
            <div className="modal-header">
              <h2>Cadastrar Professora</h2>
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
                <label className="form-label" htmlFor="teacher-name">Nome Completo *</label>
                <div className="input-with-icon-wrapper">
                  <User size={16} className="input-field-icon" />
                  <input
                    id="teacher-name"
                    type="text"
                    className="form-input icon-padded"
                    placeholder="Ex: Clara Lima"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={formLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="teacher-email">Endereço de E-mail *</label>
                <div className="input-with-icon-wrapper">
                  <Mail size={16} className="input-field-icon" />
                  <input
                    id="teacher-email"
                    type="email"
                    className="form-input icon-padded"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={formLoading}
                    required
                  />
                </div>
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
                  {formLoading ? 'Salvando...' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER INVITATION SUCCESS MODAL */}
      {showInviteModal && inviteResult && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in teacher-modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Convite da Professora</h2>
              <button className="modal-close-btn" onClick={() => setShowInviteModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: '600' }}>
                <Check size={18} />
                <span>Professora cadastrada com sucesso!</span>
              </div>

              <div className="details-info-block" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: '0.25rem 0' }}><strong>Professora:</strong> {inviteResult.name}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>E-mail:</strong> {inviteResult.email}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Link de ativação exclusivo:</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontSize: '0.8rem', flex: 1 }}
                    value={inviteResult.activationUrl}
                    readOnly
                  />
                  <button
                    type="button"
                    className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.activationUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{ minWidth: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Olá! A sua conta de professora no DanceFlow foi criada. Para definir sua senha e acessar o sistema, clique no link de convite exclusivo a seguir:\n\n${inviteResult.activationUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
                >
                  <MessageSquare size={18} />
                  <span>Enviar por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in teacher-modal">
            <div className="modal-header">
              <h2>Editar Professora</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            {formError && (
              <div className="modal-error">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEdit} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">Nome Completo *</label>
                <div className="input-with-icon-wrapper">
                  <User size={16} className="input-field-icon" />
                  <input
                    id="edit-name"
                    type="text"
                    className="form-input icon-padded"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={formLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-email">Endereço de E-mail *</label>
                <div className="input-with-icon-wrapper">
                  <Mail size={16} className="input-field-icon" />
                  <input
                    id="edit-email"
                    type="email"
                    className="form-input icon-padded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={formLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-pass">Nova Senha (Deixe em branco para não alterar)</label>
                <input
                  id="edit-pass"
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={formLoading}
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INACTIVATE CONFIRM MODAL */}
      {showInactivateModal && selectedTeacher && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in modal-confirm">
            <div className="modal-header header-danger">
              <h2>Inativar Cadastro de Professora</h2>
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
              <p>Tem certeza de que deseja inativar a professora <strong>{selectedTeacher.name}</strong>?</p>
              <p className="confirm-warning-text">
                Ela perderá acesso ao sistema e não aparecerá nas alocações de turmas, mas seu histórico permanecerá intacto (inativação lógica).
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
                {formLoading ? 'Inativando...' : 'Inativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Teachers;
