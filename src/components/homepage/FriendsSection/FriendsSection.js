import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { friendsAPI, scheduleAPI } from '../../../services/api';
import { FaUserFriends, FaCommentDots, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { IoMdRefresh } from 'react-icons/io';
import moment from 'moment';
import io from 'socket.io-client';
import GoogleLoginButton from '../../auth/GoogleLoginButton';
import ScheduleDetailsModal from '../../homepage/ScheduleDetailsModal';
import './FriendsSection.css';

export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://zypsii.com';

export const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to parse stored user', error);
    return null;
  }
};

export const getUserId = (user) => {
  if (!user) return null;
  if (typeof user === 'string') return user;
  if (user._id) return user._id;
  if (user.userId) return user.userId;
  if (user.id) return user.id;
  return null;
};

const FriendsSection = ({ searchQuery = '' }) => {
  const [sessionUser, setSessionUser] = useState(getCurrentUser());
  const [needsLogin, setNeedsLogin] = useState(() => {
    const user = getCurrentUser();
    const token = localStorage.getItem('userToken');
    return !(user && token);
  });
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedStats, setSelectedStats] = useState({ followers: 0, following: 0 });
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

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const term = searchQuery.toLowerCase();
    return members.filter((member) => {
      const name = member.name || member.userName || '';
      return name.toLowerCase().includes(term);
    });
  }, [members, searchQuery]);

  const loadMembers = useCallback(async () => {
    const user = getCurrentUser();
    const token = localStorage.getItem('userToken');
    if (!user || !token) {
      setNeedsLogin(true);
      setMembers([]);
      setLoadingMembers(false);
      setMembersError('Please sign in to view your friends list.');
      return;
    }

    try {
      setLoadingMembers(true);
      setMembersError(null);
      const response = await friendsAPI.getChatMembers();
      const data = response?.data;

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to load friends');
      }

      const transformed = (data.data || []).map((item) => ({
        id: getUserId(item.userId || item._id || item),
        name: item.userName?.split('_ZY_')[0] || item.userName || 'Unknown User',
        userName: item.userName || '',
        profilePicture: item.profilePicture || null,
        lastMessage: item.lastMessage || 'Start a conversation',
        lastMessageSenderId: item.lastMessageSenderId,
        lastMessageTime: item.lastMessageTime ? item.lastMessageTime : null,
      }));

      setMembers(transformed);
      setNeedsLogin(false);
    } catch (error) {
      console.error('Failed to load friends list:', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setMembersError('Please sign in to view your friends list.');
      } else {
        setMembersError(error.message || 'Failed to load friends');
      }
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setNeedsLogin(true);
      }
    } finally {
      setLoadingMembers(false);
    }
  }, []);

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
        const ids = data.following
          .map((entry) => getUserId(entry.followingId || entry));
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
    setSelectedStats({ followers: 0, following: 0 });

    try {
      const [followersRes, followingRes, schedulesRes] = await Promise.allSettled([
        friendsAPI.getFollowers(userId),
        friendsAPI.getFollowing(userId),
        scheduleAPI.getSchedules('my', userId),
      ]);

      if (followersRes.status === 'fulfilled') {
        const data = followersRes.value?.data;
        const count = data?.followersCount ?? (data?.followers?.length ?? 0);
        setSelectedStats((prev) => ({ ...prev, followers: count }));
      }

      if (followingRes.status === 'fulfilled') {
        const data = followingRes.value?.data;
        const count = data?.followingCount ?? (data?.following?.length ?? 0);
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
      loadMembers();
      loadFollowing();
    }
  }, [loadMembers, loadFollowing, needsLogin]);

  useEffect(() => {
    if (needsLogin) {
      return;
    }

    if (filteredMembers.length > 0 && !selectedUser) {
      setSelectedUser(filteredMembers[0]);
      loadUserDetails(filteredMembers[0]);
    } else if (selectedUser) {
      // Ensure selected user is still in filtered list
      const stillExists = filteredMembers.some((user) => getUserId(user) === getUserId(selectedUser));
      if (!stillExists && filteredMembers.length > 0) {
        setSelectedUser(filteredMembers[0]);
        loadUserDetails(filteredMembers[0]);
      }
    }
  }, [filteredMembers, selectedUser, loadUserDetails, needsLogin]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    loadUserDetails(user);
  };

  const handleFollowToggle = async (user) => {
    const targetId = getUserId(user);
    const followerId = getUserId(sessionUser);
    if (!targetId || !followerId || !localStorage.getItem('userToken')) {
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
      // refresh counts if current selected user
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

  if (needsLogin) {
    return (
      <div className="friends-section">
        <div className="friends-login-card">
          <h3>Login Required</h3>
          <p>Sign in with your Zypsii account to view friends, follow users, and chat.</p>
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
            <FaUserFriends />
            <h3>Friends</h3>
            <button className="refresh-button" onClick={loadMembers} title="Refresh">
              <IoMdRefresh />
            </button>
          </header>
          {loadingMembers ? (
            <div className="friends-placeholder">Loading friends…</div>
          ) : membersError ? (
            <div className="friends-error">{membersError}</div>
          ) : filteredMembers.length === 0 ? (
            <div className="friends-placeholder">No users found.</div>
          ) : (
            <ul className="friends-list">
              {filteredMembers.map((member) => {
                const userId = getUserId(member);
                const isFollowing = followIds.has(userId);
                const isSelected = selectedUser && getUserId(selectedUser) === userId;
                const loading = followLoading[userId];
                return (
                  <li
                    key={userId}
                    className={`friends-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectUser(member)}
                  >
                    <div className="friends-avatar">
                      {member.profilePicture ? (
                        <img src={member.profilePicture} alt={member.name} />
                      ) : (
                        <span>{member.name?.charAt(0).toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div className="friends-info">
                      <div className="friends-name">{member.name}</div>
                      <div className="friends-last-message">
                        {member.lastMessageTime
                          ? `${member.lastMessage} · ${moment(member.lastMessageTime).fromNow()}`
                          : member.lastMessage}
                      </div>
                    </div>
                    <div className="friends-actions">
                      <button
                        className={`follow-toggle ${isFollowing ? 'following' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(member);
                        }}
                        disabled={loading}
                      >
                        {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
                      </button>
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
              canMessage={false}
            />
          )}
        </section>
      </div>

      {chatUser && sessionUser && (
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

export const FriendDetailView = ({
  user,
  stats,
  schedules,
  loading,
  isFollowing,
  onFollowToggle,
  followLoading,
  onMessage,
  canMessage = true,
}) => {
  const userId = getUserId(user);
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setShowScheduleDetails(true);
  };

  const handleCloseSchedule = () => {
    setShowScheduleDetails(false);
    setSelectedSchedule(null);
  };

  return (
    <div className="friend-detail">
      <div className="friend-detail-header">
        <div className="friend-detail-avatar">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.name} />
          ) : (
            <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>
          )}
        </div>
        <div className="friend-detail-meta">
          <h2>{user.name || user.userName}</h2>
          <p className="friend-username">@{user.userName}</p>
          <div className="friend-stats">
            <span><strong>{stats.followers}</strong> Followers</span>
            <span><strong>{stats.following}</strong> Following</span>
          </div>
          <div className="friend-detail-actions">
            <button
              className={`follow-toggle ${isFollowing ? 'following' : ''}`}
              onClick={onFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>
            {canMessage && (
              <button className="message-button primary" onClick={onMessage}>
                <FaCommentDots />
                <span>Message</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="friend-detail-content">
        <h3>Public Schedules</h3>
        {loading ? (
          <div className="friends-placeholder">Loading schedules…</div>
        ) : schedules.length === 0 ? (
          <div className="friends-placeholder">No public schedules yet.</div>
        ) : (
          <div className="friend-schedule-grid">
            {schedules.map((schedule) => (
              <div
                key={schedule._id || schedule.id}
                className="friend-schedule-card"
                onClick={() => handleScheduleClick(schedule)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleScheduleClick(schedule);
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

      {showScheduleDetails && selectedSchedule && (
        <ScheduleDetailsModal
          schedule={selectedSchedule}
          onClose={handleCloseSchedule}
        />
      )}
    </div>
  );
};

export const FriendChatPanel = ({ user, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const userId = getUserId(user);
  const currentUserId = getUserId(currentUser);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token || !userId || !currentUserId) {
      setLoading(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit('join-chat-room', { senderId: currentUserId, receiverId: userId });
      socket.emit('mark-as-read', { senderId: currentUserId, receiverId: userId });
      socket.emit('chat-history', { senderId: currentUserId, receiverId: userId });
    };

    socket.on('connect', () => {
      setConnected(true);
      joinRoom();
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error', err);
    });

    socket.on('chat-history-result', (history) => {
      if (Array.isArray(history)) {
        setMessages(history);
      } else {
        setMessages([]);
      }
      setLoading(false);
      scrollToBottom();
    });

    socket.on('receive-message', (message) => {
      if (!message) return;
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socket.on('chat-history-error', (error) => {
      console.error('Chat history error', error);
      setLoading(false);
    });

    return () => {
      socket.emit('leave-chat-room', { senderId: currentUserId, receiverId: userId });
      socket.disconnect();
    };
  }, [userId, currentUserId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !socketRef.current || sending || !connected) return;

    setSending(true);
    socketRef.current.emit('send-message', {
      senderId: currentUserId,
      receiverId: userId,
      message: text,
    });

    setMessages((prev) => [
      ...prev,
      {
        _id: `local-${Date.now()}`,
        message: text,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput('');
    setSending(false);
  };

  const renderMessage = (message) => {
    const senderId = getUserId(message.sender?._id ? message.sender : message.senderId || message.sender);
    const isOwn = senderId === currentUserId;
    const createdAt = message.createdAt ? moment(message.createdAt) : null;
    return (
      <div key={message._id || message.id || Math.random()} className={`chat-message ${isOwn ? 'own' : ''}`}>
        <div className="chat-message-bubble">
          <p>{message.message}</p>
          {createdAt && <span>{createdAt.fromNow()}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="friends-chat-panel">
      <header className="friends-chat-header">
        <div className="chat-user">
          <div className="chat-avatar">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          <div>
            <h4>{user.name || user.userName}</h4>
            <p>@{user.userName}</p>
          </div>
        </div>
        <button className="chat-close" onClick={onClose} title="Close chat">
          <FaTimes />
        </button>
      </header>

      <div className="friends-chat-body">
        {loading ? (
          <div className="friends-placeholder">Loading conversation…</div>
        ) : messages.length === 0 ? (
          <div className="friends-placeholder">No messages yet. Say hello!</div>
        ) : (
          <div className="chat-messages">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <footer className="friends-chat-footer">
        <input
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button onClick={handleSend} disabled={!input.trim() || sending}>
          <FaPaperPlane />
        </button>
      </footer>
    </div>
  );
};

const formatScheduleDates = (schedule) => {
  const from = schedule.Dates?.from || schedule.dates?.from;
  const to = schedule.Dates?.end || schedule.dates?.end;
  if (!from && !to) return 'N/A';
  const fromDate = from ? new Date(from).toLocaleDateString() : 'N/A';
  const toDate = to ? new Date(to).toLocaleDateString() : 'N/A';
  return `${fromDate} – ${toDate}`;
};

export default FriendsSection;

