import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleAPI } from '../../services/api';
import { SearchInput } from '../common';
import ScheduleForm from './ScheduleForm';
import ScheduleDetailsModal from './ScheduleDetailsModal';
import './ScheduleSection.css';
import GoogleLoginButton from '../auth/GoogleLoginButton';

const ScheduleSection = React.forwardRef(({ searchQuery: propSearchQuery, showHeader = true }, ref) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState(propSearchQuery || '');
  const navigate = useNavigate();

  // Sync with prop search query
  useEffect(() => {
    if (propSearchQuery !== undefined) {
      setSearchQuery(propSearchQuery);
    }
  }, [propSearchQuery]);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
          setIsLoggedIn(true);
          fetchSchedules();
        } catch (e) {
          console.error('Error parsing user data:', e);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token) {
        setSchedules([]);
        return;
      }

      // Fetch user's schedules
      let userId = null;
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          userId = userData._id || userData.id;
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }

      const response = await scheduleAPI.getSchedules('my', userId);
      const result = response.data || response;
      
      let schedulesArray = [];
      if (result && result.data && Array.isArray(result.data)) {
        schedulesArray = result.data;
      } else if (Array.isArray(result)) {
        schedulesArray = result;
      }
      
      setSchedules(schedulesArray);
      setFilteredSchedules(schedulesArray);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleCreated = () => {
    fetchSchedules(); // Refresh the list
  };

  // Expose openForm method via ref
  React.useImperativeHandle(ref, () => ({
    openForm: () => {
      setShowForm(true);
    }
  }));

  // Filter schedules based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSchedules(schedules);
    } else {
      const filtered = schedules.filter((schedule) => {
        const tripName = schedule.tripName || schedule.title || '';
        const fromLocation = schedule.locationDetails?.[0]?.address || 
                           schedule.location?.from?.address || '';
        const toLocation = schedule.locationDetails?.[1]?.address || 
                         schedule.location?.to?.address || '';
        const searchLower = searchQuery.toLowerCase();
        return (
          tripName.toLowerCase().includes(searchLower) ||
          fromLocation.toLowerCase().includes(searchLower) ||
          toLocation.toLowerCase().includes(searchLower)
        );
      });
      setFilteredSchedules(filtered);
    }
  }, [searchQuery, schedules]);

  if (!isLoggedIn) {
    return (
      <section className="schedule-section">
        <div className="container">
          <div className="schedule-login-prompt">
            <div className="prompt-icon">📅</div>
            <h2>Create Your Travel Schedule</h2>
            <p>Login to start planning your perfect trip</p>
            <div className="login-prompt-actions">
              <GoogleLoginButton variant="primary" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="schedule-section">
      <div className="container">
        {showHeader && (
          <div className="schedule-header">
            <div>
              <h2>My Schedules</h2>
              <p>Manage your travel plans</p>
            </div>
            <button 
              className="schedule-add-btn"
              onClick={() => setShowForm(true)}
            >
              + Add Schedule
            </button>
          </div>
        )}


        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your schedules...</p>
          </div>
        ) : filteredSchedules.length > 0 ? (
          <div className="schedule-grid">
            {filteredSchedules.map((schedule) => {
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
              const travelMode = schedule.travelMode || 'Bike';

              return (
                <div 
                  key={schedule._id || schedule.id} 
                  className="schedule-card"
                  onClick={() => { setSelectedSchedule(schedule); setShowDetails(true); }}
                >
                  {scheduleImage && (
                    <div className="schedule-card-image">
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
                  <div className="schedule-card-content-wrapper">
                    <div className="schedule-card-header">
                      <h3>{tripName}</h3>
                      <span className={`schedule-status ${visibility.toLowerCase()}`}>
                        {visibility}
                      </span>
                    </div>
                    <div className="schedule-card-content">
                      <div className="schedule-info-item">
                        <span className="schedule-info-label">📅 Dates:</span>
                        <span className="schedule-info-value">
                          {fromDate ? new Date(fromDate).toLocaleDateString() : 'N/A'} - 
                          {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="schedule-info-item">
                        <span className="schedule-info-label">📍 From:</span>
                        <span className="schedule-info-value">{fromLocation}</span>
                      </div>
                      <div className="schedule-info-item">
                        <span className="schedule-info-label">🎯 To:</span>
                        <span className="schedule-info-value">{toLocation}</span>
                      </div>
                      <div className="schedule-info-item">
                        <span className="schedule-info-label">🚗 Mode:</span>
                        <span className="schedule-info-value">{travelMode}</span>
                      </div>
                      {schedule.numberOfDays && (
                        <div className="schedule-info-item">
                          <span className="schedule-info-label">📆 Days:</span>
                          <span className="schedule-info-value">{schedule.numberOfDays} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-schedules">
            <div className="no-schedules-icon">📅</div>
            <h3>No schedules yet</h3>
            <p>Create your first travel schedule to get started!</p>
            <button 
              className="schedule-add-btn-primary"
              onClick={() => setShowForm(true)}
            >
              Create Schedule
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <ScheduleForm
          onClose={() => setShowForm(false)}
          onSuccess={handleScheduleCreated}
        />
      )}

      {showDetails && selectedSchedule && (
        <ScheduleDetailsModal
          schedule={selectedSchedule}
          onClose={() => { setShowDetails(false); setSelectedSchedule(null); }}
        />
      )}
    </section>
  );
});

ScheduleSection.displayName = 'ScheduleSection';

export default ScheduleSection;
