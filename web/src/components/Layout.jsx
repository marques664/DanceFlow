import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { isAuthenticated } from '../services/auth';
import './Layout.css';

export function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
