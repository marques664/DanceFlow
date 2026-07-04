import React, { useState, useEffect } from 'react';
import { Printer, FileText, Loader, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import './Reports.css';

export function Reports() {
  const [classesList, setClassesList] = useState([]);
  const [selectedReportClass, setSelectedReportClass] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    try {
      const classesData = await api.get('/classes');
      
      // Fetch enrolled students for each class
      const detailed = await Promise.all(
        (classesData || []).map(async (cls) => {
          const students = await api.get(`/classes/${cls.id}/students`);
          return {
            ...cls,
            students: students || []
          };
        })
      );
      
      setClassesList(detailed);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do relatório.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader size={36} className="loader-spin" />
        <p>Carregando dados do relatório...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle size={18} />
        <span>{error}</span>
        <button className="btn-close-alert" onClick={fetchReportData}>Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <header className="page-header reports-header-no-print">
        <div>
          <h1>Relatórios Escolares</h1>
          <p className="subtitle">Gere e exporte a listagem de turmas, professoras e alunas em formato PDF.</p>
        </div>
        <div className="reports-header-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <select
              id="report-class-select"
              className="form-input form-select"
              value={selectedReportClass}
              onChange={(e) => setSelectedReportClass(e.target.value)}
              style={{ width: '220px', minHeight: '42px' }}
            >
              <option value="all">Todas as Turmas</option>
              {classesList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} />
            <span>Exportar PDF / Imprimir</span>
          </button>
        </div>
      </header>

      {/* Printable Sheet Area */}
      <div className="printable-report-area">
        {/* Header visible ONLY during print */}
        <div className="print-header-report">
          <h2>DanceFlow - Relatório Escolar Consolidado</h2>
          <p>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          <hr />
        </div>

        {classesList
          .filter(c => selectedReportClass === 'all' || c.id === selectedReportClass)
          .map((cls) => (
            <section key={cls.id} className="report-class-section glass-card print-card-break">
            <div className="report-class-header">
              <div>
                <h3 className="report-class-title">{cls.name}</h3>
                <span className="report-class-meta">Modalidade: <strong>{cls.modality}</strong></span>
              </div>
              <div className="report-class-schedule-info">
                <span>📅 {cls.schedule}</span>
              </div>
            </div>

            <div className="teachers-report-block">
              <p>Professora Principal: <strong>{cls.mainTeacher}</strong></p>
              {cls.secondaryTeachers && cls.secondaryTeachers.length > 0 && (
                <p>Professoras Secundárias: <strong>{cls.secondaryTeachers.join(', ')}</strong></p>
              )}
            </div>

            <div className="students-report-block">
              <h4>Alunas Matriculadas ({cls.students.length})</h4>
              {cls.students.length === 0 ? (
                <p className="no-students-text">Nenhuma aluna matriculada nesta turma.</p>
              ) : (
                <table className="report-students-table">
                  <thead>
                    <tr>
                      <th>Nome Completo</th>
                      <th>Plano</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cls.students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.plan}</td>
                        <td>
                          <span className={`status-text-badge ${student.isActive ? 'active' : 'inactive'}`}>
                            {student.isActive ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
export default Reports;
