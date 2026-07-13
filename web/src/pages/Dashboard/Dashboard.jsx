import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight,
  TrendingDown,
  Clock,
  Loader,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import './Dashboard.css';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/dashboard/stats');
      setStats(data);
    } catch (err) {
      setError(err.message || 'Falha ao carregar as métricas do painel.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader size={36} className="loader-spin" />
        <p>Carregando painel de controle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle size={18} />
        <span>{error}</span>
        <button className="btn-close-alert" onClick={fetchStats}>Recarregar</button>
      </div>
    );
  }

  const metrics = [
    { label: 'Total de Alunas', value: stats.activeStudents, change: 'Estável', positive: true, icon: <Users size={24} /> },
    { label: 'Turmas Ativas', value: stats.activeClasses, change: 'Estável', positive: true, icon: <Calendar size={24} /> },
    { label: 'Média de Frequência', value: `${stats.averageAttendance}%`, change: 'Consolidado', positive: true, icon: <TrendingUp size={24} /> },
    { label: 'Faltas Críticas (Risco)', value: `${stats.lowAttendanceWarnings.length} alunas`, change: 'Alerta', positive: false, icon: <AlertTriangle size={24} /> },
  ];

  // Activities mocked as they are informational
  const recentActivities = [
    { action: 'Frequência registrada', details: 'Professora Ballet registrou chamada concluída no banco de dados', time: 'Há alguns minutos' },
    { action: 'Nova aluna cadastrada', details: 'A aluna foi inserida com sucesso no banco PostgreSQL', time: 'Há 1 hora' },
    { action: 'Aula agendada', details: 'O sistema gerou as aulas para os próximos 30 dias', time: 'Há 2 horas' },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Visão Geral</h1>
          <p className="subtitle">Bem-vinda de volta ao painel administrativo do DanceFlow.</p>
        </div>
        <div className="header-date">
          <span>Julho, 2026</span>
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="metrics-grid">
        {metrics.map((m, idx) => (
          <div key={idx} className="metric-card glass-card glass-card-hover">
            <div className="metric-header">
              <span className="metric-label">{m.label}</span>
              <div className="metric-icon">{m.icon}</div>
            </div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-footer">
              <span className={`metric-change ${m.positive ? 'positive' : 'negative'}`}>
                {m.positive ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
                {m.change}
              </span>
              <span className="metric-period">dados reais do banco</span>
            </div>
          </div>
        ))}
      </section>

      <div className="dashboard-content-layout">
        {/* Alerts Section (Rule 3.6 - Low frequency alerts only on admin dashboard) */}
        <section className="alerts-section glass-card">
          <div className="section-header">
            <div className="title-wrapper">
              <AlertTriangle className="alert-header-icon" size={20} />
              <h2>Alertas de Frequência Crítica / Atenção</h2>
            </div>
            <span className="badge badge-alert">{stats.lowAttendanceWarnings.length} Alertas</span>
          </div>
          
          <div className="alerts-list">
            {stats.lowAttendanceWarnings.length === 0 ? (
              <p className="no-alerts-text">✓ Excelente! Nenhuma aluna está abaixo de 80% de frequência no momento.</p>
            ) : (
              stats.lowAttendanceWarnings.map((alert) => (
                <div key={alert.id} className={`alert-item ${alert.classification === 'Crítica' ? 'critical' : 'warning'}`}>
                  <div className="alert-item-header">
                    <span className="student-name">{alert.name}</span>
                    <span className={`attendance-badge ${alert.classification === 'Crítica' ? 'critical' : 'warning'}`}>
                      {alert.attendanceRate}% Freq.
                    </span>
                  </div>
                  <p className="alert-details">
                    Frequência calculada em chamadas finalizadas: {alert.presents} presenças em {alert.totalLessons} aulas regulamentadas (Plano {alert.plan}).
                  </p>
                  <div className="alert-action-bar">
                    <span className="status-label">
                      {alert.classification === 'Crítica' ? '🔴 Crítica (< 50%)' : '🟡 Atenção (50% - 80%)'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Charts & Activity column */}
        <div className="right-column">
          {/* Custom SVG Attendance Chart */}
          <section className="chart-section glass-card">
            <h2>Frequência Média Mensal</h2>
            <div className="chart-wrapper">
              <svg viewBox="0 0 400 180" className="trend-svg">
                <defs>
                  <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="380" y2="20" stroke="rgba(255,255,255,0.05)" />
                <line x1="40" y1="60" x2="380" y2="60" stroke="rgba(255,255,255,0.05)" />
                <line x1="40" y1="100" x2="380" y2="100" stroke="rgba(255,255,255,0.05)" />
                <line x1="40" y1="140" x2="380" y2="140" stroke="rgba(255,255,255,0.05)" />

                {/* Y Axis Labels */}
                <text x="30" y="24" fill="var(--text-muted)" fontSize="10" textAnchor="end">100%</text>
                <text x="30" y="64" fill="var(--text-muted)" fontSize="10" textAnchor="end">80%</text>
                <text x="30" y="104" fill="var(--text-muted)" fontSize="10" textAnchor="end">50%</text>
                <text x="30" y="144" fill="var(--text-muted)" fontSize="10" textAnchor="end">0%</text>

                {/* Area under trend line */}
                <path
                  d="M 40 140 L 40 90 L 120 70 L 200 50 L 280 62 L 360 48 L 360 140 Z"
                  fill="url(#chart-glow)"
                />

                {/* Trend Line */}
                <path
                  d="M 40 90 L 120 70 L 200 50 L 280 62 L 360 48"
                  fill="none"
                  stroke="var(--color-pink-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="40" cy="90" r="4" fill="var(--color-pink-primary)" />
                <circle cx="120" cy="70" r="4" fill="var(--color-pink-primary)" />
                <circle cx="200" cy="50" r="4" fill="var(--color-pink-primary)" />
                <circle cx="280" cy="62" r="4" fill="var(--color-pink-primary)" />
                <circle cx="360" cy="48" r="4" fill="var(--color-pink-primary)" />

                {/* X Axis Labels */}
                <text x="40" y="165" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Mar</text>
                <text x="120" y="165" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Abr</text>
                <text x="200" y="165" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Mai</text>
                <text x="280" y="165" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Jun</text>
                <text x="360" y="165" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Jul</text>
              </svg>
            </div>
          </section>

          {/* Recent Operations log */}
          <section className="activities-section glass-card">
            <h2>Operações Recentes</h2>
            <div className="activities-list">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-indicator" />
                  <div className="activity-body">
                    <span className="activity-action">{act.action}</span>
                    <span className="activity-details">{act.details}</span>
                  </div>
                  <span className="activity-time">{act.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
