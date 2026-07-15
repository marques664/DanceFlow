import React, { useState, useEffect } from 'react';
import { 
  Compass, Plus, Copy, Check, MessageSquare, AlertCircle, 
  Info, Sparkles, Shield, Calendar, User, Clock, Search, List 
} from 'lucide-react';
import { api } from '../../services/api';
import './SuperAdmin.css';

export function SuperAdmin() {
  const [activeTab, setActiveTab] = useState('provision');

  // PROVISION TAB STATE
  const [schoolName, setSchoolName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // AUDIT TAB STATE
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logSelectedAction, setLogSelectedAction] = useState('all');
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);

  // Fetch schools list for dropdown when Audit Tab opens
  useEffect(() => {
    if (activeTab === 'audit') {
      fetchSchools();
    }
  }, [activeTab]);

  // Fetch school-specific audit logs
  useEffect(() => {
    if (activeTab === 'audit' && selectedSchoolId) {
      fetchSchoolLogs();
    } else {
      setLogs([]);
    }
  }, [activeTab, selectedSchoolId, logSelectedAction]);

  const fetchSchools = async () => {
    setLogsError('');
    try {
      const response = await api.get('/tenants');
      const schoolList = response?.data || response || [];
      setSchools(schoolList);
      if (schoolList.length > 0 && !selectedSchoolId) {
        setSelectedSchoolId(schoolList[0].id);
      }
    } catch (err) {
      setLogsError('Falha ao carregar as escolas.');
    }
  };

  const fetchSchoolLogs = async () => {
    setLogsLoading(true);
    setLogsError('');
    setSelectedLogDetails(null);
    try {
      const params = {};
      if (logSelectedAction !== 'all') {
        params.action = logSelectedAction;
      }
      if (logSearchTerm.trim()) {
        params.search = logSearchTerm.trim();
      }

      const response = await api.get(`/tenants/${selectedSchoolId}/audit-logs`, { params });
      setLogs(response || []);
    } catch (err) {
      setLogsError('Falha ao carregar os logs de auditoria desta escola.');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogSearchSubmit = (e) => {
    e.preventDefault();
    fetchSchoolLogs();
  };

  const handleProvision = async (e) => {
    e.preventDefault();
    setError('');
    setInviteResult(null);
    setCopied(false);

    if (!schoolName.trim() || !adminEmail.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/tenants/provision', {
        schoolName: schoolName.trim(),
        adminEmail: adminEmail.trim()
      });

      // Handle raw response or nested response.data
      const resData = response?.data || response;
      if (resData) {
        setInviteResult({
          schoolName: schoolName.trim(),
          adminEmail: adminEmail.trim(),
          activationUrl: resData.activationUrl,
          slug: resData.slug
        });
        
        // Reset form
        setSchoolName('');
        setAdminEmail('');
      } else {
        throw new Error('Falha ao processar o cadastro.');
      }
    } catch (err) {
      setError(err.message || 'Erro ao provisionar escola.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!inviteResult) return;
    navigator.clipboard.writeText(inviteResult.activationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppLink = () => {
    if (!inviteResult) return '#';
    const message = `Olá! A sua escola "${inviteResult.schoolName}" já foi cadastrada com sucesso no DanceFlow. Para definir sua senha e ativar sua conta de administradora, acesse o link de convite exclusivo a seguir:\n\n${inviteResult.activationUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  };

  const formatJson = (jsonStr) => {
    try {
      const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

  const getFriendlyActionLabel = (action) => {
    switch (action) {
      case 'CREATE_STUDENT': return 'Cadastro de Aluna';
      case 'UPDATE_STUDENT': return 'Atualização de Aluna';
      case 'INACTIVATE_STUDENT': return 'Inativação de Aluna';
      case 'CONVERT_EXPERIMENTAL_STUDENT': return 'Conversão de Aluna';
      case 'CREATE_CLASS': return 'Criação de Turmas';
      case 'CREATE_TEACHER': return 'Cadastro de Professora';
      case 'REGISTER_ATTENDANCE': return 'Registro de Frequência';
      case 'SCHEDULE_LESSON': return 'Agendamento de Aula';
      default: return action;
    }
  };

  return (
    <div className="superadmin-container">
      <header className="page-header">
        <div>
          <h1>Painel Administrativo SaaS</h1>
          <p className="subtitle">Gerencie inquilinos (escolas) e audite ações em todo o ecossistema SaaS.</p>
        </div>
      </header>

      {/* TABS SELECTOR */}
      <div className="superadmin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'provision' ? 'active' : ''}`}
          onClick={() => setActiveTab('provision')}
        >
          <Compass size={18} />
          <span>Cadastrar Escolas</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <List size={18} />
          <span>Auditoria Global</span>
        </button>
      </div>

      {/* PROVISIONING VIEW */}
      {activeTab === 'provision' && (
        <div className="superadmin-grid animate-fade-in">
          {/* PROVISIONING FORM */}
          <div className="superadmin-card glass-card">
            <div className="card-header-with-icon">
              <Compass className="text-primary" size={20} />
              <h3>Cadastrar Nova Escola (Tenant)</h3>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleProvision} className="provision-form">
              <div className="form-group">
                <label className="form-label" htmlFor="school-name">Nome da Escola de Dança *</label>
                <input
                  id="school-name"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Ballet Copacabana"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-email">E-mail do Responsável (Admin) *</label>
                <input
                  id="admin-email"
                  type="email"
                  className="form-input"
                  placeholder="Ex: diretoria@escola.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                <Plus size={18} />
                <span>{loading ? 'Processando...' : 'Cadastrar Escola e Gerar Convite'}</span>
              </button>
            </form>
          </div>

          {/* INVITATION DETAILS CARD */}
          <div className="superadmin-card glass-card result-panel">
            <div className="card-header-with-icon">
              <Sparkles className="text-primary" size={20} />
              <h3>Link de Convite Ativo</h3>
            </div>

            {inviteResult ? (
              <div className="invite-details-wrapper animate-fade-in">
                <div className="success-badge-title">
                  <Check size={18} className="text-success" />
                  <span>Escola cadastrada com sucesso!</span>
                </div>

                <div className="details-info-block">
                  <p><strong>Escola:</strong> {inviteResult.schoolName}</p>
                  <p><strong>Subdomínio gerado:</strong> {inviteResult.slug}.localhost:5173</p>
                  <p><strong>E-mail:</strong> {inviteResult.adminEmail}</p>
                </div>

                <div className="link-action-box">
                  <span className="box-title">Link de ativação exclusivo:</span>
                  <div className="link-input-group">
                    <input
                      type="text"
                      className="form-input link-display-input"
                      value={inviteResult.activationUrl}
                      readOnly
                    />
                    <button 
                      type="button" 
                      className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`}
                      onClick={handleCopy}
                      title="Copiar Link"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="sharing-actions">
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp btn-block"
                  >
                    <MessageSquare size={18} />
                    <span>Enviar por WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="empty-invite-state">
                <Info size={36} className="text-muted mb-2" />
                <p>Cadastre uma escola no formulário ao lado para gerar e copiar o link de convite personalizado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUDIT TIMELINE VIEW */}
      {activeTab === 'audit' && (
        <div className="superadmin-audit-section animate-fade-in">
          {/* SAAS AUDIT SELECTOR & FILTERS */}
          <div className="audit-filters-bar glass-card">
            <div className="school-selector-wrapper">
              <label htmlFor="school-select">Selecionar Escola:</label>
              <select
                id="school-select"
                className="filter-select"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
              >
                {schools.length === 0 ? (
                  <option value="">Carregando escolas...</option>
                ) : (
                  schools.map(sch => (
                    <option key={sch.id} value={sch.id}>{sch.name}</option>
                  ))
                )}
              </select>
            </div>

            <form onSubmit={handleLogSearchSubmit} className="search-form">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Pesquisar por operador..."
                  value={logSearchTerm}
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button type="submit" className="btn btn-secondary">Buscar</button>
            </form>

            <div className="filter-select-wrapper">
              <label htmlFor="log-action-filter">Ação:</label>
              <select
                id="log-action-filter"
                className="filter-select"
                value={logSelectedAction}
                onChange={(e) => setLogSelectedAction(e.target.value)}
              >
                <option value="all">Todas as Ações</option>
                <option value="CREATE_STUDENT">Cadastro de Aluna</option>
                <option value="UPDATE_STUDENT">Atualização de Aluna</option>
                <option value="INACTIVATE_STUDENT">Inativação de Aluna</option>
                <option value="CONVERT_EXPERIMENTAL_STUDENT">Conversão de Aluna</option>
                <option value="CREATE_CLASS">Criação de Turmas</option>
                <option value="CREATE_TEACHER">Cadastro de Professoras</option>
                <option value="REGISTER_ATTENDANCE">Registro de Frequência</option>
                <option value="SCHEDULE_LESSON">Agendamento de Aulas</option>
              </select>
            </div>
          </div>

          {logsError && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{logsError}</span>
            </div>
          )}

          {/* AUDIT LOGS DISPLAY */}
          <div className="superadmin-audit-layout">
            <div className="logs-table-panel glass-card">
              {logsLoading ? (
                <div className="loading-state">
                  <Loader className="animate-spin" size={32} />
                  <p>Carregando histórico...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="empty-state">
                  <Shield size={40} className="empty-icon" />
                  <h3>Sem logs registrados</h3>
                  <p>Nenhuma ação foi registrada para os filtros selecionados.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Data/Hora</th>
                        <th>Operador</th>
                        <th>Ação</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr 
                          key={log.id} 
                          className={selectedLogDetails?.id === log.id ? 'active-row' : ''}
                        >
                          <td className="date-cell">
                            <Clock size={14} />
                            <span>{new Date(log.createdAt).toLocaleDateString('pt-BR')} {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="user-cell">
                            <User size={14} />
                            <div>
                              <p className="user-name">{log.user?.name || 'Operador'}</p>
                              <p className="user-email">{log.user?.email || ''}</p>
                            </div>
                          </td>
                          <td className="action-cell">
                            <span className={`action-badge ${log.action.toLowerCase().replace(/_/g, '-')}`}>
                              {getFriendlyActionLabel(log.action)}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedLogDetails(log)}
                            >
                              Inspecionar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DETAILS PANEL DRAWER */}
            {selectedLogDetails && (
              <div className="log-details-sidebar glass-card animate-fade-in">
                <div className="sidebar-header">
                  <h3>Payload da Operação</h3>
                  <button 
                    className="close-detail-btn"
                    onClick={() => setSelectedLogDetails(null)}
                  >
                    Fechar
                  </button>
                </div>
                <div className="details-body">
                  <p><strong>Ação técnica:</strong> <code>{selectedLogDetails.action}</code></p>
                  <p><strong>Operador:</strong> {selectedLogDetails.user?.name || 'Sistema'}</p>
                  <p><strong>Data:</strong> {new Date(selectedLogDetails.createdAt).toLocaleString('pt-BR')}</p>
                  <div className="json-container">
                    <pre>{formatJson(selectedLogDetails.details)}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdmin;
