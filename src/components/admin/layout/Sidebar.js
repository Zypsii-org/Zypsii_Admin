import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaMapMarkerAlt, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBook,
  FaYoutube
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ collapsed, currentPath, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: <FaTachometerAlt />,
      label: 'Dashboard',
      exact: true
    },

    {
      path: '/admin/places',
      icon: <FaMapMarkerAlt />,
      label: 'Places',
      exact: false
    },
    {
      path: '/admin/guides',
      icon: <FaBook />,
      label: 'Guides',
      exact: false
    },
    {
      path: '/admin/youtube',
      icon: <FaYoutube />,
      label: 'YouTube',
      exact: false
    }
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3 className={collapsed ? 'hidden' : ''}>Zypsii Admin</h3>
        <div className="sidebar-toggle">
          {collapsed ? <FaBars /> : <FaTimes />}
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className={`nav-label ${collapsed ? 'hidden' : ''}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <button 
          onClick={onLogout}
          className="logout-button"
        >
          <span className="nav-icon"><FaSignOutAlt /></span>
          <span className={`nav-label ${collapsed ? 'hidden' : ''}`}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
