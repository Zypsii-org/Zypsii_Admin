import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Alert,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  NativeModules,
  Image,
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  Dimensions,
  RefreshControl
} from 'react-native';
import SwiperFlatList from 'react-native-swiper-flatlist';
import styles from './styles';
import CategoryCard from '../../ui/CategoryCard/CategoryCard';
import { BottomTab, TextDefault, TextError, Spinner, Hexagon } from '../../components';
import { verticalScale, scale, colors, alignment } from '../../utils';
import ProductCard from '../../ui/ProductCard/ProductCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSchedule } from '../../context/ScheduleContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Stories from '../../components/Stories/Stories';
import Post from '../../components/Posts/Post';
import DiscoverByNearest from '../../components/DiscoverByNearest/DiscoverByNearest';
import SkeletonLoader from '../../components/Loader/SkeletonLoader';
import { useFocusEffect } from '@react-navigation/native';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatusBar } from '../../utils/useStatusBar';
import ChatSupport from '../../components/ChatSupport/ChatSupport';
import FloatingSupportButton from '../../components/FloatingChatButton/FloatingChatButton';
import AllSchedule from '../MySchedule/Schedule/AllSchedule';
import RecommendCard from '../../components/Recommendation/RecommendCard';
import FollowButton from '../../components/Follow/FollowButton';
import { useToast } from '../../context/ToastContext';

const { height, width } = Dimensions.get('window');

const outdoorsAndAdventureTags = [
  'Beach', 'Adventure', 'Mountains', 'Hiking', 'Trekking',
  'View Points', 'National Parks', 'Wildlife', 'Cultural Sites',
  'Historical Places', 'Waterfalls', 'Lakes', 'Forests',
  'Caves', 'Temples', 'Museums', 'Gardens', 'Rivers'
];

// Whitelist for strict category validation
const ALLOWED_CATEGORIES = new Set(outdoorsAndAdventureTags);


