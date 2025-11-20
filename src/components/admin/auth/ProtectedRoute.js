import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();

  const hasAdminAccess =
    user?.role?.toLowerCase() === 'admin' ||
    user?.isAdmin === true ||
    user?.isAdmin === 'true';

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
          error: 'Admin access required. Please sign in with an admin account.',
        }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
