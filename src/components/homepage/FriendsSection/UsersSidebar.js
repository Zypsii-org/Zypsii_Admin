import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { friendsAPI, usersAPI, scheduleAPI } from '../../../services/api';
import GoogleLoginButton from '../../auth/GoogleLoginButton';
import ScheduleDetailsModal from '../../homepage/ScheduleDetailsModal';
import { getCurrentUser, getUserId } from './FriendsSection';
import './FriendsSection.css';
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

const ITEM_HEIGHT = 76;

const calculatePageSize = () => {
  if (typeof window === 'undefined') {
    return 6;
  }
  const availableHeight = window.innerHeight - 320;
  const computed = Math.floor(availableHeight / ITEM_HEIGHT);
  return Math.max(4, computed || 4);
};

const shuffleUsers = (source = []) => {
  const array = [...source];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const normalizeUsers = (payload) => {
  if (!payload) return [];

  const list = Array.isArray(payload?.data?.users)
    ? payload.data.users
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.users)
    ? payload.users
    : [];

  return list
    .map((entry) => {
      const user = entry?.user || entry;
      const id = getUserId(user);
      if (!id) return null;
      return {
        id,
        name: user.fullName || user.name || user.userName || 'Unknown User',
        userName: user.userName || '',
        profilePicture: user.profilePicture || user.profileImage || null,
        bio: user.bio || '',
      };
    })
    .filter(Boolean);
};

