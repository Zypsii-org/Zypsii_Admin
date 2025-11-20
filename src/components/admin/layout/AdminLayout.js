import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        currentPath={location.pathname}
        onLogout={handleLogout}
      />
      
      <div className="admin-main-content">
        <Header 
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />
        
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
