import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/SideBarStyle.css';
import logo from '../assets/logo.jpg';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // Função para decodificar o payload do JWT manualmente
  const getAuthData = () => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (e) {
      return null;
    }
  };

  const auth = getAuthData();
  const role = auth?.role_id; 

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <nav className="sidebar-container">
      <div className="sidebar-logo">
        <div className="logo-icon-small"><img src={logo} alt="Logo da farmácia" /></div>
        <span>Farma Controll</span>
      </div>

      <div className="nav-links">
        <div className={`nav-item ${isActive('/home')}`} onClick={() => navigate('/home')}>
          Dashboard
        </div>
        
        {(role === 1 || role === 2) && (
          <>
            <div className={`nav-item ${isActive('/produtos')}`} onClick={() => navigate('/produtos')}>
              Gestão de produtos
            </div>
            <div className={`nav-item ${isActive('/fornecedores')}`} onClick={() => navigate('/fornecedores')}>
              Gestão de fornecedores
            </div>
          </>
        )}
        
        <div className={`nav-item ${isActive('/stock')}`} onClick={() => navigate('/stock')}>
          Controle de stock
        </div>
        
        {(role === 1 || role === 2) && (
          <div className={`nav-item ${isActive('/relatorios')}`} onClick={() => navigate('/relatorios')}>
            Relatórios
          </div>
        )}
      </div>

      <div className="logout-section">
        {role === 1 && (
          <div className={`nav-item ${isActive('/Contas')}`} onClick={() => navigate('/Contas')}>
            Configurações / Contas
          </div>
        )}
        
        <button onClick={handleLogout} className="logout-btn">
          Sair
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;