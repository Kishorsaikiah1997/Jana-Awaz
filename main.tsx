import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import Dashboard from './Dashboard.tsx';
import ReceiptPage from './ReceiptPage.tsx';
import LoginPage from './LoginPage.tsx';
import './index.css';
import './i18n'; // import i18n setup

const AuthGuard = ({ children, requireRole }: { children: React.ReactNode, requireRole?: string }) => {
  const userStr = localStorage.getItem('jan_awaaz_user');
  if (!userStr) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(userStr);
    if (requireRole && user.role !== requireRole) return <Navigate to="/login" replace />;
    return <>{children}</>;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthGuard><App /></AuthGuard>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<AuthGuard requireRole="mp"><Dashboard /></AuthGuard>} />
        <Route path="/receipt" element={<AuthGuard><ReceiptPage /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
