import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Key, User, Check, Loader, Compass } from 'lucide-react';
import { api } from '../../services/api';
import './Activate.css';

export function Activate() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // School details from token validation
  const [schoolName, setSchoolName] = useState('');
  const [email, setEmail] = useState('');

  // Form fields
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      setError('Token de ativação ausente. Utilize o link enviado por e-mail.');
      setLoading(false);
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
  }, []);

  const validateToken = async (tokenParam) => {
    try {
      const response = await api.get(`/tenants/activate?token=${tokenParam}`);
      if (response && response.data) {
        setSchoolName(response.data.schoolName);
        setEmail(response.data.email);
      } else {
        throw new Error('Falha ao obter detalhes do convite.');
      }
    } catch (err) {
      setError(err.message || 'Link de ativação inválido, expirado ou já utilizado.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!adminName.trim() || !password || !confirmPassword) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setFormError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('As senhas não coincidem.');
      return;
    }

    setFormLoading(true);
    try {
      const response = await api.post('/tenants/activate', {
        token,
        adminName,
        password
      });

      if (response && response.data && response.data.token) {
        // Store session data (JWT token & user details)
        localStorage.setItem('@DanceFlow:token', response.data.token);
        localStorage.setItem('@DanceFlow:user', JSON.stringify(response.data.user));
        
        setActivated(true);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        throw new Error('Resposta de ativação inválida do servidor.');
      }
    } catch (err) {
      setFormError(err.message || 'Erro ao realizar a ativação da conta.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="activate-container">
        <div className="activate-card glass-card loading-card">
          <Loader size={48} className="loader-spin text-primary" />
          <p>Validando convite de ativação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activate-container">
        <div className="activate-card glass-card error-card">
          <div className="alert-circle-icon text-danger">
            <AlertTriangle size={36} />
          </div>
          <h2>Ops! Link de ativação inválido</h2>
          <p className="error-message-text">{error}</p>
          <div className="error-actions">
            <button 
              className="btn btn-secondary" 
              onClick={() => window.location.href = '/login'}
            >
              Ir para o Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activated) {
    return (
      <div className="activate-container">
        <div className="activate-card glass-card success-card">
          <div className="success-circle-icon text-success">
            <ShieldCheck size={48} />
          </div>
          <h2>Conta Ativada com Sucesso!</h2>
          <p>Tudo pronto. Redirecionando você para o painel do DanceFlow...</p>
          <Loader size={24} className="loader-spin text-success mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="activate-container">
      <div className="activate-card glass-card">
        <div className="activate-header">
          <div className="app-logo">
            <Compass size={24} className="text-primary" />
            <span>DanceFlow</span>
          </div>
          <h2>Ativar Minha Conta</h2>
          <p>Conclua seu cadastro como administradora da escola <strong>{schoolName}</strong>.</p>
        </div>

        {formError && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleActivate} className="activate-form">
          <div className="form-group">
            <label className="form-label">E-mail de Acesso</label>
            <input
              type="email"
              className="form-input"
              value={email}
              disabled
              readOnly
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nome Completo *</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Seu nome completo"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                disabled={formLoading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Definir Senha *</label>
            <div className="input-with-icon">
              <Key size={16} className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={formLoading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar Senha *</label>
            <div className="input-with-icon">
              <Key size={16} className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={formLoading}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={formLoading}
          >
            {formLoading ? 'Salvando...' : 'Ativar e Acessar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Activate;
