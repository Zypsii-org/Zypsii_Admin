import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, FlatList, Dimensions, Modal, ActivityIndicator ,Alert} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionic from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url, socket_url } from '../../utils/base_url';
import FollowButton from '../Follow/FollowButton';
import io from 'socket.io-client';
import Toast from '../Toast/Toast';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../Auth/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const { width } = Dimensions.get('window');

const Post = ({ item, isFromProfile, onDelete, isVisible }) => {
  const [like, setLike] = useState(false); // Always start with false, socket will update correct state
  const likeRef = useRef(false);
  const likeResolvedRef = useRef(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.max(item.likesCount || 0, 0));
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const socketRef = useRef(null);
  const isRoomJoined = useRef(false);
  const isCommentRoomJoined = useRef(false);
  const [isLiking, setIsLiking] = useState(false);
  const [shareCount, setShareCount] = useState(Math.max(item.shareCount || 0, 0));
  const isShareRoomJoined = useRef(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  // State for current user
  const { user: authUser, loading: authLoading, getCurrentUserId: getAuthUserId } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  // Helper: resolve logged-in user id reliably
  const resolveUserId = () => (authUser?._id || getAuthUserId?.() || currentUserId);
  // State for description expansion
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  // Ref to store previous state for error handling
  const previousStateRef = useRef({ like: false, count: 0 });

  // Safe setter for like count to prevent negative values
  const setSafeLikeCount = (value) => {
    if (typeof value === 'function') {
      setLikeCount(prevCount => Math.max(value(prevCount), 0));
    } else {
      setLikeCount(Math.max(value || 0, 0));
    }
  };

  // Debounced like handler to prevent spam clicks
  const debouncedHandleLike = useRef(null);
  
  useEffect(() => {
    debouncedHandleLike.current = handleLike;
  }, [handleLike]);

  useEffect(() => {
    likeRef.current = like;
    // mark resolved once we have any explicit boolean assignment
    likeResolvedRef.current = true;
  }, [like]);

  const onLikePress = () => {
    if (authLoading) {
      showToast('Loading user data...', 'info');
      return;
    }
    const uid = resolveUserId();
    if (!uid) {
      showToast('Please login to like posts', 'error');
      return;
    }
    
    if (debouncedHandleLike.current && !isLiking) {
      debouncedHandleLike.current();
    }
  };

  // Consolidated user data fetching on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setCurrentUser(userData);
          setCurrentUserId(userData._id);
          setIsUserLoaded(true);
          
          // Check like status after getting user ID
          if (isVisible) {
            setTimeout(() => {
              scheduleCheckLikeStatus();
            }, 300);
          }
        } else {
          setCurrentUserId(null);
          setCurrentUser(null);
          setIsUserLoaded(true); // Still mark as loaded even if no user
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        setCurrentUserId(null);
        setCurrentUser(null);
        setIsUserLoaded(true); // Mark as loaded even on error
      }
    };
    
    fetchUserData();

    // Initialize socket connection if not already connected
    if (!socketRef.current) {
      socketRef.current = io(socket_url);

      // Wait for socket to connect before setting up listeners
      socketRef.current.on('connect', () => {
        setupSocketListeners();
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    return () => {
      if (socketRef.current) {
        if (isRoomJoined.current) {
          leaveLikeRoom();
        }
        if (isCommentRoomJoined.current) {
          leaveCommentRoom();
        }
        if (isShareRoomJoined.current) {
          leaveShareRoom();
        }
        // Remove all listeners
        socketRef.current.removeAllListeners();
      }
    };
  }, []);

  // Handle post visibility changes
  useEffect(() => {
    if (isVisible && !isRoomJoined.current && currentUserId) {
      joinLikeRoom();
      // Small delay to ensure socket room is joined before checking status
      setTimeout(() => {
        scheduleCheckLikeStatus();
      }, 200);
    } else if (!isVisible && isRoomJoined.current) {
      leaveLikeRoom();
    }
  }, [isVisible, currentUserId]);

  // Check like status when component mounts or becomes visible
  useEffect(() => {
    if (isVisible && currentUserId) {
      scheduleCheckLikeStatus();
    }
  }, [isVisible, currentUserId]);

  // When auth completes, verify like status for visible posts
  useEffect(() => {
    if (!authLoading && isVisible) {
      if (!likeResolvedRef.current) {
        scheduleCheckLikeStatus();
      }
    }
  }, [authLoading, isVisible]);

  // When tab/screen is focused, verify like status for visible posts
  useEffect(() => {
    if (isFocused && isVisible) {
      likeResolvedRef.current = false;
      scheduleCheckLikeStatus();
    }
  }, [isFocused, isVisible]);

  // Optimized safety mechanism to reset isLiking if it gets stuck
  useEffect(() => {
    if (isLiking) {
      const timeoutId = setTimeout(() => {
        setIsLiking(false);
      }, 3000); // Reduced to 3 seconds for better UX

      return () => clearTimeout(timeoutId);
    }
  }, [isLiking]);

  // Setup socket listeners
  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    // Like-related listeners
    socketRef.current.on('join-like-room-status', (data) => {
      if (data.moduleId === item._id) {
        isRoomJoined.current = true;
        likeResolvedRef.current = false; // reset resolution on (re)join
        requestLikeCount();
        scheduleCheckLikeStatus();
      }
    });

    socketRef.current.on('leave-like-room-status', (data) => {
      if (data.moduleId === item._id) {
        isRoomJoined.current = false;
        likeResolvedRef.current = false;
      }
    });

    socketRef.current.on('like-count-status', (data) => {
      if (data.moduleId === item._id) {
        (`Post ${item._id} - Like count updated:`, data.likeCount);
        setLikeCount(Math.max(data.likeCount || 0, 0));
        // If we still haven't resolved liked state for UI, ask now
        if (!likeResolvedRef.current) {
          scheduleCheckLikeStatus();
        }
      }
    });

    socketRef.current.on('like-status', (data) => {
      if (data.moduleId === item._id) {
        setIsLiking(false);
        if (data.liked !== undefined && data.liked !== likeRef.current) {
          setLike(data.liked);
          likeRef.current = data.liked;
        }
        requestLikeCount();
      }
    });

    socketRef.current.on('unlike-status', (data) => {
      if (data.moduleId === item._id) {
        setIsLiking(false);
        if (data.liked !== undefined && data.liked !== likeRef.current) {
          setLike(data.liked);
          likeRef.current = data.liked;
        }
        requestLikeCount();
      }
    });

    // Add error listeners
    socketRef.current.on('like-error', (error) => {
      showToast('Failed to like post', 'error');
      // Revert optimistic update on error - revert to previous state
      setLike(previousStateRef.current.like);
      likeRef.current = previousStateRef.current.like;
      setLikeCount(previousStateRef.current.count);
      setIsLiking(false);
    });

    socketRef.current.on('unlike-error', (error) => {
      showToast('Failed to unlike post', 'error');
      // Revert optimistic update on error - revert to previous state
      setLike(previousStateRef.current.like);
      likeRef.current = previousStateRef.current.like;
      setLikeCount(previousStateRef.current.count);
      setIsLiking(false);
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
      if (data.moduleId === item._id) {
        const likedStatus = Boolean(data.liked);
        setLike(likedStatus);
        likeRef.current = likedStatus;
        likeResolvedRef.current = true;
      }
    });

    // Comment-related listeners
    socketRef.current.on('join-comment-room-status', (data) => {
      isCommentRoomJoined.current = true;
    });

    socketRef.current.on('leave-comment-room-status', (data) => {
      isCommentRoomJoined.current = false;
    });

    socketRef.current.on('comment-status', (data) => {
      if (data.comment) {
        setComments(prevComments => [data.comment, ...prevComments]);
        setCommentText('');
        setIsCommenting(false);
      }
    });

    socketRef.current.on('comment-list', (data) => {
      if (data.comments) {
        setComments(data.comments);
      }
    });

    socketRef.current.on('comment-error', (error) => {
      console.error('Comment error:', error);
      setIsCommenting(false);
      showToast('Failed to add comment', 'error');
    });

    socketRef.current.on('comment-deleted', (data) => {
      // Refresh the comment list after successful deletion
      handleListComments();
    });

    socketRef.current.on('comment-delete-error', (error) => {
      console.error('Comment delete error:', error);
      showToast('Failed to delete comment', 'error');
    });

    // Share-related listeners
    socketRef.current.on('join-share-room-status', (data) => {
      if (data.moduleId === item._id) {
        isShareRoomJoined.current = true;
        requestShareCount();
      }
    });

    socketRef.current.on('leave-share-room-status', (data) => {
      if (data.moduleId === item._id) {
        isShareRoomJoined.current = false;
      }
    });

    socketRef.current.on('share-count', (data) => {
      if (data.moduleId === item._id) {
        setShareCount(Math.max(data.count || 0, 0)); // Ensure count is never negative
      }
    });

    socketRef.current.on('share-count-status', (data) => {
      if (data.moduleId === item._id) {
        setShareCount(Math.max(data.count || 0, 0)); // Ensure count is never negative
      }
    });

    socketRef.current.on('share-error', (error) => {
      showToast('Failed to share post', 'error');
    });
  };

  const joinLikeRoom = () => {
    if (socketRef.current && !isRoomJoined.current) {
      socketRef.current.emit('join-like-room', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  const leaveLikeRoom = () => {
    if (socketRef.current && isRoomJoined.current) {
      socketRef.current.emit('leave-like-room', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  const joinCommentRoom = () => {
    if (socketRef.current && !isCommentRoomJoined.current) {
      socketRef.current.emit('join-comment-room', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  const leaveCommentRoom = () => {
    if (socketRef.current && isCommentRoomJoined.current) {
      console.log(`Post ${item._id} - Leaving comment room`);
      socketRef.current.emit('leave-comment-room', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  const requestLikeCount = () => {
    if (socketRef.current) {
      socketRef.current.emit('like-count', {
        moduleType: 'post',
        moduleId: item._id
      });
    }
  };

  // Verify like status with server before acting
  const checkServerLikeStatus = () => new Promise((resolve) => {
    try {
      const uid = resolveUserId();
      if (!socketRef.current?.connected || !uid) {
        // Fallback to client ref if we can't reach server
        resolve(Boolean(likeRef.current));
        return;
      }
      let settled = false;
      const onResponse = (data) => {
        if (data?.moduleId === item._id) {
          settled = true;
          socketRef.current.off('check-like-status-response', onResponse);
          resolve(Boolean(data?.liked));
        }
      };
      socketRef.current.on('check-like-status-response', onResponse);
      socketRef.current.emit('check-like-status', {
        moduleId: item._id,
        moduleType: 'post',
        userId: uid
      });
      // Safety timeout
      setTimeout(() => {
        if (!settled) {
          socketRef.current?.off('check-like-status-response', onResponse);
          resolve(Boolean(likeRef.current));
        }
      }, 700);
    } catch (e) {
      resolve(Boolean(likeRef.current));
    }
  });

  const handleLike = async () => {
    // Enhanced authentication check
    const likedByUserId = resolveUserId();
    if (!likedByUserId) {
      showToast('Please login to like posts', 'error');
      return;
    }

    if (isLiking) {
      return; // Prevent double clicks
    }

    try {
      setIsLiking(true);

      // Ask server for authoritative current liked status
      const wasLiked = await checkServerLikeStatus();
      const action = wasLiked ? 'unlike' : 'like';

      // Store current state for potential rollback
      const currentLikeCount = likeCount;
      previousStateRef.current = { like: wasLiked, count: Math.max(currentLikeCount, 0) };
      
      // Get moduleCreatedBy once
      const moduleCreatedBy = item.createdBy?._id || item.createdBy;
      if (!moduleCreatedBy) {
        showToast('Post data is invalid', 'error');
        setIsLiking(false);
        return;
      }

      // Optimistic update based on server-confirmed status
      const nowLiked = !wasLiked;
      setLike(nowLiked);
      likeRef.current = nowLiked;
      setLikeCount(prevCount => Math.max(nowLiked ? prevCount + 1 : prevCount - 1, 0));

      // Prepare payload once
      const payload = {
        likedBy: likedByUserId,
        moduleType: 'post',
        moduleId: item._id,
        moduleCreatedBy: moduleCreatedBy
      };
      // Send request via socket only (much faster than API)
      if (socketRef.current?.connected) {
        socketRef.current.emit(action, payload);
        
        // Quick timeout for socket response
        setTimeout(() => {
          if (isLiking) {
            setIsLiking(false);
          }
        }, 1500);
      } else {
        // No socket connection - show error and revert
        setLike(previousStateRef.current.like);
        likeRef.current = previousStateRef.current.like;
        setLikeCount(previousStateRef.current.count);
        setIsLiking(false);
        showToast('Connection lost. Please try again.', 'error');
      }

    } catch (error) {
      console.error('Like/Unlike Error:', error);
      // Quick revert on error
      setLike(previousStateRef.current.like);
      likeRef.current = previousStateRef.current.like;
      setLikeCount(previousStateRef.current.count);
      setIsLiking(false);
      showToast('Failed to update like', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setShowMenu(false);
      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        showToast('Authentication token not found', 'error');
        return;
      }

      const response = await fetch(`${base_url}/post/delete/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.status) {
        showToast('Post deleted successfully', 'success');
        if (isFromProfile) {
          if (typeof onDelete === 'function') {
            onDelete(item.id);
          }
        }
      } else {
        showToast(data.message || 'Failed to delete post', 'error');
      }
    } catch (error) {
      console.error('Delete Error:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // const handleSavePost = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem('accessToken');

  //     if (!token) {
  //       Alert.alert('Error', 'Authentication token not found');
  //       return;
  //     }

  //     const response = await fetch(`${base_url}/post/save/${item._id}`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     const data = await response.json();
  //     console.log(data)

  //     if (response.ok && data.status) {
  //       setIsSaved(!isSaved);
  //       Alert.alert('Success', isSaved ? 'Post unsaved successfully' : 'Post saved successfully');
  //     } else {
  //       Alert.alert('Error', data.message || 'Failed to save post');
  //     }
  //   } catch (error) {
  //     console.error('Save Error:', error);
  //     Alert.alert('Error', 'Network error. Please check your connection and try again.');
  //   }
  // };

  // const renderImage = ({ item: imageUrl }) => {
  //   let processedUrl = imageUrl;

  //   try {
  //     // If the URL is a stringified array
  //     if (typeof imageUrl === 'string' && imageUrl.startsWith('[')) {
  //       const parsedUrls = JSON.parse(imageUrl);
  //       processedUrl = parsedUrls[0];
  //     }

  //     // Clean up the URL
  //     if (processedUrl.startsWith('/data/')) {
  //       processedUrl = `file://${processedUrl}`;
  //     } else if (processedUrl.includes('file:///data/')) {
  //       processedUrl = processedUrl.replace('file:///', 'file://');
  //     }

  //     console.log('Processed URL:', processedUrl);
  //   } catch (e) {
  //     console.log('Error processing URL:', e);
  //     processedUrl = imageUrl;
  //   }

  //   return (
  //     <View style={styles.postImageContainer}>
  //       <Image
  //         source={{ uri: processedUrl }}
  //         style={styles.postImage}
  //         resizeMode="cover"
  //       />
  //     </View>
  //   );
  // };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString;
    }
  };

  // Render image directly if only one image, else use FlatList
  const hasImages = (item.mediaType === 'image' || item.imageUrl) && item.imageUrl && item.imageUrl.length > 0;
  const isSingleImage = hasImages && item.imageUrl.length === 1;

  // Defensive check for first image URL (now using imageUrl)
  const firstImageUrl =
    Array.isArray(item.imageUrl) && item.imageUrl.length > 0 && typeof item.imageUrl[0] === 'string' && item.imageUrl[0].trim() !== ''
      ? item.imageUrl[0]
      : null;

  // Helper to determine if the profile is locked (private and not owner/follower)
  const isProfileLocked = item?.createdBy?.profileViews === 'private' && currentUserId !== (item.createdBy?._id || item.createdBy);

  // Handle comment modal visibility
  useEffect(() => {
    if (showCommentModal) {
      joinCommentRoom();
      // Load comments when modal opens with a slight delay
      setTimeout(() => {
        handleListComments();
      }, 300);
    } else {
      leaveCommentRoom();
    }
  }, [showCommentModal]);

  // Function to handle comment deletion (add this new function)
  const handleDeleteComment = (commentId) => {
    if (!currentUserId) {
      showToast('Please login to delete comments', 'error');
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
            socketRef.current.emit('delete-comment', {
              commentId,
              commentedBy: currentUserId
            });
          }
        }
      ]
    );
  };

  // Updated comment submission handler
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

    try {
      setIsCommenting(true);

      const commentPayload = {
        moduleId: item._id,
        moduleType: 'post',
        moduleCreatedBy: item.createdBy,
        commentedBy: currentUserId,
        commentDataValue: commentText.trim()
      };

      socketRef.current.emit('comment', commentPayload);

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

  // Updated comment item render (modify the FlatList renderItem in your JSX)
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
              {formatDate(comment.createdAt)}
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

  // Updated comment list handler
  const handleListComments = () => {
    if (socketRef.current && item._id) {
      socketRef.current.emit('list-comment', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  // Add fetchFollowers function
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

  // Add handleShare function
  const handleShare = async () => {
    if (!currentUserId) {
      showToast('Please login to share posts', 'error');
      return;
    }
    setShowShareModal(true);
    await fetchFollowers();
    joinShareRoom();
  };

  // Add joinShareRoom function
  const joinShareRoom = () => {
    if (socketRef.current && !isShareRoomJoined.current) {
      socketRef.current.emit('join-share-room', {
        moduleId: item._id,
        moduleType: 'post',
        senderId: currentUserId,
        receiverId: item.createdBy
      });
    }
  };

  // Add leaveShareRoom function
  const leaveShareRoom = () => {
    if (socketRef.current && isShareRoomJoined.current) {
      socketRef.current.emit('leave-share-room', {
        moduleId: item._id,
        moduleType: 'post',
        senderId: currentUserId,
        receiverId: item.createdBy
      });
    }
  };

  // Add requestShareCount function
  const requestShareCount = () => {
    if (socketRef.current) {
      socketRef.current.emit('share-count', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  // Add handleShareWithFollower function
  const handleShareWithFollower = (follower) => {
    if (!currentUserId) {
      showToast('Please login to share posts', 'error');
      return;
    }

    socketRef.current.emit('share', {
      moduleId: item._id,
      moduleType: 'post',
      moduleCreatedBy: item.createdBy,
      senderId: currentUserId,
      receiverId: follower._id
    });

    setShowShareModal(false);
    showToast('Post shared successfully', 'success');
  };

  // Add renderFollowerItem function
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
 
  const checkLikeStatus = () => {
    const uid = resolveUserId();
    if (!uid || !socketRef.current?.connected) {
      // Do not force change UI state; wait for a proper server response
        return;
      }

    // Use socket to check like status - authoritative
    socketRef.current.emit('check-like-status', {
          moduleId: item._id,
          moduleType: 'post',
      userId: uid
    });
  };

  // Retry scheduler to ensure we do check-like-status once socket/auth are ready
  const scheduleCheckLikeStatus = (retries = 5, delayMs = 250) => {
    const uid = resolveUserId();
    const canSend = uid && socketRef.current?.connected;
    if (canSend) {
      checkLikeStatus();
      return;
    }
    if (retries <= 0) return;
    setTimeout(() => scheduleCheckLikeStatus(retries - 1, delayMs), delayMs);
  };

  // Socket-only approach - much faster than API calls!

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Function to extract user data from item, falling back to currentUser
  const getUserData = () => {
    const createdBy = item.createdBy || {};
    return {
      id: createdBy._id || createdBy || item.userId || item._id,
      fullName: createdBy.fullName || item.fullName || 'user',
      userName: createdBy.userName || item.userName || '',
      profilePicture: createdBy.profilePicture || item.profilePicture || 'https://via.placeholder.com/40',
      email: createdBy.email || item.email || '',
    };
  };

  // Log the URL before rendering
  const userData = getUserData();
  return (
    <View style={styles.postContainer}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              navigation.navigate('UserProfile', {
                targetUserId: userData.id,
                userData: userData,
              });
            }}
          >
            <Image
              source={{ uri: userData.profilePicture }}
              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
            />
            <Text style={styles.userName}>{userData.fullName}</Text>
            {isProfileLocked && (
              <MaterialIcons name="lock" size={18} color="#888" style={{ marginLeft: 6 }} />
            )}
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.headerActions}>
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
                <FollowButton userId={item.createdBy} />
              </View>
            ) : null;
          })()}
          {isFromProfile && (
            <TouchableOpacity onPress={() => setShowMenu(true)}>
              <Feather name="more-vertical" style={styles.moreIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Only render the image if the URL is a non-empty string */}
      {hasImages && firstImageUrl && (
        <TouchableOpacity
          style={styles.postImageContainer}
          onPress={() => setShowFullImage(true)}
        >
          <Image
            source={{ uri: firstImageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Post Title and Description */}
      {(item.title || item.description) && (
        <View style={styles.postContentContainer}>
          {item.title && (
            <Text style={styles.postTitle} numberOfLines={2}>
              {item.title}
            </Text>
          )}
          {item.description && (
            <View>
              <Text 
                style={styles.postDescription} 
                numberOfLines={isDescriptionExpanded ? undefined : 3}
              >
                {item.description}
              </Text>
              {item.description.length > 100 && (
                <TouchableOpacity 
                  onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
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

      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={onLikePress}
            disabled={isLiking || authLoading}
            style={{ opacity: (isLiking || authLoading) ? 0.7 : 1 }}
            activeOpacity={0.6}
          >
            <AntDesign
              name={like ? 'heart' : 'hearto'}
              style={[
                styles.likeIcon,
                {
                  color: like ? '#ff3873' : '#333'
                }
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCommentModal(true)}>
            <Ionic name="chatbubble-outline" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Feather name="navigation" style={styles.icon} />
          </TouchableOpacity>
        </View>
        {/* <TouchableOpacity onPress={handleSavePost}>
          <Feather 
            name="bookmark"
            style={[styles.bookmarkIcon, { color: isSaved ? '#ff3873' : '#000' }]} 
          />
        </TouchableOpacity> */}
      </View>

      <View style={styles.likesContainer}>
        <Text style={styles.statsText}>
          {likeCount} likes • {item.commentsCount} comments • {shareCount} shares
        </Text>
        {/* {item.tags && item.tags.length > 0 && (
          <Text style={styles.tagsText}>
            Tags: {item.tags.join(', ')}
          </Text>
        )} */}
      </View>

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
                />
                <TouchableOpacity
                  style={[
                    styles.commentSubmitButton,
                    { opacity: commentText.trim() ? 1 : 0.5 }
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
                keyExtractor={(comment, index) => comment._id || index.toString()}
                renderItem={renderCommentItem}
                style={styles.commentsList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Feather name="trash-2" size={20} color="#FF3B30" />
              <Text style={[styles.menuText, styles.deleteMenuText]}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFullImage(false)}
          >
            <Ionic name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: firstImageUrl }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
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
};

const styles = StyleSheet.create({
  postContainer: {
    width: width,
    alignSelf: 'center',
    paddingBottom: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.1,
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  followButtonContainer: {
    marginRight: 5,
  },
  moreIcon: {
    fontSize: 20,
    paddingHorizontal: 3,
  },
  postImageContainer: {
    width: width,
    alignSelf: 'center',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    //borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  postImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    //borderRadius: 10,
  },
  imageList: {
    width: '100%',
    padding: 0,
    margin: 0,
  },
  postContentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 22,
  },
  postDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  seeMoreButton: {
    marginTop: 4,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIcon: {
    paddingRight: 8,
    fontSize: 20,
  },
  icon: {
    fontSize: 20,
    paddingRight: 8,
  },
  bookmarkIcon: {
    fontSize: 20,
    marginLeft: 5,
  },
  likesContainer: {
    paddingHorizontal: 15,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  tagsText: {
    fontSize: 14,
    color: '#1e88e5',
    marginTop: 5,
  },
  commentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    width: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  deleteMenuItem: {
    marginTop: 5,
  },
  deleteMenuText: {
    color: '#FF3B30',
  },
  commentModalContainer: {
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
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
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
    backgroundColor: '#ff3873',
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
    marginLeft: 50, // Align with the comment text after the profile image
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deleteCommentButton: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
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
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default Post;