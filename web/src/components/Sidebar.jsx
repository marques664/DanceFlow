import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Calendar, 
  CheckSquare, 
  LogOut,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { logout, getCurrentUser } from '../services/auth';
import './Sidebar.css';

export function Sidebar() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/modalities', icon: <BookOpen size={20} />, label: 'Modalidades' },
    { to: '/students', icon: <Users size={20} />, label: 'Alunas' },
    { to: '/classes', icon: <Calendar size={20} />, label: 'Turmas' },
    { to: '/teachers', icon: <GraduationCap size={20} />, label: 'Professoras' },
    { to: '/attendance', icon: <CheckSquare size={20} />, label: 'Frequência' },
  ];

  return (
    <aside className="sidebar glass-card">
      <div className="sidebar-brand">
        <Sparkles className="brand-icon" size={24} />
        <h2>Dance<span>Flow</span></h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="user-profile">
            <div className="user-avatar">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {user.role === 'ADMIN' ? 'Administrador' : 'Professora'}
              </span>
            </div>
          </div>
        )}
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
