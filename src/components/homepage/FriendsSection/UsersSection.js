import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaUsers, FaCommentDots } from 'react-icons/fa';
import { IoMdRefresh } from 'react-icons/io';
import { friendsAPI, scheduleAPI, usersAPI } from '../../../services/api';
import GoogleLoginButton from '../../auth/GoogleLoginButton';
import {
  FriendChatPanel,
  FriendDetailView,
  getCurrentUser,
  getUserId,
} from './FriendsSection';
import './FriendsSection.css';

const INITIAL_STATS = { followers: 0, following: 0 };

const UsersSection = ({ searchQuery = '' }) => {
  const [sessionUser, setSessionUser] = useState(getCurrentUser());
  const [needsLogin, setNeedsLogin] = useState(() => {
    const user = getCurrentUser();
    const token = localStorage.getItem('userToken');
    return !(user && token);
  });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [selectedStats, setSelectedStats] = useState(INITIAL_STATS);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [followIds, setFollowIds] = useState(new Set());
  const [followLoading, setFollowLoading] = useState({});
  const [chatUser, setChatUser] = useState(null);

  useEffect(() => {
    const handleStorageChange = () => {
      const user = getCurrentUser();
      setSessionUser(user);
      const token = localStorage.getItem('userToken');
      setNeedsLogin(!(user && token));
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadUsers = useCallback(async () => {
    const user = getCurrentUser();
    const token = localStorage.getItem('userToken');
    if (!user || !token) {
      setNeedsLogin(true);
      setUsers([]);
      setLoadingUsers(false);
      setUsersError('Please sign in to explore users.');
      return;
    }

    try {
      setLoadingUsers(true);
      setUsersError(null);
      const params = {
        page: 1,
        limit: 40,
      };
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery) {
        params.q = trimmedQuery;
      }

      const response = await usersAPI.searchUsers(params);
      const data = response?.data;
      const list = Array.isArray(data?.data?.users)
        ? data.data.users
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.users)
        ? data.users
        : [];

      const normalized = list
        .map((entry) => {
          const userRecord = entry?.user || entry;
          const id = getUserId(userRecord);
          if (!id) return null;
          return {
            id,
            name:
              userRecord.fullName ||
              userRecord.name ||
              userRecord.userName ||
              'Unknown User',
            userName: userRecord.userName || '',
            profilePicture:
              userRecord.profilePicture || userRecord.profileImage || null,
            bio: userRecord.bio || '',
            location: userRecord.location || '',
            lastActive: userRecord.updatedAt || userRecord.lastActive || null,
          };
        })
        .filter(Boolean);

      setUsers(normalized);
      setNeedsLogin(false);
    } catch (error) {
      console.error('Failed to load users list:', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setUsersError('Please sign in to explore users.');
        setNeedsLogin(true);
      } else {
        setUsersError(error.message || 'Failed to load users');
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [searchQuery]);

  const loadFollowing = useCallback(async () => {
    const user = getCurrentUser();
    const token = localStorage.getItem('userToken');
    if (!user || !token) {
      setNeedsLogin(true);
      return;
    }

    try {
      const response = await friendsAPI.getFollowing(getUserId(user));
      const data = response?.data;
      if (data?.following) {
        const ids = data.following.map((entry) =>
          getUserId(entry.followingId || entry),
        );
        setFollowIds(new Set(ids.filter(Boolean)));
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

  const loadUserDetails = useCallback(async (user) => {
    const userId = getUserId(user);
    if (!userId) return;

    setSelectedLoading(true);
    setSelectedSchedules([]);
    setSelectedStats(INITIAL_STATS);

    try {
      const [followersRes, followingRes, schedulesRes] = await Promise.allSettled([
        friendsAPI.getFollowers(userId),
        friendsAPI.getFollowing(userId),
        scheduleAPI.getSchedules('my', userId),
      ]);

      if (followersRes.status === 'fulfilled') {
        const data = followersRes.value?.data;
        const count = data?.followersCount ?? data?.followers?.length ?? 0;
        setSelectedStats((prev) => ({ ...prev, followers: count }));
      }

      if (followingRes.status === 'fulfilled') {
        const data = followingRes.value?.data;
        const count = data?.followingCount ?? data?.following?.length ?? 0;
        setSelectedStats((prev) => ({ ...prev, following: count }));
      }

      if (schedulesRes.status === 'fulfilled') {
        const data = schedulesRes.value?.data;
        const schedules = data?.data || data?.schedules || [];
        const publicSchedules = schedules.filter((schedule) => {
          const visibility = (schedule.visible || schedule.visibility || '').toLowerCase();
          return visibility === 'public';
        });
        setSelectedSchedules(publicSchedules);
      }
    } catch (error) {
      console.error('Failed to load user details', error);
    } finally {
      setSelectedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!needsLogin) {
      loadUsers();
      loadFollowing();
    }
  }, [needsLogin, loadUsers, loadFollowing]);

  useEffect(() => {
    if (needsLogin) return;

    if (!selectedUser && users.length > 0) {
      setSelectedUser(users[0]);
      loadUserDetails(users[0]);
      return;
    }

    if (selectedUser) {
      const selectedId = getUserId(selectedUser);
      const exists = users.some((user) => getUserId(user) === selectedId);
      if (!exists && users.length > 0) {
        setSelectedUser(users[0]);
        loadUserDetails(users[0]);
      }
    }
  }, [users, selectedUser, loadUserDetails, needsLogin]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    loadUserDetails(user);
  };

  const handleFollowToggle = async (user) => {
    const targetId = getUserId(user);
    const followerId = getUserId(sessionUser);
    if (!targetId || !followerId || followerId === targetId || !localStorage.getItem('userToken')) {
      setNeedsLogin(true);
      return;
    }

    setFollowLoading((prev) => ({ ...prev, [targetId]: true }));
    try {
      if (followIds.has(targetId)) {
        await friendsAPI.unfollowUser(followerId, targetId);
        setFollowIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } else {
        await friendsAPI.followUser(followerId, targetId);
        setFollowIds((prev) => new Set(prev).add(targetId));
      }

      if (selectedUser && getUserId(selectedUser) === targetId) {
        loadUserDetails(user);
      }
    } catch (error) {
      console.error('Failed to update follow status', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setNeedsLogin(true);
      }
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const handleOpenChat = (user) => {
    if (!sessionUser || !localStorage.getItem('userToken')) {
      setNeedsLogin(true);
      return;
    }
    setChatUser(user);
  };

  const handleCloseChat = () => {
    setChatUser(null);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const term = searchQuery.toLowerCase();
    return users.filter((user) => {
      const name = user.name || '';
      const username = user.userName || '';
      return name.toLowerCase().includes(term) || username.toLowerCase().includes(term);
    });
  }, [users, searchQuery]);

  if (needsLogin) {
    return (
      <div className="friends-section">
        <div className="friends-login-card">
          <h3>Login Required</h3>
          <p>Sign in with your Zypsii account to explore users, follow them, and start conversations.</p>
          <GoogleLoginButton variant="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="friends-section">
      <div className="friends-layout">
        <aside className="friends-list-panel">
          <header className="friends-list-header">
            <FaUsers />
            <h3>Users</h3>
            <button className="refresh-button" onClick={loadUsers} title="Refresh">
              <IoMdRefresh />
            </button>
          </header>
          {loadingUsers ? (
            <div className="friends-placeholder">Loading users…</div>
          ) : usersError ? (
            <div className="friends-error">{usersError}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="friends-placeholder">No users found.</div>
          ) : (
            <ul className="friends-list">
              {filteredUsers.map((user) => {
                const userId = getUserId(user);
                const isFollowing = followIds.has(userId);
                const isSelected = selectedUser && getUserId(selectedUser) === userId;
                const loading = followLoading[userId];
                const isSelf = getUserId(sessionUser) === userId;
                return (
                  <li
                    key={userId}
                    className={`friends-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="friends-avatar">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} />
                      ) : (
                        <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div className="friends-info">
                      <div className="friends-name">{user.name}</div>
                      <div className="friends-last-message">
                        @{user.userName || 'zypsii_traveler'}
                      </div>
                    </div>
                    <div className="friends-actions">
                      {!isSelf && (
                        <button
                          className={`follow-toggle ${isFollowing ? 'following' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowToggle(user);
                          }}
                          disabled={loading}
                        >
                          {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                      {isFollowing && (
                        <button
                          className="message-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(user);
                          }}
                          title="Message"
                        >
                          <FaCommentDots />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="friends-detail-panel">
          {!selectedUser ? (
            <div className="friends-detail-placeholder">
              Select a user to view their profile and public schedules.
            </div>
          ) : (
            <FriendDetailView
              user={selectedUser}
              stats={selectedStats}
              schedules={selectedSchedules}
              loading={selectedLoading}
              isFollowing={followIds.has(getUserId(selectedUser))}
              onFollowToggle={() => handleFollowToggle(selectedUser)}
              followLoading={followLoading[getUserId(selectedUser)]}
              onMessage={() => handleOpenChat(selectedUser)}
              canMessage={followIds.has(getUserId(selectedUser))}
            />
          )}
        </section>
      </div>

      {chatUser && sessionUser && followIds.has(getUserId(chatUser)) && (
        <FriendChatPanel
          key={getUserId(chatUser)}
          user={chatUser}
          currentUser={sessionUser}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

export default UsersSection;

