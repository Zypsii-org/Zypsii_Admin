import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Text,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import SwiperFlatList from 'react-native-swiper-flatlist';
import Video from 'react-native-video';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { TextDefault } from '../../components';
import { colors } from '../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url, socket_url } from '../../utils/base_url';
import FollowButton from '../../components/Follow/FollowButton';
import io from 'socket.io-client';
import { useToast } from '../../context/ToastContext';

const { height, width } = Dimensions.get('window');

function ShortsScreen({ route, navigation }) {
  const { showToast } = useToast();
  const [all_shorts, setAllShorts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [selectedShort, setSelectedShort] = useState(null);
  const [likes, setLikes] = useState({});
  const [isLiking, setIsLiking] = useState({});
  const [shareCounts, setShareCounts] = useState({});
  const socketRef = useRef(null);
  const isRoomJoined = useRef({});
  const isCommentRoomJoined = useRef({});
  const isShareRoomJoined = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const videoRefs = useRef({});
  // Add ref to store previous state for error handling (like Post.js)
  const previousStateRef = useRef({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  // Get navigation parameters
  const { initialVideo, userShorts, currentIndex: initialIndex } = route?.params || {};

  const fetchShorts = async () => {
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // Fetch shorts
      const shortsResponse = await fetch(`${base_url}/shorts/listing`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!shortsResponse.ok) {
        throw new Error(`API request failed with status ${shortsResponse.status}`);
      }

      const shortsData = await shortsResponse.json();

      if (shortsData.status && Array.isArray(shortsData.data)) {
        const shortsList = shortsData.data.map(short => {
          return {
            _id: short._id,
            type: 'short',
            title: short.title || short.videoTitle || short.name || '',
            description: short.description || short.videoDescription || short.caption || '',
            videoUrl: short.videoUrl,
            thumbnailUrl: short.thumbnailUrl,
            createdBy: {
              _id: short.createdBy?._id || short.createdBy,
              username: short.createdBy?.userName || short.createdBy?.username || 'User',
              fullName: short.createdBy?.fullName || short.createdBy?.name || 'User',
              profilePicture: short.createdBy?.profilePicture || short.createdBy?.profileImage || 'https://via.placeholder.com/40'
            },
            viewsCount: short.viewsCount || 0,
            likesCount: short.likesCount || 0,
            commentsCount: short.commentsCount || 0,
            shareCount: short.shareCount || 0,
            createdAt: short.createdAt,
            updatedAt: short.updatedAt
          };
        });
        
        // Filter only mp4 videos and ensure valid IDs
        const mp4ShortsList = shortsList.filter(
          item => 
            typeof item.videoUrl === 'string' && 
            item.videoUrl.toLowerCase().endsWith('.mp4') &&
            item._id && 
            item._id !== 'undefined' && 
            item._id !== 'null'
        );
        setAllShorts(mp4ShortsList);
      } else {
        setAllShorts([]);
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
      setAllShorts([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // If we have user shorts from navigation, use them
    if (userShorts && userShorts.length > 0) {
      setAllShorts(userShorts);
      setIsLoading(false);
      if (initialIndex !== undefined) {
        setCurrentIndex(initialIndex);
      }
    } else {
      // Otherwise fetch all shorts
      fetchShorts();
    }

    const getCurrentUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem('user');
        if (userId) {
          const userData = JSON.parse(userId);
          setCurrentUserId(userData._id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    getCurrentUserId();

    // Initialize socket connection
    if (!socketRef.current) {
      socketRef.current = io(socket_url);

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
        setupSocketListeners();
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    return () => {
      cleanupVideoRefs();
      if (socketRef.current) {
        // Leave all rooms
        Object.keys(isRoomJoined.current).forEach(shortId => {
          leaveLikeRoom(shortId);
        });
        Object.keys(isCommentRoomJoined.current).forEach(shortId => {
          leaveCommentRoom(shortId);
        });
        if (isShareRoomJoined.current) {
          leaveShareRoom();
        }
        socketRef.current.removeAllListeners();
      }
    };
  }, [userShorts, initialIndex]);

  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    // Like-related listeners
    socketRef.current.on('join-like-room-status', (data) => {
      console.log(`Short ${data.moduleId} - Join room status:`, data);
      if (data.moduleId) {
        isRoomJoined.current[data.moduleId] = true;
        requestLikeCount(data.moduleId);
      }
    });

    socketRef.current.on('leave-like-room-status', (data) => {
      console.log(`Short ${data.moduleId} - Leave room status:`, data);
      if (data.moduleId) {
        isRoomJoined.current[data.moduleId] = false;
      }
    });

    socketRef.current.on('like-count-status', (data) => {
      if (data.moduleId) {
        console.log(`Short ${data.moduleId} - Like count updated:`, data.likeCount);
        setAllShorts(prevShorts => 
          prevShorts.map(short => 
            short._id === data.moduleId 
              ? { ...short, likesCount: data.likeCount }
              : short
          )
        );
      }
    });

    socketRef.current.on('like-status', (data) => {
      if (data.moduleId) {
        console.log(`Short ${data.moduleId} - Like status response:`, data);
        if (data.liked !== undefined) {
          setLikes(prev => ({
            ...prev,
            [data.moduleId]: data.liked
          }));
        } else if (data.message) {
          if (data.message.includes('liked')) {
            setLikes(prev => ({
              ...prev,
              [data.moduleId]: true
            }));
          } else if (data.message.includes('unliked')) {
            setLikes(prev => ({
              ...prev,
              [data.moduleId]: false
            }));
          }
        }
        setIsLiking(prev => ({
          ...prev,
          [data.moduleId]: false
        }));
        console.log(`Short ${data.moduleId} - Like status updated: like=${data.liked}, isLiking=false`);
        // Request updated like count after a short delay
        setTimeout(() => {
          requestLikeCount(data.moduleId);
        }, 100);
      }
    });

    // Add missing unlike-status listener (like Post.js)
    socketRef.current.on('unlike-status', (data) => {
      if (data.moduleId) {
        console.log(`Short ${data.moduleId} - Unlike status response:`, data);
        if (data.liked !== undefined) {
          setLikes(prev => ({
            ...prev,
            [data.moduleId]: data.liked
          }));
        } else if (data.message && data.message.includes('unliked')) {
          setLikes(prev => ({
            ...prev,
            [data.moduleId]: false
          }));
        }
        setIsLiking(prev => ({
          ...prev,
          [data.moduleId]: false
        }));
        console.log(`Short ${data.moduleId} - Unlike status updated: like=${data.liked}, isLiking=false`);
        // Request updated like count after a short delay
        setTimeout(() => {
          requestLikeCount(data.moduleId);
        }, 100);
      }
    });

    // Add error listeners (like Post.js)
    socketRef.current.on('like-error', (error) => {
      console.error('Like error:', error);
      showToast('Failed to like short', 'error');
      // Revert optimistic update on error - revert to previous state
      if (error.moduleId && previousStateRef.current[error.moduleId]) {
        setLikes(prev => ({
          ...prev,
          [error.moduleId]: previousStateRef.current[error.moduleId].like
        }));
        setAllShorts(prevShorts => 
          prevShorts.map(short => 
            short._id === error.moduleId 
              ? { ...short, likesCount: previousStateRef.current[error.moduleId].count }
              : short
          )
        );
        setIsLiking(prev => ({
          ...prev,
          [error.moduleId]: false
        }));
        console.log(`Short ${error.moduleId} - Like error handled: reverted to like=${previousStateRef.current[error.moduleId].like}, isLiking=false`);
      }
    });

    socketRef.current.on('unlike-error', (error) => {
      console.error('Unlike error:', error);
      showToast('Failed to unlike short', 'error');
      // Revert optimistic update on error - revert to previous state
      if (error.moduleId && previousStateRef.current[error.moduleId]) {
        setLikes(prev => ({
          ...prev,
          [error.moduleId]: previousStateRef.current[error.moduleId].like
        }));
        setAllShorts(prevShorts => 
          prevShorts.map(short => 
            short._id === error.moduleId 
              ? { ...short, likesCount: previousStateRef.current[error.moduleId].count }
              : short
          )
        );
        setIsLiking(prev => ({
          ...prev,
          [error.moduleId]: false
        }));
        console.log(`Short ${error.moduleId} - Unlike error handled: reverted to like=${previousStateRef.current[error.moduleId].like}, isLiking=false`);
      }
    });

    socketRef.current.on('like-count-error', (error) => {
      console.error('Like count error:', error);
      // Don't show toast for count errors as they're less critical
    });

    socketRef.current.on('check-like-status-error', (error) => {
      console.error('Check like status error:', error);
      // Don't show toast for status check errors as they're less critical
    });

    // Add check-like-status response listener
    socketRef.current.on('check-like-status-response', (data) => {
      if (data.moduleId && data.liked !== undefined) {
        console.log(`Short ${data.moduleId} - Check like status response:`, data);
        setLikes(prev => ({
          ...prev,
          [data.moduleId]: data.liked
        }));
      }
    });

    // Comment-related listeners
    socketRef.current.on('join-comment-room-status', (data) => {
      console.log('Join comment room status:', data);
      if (data.moduleId) {
        isCommentRoomJoined.current[data.moduleId] = true;
      }
    });

    socketRef.current.on('leave-comment-room-status', (data) => {
      console.log('Leave comment room status:', data);
      if (data.moduleId) {
        isCommentRoomJoined.current[data.moduleId] = false;
      }
    });

    socketRef.current.on('comment-status', (data) => {
      console.log('Comment status received:', data);
      if (data.comment) {
        setComments(prevComments => [data.comment, ...prevComments]);
        setCommentText('');
        setIsCommenting(false);
      }
    });

    socketRef.current.on('comment-list', (data) => {
      console.log('Comment list received:', data);
      if (data.comments) {
        setComments(data.comments);
      }
    });

    socketRef.current.on('comment-error', (error) => {
      console.error('Comment error:', error);
      setIsCommenting(false);
      showToast(error.message || 'Failed to add comment', 'error');
    });

    socketRef.current.on('comment-deleted', (data) => {
      console.log('Comment deleted:', data);
      if (data.success) {
        // Remove the deleted comment from the list
        setComments(prevComments => 
          prevComments.filter(comment => comment._id !== data.commentId)
        );
        
        // Update comments count in all_shorts
        setAllShorts(prevShorts => 
          prevShorts.map(short => 
            short._id === selectedShort._id 
              ? { ...short, commentsCount: Math.max((short.commentsCount || 0) - 1, 0) }
              : short
          )
        );

        // Refresh the comment list
        handleListComments(selectedShort._id);
      }
    });

    socketRef.current.on('comment-delete-error', (error) => {
      console.error('Comment delete error:', error);
      showToast(error.message || 'Failed to delete comment', 'error');
    });

    // Share-related listeners
    socketRef.current.on('join-share-room-status', (data) => {
      console.log('Join share room status:', data);
      isShareRoomJoined.current = true;
      if (selectedShort) {
        requestShareCount(selectedShort._id);
      }
    });

    socketRef.current.on('leave-share-room-status', (data) => {
      console.log('Leave share room status:', data);
      isShareRoomJoined.current = false;
    });

    socketRef.current.on('share-count', (data) => {
      console.log('Share count updated:', data);
      if (data.moduleId && data.count !== undefined) {
        setShareCounts(prev => ({
          ...prev,
          [data.moduleId]: data.count
        }));
      }
    });

    socketRef.current.on('share-count-status', (data) => {
      if (data.moduleId && data.count !== undefined) {
        setShareCounts(prev => ({
          ...prev,
          [data.moduleId]: data.count
        }));
      }
    });

    socketRef.current.on('share-error', (error) => {
      console.error('Share error:', error);
      showToast('Failed to share short');
    });

    socketRef.current.on('share-success', (data) => {
      console.log('Share success:', data);
      if (data.moduleId && data.count !== undefined) {
        setShareCounts(prev => ({
          ...prev,
          [data.moduleId]: data.count
        }));
      }
    });
  };

  const joinLikeRoom = (shortId) => {
    if (!shortId || shortId === 'undefined' || shortId === 'null') {
      console.warn('Invalid shortId provided to joinLikeRoom:', shortId);
      return;
    }
    
    if (socketRef.current && !isRoomJoined.current[shortId]) {
      console.log(`Short ${shortId} - Joining like room`);
      socketRef.current.emit('join-like-room', {
        moduleId: shortId,
        moduleType: 'shorts'
      });
    }
  };

  const leaveLikeRoom = (shortId) => {
    if (!shortId || shortId === 'undefined' || shortId === 'null') {
      console.warn('Invalid shortId provided to leaveLikeRoom:', shortId);
      return;
    }
    
    if (socketRef.current && isRoomJoined.current[shortId]) {
      console.log(`Short ${shortId} - Leaving like room`);
      socketRef.current.emit('leave-like-room', {
        moduleId: shortId,
        moduleType: 'shorts'
      });
    }
  };

  const joinCommentRoom = (shortId) => {
    if (!shortId || shortId === 'undefined' || shortId === 'null') {
      console.warn('Invalid shortId provided to joinCommentRoom:', shortId);
      return;
    }
    
    if (socketRef.current && !isCommentRoomJoined.current[shortId]) {
      console.log(`Short ${shortId} - Joining comment room`);
      socketRef.current.emit('join-comment-room', {
        moduleId: shortId,
        moduleType: 'shorts'
      });
    }
  };

  const leaveCommentRoom = (shortId) => {
    if (!shortId || shortId === 'undefined' || shortId === 'null') {
      console.warn('Invalid shortId provided to leaveCommentRoom:', shortId);
      return;
    }
    
    if (socketRef.current && isCommentRoomJoined.current[shortId]) {
      console.log(`Short ${shortId} - Leaving comment room`);
      socketRef.current.emit('leave-comment-room', {
        moduleId: shortId,
        moduleType: 'shorts'
      });
    }
  };

  const joinShareRoom = () => {
    if (socketRef.current && !isShareRoomJoined.current && selectedShort) {
      console.log('Joining share room for short:', selectedShort._id);
      socketRef.current.emit('join-share-room', {
        moduleId: selectedShort._id,
        moduleType: 'shorts',
        senderId: currentUserId,
        receiverId: selectedShort.createdBy._id
      });
    }
  };

  const leaveShareRoom = () => {
    if (socketRef.current && isShareRoomJoined.current && selectedShort) {
      console.log('Leaving share room for short:', selectedShort._id);
      socketRef.current.emit('leave-share-room', {
        moduleId: selectedShort._id,
        moduleType: 'shorts',
        senderId: currentUserId,
        receiverId: selectedShort.createdBy._id
      });
    }
  };

  const requestLikeCount = (shortId) => {
    if (!shortId || shortId === 'undefined' || shortId === 'null') {
      console.warn('Invalid shortId provided to requestLikeCount:', shortId);
      return;
    }
    
    if (socketRef.current) {
      console.log(`Short ${shortId} - Requesting like count`);
      socketRef.current.emit('like-count', {
        moduleType: 'shorts',
        moduleId: shortId
      });
    }
  };

  const requestShareCount = (shortId) => {
    if (!shortId || shortId === 'undefined' || shortId === 'null') {
      console.warn('Invalid shortId provided to requestShareCount:', shortId);
      return;
    }
    
    if (socketRef.current) {
      console.log(`Short ${shortId} - Requesting share count`);
      socketRef.current.emit('share-count', {
        moduleId: shortId,
        moduleType: 'shorts'
      });
    }
  };

  const handleLike = async (short) => {
    if (!currentUserId) {
      showToast('Please login to like shorts', 'error');
      return;
    }

    if (!short || !short._id || short._id === 'undefined' || short._id === 'null') {
      console.error('Invalid short object:', short);
      return;
    }

    if (isLiking[short._id]) {
      console.log('Already processing like/unlike request');
      return;
    }

    console.log(`Short ${short._id} - Starting like/unlike process. Current state: like=${likes[short._id]}, isLiking=${isLiking[short._id]}`);

    try {
      setIsLiking(prev => ({ ...prev, [short._id]: true }));
      
      // Store current state for potential rollback
      const currentLikeState = likes[short._id];
      const currentLikeCount = all_shorts.find(s => s._id === short._id)?.likesCount || 0;
      
      // Store these in refs for error handling
      previousStateRef.current[short._id] = { like: currentLikeState, count: currentLikeCount };
      
      // Get the correct createdBy ID
      const moduleCreatedBy = short.createdBy?._id || short.createdBy;
      
      if (!moduleCreatedBy) {
        console.error('No moduleCreatedBy found for short:', short._id);
        showToast('Short data is invalid', 'error');
        setIsLiking(prev => ({ ...prev, [short._id]: false }));
        return;
      }
      
      console.log(`Short ${short._id} - Current like state: ${currentLikeState}, changing to: ${!currentLikeState}`);
      
      // Optimistic update - immediately update the UI
      const newLikeState = !likes[short._id];
      setLikes(prev => ({
        ...prev,
        [short._id]: newLikeState
      }));
      setAllShorts(prevShorts => 
        prevShorts.map(s => 
          s._id === short._id 
            ? { ...s, likesCount: newLikeState ? (s.likesCount || 0) + 1 : Math.max((s.likesCount || 0) - 1, 0) }
            : s
        )
      );

      const payload = {
        likedBy: currentUserId,
        moduleType: 'shorts',
        moduleId: short._id,
        moduleCreatedBy: moduleCreatedBy
      };

      if (currentLikeState) {
        // Currently liked, so unlike
        console.log(`Short ${short._id} - Sending unlike request`);
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('unlike', payload);
        } else {
          console.log(`Short ${short._id} - Socket not connected, falling back to API`);
          // Fallback to API call if socket is not connected
          await unlikeViaAPI(short);
        }
      } else {
        // Currently not liked, so like
        console.log(`Short ${short._id} - Sending like request`);
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('like', payload);
        } else {
          console.log(`Short ${short._id} - Socket not connected, falling back to API`);
          // Fallback to API call if socket is not connected
          await likeViaAPI(short);
        }
      }

      // Set a timeout to handle cases where socket response doesn't come
      const timeoutId = setTimeout(() => {
        if (isLiking[short._id]) {
          console.log(`Short ${short._id} - Socket response timeout, checking like status via API`);
          checkLikeStatus(short._id);
          setIsLiking(prev => ({ ...prev, [short._id]: false }));
          console.log(`Short ${short._id} - Timeout handled: isLiking=false`);
        }
      }, 3000);

      // Clear timeout when we get a response
      const clearTimeoutOnResponse = () => {
        clearTimeout(timeoutId);
      };

      // Add one-time listeners to clear timeout
      socketRef.current.once('like-status', clearTimeoutOnResponse);
      socketRef.current.once('unlike-status', clearTimeoutOnResponse);
      socketRef.current.once('like-error', clearTimeoutOnResponse);
      socketRef.current.once('unlike-error', clearTimeoutOnResponse);

    } catch (error) {
      console.error('Like/Unlike Error:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
      // Revert optimistic update on error
      if (previousStateRef.current[short._id]) {
        setLikes(prev => ({
          ...prev,
          [short._id]: previousStateRef.current[short._id].like
        }));
        setAllShorts(prevShorts => 
          prevShorts.map(s => 
            s._id === short._id 
              ? { ...s, likesCount: previousStateRef.current[short._id].count }
              : s
          )
        );
      }
      setIsLiking(prev => ({ ...prev, [short._id]: false }));
    }
  };

  const handleComment = (short) => {
    if (!short || !short._id || short._id === 'undefined' || short._id === 'null') {
      console.error('Invalid short object for comment:', short);
      return;
    }
    
    console.log('Opening comment modal for short:', short);
    setSelectedShort(short);
    setShowCommentModal(true);
    joinCommentRoom(short._id);
    handleListComments(short._id);
  };

  const handleCommentSubmit = async () => {
    if (!currentUserId) {
      showToast('Please login to comment', 'error');
      return;
    }

    if (!commentText.trim()) {
      showToast('Comment cannot be empty', 'error');
      return;
    }

    if (isCommenting) {
      return;
    }

    if (!selectedShort || !selectedShort._id || selectedShort._id === 'undefined' || selectedShort._id === 'null') {
      console.error('Invalid selectedShort for comment submission:', selectedShort);
      showToast('Unable to submit comment at this moment', 'error');
      return;
    }

    try {
      setIsCommenting(true);
      console.log('Submitting comment for short:', selectedShort._id);

      const commentPayload = {
        moduleId: selectedShort._id,
        moduleType: 'shorts',
        moduleCreatedBy: selectedShort.createdBy,
        commentedBy: currentUserId,
        commentDataValue: commentText.trim()
      };

      console.log('Sending comment payload:', commentPayload);
      socketRef.current.emit('comment', commentPayload);
      setCommentText('');

      setTimeout(() => {
        if (isCommenting) {
          setIsCommenting(false);
          showToast('Comment submission timed out. Please try again.', 'error');
        }
      }, 5000);

    } catch (error) {
      console.error('Error submitting comment:', error);
      setIsCommenting(false);
      showToast('Failed to submit comment. Please try again.', 'error');
    }
  };

  const handleListComments = (shortId) => {
    if (!shortId || shortId === 'undefined' || shortId === 'null') {
      console.warn('Invalid shortId provided to handleListComments:', shortId);
      return;
    }
    
    if (socketRef.current) {
      console.log('Requesting comments for short:', shortId);
      socketRef.current.emit('list-comment', {
        moduleId: shortId,
        moduleType: 'shorts'
      });
    }
  };

  const handleShare = async (short) => {
    if (!currentUserId) {
      showToast('Please login to share shorts');
      return;
    }
    
    if (!short || !short._id || short._id === 'undefined' || short._id === 'null') {
      console.error('Invalid short object for share:', short);
      return;
    }
    
    setSelectedShort(short);
    setShowShareModal(true);
    await fetchFollowers();
    joinShareRoom();
  };

  const fetchFollowers = async () => {
    try {
      setIsLoadingFollowers(true);
      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        showToast('Authentication token not found', 'error');
        return;
      }

      const response = await fetch(`${base_url}/follow/getFollowers/${currentUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setFollowers(data.followers);
      } else {
        showToast(data.message || 'Failed to fetch followers', 'error');
      }
    } catch (error) {
      console.error('Fetch Followers Error:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const handleShareWithFollower = (follower) => {
    if (!currentUserId || !selectedShort) {
      showToast('Unable to share at this moment');
      return;
    }

    if (!selectedShort._id || selectedShort._id === 'undefined' || selectedShort._id === 'null') {
      console.error('Invalid selectedShort._id for share:', selectedShort._id);
      return;
    }

    if (!follower || !follower._id || follower._id === 'undefined' || follower._id === 'null') {
      console.error('Invalid follower object for share:', follower);
      return;
    }

    socketRef.current.emit('share', {
      moduleId: selectedShort._id,
      moduleType: 'shorts',
      moduleCreatedBy: selectedShort.createdBy._id,
      senderId: currentUserId,
      receiverId: follower._id
    });

    // Optimistically update share count
    setShareCounts(prev => ({
      ...prev,
      [selectedShort._id]: (prev[selectedShort._id] || 0) + 1
    }));

    setShowShareModal(false);
    showToast('Short shared successfully');
    
    // Request updated share count
    setTimeout(() => {
      requestShareCount(selectedShort._id);
    }, 500);
  };

  const renderCommentItem = ({ item: comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <Image
            source={{
              uri: comment.commentedBy?.profilePicture || 'https://via.placeholder.com/40'
            }}
            style={styles.commentUserImage}
          />
          <View style={styles.commentUserDetails}>
            <Text style={styles.commentUser}>
              {comment.commentedBy?.fullName || comment.commentedBy?.username}
            </Text>
            <Text style={styles.commentDate}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {comment.commentedBy?._id === currentUserId && (
          <TouchableOpacity
            onPress={() => handleDeleteComment(comment._id)}
            style={styles.deleteCommentButton}
          >
            <Feather name="trash-2" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.commentText}>{comment.commentData}</Text>
    </View>
  );

  const renderFollowerItem = ({ item: follower }) => (
    <TouchableOpacity
      style={styles.followerItem}
      onPress={() => handleShareWithFollower(follower)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: follower.profilePicture || 'https://via.placeholder.com/50'
        }}
        style={styles.followerImage}
      />
      <View style={styles.followerInfo}>
        <Text style={styles.followerName}>{follower.fullName}</Text>
        <Text style={styles.followerUsername}>@{follower.userName}</Text>
      </View>
      <View style={styles.shareIconContainer}>
        <MaterialCommunityIcons name="share-variant" size={20} color="#ff3873" />
      </View>
    </TouchableOpacity>
  );

  const isValidVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.webm', '.m4v'];
    const isSupportedFormat = videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
    const isHttpUrl = url.startsWith('http');
    const isHttpsUrl = url.startsWith('https');
    return (isSupportedFormat || isHttpUrl || isHttpsUrl) && !url.toLowerCase().endsWith('.3gp');
  };

  const getVideoSource = (videoUrl) => {
    if (!videoUrl) return null;
    if (videoUrl.toLowerCase().endsWith('.3gp')) return null;
    
    if (videoUrl.startsWith('http') || videoUrl.startsWith('https')) {
      return { uri: videoUrl };
    } else if (videoUrl.startsWith('file://')) {
      return { uri: videoUrl };
    } else if (videoUrl.startsWith('data:')) {
      return { uri: videoUrl };
    }
    return null;
  };

  const renderInteractionButtons = (item) => {
    return (
      <View style={styles.interactionButtonsContainer}>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleLike(item)}
          disabled={isLiking[item._id]}
        >
          <AntDesign
            name={likes[item._id] ? 'heart' : 'hearto'}
            size={24}
            color={likes[item._id] ? '#FF0000' : 'white'}
            style={{ opacity: isLiking[item._id] ? 0.5 : 1 }}
          />
          <Text style={styles.interactionCount}>{item.likesCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleComment(item)}
        >
          <Icon name="chatbubble-outline" size={24} color="white" />
          <Text style={styles.interactionCount}>{item.commentsCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleShare(item)}
        >
          <Feather name="navigation" size={24} color="white" />
          <Text style={styles.interactionCount}>{shareCounts[item._id] || item.shareCount || 0}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderShortInfo = (item) => {
    console.log(item,"all_shorts");
    const isDescriptionExpanded = expandedDescriptions[item._id] || false;
    const hasDetails = !!(item.title || item.description);
    
    return (
      <View style={styles.shortInfoContainer}>
        <View style={styles.userInfoContainer}>
          <Image
            source={{
              uri: item.createdBy?.profilePicture || 'https://via.placeholder.com/40'
            }}
            style={styles.userProfileImage}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {item.createdBy?.userName || item.createdBy?.username || 'User'}
            </Text>
          </View>
          {(() => {
            // Extract the actual createdBy ID for comparison
            const getCreatedById = () => {
              if (!item.createdBy) return null;
              if (typeof item.createdBy === 'object' && item.createdBy !== null && item.createdBy._id) {
                return item.createdBy._id;
              }
              return String(item.createdBy);
            };
            
            const createdById = getCreatedById();
            const shouldShowFollowButton = currentUserId && createdById && currentUserId !== createdById;
            
            return shouldShowFollowButton ? (
              <View style={styles.followButtonContainer}>
                <FollowButton userId={item.createdBy?._id} style={styles.followButton} />
              </View>
            ) : null;
          })()}
        </View>
        {hasDetails && (
          <View style={styles.shortDetails}>
            {item.title && (
              <Text style={styles.shortTitle} numberOfLines={1}>
                {item.title}
              </Text>
            )}
            {item.description && (
              <View>
                <Text 
                  style={styles.shortDescription} 
                  numberOfLines={isDescriptionExpanded ? undefined : 3}
                >
                  {item.description}
                </Text>
                {item.description.length > 50 && (
                  <TouchableOpacity 
                    onPress={() => setExpandedDescriptions(prev => ({
                      ...prev,
                      [item._id]: !isDescriptionExpanded
                    }))}
                    style={styles.seeMoreButton}
                  >
                    <Text style={styles.seeMoreText}>
                      {isDescriptionExpanded ? 'See less' : 'See more'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Add checkLikeStatus function
  const checkLikeStatus = async (shortId) => {
    try {
      // Validate shortId before making the API call
      if (!shortId || shortId === 'undefined' || shortId === 'null') {
        console.warn('Invalid shortId provided to checkLikeStatus:', shortId);
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      // Get the correct createdBy ID from the short
      const short = all_shorts.find(s => s._id === shortId);
      const moduleCreatedBy = short?.createdBy?._id || short?.createdBy;
      
      if (!moduleCreatedBy) {
        console.error('No moduleCreatedBy found for short:', shortId);
        return;
      }

      const response = await fetch(`${base_url}/like-status?moduleType=shorts&moduleId=${shortId}&moduleCreatedBy=${moduleCreatedBy}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
   
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`Short ${shortId} - API like status: ${data.data.liked}`);
        setLikes(prev => ({
          ...prev,
          [shortId]: data.data.liked
        }));
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  // Fallback API functions for when socket is not available (like Post.js)
  const likeViaAPI = async (short) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        showToast('Please login to like shorts', 'error');
        return;
      }

      const moduleCreatedBy = short.createdBy?._id || short.createdBy;
      
      const response = await fetch(`${base_url}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          likedBy: currentUserId,
          moduleType: 'shorts',
          moduleId: short._id,
          moduleCreatedBy: moduleCreatedBy
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`Short ${short._id} - API like successful`);
        setLikes(prev => ({
          ...prev,
          [short._id]: true
        }));
        setAllShorts(prevShorts => 
          prevShorts.map(s => 
            s._id === short._id 
              ? { ...s, likesCount: (s.likesCount || 0) + 1 }
              : s
          )
        );
      } else {
        throw new Error(data.message || 'Failed to like short');
      }
    } catch (error) {
      console.error('API like error:', error);
      showToast('Failed to like short', 'error');
      // Revert optimistic update
      if (previousStateRef.current[short._id]) {
        setLikes(prev => ({
          ...prev,
          [short._id]: previousStateRef.current[short._id].like
        }));
        setAllShorts(prevShorts => 
          prevShorts.map(s => 
            s._id === short._id 
              ? { ...s, likesCount: previousStateRef.current[short._id].count }
              : s
          )
        );
      }
    } finally {
      setIsLiking(prev => ({ ...prev, [short._id]: false }));
    }
  };

  const unlikeViaAPI = async (short) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        showToast('Please login to unlike shorts', 'error');
        return;
      }

      const moduleCreatedBy = short.createdBy?._id || short.createdBy;
      
      const response = await fetch(`${base_url}/unlike`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          likedBy: currentUserId,
          moduleType: 'shorts',
          moduleId: short._id,
          moduleCreatedBy: moduleCreatedBy
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`Short ${short._id} - API unlike successful`);
        setLikes(prev => ({
          ...prev,
          [short._id]: false
        }));
        setAllShorts(prevShorts => 
          prevShorts.map(s => 
            s._id === short._id 
              ? { ...s, likesCount: Math.max((s.likesCount || 0) - 1, 0) }
              : s
          )
        );
      } else {
        throw new Error(data.message || 'Failed to unlike short');
      }
    } catch (error) {
      console.error('API unlike error:', error);
      showToast('Failed to unlike short', 'error');
      // Revert optimistic update
      if (previousStateRef.current[short._id]) {
        setLikes(prev => ({
          ...prev,
          [short._id]: previousStateRef.current[short._id].like
        }));
        setAllShorts(prevShorts => 
          prevShorts.map(s => 
            s._id === short._id 
              ? { ...s, likesCount: previousStateRef.current[short._id].count }
              : s
          )
        );
      }
    } finally {
      setIsLiking(prev => ({ ...prev, [short._id]: false }));
    }
  };

  // Safety mechanism to reset isLiking if it gets stuck (like Post.js)
  useEffect(() => {
    Object.keys(isLiking).forEach(shortId => {
      if (isLiking[shortId]) {
        const timeoutId = setTimeout(() => {
          console.log(`Short ${shortId} - Safety timeout: resetting isLiking state`);
          setIsLiking(prev => ({ ...prev, [shortId]: false }));
        }, 5000); // 5 seconds timeout

        return () => clearTimeout(timeoutId);
      }
    });
  }, [isLiking]);

  // Update useEffect to check like status when shorts are loaded
  useEffect(() => {
    if (all_shorts.length > 0 && currentUserId) {
      all_shorts.forEach(short => {
        // Only check like status if short has a valid _id
        if (short._id && short._id !== 'undefined' && short._id !== 'null') {
          checkLikeStatus(short._id);
          // Request share count for each short
          if (socketRef.current) {
            socketRef.current.emit('share-count', {
              moduleId: short._id,
              moduleType: 'shorts'
            });
          }
        } else {
          console.warn('Skipping like status check for short with invalid _id:', short._id);
        }
      });
    }
  }, [all_shorts, currentUserId]);

  // Check like status when current short changes
  useEffect(() => {
    if (all_shorts.length > 0 && currentUserId && currentIndex < all_shorts.length) {
      const currentShort = all_shorts[currentIndex];
      if (currentShort && currentShort._id && currentShort._id !== 'undefined' && currentShort._id !== 'null') {
        console.log(`Short ${currentShort._id} - Checking initial like status`);
        if (socketRef.current) {
          socketRef.current.emit('check-like-status', {
            moduleId: currentShort._id,
            moduleType: 'shorts',
            userId: currentUserId
          });
          // Request share count for current short
          socketRef.current.emit('share-count', {
            moduleId: currentShort._id,
            moduleType: 'shorts'
          });
        }
        checkLikeStatus(currentShort._id);
        
        // Join like room for current short
        if (!isRoomJoined.current[currentShort._id]) {
          joinLikeRoom(currentShort._id);
        }
      } else {
        console.warn('Current short has invalid _id:', currentShort?._id);
      }
    }
  }, [currentIndex, currentUserId, all_shorts]);

  // Handle short visibility changes for room management
  useEffect(() => {
    if (all_shorts.length > 0 && currentIndex < all_shorts.length) {
      const currentShort = all_shorts[currentIndex];
      if (currentShort && currentShort._id && currentShort._id !== 'undefined' && currentShort._id !== 'null') {
        // Join like room for current short
        if (!isRoomJoined.current[currentShort._id]) {
          joinLikeRoom(currentShort._id);
        }
        
        // Leave like rooms for other shorts
        all_shorts.forEach((short, index) => {
          if (index !== currentIndex && short._id && short._id !== 'undefined' && short._id !== 'null' && isRoomJoined.current[short._id]) {
            leaveLikeRoom(short._id);
          }
        });
      } else {
        console.warn('Current short has invalid _id for room management:', currentShort?._id);
      }
    }
  }, [currentIndex, all_shorts]);

  // Update handleDeleteComment to match Post.js implementation
  const handleDeleteComment = (commentId) => {
    if (!currentUserId) {
      showToast('Please login to delete comments', 'error');
      return;
    }

    if (!commentId || commentId === 'undefined' || commentId === 'null') {
      console.error('Invalid commentId for delete:', commentId);
      return;
    }

    if (!selectedShort || !selectedShort._id || selectedShort._id === 'undefined' || selectedShort._id === 'null') {
      console.error('Invalid selectedShort for delete comment:', selectedShort);
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (socketRef.current) {
              console.log('Deleting comment:', commentId);
              socketRef.current.emit('delete-comment', {
                commentId,
                commentedBy: currentUserId,
                moduleId: selectedShort._id,
                moduleType: 'shorts'
              });
            }
          }
        }
      ]
    );
  };

  const handleChangeIndex = ({ index }) => {
    // Stop all videos first
    Object.values(videoRefs.current).forEach(ref => {
      if (ref && typeof ref.setNativeProps === 'function') {
        ref.setNativeProps({ paused: true });
      }
    });
    
    // Set the new index
    setCurrentIndex(index);
  };

  // Add cleanup function for video refs
  const cleanupVideoRefs = () => {
    Object.values(videoRefs.current).forEach(ref => {
      if (ref && typeof ref.setNativeProps === 'function') {
        ref.setNativeProps({ paused: true });
      }
    });
    videoRefs.current = {};
  };

  // Add a function to handle video playback
  const handleVideoPlayback = (ref, shouldPlay) => {
    if (ref && typeof ref.setNativeProps === 'function') {
      ref.setNativeProps({ paused: !shouldPlay });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.btncolor} />
      </View>
    );
  }

  if (!all_shorts || all_shorts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="videocam-outline" size={48} color={colors.fontSecondColor} />
        <TextDefault textColor={colors.fontMainColor} H5 style={{ marginTop: 10 }}>
          No shorts available
        </TextDefault>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SwiperFlatList
        data={all_shorts}
        keyExtractor={(item) => item._id}
        vertical
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        onChangeIndex={handleChangeIndex}
        index={currentIndex}
        renderItem={({ item, index }) => {
          // Handle different data structures
          const videoUrl = item.videoUrl || item.video;
          const title = item.title || item.videoTitle;
          const description = item.description;
          const thumbnailUrl = item.thumbnailUrl || item.videoImage;
          const viewsCount = item.viewsCount || item.views || 0;
          const likesCount = item.likesCount || item.likes || 0;
          const commentsCount = item.commentsCount || item.comments || 0;
          const createdBy = item.createdBy;
          const shortId = item._id || item.id;
          
          const videoSource = getVideoSource(videoUrl);
          const isValidVideo = isValidVideoUrl(videoUrl);
          const isCurrentVideo = currentIndex === index;
          
          return (
            <View style={styles.shortItemContainer}>
              <View style={styles.videoContainer}>
                {isValidVideo && videoSource ? (
                  <View style={styles.videoWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setMuted(!muted)}
                      style={styles.videoTouchable}
                    >
                      <Video
                        ref={(ref) => {
                          if (ref) {
                            videoRefs.current[shortId] = ref;
                            handleVideoPlayback(ref, isCurrentVideo);
                          }
                        }}
                        source={videoSource}
                        style={styles.videoPlayer}
                        resizeMode="contain"
                        repeat={true}
                        paused={!isCurrentVideo}
                        muted={muted}
                        onBuffer={(buffer) => console.log('buffering', buffer)}
                        onError={(error) => console.log('error', error)}
                        onLoad={() => {
                          const ref = videoRefs.current[shortId];
                          if (ref) {
                            handleVideoPlayback(ref, isCurrentVideo);
                          }
                        }}
                      />
                    </TouchableOpacity>
                    {muted && (
                      <Icon
                        name="volume-mute"
                        style={styles.muteIcon}
                        size={20}
                        color="white"
                      />
                    )}
                  </View>
                ) : (
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle-outline" size={48} color={colors.fontSecondColor} />
                    <TextDefault textColor={colors.fontMainColor} H5 style={{ marginTop: 10 }}>
                      Invalid video format
                    </TextDefault>
                  </View>
                )}

                {renderShortInfo({ ...item, title, description, viewsCount, likesCount, commentsCount, createdBy, _id: shortId })}
                {renderInteractionButtons({ ...item, title, description, viewsCount, likesCount, commentsCount, createdBy, _id: shortId })}
              </View>
            </View>
          );
        }}
      />

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCommentModal(false)}
          />
          <View style={styles.commentModalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.commentModalContent}>
              <View style={styles.commentInputContainer}>
                <TextInput
                  placeholder="Add a comment..."
                  style={styles.commentInput}
                  multiline
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={500}
                  editable={!isCommenting}
                />
                <TouchableOpacity
                  style={[
                    styles.commentSubmitButton,
                    { 
                      opacity: commentText.trim() && !isCommenting ? 1 : 0.5,
                      backgroundColor: isCommenting ? '#ccc' : '#ff3873'
                    }
                  ]}
                  onPress={handleCommentSubmit}
                  disabled={isCommenting || !commentText.trim()}
                >
                  <Text style={styles.commentSubmitText}>
                    {isCommenting ? 'Posting...' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={comments}
                keyExtractor={(comment) => comment._id}
                renderItem={renderCommentItem}
                style={styles.commentsList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowShareModal(false);
          leaveShareRoom();
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowShareModal(false);
              leaveShareRoom();
            }}
          />
          <View style={styles.shareModalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.shareModalTitle}>Share with followers</Text>
            {isLoadingFollowers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff3873" />
              </View>
            ) : followers.length === 0 ? (
              <View style={styles.emptyFollowersContainer}>
                <Text style={styles.emptyFollowersText}>No followers to share with.</Text>
              </View>
            ) : (
              <FlatList
                data={followers}
                keyExtractor={(item) => item._id}
                renderItem={renderFollowerItem}
                style={styles.followersList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  shortItemContainer: {
    width: width,
    height: height,
    backgroundColor: colors.black,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.black,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.black,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  interactionButtonsContainer: {
    position: 'absolute',
    right: 10,
    bottom: 100,
    alignItems: 'center',
  },
  interactionButton: {
    alignItems: 'center',
    marginVertical: 10,
  },
  interactionCount: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  commentModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '60%',
    maxHeight: '80%',
  },
  commentModalContent: {
    flex: 1,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  commentSubmitButton: {
    backgroundColor: colors.btncolor,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  commentSubmitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  commentText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 50,
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  shareModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: '60%',
    maxHeight: '80%',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  followersList: {
    flex: 1,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  followerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  followerUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyFollowersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFollowersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  shareIconContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  shortInfoContainer: {
    position: 'absolute',
    left: 10,
    top: 40,
    right: 60,
    zIndex: 1,
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    backdropFilter: 'blur(10px)',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 10,
  },
  userProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userDetails: {
    flex: 1,
    marginRight: 10,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  followButtonContainer: {
    marginLeft: 'auto',
  },
  followButton: {
    minWidth: 80,
    height: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  shortDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0,
  },
  shortTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  shortDescription: {
    color: 'white',
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  deleteCommentButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    padding: 5,
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteIcon: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
    zIndex: 1,
  },
  seeMoreButton: {
    marginTop: 5,
  },
  seeMoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ShortsScreen; 