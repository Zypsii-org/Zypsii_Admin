import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import PlacesSection from '../../homepage/PlacesSection';
import ExploreSection from '../../homepage/ExploreSection';
import ScheduleSection from '../../homepage/ScheduleSection';
import { SearchInput } from '../../common';
import ScheduleForm from '../../homepage/ScheduleForm';
import FriendsSection from '../../homepage/FriendsSection/FriendsSection';
import UsersSidebar from '../../homepage/FriendsSection/UsersSidebar';
import UserScheduleModal from './UserScheduleModal';
import { FaCompass, FaMapMarkerAlt, FaCalendarAlt, FaSignOutAlt, FaUserFriends, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import './InstagramHome.css';

const InstagramHome = () => {
  const [activeSection, setActiveSection] = useState('explore');
  const { logout, user, isAuthenticated, loading } = useAuth();
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showUserScheduleModal, setShowUserScheduleModal] = useState(false);
  const scheduleFormRef = React.useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Clear search when switching sections
  useEffect(() => {
    setGlobalSearchQuery('');
  }, [activeSection]);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile((prevMobile) => {
        if (prevMobile !== mobile) {
          setIsSidebarOpen(!mobile);
        }
        return mobile;
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddSchedule = () => {
    if (scheduleFormRef.current) {
      scheduleFormRef.current.openForm();
    } else {
      setShowScheduleForm(true);
    }
  };

  const handleScheduleCreated = () => {
    setShowScheduleForm(false);
  };

  const getSearchPlaceholder = () => {
    switch (activeSection) {
      case 'explore':
        return 'Search countries or places...';
      case 'places':
        return 'Search saved places...';
      case 'schedule':
        return 'Search schedules...';
      case 'friends':
        return 'Search friends...';
      case 'users':
        return 'Search users...';
      default:
        return 'Search...';
    }
  };

  const handleLogout = () => {
    // Clear both user and admin tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    logout();
    // Redirect to main website after logout
    window.location.href = '/';
  };

  const sections = [
    { id: 'explore', name: 'Explore', icon: FaCompass },
    { id: 'places', name: 'Places', icon: FaMapMarkerAlt },
    { id: 'schedule', name: 'Schedule', icon: FaCalendarAlt },
    // Temporarily hide Friends option in sidebar
    // { id: 'friends', name: 'Friends', icon: FaUserFriends },
  ];

  // Memoize content to prevent unnecessary re-renders
  const content = useMemo(() => {
    switch (activeSection) {
      case 'explore':
        return (
          <div key="explore" className="section-content">
            <ExploreSection searchQuery={globalSearchQuery} />
          </div>
        );
      case 'places':
        return (
          <div key="places" className="section-content">
            <PlacesSection searchQuery={globalSearchQuery} showHeader={false} />
          </div>
        );
      case 'schedule':
        return (
          <div key="schedule" className="section-content">
            <ScheduleSection 
              searchQuery={globalSearchQuery} 
              showHeader={false}
              ref={scheduleFormRef}
            />
          </div>
        );
      case 'friends':
        return (
          <div key="friends" className="section-content">
            <FriendsSection searchQuery={globalSearchQuery} />
          </div>
        );
      default:
        return (
          <div key="explore" className="section-content">
            <ExploreSection searchQuery={globalSearchQuery} />
          </div>
        );
    }
  }, [activeSection, globalSearchQuery]);

  const shouldShowUsersSidebar = ['explore', 'places', 'schedule'].includes(activeSection);

  if (loading || (!loading && !isAuthenticated)) {
    return null;
  }

  return (
    <div
      className={`instagram-home-container ${isMobile ? 'mobile-stack' : ''} ${
        isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'
      }`}
    >
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      {/* Left Sidebar */}
      <aside
        className={`instagram-sidebar ${
          isMobile ? (isSidebarOpen ? 'mobile-visible' : 'mobile-hidden') : ''
        }`}
      >
        <div className="sidebar-header">
          <img src="/logo.png" alt="Zypsii" className="sidebar-logo" />
          <h2 className="sidebar-logo-text">Zypsii</h2>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`sidebar-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(section.id);
                  if (isMobile) {
                    setIsSidebarOpen(false);
                  }
                }}
              >
                <Icon className="nav-icon" />
                <span className="nav-text">{section.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="instagram-main-content">
        {/* Global Search Bar */}
        <div className="instagram-search-section">
          <div className="search-header-container">
            <div className="header-top-row">
              <div className="header-left">
                {isMobile && (
                  <button
                    className="sidebar-toggle-btn"
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    aria-label={`${isSidebarOpen ? 'Close' : 'Open'} navigation menu`}
                  >
                    {isSidebarOpen ? <FaTimes /> : <FaBars />}
                  </button>
                )}
                <h2 className="page-title">Zypsii</h2>
              </div>
              {user && (
                <button
                  className="header-profile-btn"
                  onClick={() => setShowUserScheduleModal(true)}
                  aria-label="Open profile schedules"
                >
                  <div className="header-profile-avatar">
                    {(user.profilePicture || user.photo || user.picture) && !imageError ? (
                      <img
                        src={user.profilePicture || user.photo || user.picture}
                        alt={user.name || 'User'}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                </button>
              )}
            </div>
            <div className="search-action-row">
              <div className="search-input-container">
                <SearchInput
                  value={globalSearchQuery}
                  onChange={setGlobalSearchQuery}
                  placeholder={getSearchPlaceholder()}
                />
              </div>
              <button 
                className="add-schedule-header-btn"
                onClick={handleAddSchedule}
              >
                + Add Schedule
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content - Only this section updates */}
        <div className={`instagram-content-section ${shouldShowUsersSidebar ? 'with-sidebar' : ''}`}>
          <div className="instagram-primary-content">
            {content}
          </div>
          {shouldShowUsersSidebar && (
            <aside className="instagram-secondary-content">
              <UsersSidebar searchQuery={globalSearchQuery} />
            </aside>
          )}
        </div>
      </main>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <ScheduleForm
          onClose={() => setShowScheduleForm(false)}
          onSuccess={handleScheduleCreated}
        />
      )}

      {/* User Schedule Modal */}
      {showUserScheduleModal && user && (
        <UserScheduleModal
          user={user}
          show={showUserScheduleModal}
          onClose={() => setShowUserScheduleModal(false)}
        />
      )}
    </div>
  );
};

export default InstagramHome;

