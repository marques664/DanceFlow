import React, { useState, useEffect } from 'react';
import { Shield, Search, Calendar, User, Clock, Loader, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import './AuditLogs.css';

export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedAction !== 'all') {
        params.action = selectedAction;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await api.get('/audit-logs', { params });
      setLogs(response || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar o histórico de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="audit-logs-container">
      <header className="page-header">
        <div>
          <h1>Auditoria da Escola</h1>
          <p className="subtitle">Monitore as principais ações, cadastros e atualizações feitas pelos colaboradores.</p>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="audit-filters-bar glass-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="btn btn-secondary">Buscar</button>
        </form>

        <div className="filter-select-wrapper">
          <label htmlFor="action-filter">Filtrar Categoria:</label>
          <select
            id="action-filter"
            className="filter-select"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="all">Todas as Categoria</option>
            <option value="CREATE_STUDENT">Cadastro de Alunas</option>
            <option value="UPDATE_STUDENT">Atualização de Alunas</option>
            <option value="INACTIVATE_STUDENT">Inativação de Alunas</option>
            <option value="CONVERT_EXPERIMENTAL_STUDENT">Matrículas e Conversões</option>
            <option value="CREATE_CLASS">Criação de Turmas</option>
            <option value="CREATE_TEACHER">Cadastro de Professoras</option>
            <option value="REGISTER_ATTENDANCE">Chamadas e Frequência</option>
            <option value="SCHEDULE_LESSON">Agendamento de Aulas</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* TIMELINE FEED */}
      {loading ? (
        <div className="loading-state">
          <Loader className="animate-spin" size={32} />
          <p>Carregando histórico...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state glass-card">
          <Shield size={48} className="empty-icon" />
          <h3>Nenhum registro encontrado</h3>
          <p>Não há ações registradas para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="audit-timeline">
          {logs.map((log) => (
            <div key={log.id} className="audit-timeline-item glass-card animate-fade-in">
              <div className="timeline-marker">
                <Clock size={16} />
              </div>
              <div className="timeline-content">
                <div className="timeline-meta">
                  <span className="log-date">
                    <Calendar size={14} />
                    {new Date(log.createdAt).toLocaleDateString('pt-BR')} às {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="log-text">{log.friendlyText}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
