import React, { useState, useEffect } from 'react';
import { View, Text, Image,Alert , TouchableOpacity, FlatList, ScrollView, Modal, Dimensions, StatusBar, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
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
import { useAuth } from '../../components/Auth/AuthContext';
import { useFollow } from '../../components/Follow/FollowContext';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DummyScreen = ({ navigation, route }) => {
  const [activeIcon, setActiveIcon] = useState('th-large'); // Default active icon
  const [userId, setUserId] = useState(null);

  // Get user data from navigation params
  const { targetUserId, userData } = route.params || {};
  
  console.log('UserProfile - Navigation params:', { targetUserId, userData });

  const [profileInfo, setProfileInfo] = useState({
    id: '',
    name: '',
    Posts: '0',
    Followers: '0',
    Following: '0',
    image: '',
    notes: '',
    profileViews: 'public'
  });
  const [followingData, setFollowingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [all_schedule, setAll_schedule] = useState([]);
  const [all_posts, setAllPosts] = useState([]);
  const [all_shorts, setAllShorts] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [placeNames, setPlaceNames] = useState({});

  // Add new loading states
  const [profileLoading, setProfileLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [shortsLoading, setShortsLoading] = useState(true);

  // Add hooks for auth and follow
  const { user: currentUser } = useAuth();
  const { isFollowing } = useFollow();

  // First useEffect to get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        setProfileLoading(true);
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('No access token found');
        }

        // Check if we have targetUserId from navigation params
        if (targetUserId && userData) {
          // We're viewing another user's profile from search
          console.log('UserProfile - Viewing other user profile from search:', targetUserId);
          setUserId(targetUserId);
          
          // Set profile info from passed user data
          setProfileInfo({
            id: userData.id || '',
            name: userData.fullName || '',
            Posts: '0', // Will be fetched separately
            Followers: '0', // Will be fetched separately
            Following: '0', // Will be fetched separately
            image: userData.profilePicture || '',
            notes: userData.bio || '',
            profileViews: userData.profileViews || 'public'
          });

          // Fetch additional data for this user
          await fetchUserStats(targetUserId, accessToken);
        } else {
          console.log('UserProfile - No targetUserId or userData provided');
          // Navigate back if no user data is provided
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
        navigation.goBack();
      } finally {
        setProfileLoading(false);
      }
    };

    getUserId();
  }, [targetUserId, userData]);

  // Function to fetch user statistics
  const fetchUserStats = async (targetUserId, accessToken) => {
    console.log('UserProfile - fetchUserStats called with userId:', targetUserId);
    try {
      // Fetch post count for the user
      const postCountResponse = await fetch(`${base_url}/post/listing/postCount?userId=${targetUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('postCountResponse status:', postCountResponse.status);
      console.log('postCountResponse ok:', postCountResponse.ok);
      
      if (postCountResponse.ok) {
        const postCountResult = await postCountResponse.json();
        console.log('postCountResult:', postCountResult);
        
        if (postCountResult.success) {
          console.log('Setting post count to:', postCountResult.postCountData);
          setProfileInfo(prev => ({
            ...prev,
            Posts: postCountResult.postCountData?.toString() || '0'
          }));
        } else {
          console.error('Post count API returned success: false:', postCountResult.message);
        }
      } else {
        console.error('Post count API failed with status:', postCountResponse.status);
        const errorText = await postCountResponse.text();
        console.error('Post count API error response:', errorText);
      }

      // Fetch followers count
      const followersResponse = await fetch(`${base_url}/follow/getFollowers/${targetUserId}`, {
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
      const followingResponse = await fetch(`${base_url}/follow/getFollowing/${targetUserId}`, {
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
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Handle schedule item press
  const handleSchedulePress = (item) => {
    if (!item || !item.id) {
      console.error('Invalid schedule item:', item);
      return;
    }
    navigation.navigate('TripDetail', { tripId: item.id });
  };


  // Function to process location data
  const processLocationData = async (scheduleData) => {
    try {
      const processedData = await Promise.all(
        scheduleData.map(async (item) => {
          if (!item) return null;
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
      console.error('Error processing location data:', error);
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

        const currentUserId = targetUserId || userId;
        if (!currentUserId) {
          console.log('No target user ID available');
          return;
        }

        // Fetch posts with user ID filter
        setPostsLoading(true);
        const postsResponse = await fetch(`${base_url}/post/listing/filter?filter=my&userId=${targetUserId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (postsResponse.ok) {
          try {
            const response = await postsResponse.json();
            
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
            console.error('Error processing posts response:', error);
            setAllPosts([]);
          }
        } else {
          console.error('Posts fetch failed:', postsResponse.status);
          setAllPosts([]);
        }
        setPostsLoading(false);

        // Fetch schedules with user ID filter
        setScheduleLoading(true);
        const scheduleResponse = await fetch(`${base_url}/schedule/listing/filter?filter=my&userId=${targetUserId}&limit=20`, {
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
          console.log('Fetching shorts for user:', targetUserId);
          const shortsResponse = await fetch(`${base_url}/shorts/listing?userId=${targetUserId}`, {
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
          console.error('Error fetching shorts:', error);
          setAllShorts([]);
        } finally {
          setShortsLoading(false);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [targetUserId, userId]);
  // Add console logs for state changes
  useEffect(() => {
  }, [profileInfo]);

  useEffect(() => {
  }, [all_posts]);

  useEffect(() => {
  }, [all_schedule]);

  useEffect(() => {

  }, [all_shorts]);



  const handleVideoPress = (item) => {
    setSelectedVideo(item);
    setIsFullScreen(true);
    StatusBar.setHidden(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
    setSelectedVideo(null);
    StatusBar.setHidden(false);
  };

  const renderFullScreenVideo = () => {
    if (!selectedVideo) return null;

    return (
      <Modal
        visible={isFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseFullScreen}
      >
        <View style={fullScreenStyles.container}>
          <TouchableOpacity 
            style={fullScreenStyles.closeButton}
            onPress={handleCloseFullScreen}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          <WebView
            source={{ uri: selectedVideo.video }}
            style={fullScreenStyles.video}
            allowsFullscreenVideo
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            mediaPlaybackRequiresUserAction={false}
          />

          <View style={fullScreenStyles.videoInfo}>
            <Text style={fullScreenStyles.videoTitle}>{selectedVideo.videoTitle || 'Untitled'}</Text>
            <Text style={fullScreenStyles.videoDescription}>{selectedVideo.description || 'No description'}</Text>
            <View style={fullScreenStyles.videoStats}>
              <Text style={fullScreenStyles.statText}>{selectedVideo.likes || '0'} likes</Text>
              <Text style={fullScreenStyles.statText}>{selectedVideo.comments || '0'} comments</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };


  // Modify the renderContent function to use skeleton loaders
  // Check if profile is private and if the current user is allowed to view
  const isProfilePrivate = profileInfo.profileViews === 'private';
  const isProfileOwner = currentUser?._id === profileInfo.id;
  const isProfileFollower = isFollowing(profileInfo.id);
  const shouldLockProfile = isProfilePrivate && !isProfileOwner && !isProfileFollower;
  
  // Render locked content component
  const renderLockedContent = (contentType) => (
    <View style={lockedContentStyles.container}>
      <View style={lockedContentStyles.iconContainer}>
        <MaterialIcons name="lock" size={60} color="#ccc" />
      </View>
      <Text style={lockedContentStyles.title}>Content Locked</Text>
      <Text style={lockedContentStyles.description}>
        This user's {contentType} are private and not visible to others.
      </Text>
    </View>
  );

  const renderContent = () => {
    // If profile is private and user is not owner or follower, show locked content for all tabs
    if (shouldLockProfile) {
      switch (activeIcon) {
        case 'th-large':
          return renderLockedContent('posts');
        case 'briefcase':
          return renderLockedContent('schedules');
        case 'play-circle':
          return renderLockedContent('shorts');
        default:
          return null;
      }
    }

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
                      <MaterialIcons name="image" size={40} color="#ccc" />
                    </View>
                  )}
                  <View style={gridStyles.gridItemInfo}>
                    <Text style={gridStyles.gridItemTitle} numberOfLines={1}>
                      {item.postTitle || 'Untitled'}
                    </Text>
                    <View style={gridStyles.gridItemStats}>
                      <View style={gridStyles.statItem}>
                        <MaterialIcons name="favorite" size={14} color="#870E6B" />
                        <Text style={gridStyles.statText}>{item.likes || '0'}</Text>
                      </View>
                      <View style={gridStyles.statItem}>
                        <MaterialIcons name="comment" size={14} color="#870E6B" />
                        <Text style={gridStyles.statText}>{item.comments || '0'}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                        }}
                        style={[gridStyles.deleteButton, { display: 'none' }]}
                      >
                        <MaterialIcons name="delete" size={14} color="#870E6B" />
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
                          <MaterialIcons name="location-on" size={16} color="#870E6B" />
                          <Text style={scheduleStyles.routeText} numberOfLines={2}>
                            {item.fromPlace}
                          </Text>
                        </View>
                      </View>
                      <View style={scheduleStyles.routeItem}>
                        <Text style={scheduleStyles.routeLabel}>To</Text>
                        <View style={scheduleStyles.locationRow}>
                          <MaterialIcons name="location-on" size={16} color="#870E6B" />
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
                        {/* Action buttons removed - view only mode */}
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
                
                return (
                  <TouchableOpacity 
                    style={gridStyles.gridItem}
                    onPress={() => handleVideoPress(item)}
                  >
                    {item.videoImage ? (
                      <Image
                        source={{ uri: item.videoImage }}
                        style={gridStyles.gridImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[gridStyles.gridImage, gridStyles.placeholderImage]}>
                        <MaterialIcons name="play-circle" size={40} color="#ccc" />
                      </View>
                    )}
                    <View style={gridStyles.gridItemInfo}>
                      <Text style={gridStyles.gridItemTitle} numberOfLines={1}>
                        {item.videoTitle || 'Untitled'}
                      </Text>
                      <View style={gridStyles.gridItemStats}>
                        <View style={gridStyles.statItem}>
                          <MaterialIcons name="favorite" size={14} color="#870E6B" />
                          <Text style={gridStyles.statText}>{item.likes || '0'}</Text>
                        </View>
                        <View style={gridStyles.statItem}>
                          <MaterialIcons name="chat-bubble" size={14} color="#870E6B" />
                          <Text style={gridStyles.statText}>{item.comments || '0'}</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation();
                          }}
                          style={[gridStyles.deleteButton, { display: 'none' }]}
                        >
                          <MaterialIcons name="delete" size={14} color="#870E6B" />
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
            {renderFullScreenVideo()}
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.Zypsii_color} barStyle="light-content" />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.topIconsRow}>
            <TouchableOpacity 
              onPress={handleBackPress}
              style={styles.circle}
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
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
            </TouchableOpacity>
            <Text style={styles.name}>{profileInfo.name || '-----'}</Text>
            {userData?.userName && (
              <Text style={styles.username}>@{userData.userName}</Text>
            )}
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
              activeIcon === 'th-large' && { ...styles.activeIconBox, backgroundColor: colors.Zypsii_color},
            ]}
            onPress={() => setActiveIcon('th-large')}
          >
            <Icon name="th-large" size={20} color={activeIcon === 'th-large' ? '#fff' : colors.Zypsii_color} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconBox,
              activeIcon === 'briefcase' && { ...styles.activeIconBox, backgroundColor: colors.Zypsii_color },
            ]}
            onPress={() => setActiveIcon('briefcase')}
          >
            <Icon name="briefcase" size={20} color={activeIcon === 'briefcase' ? '#fff' : colors.Zypsii_color} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconBox,
              activeIcon === 'play-circle' && { ...styles.activeIconBox, backgroundColor: colors.Zypsii_color},
            ]}
            onPress={() => setActiveIcon('play-circle')}
          >
            <Icon name="play-circle" size={20} color={activeIcon === 'play-circle' ? '#fff' : colors.Zypsii_color} />
          </TouchableOpacity>
        </View>

        {/* Content Section based on active icon */}
        <View style={contentStyles.contentContainer}>
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: '#870E6B',
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
  webviewVideo: {
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
  videoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  }
};

// Add new styles for full-screen view
const fullScreenStyles = {
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight * 0.7,
    backgroundColor: 'black',
  },
  closeButton: {
    display: 'none',
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1000,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: 'white',
    marginBottom: 12,
  },
  videoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  statText: {
    fontSize: 12,
    color: 'white',
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

// Add styles for locked content
const lockedContentStyles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f8f9fa',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
};

export default DummyScreen;