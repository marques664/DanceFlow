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

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/ativar" element={<Activate />} />
        
        {/* Protected Routes inside Layout wrapper */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="modalities" element={<Modalities />} />
          <Route path="students" element={<Students />} />
          <Route path="classes" element={<Classes />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Fallback redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
