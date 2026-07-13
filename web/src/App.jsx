import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Modalities } from './pages/Modalities/Modalities';
import { Students } from './pages/Students/Students';
import { Classes } from './pages/Classes/Classes';
import { Teachers } from './pages/Teachers/Teachers';
import { Attendance } from './pages/Attendance/Attendance';
import { Reports } from './pages/Reports/Reports';
import { Activate } from './pages/Activate/Activate';
import { SuperAdmin } from './pages/SuperAdmin/SuperAdmin';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/entrar" element={<Login />} />
        <Route path="/login" element={<Navigate to="/entrar" replace />} />
        <Route path="/ativar" element={<Activate />} />
        
        {/* Protected Routes inside Layout wrapper */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/inicio" replace />} />
          <Route path="inicio" element={<Dashboard />} />
          <Route path="modalidades" element={<Modalities />} />
          <Route path="alunas" element={<Students />} />
          <Route path="turmas" element={<Classes />} />
          <Route path="professoras" element={<Teachers />} />
          <Route path="presenca" element={<Attendance />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="admin/convites" element={<SuperAdmin />} />
        </Route>

        {/* Fallback redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
