import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  Image, 
  StyleSheet,
  Button,
  Modal,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SkeletonLoader from '../Loader/SkeletonLoader';
import { base_url } from '../../utils/base_url';
import InstaStory from 'react-native-insta-story';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
// Add this import for video compression
// import { Video as VideoCompressor } from 'react-native-compressor';
import { markStorySeen, setSeenStories } from '../../redux/reducers/storiesReducer';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../Auth/AuthContext';
import { colors } from '../../utils/colors';

const { width } = Dimensions.get('window');

const Stories = React.memo(() => {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const seenStories = useSelector(state => state.stories?.seenStories || {});
  const [image, setImage] = useState(null);
  const [storyInfo, setStoryInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState();
  const [showStories, setShowStories] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyTimer, setStoryTimer] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [myStories, setMyStories] = useState([]);
  const [mediaType, setMediaType] = useState(null);
  const [stories, setStories] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fallbackProfileImage, setFallbackProfileImage] = useState('https://via.placeholder.com/150');
  const STORY_DURATION = 10000; // 10 seconds for images
  const VIDEO_DURATION = 30000; // 30 seconds for videos
  const PROGRESS_INTERVAL = 100;

  // Add ref to track if data has been fetched
  const hasFetchedData = useRef(false);

  const loadUserId = useCallback(async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;

      if (parsedUser && parsedUser._id) {
        setUserId(parsedUser._id);
      } else {
        console.error('User not found or user ID is missing');
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  }, []);

  const fetchStories = useCallback(async () => {
    // Prevent multiple API calls
    if (hasFetchedData.current && !refreshing) {
      return;
    }

    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (!accessToken) {
        setError('Authentication token not found');
        return;
      }
      
      // Fetch stories
      const response = await fetch(`${base_url}/story/list`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
        
        if (data.status && data.data && data.data.stories) {
          // Get current user ID
          const user = await AsyncStorage.getItem('user');
          const currentUserId = user ? JSON.parse(user)._id : null;

        // Fetch seen stories from API
        try {
          const seenResponse = await fetch(`${base_url}/story/seen-stories`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          
          if (seenResponse.ok) {
            const seenData = await seenResponse.json();
            let seenStoriesMap = {};
            
            if (seenData.status && seenData.data) {
              // Transform seen stories data into the format we need
              seenStoriesMap = seenData.data.reduce((acc, story) => {
                if (!acc[story.userId]) {
                  acc[story.userId] = [];
                }
                acc[story.userId].push(story.storyId);
                return acc;
              }, {});
              
              // Update Redux with seen stories
              dispatch(setSeenStories(seenStoriesMap));
              
              // Save to AsyncStorage
              await AsyncStorage.setItem('seenStories', JSON.stringify(seenStoriesMap));
            }
          }
        } catch (seenError) {
          console.error('Error fetching seen stories:', seenError);
          // Continue without seen stories data
        }

        // Separate stories into user's stories and other stories
        const userStories = [];
        const otherStories = [];

        if (Array.isArray(data.data.stories)) {
          data.data.stories.forEach(userStory => {
            if (!userStory.stories || userStory.stories.length === 0) {
              return; // Skip users with no stories
            }

            // Use current user's profile image for their stories, otherwise use the story's profile picture
            const userImage = userStory.userId === currentUserId 
              ? (currentUser?.profilePicture || fallbackProfileImage || userStory.profilePicture || 'https://via.placeholder.com/150')
              : (userStory.profilePicture || userStory.stories[0]?.thumbnailUrl || 'https://via.placeholder.com/150');

            const transformedStory = {
              user_id: userStory.userId,
              user_image: userImage,
              user_name: userStory.userName || 'Unknown User',
              stories: userStory.stories.map(story => ({
                story_id: story._id || Date.now(),
                story_image: story.videoUrl || story.thumbnailUrl,
                thumbnail_image: story.thumbnailUrl || story.videoUrl,
                mediaType: story.mediaType || 'image', // Use backend's mediaType field
                swipeText: story.description || story.title || '',
                onPress: () => {},
                viewsCount: story.viewsCount || 0,
                likesCount: story.likesCount || 0,
                commentsCount: story.commentsCount || 0,
                createdAt: story.createdAt
              }))
            };

            // Check if the story belongs to the current user
            if (userStory.userId === currentUserId) {
              userStories.push(transformedStory);
            } else {
              otherStories.push(transformedStory);
            }
          });
        } else {
          console.warn('Stories data is not in expected format:', data.data.stories);
        }

        // Set user's stories for create page
        setMyStories(userStories);
        // Set other users' stories for story circle
        setStories(otherStories);
        
        // Mark that data has been fetched
        hasFetchedData.current = true;
      } else {
        setError(data.message || 'Failed to fetch stories');
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError('Error fetching stories: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, refreshing]);

  useEffect(() => {
    if (!hasFetchedData.current) {
      fetchStories();
    }
  }, [fetchStories]);

  useEffect(() => {
    loadUserId();
  }, [loadUserId]);

  // Ensure we have current user data for profile image
  useEffect(() => {
    if (!currentUser?.profilePicture) {
      // If current user profile picture is not available from AuthContext, try to load from AsyncStorage
      const loadCurrentUser = async () => {
        try {
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.profilePicture) {
              setFallbackProfileImage(parsedUser.profilePicture);
            }
          }
        } catch (error) {
          console.error('Error loading current user data:', error);
        }
      };
      loadCurrentUser();
    }
  }, [currentUser?.profilePicture]);

  useEffect(() => {
    if (showStories && selectedUser) {
      startStoryTimer();
    }
    return () => {
      if (storyTimer) {
        clearTimeout(storyTimer);
      }
    };
  }, [showStories, currentStoryIndex]);

  // Load seen stories from AsyncStorage on component mount
  useEffect(() => {
    loadSeenStories();
  }, []);

  const loadSeenStories = useCallback(async () => {
    try {
      const seenStoriesData = await AsyncStorage.getItem('seenStories');
      if (seenStoriesData) {
        const parsedSeenStories = JSON.parse(seenStoriesData);
        dispatch(setSeenStories(parsedSeenStories));
      }
    } catch (error) {
      console.error('Error loading seen stories:', error);
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reset the fetch flag to allow fresh data
      hasFetchedData.current = false;
      await fetchStories();
    } catch (error) {
      console.error('Error refreshing stories:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchStories]);

  const pickImage = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        showToast('You need to allow access to photos to upload media', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setSelectedMedia(asset);
        setShowImagePickerModal(false);
        setShowPreviewModal(true);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      showToast('Failed to pick media. Please try again', 'error');
    }
  }, [showToast]);

  const takePhoto = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        showToast('You need to allow access to camera to take photos', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setSelectedMedia(asset);
        setShowImagePickerModal(false);
        setShowPreviewModal(true);
      }
    } catch (error) {
      console.error('Error capturing media:', error);
      showToast('Failed to capture media. Please try again', 'error');
    }
  }, [showToast]);

  const trimVideo = useCallback(async (videoUri) => {
    try {
      // For now, we'll just return the original video URI
      // The 30-second limit will be enforced during playback
      return videoUri;
    } catch (error) {
      console.error('Error processing video:', error);
      return videoUri;
    }
  }, []);

  const getStoryDuration = useCallback((mediaType) => {
    return mediaType === 'video' ? VIDEO_DURATION : STORY_DURATION;
  }, []);

  const startStoryTimer = useCallback(() => {
    if (storyTimer) {
      clearInterval(storyTimer);
    }
    setProgress(0);

    if (!selectedUser || !selectedUser.stories || !selectedUser.stories[currentStoryIndex]) {
      console.warn('No story available to display');
      return;
    }

    const currentStory = selectedUser.stories[currentStoryIndex];
    const duration = currentStory.mediaType === 'video' ? VIDEO_DURATION : STORY_DURATION;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(timer);
        handleNextStory();
      }
    }, PROGRESS_INTERVAL);

    setStoryTimer(timer);
  }, [storyTimer, selectedUser, currentStoryIndex, handleNextStory]);

  const uploadStory = useCallback(async (mediaAsset) => {
    try {
      setIsUploading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Determine media type robustly
      const uriLower = String(mediaAsset?.uri || '').toLowerCase();
      const ext = uriLower.split('.').pop() || '';
      const videoExts = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', '3gp'];
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
      const isVideoByType = !!mediaAsset?.type?.toLowerCase?.().includes('video');
      const isVideoByExt = videoExts.includes(ext);
      const isImageByExt = imageExts.includes(ext);
      const isVideo = isVideoByType || (isVideoByExt && !isImageByExt);

      // Check file size before uploading (robust, byte-accurate)
      const MAX_IMAGE_MB = 10;
      const MAX_VIDEO_MB = 30;
      const BYTES_IN_MB = 1024 * 1024;

      const fileUri = mediaAsset.uri;

      let fileSizeBytes = 0;
      try {
        const info = await FileSystem.getInfoAsync(fileUri);
        if (typeof info?.size === 'number') {
          fileSizeBytes = info.size;
        } else if (typeof mediaAsset?.fileSize === 'number') {
          // fallback for sources that provide fileSize on asset
          fileSizeBytes = mediaAsset.fileSize;
        }
      } catch (_) {
        // ignore and handle below
      }

      // If we couldn't read size, allow upload to proceed (validation only when size is known)
      if (!fileSizeBytes) {
        // proceed without size validation
      } else {
        const maxBytes = (isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB) * BYTES_IN_MB;
        if (fileSizeBytes >= maxBytes) {
          setShowPreviewModal(false);
          showToast(
            isVideo
              ? `Video size must be less than ${MAX_VIDEO_MB} MB.`
              : `Image size must be less than ${MAX_IMAGE_MB} MB.`,
            'error'
          );
          setIsUploading(false);
          return;
        }
      }

      // Create form data
      const uploadFormData = new FormData();
      const fileExtension = (fileUri.split('.').pop() || '').toLowerCase();
      const mimeType = isVideo
        ? 'video/mp4'
        : (fileExtension === 'png' ? 'image/png' : 'image/jpeg');

      // Only add the main media file
      uploadFormData.append('mediaFile', {
        uri: fileUri,
        type: mimeType,
        name: `story.${fileExtension}`
      });

      // Upload the media file
      const uploadResponse = await fetch(`${base_url}/uploadFile?mediaType=story`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: uploadFormData,
      });
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }

      const uploadResponseData = await uploadResponse.json();
      // Robustly extract URL(s) from various backend shapes
      const urls = Array.isArray(uploadResponseData?.urls) && uploadResponseData.urls.length
        ? uploadResponseData.urls
        : (Array.isArray(uploadResponseData?.data?.urls) && uploadResponseData.data.urls.length
          ? uploadResponseData.data.urls
          : (uploadResponseData?.url
              ? [uploadResponseData.url]
              : (uploadResponseData?.data?.url ? [uploadResponseData.data.url] : [])));

      if (!urls.length) {
        throw new Error(uploadResponseData?.message || 'Failed to upload media file');
      }

      // Use the returned S3 URL(s) directly for story creation
      const storyData = {
        title: "My Story",
        description: "Check out my story!",
        videoUrl: urls[0], // Use the same URL for both images and videos
        thumbnailUrl: urls[0],
        mediaType: isVideo ? 'video' : 'image',
        duration: isVideo ? 30 : 0,
        tags: []
      };

      const response = await fetch(`${base_url}/story/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      let createdData;
      try {
        createdData = await response.json();
      } catch (_) {
        throw new Error(`Story creation failed with status: ${response.status}`);
      }

      if (response.ok !== true || createdData?.status !== true) {
        throw new Error(createdData?.message || `Story creation failed with status: ${response.status}`);
      }

      showToast('Story uploaded successfully', 'success');
      // Reset the fetch flag to allow fresh data
      hasFetchedData.current = false;
      fetchStories();
      setShowPreviewModal(false);
      setSelectedMedia(null);
    } catch (error) {
      // Close the modal first so toast is visible
      setShowPreviewModal(false);
      // Show the real error instead of generic size errors
      showToast(error?.message || 'Failed to upload media. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [showToast, fetchStories]);

  const isStorySeen = useCallback((userId, storyId) => {
    return seenStories[userId]?.includes(storyId) || false;
  }, [seenStories]);

  const markStoryAsSeen = useCallback(async (userId, storyId) => {
    if (!isStorySeen(userId, storyId)) {
      try {
        // Create a new object for seen stories
        const currentSeenStories = { ...seenStories };
        
        // Create a new array for the user's seen stories
        const userSeenStories = currentSeenStories[userId] ? [...currentSeenStories[userId]] : [];
        
        // Add the new story ID if it doesn't exist
        if (!userSeenStories.includes(storyId)) {
          userSeenStories.push(storyId);
          currentSeenStories[userId] = userSeenStories;
          
          // Update Redux state with the entire new object
          dispatch(setSeenStories(currentSeenStories));

          // Save to AsyncStorage
          await AsyncStorage.setItem('seenStories', JSON.stringify(currentSeenStories));

          // Update backend
          const accessToken = await AsyncStorage.getItem('accessToken');
          await fetch(`${base_url}/story/mark-seen`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              storyIds: [storyId],
              userId: userId 
            }),
          });
        }
      } catch (error) {
        console.error('Error marking story as seen:', error);
      }
    }
  }, [seenStories, isStorySeen, dispatch]);

  const handleStoryPress = useCallback((user) => {
    if (!user || !user.stories || user.stories.length === 0) return;
    
    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      setSelectedUser(user);
      setCurrentStoryIndex(0);
      setProgress(0);
      setShowStories(true);
      
      // Clear any existing timer
      if (storyTimer) {
        clearInterval(storyTimer);
      }
    }, 0);
  }, [storyTimer]);

  const handleNextStory = useCallback(() => {
    if (selectedUser && selectedUser.stories) {
      if (currentStoryIndex < selectedUser.stories.length - 1) {
        const currentStory = selectedUser.stories[currentStoryIndex];
        // Use setTimeout to avoid state updates during render
        setTimeout(() => {
          markStoryAsSeen(selectedUser.user_id, currentStory.story_id);
          setCurrentStoryIndex(currentStoryIndex + 1);
          setProgress(0);
        }, 0);
      } else {
        // Current user's stories are complete, move to next user
        const currentStory = selectedUser.stories[currentStoryIndex];
        // Use setTimeout to avoid state updates during render
        setTimeout(() => {
          markStoryAsSeen(selectedUser.user_id, currentStory.story_id);
          
          // Find the index of current user in stories array
          const currentUserIndex = stories.findIndex(user => user.user_id === selectedUser.user_id);
          
          if (currentUserIndex < stories.length - 1) {
            // Move to next user's stories
            const nextUser = stories[currentUserIndex + 1];
            setSelectedUser(nextUser);
            setCurrentStoryIndex(0);
            setProgress(0);
          } else {
            // No more users, close the story view
            setShowStories(false);
            setSelectedUser(null);
            setCurrentStoryIndex(0);
            setProgress(0);
          }
        }, 0);
      }
    }
  }, [selectedUser, currentStoryIndex, stories, markStoryAsSeen]);

  const handlePreviousStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        setCurrentStoryIndex(currentStoryIndex - 1);
        setProgress(0);
      }, 0);
    } else {
      // Find the index of current user in stories array
      const currentUserIndex = stories.findIndex(user => user.user_id === selectedUser.user_id);
      
      if (currentUserIndex > 0) {
        // Move to previous user's last story
        const previousUser = stories[currentUserIndex - 1];
        // Use setTimeout to avoid state updates during render
        setTimeout(() => {
          setSelectedUser(previousUser);
          setCurrentStoryIndex(previousUser.stories.length - 1);
          setProgress(0);
        }, 0);
      }
    }
  }, [currentStoryIndex, stories, selectedUser]);

  const handleDeleteStory = useCallback(async (storyId) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${base_url}/story/delete/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (data.status) {
        // Remove the story from the local state
        const updatedStories = myStories.map(userStory => {
          if (userStory.user_id === userId) {
            return {
              ...userStory,
              stories: userStory.stories.filter(story => story.story_id !== storyId)
            };
          }
          return userStory;
        });

        setMyStories(updatedStories);

        // If we deleted the last story, close the story view
        if (selectedUser.stories.length === 1) {
          setShowStories(false);
          setSelectedUser(null);
          setCurrentStoryIndex(0);
        } else {
          // Move to the next story or previous story
          if (currentStoryIndex === selectedUser.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex - 1);
          }
        }

        showToast('Story deleted successfully', 'success');
      } else {
        throw new Error(data.message || 'Failed to delete story');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      showToast('Failed to delete story. Please try again', 'error');
    }
  }, [myStories, userId, selectedUser, currentStoryIndex, showToast]);

  const handleSubmit = useCallback(async () => {
    if (!selectedMedia) {
      showToast('No media selected', 'error');
      return;
    }
    await uploadStory(selectedMedia);
  }, [selectedMedia, showToast]);

  const handleCancel = useCallback(() => {
    setSelectedMedia(null);
    setShowPreviewModal(false);
  }, []);

  const renderStoryContent = () => {
    if (!selectedUser || !selectedUser.stories || !selectedUser.stories[currentStoryIndex]) return null;

    const currentStory = selectedUser.stories[currentStoryIndex];
    const isVideo = currentStory.mediaType === 'video';
    const isMyStory = selectedUser.user_id === userId;

    return (
      <View style={styles.storyContentContainer}>
        {currentStory.mediaType === 'video' ? (
          <Video
            source={{ uri: currentStory.story_image }}
            style={styles.storyMedia}
            resizeMode="cover"
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                handleNextStory();
              }
              if (status.positionMillis && status.durationMillis) {
                const videoProgress = (status.positionMillis / status.durationMillis) * 100;
                setProgress(Math.min(videoProgress, 100));
              }
            }}
            onLoad={(data) => {
              if (data.durationMillis) {
                const duration = Math.min(data.durationMillis, VIDEO_DURATION);
                if (storyTimer) {
                  clearInterval(storyTimer);
                }
                const timer = setInterval(() => {
                  setProgress(prev => {
                    const newProgress = prev + (100 / (duration / PROGRESS_INTERVAL));
                    if (newProgress >= 100) {
                      clearInterval(timer);
                      handleNextStory();
                      return 100;
                    }
                    return newProgress;
                  });
                }, PROGRESS_INTERVAL);
                setStoryTimer(timer);
              }
            }}
            onError={(error) => {
              console.error('Video playback error:', error);
              showToast('Error playing video', 'error');
              handleNextStory();
            }}
            onLoadStart={() => {
              setProgress(0);
              if (storyTimer) {
                clearInterval(storyTimer);
              }
              const timer = setInterval(() => {
                setProgress(prev => {
                  const newProgress = prev + (100 / (STORY_DURATION / PROGRESS_INTERVAL));
                  if (newProgress >= 100) {
                    clearInterval(timer);
                    handleNextStory();
                    return 100;
                  }
                  return newProgress;
                });
              }, PROGRESS_INTERVAL);
              setStoryTimer(timer);
            }}
            onReadyForDisplay={() => {
              if (storyTimer) {
                clearInterval(storyTimer);
              }
            }}
            isMuted={false}
            volume={1.0}
            rate={1.0}
            progressUpdateIntervalMillis={100}
            posterSource={{ uri: currentStory.thumbnail_image }}
            posterStyle={styles.storyMedia}
            usePoster={true}
          />
        ) : (
          <Image
            source={{ uri: currentStory.story_image }}
            style={styles.storyMedia}
            resizeMode="cover"
            onLoadStart={() => {
              setProgress(0);
              if (storyTimer) {
                clearInterval(storyTimer);
              }
              const timer = setInterval(() => {
                setProgress(prev => {
                  const newProgress = prev + (100 / (STORY_DURATION / PROGRESS_INTERVAL));
                  if (newProgress >= 100) {
                    clearInterval(timer);
                    handleNextStory();
                    return 100;
                  }
                  return newProgress;
                });
              }, PROGRESS_INTERVAL);
              setStoryTimer(timer);
            }}
          />
        )}
        <View style={styles.storyHeader}>
          <View style={styles.storyUserInfo}>
            <Image
              source={{ uri: selectedUser.user_image }}
              style={styles.storyUserImage}
            />
            <TouchableOpacity 
              onPress={() => {
                // Close the story view first
                if (storyTimer) {
                  clearInterval(storyTimer);
                }
                setShowStories(false);
                setSelectedUser(null);
                setCurrentStoryIndex(0);
                
                // Navigate to user profile
                navigation.navigate('UserProfile', {
                  targetUserId: selectedUser.user_id,
                  userData: {
                    id: selectedUser.user_id,
                    fullName: selectedUser.user_name,
                    profilePicture: selectedUser.user_image
                  }
                });
              }}
            >
              <Text style={styles.storyUserName}>{selectedUser.user_name}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.storyHeaderButtons}>
            {isMyStory && (
              <TouchableOpacity 
                onPress={() => handleDeleteStory(currentStory.story_id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => {
                if (storyTimer) {
                  clearInterval(storyTimer);
                }
                setShowStories(false);
                setSelectedUser(null);
                setCurrentStoryIndex(0);
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.storyProgress}>
          {selectedUser.stories && selectedUser.stories.length > 0 && selectedUser.stories.map((story, index) => (
            <View
              key={index}
              style={[
                styles.progressBar,
                index === currentStoryIndex && styles.progressBarActive,
                index < currentStoryIndex && styles.progressBarCompleted
              ]}
            >
              {index === currentStoryIndex && (
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(progress, 100)}%` }
                  ]}
                />
              )}
            </View>
          ))}
        </View>
        <View style={styles.storyNavigationContainer}>
          <TouchableOpacity
            style={styles.storyNavigationArea}
            onPress={() => {
              if (storyTimer) {
                clearInterval(storyTimer);
              }
              handlePreviousStory();
            }}
          />
          <TouchableOpacity
            style={styles.storyNavigationArea}
            onPress={() => {
              if (storyTimer) {
                clearInterval(storyTimer);
              }
              handleNextStory();
            }}
          />
        </View>
      </View>
    );
  };

  const renderStoryItem = ({ item }) => {
    const hasStories = item.stories && item.stories.length > 0;
    const isSeen = hasStories && item.stories.every(story => 
      isStorySeen(item.user_id, story.story_id)
    );
    
    return (
      <TouchableOpacity 
        onPress={() => hasStories && handleStoryPress(item)}
        style={styles.storyItemContainer}
      >
        <View style={[
          styles.storyCircle,
          !hasStories && styles.disabledStoryCircle,
          isSeen && styles.seenStoryCircle,
          !isSeen && hasStories && styles.unseenStoryCircle
        ]}>
          <Image
            source={{ uri: item.user_image }}
            style={styles.storyImage}
          />
        </View>
        <Text style={[
          styles.storyName,
          isSeen && styles.seenStoryName,
          !isSeen && hasStories && styles.unseenStoryName
        ]}>{item.user_name}</Text>
      </TouchableOpacity>
    );
  };

  const renderYourStory = () => {
    const hasStories = myStories.length > 0;
    
    // Get profile image from current user or fallback to AsyncStorage
    const currentUserProfileImage = currentUser?.profilePicture || fallbackProfileImage;
    
    return (
      <View style={styles.yourStoryContainer}>
        <TouchableOpacity 
          style={styles.storyCircleContainer}
          onPress={() => {
            if (hasStories) {
              setSelectedUser(myStories[0]);
              setShowStories(true);
            } else {
              setShowImagePickerModal(true);
            }
          }}
        >
          <View style={[
            styles.storyCircle,
            !hasStories && styles.emptyStoryCircle
          ]}>
            {hasStories ? (
              <Image
                source={{ uri: currentUserProfileImage }}
                style={styles.storyImage}
              />
            ) : (
              <View style={styles.emptyStoryContent}>
                <Ionicons name="add" size={24} color="#666" />
              </View>
            )}
            {hasStories && (
              <TouchableOpacity 
                style={styles.addIconContainer}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowImagePickerModal(true);
                }}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ProfileDashboard');
          }}
        >
          <Text style={[
            styles.storyUsername,
            !hasStories && styles.emptyStoryUsername
          ]}>Your Story</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderImagePickerModal = () => (
    <Modal
      visible={showImagePickerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePickerModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={takePhoto}
          >
            <Ionicons name="camera" size={24} color="#000" />
            <Text style={styles.modalButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={pickImage}
          >
            <Ionicons name="image" size={24} color="#000" />
            <Text style={styles.modalButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowImagePickerModal(false)}
          >
            <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPreviewModal = () => (
    <Modal
      visible={showPreviewModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.instagramPreviewContainer}>
        {/* Story Header */}
        <View style={styles.instagramPreviewHeader}>
          <View style={styles.instagramPreviewUserInfo}>
            {currentUser?.profilePicture ? (
              <Image
                source={{ uri: currentUser.profilePicture }}
                style={styles.instagramPreviewUserImage}
              />
            ) : (
              <View style={styles.instagramPreviewUserImage}>
                <Text style={styles.instagramPreviewUserInitial}>You</Text>
              </View>
            )}
            <Text style={styles.instagramPreviewUserName}>Your Story</Text>
          </View>
          <TouchableOpacity onPress={handleCancel} style={styles.instagramCloseButton}>
            <Ionicons name="close" size={24} color={colors.Zypsii_color} />
          </TouchableOpacity>
        </View>

        {/* Story Content */}
        <View style={styles.instagramPreviewContent}>
          {selectedMedia?.type?.includes('video') ? (
            <Video
              source={{ uri: selectedMedia.uri }}
              style={styles.instagramPreviewMedia}
              resizeMode="cover"
              shouldPlay={false}
              isMuted={true}
              usePoster={true}
              posterSource={{ uri: selectedMedia.uri }}
              posterStyle={styles.instagramPreviewMedia}
            />
          ) : (
            <Image
              source={{ uri: selectedMedia?.uri }}
              style={styles.instagramPreviewMedia}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Story Footer */}
        <View style={styles.instagramPreviewFooter}>
          <View style={styles.instagramPreviewActions}>
            <TouchableOpacity 
              style={styles.instagramPreviewActionButton}
              onPress={handleCancel}
              disabled={isUploading}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
              <Text style={styles.instagramPreviewActionText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.instagramPreviewActionButton, isUploading && styles.instagramPreviewActionDisabled]}
              onPress={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <View style={styles.instagramLoadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.instagramPreviewActionText}>Uploading...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={32} color="#fff" />
                  <Text style={styles.instagramPreviewActionText}>Share</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              setStoryInfo([]);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isLoading) {
      return (
        <SkeletonLoader
          count={6}
          circleSize={68}
          textWidth={40}
          textHeight={10}
          containerStyle={styles.skeletonContainer}
        />
      );
    }

    return (
      <View style={styles.container}>
        {renderImagePickerModal()}
        {renderPreviewModal()}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContainer}
          decelerationRate="fast"
          snapToInterval={83} // Width of story item (68) + margin (15)
          snapToAlignment="start"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <View style={styles.storiesLeftSection}>
            {renderYourStory()}
          </View>

          {stories.length > 0 ? (
            stories.map((item, index) => (
              <View key={index} style={styles.storyItemContainer}>
                <TouchableOpacity
                  style={styles.storyCircleContainer}
                  onPress={() => handleStoryPress(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.storyCircle,
                      !item.stories?.length && styles.disabledStoryCircle,
                      item.stories?.length > 0 && !isStorySeen(item.user_id, item.stories[0].story_id) && styles.unseenStoryCircle,
                      item.stories?.length > 0 && isStorySeen(item.user_id, item.stories[0].story_id) && styles.seenStoryCircle
                    ]}
                  >
                    <Image source={{ uri: item.user_image }} style={styles.storyImage} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('UserProfile', {
                      targetUserId: item.user_id,
                      userData: {
                        id: item.user_id,
                        fullName: item.user_name,
                        profilePicture: item.user_image
                      }
                    });
                  }}
                >
                  <Text 
                    style={[
                      styles.storyName,
                      item.stories?.length > 0 && !isStorySeen(item.user_id, item.stories[0].story_id) && styles.unseenStoryName,
                      item.stories?.length > 0 && isStorySeen(item.user_id, item.stories[0].story_id) && styles.seenStoryName
                    ]}
                  >
                    {item.user_name}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.noStoriesContainer}>
              <Text style={styles.noStoriesText}>No stories to show</Text>
              <Text style={styles.noStoriesSubtext}>Follow users to see their stories</Text>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={showStories}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowStories(false);
            setSelectedUser(null);
            setCurrentStoryIndex(0);
          }}
        >
          {renderStoryContent()}
        </Modal>
      </View>
    );
  };

  // Cleanup effect to reset fetch flag on unmount
  useEffect(() => {
    return () => {
      hasFetchedData.current = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
});

Stories.displayName = 'Stories';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  storiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  storyItemContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 68, // Fixed width for consistent snapping
  },
  storyCircleContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  storyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  storyImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  storyName: {
    textAlign: 'center',
    fontSize: 10,
    color: '#000',
  },
  seenStoryName: {
    color: '#9B9B9B',
    fontWeight: '400',
  },
  addStoryButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderWidth: 1.8,
    borderRadius: 100,
    borderColor: '#c13584',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
  addIcon: {
    fontSize: 20,
    color: '#c13584',
  },
  closeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  textContainer: {
    padding: 10,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  profileName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instaStory: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    padding: 10,
    backgroundColor: colors.Zypsii_color,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
  },
  skeletonContainer: {
    paddingHorizontal: 8,
  },
  disabledStoryCircle: {
    opacity: 0.5,
    borderColor: '#ccc',
  },
  yourStoryContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyCircleActive: {
    borderColor: '#3897f0',
  },
  storyUsername: {
    fontSize: 12,
    color: '#000',
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.Zypsii_color,
    borderRadius: 100,
    padding: 0.1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalButtonText: {
    marginLeft: 10,
    fontSize: 16,
  },
  cancelButton: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.Zypsii_color,
  },
  storiesContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    paddingRight: 20, // Add extra padding at the end for better scrolling
  },
  storiesLeftSection: {
    marginRight: 15,
  },
  storyItemContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 68, // Fixed width for consistent snapping
  },
  storyVideo: {
    width: '100%',
    height: '100%',
  },
  storyThumbnail: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
  emptyStoryCircle: {
    borderColor: '#ccc',
    borderWidth: 2,
    backgroundColor: '#f5f5f5',
  },
  emptyStoryContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  emptyStoryUsername: {
    color: '#9B9B9B',
    fontWeight: '400',
  },
  modalStoryContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  shareButton: {
    padding: 10,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  storyText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  storyViewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyContentContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  storyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    zIndex: 1,
  },
  storyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  storyUserName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storyProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 10,
    zIndex: 1,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  progressBarActive: {
    backgroundColor: '#fff',
  },
  progressBarCompleted: {
    backgroundColor: '#fff',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    position: 'absolute',
    left: 0,
    top: 0,
    transition: 'width 0.1s linear',
  },
  storyNavigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  storyNavigationArea: {
    flex: 1,
    height: '100%',
  },
  unseenStoryCircle: {
    borderColor: colors.Zypsii_color,
    borderWidth: 2.5,
  },
  seenStoryCircle: {
    borderColor: '#9B9B9B',
    borderWidth: 2,
    opacity: 0.9,
  },
  unseenStoryName: {
    color: colors.Zypsii_color,
    fontWeight: '600',
  },
  seenStoryName: {
    color: '#9B9B9B',
    fontWeight: '400',
  },
  storyHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginRight: 15,
  },
  instagramPreviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  instagramPreviewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    zIndex: 10,
  },
  instagramPreviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instagramPreviewUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#c13584',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramPreviewUserInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instagramPreviewUserName: {
    color: colors.Zypsii_color,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  instagramCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  instagramPreviewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramPreviewMedia: {
    width: '100%',
    height: '100%',
  },
  instagramPreviewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    zIndex: 10,
  },
  instagramPreviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instagramPreviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 25,
    backgroundColor: colors.Zypsii_color,
    minWidth: 120,
    justifyContent: 'center',
  },
  instagramPreviewActionDisabled: {
    backgroundColor: colors.lightpink,
    opacity: 0.6,
  },
  instagramPreviewActionText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  instagramLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noStoriesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minWidth: 200,
  },
  noStoriesText: {
    color: '#9B9B9B',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  noStoriesSubtext: {
    color: '#9B9B9B',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default Stories;