function MainLanding(props) {
  const navigation = useNavigation();
  const { scheduleData } = useSchedule();
  const { showToast } = useToast();
  const [selectedButton, setSelectedButton] = useState('All');
  const buttons = ['All', 'Posts', 'Shorts', 'Schedule'];
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Loading states
  const [isDiscoverByInterestLoading, setIsDiscoverByInterestLoading] = useState(true);
  const [isBestDestinationLoading, setIsBestDestinationLoading] = useState(true);
  const [isAllDestinationLoading, setIsAllDestinationLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isShortsLoading, setIsShortsLoading] = useState(true);
  const [isNearestLoading, setIsNearestLoading] = useState(true);
  const [isStoriesLoading, setIsStoriesLoading] = useState(true);

  // Data states
  const [discover_by_intrest, setDiscover_by_intrest] = useState([]);
  const [best_destination, setBest_destination] = useState([]);
  const [all_destination, setAll_destination] = useState([]);
  const [all_schedule, setAll_schedule] = useState([]);
  const [all_posts, setAllPosts] = useState([]);
  const [all_shorts, setAllShorts] = useState([]);
  const [discoverbynearest, setDiscoverbyNearest] = useState([]);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [visiblePostIds, setVisiblePostIds] = useState(new Set());
  const postsViewabilityConfig = React.useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onPostsViewableItemsChanged = React.useRef(({ viewableItems }) => {
    const next = new Set();
    viewableItems.forEach(({ item }) => {
      if (item && item._id) next.add(item._id);
    });
    setVisiblePostIds(next);
  }).current;

  // When switching to Posts tab, seed initial visible ids so Post components can check status immediately
  useEffect(() => {
    if (selectedButton === 'Posts' && Array.isArray(all_posts) && all_posts.length > 0) {
      const firstIds = new Set(all_posts.slice(0, 6).map(p => p._id));
      setVisiblePostIds(firstIds);
    }
  }, [selectedButton, all_posts]);
  const [shortsPagination, setShortsPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    totalPages: 0
  });
  // Add pagination states for discover by interest and nearest
  const [discoverByInterestPagination, setDiscoverByInterestPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });
  const [discoverByNearestPagination, setDiscoverByNearestPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });
  // Add pagination states for all destination and best destination
  const [allDestinationPagination, setAllDestinationPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });
  const [bestDestinationPagination, setBestDestinationPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });

  // Add state for tracking new loading items
  const [loadingNewItems, setLoadingNewItems] = useState(false);

  // Add state for tracking new loading items for best destination
  const [loadingNewBestItems, setLoadingNewBestItems] = useState(false);

  // Add state for user location
  const [userLocation, setUserLocation] = useState({
    latitude: 13.0843,
    longitude: 80.2705
  });

  // --- STATE FOR OUTDOORS AND ADVENTURE TAGS ---
  const [selectedAdventureTag, setSelectedAdventureTag] = useState('Beach');
  const [adventurePlaces, setAdventurePlaces] = useState([]);
  const [isAdventureLoading, setIsAdventureLoading] = useState(false);
  const [adventurePagination, setAdventurePagination] = useState({
    nextPageToken: null,
    hasMore: true
  });

  // --- STATE FOR MOUNTAINS PAGINATION ---
  const [mountainPlaces, setMountainPlaces] = useState([]);
  const [isMountainsLoading, setIsMountainsLoading] = useState(true);
  const [mountainsPagination, setMountainsPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });

  // --- STATE FOR VIEW POINTS PAGINATION ---
  const [viewPointsPlaces, setViewPointsPlaces] = useState([]);
  const [isViewPointsLoading, setIsViewPointsLoading] = useState(true);
  const [viewPointsPagination, setViewPointsPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });

  // Add refreshing state for pull-to-refresh functionality
  const [refreshing, setRefreshing] = useState(false);

  // Add a centralized function to fetch places data from database
  const fetchPlacesData = async (type, keyword = null, nextPageToken = null) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return { data: [], nextPageToken: null };

      let url = `${base_url}/schedule/places/getNearest?type=${type}`;
      if (keyword) {
        url += `&keyword=${keyword}`;
      }
      if (nextPageToken) {
        url += `&page=${nextPageToken}`;
      }
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (Array.isArray(data?.data)) {
        return {
          data: data.data, // Use the data directly without formatting
          nextPageToken: data.pagination?.hasMore ? (data.pagination.currentPage + 1).toString() : null,
          hasMore: data.pagination?.hasMore || false
        };
      }

      return { data: [], nextPageToken: null, hasMore: false };
    } catch (error) {
      console.error(`Error fetching places data for type ${type}:`, error);
      return { data: [], nextPageToken: null, hasMore: false };
    }
  };

  // Fetch places by category for Outdoors and Adventure
  const fetchPlacesByCategory = async (category, nextPageToken = null) => {
    try {
      if (!ALLOWED_CATEGORIES.has(category)) {
        console.warn('Invalid category requested, skipping:', category);
        return { data: [], nextPageToken: null, hasMore: false };
      }
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken || !category) return { data: [], nextPageToken: null, hasMore: false };

      let url = `${base_url}/schedule/places/getNearest?category=${encodeURIComponent(category)}`;
      if (nextPageToken) {
        url += `&page=${nextPageToken}`;
      }
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (Array.isArray(data?.data)) {
        return {
          data: data.data,
          nextPageToken: data.pagination?.hasMore ? (data.pagination.currentPage + 1).toString() : null,
          hasMore: data.pagination?.hasMore || false
        };
      }

      return { data: [], nextPageToken: null, hasMore: false };
    } catch (error) {
      console.error(`Error fetching places by category ${category}:`, error);
      return { data: [], nextPageToken: null, hasMore: false };
    }
  };

  // Add function to update live location
  const updateLiveLocation = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return;

      // Use the location from user data if available, otherwise use default
      const latitude = user?.location?.latitude || userLocation.latitude;
      const longitude = user?.location?.longitude || userLocation.longitude;

      const response = await fetch(`${base_url}/user/update-live-location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: latitude,
          longitude: longitude
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update live location');
      }

      const data = await response.json();
    } catch (error) {
      console.error('Error updating live location:', error);
    }
  };

  // Single useEffect for initial data fetch and setup
  useEffect(() => {
    const initializeData = async () => {
      // Get current user ID
      try {
        const storedUserString = await AsyncStorage.getItem('user');
        if (storedUserString) {
          const storedUser = JSON.parse(storedUserString);
          setCurrentUserId(storedUser._id);
        }
      } catch (error) {
        console.error('Error getting current user ID:', error);
      }

      // Update live location
      await updateLiveLocation();

      // Fetch all data including schedule
      await fetchAllData();

      // Fetch unread notifications
      await fetchUnreadNotifications();
    };

    initializeData();
  }, []);

  // Back handler
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit?",
          [
            {
              text: "Cancel",
              onPress: () => null,
              style: "cancel"
            },
            { text: "YES", onPress: () => BackHandler.exitApp() }
          ]
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );

  // Fetch unread notification count
  const fetchUnreadNotifications = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return;
      const response = await fetch(`${base_url}/user/getNotifications?read=false&offset=0&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(Array.isArray(data.data) ? data.data.length : 0);
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  // Refresh unread notification count when coming back from Notification page only
  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadNotifications();
    }, [])
  );

  // Function to refresh only schedule data
  const refreshScheduleData = async () => {
    try {
      setIsScheduleLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        setIsScheduleLoading(false);
        return;
      }

      const response = await fetch(`${base_url}/schedule/listing/filter?filter=Public`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (Array.isArray(data?.data)) {
        setAll_schedule(data.data.map(item => ({
          id: item._id,
          _id: item._id,
          title: item.tripName,
          from: (item.locationDetails?.[0]?.address
            ? item.locationDetails[0].address.slice(0, 5) + '...'
            : 'Unknown'),
          to: (item.locationDetails?.[1]?.address
            ? item.locationDetails[1].address.slice(0, 5) + '...'
            : 'Unknown'),
          date: new Date(item.Dates.from).toLocaleDateString(),
          endDate: new Date(item.Dates.end).toLocaleDateString(),
          travelMode: item.travelMode,
          visible: item.visible,
          numberOfDays: item.numberOfDays.toString(),
          imageUrl: item.bannerImage,
          locationDetails: item.locationDetails,
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          createdBy: item.createdBy,
          riders: '0 riders',
          joined: false,
          rawLocation: {
            from: {
              latitude: item.location?.from?.latitude || 0,
              longitude: item.location?.from?.longitude || 0
            },
            to: {
              latitude: item.location?.to?.latitude || 0,
              longitude: item.location?.to?.longitude || 0
            }
          }
        })));
      } else {
        setAll_schedule([]);
      }
    } catch (error) {
      console.error('Error refreshing schedule data:', error);
      setAll_schedule([]);
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const fetchShorts = async () => {
    try {
      setIsShortsLoading(true);
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
        const shortsList = shortsData.data.map(short => ({
          id: short._id,
          type: 'short',
          title: short.title,
          description: short.description,
          videoUrl: short.videoUrl,
          thumbnailUrl: short.thumbnailUrl,
          createdBy: short.createdBy,
          viewsCount: short.viewsCount || 0,
          likesCount: short.likesCount || 0,
          commentsCount: short.commentsCount || 0,
          createdAt: short.createdAt,
          updatedAt: short.updatedAt
        }));

        // Filter only mp4 videos
        const mp4ShortsList = shortsList.filter(
          item => typeof item.videoUrl === 'string' && item.videoUrl.toLowerCase().endsWith('.mp4')
        );
        setAllShorts(mp4ShortsList);
        setShortsPagination(shortsData.pagination || {});
      } else {
        setAllShorts([]);
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
      setAllShorts([]);
    } finally {
      setIsShortsLoading(false);
    }
  };

  // Removed separate fetchShorts useEffect since it's included in fetchAllData

  // Modify the fetchAllData function to use the centralized function
  const fetchAllData = async () => {
    try {
      // Set all loading states to true
      setIsDiscoverByInterestLoading(true);
      setIsBestDestinationLoading(true);
      setIsAllDestinationLoading(true);
      setIsScheduleLoading(true);
      setIsPostsLoading(true);
      setIsShortsLoading(true);
      setIsNearestLoading(true);

      // Get access token once for all authenticated requests
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Make API requests and set data immediately when each response comes back
      // Discover by Interest
      fetchPlacesData('interest')
        .then(result => {
          setDiscover_by_intrest(result.data);
          setDiscoverByInterestPagination({
            nextPageToken: result.nextPageToken,
            hasMore: result.hasMore
          });
          setIsDiscoverByInterestLoading(false);
        })
        .catch(error => {
          console.error('Error fetching discover by interest:', error);
          setDiscover_by_intrest([]);
          setIsDiscoverByInterestLoading(false);
        });

      // Best Destination (Mountains)
      fetchPlacesByCategory('Mountains')
        .then(result => {
          setMountainPlaces(result.data);
          setMountainsPagination({
            nextPageToken: result.nextPageToken,
            hasMore: result.hasMore
          });
          setIsMountainsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching mountains:', error);
          setMountainPlaces([]);
          setIsMountainsLoading(false);
        });

      // All Destination (View Points)
      fetchPlacesByCategory('View Points')
        .then(result => {
          setViewPointsPlaces(result.data);
          setViewPointsPagination({
            nextPageToken: result.nextPageToken,
            hasMore: result.hasMore
          });
          setIsViewPointsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching view points:', error);
          setViewPointsPlaces([]);
          setIsViewPointsLoading(false);
        });

      // All Schedule
      fetch(`${base_url}/schedule/listing/filter?filter=Public`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data?.data)) {
            setAll_schedule(data.data.map(item => ({
              id: item._id,
              _id: item._id,
              title: item.tripName,
              from: (item.locationDetails?.[0]?.address
                ? item.locationDetails[0].address.slice(0, 5) + '...'
                : 'Unknown'),
              to: (item.locationDetails?.[1]?.address
                ? item.locationDetails[1].address.slice(0, 5) + '...'
                : 'Unknown'),
              date: new Date(item.Dates.from).toLocaleDateString(),
              endDate: new Date(item.Dates.end).toLocaleDateString(),
              travelMode: item.travelMode,
              visible: item.visible,
              numberOfDays: item.numberOfDays.toString(),
              imageUrl: item.bannerImage,
              locationDetails: item.locationDetails,
              createdAt: new Date(item.createdAt).toLocaleDateString(),
              createdBy: item.createdBy,
              riders: '0 riders',
              joined: false,
              rawLocation: {
                from: {
                  latitude: item.location?.from?.latitude || 0,
                  longitude: item.location?.from?.longitude || 0
                },
                to: {
                  latitude: item.location?.to?.latitude || 0,
                  longitude: item.location?.to?.longitude || 0
                }
              }
            })));
          } else {
            setAll_schedule([]);
          }
          setIsScheduleLoading(false);
        })
        .catch(error => {
          console.error('Error fetching all schedule:', error);
          setAll_schedule([]);
          setIsScheduleLoading(false);
        });

      // All Posts - Try without filter first
      fetch(`${base_url}/post/listing`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data?.data) && data.data.length > 0) {
            setAllPosts(data.data.map(item => {
              // Process mediaUrl array
              let mediaUrls = item.mediaUrl;

              // Handle string URLs
              if (typeof mediaUrls === 'string') {
                try {
                  // Try to parse if it's a JSON string
                  if (mediaUrls.startsWith('[')) {
                    mediaUrls = JSON.parse(mediaUrls);
                  } else {
                    // Single URL string
                    mediaUrls = [mediaUrls];
                  }
                } catch (e) {
                  mediaUrls = [mediaUrls];
                }
              }

              // Ensure mediaUrls is always an array
              if (!Array.isArray(mediaUrls)) {
                mediaUrls = [mediaUrls];
              }

              // Filter out null or undefined URLs
              mediaUrls = mediaUrls.filter(url => url != null);

              // Clean up URLs if needed
              mediaUrls = mediaUrls.map(url => {
                if (typeof url === 'string') {
                  return url.replace(/\\/g, '').replace(/"/g, '');
                }
                return url;
              });

              const processedItem = {
                _id: item._id,
                title: item.postTitle,
                description: item.description || '',
                postTitle: item.postTitle,
                postType: item.postType,
                mediaType: item.mediaType,
                mediaUrl: mediaUrls,
                imageUrl: mediaUrls,
                createdBy: item.createdBy,
                tags: Array.isArray(item.tags) ? item.tags : [],
                likesCount: item.likesCount || 0,
                commentsCount: item.commentsCount || 0,
                shareCount: item.shareCount || 0,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              };
              return processedItem;
            }));
            setIsPostsLoading(false);
          } else {
            // Try fetching with FollowersOnly filter
            return fetch(`${base_url}/post/listing/filter?filter=FollowersOnly`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
          }
        })
        .then(response => {
          if (response && response.json) {
            return response.json();
          }
          return null;
        })
        .then(data => {
          if (data) {
            if (Array.isArray(data?.data) && data.data.length > 0) {
              setAllPosts(data.data.map(item => {
                // Process mediaUrl array
                let mediaUrls = item.mediaUrl;

                // Handle string URLs
                if (typeof mediaUrls === 'string') {
                  try {
                    // Try to parse if it's a JSON string
                    if (mediaUrls.startsWith('[')) {
                      mediaUrls = JSON.parse(mediaUrls);
                    } else {
                      // Single URL string
                      mediaUrls = [mediaUrls];
                    }
                  } catch (e) {
                    mediaUrls = [mediaUrls];
                  }
                }

                // Ensure mediaUrls is always an array
                if (!Array.isArray(mediaUrls)) {
                  mediaUrls = [mediaUrls];
                }

                // Filter out null or undefined URLs
                mediaUrls = mediaUrls.filter(url => url != null);

                // Clean up URLs if needed
                mediaUrls = mediaUrls.map(url => {
                  if (typeof url === 'string') {
                    return url.replace(/\\/g, '').replace(/"/g, '');
                  }
                  return url;
                });

                const processedItem = {
                  _id: item._id,
                  title: item.postTitle,
                  description: item.description || '',
                  postTitle: item.postTitle,
                  postType: item.postType,
                  mediaType: item.mediaType,
                  mediaUrl: mediaUrls,
                  imageUrl: mediaUrls,
                  createdBy: item.createdBy,
                  tags: Array.isArray(item.tags) ? item.tags : [],
                  likesCount: item.likesCount || 0,
                  commentsCount: item.commentsCount || 0,
                  shareCount: item.shareCount || 0,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt
                };
                return processedItem;
              }));
              setIsPostsLoading(false);
            } else {
              // Try fetching public posts if followers only returns empty
              return fetch(`${base_url}/post/listing/filter?filter=Public`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });
            }
          }
          return null;
        })
        .then(response => {
          if (response && response.json) {
            return response.json();
          }
          return null;
        })
        .then(data => {
          if (data) {
            if (Array.isArray(data?.data) && data.data.length > 0) {
              setAllPosts(data.data.map(item => {
                // Process mediaUrl array
                let mediaUrls = item.mediaUrl;

                // Handle string URLs
                if (typeof mediaUrls === 'string') {
                  try {
                    // Try to parse if it's a JSON string
                    if (mediaUrls.startsWith('[')) {
                      mediaUrls = JSON.parse(mediaUrls);
                    } else {
                      // Single URL string
                      mediaUrls = [mediaUrls];
                    }
                  } catch (e) {
                    mediaUrls = [mediaUrls];
                  }
                }

                // Ensure mediaUrls is always an array
                if (!Array.isArray(mediaUrls)) {
                  mediaUrls = [mediaUrls];
                }

                // Filter out null or undefined URLs
                mediaUrls = mediaUrls.filter(url => url != null);

                // Clean up URLs if needed
                mediaUrls = mediaUrls.map(url => {
                  if (typeof url === 'string') {
                    return url.replace(/\\/g, '').replace(/"/g, '');
                  }
                  return url;
                });

                const processedItem = {
                  _id: item._id,
                  title: item.postTitle,
                  description: item.description || '',
                  postTitle: item.postTitle,
                  postType: item.postType,
                  mediaType: item.mediaType,
                  mediaUrl: mediaUrls,
                  imageUrl: mediaUrls,
                  createdBy: item.createdBy,
                  tags: Array.isArray(item.tags) ? item.tags : [],
                  likesCount: item.likesCount || 0,
                  commentsCount: item.commentsCount || 0,
                  shareCount: item.shareCount || 0,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt
                };
                return processedItem;
              }));
            } else {
              setAllPosts([]);
            }
          }
          setIsPostsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching all posts:', error);
          setAllPosts([]);
          setIsPostsLoading(false);
        });

      // Discover by Nearest
      fetchPlacesData('nearest')
        .then(result => {
          const formattedData = result.data.slice(0, 100).map(item => ({
            id: item._id,
            image: item.image,
            title: item.name,
            subtitle: item.address || 'No address',
            rating: item.rating,
            distance: item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null,
            location: {
              latitude: item.location?.lat || 0,
              longitude: item.location?.lng || 0
            }
          }));
          setDiscoverbyNearest(formattedData);
          setDiscoverByNearestPagination({
            nextPageToken: result.nextPageToken,
            hasMore: result.hasMore
          });
          setIsNearestLoading(false);
        })
        .catch(error => {
          console.error('Error fetching discover by nearest:', error);
          setDiscoverbyNearest([]);
          setIsNearestLoading(false);
        });

      // Fetch Shorts
      fetchShorts();

      // Fetch Adventure Places (initial tag) using category
      if (outdoorsAndAdventureTags[0]) {
        setIsAdventureLoading(true);
        const adventureResult = await fetchPlacesByCategory(outdoorsAndAdventureTags[0]);
        setAdventurePlaces(adventureResult.data);
        setAdventurePagination({
          nextPageToken: adventureResult.nextPageToken,
          hasMore: adventureResult.hasMore
        });
        setIsAdventureLoading(false);
      }

      // Fetch Mountains and View Points data
      const mountainsResult = await fetchPlacesByCategory('Mountains');
      setMountainPlaces(mountainsResult.data);
      setMountainsPagination({
        nextPageToken: mountainsResult.nextPageToken,
        hasMore: mountainsResult.hasMore
      });
      setIsMountainsLoading(false);

      const viewPointsResult = await fetchPlacesByCategory('View Points');
      setViewPointsPlaces(viewPointsResult.data);
      setViewPointsPagination({
        nextPageToken: viewPointsResult.nextPageToken,
        hasMore: viewPointsResult.hasMore
      });
      setIsViewPointsLoading(false);

    } catch (error) {
      console.error('Error in fetchAllData:', error);
      // Set empty arrays on error
      setDiscover_by_intrest([]);
      setMountainPlaces([]);
      setViewPointsPlaces([]);
      setAdventurePlaces([]);
      setAll_schedule([]);
      setAllPosts([]);
      setDiscoverbyNearest([]);

      // Set all loading states to false
      setIsDiscoverByInterestLoading(false);
      setIsMountainsLoading(false);
      setIsViewPointsLoading(false);
      setIsScheduleLoading(false);
      setIsPostsLoading(false);
      setIsShortsLoading(false);
      setIsNearestLoading(false);
      setIsAdventureLoading(false);

      // Log specific error details
      if (error.message === 'No access token found') {
        console.error('Authentication error: No access token found');
      } else {
        console.error('Network or server error:', error);
      }
    }
  };

  // --- HANDLER FOR TAG CLICK ---
  const handleAdventureTagClick = async (tag) => {
    if (!ALLOWED_CATEGORIES.has(tag)) {
      console.warn('Blocked unsupported category tag:', tag);
      return;
    }
    // Avoid refetch if the same tag is selected and we already have data
    if (selectedAdventureTag === tag && adventurePlaces.length > 0 && !isAdventureLoading) {
      return;
    }
    setSelectedAdventureTag(tag);
    setIsAdventureLoading(true);
    setAdventurePlaces([]);
    setAdventurePagination({ nextPageToken: null, hasMore: false });

    try {
      const result = await fetchPlacesByCategory(tag);
      setAdventurePlaces(result.data);
      setAdventurePagination({
        nextPageToken: result.nextPageToken,
        hasMore: result.hasMore
      });
    } catch (error) {
      setAdventurePlaces([]);
      setAdventurePagination({ nextPageToken: null, hasMore: false });
    } finally {
      setIsAdventureLoading(false);
    }
  };

  // --- PAGINATION FOR ADVENTURE PLACES ---
  const loadMoreAdventurePlaces = async () => {
    if (!adventurePagination.hasMore || isAdventureLoading) return;
    setIsAdventureLoading(true);

    try {
      const result = await fetchPlacesByCategory(selectedAdventureTag, adventurePagination.nextPageToken);

      if (result.data.length > 0) {
        // Add all new data to the state at once
        setAdventurePlaces(prev => [...prev, ...result.data]);
        setAdventurePagination({
          nextPageToken: result.nextPageToken,
          hasMore: result.hasMore
        });
      }
    } catch (error) {
      setAdventurePagination({ nextPageToken: null, hasMore: false });
    } finally {
      setIsAdventureLoading(false);
    }
  };

  // Add function to fetch paginated mountains data
  const handleMountainsTagClick = async () => {
    setIsMountainsLoading(true);
    setMountainPlaces([]);
    setMountainsPagination({ nextPageToken: null, hasMore: false });

    try {
      const result = await fetchPlacesByCategory('Mountains');
      setMountainPlaces(result.data);
      setMountainsPagination({
        nextPageToken: result.nextPageToken,
        hasMore: result.hasMore
      });
    } catch (error) {
      setMountainPlaces([]);
      setMountainsPagination({ nextPageToken: null, hasMore: false });
    } finally {
      setIsMountainsLoading(false);
    }
  };

  // PAGINATION FOR MOUNTAINS
  const loadMoreMountains = async () => {
    if (!mountainsPagination.hasMore || isMountainsLoading) return;
    setIsMountainsLoading(true);

    try {
      const result = await fetchPlacesByCategory('Mountains', mountainsPagination.nextPageToken);

      if (result.data.length > 0) {
        setMountainPlaces(prev => [...prev, ...result.data]);
        setMountainsPagination({
          nextPageToken: result.nextPageToken,
          hasMore: result.hasMore
        });
      }
    } catch (error) {
      setMountainsPagination({ nextPageToken: null, hasMore: false });
    } finally {
      setIsMountainsLoading(false);
    }
  };

  // Add function to fetch paginated view points data
  const handleViewPointsTagClick = async () => {
    setIsViewPointsLoading(true);
    setViewPointsPlaces([]);
    setViewPointsPagination({ nextPageToken: null, hasMore: false });

    try {
      const result = await fetchPlacesByCategory('View Points');
      setViewPointsPlaces(result.data);
      setViewPointsPagination({
        nextPageToken: result.nextPageToken,
        hasMore: result.hasMore
      });
    } catch (error) {
      setViewPointsPlaces([]);
      setViewPointsPagination({ nextPageToken: null, hasMore: false });
    } finally {
      setIsViewPointsLoading(false);
    }
  };

  // PAGINATION FOR VIEW POINTS
  const loadMoreViewPoints = async () => {
    if (!viewPointsPagination.hasMore || isViewPointsLoading) return;
    setIsViewPointsLoading(true);

    try {
      const result = await fetchPlacesByCategory('View Points', viewPointsPagination.nextPageToken);

      if (result.data.length > 0) {
        setViewPointsPlaces(prev => [...prev, ...result.data]);
        setViewPointsPagination({
          nextPageToken: result.nextPageToken,
          hasMore: result.hasMore
        });
      }
    } catch (error) {
      setViewPointsPagination({ nextPageToken: null, hasMore: false });
    } finally {
      setIsViewPointsLoading(false);
    }
  };

  // Loader components
  const HorizontalListLoader = ({ count = 8 }) => (
    <View style={{ paddingVertical: 10 }}>
      <SkeletonLoader
        count={count}
        circleSize={80}
        textWidth={60}
        textHeight={12}
        containerStyle={{ paddingHorizontal: 8 }}
      />
    </View>
  );

  const VerticalListLoader = ({ count = 5 }) => (
    <View style={{ padding: 10 }}>
      {Array(count).fill(0).map((_, index) => (
        <View key={index} style={{ marginBottom: 20 }}>
          <SkeletonLoader
            count={1}
            circleSize={40}
            textWidth={'100%'}
            textHeight={100}
            containerStyle={{ paddingHorizontal: 0, alignItems: 'flex-start' }}
            circleStyle={{ marginBottom: 10 }}
            textStyle={{ borderRadius: 8, height: 150 }}
          />
        </View>
      ))}
    </View>
  );

  // Render functions
  const renderVideoShorts = () => {
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

    if (isShortsLoading) {
      return (
        <View style={styles.titleSpacer}>
          <View style={styles.sectionHeader}>
            <TextDefault textColor={colors.fontMainColor} H4 bold>
              {'Shorts'}
            </TextDefault>
            <TouchableOpacity onPress={() => navigation.navigate('AllShorts')}>
              <TextDefault textColor={colors.Zypsii_color} H5>
                {'View All'}
              </TextDefault>
            </TouchableOpacity>
          </View>
          <VerticalListLoader count={3} />
        </View>
      );
    }

    if (!all_shorts || all_shorts.length === 0) {
      return (
        <View style={styles.titleSpacer}>
          <View style={styles.sectionHeader}>
            <TextDefault textColor={colors.fontMainColor} H4 bold>
              {'Shorts'}
            </TextDefault>
          </View>
          <View style={styles.emptyContainer}>
            <Icon name="videocam-outline" size={48} color={colors.fontSecondColor} />
            <TextDefault textColor={colors.fontMainColor} H5 style={{ marginTop: 10 }}>
              No shorts available
            </TextDefault>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.shortsListContainer, { height: height - 100 }]}>
        <SwiperFlatList
          data={all_shorts}
          keyExtractor={(item) => item.id}
          vertical
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height - 100}
          decelerationRate="fast"
          onChangeIndex={({ index }) => {
            // Stop all videos when swiping
            const stopVideoScript = `
              var videos = document.getElementsByTagName('video');
              for(var i = 0; i < videos.length; i++) {
                videos[i].pause();
                videos[i].currentTime = 0;
              }
            `;
            if (this.webview) {
              this.webview.injectJavaScript(stopVideoScript);
            }
          }}
          renderItem={({ item }) => {
            const videoSource = getVideoSource(item.videoUrl);
            const isValidVideo = isValidVideoUrl(item.videoUrl);

            return (
              <View style={[styles.shortItemContainer, { height: height - 100 }]}>
                <View style={styles.videoContainer}>
                  {isValidVideo && videoSource ? (
                    <View style={styles.videoWrapper}>
                      <WebView
                        source={videoSource}
                        style={[styles.videoPlayer, { height: height - 100 }]}
                        allowsFullscreenVideo={true}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        mediaPlaybackRequiresUserAction={false}
                        allowsInlineMediaPlayback={true}
                        onLoad={() => {
                          const autoPlayScript = `
                            // Remove any existing video elements
                            var existingVideos = document.getElementsByTagName('video');
                            for(var i = 0; i < existingVideos.length; i++) {
                              existingVideos[i].remove();
                            }

                            // Create new video element
                            var video = document.createElement('video');
                            video.src = '${videoSource.uri}';
                            video.style.width = '100%';
                            video.style.height = '100%';
                            video.style.objectFit = 'cover';
                            video.style.position = 'fixed';
                            video.style.top = '0';
                            video.style.left = '0';
                            video.style.right = '0';
                            video.style.bottom = '0';
                            video.style.backgroundColor = 'black';
                            video.loop = true;
                            video.muted = false;
                            video.playsInline = true;
                            video.autoplay = true;
                            video.setAttribute('loop', true);
                            video.setAttribute('playsinline', true);
                            video.setAttribute('webkit-playsinline', true);
                            video.setAttribute('x5-playsinline', true);
                            video.setAttribute('x5-video-player-type', 'h5');
                            video.setAttribute('x5-video-player-fullscreen', true);
                            video.setAttribute('x5-video-orientation', 'portraint');
                            video.removeAttribute('controls');
                            video.style.pointerEvents = 'none';

                            // Function to handle video looping
                            function handleVideoLoop() {
                              if (video.currentTime >= video.duration - 0.1) {
                                video.currentTime = 0;
                                video.play().catch(function(error) {
                                  console.log("Loop playback failed:", error);
                                });
                              }
                            }

                            // Add event listeners for better playback control
                            video.addEventListener('timeupdate', handleVideoLoop);
                            
                            video.addEventListener('ended', function() {
                              video.currentTime = 0;
                              video.play().catch(function(error) {
                                console.log("Playback failed:", error);
                              });
                            });

                            video.addEventListener('pause', function() {
                              video.play().catch(function(error) {
                                console.log("Playback failed:", error);
                              });
                            });

                            video.addEventListener('error', function(e) {
                              console.log("Video error:", e);
                              video.load();
                              video.play().catch(function(error) {
                                console.log("Playback failed:", error);
                              });
                            });

                            // Clear body and append video
                            document.body.innerHTML = '';
                            document.body.style.margin = '0';
                            document.body.style.padding = '0';
                            document.body.style.overflow = 'hidden';
                            document.body.style.backgroundColor = 'black';
                            document.body.appendChild(video);

                            // Add styles to hide all controls and play button
                            var style = document.createElement('style');
                            style.type = 'text/css';
                            style.innerHTML = \`
                              video::-webkit-media-controls { display: none !important; }
                              video::-webkit-media-controls-enclosure { display: none !important; }
                              video::-webkit-media-controls-panel { display: none !important; }
                              video::-webkit-media-controls-play-button { display: none !important; }
                              video::-webkit-media-controls-start-playback-button { display: none !important; }
                              video::-webkit-media-controls-overlay-play-button { display: none !important; }
                              video::-webkit-media-controls-timeline { display: none !important; }
                              video::-webkit-media-controls-current-time-display { display: none !important; }
                              video::-webkit-media-controls-time-remaining-display { display: none !important; }
                              video::-webkit-media-controls-time-control { display: none !important; }
                              video::-webkit-media-controls-mute-button { display: none !important; }
                              video::-webkit-media-controls-toggle-closed-captions-button { display: none !important; }
                              video::-webkit-media-controls-volume-slider { display: none !important; }
                              video::-webkit-media-controls-fullscreen-button { display: none !important; }
                              video::-webkit-media-controls-rewind-button { display: none !important; }
                              video::-webkit-media-controls-return-to-realtime-button { display: none !important; }
                              video::-webkit-media-controls-toggle-closed-captions-button { display: none !important; }
                              .play-button, .play-icon, .video-controls { display: none !important; }
                              video::--webkit-media-controls-panel { display: none !important; }
                              video::--webkit-media-controls-play-button { display: none !important; }
                              video::--webkit-media-controls-start-playback-button { display: none !important; }
                              video::--webkit-media-controls-overlay-play-button { display: none !important; }
                            \`;
                            document.head.appendChild(style);

                            // Function to ensure video plays
                            function ensurePlay() {
                              if (video.paused) {
                                video.play().catch(function(error) {
                                  console.log("Playback failed:", error);
                                  setTimeout(ensurePlay, 1000);
                                });
                              }
                            }

                            // Start playing immediately
                            video.play().catch(function(error) {
                              console.log("Initial playback failed:", error);
                              setTimeout(ensurePlay, 1000);
                            });

                            // Set up periodic check to ensure video is playing
                            setInterval(ensurePlay, 2000);

                            // Force play on user interaction
                            document.addEventListener('click', function() {
                              video.play().catch(function(error) {
                                console.log("Click playback failed:", error);
                              });
                            });

                            // Force play on touch
                            document.addEventListener('touchstart', function() {
                              video.play().catch(function(error) {
                                console.log("Touch playback failed:", error);
                              });
                            });
                          `;
                          this.webview.injectJavaScript(autoPlayScript);
                        }}
                        ref={(ref) => (this.webview = ref)}
                        onError={(syntheticEvent) => {
                          const { nativeEvent } = syntheticEvent;
                          console.warn('WebView error: ', nativeEvent);
                        }}
                        renderLoading={() => (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.btncolor} />
                          </View>
                        )}
                      />
                    </View>
                  ) : (
                    <View style={styles.errorContainer}>
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={[styles.thumbnailImage, { height: height }]}
                        resizeMode="cover"
                      />
                      <View style={styles.errorMessageContainer}>
                        <TextDefault textColor={colors.white} H6>
                          {!item.videoUrl ? 'No video available' : 'Unsupported video format'}
                        </TextDefault>
                      </View>
                    </View>
                  )}
                </View>

                {/* Right side interaction buttons */}
                <View style={styles.interactionButtonsContainer}>
                  <TouchableOpacity style={styles.interactionButton}>
                    <Icon name="heart-outline" size={28} color={colors.white} />
                    <TextDefault textColor={colors.white} H6 style={styles.interactionCount}>
                      {item.likesCount}
                    </TextDefault>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.interactionButton}>
                    <Icon name="chatbubble-outline" size={28} color={colors.white} />
                    <TextDefault textColor={colors.white} H6 style={styles.interactionCount}>
                      {item.commentsCount}
                    </TextDefault>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.interactionButton}>
                    <Icon name="share-social-outline" size={28} color={colors.white} />
                    <TextDefault textColor={colors.white} H6 style={styles.interactionCount}>
                      {item.shareCount || 0}
                    </TextDefault>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.interactionButton}>
                    <Icon name="bookmark-outline" size={28} color={colors.white} />
                  </TouchableOpacity>
                </View>

                {/* Video info overlay */}
                <View style={[styles.videoInfoOverlay, { bottom: 20, left: 15, right: 15 }]}>
                  <View style={[styles.userInfoContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                    <View style={[styles.userInfo, { flex: 1, marginRight: 10 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Image
                          source={{ uri: item.createdBy?.profilePicture || 'https://via.placeholder.com/40' }}
                          style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#ccc' }}
                          resizeMode="cover"
                        />
                        <TextDefault textColor={colors.white} H6 numberOfLines={1}>
                          {item.createdBy?.userName || item.createdBy?.username || 'User'}
                        </TextDefault>
                      </View>
                      <TextDefault textColor={colors.white} H5 bold numberOfLines={2} style={[styles.videoTitle, { marginBottom: 8 }]}>
                        {item.title}
                      </TextDefault>
                      <TextDefault textColor={colors.white} H6 numberOfLines={2} style={[styles.videoDescription, { marginBottom: 12 }]}>
                        {item.description}
                      </TextDefault>
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
                        <View style={[styles.followButtonContainer, { marginLeft: 10 }]}>
                          <FollowButton userId={item.createdBy} />
                        </View>
                      ) : null;
                    })()}
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  };

  const renderScheduleContainer = () => {
    if (!all_schedule || all_schedule.length === 0) {
      return (
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleheadContainer}>
            <TextDefault textColor={colors.fontMainColor} H5 bold>
              {'Schedule'}
            </TextDefault>
            <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
              <TextDefault textColor={colors.Zypsii_color} H5>
                {'View All'}
              </TextDefault>
            </TouchableOpacity>
          </View>
          <TextDefault style={{ marginLeft: 20, color: colors.fontSecondColor }}>
            No schedule available
          </TextDefault>
        </View>
      );
    }

    return (
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleheadContainer}>
          <TextDefault textColor={colors.fontMainColor} H5 bold>
            {'Schedule'}
          </TextDefault>
          <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
            <TextDefault textColor={colors.Zypsii_color} H5>
              {'View All'}
            </TextDefault>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          data={all_schedule}
          renderItem={({ item }) => (
            <View style={{ marginRight: 0 }}>
              <AllSchedule item={item} />
            </View>
          )}
        />
      </View>
    );
  };

  const renderVerticalScheduleList = () => {
    if (!all_schedule || all_schedule.length === 0) {
      return (
        <View style={styles.scheduleContainer}>
          <View style={styles.sectionHeader}>
            <TextDefault textColor={colors.fontMainColor} H5 bold>
              {'Schedule'}
            </TextDefault>
            <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
              <TextDefault textColor={colors.Zypsii_color} H5>
                {'View All'}
              </TextDefault>
            </TouchableOpacity>
          </View>
          <TextDefault style={{ marginLeft: 20, color: colors.fontSecondColor }}>
            No schedule available
          </TextDefault>
        </View>
      );
    }

    return (
      <View style={styles.titleSpacerdesti}>
        <View style={styles.sectionHeader}>
          <TextDefault textColor={colors.fontMainColor} H5 bold>
            {'Schedule'}
          </TextDefault>
          <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
            <TextDefault textColor={colors.Zypsii_color} H5>
              {'View All'}
            </TextDefault>
          </TouchableOpacity>
        </View>

        <FlatList
          vertical
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          data={all_schedule}

          renderItem={({ item }) => (
            <AllSchedule item={item} />
          )}
        />
      </View>
    );
  };

  //Changed to Outdoors and adventure
  const renderDiscoverByNearest = () => (
    <View style={styles.titleSpacerdesti}>
      <View className="sectionHeader" style={styles.sectionHeader}>
        <TextDefault textColor={colors.fontMainColor} H5 bold>
          {'Outdoors and adventure'}
        </TextDefault>
        <TouchableOpacity onPress={() => navigation.navigate('CombinedDestinations', { 
          outDoorTag: selectedAdventureTag,
          places: adventurePlaces,
          category: selectedAdventureTag
        })}>
          <TextDefault textColor={colors.Zypsii_color} H5>View All</TextDefault>
        </TouchableOpacity>
      </View>
      {/* TAGS ROW */}
      <FlatList
        data={outdoorsAndAdventureTags}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={{ paddingHorizontal: 8, marginBottom: 10 }}
        renderItem={({ item: tag }) => {
          // Get appropriate icon for each category
          const getCategoryIcon = (category) => {
            switch (category) {
              case 'Beach':
                return <Ionicons name="water" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Adventure':
                return <MaterialIcons name="explore" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Mountains':
                return <MaterialIcons name="landscape" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Hiking':
                return <MaterialIcons name="hiking" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Trekking':
                return <MaterialIcons name="directions-walk" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'View Points':
                return <MaterialIcons name="visibility" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'National Parks':
                return <MaterialIcons name="park" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Wildlife':
                return <MaterialIcons name="pets" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Cultural Sites':
                return <MaterialIcons name="museum" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Historical Places':
                return <MaterialIcons name="history" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Waterfalls':
                return <Ionicons name="water" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Lakes':
                return <Ionicons name="water" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Forests':
                return <MaterialIcons name="forest" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Caves':
                return <MaterialIcons name="terrain" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Temples':
                return <MaterialIcons name="church" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Museums':
                return <MaterialIcons name="museum" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Gardens':
                return <MaterialIcons name="local-florist" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              case 'Rivers':
                return <Ionicons name="water" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
              default:
                return <MaterialIcons name="place" size={16} color={selectedAdventureTag === tag ? colors.white : colors.fontMainColor} />;
            }
          };

          return (
            <TouchableOpacity
              style={{
                backgroundColor: selectedAdventureTag === tag ? colors.Zypsii_color : '#f2f2f2',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 36,
              }}
              onPress={() => handleAdventureTagClick(tag)}
            >
              {getCategoryIcon(tag)}
              <Text style={{ 
                color: selectedAdventureTag === tag ? colors.white : colors.fontMainColor, 
                fontSize: 15,
                marginLeft: 6,
                fontWeight: '500'
              }}>
                {tag}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      {/* PLACES LIST */}
      {selectedAdventureTag ? (
        isAdventureLoading && adventurePlaces.length === 0 ? (
          <HorizontalListLoader count={8} />
        ) : adventurePlaces.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <TextDefault textColor={colors.fontSecondColor} H5>
              No places found for {selectedAdventureTag}
            </TextDefault>
          </View>
        ) : (
          <FlatList
            data={adventurePlaces}
            keyExtractor={(item) => item._id}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Destination', {
                      placeId: item.placeId || item._id || item.id || item.name
                    })}
                    activeOpacity={0.8}
                  >
                    <DiscoverByNearest
                      styles={styles.itemCardContainer}
                      id={item._id || item.id || item.placeId}
                      placeId={item.placeId || item._id || item.id || item.name}
                      title={item.name}
                      name={item.name}
                      subtitle={item.address || (item.location?.address) || 'No address available'}
                      address={item.address || (item.location?.address) || 'No address available'}
                      image={item.images?.[0]?.url || item.photo || item.image}
                      rating={parseFloat(item.rating) || 0}
                      distance={item.distanceInKilometer || item.distance}
                      location={item.location}
                    />
                  </TouchableOpacity>
            )}
            onEndReached={adventurePagination.hasMore ? loadMoreAdventurePlaces : undefined}
            onEndReachedThreshold={0.2}
            ListFooterComponent={() => (
              adventurePagination.hasMore && isAdventureLoading ? (
                <View style={{ padding: 10 }}>
                  <ActivityIndicator size="small" color={colors.btncolor} />
                </View>
              ) : null
            )}
          />
        )
      ) : (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <TextDefault textColor={colors.fontSecondColor} H5>
            Select a tag to explore places
          </TextDefault>
        </View>
      )}
    </View>
  );

  //Changed to Mountains
  const renderBestDestination = () => (
    <View style={styles.titleSpacerdesti}>
      <View style={styles.sectionHeader}>
        <TextDefault textColor={colors.fontMainColor} H5 bold>
          {'Mountains'}
        </TextDefault>
        <TouchableOpacity onPress={() => navigation.navigate('CombinedDestinations', { 
          outDoorTag: 'Mountains',
          places: mountainPlaces,
          category: 'Mountains'
        })}>
          <TextDefault textColor={colors.Zypsii_color} H5>View All</TextDefault>
        </TouchableOpacity>
      </View>

      {isMountainsLoading && mountainPlaces.length === 0 ? (
        renderInitialLoading()
      ) : (
        <View>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item.id}
            data={mountainPlaces}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Destination', {
                  placeId: item.placeId || item._id || item.id
                })}
                activeOpacity={0.8}
              >
                <DiscoverByNearest
                  styles={styles.itemCardContainer}
                  id={item._id || item.id}
                  placeId={item.placeId}
                  image={item.images?.[0]?.url || item.photo || item.image}
                  title={item.name}
                  name={item.name}
                  subtitle={item.address || (item.location?.address) || 'No address available'}
                  address={item.address || (item.location?.address) || 'No address available'}
                  rating={parseFloat(item.rating) || 0}
                  distance={item.distanceInKilometer || item.distance}
                  location={item.location}
                />
              </TouchableOpacity>
            )}
            onEndReached={loadMoreMountains}
            onEndReachedThreshold={0.2}
            ref={(ref) => (this.bestDestinationListRef = ref)}
            ListHeaderComponent={() => (
              isMountainsLoading ? (
                <View style={{ flexDirection: 'row', marginRight: 10 }}>
                  {[1, 2, 3, 4].map((_, index) => (
                    <View key={index} style={{ marginRight: 10 }}>
                      <CardSkeletonLoader />
                    </View>
                  ))}
                </View>
              ) : null
            )}
          />
        </View>
      )}
    </View>
  );

  // Add a custom skeleton loader component
  const CardSkeletonLoader = () => (
    <View style={{ width: 160, height: 200, backgroundColor: '#f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
      {/* Image placeholder */}
      <View style={{ width: '100%', height: 120, backgroundColor: '#e0e0e0' }} />
      {/* Title placeholder */}
      <View style={{ padding: 8 }}>
        <View style={{ width: '80%', height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
        {/* Rating and distance placeholders */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '40%', height: 12, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
          <View style={{ width: '40%', height: 12, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
        </View>
      </View>
    </View>
  );

  // Modify the initial loading state to use the new skeleton loader
  const renderInitialLoading = () => (
    <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
        <View key={index} style={{ marginRight: 10 }}>
          <CardSkeletonLoader />
        </View>
      ))}
    </View>
  );

  //Changed to render View Points details
  const renderAllDestination = () => (
    <View style={styles.titleSpacerdesti}>
      <View style={styles.sectionHeader}>
        <TextDefault textColor={colors.fontMainColor} H5 bold>
          {'View Points'}
        </TextDefault>
        <TouchableOpacity onPress={() => navigation.navigate('CombinedDestinations', { 
          outDoorTag: 'View Points',
          places: viewPointsPlaces,
          category: 'View Points'
        })}>
          <TextDefault textColor={colors.Zypsii_color} H5>View All</TextDefault>
        </TouchableOpacity>
      </View>

      {isViewPointsLoading && viewPointsPlaces.length === 0 ? (
        // console.log(viewPointsPlaces, null, 2),
        renderInitialLoading()
      ) : (
        <View>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item.id}
            data={viewPointsPlaces}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Destination', {
                  placeId: item.placeId || item._id || item.id
                })}
                activeOpacity={0.8}
              >
                <DiscoverByNearest
                  styles={styles.itemCardContainer}
                  id={item._id || item.id}
                  placeId={item.placeId}
                  image={item.images?.[0]?.url || item.photo || item.image}
                  title={item.name}
                  name={item.name}
                  subtitle={item.address || (item.location?.address) || 'No address available'}
                  address={item.address || (item.location?.address) || 'No address available'}
                  rating={parseFloat(item.rating) || 0}
                  distance={item.distanceInKilometer || item.distance}
                  location={item.location}
                />
              </TouchableOpacity>
            )}
            onEndReached={loadMoreViewPoints}
            onEndReachedThreshold={0.2}
            ref={(ref) => (this.viewPointsListRef = ref)}
            ListHeaderComponent={() => (
              isViewPointsLoading ? (
                <View style={{ flexDirection: 'row', marginRight: 10 }}>
                  {[1, 2, 3, 4].map((_, index) => (
                    <View key={index} style={{ marginRight: 10 }}>
                      <CardSkeletonLoader />
                    </View>
                  ))}
                </View>
              ) : null
            )}
          />
        </View>
      )}
    </View>
  );

  const renderItem = ({ item }) => {
    return (
      <Post item={item} isVisible={visiblePostIds.has(item._id)} />
    );
  };

  const renderPosts = () => {
    return (
      <View>
        {/* <TextDefault textColor={colors.fontMainColor} style={styles.titleSpacer}H4>
          {'Posts'}
        </TextDefault> */}
        {isPostsLoading ? (
          <VerticalListLoader count={5} />
        ) : all_posts.length > 0 ? (
          <FlatList
            data={all_posts}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
            onViewableItemsChanged={onPostsViewableItemsChanged}
            viewabilityConfig={postsViewabilityConfig}
            initialNumToRender={6}
            extraData={visiblePostIds}
          />
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <TextDefault textColor={colors.fontSecondColor} H5>
              No posts available
            </TextDefault>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (selectedButton) {
      case 'Shorts':
        return isShortsLoading ? (
          <VerticalListLoader count={3} />
        ) : (
          renderVideoShorts()
        );
      case 'Schedule':
        return isScheduleLoading ? (
          <VerticalListLoader count={5} />
        ) : (
          renderVerticalScheduleList()
        );
      case 'Posts':
        return isPostsLoading ? (
          <VerticalListLoader count={5} />
        ) : (
          renderPosts()
        );
      case 'All':
      default:
        return (
          <>
            {isScheduleLoading ? (
              <HorizontalListLoader count={5} />
            ) : (
              renderScheduleContainer()
            )}

            {isNearestLoading ? (
              <HorizontalListLoader count={8} />
            ) : (
              renderDiscoverByNearest()
            )}
            {isMountainsLoading ? (
              <HorizontalListLoader count={8} />
            ) : (
              renderBestDestination()
            )}
            {renderAllDestination()}
          </>
        );
    }
  };

  // Mark all notifications as read when notification icon is pressed
  const handleNotificationPress = async () => {
    // try {
    //   const accessToken = await AsyncStorage.getItem('accessToken');
    //   if (!accessToken) return;
    //   // Call your backend to mark all as read (if available), otherwise just set to 0 locally
    //   // Example: await fetch(`${base_url}/user/markAllNotificationsRead`, { ... })
    //   setUnreadNotifications(0);
    //   navigation.navigate('Notification');
    // } catch (error) {
    //   console.error('Error marking notifications as read:', error);
    navigation.navigate('Notification');
    // }
  };

  // Memoize the renderHeader function to prevent unnecessary re-renders
  const renderHeader = useMemo(() => (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.locationWrapper}>
          <View style={styles.locationContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.locationImage}
            />
            <TextDefault style={styles.locationText} H5 bold>Zypsii</TextDefault>
          </View>
        </View>
        <View style={styles.rightIconsContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SearchPage')}
            style={styles.notificationIconWrapper}
          >
            <MaterialIcons
              name="search"
              size={28}
              color="#000"
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MessageList')}
            style={styles.notificationIconWrapper}
          >
            <MaterialIcons
              name="forum"
              size={28}
              color="#000"
              style={[styles.icon, { marginRight: 5 }]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNotificationPress}
            style={styles.notificationIconWrapper}
          >
            <MaterialIcons
              name="notifications-none"
              size={28}
              color="#000"
              style={styles.notificationIcon}
            />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Stories key="stories-component" />

      <View style={styles.buttonContainer}>
        {buttons.map(button => (
          <TouchableOpacity
            key={button}
            style={[
              styles.button,
              selectedButton === button && styles.selectedButton
            ]}
            onPress={() => {
              if (button === 'Shorts') {
                navigation.navigate('Shorts');
              } else {
                setSelectedButton(button);
              }
            }}
          >
            <TextDefault
              style={[
                styles.buttonText,
                selectedButton === button && styles.selectedButtonText
              ]}
            >
              {button}
            </TextDefault>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
    </>
  ), [selectedButton, unreadNotifications, isScheduleLoading, isNearestLoading, isMountainsLoading, isViewPointsLoading, isPostsLoading, isShortsLoading, all_schedule, discoverbynearest, mountainPlaces, viewPointsPlaces, all_posts, all_shorts, adventurePlaces, selectedAdventureTag]);

  useStatusBar(colors.Zypsii_color, 'light-content');

  // Function to handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh all data including schedules
      await fetchAllData();
      // Also refresh notifications
      await fetchUnreadNotifications();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <>
  
    <SafeAreaView style={[styles.flex, styles.safeAreaStyle]}>
      <View style={[styles.grayBackground, styles.flex]}>
        <View style={[styles.contentContainer, { paddingBottom: 50 }]}>
          <FlatList
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            data={[]}
            renderItem={() => null}
            ListEmptyComponent={null}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.btncolor]}
                tintColor={colors.btncolor}
              />
            }
          />
        </View>
        
      </View>
      <FloatingSupportButton onPress={useCallback(() => setIsChatVisible(true), [])} />
      <ChatSupport
        visible={isChatVisible}
        onClose={useCallback(() => setIsChatVisible(false), [])}
      />
    </SafeAreaView>
    <BottomTab screen="HOME" />
    </>
  );
}

export default MainLanding;
