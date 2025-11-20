import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FollowButton from '../../components/Follow/FollowButton';
import { useFollow } from '../../components/Follow/FollowContext';

const FollowersList = ({ navigation, route }) => {
  const { isFollowing } = useFollow();
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'Followers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Get the target user ID from route params, fallback to current user if not provided
  const targetUserId = route.params?.targetUserId;

  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const storedUserString = await AsyncStorage.getItem('user');
        if (storedUserString) {
          const storedUser = JSON.parse(storedUserString);
          setCurrentUserId(storedUser._id);
        }
      } catch (error) {
        console.error('Error getting current user ID:', error);
      }
    };

    getCurrentUserId();
    fetchFollowData();
  }, [isFollowing, targetUserId]); // Refresh when follow status changes or target user changes

  const fetchFollowData = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // Use targetUserId if provided, otherwise get current user
      let userId;
      if (targetUserId) {
        userId = targetUserId;
      } else {
        const storedUserString = await AsyncStorage.getItem('user');
        const storedUser = JSON.parse(storedUserString);
        userId = storedUser._id;
      }
      
      console.log('Fetching follow data for user ID:', userId);
      
      // Fetch followers
      const followersResponse = await fetch(`${base_url}/follow/getFollowers/${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
       console.log(followersResponse.error);
      
      // Fetch following
      const followingResponse = await fetch(`${base_url}/follow/getFollowing/${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      } );
      console.log(followingResponse.error);

      // if (!followersResponse.ok || !followingResponse.ok) {
      //   throw new Error('Failed to fetch follow data');
      // }

      const followersData = await followersResponse.json();
      const followingData = await followingResponse.json();
      
      console.log('Followers data:', followersData);
      console.log('Following data:', followingData);

      // Extract the actual arrays from the nested response
      setFollowers(followersData.followers || []);
      setFollowing(followingData.following || []);
    } catch (error) {
      console.error('Error fetching follow data:', error);
      // Set empty arrays in case of error
      setFollowers([]);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => {
        navigation.navigate('UserProfile', { 
          targetUserId: item._id,
          userData: {
            id: item._id,
            fullName: item.fullName || 'Unknown User',
            userName: item.userName || '',
            email: item.email || '',
            website: item.website || '',
            bio: item.bio || '',
            location: item.location || '',
            placeDetails: item.placeDetails || {},
            profilePicture: item.profileImage || 'https://via.placeholder.com/50'
          }
        });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.personContainer}>
        <View style={styles.avatarContainer}>
          <Image 
            source={item.profileImage ? { uri: item.profileImage } : require('../../assets/profileimage.jpg')} 
            style={styles.avatar} 
          />
          <View style={styles.onlineIndicator} />
        </View>
        
        <View style={styles.personDetails}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.personName} numberOfLines={1}>
                {item.fullName || 'Unknown User'}
              </Text>
              {item.userName && (
                <Text style={styles.personTagline} numberOfLines={1}>
                  @{item.userName}
                </Text>
              )}
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => {
                  if (!item._id || !item.fullName) {
                    return;
                  }
                  
                  navigation.navigate('ChatScreen', { 
                    userId: item._id,
                    userName: item.fullName
                  });
                }}
              >
                <Ionicons name="chatbubble-outline" size={18} color={colors.Zypsii_color} />
              </TouchableOpacity>
              {(() => {
                // Extract the actual user ID for comparison
                const getUserId = () => {
                  if (!item._id) return null;
                  if (typeof item._id === 'object' && item._id !== null && item._id._id) {
                    return item._id._id;
                  }
                  return String(item._id);
                };
                
                const userId = getUserId();
                const shouldShowFollowButton = currentUserId && userId && currentUserId !== userId;
                
                return shouldShowFollowButton ? (
                  <FollowButton userId={item._id} />
                ) : null;
              })()}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.btncolor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === 'Followers' ? 'Followers' : 'Following'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Followers' && styles.activeTab]}
          onPress={() => setActiveTab('Followers')}
        >
          <Text style={[styles.tabText, activeTab === 'Followers' && styles.activeTabText]}>
            Followers ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Following' && styles.activeTab]}
          onPress={() => setActiveTab('Following')}
        >
          <Text style={[styles.tabText, activeTab === 'Following' && styles.activeTabText]}>
            Following ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'Followers' ? followers : following}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons 
              name="people-outline" 
              size={64} 
              color="#E0E0E0" 
            />
            <Text style={styles.noResultsTitle}>
              {activeTab === 'Followers' 
                ? 'No followers yet' 
                : 'Not following anyone yet'}
            </Text>
            <Text style={styles.noResultsSubtitle}>
              {activeTab === 'Followers' 
                ? 'When people follow you, they will appear here' 
                : 'People you follow will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.btncolor,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: colors.btncolor,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  userItem: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  personContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  personDetails: {
    marginLeft: 16,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  personName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  personTagline: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.Zypsii_color + "20",
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.btncolor,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default FollowersList;