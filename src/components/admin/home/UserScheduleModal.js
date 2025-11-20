import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { scheduleAPI } from '../../../services/api';
import ScheduleDetailsModal from '../../homepage/ScheduleDetailsModal';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';
import './UserScheduleModal.css';
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

const UserScheduleModal = ({ user, show, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

  useLockBodyScroll(show);

  // Fetch user schedules when modal opens
  useEffect(() => {
    if (show && user) {
      fetchSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, user]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const userToken = localStorage.getItem('userToken');
      
      if (!token && !userToken) {
        setError('Please login to view your schedules');
        setLoading(false);
        return;
      }

      // Get user ID - try multiple sources
      let userId = null;
      
      // First try from user prop
      if (user) {
        userId = user._id || user.id;
      }
      
      // If not found, try from localStorage
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            userId = userData._id || userData.id;
          } catch (e) {
            console.error('Error parsing user:', e);
          }
        }
      }
      
      // Also try adminUser
      if (!userId) {
        const adminUserStr = localStorage.getItem('adminUser');
        if (adminUserStr) {
          try {
            const adminUserData = JSON.parse(adminUserStr);
            userId = adminUserData._id || adminUserData.id;
          } catch (e) {
            console.error('Error parsing admin user:', e);
          }
        }
      }

      if (!userId) {
        setError('User ID not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await scheduleAPI.getSchedules('my', userId);
      const result = response.data || response;
      
      let schedulesArray = [];
      if (result && result.data && Array.isArray(result.data)) {
        schedulesArray = result.data;
      } else if (result && Array.isArray(result)) {
        schedulesArray = result;
      } else if (result && result.schedules && Array.isArray(result.schedules)) {
        schedulesArray = result.schedules;
      }
      
      setSchedules(schedulesArray);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load schedules';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedSchedule(null);
  };

  const handleClose = () => {
    // Close schedule details modal if open
    if (showDetails) {
      setShowDetails(false);
      setSelectedSchedule(null);
    }
    // Close the user schedule modal
    onClose();
  };

  if (!show) return null;

  const modalContent = (
    <div className="user-schedule-modal-overlay" onClick={handleClose}>
      <div 
        className="user-schedule-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-schedule-modal-header">
          <div className="user-schedule-modal-user-info">
            <div className="user-schedule-modal-avatar">
              {(user?.profilePicture || user?.photo || user?.picture) ? (
                <img 
                  src={user.profilePicture || user.photo || user.picture}
                  alt={user.name || 'User'}
                  className="user-schedule-modal-avatar-img"
                />
              ) : (
                <div className="user-schedule-modal-avatar-icon">
                  <FaCalendarAlt />
                </div>
              )}
            </div>
            <div className="user-schedule-modal-user-details">
              <h2>{user?.name || user?.email?.split('@')[0] || 'My Schedules'}</h2>
              {!loading && !error && (
                <p>{schedules.length} {schedules.length === 1 ? 'Schedule' : 'Schedules'}</p>
              )}
              {loading && (
                <p>Loading...</p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="user-schedule-modal-refresh"
              onClick={fetchSchedules}
              aria-label="Refresh schedules"
              title="Refresh"
              disabled={loading}
            >
              ↻
            </button>
            <button 
              className="user-schedule-modal-close"
              onClick={handleClose}
              aria-label="Close modal"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="user-schedule-modal-content">
          {loading ? (
            <div className="user-schedule-modal-loading">
              <div className="user-schedule-modal-spinner"></div>
              <p>Loading your schedules...</p>
            </div>
          ) : error ? (
            <div className="user-schedule-modal-error">
              <p>{error}</p>
              <button 
                className="user-schedule-modal-retry"
                onClick={fetchSchedules}
              >
                Retry
              </button>
            </div>
          ) : schedules.length === 0 ? (
            <div className="user-schedule-modal-empty">
              <div className="user-schedule-modal-empty-icon">
                <FaCalendarAlt />
              </div>
              <h3>No schedules yet</h3>
              <p>Create your first travel schedule to get started!</p>
            </div>
          ) : (
            <div className="user-schedule-modal-list">
              {schedules.map((schedule) => {
                const scheduleImage = schedule.bannerImage || schedule.imageUrl;
                const tripName = schedule.tripName || schedule.title || 'Untitled Schedule';
                const fromDate = schedule.Dates?.from || schedule.dates?.from;
                const endDate = schedule.Dates?.end || schedule.dates?.end;
                const fromLocation = schedule.locationDetails?.[0]?.address || 
                                    schedule.location?.from?.address || 
                                    'Unknown location';
                const toLocation = schedule.locationDetails?.[1]?.address || 
                                  schedule.location?.to?.address || 
                                  'Unknown location';
                const visibility = schedule.visible || schedule.visibility || 'Private';

                return (
                  <div 
                    key={schedule._id || schedule.id} 
                    className="user-schedule-modal-item"
                    onClick={() => handleScheduleClick(schedule)}
                  >
                    {scheduleImage && (
                      <div className="user-schedule-modal-item-image">
                        <img 
                          src={scheduleImage} 
                          alt={tripName}
                          onError={(e) => {
                            if (e.target) {
                              e.target.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    )}
                    <div className="user-schedule-modal-item-content">
                      <div className="user-schedule-modal-item-header">
                        <h3>{tripName}</h3>
                        <span className={`user-schedule-modal-item-visibility ${visibility.toLowerCase()}`}>
                          {visibility}
                        </span>
                      </div>
                      <div className="user-schedule-modal-item-info">
                        <div className="user-schedule-modal-item-info-row">
                          <span className="user-schedule-modal-item-label">📅 Dates:</span>
                          <span className="user-schedule-modal-item-value">
                            {fromDate ? new Date(fromDate).toLocaleDateString() : 'N/A'} - 
                            {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="user-schedule-modal-item-info-row">
                          <span className="user-schedule-modal-item-label">📍 From:</span>
                          <span className="user-schedule-modal-item-value">{fromLocation}</span>
                        </div>
                        <div className="user-schedule-modal-item-info-row">
                          <span className="user-schedule-modal-item-label">🎯 To:</span>
                          <span className="user-schedule-modal-item-value">{toLocation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render ScheduleDetailsModal separately (outside the main modal)
  const scheduleDetailsContent = showDetails && selectedSchedule ? (
    <ScheduleDetailsModal
      schedule={selectedSchedule}
      onClose={handleCloseDetails}
    />
  ) : null;

  // Render modal using portal to center it on the window
  if (typeof document !== 'undefined' && document.body) {
    return (
      <>
        {createPortal(modalContent, document.body)}
        {scheduleDetailsContent && createPortal(scheduleDetailsContent, document.body)}
      </>
    );
  }
  
  // Fallback for SSR or when document.body is not available
  return (
    <>
      {modalContent}
      {scheduleDetailsContent}
    </>
  );
};

export default UserScheduleModal;

