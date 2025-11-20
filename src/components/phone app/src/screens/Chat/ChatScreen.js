import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  Image,
  Modal,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { socket_url } from '../../utils/base_url';
import { colors } from '../../utils';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import AllSchedule from '../MySchedule/Schedule/AllSchedule';

const { width, height } = Dimensions.get('window');

// Function to get place name from coordinates using BigDataCloud API (free, no API key required)
const getPlaceName = async (lat, lng) => {
  try {
    console.log('Making geocoding request for:', lat, lng);
    
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Geocoding API response:', data);
    
    if (data.locality && data.city) {
      const address = `${data.locality}, ${data.city}, ${data.countryName}`;
      console.log('Successfully got address:', address);
      return address;
    } else if (data.city) {
      const address = `${data.city}, ${data.countryName}`;
      console.log('Successfully got address:', address);
      return address;
    } else if (data.countryName) {
      const address = data.countryName;
      console.log('Successfully got address:', address);
      return address;
    } else {
      console.log('No results found for coordinates:', lat, lng);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  } catch (error) {
    console.error('Error getting place name:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

const ChatScreen = ({ route, navigation }) => {
  const { userId, userName, userProfilePicture } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [previewModal, setPreviewModal] = useState({
    visible: false,
    content: null,
    type: null
  });
  const flatListRef = useRef(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const typingOpacity = useRef(new Animated.Value(0)).current;

  // Handle status bar for preview modal
  useEffect(() => {
    if (previewModal.visible) {
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
      StatusBar.setBarStyle('light-content');
    }
  }, [previewModal.visible]);

  useEffect(() => {
    initializeChat();
    return () => {
      if (socket) {
        // Leave chat room before disconnecting
        if (currentUserId) {
          socket.emit('leave-chat-room', {
            senderId: currentUserId,
            receiverId: userId
          });
        }
        socket.disconnect();
      }
    };
  }, []);

  // Refresh messages and mark as read when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (socket && currentUserId && isConnected) {
        // Mark messages as read when entering chat
        socket.emit('mark-as-read', {
          senderId: currentUserId,
          receiverId: userId
        });
      }
    }, [socket, currentUserId, isConnected, userId])
  );

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, loading]);

  useEffect(() => {
    // Enhanced header with gradient-style background
    navigation.setOptions({
      title: userName,
      headerStyle: {
        backgroundColor: colors.Zypsii_color || '#6366f1',
        shadowColor: colors.Zypsii_color || '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
      },
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="videocam" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, userName]);

  // Animation for send button
  const animateSendButton = () => {
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animation for typing indicator
  const showTypingIndicator = () => {
    setIsTyping(true);
    Animated.timing(typingOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideTypingIndicator = () => {
    Animated.timing(typingOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsTyping(false));
  };

  const initializeChat = async () => {
    try {
      // Get current user ID from AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      const userDataString = await AsyncStorage.getItem('user');

      if (!token || !userDataString) {
        Alert.alert('Error', 'Authentication required');
        navigation.goBack();
        return;
      }

      // Parse the user data string to get the user ID
      const userData = JSON.parse(userDataString);
      const userIdFromStorage = userData._id;

      setCurrentUserId(userIdFromStorage);

      // Initialize socket connection with reconnection options
      const socketInstance = io(socket_url, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      setSocket(socketInstance);

      // Socket event listeners
      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);

        // Join chat room
        socketInstance.emit('join-chat-room', {
          senderId: userIdFromStorage,
          receiverId: userId
        });

        // Mark messages as read when entering chat
        socketInstance.emit('mark-as-read', {
            senderId: userIdFromStorage,
            receiverId: userId
          });

        // Fetch chat history
          socketInstance.emit('chat-history', {
            senderId: userIdFromStorage,
            receiverId: userId
        });
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        setLoading(false);
        Alert.alert('Connection Error', 'Failed to connect to chat server. Please check your internet connection.');
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Disconnected from socket server:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          socketInstance.connect();
        }
      });

      socketInstance.on('reconnect_attempt', (attemptNumber) => {
        console.log('Attempting to reconnect:', attemptNumber);
      });

      socketInstance.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        socketInstance.emit('join-chat-room', {
          senderId: userIdFromStorage,
          receiverId: userId
        });
        socketInstance.emit('chat-history', {
          senderId: userIdFromStorage,
          receiverId: userId
        });
      });

      socketInstance.on('reconnect_error', (error) => {
        console.error('Reconnection error:', error);
      });

      socketInstance.on('reconnect_failed', () => {
        console.error('Failed to reconnect');
        Alert.alert('Connection Error', 'Unable to reconnect to chat server. Please try again later.');
      });

      socketInstance.on('is-chat-room-joined', (message) => {
        console.log('Chat room joined:', message);
      });

      socketInstance.on('is-leave-chat-room', (message) => {
        console.log('Chat room left:', message);
      });

      socketInstance.on('receive-message', (message) => {
        if (message && message.message) {
          // Helper function to extract sender ID consistently
          const getSenderId = (msg) => {
            if (msg.sender && msg.sender._id) {
              return msg.sender._id;
            }
            if (msg.senderId) {
              if (typeof msg.senderId === 'string') {
                return msg.senderId;
              }
              if (msg.senderId._id) {
                return msg.senderId._id;
              }
            }
            return null;
          };
          
          const senderId = getSenderId(message);
          
          if (senderId) {
            setMessages(prevMessages => [...prevMessages, message]);
            scrollToBottom();
            
            // Mark message as read if it's from the other user
            if (String(senderId) === String(userId)) {
              socketInstance.emit('mark-as-read', {
                senderId: userIdFromStorage,
                receiverId: userId
              });
            }
          }
        } else {
          console.warn('Received invalid message format:', message);
        }
      });

      socketInstance.on('chat-history-result', (chatHistory) => {
        if (Array.isArray(chatHistory)) {
          setMessages(chatHistory);
          setLoading(false);
          // Ensure scroll to bottom after messages are set
          setTimeout(() => {
            scrollToBottom();
          }, 200);
          
          // Mark messages as read after loading history
          if (chatHistory.length > 0) {
            socketInstance.emit('mark-as-read', {
              senderId: userIdFromStorage,
              receiverId: userId
            });
          }
        } else {
          console.warn('Invalid chat history format:', chatHistory);
          setMessages([]);
          setLoading(false);
        }
      });

      socketInstance.on('chat-history-error', (error) => {
        console.error('Chat history error:', error);
        setLoading(false);
        Alert.alert(
          'Error',
          'Failed to load chat history. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => {
                setLoading(true);
                socketInstance.emit('chat-history', {
                  senderId: userIdFromStorage,
                  receiverId: userId
                });
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      });

      socketInstance.on('chat-error', (error) => {
        console.error('Chat error:', error);
        setSending(false);
        Alert.alert('Error', error.message || 'Failed to send message');
      });

      socketInstance.on('messages-marked-read', (data) => {
        console.log('Messages marked as read:', data);
        // Update local messages to mark them as read
        setMessages(prevMessages => 
          prevMessages.map(msg => ({
            ...msg,
            read: true
          }))
        );
      });

    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to initialize chat');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || sending || !isConnected) return;

    setSending(true);
    animateSendButton();

    try {
      socket.emit('send-message', {
        senderId: currentUserId,
        receiverId: userId,
        message: newMessage.trim()
      });

      setNewMessage('');
      setSending(false);
    } catch (error) {
      console.error('Send message error:', error);
      setSending(false);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderDateHeader = ({ item, index, messages }) => {
    if (index === 0) {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
      );
    }

    const previousMessage = messages[index - 1];
    const currentDate = new Date(item.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    if (currentDate !== previousDate) {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
      );
    }

    return null;
  };

  // Helper function to safely extract location information
  const getLocationString = (loc) => {
    if (!loc) return 'Unknown location';
    if (typeof loc === 'string') return loc;
    if (loc.name) return loc.name;
    if (loc.latitude && loc.longitude) {
      return `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`;
    }
    return 'Unknown location';
  };

  // Separate component for Schedule Content
  const ScheduleContent = React.memo(({ sharedContent, onPress }) => {
    const [fromAddress, setFromAddress] = useState('Loading...');
    const [toAddress, setToAddress] = useState('Loading...');

    const scheduleTitle = sharedContent.tripName || 'Untitled Schedule';
    const scheduleImage = sharedContent.bannerImage || null;
    const travelMode = sharedContent.travelMode || 'driving';
    const visibility = sharedContent.visible || 'Private';
    const numberOfDays = sharedContent.numberOfDays || 1;
    const location = sharedContent.location || {};
    const locationDetails = sharedContent.locationDetails || [];
    const createdAt = sharedContent.createdAt ? new Date(sharedContent.createdAt) : new Date();

    // Debug: Log the shared content structure
    console.log('ScheduleContent - sharedContent:', JSON.stringify(sharedContent, null, 2));
    console.log('ScheduleContent - location:', JSON.stringify(location, null, 2));
    console.log('ScheduleContent - locationDetails:', JSON.stringify(locationDetails, null, 2));

    useEffect(() => {
      let isMounted = true;

      const loadAddresses = async () => {
        try {
          console.log('Loading addresses for location:', location);
          
          let fromCoords = null;
          let toCoords = null;

          // Try to get coordinates from location field first
          if (location.from && typeof location.from.latitude === 'number' && typeof location.from.longitude === 'number') {
            fromCoords = { lat: location.from.latitude, lng: location.from.longitude };
          }
          if (location.to && typeof location.to.latitude === 'number' && typeof location.to.longitude === 'number') {
            toCoords = { lat: location.to.latitude, lng: location.to.longitude };
          }

          // Fallback: Try to get coordinates from locationDetails
          if (!fromCoords && locationDetails.length > 0) {
            const firstLocation = locationDetails[0];
            if (firstLocation.location && firstLocation.location.from) {
              fromCoords = { 
                lat: firstLocation.location.from.latitude, 
                lng: firstLocation.location.from.longitude 
              };
            }
          }
          if (!toCoords && locationDetails.length > 1) {
            const lastLocation = locationDetails[locationDetails.length - 1];
            if (lastLocation.location && lastLocation.location.to) {
              toCoords = { 
                lat: lastLocation.location.to.latitude, 
                lng: lastLocation.location.to.longitude 
              };
            }
          }

          // Get from address
          if (fromCoords) {
            console.log('Getting from address for:', fromCoords.lat, fromCoords.lng);
            const fromResult = await getPlaceName(fromCoords.lat, fromCoords.lng);
            console.log('From address result:', fromResult);
            if (isMounted) {
              setFromAddress(fromResult);
            }
          } else {
            console.log('No valid from location found');
            if (isMounted) {
              setFromAddress('Location unavailable');
            }
          }

          // Get to address
          if (toCoords) {
            console.log('Getting to address for:', toCoords.lat, toCoords.lng);
            const toResult = await getPlaceName(toCoords.lat, toCoords.lng);
            console.log('To address result:', toResult);
            if (isMounted) {
              setToAddress(toResult);
            }
          } else {
            console.log('No valid to location found');
            if (isMounted) {
              setToAddress('Location unavailable');
            }
          }
        } catch (error) {
          console.error('Error loading addresses:', error);
          if (isMounted) {
            setFromAddress('Location unavailable');
            setToAddress('Location unavailable');
          }
        }
      };

      loadAddresses();

      return () => {
        isMounted = false;
      };
    }, [location.from, location.to, locationDetails]);

    const handlePress = () => {
      console.log('Schedule pressed, calling onPress with sharedContent:', sharedContent);
      if (onPress) {
        onPress();
      }
    };

    return (
      <TouchableOpacity 
        style={styles.sharedScheduleContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.Zypsii_color || '#6366f1', colors.Zypsii_secondary || '#ff3873']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scheduleGradient}
        >
          {/* Header with Title */}
          <View style={styles.scheduleHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="calendar" size={24} color="#fff" />
              <Text style={styles.scheduleType}>Shared Schedule</Text>
            </View>
            <View style={styles.headerRight}>
              <Ionicons 
                name={visibility.toLowerCase() === 'public' ? 'globe' : 'lock-closed'} 
                size={18} 
                color="#fff" 
              />
            </View>
          </View>

          {/* Schedule Image and Title */}
          <View style={styles.scheduleImageContainer}>
            {scheduleImage ? (
              <Image 
                source={{ uri: scheduleImage }} 
                style={styles.scheduleImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image" size={40} color="rgba(255,255,255,0.5)" />
              </View>
            )}
            <View style={styles.scheduleTitleContainer}>
              <Text style={styles.scheduleTitle} numberOfLines={2}>
                {scheduleTitle}
              </Text>
            </View>
          </View>
          
          <View style={styles.scheduleDetails}>
            {/* Location Details */}
            <View style={styles.locationContainer}>
              <View style={styles.locationItem}>
                <Ionicons name="location" size={18} color="#fff" />
                <Text style={styles.locationText} numberOfLines={2}>
                  From: {fromAddress}
                </Text>
              </View>
              <View style={styles.locationItem}>
                <Ionicons name="location" size={18} color="#fff" />
                <Text style={styles.locationText} numberOfLines={2}>
                  To: {toAddress}
                </Text>
              </View>
            </View>

            {/* Travel Mode & Duration */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons 
                  name={
                    travelMode.toLowerCase() === 'car' ? 'car' : 
                    travelMode.toLowerCase() === 'walk' ? 'walk' : 
                    travelMode.toLowerCase() === 'bike' ? 'bicycle' : 'bus'
                  } 
                  size={18} 
                  color="#fff" 
                />
                <Text style={styles.infoText}>
                  {travelMode}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={18} color="#fff" />
                <Text style={styles.infoText}>
                  {numberOfDays} {numberOfDays > 1 ? 'Days' : 'Day'}
                </Text>
              </View>
            </View>

            {/* Created Date */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={18} color="#fff" />
                <Text style={styles.infoText}>
                  Created: {createdAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  });

  // Update the renderSharedContent function
  const renderSharedContent = ({ moduleType, sharedContent }) => {
    if (!sharedContent) return null;

    if (moduleType === 'schedules' && sharedContent) {
      return (
        <ScheduleContent 
          sharedContent={sharedContent}
          onPress={() => handleSharedContentPress(moduleType, sharedContent)}
        />
      );
    }
    if (!sharedContent) return null;

    const renderPreview = () => {
      switch (moduleType) {
        case 'schedules':
          // Validate required fields for schedule
          if (!sharedContent.locationDetails || !Array.isArray(sharedContent.locationDetails)) {
            return (
              <View style={styles.sharedContentPreview}>
                <View style={styles.sharedContentTextContainer}>
                  <Text style={styles.sharedContentTitle} numberOfLines={2}>
                    {sharedContent.tripName || 'Shared schedule'}
                  </Text>
                  {sharedContent.bannerImage && (
                    <Image 
                      source={{ uri: sharedContent.bannerImage }} 
                      style={styles.sharedContentImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
              </View>
            );
          }
          return (
            <View style={styles.sharedContentContainer}>
              <AllSchedule 
                item={{
                  ...sharedContent,
                  locationDetails: sharedContent.locationDetails || [],
                  joined: false,
                  shareCount: sharedContent.shareCount || 0
                }} 
                isFromProfile={false} 
              />
            </View>
          );
        case 'post':
          return (
            <View style={styles.sharedContentPreview}>
              {sharedContent.mediaUrl && sharedContent.mediaUrl.length > 0 && (
                <View style={styles.sharedImageContainer}>
                  <Image 
                    source={{ uri: sharedContent.mediaUrl[0] }} 
                    style={styles.sharedContentImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              <View style={styles.sharedContentTextContainer}>
                <Text style={styles.sharedContentTitle} numberOfLines={2}>
                  {sharedContent.postTitle || 'Shared post'}
                </Text>
                {sharedContent.mediaType && (
                  <Text style={styles.sharedContentSubtext}>
                    {sharedContent.mediaType} • {sharedContent.postType}
                  </Text>
                )}
              </View>
            </View>
          );
        case 'shorts':
          return (
            <View style={styles.sharedContentPreviewShorts}>
              <View style={styles.sharedImageContainerShorts}>
                <Image 
                  source={{ uri: sharedContent.thumbnailUrl || sharedContent.videoUrl }} 
                  style={styles.sharedContentImageShorts}
                  resizeMode="cover"
                />
                {/* Play icon overlay */}
                <View style={styles.playIconOverlay}>
                  <Ionicons name="play-circle" size={40} color="#fff" />
                </View>
              </View>
              <View style={styles.sharedContentTextContainer}>
                {/* User info section */}
                {sharedContent.createdBy && (
                  <View style={styles.sharedContentUserInfo}>
                    <Image
                      source={{
                        uri: sharedContent.createdBy.profilePicture || 'https://via.placeholder.com/24'
                      }}
                      style={styles.sharedContentUserAvatar}
                    />
                    <Text style={styles.sharedContentUsername} numberOfLines={1}>
                      {sharedContent.createdBy.userName || 'User'}
                    </Text>
                  </View>
                )}
                <Text style={styles.sharedContentTitle} numberOfLines={2}>
                  {sharedContent.title || 'Shared short'}
                </Text>
                {sharedContent.description && (
                  <Text style={styles.sharedContentSubtext} numberOfLines={1}>
                    {sharedContent.description}
                  </Text>
                )}
              </View>
            </View>
          );
        case 'story':
          return (
            <View style={styles.sharedContentPreview}>
              {sharedContent.media && (
                <Image 
                  source={{ uri: sharedContent.media }} 
                  style={styles.sharedContentImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.sharedContentText} numberOfLines={2}>Story</Text>
            </View>
          );
        default:
          return null;
      }
    };

    return (
      <TouchableOpacity 
        style={styles.sharedContentContainer}
        onPress={() => handleSharedContentPress(moduleType, sharedContent)}
      >
        {renderPreview()}
      </TouchableOpacity>
    );
  };

  const handleSharedContentPress = async (moduleType, content) => {
    if (moduleType === 'schedules') {
      console.log('Original schedule content:', JSON.stringify(content, null, 2));
      
      // Get readable addresses from coordinates
      let fromAddress = 'Starting Point';
      let toAddress = 'End Point';
      
      try {
        if (content.location?.from?.latitude && content.location?.from?.longitude) {
          fromAddress = await getPlaceName(content.location.from.latitude, content.location.from.longitude);
        }
        if (content.location?.to?.latitude && content.location?.to?.longitude) {
          toAddress = await getPlaceName(content.location.to.latitude, content.location.to.longitude);
        }
      } catch (error) {
        console.error('Error getting addresses:', error);
        // Fallback to coordinates if geocoding fails
        if (content.location?.from) {
          fromAddress = `${content.location.from.latitude}, ${content.location.from.longitude}`;
        }
        if (content.location?.to) {
          toAddress = `${content.location.to.latitude}, ${content.location.to.longitude}`;
        }
      }
      
      // Transform the data to match TripDetail's expected format (same as DummyScreen)
      const tripData = {
        id: content._id,
        title: content.tripName || 'Untitled Trip',
        from: fromAddress,
        to: toAddress,
        date: content.Dates?.from || new Date().toISOString().split('T')[0],
        numberOfDays: content.numberOfDays?.toString() || '1',
        imageUrl: content.bannerImage || null,
        locationDetails: content.location ? [
          {
            name: fromAddress,
            address: fromAddress,
            latitude: content.location.from?.latitude,
            longitude: content.location.from?.longitude
          },
          {
            name: toAddress,
            address: toAddress,
            latitude: content.location.to?.latitude,
            longitude: content.location.to?.longitude
          }
        ] : [],
        riders: content.numberOfDays?.toString() || '1',
        travelMode: content.travelMode || 'Bike',
        visible: 'Public',
        createdBy: content.createdBy || '',
        createdAt: content.createdAt || '',
        updatedAt: content.updatedAt || ''
      };

      console.log('Complete tripData being passed to TripDetail:', JSON.stringify(tripData, null, 2));

      // Navigate to TripDetail screen with the same data structure as DummyScreen
      navigation.navigate('TripDetail', { 
        tripData: tripData,
        scheduleData: content,
        allSchedules: [] // You can pass all schedules if available
      });
    } else if (moduleType === 'shorts') {
      navigation.navigate('Shorts', {
        userShorts: [content],
        initialIndex: 0,
      });
    } else if (moduleType === 'post') {
      // Transform shared post data to match PostDetail screen's expected format
      const transformedPost = {
        ...content,
        imageUrl: content.mediaUrl || [], // Map mediaUrl to imageUrl
        postTitle: content.postTitle || 'Shared post',
        postType: content.postType || 'Public',
        likes: content.likes || content.likesCount || 0,
        comments: content.comments || content.commentsCount || 0,
        shares: content.shares || content.shareCount || 0,
        tags: content.tags || [],
        createdAt: content.createdAt || new Date().toISOString(),
        id: content._id || content.id
      };
      
      // Navigate to PostDetail screen for shared posts
      navigation.navigate('PostDetail', { 
        post: transformedPost 
      });
    } else {
      // For other content types, show the preview modal
      setPreviewModal({
        visible: true,
        content,
        type: moduleType
      });
    }
  };

  const renderPreviewModal = () => {
    const { visible, content, type } = previewModal;
    if (!visible || !content) return null;

    const closePreview = () => {
      setPreviewModal({
        visible: false,
        content: null,
        type: null
      });
    };

    const renderPreviewContent = () => {
      switch (type) {
        case 'schedules':
          // Validate required fields for schedule
          if (!content.locationDetails || !Array.isArray(content.locationDetails)) {
            return (
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle}>{content.tripName || 'Shared schedule'}</Text>
                {content.bannerImage && (
                  <Image 
                    source={{ uri: content.bannerImage }}
                    style={styles.previewImage}
                  />
                )}
              </View>
            );
          }
          return (
            <View style={styles.previewContent}>
              <AllSchedule 
                item={{
                  ...content,
                  locationDetails: content.locationDetails || [],
                  joined: false,
                  shareCount: content.shareCount || 0
                }} 
                isFromProfile={false} 
              />
            </View>
          );
        case 'post':
          return (
            <View style={styles.previewContent}>
              {content.mediaUrl && content.mediaUrl.length > 0 && (
                <Image 
                  source={{ uri: content.mediaUrl[0] }}
                  style={styles.previewImage}
                />
              )}
              <Text style={styles.previewTitle}>{content.postTitle || 'Shared post'}</Text>
              {content.mediaType && (
                <Text style={styles.previewSubtext}>
                  {content.mediaType} • {content.postType}
                </Text>
              )}
            </View>
          );
        case 'shorts':
          return (
            <View style={styles.previewContent}>
              {content.videoUrl ? (
                <Video
                  source={{ uri: content.videoUrl }}
                  style={styles.previewVideo}
                  useNativeControls
                  resizeMode="contain"
                  shouldPlay={true}
                  isLooping
                />
              ) : (
                <Image 
                  source={{ uri: content.thumbnailUrl || content.thumbnail }}
                  style={styles.previewImage}
                />
              )}
              {/* User info overlay */}
              {content.createdBy && (
                <View style={styles.previewUserInfo}>
                  <Image
                    source={{
                      uri: content.createdBy.profilePicture || 'https://via.placeholder.com/32'
                    }}
                    style={styles.previewUserAvatar}
                  />
                  <Text style={styles.previewUsername}>
                    {content.createdBy.userName || 'User'}
                  </Text>
                </View>
              )}
              <Text style={styles.previewTitle}>{content.title || content.caption || 'Shared short'}</Text>
              {content.description && (
                <Text style={styles.previewDescription}>{content.description}</Text>
              )}
            </View>
          );
        case 'story':
          return (
            <View style={styles.previewContent}>
              {content.media && (
                <Image 
                  source={{ uri: content.media }}
                  style={styles.previewImage}
                />
              )}
              <Text style={styles.previewTitle}>Story</Text>
            </View>
          );
        default:
          return null;
      }
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePreview}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closePreview}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {renderPreviewContent()}
          </View>
        </View>
      </Modal>
    );
  };

  // Helper function to generate avatar color based on user name
  const getAvatarColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const renderMessage = ({ item, index }) => {
    // Helper function to extract sender ID consistently
    const getSenderId = (message) => {
      // Handle different data structures
      if (message.sender && message.sender._id) {
        return message.sender._id;
      }
      if (message.senderId) {
        if (typeof message.senderId === 'string') {
          return message.senderId;
        }
        if (message.senderId._id) {
          return message.senderId._id;
        }
      }
      return null;
    };

    // Helper function to get sender's profile picture
    const getSenderProfilePicture = (message) => {
      if (message.sender && message.sender.profilePicture) {
        return message.sender.profilePicture;
      }
      if (message.senderId && message.senderId.profilePicture) {
        return message.senderId.profilePicture;
      }
      return userProfilePicture || 'https://via.placeholder.com/32'; // Fallback to route param or placeholder
    };

    // Helper function to get sender's user name
    const getSenderUserName = (message) => {
      if (message.sender && message.sender.userName) {
        return message.sender.userName;
      }
      if (message.senderId && message.senderId.userName) {
        return message.senderId.userName;
      }
      return userName; // Fallback to route param
    };

    const senderId = getSenderId(item);
    const isMyMessage = String(senderId) === String(currentUserId);
    const senderProfilePicture = getSenderProfilePicture(item);
    const senderUserName = getSenderUserName(item);
    
    const isFirstInGroup = index === 0 || 
      (() => {
        const prevItem = messages[index - 1];
        const prevSenderId = getSenderId(prevItem);
        return String(prevSenderId) !== String(senderId);
      })();
    
    const isLastInGroup = index === messages.length - 1 || 
      (() => {
        const nextItem = messages[index + 1];
        const nextSenderId = getSenderId(nextItem);
        return String(nextSenderId) !== String(senderId);
      })();

    return (
      <>
        {renderDateHeader({ item, index, messages })}
        <Animated.View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
          isFirstInGroup && styles.firstInGroup,
          isLastInGroup && styles.lastInGroup
        ]}>
          {!isMyMessage && isFirstInGroup && (
            <View style={styles.messageHeader}>
              <View style={styles.avatarContainer}>
                {senderProfilePicture ? (
                  <Image
                    source={{ uri: senderProfilePicture }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View style={[
                    styles.userAvatar, 
                    styles.avatarPlaceholder, 
                    { backgroundColor: getAvatarColor(senderUserName) }
                  ]}>
                    <Text style={styles.avatarText}>
                      {senderUserName ? senderUserName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.onlineIndicator} />
              </View>
              <Text style={styles.userName}>{senderUserName}</Text>
            </View>
          )}
          <LinearGradient
            colors={isMyMessage ? 
              [colors.Zypsii_color || '#6366f1', '#ff3873'] : 
              ['#ffffff', '#f8fafc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
              isFirstInGroup && (isMyMessage ? styles.myFirstBubble : styles.otherFirstBubble),
              isLastInGroup && (isMyMessage ? styles.myLastBubble : styles.otherLastBubble)
            ]}
          >
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.message}
            </Text>
            
            {item.shareData && item.sharedContent && (
              renderSharedContent({
                moduleType: item.shareData.moduleType,
                sharedContent: item.sharedContent
              })
            )}

            <View style={styles.messageFooter}>
              <Text style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime
              ]}>
                {formatMessageTime(item.createdAt)}
              </Text>
              {isMyMessage && (
                <Ionicons 
                  name={item.read ? "checkmark-done" : "checkmark"} 
                  size={14} 
                  color={item.read ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.7)"} 
                  style={styles.readIndicator}
                />
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </>
    );
  };

  const renderSeparator = () => <View style={styles.messageSeparator} />;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.Zypsii_color || '#6366f1'} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
              <StatusBar barStyle="light-content" backgroundColor={colors.Zypsii_color || '#6366f1'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled={true}
      >
        {/* Connection Status */}
        {!isConnected && (
          <View style={styles.connectionStatus}>
            <Text style={styles.connectionText}>Connecting...</Text>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => {
            // Handle both old and new data structures
            if (item._id) return item._id.toString();
            // Fallback to index if no _id
            return index.toString();
          }}
          contentContainerStyle={[
            styles.messagesContainer,
            { flexGrow: 1, justifyContent: messages.length === 0 ? 'center' : 'flex-end' }
          ]}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyContent}>
                <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e0" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubText}>Start the conversation with {userName}!</Text>
              </View>
            </View>
          }
          onContentSizeChange={() => {
            if (messages.length > 0) {
              scrollToBottom();
            }
          }}
          onLayout={() => {
            if (messages.length > 0) {
              scrollToBottom();
            }
          }}
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#a0aec0"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
              editable={!sending && isConnected}
              textAlignVertical="top"
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  scrollToBottom();
                }, 300);
              }}
              onContentSizeChange={() => {
                // Ensure proper scrolling when text input expands
                setTimeout(() => {
                  scrollToBottom();
                }, 100);
              }}
            />
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() || sending || !isConnected) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending || !isConnected}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
        {renderPreviewModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.Zypsii_color || '#ff3873',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  headerButton: {
    marginRight: 15,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '600',
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
    minHeight: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  emptyText: {
    fontSize: 24,
    color: '#1e293b',
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageContainer: {
    marginVertical: 2,
    width: '100%',
    paddingHorizontal: 8,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
    width: '100%',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  firstInGroup: {
    marginTop: 16,
  },
  lastInGroup: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  myFirstBubble: {
    borderTopRightRadius: 20,
  },
  myLastBubble: {
    borderBottomRightRadius: 20,
  },
  otherFirstBubble: {
    borderTopLeftRadius: 20,
  },
  otherLastBubble: {
    borderBottomLeftRadius: 20,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#1e293b',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  otherMessageTime: {
    color: '#64748b',
  },
  readIndicator: {
    marginLeft: 4,
  },
  messageSeparator: {
    height: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 4,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 24,
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sharedContentContainer: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    maxWidth: 280,
  },
  sharedContentPreview: {
    width: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  sharedContentPreviewShorts: {
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  sharedImageContainer: {
    width: 80,
    height: 100,
    position: 'relative',
  },
  sharedImageContainerShorts: {
    width: 200,
    height: 150,
    position: 'relative',
  },
  sharedContentImage: {
    width: 150,
    height: 100, 
    borderRadius: 8,
  },
  sharedContentImageShorts: {
    width: 200,
    height: 150, 
    borderRadius: 8,
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sharedContentTextContainer: {
    padding: 12,
    width: '100%',
  },
  sharedContentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  sharedContentSubtext: {
    fontSize: 13,
    color: '#64748b',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 60,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 24,
    marginRight: 8,
    color: '#1e293b',
    fontWeight: '400',
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
            backgroundColor: colors.Zypsii_color || '#6366f1',
        shadowColor: colors.Zypsii_color || '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  connectionStatus: {
    backgroundColor: '#ef4444',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  previewContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  previewVideo: {
    width: '100%',
    height: 200,
  },
  previewTitle: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
  },
  previewSubtext: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 5,
  },
  previewDescription: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 5,
    lineHeight: 20,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 15,
    marginRight: 10,
    marginTop: 4
  },
  sharedScheduleContainer: {
    marginVertical: 10,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '90%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  scheduleGradient: {
    width: '100%',
    minHeight: 200,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    padding: 4,
  },
  scheduleType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
    opacity: 0.9,
  },
  scheduleImageContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  scheduleImage: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleTitleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scheduleDetails: {
    flex: 1,
    paddingTop: 12,
    gap: 12,
  },
  locationContainer: {
    gap: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  locationDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  sharedContentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sharedContentUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  sharedContentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  previewUserInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
  },
  previewUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ChatScreen;