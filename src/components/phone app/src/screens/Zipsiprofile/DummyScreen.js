import React, { useState, useEffect } from 'react';
import { View, Text, Image,Alert , TouchableOpacity, FlatList, ScrollView, Modal, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import Video from 'react-native-video';
import styles from './styles';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Post from '../../components/Posts/Post';
import Schedule from '../MySchedule/Schedule/AllSchedule';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ProfileSkeleton, StatsSkeleton, GridSkeleton, ScheduleSkeleton } from '../../components/SkeletonLoader';
import { TextDefault } from '../../components';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTab from '../../components/BottomTab/BottomTab';
import { useToast } from '../../context/ToastContext';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DummyScreen = ({ navigation }) => {
  const [activeIcon, setActiveIcon] = useState('th-large'); // Default active icon
  const [userId, setUserId] = useState(null);
  const { showToast } = useToast();

  // Function to handle settings press
  const handleSettingsPress = () => {
    navigation.navigate('ProfileDashboard');
  };
  const [profileInfo, setProfileInfo] = useState({
    id: '',
    name: '',
    Posts: '0',
    Followers: '0',
    Following: '0',
    image: '',
    notes: ''
  });
  const [followingData, setFollowingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [all_schedule, setAll_schedule] = useState([]);
  const [all_posts, setAllPosts] = useState([]);
  const [all_shorts, setAllShorts] = useState([]);
  const [placeNames, setPlaceNames] = useState({});

  // Add new loading states
  const [profileLoading, setProfileLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [shortsLoading, setShortsLoading] = useState(true);

  // First useEffect to get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        setProfileLoading(true);
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('No access token found');
        }

        const response = await fetch(`${base_url}/user/getProfile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Profile fetch failed! Status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          const userData = result.data[0];
          setUserId(userData.id);
          const userStr = await AsyncStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;

          // Fetch post count
          const postCountResponse = await fetch(`${base_url}/post/listing/postCount?userId=${user._id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('DummyScreen - postCountResponse status:', postCountResponse.status);
          console.log('DummyScreen - postCountResponse ok:', postCountResponse.ok);

          if (postCountResponse.ok) {
            const postCountResult = await postCountResponse.json();
            console.log('DummyScreen - Post count response:', postCountResult);
            if (postCountResult.success) {
              console.log('DummyScreen - Setting post count to:', postCountResult.postCountData);
              setProfileInfo(prev => ({
                ...prev,
                Posts: postCountResult.postCountData?.toString() || '0'
              }));
            } else {
              console.error('DummyScreen - Post count API returned success: false:', postCountResult.message);
            }
          } else {
            console.error('DummyScreen - Post count API failed with status:', postCountResponse.status);
            const errorText = await postCountResponse.text();
            console.error('DummyScreen - Post count API error response:', errorText);
          }
          // Fetch followers count
          const followersResponse = await fetch(`${base_url}/follow/getFollowers/${user._id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (followersResponse.ok) {
            const followersResult = await followersResponse.json();
            if (followersResult.status) {
              setProfileInfo(prev => ({
                ...prev,
                Followers: followersResult.followersCount?.toString() || '0'
              }));
            }
          }

          // Fetch following data
          const followingResponse = await fetch(`${base_url}/follow/getFollowing/${user._id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (followingResponse.ok) {
            const followingResult = await followingResponse.json();
            if (followingResult.status) {
              setFollowingData(followingResult.following || []);
              setProfileInfo(prev => ({
                ...prev,
                Following: followingResult.followingCount?.toString() || '0'
              }));
            }
          }

          setProfileInfo(prev => ({
            ...prev,
            id: userData.id || '',
            name: userData.fullName || '',
            image: userData.profilePicture || '',
            notes: userData.bio || ''
          }));
        }
      } catch (error) {
        // console.error('Error fetching user ID:', error);
        showToast('Failed to fetch user profile. Please try again.', 'error');
      } finally {
        setProfileLoading(false);
      }
    };

    getUserId();
  }, []);

  // Handle schedule item press
  const handleSchedulePress = (item) => {
    if (!item || !item.id) {
      console.error('Invalid schedule item:', item);
      return;
    }
    
    // Transform the data to match TripDetail's expected format
    const tripData = {
      id: item.id,
      title: item.title || 'Untitled Trip',
      from: item.fromPlace || 'Starting Point',
      to: item.toPlace || 'End Point',
      date: item.date || new Date().toISOString().split('T')[0],
      numberOfDays: item.riders || '1',
      imageUrl: item.imageUrl || null,
      // Pass all location details with coordinates for all days
      locationDetails: item.locationDetails && Array.isArray(item.locationDetails) 
        ? item.locationDetails.map(location => ({
            name: location.name || 'Unknown Location',
            address: location.address || location.name || 'Unknown Address',
            latitude: location.latitude,
            longitude: location.longitude,
            distanceInKilometer: location.distanceInKilometer,
            day: location.day,
            _id: location._id,
            location: {
              lat: location.latitude,
              lng: location.longitude
            }
          }))
        : item.rawLocation ? [
            {
              name: item.fromPlace || 'Starting Point',
              address: item.fromPlace || 'Starting Point',
              latitude: item.rawLocation.from?.latitude,
              longitude: item.rawLocation.from?.longitude,
              location: {
                lat: item.rawLocation.from?.latitude,
                lng: item.rawLocation.from?.longitude
              }
            },
            {
              name: item.toPlace || 'End Point',
              address: item.toPlace || 'End Point',
              latitude: item.rawLocation.to?.latitude,
              longitude: item.rawLocation.to?.longitude,
              location: {
                lat: item.rawLocation.to?.latitude,
                lng: item.rawLocation.to?.longitude
              }
            }
          ] : [],
      riders: item.riders || '1',
      travelMode: item.travelMode || 'Bike',
      visible: 'Public',
      createdBy: item.createdBy || '',
      createdAt: item.createdAt || '',
      updatedAt: item.updatedAt || ''
    };
    
    console.log('Passing trip data to TripDetail:', {
      tripId: tripData.id,
      locationCount: tripData.locationDetails.length,
      locations: tripData.locationDetails.map(loc => ({
        name: loc.name,
        coordinates: { lat: loc.latitude, lng: loc.longitude }
      }))
    });
    
    navigation.navigate('TripDetail', { 
      tripData: tripData,
      scheduleData: item,
      allSchedules: all_schedule
    });
  };

  // Function to get place name from coordinates
  const getPlaceName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDxXqXQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return `${lat}, ${lng}`;
    } catch (error) {
      console.error('Error getting place name:', error);
      return `${lat}, ${lng}`;
    }
  };

  // Function to process location data
  const processLocationData = async (scheduleData) => {
    try {
      const processedData = await Promise.all(
        scheduleData.map(async (item) => {
          if (!item) return null;
          
          // Process all location details with coordinates
          const allLocationDetails = [];
          
          if (item.locationDetails && Array.isArray(item.locationDetails)) {
            item.locationDetails.forEach((location, index) => {
              if (location) {
                allLocationDetails.push({
                  name: location.name || location.address || `Location ${index + 1}`,
                  address: location.address || location.name || `Address ${index + 1}`,
                  latitude: location.latitude || location.lat,
                  longitude: location.longitude || location.lng,
                  distanceInKilometer: location.distanceInKilometer || location.distance,
                  day: location.day || index + 1,
                  _id: location._id || `loc_${index}`
                });
              }
            });
          }
          
          // If no locationDetails, try to extract from location object
          if (allLocationDetails.length === 0 && item.location) {
            if (item.location.from) {
              allLocationDetails.push({
                name: item.location.from.name || 'Starting Point',
                address: item.location.from.address || 'Starting Point',
                latitude: item.location.from.latitude,
                longitude: item.location.from.longitude,
                day: 1,
                _id: 'from_location'
              });
            }
            
            if (item.location.to) {
              allLocationDetails.push({
                name: item.location.to.name || 'End Point',
                address: item.location.to.address || 'End Point',
                latitude: item.location.to.latitude,
                longitude: item.location.to.longitude,
                day: item.numberOfDays || 1,
                _id: 'to_location'
              });
            }
          }
          
          return {
            id: item._id || Math.random().toString(),
            title: item.tripName || 'Untitled Trip',
            fromPlace: item.locationDetails?.[0]?.address || 'Unknown location',
            toPlace: item.locationDetails?.[item.locationDetails.length - 1]?.address || 'Unknown location',
            date: Array.isArray(item.Dates) && item.Dates.length > 0 ? item.Dates[0].date : '',
            riders: String(item.numberOfDays || 0),
            imageUrl: item.bannerImage || '',
            travelMode: item.travelMode || '',
            createdBy: item.createdBy || '',
            createdAt: item.createdAt || '',
            updatedAt: item.updatedAt || '',
            // Include all location details with coordinates
            locationDetails: allLocationDetails,
            rawLocation: {
              from: {
                latitude: item.location?.from?.latitude,
                longitude: item.location?.from?.longitude
              },
              to: {
                latitude: item.location?.to?.latitude,
                longitude: item.location?.to?.longitude
              }
            }
          };
        })
      );

      // Filter out any null items
      const validData = processedData.filter(item => item !== null);
      setAll_schedule(validData);
    } catch (error) {
      // console.error('Error processing location data:', error);
      showToast('Failed to process schedule location data.', 'error');
      setAll_schedule([]);
    }
  };

  // Second useEffect to fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
      

        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('No access token found');
        }
        const user = await AsyncStorage.getItem('user');
        const user_id = user ? JSON.parse(user) : null;
        // Fetch posts with user ID filter
        setPostsLoading(true);
        const postsResponse = await fetch(`${base_url}/post/listing/filter?filter=my&userId=${user_id._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (postsResponse.ok) {
          try {
            const response = await postsResponse.json();
            console.log('Posts response:', response);
            
            if (response.success && Array.isArray(response.data)) {
              const postsData = response.data;
              
              const processedPosts = postsData
                .filter(item => item && typeof item === 'object')
                .map(item => {
                  try {
                    return {
                      id: item._id || '',
                      title: item.postTitle || '',
                      description: item.description || '',
                      postTitle: item.postTitle || '',
                      imageUrl: Array.isArray(item.mediaUrl) && item.mediaUrl.length > 0 
                        ? item.mediaUrl 
                        : '',
                      mediaType: item.mediaType || 'image',
                      likes: String(item.likesCount || 0),
                      comments: String(item.commentsCount || 0),
                      shares: String(item.shareCount || 0),
                      postType: item.postType || 'Public',
                      createdBy: item.createdBy || '',
                      createdAt: item.createdAt || '',
                      updatedAt: item.updatedAt || '',
                      tags: Array.isArray(item.tags) ? item.tags : []
                    };
                  } catch (error) {
                    console.error('Error processing post item:', error);
                    return null;
                  }
                })
                .filter(Boolean);

              setAllPosts(processedPosts);
            } else {
              console.error('Invalid posts response format:', response);
              setAllPosts([]);
            }
          } catch (error) {
            // console.error('Error processing posts response:', error);
            showToast('Failed to process posts.', 'error');
            setAllPosts([]);
          }
        } else {
          console.error('Posts fetch failed:', postsResponse.status);
          setAllPosts([]);
        }
        setPostsLoading(false);

        // Fetch schedules with user ID filter
        setScheduleLoading(true);
       

        const scheduleResponse = await fetch(`${base_url}/schedule/listing/filter?filter=my&userId=${user_id._id}&limit=20`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (scheduleResponse.ok) {
          const response = await scheduleResponse.json();
          
          if (response.success && response.data) {
            await processLocationData(response.data);
          }
        }
        setScheduleLoading(false);

        // Fetch shorts
        setShortsLoading(true);
        try {
          const userStr = await AsyncStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          
          if (!user || !user._id) {
            // console.error('User data not found or invalid');
            showToast('User data not found or invalid.', 'error');
            setShortsLoading(false);
            return;
          }

          console.log('Fetching shorts for user:', user._id);
          const shortsResponse = await fetch(`${base_url}/shorts/listing?userId=${user._id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (!shortsResponse.ok) {
            throw new Error(`Shorts fetch failed with status: ${shortsResponse.status}`);
          }

          const response = await shortsResponse.json();
         // console.log('Shorts response:', response);

          if (response.status && response.data) {
            const shortsData = response.data
              .filter(item => item.videoUrl.toLowerCase().endsWith('.mp4'))
              .map(item => ({
                _id: item._id || '',
                video: item.videoUrl || '',
                videoTitle: item.title || '',
                videoImage: item.thumbnailUrl || '',
                description: item.description || '',
                likes: String(item.likesCount || 0),
                views: String(item.viewsCount || 0),
                comments: String(item.commentsCount || 0),
                createdBy: item.createdBy || '',
                createdAt: item.createdAt || '',
                updatedAt: item.updatedAt || '',
                tags: item.tags || []
              }));
            
            setAllShorts(shortsData);
          } else {
            console.error('Invalid shorts response format:', response);
            setAllShorts([]);
          }
        } catch (error) {
          // console.error('Error fetching shorts:', error);
          showToast('Failed to fetch shorts.', 'error');
          setAllShorts([]);
        } finally {
          setShortsLoading(false);
        }

      } catch (error) {
        // console.error('Error fetching data:', error);
        showToast('Failed to fetch data. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Add console logs for state changes
  useEffect(() => {
  }, [profileInfo]);

  useEffect(() => {
  }, [all_posts]);

  useEffect(() => {
  }, [all_schedule]);

  useEffect(() => {

  }, [all_shorts]);

  const handleDelete = (scheduleId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const accessToken = await AsyncStorage.getItem('accessToken');
              const response = await fetch(
                `${base_url}/schedule/delete/${scheduleId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                  },
                }
              );

              if (response.ok) {
                showToast('The schedule has been deleted.');
                // Update the schedule list by filtering out the deleted item
                setAll_schedule(prevSchedules => prevSchedules.filter(schedule => schedule.id !== scheduleId));
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to delete schedule.');
              }
            } catch (error) {
              // console.error('Delete error:', error);
              showToast('Failed to delete schedule. Please try again.', 'error');
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteShort = (shortId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this short?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const accessToken = await AsyncStorage.getItem('accessToken');
              const response = await fetch(
                `${base_url}/shorts/deleteShorts/${shortId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Deleted', 'The short has been deleted.');
                // Update the shorts list by filtering out the deleted item
                setAllShorts(prevShorts => prevShorts.filter(short => short._id !== shortId));
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to delete short.');
              }
            } catch (error) {
              // console.error('Delete error:', error);
              showToast('Failed to delete short. Please try again.', 'error');
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Local images for grid view (th-large)
  const images = {
    'th-large': [
      { id: '1', uri: require('../../assets/image1.jpg') },
      { id: '2', uri: require('../../assets/image2.jpg') },
      { id: '3', uri: require('../../assets/image3.jpg') },
      { id: '4', uri: require('../../assets/image4.jpg') },
    ],
  };

  // Generate placeholders if no images are available
  const getImageData = () => {
    return images['th-large'].length > 0
      ? images['th-large']
      : Array(6)
          .fill(null)
          .map((_, index) => ({ id: `${index + 1}`, isPlaceholder: true }));
  };

  const handleVideoPress = (item) => {
    // Navigate to Shorts screen with the video data
    navigation.navigate('Shorts', { 
      initialVideo: item,
      userShorts: all_shorts,
      currentIndex: all_shorts.findIndex(short => short._id === item._id)
    });
  };

  // Add video validation functions
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

  // Modify the renderContent function to use skeleton loaders
  const renderContent = () => {
    switch (activeIcon) {
      case 'th-large':
        return postsLoading ? (
          <GridSkeleton />
        ) : (
          <FlatList
            data={all_posts}
            numColumns={3}
            key="grid"
            renderItem={({ item }) => {
              if (!item) return null;
              
              return (
                <TouchableOpacity 
                  style={gridStyles.gridItem}
                  onPress={() => navigation.navigate('PostDetail', { post: item })}
                >
                  {item.imageUrl && item.imageUrl.length > 0 ? (
                    <Image
                      source={{ uri: item.imageUrl[0] }}
                      style={gridStyles.gridImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[gridStyles.gridImage, gridStyles.placeholderImage]}>
                      <MaterialIcons name="image" size={40} color={colors.Zypsii_color} />
                    </View>
                  )}
                  <View style={gridStyles.gridItemInfo}>
                    <Text style={gridStyles.gridItemTitle} numberOfLines={1}>
                      {item.postTitle || 'Untitled'}
                    </Text>
                    <View style={gridStyles.gridItemStats}>
                      <View style={gridStyles.statItem}>
                        <MaterialIcons name="favorite" size={14} color={colors.Zypsii_color} />
                        <Text style={gridStyles.statText}>{item.likes || '0'}</Text>
                      </View>
                      <View style={gridStyles.statItem}>
                        <MaterialIcons name="comment" size={14} color={colors.Zypsii_color} />
                        <Text style={gridStyles.statText}>{item.comments || '0'}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeletePost(item.id);
                        }}
                        style={gridStyles.deleteButton}
                      >
                        <MaterialIcons name="delete" size={14} color={colors.Zypsii_color} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
                          keyExtractor={(item) => item?._id?.toString() || Math.random().toString()}
            contentContainerStyle={gridStyles.gridContainer}
            ListEmptyComponent={() => (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text>No posts available</Text>
              </View>
            )}
          />
        );
      case 'briefcase':
        return scheduleLoading ? (
          <ScheduleSkeleton />
        ) : (
          <FlatList
            data={all_schedule}
            key="schedule"
            keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => {
              if (!item) return null;
              
              return (
                <TouchableOpacity 
                  onPress={() => handleSchedulePress(item)}
                  style={scheduleStyles.scheduleCard}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={scheduleStyles.scheduleImage}
                    resizeMode="cover"
                  />
                  <View style={scheduleStyles.scheduleContent}>
                    <Text style={scheduleStyles.scheduleTitle}>{item.title}</Text>
                    <View style={scheduleStyles.routeContainer}>
                      <View style={scheduleStyles.routeItem}>
                        <Text style={scheduleStyles.routeLabel}>From</Text>
                        <View style={scheduleStyles.locationRow}>
                          <MaterialIcons name="location-on" size={16} color={colors.Zypsii_color} />
                          <Text style={scheduleStyles.routeText} numberOfLines={2}>
                            {item.fromPlace}
                          </Text>
                        </View>
                      </View>
                      <View style={scheduleStyles.routeItem}>
                        <Text style={scheduleStyles.routeLabel}>To</Text>
                        <View style={scheduleStyles.locationRow}>
                          <MaterialIcons name="location-on" size={16} color={colors.Zypsii_color} />
                          <Text style={scheduleStyles.routeText} numberOfLines={2}>
                            {item.toPlace}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={scheduleStyles.scheduleFooter}>
                      <View style={scheduleStyles.dateContainer}>
                        <MaterialIcons name="event" size={16} color="#666" />
                        <Text style={scheduleStyles.dateText}>{item.date}</Text>
                      </View>
                      <View style={scheduleStyles.ridersContainer}>
                        <MaterialIcons name="group" size={16} color="#666" />
                        <Text style={scheduleStyles.ridersText}>{item.riders} Riders</Text>
                      </View>
                      <View style={scheduleStyles.actionButtons}>
                        <TouchableOpacity 
                          onPress={() => handleEdit(item.id)}
                          style={scheduleStyles.actionButton}
                        >
                          <MaterialIcons name="edit" size={16} color={colors.Zypsii_color} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleDelete(item.id)}
                          style={scheduleStyles.actionButton}
                        >
                          <MaterialIcons name="delete" size={16} color={colors.Zypsii_color} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={scheduleStyles.scheduleList}
            ListEmptyComponent={() => (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text>No schedules available</Text>
              </View>
            )}
          />
        );
      case 'play-circle':
        return shortsLoading ? (
          <GridSkeleton />
        ) : (
          <>
            <FlatList
              data={all_shorts}
              numColumns={3}
              key="shorts-grid"
              renderItem={({ item }) => {
                if (!item) return null;
                
                const videoSource = getVideoSource(item.video);
                const isValidVideo = isValidVideoUrl(item.video);
                
                return (
                  <TouchableOpacity 
                    style={gridStyles.gridItem}
                    onPress={() => handleVideoPress(item)}
                  >
                    {isValidVideo && videoSource ? (
                      <Video
                        source={videoSource}
                        style={gridStyles.gridImage}
                        resizeMode="cover"
                        repeat={true}
                        paused={true}
                        muted={true}
                        onBuffer={(buffer) => console.log('buffering', buffer)}
                        onError={(error) => console.log('error', error)}
                      />
                    ) : item.videoImage ? (
                      <Image
                        source={{ uri: item.videoImage }}
                        style={gridStyles.gridImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[gridStyles.gridImage, gridStyles.placeholderImage]}>
                        <MaterialIcons name="play-circle" size={40} color={colors.Zypsii_color} />
                      </View>
                    )}
                    <View style={gridStyles.gridItemInfo}>
                      <Text style={gridStyles.gridItemTitle} numberOfLines={1}>
                        {item.videoTitle || 'Untitled'}
                      </Text>
                      <View style={gridStyles.gridItemStats}>
                        <View style={gridStyles.statItem}>
                          <MaterialIcons name="favorite" size={14} color={colors.Zypsii_color} />
                          <Text style={gridStyles.statText}>{item.likes || '0'}</Text>
                        </View>
                        <View style={gridStyles.statItem}>
                          <MaterialIcons name="chat-bubble" size={14} color={colors.Zypsii_color} />
                          <Text style={gridStyles.statText}>{item.comments || '0'}</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteShort(item._id);
                          }}
                          style={gridStyles.deleteButton}
                        >
                          <MaterialIcons name="delete" size={14} color={colors.Zypsii_color} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
              contentContainerStyle={gridStyles.gridContainer}
              ListEmptyComponent={() => (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text>No shorts available</Text>
                </View>
              )}
            />
          </>
        );
      default:
        return null;
    }
  };

  const handleBackPress = () => {
    console.log('Back button pressed');
    navigation.goBack();
  };

  const handleEdit = (scheduleId) => {
    navigation.navigate('EditSchedule', { 
      scheduleId: scheduleId,
      scheduleData: all_schedule.find(item => item.id === scheduleId)
    });
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const accessToken = await AsyncStorage.getItem('accessToken');
              const response = await fetch(
                `${base_url}/post/delete/${postId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Deleted', 'The post has been deleted.');
                // Update the posts list by filtering out the deleted item
                setAllPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to delete post.');
              }
            } catch (error) {
              // console.error('Delete error:', error);
              showToast('Failed to delete post. Please try again.', 'error');
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <StatusBar 
        backgroundColor={colors.Zypsii_color} 
        barStyle="light-content" 
        translucent={false}
      />
      <SafeAreaView style={styles.safeAreaStyle} edges={['top']}>
        <View style={styles.container}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.header}>
            <View style={styles.topIconsRow}>
              <TouchableOpacity 
                onPress={handleBackPress}
                style={styles.circle}
              >
                <Ionicons name="chevron-back" size={24} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.settingsContainer}>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={handleSettingsPress}
                >
                  <Ionicons name="settings-outline" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.protractorShape} />
          <View style={styles.backgroundCurvedContainer} />

          {/* Profile Section */}
          {profileLoading ? (
            <ProfileSkeleton />
          ) : (
            <View style={styles.profileContainer}>
              <TouchableOpacity>
                <View style={styles.profileImageContainer}>
                  {profileInfo.image ? (
                    <Image
                      source={{ uri: profileInfo.image }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={[styles.profileImage, styles.defaultProfileImage]}>
                      <Ionicons name="person" size={50} color={colors.white} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.name}>{profileInfo.name || '-----'}</Text>
              <Text style={styles.description}>{profileInfo.notes}</Text>
            </View>
          )}

          {/* Stats Section */}
          {profileLoading ? (
            <StatsSkeleton />
          ) : (
             <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <TextDefault style={styles.statLabel}>Posts</TextDefault>
              <TextDefault style={styles.statNumber}>{profileInfo.Posts}</TextDefault>
            </View>
            <TouchableOpacity 
              style={styles.stat}
              onPress={() => navigation.navigate('FollowersList', { initialTab: 'Followers' })}
            >
              <TextDefault style={styles.statLabel}>Followers</TextDefault>
              <TextDefault style={styles.statNumber}>{profileInfo.Followers}</TextDefault>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statLast}
              onPress={() => navigation.navigate('FollowersList', { 
                initialTab: 'Following',
                followingData: followingData 
              })}
            >
              <TextDefault style={styles.statLabel}>Following</TextDefault>
              <TextDefault style={styles.statNumber}>{profileInfo.Following}</TextDefault>
            </TouchableOpacity>
          </View>
          )}

          {/* Gray Line */}
          <View style={styles.separatorLine} />

          {/* Icons Section */}
          <View style={styles.iconsContainer}>
            <TouchableOpacity
              style={[
                styles.iconBox,
                activeIcon === 'th-large' && styles.activeIconBox,
              ]}
              onPress={() => setActiveIcon('th-large')}
            >
              <Icon name="th-large" size={20} color={colors.Zypsii_color} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconBox,
                activeIcon === 'briefcase' && styles.activeIconBox,
              ]}
              onPress={() => setActiveIcon('briefcase')}
            >
              <Icon name="briefcase" size={20} color={colors.Zypsii_color} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconBox,
                activeIcon === 'play-circle' && styles.activeIconBox,
              ]}
              onPress={() => setActiveIcon('play-circle')}
            >
              <Icon name="play-circle" size={20} color={colors.Zypsii_color} />
            </TouchableOpacity>
          </View>

          {/* Content Section based on active icon */}
          <View style={contentStyles.contentContainer}>
            {renderContent()}
          </View>
          </ScrollView>
          <BottomTab screen="PROFILE" />
        </View>
      </SafeAreaView>
    </>
  );
};

// Additional styles needed for the content sections
const contentStyles = {
  contentContainer: {
    flex: 1,
    marginTop: 10,
    zIndex: 2,
    paddingHorizontal: 5,
  },
};

// Styles for schedule cards
const cardStyles = {
  card: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeItem: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  routeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    marginBottom: 4,
  },
  riders: {
    fontSize: 14,
    color: '#666',
  },
  joinedButton: {
    backgroundColor: colors.Zypsii_color,
    padding: 8,
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  joinedText: {
    color: 'white',
    fontWeight: 'bold',
  },
};

// Styles for video/shorts
const videoStyles = {
  videoContainer: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  videoInfo: {
    padding: 15,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  }
};

// Add new styles for grid layout
const gridStyles = {
  gridContainer: {
    marginTop: 0,
    borderWidth: 0,         // Added white border
    borderColor: '#fff',  
    zIndex: 2, // Set the border color to white
    paddingHorizontal: 0, // Removed padding
  },
  gridItem: {
    flex: 1/3,
    margin: 2.5, // Reduced margin
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  gridItemInfo: {
    padding: 8,
  },
  gridItemTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  gridItemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  deleteButton: {
    padding: 4,
  },
};

// Add new styles for schedule
const scheduleStyles = {
  scheduleList: {
    padding: 15,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  scheduleImage: {
    width: '100%',
    height: 180,
  },
  scheduleContent: {
    padding: 15,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  routeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  routeItem: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
    flex: 1,
  },
  scheduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  ridersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ridersText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    padding: 5,
  },
};

export default DummyScreen;