import React, { useState, useEffect } from 'react';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import './UserProfileModal.css';

const UserProfileModal = ({ show, onClose, user, onLogout, buttonRef }) => {
  const [position, setPosition] = React.useState({ top: 0, right: 0 });

  React.useEffect(() => {
    if (show && buttonRef?.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: buttonRect.bottom + 10,
        right: window.innerWidth - buttonRect.right
      });
    }
  }, [show, buttonRef]);

  // Disable body scroll when modal is open
  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [show]);

  if (!show) return null;

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div 
        className="user-profile-modal"
        style={{ top: `${position.top}px`, right: `${position.right}px` }}
      >
        <div className="modal-header">
          <div className="modal-user-info">
            {(() => {
              const imageUrl = user.profilePicture || user.photo || user.picture;
              if (imageUrl) {
                return (
                  <img 
                    src={imageUrl}
                    alt="Profile" 
                    className="modal-profile-img"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ddd"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="%23999">User</text></svg>';
                    }}
                  />
                );
              }
              return (
                <div className="modal-profile-avatar">
                  <FaUser />
                </div>
              );
            })()}
            <div>
              <div className="modal-user-name">{user.name || 'User'}</div>
              <div className="modal-user-email">{user.email}</div>
            </div>
          </div>
          <button 
            className="modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-divider"></div>
        <button 
          onClick={handleLogout}
          className="modal-logout-btn"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
};

export default UserProfileModal;
