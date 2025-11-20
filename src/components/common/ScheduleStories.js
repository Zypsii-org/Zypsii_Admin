import React, { useState, useEffect, useMemo } from 'react';
import { scheduleAPI } from '../../services/api';
import { FaPlus } from 'react-icons/fa';
import ScheduleDetailsModal from '../homepage/ScheduleDetailsModal';
import ScheduleForm from '../homepage/ScheduleForm';
import './ScheduleStories.css';

const ScheduleStories = React.memo(({ userId }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPublicSchedules();
  }, []); // Only fetch once on mount

  const fetchPublicSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setSchedules([]);
        return;
      }

      // Fetch public schedules
      const response = await scheduleAPI.getSchedules('Public');
      const result = response.data || response;
      
      let schedulesArray = [];
      if (result && result.data && Array.isArray(result.data)) {
        schedulesArray = result.data;
      } else if (Array.isArray(result)) {
        schedulesArray = result;
      }
      
      // Limit to first 10 for stories
      setSchedules(schedulesArray.slice(0, 10));
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetails(true);
  };

  const handleAddStoryClick = () => {
    setShowForm(true);
  };

  const handleScheduleCreated = () => {
    setShowForm(false);
    fetchPublicSchedules(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="schedule-stories-container">
        <div className="schedule-stories-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="schedule-stories-container">
        <div className="schedule-stories-scroll">
          {/* Add Story Button - First Item (Always Visible) */}
          <div
            className="schedule-story-item add-story-item"
            onClick={handleAddStoryClick}
          >
            <div className="story-image-wrapper add-story-wrapper">
              <div className="story-placeholder add-story-placeholder">
                <FaPlus className="add-story-icon" />
              </div>
              <div className="add-story-border"></div>
            </div>
            <div className="story-title add-story-title">Create</div>
            <div className="story-location add-story-location">New Schedule</div>
          </div>

          {/* Existing Schedules */}
          {schedules.map((schedule) => {
            const scheduleImage = schedule.bannerImage || schedule.imageUrl;
            const tripName = schedule.tripName || schedule.title || 'Untitled';
            const fromLocation = schedule.locationDetails?.[0]?.address || 
                              schedule.location?.from?.address || 
                              'Unknown';
            
            return (
              <div
                key={schedule._id || schedule.id}
                className="schedule-story-item"
                onClick={() => handleScheduleClick(schedule)}
              >
                <div className="story-image-wrapper">
                  {scheduleImage ? (
                    <img
                      src={scheduleImage}
                      alt={tripName}
                      className="story-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="story-placeholder">
                      <span>📅</span>
                    </div>
                  )}
                  <div className="story-overlay"></div>
                </div>
                <div className="story-title">{tripName}</div>
                <div className="story-location">{fromLocation}</div>
              </div>
            );
          })}
        </div>
      </div>

      {showDetails && selectedSchedule && (
        <ScheduleDetailsModal
          schedule={selectedSchedule}
          onClose={() => {
            setShowDetails(false);
            setSelectedSchedule(null);
          }}
        />
      )}

      {showForm && (
        <ScheduleForm
          onClose={() => setShowForm(false)}
          onSuccess={handleScheduleCreated}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Only re-render if userId changes
  return prevProps.userId === nextProps.userId;
});

ScheduleStories.displayName = 'ScheduleStories';

export default ScheduleStories;

