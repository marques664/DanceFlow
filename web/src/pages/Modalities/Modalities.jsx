import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Loader, AlertCircle, X, Check } from 'lucide-react';
import { api } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import './Modalities.css';

export function Modalities() {
  const user = getCurrentUser();
  const isAdmin = user && user.role === 'ADMIN';

  const [modalities, setModalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModality, setSelectedModality] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchModalities();
  }, []);

  const fetchModalities = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/modalities');
      setModalities(data || []);
    } catch (err) {
      setError(err.message || 'Falha ao carregar as modalidades.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setName('');
    setDescription('');
    setFormError('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (modality) => {
    setSelectedModality(modality);
    setName(modality.name);
    setDescription(modality.description || '');
    setFormError('');
    setShowEditModal(true);
  };

  const handleOpenDelete = (modality) => {
    setSelectedModality(modality);
    setFormError('');
    setShowDeleteModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('O nome da modalidade é obrigatório.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      await api.post('/modalities', { name, description });
      setShowCreateModal(false);
      fetchModalities();
    } catch (err) {
      setFormError(err.message || 'Erro ao criar modalidade.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('O nome da modalidade é obrigatório.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      await api.put(`/modalities/${selectedModality.id}`, { name, description });
      setShowEditModal(false);
      fetchModalities();
    } catch (err) {
      setFormError(err.message || 'Erro ao editar modalidade.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      await api.delete(`/modalities/${selectedModality.id}`);
      setShowDeleteModal(false);
      fetchModalities();
    } catch (err) {
      setFormError(err.message || 'Erro ao inativar modalidade.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredModalities = modalities.filter((mod) => 
    mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mod.description && mod.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="modalities-container">
      <header className="page-header">
        <div>
          <h1>Modalidades</h1>
          <p className="subtitle">Gerencie as modalidades de dança oferecidas pela escola.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nova Modalidade</span>
          </button>
        )}
      </header>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn-close-alert" onClick={fetchModalities}>Recarregar</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="table-toolbar glass-card">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="total-badge">
          <span>{filteredModalities.length} {filteredModalities.length === 1 ? 'modalidade' : 'modalidades'}</span>
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="loading-state">
          <Loader size={36} className="loader-spin" />
          <p>Carregando modalidades...</p>
        </div>
      ) : filteredModalities.length === 0 ? (
        <div className="empty-state glass-card">
          <BookOpen size={48} className="empty-icon" />
          <h3>Nenhuma modalidade encontrada</h3>
          <p>{searchTerm ? 'Tente ajustar sua busca.' : 'Comece cadastrando uma nova modalidade.'}</p>
        </div>
      ) : (
        <div className="table-wrapper-card glass-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Status</th>
                {isAdmin && <th className="text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filteredModalities.map((mod) => (
                <tr key={mod.id} className="table-row">
                  <td className="font-semibold text-white">{mod.name}</td>
                  <td className="text-muted">{mod.description || <span className="no-desc">Sem descrição</span>}</td>
                  <td>
                    <span className="badge-status active">Ativa</span>
                  </td>
                  {isAdmin && (
                    <td className="text-right actions-cell">
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => handleOpenEdit(mod)}
                        title="Editar modalidade"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleOpenDelete(mod)}
                        title="Inativar modalidade"
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

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in">
            <div className="modal-header">
              <h2>Nova Modalidade</h2>
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
                <label className="form-label" htmlFor="new-mod-name">Nome da Modalidade *</label>
                <input
                  id="new-mod-name"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Ballet Clássico, Jazz Moderno"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-mod-desc">Descrição</label>
                <textarea
                  id="new-mod-desc"
                  className="form-input form-textarea"
                  placeholder="Breve descrição da modalidade, faixas etárias, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={formLoading}
                  rows="4"
                />
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
                  {formLoading ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in">
            <div className="modal-header">
              <h2>Editar Modalidade</h2>
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
                <label className="form-label" htmlFor="edit-mod-name">Nome da Modalidade *</label>
                <input
                  id="edit-mod-name"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Ballet Clássico, Jazz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-mod-desc">Descrição</label>
                <textarea
                  id="edit-mod-desc"
                  className="form-input form-textarea"
                  placeholder="Descrição da modalidade"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={formLoading}
                  rows="4"
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

      {/* DELETE/INACTIVATE MODAL */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in modal-confirm">
            <div className="modal-header header-danger">
              <h2>Inativar Modalidade</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
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
              <p>Tem certeza de que deseja inativar a modalidade <strong>{selectedModality?.name}</strong>?</p>
              <p className="confirm-warning-text">Ela não aparecerá mais nas listagens de novas turmas, mas os dados históricos serão preservados (inativação lógica).</p>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
                disabled={formLoading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleDelete}
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
export default Modalities;
