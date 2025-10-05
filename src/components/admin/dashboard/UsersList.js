import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaEye,
  FaUserCircle,
  FaSpinner
} from 'react-icons/fa';
import axios from 'axios';
import './UsersList.css';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalUsers: 0,
    usersPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    deleted: undefined
  });
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  // Function to fetch users
  const fetchUsers = useCallback(async (page = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.deleted !== undefined && { deleted: filters.deleted.toString() })
      });

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard-users/listing?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { users: newUsers, pagination: newPagination } = response.data.data;
        
        if (append) {
          setUsers(prev => [...prev, ...newUsers]);
        } else {
          setUsers(newUsers);
        }
        
        setPagination(newPagination);
        setHasMore(newPagination.hasNextPage);
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    fetchUsers(1, false);
  }, [fetchUsers]);

  // Intersection Observer for lazy loading
  const lastUserElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchUsers(pagination.currentPage + 1, true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, pagination.currentPage, fetchUsers]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setUsers([]);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setHasMore(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user status
  const getUserStatus = (user) => {
    if (user.isDeleted) return { text: 'Deleted', color: '#ef4444', bg: '#fef2f2' };
    if (user.isActive === false) return { text: 'Inactive', color: '#f59e0b', bg: '#fffbeb' };
    return { text: 'Active', color: '#10b981', bg: '#ecfdf5' };
  };

  // Get profile picture or fallback
  const getProfilePicture = (user) => {
    if (user.profilePicture) {
      return user.profilePicture;
    }
    return null;
  };

  if (error) {
    return (
      <div className="users-error">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => fetchUsers(1, false)} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-list-container">
      {/* Header */}
      <div className="users-header">
        <h3>Users Management</h3>
        <div className="users-filters">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.deleted === undefined ? '' : filters.deleted.toString()} 
              onChange={(e) => handleFilterChange('deleted', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="filter-select"
            >
              <option value="">All Users</option>
              <option value="false">Active Users</option>
              <option value="true">Deleted Users</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By:</label>
            <select 
              value={filters.sortBy} 
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="createdAt">Registration Date</option>
              <option value="fullName">Full Name</option>
              <option value="email">Email</option>
              <option value="userName">Username</option>
              <option value="lastLoginAt">Last Login</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Order:</label>
            <select 
              value={filters.sortOrder} 
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="filter-select"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="users-list">
        {users.length === 0 && !loading ? (
          <div className="no-users">
            <FaUserCircle />
            <p>No users found</p>
          </div>
        ) : (
          users.map((user, index) => {
            const isLast = index === users.length - 1;
            const status = getUserStatus(user);
            
            return (
              <div 
                key={user._id} 
                className="user-card"
                ref={isLast ? lastUserElementRef : null}
              >
                <div className="user-avatar">
                  {getProfilePicture(user) ? (
                    <img 
                      src={getProfilePicture(user)} 
                      alt={user.fullName}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <FaUser />
                  )}
                </div>

                <div className="user-info">
                  <div className="user-main-info">
                    <h4 className="user-name">{user.fullName}</h4>
                    <span className="user-username">@{user.userName}</span>
                    <div 
                      className="user-status"
                      style={{ 
                        color: status.color, 
                        backgroundColor: status.bg 
                      }}
                    >
                      {status.text}
                    </div>
                  </div>

                  <div className="user-details">
                    <div className="detail-item">
                      <FaEnvelope />
                      <span>{user.email}</span>
                    </div>
                    
                    {user.phone && (
                      <div className="detail-item">
                        <FaPhone />
                        <span>{user.phone.code} {user.phone.number}</span>
                      </div>
                    )}
                    
                    {/* {user.placeDetails && (
                      <div className="detail-item">
                        <FaMapMarkerAlt />
                        <span>{user.placeDetails.name}, {user.placeDetails.address}</span>
                      </div>
                    )} */}
                    
                    <div className="detail-item">
                      <FaCalendarAlt />
                      <span>Joined: {formatDate(user.createdAt)}</span>
                    </div>
                    
                    {/* {user.lastLoginAt && (
                      <div className="detail-item">
                        <FaEye />
                        <span>Last login: {formatDate(user.lastLoginAt)}</span>
                      </div>
                    )} */}
                  </div>

                  {/* {user.bio && (
                    <div className="user-bio">
                      <p>{user.bio}</p>
                    </div>
                  )} */}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="loading-indicator">
          <FaSpinner className="spinner" />
          <p>Loading users...</p>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && users.length > 0 && (
        <div className="end-of-list">
          <p>No more users to load</p>
        </div>
      )}
    </div>
  );
};

export default UsersList;
