import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, Image, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Modal, Animated, StatusBar, NativeModules, Dimensions } from 'react-native';
import styles from './styles';
import BottomTab from '../../components/BottomTab/BottomTab';
import { MaterialIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import { colors } from '../../utils';
import MainBtn from '../../ui/Buttons/MainBtn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';
import { useToast } from '../../context/ToastContext';
import { WebView } from 'react-native-webview';
import DiscoverByNearest from '../../components/DiscoverByNearest/DiscoverByNearest';
import Video from 'react-native-video';
import RecommendCard from '../../components/Recommendation/RecommendCard';

const Destination = ({ route, navigation }) => {
  const { showToast } = useToast();
  const { width } = Dimensions.get('window');
  
  // Ensure route params exist
  const params = route?.params || {};
  const { placeId } = params;

  // State for place details
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for featured guides
  const [featuredGuides, setFeaturedGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [guidesError, setGuidesError] = useState(null);
  const [guidesPage, setGuidesPage] = useState(1);
  const [guidesHasMore, setGuidesHasMore] = useState(true);
  const GUIDES_LIMIT = 10;

  // State for nearby places
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyOffset, setNearbyOffset] = useState(0);
  const [nearbyHasMore, setNearbyHasMore] = useState(true);
  const NEARBY_LIMIT = 8;

  // State for Wikipedia modal
  const [wikipediaModalVisible, setWikipediaModalVisible] = useState(false);

  // State for photo viewer modal
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // State for YouTube videos
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubePageToken, setYoutubePageToken] = useState('');
  const [youtubeHasMore, setYoutubeHasMore] = useState(true);
  const YOUTUBE_LIMIT = 10;

  // Shorts by Location Pagination
  const [shortsByLocation, setShortsByLocation] = useState([]);
  const [shortsLoading, setShortsLoading] = useState(false);
  const [shortsLimit] = useState(10);
  const [shortsOffset, setShortsOffset] = useState(0);
  const [shortsHasMore, setShortsHasMore] = useState(true);
  const [shortsTotal, setShortsTotal] = useState(0);
  const [shortsThumbs, setShortsThumbs] = useState({}); // id -> thumbnail uri

  const generateThumbnail = async (videoUrl, timeMs) => {
    try {
      const Module = await import('expo-video-thumbnails');
      if (!Module || typeof Module.getThumbnailAsync !== 'function') {
        return null;
      }
      const result = await Module.getThumbnailAsync(String(videoUrl), { time: timeMs });
      return result?.uri || null;
    } catch (_e) {
      return null;
    }
  };

  const hasThumbsNativeModule = useMemo(() => {
    try {
      return !!(NativeModules && NativeModules.ExpoVideoThumbnails);
    } catch (_e) {
      return false;
    }
  }, []);

  // State for suggested itinerary
  const [itinerary, setItinerary] = useState(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState(null);

  // State for category places
  const [categoryPlaces, setCategoryPlaces] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState(null);

  // State for top searches
  const [topSearches, setTopSearches] = useState([]);
  const [topSearchesLoading, setTopSearchesLoading] = useState(false);
  const [topSearchesError, setTopSearchesError] = useState(null);

  // Outdoors and adventure tags for category filtering
  const outdoorsAndAdventureTags = [
    'Beach', 'Adventure', 'Mountains', 'Hiking', 'Trekking',
    'View Points', 'National Parks', 'Wildlife', 'Cultural Sites',
    'Historical Places', 'Waterfalls', 'Lakes', 'Forests',
    'Caves', 'Temples', 'Museums', 'Gardens', 'Rivers'
  ];

  // Build 3-row columns for horizontally scrolling chips
  const CHIP_ROWS = 3;
  const chipColumns = useMemo(() => {
    const tags = outdoorsAndAdventureTags || [];
    const columns = [];
    for (let i = 0; i < tags.length; i += CHIP_ROWS) {
      columns.push(tags.slice(i, i + CHIP_ROWS));
    }
    return columns;
  }, [outdoorsAndAdventureTags]);

  // State for reviews pagination
  const [reviewPage, setReviewPage] = useState(0);
  const REVIEWS_PER_PAGE = 3;

  // Category places state
  const [categoryModalCategory, setCategoryModalCategory] = useState('Beach'); // default

  // Animation for booming (pulsing) effect
  const boomAnim = useState(new Animated.Value(1))[0];

  // State for description expand/collapse
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);

  // Reset description collapse state when description changes
  useEffect(() => {
    setShowFullDescription(false);
    setIsDescriptionTruncated(false);
  }, [placeDetails?.description]);

  useEffect(() => {
    if (placeDetails?.wikipedia) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(boomAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(boomAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [placeDetails?.wikipedia]);

  // Fetch place details using the new API
  const fetchPlaceDetails = async () => {
    console.log('Destination fetchPlaceDetails - placeId:', placeId);
    console.log('Destination fetchPlaceDetails - route params:', route?.params);
    
    if (!placeId) {
      console.error('No place ID provided to Destination component');
      setError('No place ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Authentication required');
      }

      const url = `${base_url}/schedule/places/full-place-detail/${placeId}`;
      console.log('Fetching place details from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        console.error('API response error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setPlaceDetails(data.data);
      } else {
        console.error('API response indicates failure:', data);
        throw new Error(data.message || 'Failed to fetch place details');
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      setError(error.message);
      showToast('Failed to load place details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch nearby places with new API and pagination
  const fetchNearbyPlaces = async (reset = false) => {
    if (!placeDetails?.geometry?.location) return;
    if (nearbyLoading) return;
    setNearbyLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const lat = placeDetails.geometry.location.lat;
      const lng = placeDetails.geometry.location.lng;
      const offset = reset ? 0 : nearbyOffset;
      const url = `${base_url}/schedule/places/nearby-places?location=${lat},${lng}&limit=${NEARBY_LIMIT}&offset=${offset}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        let newPlaces = reset ? result.data : [...nearbyPlaces, ...result.data];
        // Remove current place and duplicates
        const seen = new Set();
        newPlaces = newPlaces.filter(item => {
          if (!item.placeId || item.placeId === placeDetails.placeId) return false;
          if (seen.has(item.placeId)) return false;
          seen.add(item.placeId);
          return true;
        });
        setNearbyPlaces(newPlaces);
        setNearbyOffset(offset + result.data.length);
        setNearbyHasMore(result.data.length === NEARBY_LIMIT);
      } else {
        setNearbyHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    } finally {
      setNearbyLoading(false);
    }
  };

  // Fetch YouTube videos
  const fetchYoutubeVideos = async (reset = false) => {
    try {
      if (!placeDetails) {
        return;
      }

      const placeId = placeDetails.id || placeDetails._id;
      if (!placeId) {
        return;
      }

      if (youtubeLoading) {
        return;
      }
      
      setYoutubeLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const url = `${base_url}/youtube-video-list-users/${placeId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // API returns: { success: true, data: [...], message: 'Video retrieved successfully' }
      if (!data || data.success !== true || !Array.isArray(data.data)) {
        throw new Error(data?.message || 'Failed to fetch videos');
      }

      const videos = data.data;
      if (reset) {
        setYoutubeVideos(videos);
      } else {
        setYoutubeVideos(prev => [...prev, ...videos]);
      }

      // No explicit pagination info provided by API; assume no more pages
      setYoutubePageToken('');
      setYoutubeHasMore(false);
    } catch (error) {
      console.error('Error in fetchYoutubeVideos:', error);
      setYoutubeVideos([]);
      setYoutubeHasMore(false);
    } finally {
      setYoutubeLoading(false);
    }
  };

  // Fetch Shorts by Location with limit/offset
  const fetchShortsByLocation = async (reset = false) => {
    if (!placeDetails?.geometry?.location) return;
    setShortsLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const lat = placeDetails.geometry.location.lat;
      const lng = placeDetails.geometry.location.lng;
      const limit = shortsLimit;
      const offset = reset ? 0 : shortsOffset;
      const url = `${base_url}/shorts/list-based-location?placeLatitude=${lat}&placeLongitude=${lng}&limit=${limit}&offset=${offset}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.status && Array.isArray(data.data)) {
        const incoming = data.data;
        // Update list immediately for UI responsiveness
        setShortsByLocation(reset ? incoming : prev => [...prev, ...incoming]);

        // Generate thumbnails in background (non-blocking)
        (async () => {
          try {
            await Promise.all(incoming.map(async (s) => {
              const id = s._id || s.id;
              const videoUrl = s.videoUrl || s.video;
              if (!id || !videoUrl) return;
              if (shortsThumbs[id]) return; // already generated
              if (!isValidVideoUrl(String(videoUrl))) return;
              if (!hasThumbsNativeModule) return; // skip if native module not available
              const randomMs = 1500 + Math.floor(Math.random() * 1500); // 1500-3000ms
              const thumb1 = await generateThumbnail(videoUrl, randomMs);
              if (thumb1) {
                setShortsThumbs(prev => ({ ...prev, [id]: thumb1 }));
                return;
              }
              const thumb2 = await generateThumbnail(videoUrl, 1000);
              if (thumb2) {
                setShortsThumbs(prev => ({ ...prev, [id]: thumb2 }));
              }
            }));
          } catch (_e) {
            // swallow any unexpected errors
          }
        })();
        setShortsOffset(offset + data.data.length);
        setShortsHasMore(data.hasMore);
        setShortsTotal(data.total || 0);
      } else {
        if (reset) setShortsByLocation([]);
        setShortsHasMore(false);
      }
    } catch (error) {
      if (reset) setShortsByLocation([]);
      setShortsHasMore(false);
    } finally {
      setShortsLoading(false);
    }
  };

  // Fetch suggested itinerary for this place
  const fetchSuggestedItinerary = async () => {
    if (!placeDetails?.name) return;
    setItineraryLoading(true);
    setItineraryError(null);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const url = `${base_url}/schedule/places/suggestedItinerary?searchPlaceName=${encodeURIComponent(placeDetails.name)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setItinerary(data.data);
      } else {
        setItinerary(null);
        setItineraryError(data.message || 'No itinerary found');
      }
    } catch (err) {
      setItinerary(null);
      setItineraryError('Failed to load suggested itinerary');
    } finally {
      setItineraryLoading(false);
    }
  };

  // Fetch featured guides
  const fetchFeaturedGuides = async (reset = false) => {
    // Get the correct placeId from the route params or placeDetails
    const currentPlaceId = placeId || placeDetails?.id || placeDetails?._id;
    
    if (!currentPlaceId) {
      return;
    }
    
    if (guidesLoading) {
      return;
    }
    
    try {
      setGuidesLoading(true);
      setGuidesError(null);
      
      const page = reset ? 1 : guidesPage;
      const accessToken = await AsyncStorage.getItem('accessToken');
      const url = `${base_url}/featured-guides/user/for-places?placeId=${currentPlaceId}&page=${page}&limit=${GUIDES_LIMIT}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status && Array.isArray(data.data)) {
        setFeaturedGuides(prev => reset ? data.data : [...prev, ...data.data]);
        setGuidesPage(page + 1);
        setGuidesHasMore(data.pagination.hasMore);
      } else {
        if (reset) setFeaturedGuides([]);
        setGuidesHasMore(false);
        setGuidesError(data.message || 'No featured guides found');
      }
    } catch (error) {
      console.error('Error fetching featured guides:', error);
      if (reset) setFeaturedGuides([]);
      setGuidesError('Failed to load featured guides');
    } finally {
      setGuidesLoading(false);
    }
  };

  // Update useEffect to trigger when place details are loaded
  useEffect(() => {
    // Only fetch videos when we have the MongoDB _id
    const placeId = placeDetails?.id || placeDetails?._id;
    if (placeId) {
      setYoutubeVideos([]);
      setYoutubePageToken(1);
      setYoutubeHasMore(true);
      fetchYoutubeVideos(true);
    }
  }, [placeDetails]); // Watch the entire placeDetails object

  // Fetch nearby places when placeDetails.geometry.location changes
  useEffect(() => {
    if (placeDetails?.geometry?.location) {
      setNearbyPlaces([]);
      setNearbyOffset(0);
      setNearbyHasMore(true);
      fetchNearbyPlaces(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeDetails?.geometry?.location]);

  // Fetch shorts when placeDetails.geometry.location changes
  useEffect(() => {
    if (placeDetails?.geometry?.location) {
      setShortsOffset(0);
      fetchShortsByLocation(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeDetails?.geometry?.location]);

  // Fetch itinerary when placeDetails is loaded
  useEffect(() => {
    if (placeDetails?.name) {
      fetchSuggestedItinerary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeDetails?.name]);

  // Fetch featured guides when placeDetails is loaded
  useEffect(() => {
    if (placeId) {
      setGuidesPage(1); // Reset pagination
      setFeaturedGuides([]); // Clear existing guides
      fetchFeaturedGuides(true); // Force reset
    }
  }, [placeId]); // Only depend on placeId

  // Fetch places by category when category changes or place details are loaded
  useEffect(() => {
    if (categoryModalCategory && placeDetails?.geometry?.location) {
      const fetchCategoryPlaces = async () => {
        try {
          setCategoryLoading(true);
          setCategoryError(null);
          const accessToken = await AsyncStorage.getItem('accessToken');
          const { lat, lng } = placeDetails.geometry.location;
          const url = `${base_url}/schedule/listing/search?searchCategories=${encodeURIComponent(categoryModalCategory)}&latitude=${lat}&longitude=${lng}`;

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();
          if (data.status && Array.isArray(data.data)) {
            setCategoryPlaces(data.data);
          } else {
            setCategoryPlaces([]);
            setCategoryError(data.message || 'No places found');
          }
        } catch (error) {
          console.error('Error fetching category places:', error);
          setCategoryPlaces([]);
          setCategoryError('Failed to load places');
        } finally {
          setCategoryLoading(false);
        }
      };

      fetchCategoryPlaces();
    }
  }, [categoryModalCategory, placeDetails?.geometry?.location]);

  // Fetch top searches
  const fetchTopSearches = async () => {
    try {
      // Require place location to fetch top searches
      const lat = placeDetails?.geometry?.location?.lat;
      const lng = placeDetails?.geometry?.location?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return;
      }

      setTopSearchesLoading(true);
      setTopSearchesError(null);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const url = `${base_url}/schedule/places/top-search?latitude=${lat}&longitude=${lng}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setTopSearches(data.data);
      } else {
        setTopSearches([]);
        setTopSearchesError(data.message || 'No top searches found');
      }
    } catch (error) {
      console.error('Error fetching top searches:', error);
      setTopSearches([]);
      setTopSearchesError('Failed to load top searches');
    } finally {
      setTopSearchesLoading(false);
    }
  };

  // Fetch top searches when we have place location
  useEffect(() => {
    if (placeDetails?.geometry?.location) {
      fetchTopSearches();
    }
  }, [placeDetails?.geometry?.location]);

  // Load more shorts on scroll
  const loadMoreShorts = () => {
    if (!shortsHasMore || shortsLoading) return;
    fetchShortsByLocation(false);
  };

  useEffect(() => {
    fetchPlaceDetails();
  }, [placeId]);

  const backPressed = () => {
    navigation.goBack();
  };

  const handleOpenMap = () => {
    if (placeDetails?.map_url) {
      Linking.openURL(placeDetails.map_url);
    } else if (placeDetails?.geometry?.location) {
      const { lat, lng } = placeDetails.geometry.location;
      const url = `https://maps.google.com/?q=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  const handleViewAll = (suggestion) => {
    navigation.navigate('PlaceDetails', {
      places: suggestion.places,
      isAllPlaces: true
    });
  };

  const handleMakeSchedule = () => {
    navigation.navigate('MakeSchedule', {
      destinationData: {
        id: placeId,
        name: placeDetails?.name || 'Unknown Place',
        image: placeDetails?.photos?.[0]?.url || placeDetails?.image || '',
        subtitle: placeDetails?.address || 'No address available',
        rating: placeDetails?.rating || '0',
        distance: 'N/A',
        description: placeDetails?.editorial_summary || '',
        tolatitude: placeDetails?.geometry?.location?.lat,
        tolongitude: placeDetails?.geometry?.location?.lng,
        nearbyPlaces: nearbyPlaces
      }
    });
  };

  const handleNearbyPlacePress = (place) => {
    navigation.navigate('Destination', { placeId: place.placeId });
  };

  const handleCategoryPlacePress = (place) => {
    // Navigate to Destination page instead of opening modal
    navigation.navigate('Destination', { placeId: place.id || place.placeId });
  };

  // Add new handler for top searches
  const handleTopSearchPress = (place) => {
    // For top searches, we use _id instead of placeId
    navigation.navigate('Destination', { placeId: place._id });
  };

  // Wikipedia modal component
  const WikipediaModal = () => (
    <Modal
      visible={wikipediaModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setWikipediaModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {placeDetails?.wikipedia?.title || 'Wikipedia'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setWikipediaModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.fontMainColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.wikipediaInfoContainer}>
              {placeDetails?.wikipedia?.websiteUrl ? (
                <View style={{ flex: 1, height: 400, marginTop: 16 }}>
                  <WebView
                    source={{ uri: placeDetails.wikipedia.websiteUrl }}
                    style={{ flex: 1, borderRadius: 10, overflow: 'hidden' }}
                    startInLoadingState={true}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Photo viewer modal component
  const PhotoViewerModal = () => {
    const photos = placeDetails?.photos || [];
    const currentPhoto = photos[selectedPhotoIndex];
    const scrollViewRef = useRef(null);

    const handlePreviousPhoto = () => {
      if (selectedPhotoIndex > 0) {
        const newIndex = selectedPhotoIndex - 1;
        setSelectedPhotoIndex(newIndex);
        // Use setTimeout to ensure state update happens before scroll
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: newIndex * width,
            animated: true
          });
        }, 50);
      }
    };

    const handleNextPhoto = () => {
      if (selectedPhotoIndex < photos.length - 1) {
        const newIndex = selectedPhotoIndex + 1;
        setSelectedPhotoIndex(newIndex);
        // Use setTimeout to ensure state update happens before scroll
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: newIndex * width,
            animated: true
          });
        }, 50);
      }
    };

    const handleThumbnailPress = (index) => {
      setSelectedPhotoIndex(index);
      // Use setTimeout to ensure state update happens before scroll
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: index * width,
          animated: true
        });
      }, 50);
    };

    const handleScroll = (event) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffset / width);
      if (index !== selectedPhotoIndex && index >= 0 && index < photos.length) {
        setSelectedPhotoIndex(index);
      }
    };

    // Reset scroll position when modal opens
    useEffect(() => {
      if (photoModalVisible && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: selectedPhotoIndex * width,
            animated: false
          });
        }, 100);
      }
    }, [photoModalVisible, selectedPhotoIndex]);

    return (
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.photoModalOverlay}>
          <View style={styles.photoModalContainer}>
            {/* Header with close button and photo counter */}
            <View style={styles.photoModalHeader}>
              <TouchableOpacity
                style={styles.photoCloseButton}
                onPress={() => setPhotoModalVisible(false)}
              >
                <Ionicons name="close" size={28} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.photoCounter}>
                {selectedPhotoIndex + 1} / {photos.length}
              </Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Main photo display */}
            <View style={styles.photoDisplayContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.photoScrollContainer}
                decelerationRate="fast"
                snapToInterval={width}
                snapToAlignment="start"
                bounces={false}
              >
                {photos.map((photo, index) => (
                  <View key={index} style={styles.fullPhotoContainer}>
                    <Image
                      source={{ uri: photo.url }}
                      style={styles.fullPhotoImage}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[
                    styles.photoNavButton, 
                    styles.photoNavButtonLeft,
                    selectedPhotoIndex <= 0 && styles.photoNavButtonDisabled
                  ]}
                  onPress={handlePreviousPhoto}
                  disabled={selectedPhotoIndex <= 0}
                  activeOpacity={selectedPhotoIndex <= 0 ? 1 : 0.7}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={24} 
                    color={selectedPhotoIndex <= 0 ? 'rgba(255,255,255,0.3)' : colors.white} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.photoNavButton, 
                    styles.photoNavButtonRight,
                    selectedPhotoIndex >= photos.length - 1 && styles.photoNavButtonDisabled
                  ]}
                  onPress={handleNextPhoto}
                  disabled={selectedPhotoIndex >= photos.length - 1}
                  activeOpacity={selectedPhotoIndex >= photos.length - 1 ? 1 : 0.7}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color={selectedPhotoIndex >= photos.length - 1 ? 'rgba(255,255,255,0.3)' : colors.white} 
                  />
                </TouchableOpacity>
              </>
            )}

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <View style={styles.thumbnailStrip}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailContainer}
                >
                  {photos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.thumbnailItem,
                        selectedPhotoIndex === index && styles.thumbnailItemActive
                      ]}
                      onPress={() => handleThumbnailPress(index)}
                    >
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Render nearby place item
  const renderNearbyPlace = ({ item }) => {
    // Normalize id and placeId for robust navigation
    const id = item.id || item._id;
    const placeId = item.placeId || id;
    return (
      <DiscoverByNearest
        image={item.photo || item.image}
        title={item.name}
        subtitle={item.address || 'No address available'}
        distance={item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) + ' km' : '0 km'}
        rating={!isNaN(Number(item.rating)) ? Number(item.rating).toFixed(1) : '0.0'}
        placeId={placeId}
        id={id}
        location={item.location}
      />
    );
  };

  // Render featured guide card
  const renderFeaturedGuide = ({ item }) => {
    const guideAuthor = (item && (item.author || item.createdBy)) || {};
    const authorImage = guideAuthor.profileImage || guideAuthor.profilePicture || 'https://via.placeholder.com/40?text=User';
    const authorName = guideAuthor.name || guideAuthor.userName || guideAuthor.username || (guideAuthor.email ? guideAuthor.email.split('@')[0] : 'Anonymous');
    return (
      <TouchableOpacity
        style={styles.categoryPlaceCard}
        onPress={() => navigation.navigate('GuideDetail', { guide: item })}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/300x200?text=No+Image' }}
          style={styles.categoryPlaceImage}
          resizeMode="cover"
        />
        <View style={styles.categoryPlaceContent}>
          <Text style={styles.categoryPlaceTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.categoryPlaceFooter}>
            <View style={styles.categoryPlaceRating}>
              <Image
                source={{ uri: authorImage }}
                style={{ width: 20, height: 20, borderRadius: 10, marginRight: 5 }}
              />
              <Text style={styles.categoryPlaceRatingText} numberOfLines={1}>
                {authorName}
              </Text>
            </View>
            <Text style={styles.categoryPlaceDistance}>
              {item.category}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Helper function to get YouTube embed URL with autoplay disabled and cleaner UI
  const getYouTubeEmbedUrl = (url) => {
    try {
      if (!url) return null;

      const params = 'autoplay=0&mute=0&controls=1&modestbranding=1&rel=0&playsinline=1';

      // Handle YouTube shorts
      if (url.includes('youtube.com/shorts/')) {
        const videoId = url.split('shorts/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}?${params}`;
      }
      
      // Handle youtu.be format
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${id}?${params}`;
      }
      
      // Handle youtube.com format
      if (url.includes('youtube.com/')) {
        // Handle watch URLs
        if (url.includes('watch?v=')) {
          const id = url.split('watch?v=')[1].split('&')[0];
          return `https://www.youtube.com/embed/${id}?${params}`;
        }
        // Handle embed URLs
        if (url.includes('/embed/')) {
          return url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
        }
      }
      
      return url;
    } catch (error) {
      console.error('Error parsing YouTube URL:', url, error);
      return url;
    }
  };

  // Extract YouTube video ID from supported URL formats
  const extractYouTubeId = (url) => {
    try {
      if (!url || typeof url !== 'string') return null;
      if (url.includes('youtube.com/shorts/')) {
        return url.split('youtube.com/shorts/')[1].split('?')[0];
      }
      if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split('?')[0];
      }
      if (url.includes('youtube.com/watch')) {
        const afterV = url.split('watch?v=')[1];
        if (afterV) return afterV.split('&')[0];
      }
      if (url.includes('/embed/')) {
        return url.split('/embed/')[1].split('?')[0];
      }
      return null;
    } catch (_e) {
      return null;
    }
  };

  // Render a single YouTube video card
  const renderYoutubeVideo = ({ item }) => {
    if (!item?.videoUrl) {
      return null;
    }

    try {
      const originalUrl = item.videoUrl;
      const videoId = extractYouTubeId(originalUrl);
      const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

      return (
        <TouchableOpacity
          style={[styles.categoryPlaceCard, { height: 150, overflow: 'hidden' }]}
          onPress={() => {
            if (originalUrl) {
              Linking.openURL(originalUrl).catch(err => 
                console.error('Error opening video URL:', err)
              );
            }
          }}
          activeOpacity={0.85}
        >
          {thumbUrl ? (
            <Image
              source={{ uri: thumbUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.videoContainer, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: colors.fontThirdColor }}>Watch on YouTube</Text>
            </View>
          )}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' }} />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 6 }}>
              <Ionicons name="logo-youtube" size={22} color={colors.white} />
            </View>
          </View>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error('Error rendering video card:', error);
      return null;
    }
  };

  // Video styles
  const videoStyles = {
    videoContainer: {
      flex: 1,
      backgroundColor: '#000',
      borderRadius: 12,
      overflow: 'hidden',
    },
    videoWebview: {
      flex: 1,
      backgroundColor: 'transparent',
    },
  };

  // Update your styles object
  Object.assign(styles, videoStyles);

  const isValidVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.webm', '.m4v'];
    const isSupportedFormat = videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
    const isHttpUrl = url.startsWith('http');
    const isHttpsUrl = url.startsWith('https');
    return (isSupportedFormat || isHttpUrl || isHttpsUrl) && !url.toLowerCase().endsWith('.3gp');
  };

  // Navigate to Shorts viewer with proper list and index
  const handleShortPress = (pressedItem) => {
    try {
      const normalized = (shortsByLocation || []).map(s => {
        const createdBy = typeof s.createdBy === 'object' && s.createdBy !== null
          ? {
              _id: s.createdBy._id || s.createdBy.id || String(s.createdBy),
              userName: s.createdBy.userName || s.createdBy.username || s.createdBy.fullName || 'User',
              profilePicture: s.createdBy.profilePicture || s.createdBy.profileImage || 'https://via.placeholder.com/40'
            }
          : { _id: String(s.createdBy || ''), userName: 'User', profilePicture: 'https://via.placeholder.com/40' };

        return {
          _id: s._id || s.id,
          type: 'short',
          title: s.title || s.videoTitle || s.name || '',
          description: s.description || s.videoDescription || s.caption || '',
          videoUrl: s.videoUrl || s.video,
          thumbnailUrl: s.thumbnailUrl || s.videoImage,
          createdBy,
          viewsCount: s.viewsCount || s.views || 0,
          likesCount: s.likesCount || s.likes || 0,
          commentsCount: s.commentsCount || s.comments || 0,
          shareCount: s.shareCount || 0,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      });

      // filter to valid mp4 urls as ShortsScreen expects
      const filtered = normalized.filter(x => typeof x.videoUrl === 'string' && x.videoUrl.toLowerCase().endsWith('.mp4') && x._id);

      const pressedId = pressedItem?._id || pressedItem?.id;
      const initialIndex = Math.max(0, filtered.findIndex(s => s._id === pressedId));

      navigation.navigate('Shorts', {
        userShorts: filtered,
        currentIndex: initialIndex === -1 ? 0 : initialIndex,
      });
    } catch (e) {
      console.error('Error navigating to Shorts viewer:', e);
    }
  };

  // Shorts card layout (already matches video card styles)
  const renderShortCard = ({ item, index }) => {
    const id = item._id || item.id;
    const videoUrl = item.videoUrl || item.video;
    const thumbUri = shortsThumbs[id] || item.thumbnailUrl || item.videoImage;
    const hasThumb = typeof thumbUri === 'string' && thumbUri.length > 0;
    const canShowVideoPreview = !hasThumb && typeof videoUrl === 'string' && isValidVideoUrl(videoUrl);
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={() => handleShortPress(item)}>
        <View style={styles.shortCardModern}>
          {hasThumb ? (
            <Image
              source={{ uri: thumbUri }}
              style={styles.shortThumbnailModern}
              resizeMode="cover"
            />
          ) : canShowVideoPreview ? (
            <WebView
              originWhitelist={["*"]}
              source={{ html: `<!DOCTYPE html><html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /><style>html,body{margin:0;padding:0;background:#000;height:100%;} .container{position:fixed;inset:0;} video{width:100%;height:100%;object-fit:cover;background:#000;}</style></head><body><div class=\"container\"><video src=\"${videoUrl}\" ${hasThumb ? `poster=\\\"${thumbUri}\\\"` : ''} controls playsinline webkit-playsinline preload=\"metadata\"></video></div></body></html>` }}
              style={styles.shortThumbnailModern}
              javaScriptEnabled={false}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={true}
              bounces={false}
              scrollEnabled={false}
              allowsFullscreenVideo={false}
            />
          ) : (
            <Image
              source={{ uri: 'https://via.placeholder.com/300x200?text=No+Image' }}
              style={styles.shortThumbnailModern}
              resizeMode="cover"
            />
          )}
          <View style={styles.shortCardContentModern}>
            <View style={styles.shortUserRowModern}>
              <Image
                source={{ uri: (item.createdBy && item.createdBy.profilePicture) || 'https://via.placeholder.com/40?text=User' }}
                style={styles.shortUserAvatarModern}
              />
              <Text style={styles.shortUserNameModern} numberOfLines={1}>
                {(item.createdBy && (item.createdBy.userName || item.createdBy.username)) || 'User'}
              </Text>
            </View>
            <Text style={styles.shortTitleModern} numberOfLines={1}>{item.title || 'No Title'}</Text>
            {item.description ? (
              <Text style={styles.shortDescriptionModern} numberOfLines={2}>{item.description}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Helper function to get image source for the new API structure
  const getImageSourceFromPhotos = (photoIndex = 0) => {
    // If we have photos with direct URLs, use them
    if (placeDetails?.photos && placeDetails.photos.length > 0) {
      const photo = placeDetails.photos[photoIndex];
      if (photo && photo.url) {
        return { uri: photo.url };
      }
    }

    // Fallback to the image field from the API response
    if (placeDetails?.image) {
      return { uri: placeDetails.image };
    }

    // Final fallback
    return { uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d75df4?w=400&h=300&fit=crop' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.Zypsii_color} />
        <Text style={styles.loadingText}>Loading place details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={colors.fontSecondColor} />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlaceDetails}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!placeDetails) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="location-off" size={64} color={colors.fontSecondColor} />
        <Text style={styles.errorTitle}>Place not found</Text>
        <Text style={styles.errorMessage}>The place you're looking for doesn't exist or has been removed.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.Zypsii_color} barStyle="light-content" />
      <View style={styles.mainContent}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Hero Image Section */}
          <View style={styles.heroContainer}>
            <Image
              source={getImageSourceFromPhotos(0)}
              style={styles.heroImage}
              resizeMode="cover"
            />

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={backPressed}>
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>

            {/* Map Button */}
            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
              <MaterialIcons name="map" size={20} color={colors.white} />
            </TouchableOpacity>

            {/* Gradient Overlay */}
            <View style={styles.heroOverlay} />
          </View>



          {/* Content Container */}
          <View style={styles.contentContainer}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.placeName}>{placeDetails.name}</Text>
                {placeDetails?.wikipedia?.websiteUrl && (
                  <TouchableOpacity
                    style={styles.wikipediaImageContainer}
                    onPress={() => setWikipediaModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Animated.View style={[styles.wikipediaImageWrapper, { transform: [{ scale: boomAnim }] }]}>
                      <Image
                        source={getImageSourceFromPhotos(0)}
                        style={styles.wikipediaImage}
                        resizeMode="cover"
                      />
                    </Animated.View>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.ratingSection}>
                <View style={styles.ratingContainer}>
                  <AntDesign name="star" size={16} color={colors.Zypsii_color} />
                  <Text style={styles.ratingText}>{placeDetails.rating}</Text>
                  {placeDetails.distanceInKilometer && (
                    <>
                      <View style={{ width: 12 }} />
                      <Text style={styles.ratingCount}>{parseFloat(placeDetails.distanceInKilometer).toFixed(1)} km</Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.addressSection}>
                <Ionicons name="location-outline" size={16} color={colors.fontThirdColor} />
                <Text style={styles.addressText}>{placeDetails.address}</Text>
              </View>
            </View>

            {/* Description Summary */}
            {placeDetails.description && (
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>About this place</Text>
                <Text
                  style={styles.summaryText}
                  numberOfLines={showFullDescription ? undefined : 4}
                  ellipsizeMode="tail"
                  onTextLayout={(e) => {
                    if (!showFullDescription) {
                      const truncated = e.nativeEvent.lines.length > 4;
                      if (truncated !== isDescriptionTruncated) {
                        setIsDescriptionTruncated(truncated);
                      }
                    }
                  }}
                >
                  {placeDetails.description}
                </Text>
                {!showFullDescription && isDescriptionTruncated ? (
                  <TouchableOpacity onPress={() => setShowFullDescription(true)} style={{ marginTop: 6 }}>
                    <Text style={{ color: colors.Zypsii_color, fontWeight: '600' }}>Read more</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Category-based Places Section */}
            <View style={styles.nearbySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Places by Category</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CombinedDestinations', { places: categoryPlaces })}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              {/* Category Chips: 3 rows with horizontal scroll */}
              <FlatList
                data={chipColumns}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => `chip-col-${index}`}
                contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0, marginBottom: 10 }}
                renderItem={({ item: column }) => {
                  const getCategoryIcon = (category) => {
                    // Colorful emoji for each category
                    let emoji = '📍';
                    switch (category) {
                      case 'Beach':
                        emoji = '🏖️'; break;
                      case 'Adventure':
                        emoji = '🧭'; break;
                      case 'Mountains':
                        emoji = '🏔️'; break;
                      case 'Hiking':
                        emoji = '🥾'; break;
                      case 'Trekking':
                        emoji = '🥾'; break;
                      case 'View Points':
                        emoji = '🔭'; break;
                      case 'National Parks':
                        emoji = '🏞️'; break;
                      case 'Wildlife':
                        emoji = '🐾'; break;
                      case 'Cultural Sites':
                        emoji = '🏛️'; break;
                      case 'Historical Places':
                        emoji = '🏰'; break;
                      case 'Waterfalls':
                        emoji = '🌊'; break;
                      case 'Lakes':
                        emoji = '🛶'; break;
                      case 'Forests':
                        emoji = '🌳'; break;
                      case 'Caves':
                        emoji = '🦇'; break;
                      case 'Temples':
                        emoji = '🛕'; break;
                      case 'Museums':
                        emoji = '🏛️'; break;
                      case 'Gardens':
                        emoji = '🌸'; break;
                      case 'Rivers':
                        emoji = '🌊'; break;
                      default:
                        emoji = '📍';
                    }
                    return (
                      <Text style={{ fontSize: 16 }}>
                        {emoji}
                      </Text>
                    );
                  };

                  return (
                    <View style={{ marginRight: 8 }}>
                      {column.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={{
                            backgroundColor: categoryModalCategory === tag ? colors.Zypsii_color : '#f2f2f2',
                            borderRadius: 20,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            minHeight: 36,
                            width: 150,
                          }}
                          onPress={() => setCategoryModalCategory(tag)}
                          activeOpacity={0.8}
                        >
                          {getCategoryIcon(tag)}
                          <Text style={{
                            color: categoryModalCategory === tag ? colors.white : colors.fontMainColor,
                            fontSize: 14,
                            marginLeft: 6,
                            fontWeight: '500'
                          }}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                }}
              />
              {/* Places List using new API endpoint */}
              {categoryModalCategory ? (
                <>
                  {categoryLoading && categoryPlaces.length === 0 ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.Zypsii_color} />
                    </View>
                  ) : categoryPlaces.length > 0 ? (
                    <FlatList
                      data={categoryPlaces}
                      keyExtractor={(item) => String(item.id || item.placeId || item._id)}
                      horizontal={true}
                      renderItem={({ item }) => {
                        // Normalize data structure for the card
                        const normalizedItem = {
                          ...item,
                          photo: item.images?.[0]?.url || item.image,
                          address: item.location?.address || item.address || 'No address available',
                          distanceInKilometer: item?.distance ? `${parseFloat(item?.distance).toFixed(1)} km` : '0 km',
                          rating: item.rating || '0.0'
                        };
                        return (
                          <TouchableOpacity
                            style={styles.categoryPlaceCard}
                            onPress={() => handleCategoryPlacePress(item)}
                            activeOpacity={0.8}
                          >
                            <Image
                              source={{ uri: normalizedItem.photo || 'https://via.placeholder.com/300x200?text=No+Image' }}
                              style={styles.categoryPlaceImage}
                              resizeMode="cover"
                            />
                            <View style={styles.categoryPlaceContent}>
                              <Text style={styles.categoryPlaceTitle} numberOfLines={1}>
                                {normalizedItem.name}
                              </Text>
                              <Text style={styles.categoryPlaceAddress} numberOfLines={1}>
                                {normalizedItem.address}
                              </Text>
                              <View style={styles.categoryPlaceFooter}>
                                <View style={styles.categoryPlaceRating}>
                                  <AntDesign name="star" size={12} color={colors.Zypsii_color} />
                                  <Text style={styles.categoryPlaceRatingText}>
                                    {normalizedItem.rating}
                                  </Text>
                                </View>
                                <Text style={styles.categoryPlaceDistance}>
                                  {normalizedItem.distanceInKilometer}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryPlacesContainer}
                      ListEmptyComponent={
                        categoryLoading ? (
                          <ActivityIndicator size="small" color={colors.Zypsii_color} />
                        ) : (
                          <Text style={styles.noDataText}>No places found</Text>
                        )
                      }
                    />
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No places found for this category</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>Select a category to explore places</Text>
                </View>
              )}
            </View>

            {/* Nearby Places Section */}
            <View style={styles.nearbySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nearby Places</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CombinedDestinations', { places: nearbyPlaces })}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              {nearbyLoading && nearbyPlaces.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.Zypsii_color} />
                </View>
              ) : nearbyPlaces.length > 0 ? (
                <FlatList
                  data={nearbyPlaces}
                  renderItem={renderNearbyPlace}
                  keyExtractor={(item) => item.placeId || item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.nearbyPlacesContainer}
                  onEndReached={() => {
                    if (nearbyHasMore && !nearbyLoading) fetchNearbyPlaces();
                  }}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={nearbyLoading && nearbyPlaces.length > 0 ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.Zypsii_color} />
                    </View>
                  ) : null}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No nearby places found</Text>
                </View>
              )}
            </View>

            {/* Featured Guides Section */}
            {(guidesLoading || featuredGuides.length > 0) && (
              <View style={styles.nearbySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Guides</Text>
                  {featuredGuides.length > 0 && (
                    <TouchableOpacity onPress={() => navigation.navigate('AllGuides', { guides: featuredGuides })}>
                      <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {guidesLoading && featuredGuides.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.Zypsii_color} />
                  </View>
                ) : featuredGuides.length > 0 ? (
                  <FlatList
                    data={featuredGuides}
                    renderItem={renderFeaturedGuide}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.nearbyPlacesContainer}
                    onEndReached={() => {
                      if (guidesHasMore && !guidesLoading) fetchFeaturedGuides();
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={guidesLoading && featuredGuides.length > 0 ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.Zypsii_color} />
                      </View>
                    ) : null}
                  />
                ) : null}
              </View>
            )}

            {/* Top Searches Section */}
            {(topSearchesLoading || topSearches.length > 0) && (
              <View style={styles.nearbySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Top searches</Text>
                  {topSearches.length > 0 && (
                    <TouchableOpacity onPress={() => navigation.navigate('CombinedDestinations', { places: topSearches })}>
                      <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {topSearchesLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.Zypsii_color} />
                  </View>
                ) : topSearches.length > 0 ? (
                  <FlatList
                    data={topSearches}
                    keyExtractor={(item) => String(item._id || item.placeId)}
                    horizontal={true}
                    renderItem={({ item }) => {
                      const normalizedItem = {
                        ...item,
                        photo: item.images?.[0]?.url || item.image,
                        address: item.location?.address || 'No address available',
                        rating: item.rating || '0.0'
                      };
                      return (
                        <TouchableOpacity
                          style={styles.categoryPlaceCard}
                          onPress={() => handleTopSearchPress(item)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: normalizedItem.photo || 'https://via.placeholder.com/300x200?text=No+Image' }}
                            style={styles.categoryPlaceImage}
                            resizeMode="cover"
                          />
                          <View style={styles.categoryPlaceContent}>
                            <Text style={styles.categoryPlaceTitle} numberOfLines={1}>
                              {normalizedItem.name}
                            </Text>
                            <Text style={styles.categoryPlaceAddress} numberOfLines={1}>
                              {normalizedItem.address}
                            </Text>
                            <View style={styles.categoryPlaceFooter}>
                              <View style={styles.categoryPlaceRating}>
                                <AntDesign name="star" size={12} color={colors.Zypsii_color} />
                                <Text style={styles.categoryPlaceRatingText}>
                                  {normalizedItem.rating}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryPlacesContainer}
                  />
                ) : null}
              </View>
            )}

            {/* Photos Section */}
            {placeDetails.photos && placeDetails.photos.length > 0 && (
              <View style={styles.photosSection}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosScrollContainer}
                >
                  {placeDetails.photos.slice(0, 8).map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.photoContainer}
                      onPress={() => {
                        setSelectedPhotoIndex(index);
                        setPhotoModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                      {placeDetails.photos.length > 8 && index === 7 && (
                        <View style={styles.morePhotosOverlay}>
                          <Text style={styles.morePhotosText}>
                            +{placeDetails.photos.length - 8}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* YouTube Videos Section */}
            {youtubeVideos && youtubeVideos.length > 0 && (
              <View style={styles.nearbySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Videos</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('AllVideos', { videos: youtubeVideos })}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={youtubeVideos}
                  renderItem={renderYoutubeVideo}
                  keyExtractor={item => item?._id || String(Math.random())}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.nearbyPlacesContainer}
                  onEndReached={() => {
                    if (youtubeHasMore && !youtubeLoading) {
                      fetchYoutubeVideos();
                    }
                  }}
                  onEndReachedThreshold={0.5}
                  ListEmptyComponent={() => (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No videos available</Text>
                    </View>
                  )}
                  ListFooterComponent={() => (
                    youtubeLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.Zypsii_color} />
                      </View>
                    ) : null
                  )}
                />
              </View>
            )}

            {/* Shorts by Location Section */}
            {shortsByLocation.length > 0 && (
              <View style={styles.shortsSection}>
                <Text style={styles.sectionTitle}>Shorts</Text>
                <FlatList
                  data={shortsByLocation}
                  renderItem={renderShortCard}
                  keyExtractor={item => item._id || Math.random().toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.youtubeListContainer}
                  onEndReached={loadMoreShorts}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={shortsLoading && shortsByLocation.length > 0 ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.Zypsii_color} />
                    </View>
                  ) : null}
                />
                {/* Next Button for Shorts */}
                {shortsHasMore && !shortsLoading && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                    <TouchableOpacity style={{ backgroundColor: colors.Zypsii_color, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} onPress={loadMoreShorts}>
                      <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 16 }}>Next</Text>
                      <Ionicons name="chevron-forward" size={20} color={colors.white} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginLeft: 10, backgroundColor: colors.Zypsii_color, borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }} onPress={loadMoreShorts}>
                      <Ionicons name="chevron-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Reviews Section */}
            {placeDetails.reviews && placeDetails.reviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                {placeDetails.reviews
                  .slice(reviewPage * REVIEWS_PER_PAGE, (reviewPage + 1) * REVIEWS_PER_PAGE)
                  .map((review, index) => (
                    <View key={index} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <Image
                          source={{ uri: review.profile_photo_url }}
                          style={styles.reviewerAvatar}
                        />
                        <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>{review.author_name}</Text>
                          <View style={styles.reviewRating}>
                            {[...Array(5)].map((_, i) => (
                              <AntDesign
                                key={i}
                                name={i < review.rating ? "star" : "staro"}
                                size={12}
                                color={i < review.rating ? colors.Zypsii_color : colors.fontThirdColor}
                              />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.reviewTime}>{review.relative_time_description}</Text>
                      </View>
                      <Text style={styles.reviewText} numberOfLines={3}>
                        {review.text}
                      </Text>
                    </View>
                  ))}
                {/* Next Button for Reviews */}
                {placeDetails.reviews.length > REVIEWS_PER_PAGE && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={{ backgroundColor: colors.Zypsii_color, borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }} onPress={() => setReviewPage((prev) => ((prev + 1) * REVIEWS_PER_PAGE >= placeDetails.reviews.length ? 0 : prev + 1))}>
                      <Ionicons name="chevron-forward" size={14} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            {/* Suggested Itinerary Section */}
            <View style={{ marginTop: 24, marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>Suggested Itinerary</Text>

              {itineraryLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.Zypsii_color} />
                </View>
              ) : itinerary && itinerary.places && itinerary.places.length > 0 ? (
                <RecommendCard
                  title={itinerary.title}
                  suggestions={[{ tripName: itinerary.title, places: itinerary.places }]}
                  navigation={navigation}
                />
              ) : itineraryError ? (
                <Text style={styles.errorMessage}>{itineraryError}</Text>
              ) : null}
            </View>

            {/* Make Schedule Button */}
            <MainBtn
              text="Make a schedule"
              onPress={handleMakeSchedule}
              style={styles.scheduleButton}
            />
          </View>
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <BottomTab screen="WhereToGo" />
      <WikipediaModal />
      <PhotoViewerModal />

    </View>
  );
};

// Export the component
export default Destination;
