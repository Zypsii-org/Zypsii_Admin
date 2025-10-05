import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaFileAlt,
  FaVideo
} from 'react-icons/fa';
import axios from 'axios';
import UsersList from './UsersList';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlaces: 0,
    totalPosts: 0,
    totalReels: 0,
    totalSchedules: 0,
    topPlaces: 0,
    totalGuides: 0,
    totalYoutubeVideos: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch count for a specific type
  const fetchCount = async (countType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard-count/total-counts/${countType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch count');
      }
    } catch (error) {
      console.error(`Error fetching ${countType} count:`, error);
      return 0; // Return 0 if there's an error
    }
  };

  // Function to fetch all counts
  const fetchAllCounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all counts in parallel
      const [users, places, posts, reels, schedules, guides, youtubeVideos] = await Promise.all([
        fetchCount('users'),
        fetchCount('places'),
        fetchCount('posts'),
        fetchCount('reels'),
        fetchCount('schedules'),
        fetchCount('guides'),
        fetchCount('youtubeVideos')
      ]);

      setStats({
        totalUsers: users,
        totalPlaces: places,
        totalPosts: posts,
        totalReels: reels,
        totalSchedules: schedules,
        topPlaces: guides, // Using guides count for top places
        totalGuides: guides,
        totalYoutubeVideos: youtubeVideos
      });



    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchAllCounts} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome to your Zypsii admin dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon places">
            <FaMapMarkerAlt />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPlaces.toLocaleString()}</h3>
            <p>Total Places</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon posts">
            <FaFileAlt />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPosts.toLocaleString()}</h3>
            <p>Total Posts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon reels">
            <FaVideo />
          </div>
          <div className="stat-content">
            <h3>{stats.totalReels.toLocaleString()}</h3>
            <p>Total Reels</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon schedules">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <h3>{stats.totalSchedules.toLocaleString()}</h3>
            <p>Total Schedules</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon top-places">
            <FaMapMarkerAlt />
          </div>
          <div className="stat-content">
            <h3>{stats.topPlaces.toLocaleString()}</h3>
            <p>Top Places</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon guides">
            <FaFileAlt />
          </div>
          <div className="stat-content">
            <h3>{stats.totalGuides.toLocaleString()}</h3>
            <p>Total Guides</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon youtube">
            <FaVideo />
          </div>
          <div className="stat-content">
            <h3>{stats.totalYoutubeVideos.toLocaleString()}</h3>
            <p>YouTube Videos</p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="dashboard-section">
        <UsersList />
      </div>
    </div>
  );
};

export default Dashboard;
