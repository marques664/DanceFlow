import React, { useState } from 'react';
import { Compass, Plus, Copy, Check, MessageSquare, AlertCircle, Info, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import './SuperAdmin.css';

export function SuperAdmin() {
  const [schoolName, setSchoolName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Success state for displaying generated invitation details
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

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

      if (response && response.data) {
        setInviteResult({
          schoolName: schoolName.trim(),
          adminEmail: adminEmail.trim(),
          activationUrl: response.data.activationUrl,
          slug: response.data.slug
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

  return (
    <div className="superadmin-container">
      <header className="page-header">
        <div>
          <h1>Painel Administrativo SaaS</h1>
          <p className="subtitle">Cadastre novas escolas na plataforma e gere links de convites para ativação de conta.</p>
        </div>
      </header>

      <div className="superadmin-grid">
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
    </div>
  );
}

export default SuperAdmin;