const UserProfileDialog = ({
  user,
  isFollowing,
  loading,
  onFollowToggle,
  onClose,
  stats,
  schedules,
  schedulesLoading,
  onScheduleClick,
}) => {
  useLockBodyScroll(Boolean(user));

  if (!user) {
    return null;
  }

  const formatScheduleDates = (schedule) => {
    const from = schedule.Dates?.from || schedule.dates?.from;
    const to = schedule.Dates?.end || schedule.dates?.end;
    if (!from && !to) return 'N/A';
    const fromDate = from ? new Date(from).toLocaleDateString() : 'N/A';
    const toDate = to ? new Date(to).toLocaleDateString() : 'N/A';
    return `${fromDate} – ${toDate}`;
  };

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div
        className="user-profile-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-dialog-title"
      >
        <button className="user-profile-dialog-close" onClick={onClose}>
          ×
        </button>
        <div className="user-profile-dialog-header">
          <div className="user-profile-dialog-avatar">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="user-profile-dialog-meta">
            <h2 id="user-profile-dialog-title">{user.name}</h2>
            <p className="user-profile-dialog-handle">
              @{user.userName || 'zypsii_user'}
            </p>
            <div className="user-profile-dialog-stats">
              <span><strong>{stats.followers || 0}</strong> Followers</span>
              <span><strong>{stats.following || 0}</strong> Following</span>
            </div>
          </div>
        </div>
        {user.bio && (
          <div className="user-profile-dialog-section">
            <h3>About</h3>
            <p>{user.bio}</p>
          </div>
        )}
        <div className="user-profile-dialog-actions">
          <button
            className={`user-profile-dialog-follow ${
              isFollowing ? 'following' : ''
            }`}
            onClick={onFollowToggle}
            disabled={loading}
          >
            {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
        <div className="user-profile-dialog-content">
          <h3>Public Schedules</h3>
          {schedulesLoading ? (
            <div className="friends-placeholder">Loading schedules…</div>
          ) : schedules.length === 0 ? (
            <div className="friends-placeholder">No public schedules yet.</div>
          ) : (
            <div className="friend-schedule-grid">
              {schedules.map((schedule) => (
                <div
                  key={schedule._id || schedule.id}
                  className="friend-schedule-card"
                  onClick={() => onScheduleClick(schedule)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onScheduleClick(schedule);
                    }
                  }}
                >
                  {schedule.bannerImage && (
                    <div className="friend-schedule-image">
                      <img src={schedule.bannerImage} alt={schedule.tripName} />
                    </div>
                  )}
                  <div className="friend-schedule-body">
                    <div className="friend-schedule-header">
                      <h4>{schedule.tripName || 'Untitled Schedule'}</h4>
                      <span className="schedule-visibility">{schedule.visible || schedule.visibility}</span>
                    </div>
                    <div className="friend-schedule-info">
                      <div><strong>Dates:</strong> {formatScheduleDates(schedule)}</div>
                      <div><strong>From:</strong> {schedule.locationDetails?.[0]?.address || schedule.location?.from?.address || 'Unknown'}</div>
                      <div><strong>To:</strong> {schedule.locationDetails?.[1]?.address || schedule.location?.to?.address || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UsersSidebar = ({ searchQuery = '' }) => {
  const [sessionUser, setSessionUser] = useState(getCurrentUser());
  const [needsLogin, setNeedsLogin] = useState(() => {
    const current = getCurrentUser();
    const token = localStorage.getItem('userToken');
    return !(current && token);
  });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [followIds, setFollowIds] = useState(new Set());
  const [followLoading, setFollowLoading] = useState({});
  const [itemsPerPage, setItemsPerPage] = useState(() => calculatePageSize());
  const [visibleCount, setVisibleCount] = useState(() => calculatePageSize());
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserStats, setSelectedUserStats] = useState({ followers: 0, following: 0 });
  const [selectedUserSchedules, setSelectedUserSchedules] = useState([]);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      const current = getCurrentUser();
      setSessionUser(current);
      const token = localStorage.getItem('userToken');
      setNeedsLogin(!(current && token));
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadUsers = useCallback(async () => {
    const current = getCurrentUser();
    const token = localStorage.getItem('userToken');
    if (!current || !token) {
      setNeedsLogin(true);
      setUsers([]);
      setLoadingUsers(false);
      setUsersError('Please sign in to explore users.');
      return;
    }

    try {
      setLoadingUsers(true);
      setUsersError(null);
      const response = await usersAPI.searchUsers({ page: 1, limit: 60 });
      const normalized = normalizeUsers(response?.data);
      setUsers(shuffleUsers(normalized));
      setNeedsLogin(false);
    } catch (error) {
      console.error('Failed to load users sidebar list:', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setUsersError('Please sign in to explore users.');
        setNeedsLogin(true);
      } else {
        setUsersError(error.message || 'Failed to load users');
      }
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadFollowing = useCallback(async () => {
    const current = getCurrentUser();
    const token = localStorage.getItem('userToken');
    if (!current || !token) {
      setNeedsLogin(true);
      return;
    }

    try {
      const response = await friendsAPI.getFollowing(getUserId(current));
      const data = response?.data;
      if (data?.following) {
        const ids = data.following
          .map((entry) => getUserId(entry.followingId || entry))
          .filter(Boolean);
        setFollowIds(new Set(ids));
      } else {
        setFollowIds(new Set());
      }
    } catch (error) {
      console.error('Failed to load following list', error);
      if (error?.response?.status === 404) {
        setFollowIds(new Set());
        return;
      }
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setNeedsLogin(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!needsLogin) {
      loadUsers();
      loadFollowing();
    }
  }, [needsLogin, loadUsers, loadFollowing]);

  const globalFilteredUsers = useMemo(() => {
    const term = (searchQuery || '').trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      const name = user.name || '';
      const handle = user.userName || '';
      return (
        name.toLowerCase().includes(term) || handle.toLowerCase().includes(term)
      );
    });
  }, [users, searchQuery]);

  const filteredUsers = useMemo(() => {
    const localTerm = sidebarSearch.trim().toLowerCase();
    if (!localTerm) {
      return globalFilteredUsers;
    }
    return globalFilteredUsers.filter((user) => {
      const name = user.name || '';
      const handle = user.userName || '';
      const bio = user.bio || '';
      return (
        name.toLowerCase().includes(localTerm) ||
        handle.toLowerCase().includes(localTerm) ||
        bio.toLowerCase().includes(localTerm)
      );
    });
  }, [globalFilteredUsers, sidebarSearch]);

  useEffect(() => {
    if (needsLogin) {
      return undefined;
    }

    const handleResize = () => {
      const nextPageSize = calculatePageSize();
      const total = filteredUsers.length;
      setItemsPerPage(nextPageSize);
      setVisibleCount((prev) => {
        if (!total) {
          return 0;
        }
        if (prev <= nextPageSize) {
          return Math.min(nextPageSize, total);
        }
        return Math.min(prev, total);
      });
    };

    handleResize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, [filteredUsers.length, needsLogin]);

  useEffect(() => {
    const total = filteredUsers.length;
    if (!total) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount((prev) => {
      if (prev === 0 || prev > total) {
        return Math.min(itemsPerPage, total);
      }
      return Math.min(prev, total);
    });
  }, [filteredUsers.length, itemsPerPage, searchQuery, sidebarSearch]);

  const handleFollowToggle = useCallback(
    async (user) => {
      const userId = getUserId(user);
      const sessionUserId = getUserId(sessionUser);
      if (!userId || followLoading[userId]) {
        return;
      }

      if (!sessionUser || !sessionUserId) {
        setNeedsLogin(true);
        return;
      }

      const isFollowing = followIds.has(userId);
      setFollowLoading((prev) => ({ ...prev, [userId]: true }));

      try {
        if (isFollowing) {
          await friendsAPI.unfollowUser(sessionUserId, userId);
          setFollowIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        } else {
          await friendsAPI.followUser(sessionUserId, userId);
          setFollowIds((prev) => {
            const next = new Set(prev);
            next.add(userId);
            return next;
          });
        }
      } catch (error) {
        console.error('Failed to toggle follow state:', error);
      } finally {
        setFollowLoading((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    },
    [followIds, followLoading, sessionUser],
  );

  const handleRefresh = () => {
    loadUsers();
    loadFollowing();
  };

  const handleShowMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + itemsPerPage, filteredUsers.length),
    );
  };

  const loadUserDetails = useCallback(async (user) => {
    const userId = getUserId(user);
    if (!userId) return;

    setSelectedUserLoading(true);
    setSelectedUserSchedules([]);
    setSelectedUserStats({ followers: 0, following: 0 });

    try {
      const [followersRes, followingRes, schedulesRes] = await Promise.allSettled([
        friendsAPI.getFollowers(userId),
        friendsAPI.getFollowing(userId),
        scheduleAPI.getSchedules('my', userId),
      ]);

      if (followersRes.status === 'fulfilled') {
        const data = followersRes.value?.data;
        const count = data?.followersCount ?? (data?.followers?.length ?? 0);
        setSelectedUserStats((prev) => ({ ...prev, followers: count }));
      }

      if (followingRes.status === 'fulfilled') {
        const data = followingRes.value?.data;
        const count = data?.followingCount ?? (data?.following?.length ?? 0);
        setSelectedUserStats((prev) => ({ ...prev, following: count }));
      }

      if (schedulesRes.status === 'fulfilled') {
        const data = schedulesRes.value?.data;
        const schedules = data?.data || data?.schedules || [];
        const publicSchedules = schedules.filter((schedule) => {
          const visibility = (schedule.visible || schedule.visibility || '').toLowerCase();
          return visibility === 'public';
        });
        setSelectedUserSchedules(publicSchedules);
      }
    } catch (error) {
      console.error('Failed to load user details', error);
    } finally {
      setSelectedUserLoading(false);
    }
  }, []);

  const handleOpenProfile = (user) => {
    setSelectedUser(user);
    loadUserDetails(user);
  };

  const handleCloseProfile = () => {
    setSelectedUser(null);
    setSelectedUserStats({ followers: 0, following: 0 });
    setSelectedUserSchedules([]);
  };

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setShowScheduleDetails(true);
  };

  const handleCloseSchedule = () => {
    setShowScheduleDetails(false);
    setSelectedSchedule(null);
  };

  const selectedUserId = selectedUser ? getUserId(selectedUser) : null;
  const selectedUserFollowing = selectedUserId
    ? followIds.has(selectedUserId)
    : false;
  const selectedFollowLoading = selectedUserId
    ? Boolean(followLoading[selectedUserId])
    : false;

  const renderProfileDialog = () => {
    if (!selectedUser) {
      return null;
    }

    const dialog = (
      <UserProfileDialog
        user={selectedUser}
        isFollowing={selectedUserFollowing}
        loading={selectedFollowLoading}
        onFollowToggle={() => handleFollowToggle(selectedUser)}
        onClose={handleCloseProfile}
        stats={selectedUserStats}
        schedules={selectedUserSchedules}
        schedulesLoading={selectedUserLoading}
        onScheduleClick={handleScheduleClick}
      />
    );

    if (typeof document !== 'undefined') {
      return createPortal(dialog, document.body);
    }

    return dialog;
  };

  const displayedUsers = useMemo(
    () => filteredUsers.slice(0, visibleCount),
    [filteredUsers, visibleCount],
  );

  const hasMore = visibleCount < filteredUsers.length;

  if (needsLogin) {
    return (
      <div className="users-sidebar">
        <div className="users-sidebar-card">
          <h3>Login Required</h3>
          <p>Sign in to follow fellow travellers and see their journeys.</p>
          <GoogleLoginButton variant="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="users-sidebar">
      <div className="users-sidebar-card">
        <div className="users-sidebar-header">
          <h3>Discover Users</h3>
          <button
            type="button"
            className="users-sidebar-refresh"
            onClick={handleRefresh}
            title="Refresh users"
          >
            ↻
          </button>
        </div>
        <div className="users-sidebar-search">
          <input
            type="search"
            value={sidebarSearch}
            onChange={(event) => setSidebarSearch(event.target.value)}
            placeholder="Search users"
          />
        </div>
        <div className="users-sidebar-scroll">
          {loadingUsers ? (
            <div className="users-sidebar-placeholder">Loading users…</div>
          ) : usersError ? (
            <div className="users-sidebar-error">{usersError}</div>
          ) : displayedUsers.length === 0 ? (
            <div className="users-sidebar-placeholder">No users found.</div>
          ) : (
            <ul className="users-sidebar-list">
              {displayedUsers.map((user) => {
                const userId = getUserId(user);
                const isFollowing = followIds.has(userId);
                const loading = followLoading[userId];
                const isSelf = userId && getUserId(sessionUser) === userId;
                return (
                  <li
                    key={userId}
                    className="users-sidebar-item"
                    onClick={() => handleOpenProfile(user)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOpenProfile(user);
                      }
                    }}
                  >
                    <div className="users-sidebar-avatar">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} />
                      ) : (
                        <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div className="users-sidebar-info">
                      <div className="users-sidebar-name">{user.name}</div>
                      <div className="users-sidebar-handle">
                        @{user.userName || 'zypsii_user'}
                      </div>
                    </div>
                    {!isSelf && (
                      <button
                        type="button"
                        className={`users-sidebar-follow ${
                          isFollowing ? 'following' : ''
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleFollowToggle(user);
                        }}
                        disabled={loading}
                      >
                        {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {hasMore && (
          <button
            type="button"
            className="users-sidebar-show-more"
            onClick={handleShowMore}
          >
            Show more travellers
          </button>
        )}
      </div>

      {selectedUser && (
        renderProfileDialog()
      )}

      {showScheduleDetails && selectedSchedule && (
        <ScheduleDetailsModal
          schedule={selectedSchedule}
          onClose={handleCloseSchedule}
        />
      )}
    </div>
  );
};

export default UsersSidebar;




