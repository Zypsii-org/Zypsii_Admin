import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, TextInput, Image, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../context/ToastContext';

const MessageList = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  // Refresh chat list when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the authentication token from AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get current user ID for last message comparison
      let currentUserId = null;
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          currentUserId = userData._id;
        }
      } catch (error) {
        console.error('Error getting current user ID:', error);
      }

      const response = await axios.get(`${base_url}/user/list-chat-members`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response received message list:', response.data);
      
      // Check if response is valid and has the expected structure
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      // Check if the response indicates success
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch chat members');
      }

      // Check if data array exists
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.log('No data array found or data is not an array:', response.data);
        setUsers([]); // Set empty array if no data
        return;
      }

      // Transform the response data to match our UI needs
      const transformedUsers = response.data.data.map(user => {
        // Extract name from userName (remove _ZY_ and numbers)
        const name = user.userName ? user.userName.split('_ZY_')[0] : 'Unknown User';
        
        // Determine last message display
        let lastMessageDisplay = 'No messages yet';
        if (user.lastMessage) {
          if (currentUserId && user.lastMessageSenderId === currentUserId) {
            lastMessageDisplay = `You: ${user.lastMessage}`;
          } else {
            lastMessageDisplay = user.lastMessage;
          }
        }
        
        return {
          _id: user.userId || '',
          name: name,
          userName: user.userName || '',
          email: '', // Not provided in response
          profileImage: user.profilePicture || null,
          lastMessage: lastMessageDisplay,
          lastMessageSenderId: user.lastMessageSenderId || null,
          lastMessageTime: user.lastMessageTime ? new Date(user.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time',
          unreadCount: user.unreadCount || 0
        };
      });
      
      console.log('Transformed users:', transformedUsers);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      let errorMessage = 'Failed to load messages. ';
      if (error.message === 'No authentication token found') {
        errorMessage = 'Please login to view messages';
        showToast(errorMessage, 'error', {
          onConfirm: () => navigation.navigate('Login')
        });
      } else if (error.response) {
        errorMessage += `Server responded with status ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'No response received from server';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      if (error.message !== 'No authentication token found') {
        showToast(errorMessage, 'error', {
          onConfirm: () => fetchUsers()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item, index }) => {
    const animatedValue = new Animated.Value(0);
    
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();

    return (
      <Animated.View
        style={[
          styles.itemContainer,
          {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('ChatScreen', { 
            userId: item._id,
            userName: item.name
          })}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {item.profileImage ? (
              <Image source={{ uri: item.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: getAvatarColor(item.name) }]}>
                <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
            )}
            {/* {item.isOnline && <View style={styles.onlineIndicator} />} */}
          </View>
          
          <View style={styles.textContent}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.timeText}>{item.lastMessageTime}</Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>@{item.userName}</Text>
            <Text style={styles.lastMessage} numberOfLines={2}>
              {item.lastMessage}
            </Text>
          </View>
          
          <View style={styles.rightContent}>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" style={styles.chevron} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getAvatarColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff3873" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#FF3B30" />
        </View>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
          <Ionicons name="refresh" size={18} color="#fff" style={styles.retryIcon} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={[
        styles.searchContainer,
        searchFocused && styles.searchContainerFocused
      ]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={searchFocused ? "#ff3873" : "#8E8E93"} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'No results found for your search' : 'Start a conversation to see it here'}
            </Text>
          </View>
        }
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    color: '#ff3873',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff3873',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#ff3873',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchContainerFocused: {
    borderColor: '#ff3873',
    shadowColor: '#ff3873',
    shadowOpacity: 0.1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  clearButton: {
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  separator: {
    height: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  userName: {
    fontSize: 15,
    color: '#ff3873',
    marginBottom: 4,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  unreadBadge: {
    backgroundColor: '#ff3873',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chevron: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MessageList;