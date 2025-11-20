import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  StyleSheet
} from 'react-native'
import { styles } from './styles'
import { useNavigation } from '@react-navigation/native' // Import useNavigation
import Icon from 'react-native-vector-icons/Ionicons' // Import vector icons
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons' // Import AntDesign icons
import { colors } from '../../../utils' // Import colors
import AsyncStorage from '@react-native-async-storage/async-storage'
import { base_url, socket_url } from '../../../utils/base_url'
import { useToast } from '../../../context/ToastContext'
import io from 'socket.io-client'

const AllSchedule = ({ item, isFromProfile }) => {
  const navigation = useNavigation() // Access navigation object
  const { showToast } = useToast()
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [fromPlace, setFromPlace] = useState('')
  const [toPlace, setToPlace] = useState('')
  const [isJoined, setIsJoined] = useState(item.joined || false)
  const [joinRequestSent, setJoinRequestSent] = useState(false)
  const [joinStatus, setJoinStatus] = useState(null) // 'joined', 'pending', 'rejected', null
  const [showShareModal, setShowShareModal] = useState(false)
  const [followers, setFollowers] = useState([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)
  const [shareCount, setShareCount] = useState(item.shareCount || 0)
  const socketRef = useRef(null)
  const isShareRoomJoined = useRef(false)
  // Function to check current join status
  const checkJoinStatus = async () => {
    if (!currentUserId || !item._id) return

    try {
      const token = await AsyncStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(
        `${base_url}/schedule/listing/complete-join-status?scheduleId=${item._id}&requestedUserId=${currentUserId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (response.ok && data.status) {
        switch (data.joinStatus) {
          case 'joined':
            setJoinStatus('joined')
            setIsJoined(true)
            setJoinRequestSent(false)
            break
          case 'pending':
            setJoinStatus('pending')
            setIsJoined(false)
            setJoinRequestSent(true)
            break
          case 'rejected':
            setJoinStatus('rejected')
            setIsJoined(false)
            setJoinRequestSent(false)
            break
          case 'none':
          default:
            setJoinStatus(null)
            setIsJoined(false)
            setJoinRequestSent(false)
            break
        }
      }
    } catch (error) {
      console.error('Error checking join status:', error)
    }
  }

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const user = await AsyncStorage.getItem('user')
        const parsedUser = user ? JSON.parse(user) : null
        if (parsedUser && parsedUser._id) {
          setCurrentUserId(parsedUser._id)
        }
      } catch (error) {
        console.error('Error loading user ID:', error)
      }
    }
    loadUserId()

    // Set place names from locationDetails
    if (item.locationDetails && item.locationDetails.length >= 2) {
      setFromPlace(item.locationDetails[0].address || 'Unknown location')
      setToPlace(
        item.locationDetails[item.locationDetails.length - 1].address ||
          'Unknown location'
      )
    }

    return () => {
      if (socketRef.current) {
        if (isShareRoomJoined.current) {
          leaveShareRoom()
        }
        // Remove all listeners
        socketRef.current.removeAllListeners()
      }
    }
  }, [item])

  // Check join status when currentUserId is available
  useEffect(() => {
    if (currentUserId && item._id) {
      checkJoinStatus()
    }
  }, [currentUserId, item._id])

  // Check join status when socket is connected
  useEffect(() => {
    if (socketRef.current?.connected && currentUserId && item._id) {
      checkJoinStatus()
    }
  }, [socketRef.current?.connected, currentUserId, item._id])

  useEffect(() => {
    const initializeSocket = async () => {
      // Initialize socket connection if not already connected
      if (!socketRef.current) {
        try {
          // Get authentication token
          const token = await AsyncStorage.getItem('accessToken')

          if (!token) {
            console.log('No authentication token found')
            return
          }

          socketRef.current = io(socket_url, {
            auth: {
              token: token
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
          })

          // Wait for socket to connect before setting up listeners
          socketRef.current.on('connect', () => {
            console.log('Socket connected:', socketRef.current.id)
            // Setup user for notifications
            if (currentUserId) {
              socketRef.current.emit('setup', currentUserId)
            }
            setupSocketListeners()
            // Join share room on connection if modal is open
            if (showShareModal) {
              joinShareRoom()
            }
          })

          socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error)
            showToast(
              'Connection error. Please check your internet connection.',
              'error'
            )
          })

          socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected')
            isShareRoomJoined.current = false
          })
        } catch (error) {
          console.error('Error initializing socket:', error)
        }
      }
    }

    initializeSocket()

    return () => {
      if (socketRef.current) {
        if (isShareRoomJoined.current) {
          leaveShareRoom()
        }
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
      }
    }
  }, [currentUserId])

  // Monitor share modal state
  useEffect(() => {
    if (
      showShareModal &&
      socketRef.current?.connected &&
      !isShareRoomJoined.current
    ) {
      joinShareRoom()
    }
  }, [showShareModal])

  const setupSocketListeners = () => {
    if (!socketRef.current) return

    // Remove existing listeners before adding new ones
    socketRef.current.removeAllListeners()

    // Share-related listeners
    socketRef.current.on('join-share-room-status', (data) => {
      console.log(
        `Schedule ${item._id || item.id} - Join share room status:`,
        data
      )
      if (data.moduleId === (item._id || item.id)) {
        isShareRoomJoined.current = true
        requestShareCount()
      }
    })

    socketRef.current.on('leave-share-room-status', (data) => {
      console.log(
        `Schedule ${item._id || item.id} - Leave share room status:`,
        data
      )
      if (data.moduleId === (item._id || item.id)) {
        isShareRoomJoined.current = false
      }
    })

    socketRef.current.on('share-count', (data) => {
      console.log('Received share-count:', data)
      if (data.moduleId === (item._id || item.id)) {
        console.log(
          `Schedule ${item._id || item.id} - Share count updated:`,
          data.count
        )
        setShareCount(data.count)
      }
    })

    socketRef.current.on('share-count-status', (data) => {
      console.log('Received share-count-status:', data)
      if (data.moduleId === (item._id || item.id)) {
        console.log(
          `Schedule ${item._id || item.id} - Share count status updated:`,
          data.count
        )
        setShareCount(data.count)
      }
    })

    socketRef.current.on('share-error', (error) => {
      console.error('Share error:', error)
      showToast(error.message || 'Failed to share schedule', 'error')
    })

    // Join request status update listeners
    socketRef.current.on('join-request-updated', (data) => {
      console.log('Join request status updated:', data)
      if (data.scheduleId === (item._id || item.id)) {
        if (data.status === 'accepted') {
          setJoinStatus('joined')
          setIsJoined(true)
          setJoinRequestSent(false)
          showToast(
            data.message || 'Your join request has been accepted!',
            'success'
          )
        } else if (data.status === 'rejected') {
          setJoinStatus('rejected')
          setIsJoined(false)
          setJoinRequestSent(false)
          showToast(
            data.message || 'Your join request has been rejected.',
            'error'
          )
        }
      }
    })

    // Add connection event listeners
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id)
    })

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected')
      isShareRoomJoined.current = false
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      showToast(
        'Connection error. Please check your internet connection.',
        'error'
      )
    })
  }

  const handleShare = async () => {
    if (!currentUserId) {
      showToast('Please login to share schedules', 'error')
      return
    }

    try {
      // Check if socket exists and is connected
      if (socketRef.current?.connected) {
        // Socket is ready, proceed with share
        setShowShareModal(true)
        await fetchFollowers()

        if (!isShareRoomJoined.current) {
          joinShareRoom()
        }
        return
      }

      // Socket doesn't exist or isn't connected - initialize it
      const token = await AsyncStorage.getItem('accessToken')
      if (!token) {
        showToast('Authentication required. Please login again.', 'error')
        return
      }

      showToast('Connecting to server...', 'info')

      // Create new socket connection with promise wrapper
      const connectSocket = () => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Connection timeout'))
          }, 10000) // 10 second timeout

          // Initialize socket if it doesn't exist
          if (!socketRef.current) {
            socketRef.current = io(socket_url, {
              auth: { token },
              transports: ['websocket'],
              reconnection: true,
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              timeout: 10000
            })
          }

          // Handle successful connection
          socketRef.current.once('connect', () => {
            clearTimeout(timeoutId)
            console.log('Socket connected:', socketRef.current.id)

            // Setup user for notifications
            if (currentUserId) {
              socketRef.current.emit('setup', currentUserId)
            }

            setupSocketListeners()
            resolve()
          })

          // Handle connection errors
          socketRef.current.once('connect_error', (error) => {
            clearTimeout(timeoutId)
            console.error('Socket connection error:', error)
            reject(error)
          })

          // If socket was already created but disconnected, try to reconnect
          if (!socketRef.current.connected) {
            socketRef.current.connect()
          }
        })
      }

      // Wait for connection
      await connectSocket()

      // Connection successful, proceed with share
      setShowShareModal(true)
      await fetchFollowers()

      if (!isShareRoomJoined.current) {
        joinShareRoom()
      }
    } catch (error) {
      console.error('Share initialization error:', error)

      if (error.message === 'Connection timeout') {
        showToast(
          'Could not connect to server. Please check your connection and try again.',
          'error'
        )
      } else {
        showToast('Failed to connect to server. Please try again.', 'error')
      }

      setShowShareModal(false)
    }
  }

  const handleShareWithFollower = async (follower) => {
    if (!currentUserId) {
      showToast('Please login to share schedules', 'error')
      return
    }

    // Check socket connection and wait if needed
    if (!socketRef.current?.connected) {
      showToast('Reconnecting to server...', 'info')

      // Wait up to 3 seconds for connection
      const maxWaitTime = 3000
      const startTime = Date.now()

      while (
        !socketRef.current?.connected &&
        Date.now() - startTime < maxWaitTime
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (!socketRef.current?.connected) {
        showToast('Could not connect to server. Please try again.', 'error')
        return
      }
    }

    try {
      console.log('Schedule item:', item) // Debug log

      // First ensure we're in the share room
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          cleanup()
          reject(new Error('Join room timed out'))
        }, 5000)

        const cleanup = () => {
          clearTimeout(timeoutId)
          socketRef.current.off('join-share-room-status')
          socketRef.current.off('share-error')
        }

        socketRef.current.once('join-share-room-status', (data) => {
          console.log('Join room status:', data)
          cleanup()
          resolve(data)
        })

        socketRef.current.once('share-error', (error) => {
          console.log('Join room error:', error)
          cleanup()
          reject(new Error(error.message || 'Failed to join room'))
        })

        // Join the share room first
        const roomData = {
          moduleId: item._id || item.id,
          moduleType: 'schedules',
          senderId: currentUserId,
          receiverId: follower._id
        }
        console.log('Joining share room with data:', roomData)
        socketRef.current.emit('join-share-room', roomData)
      })

      // Now proceed with sharing
      const sharePromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          cleanup()
          reject(new Error('Share request timed out'))
        }, 10000)

        const cleanup = () => {
          clearTimeout(timeoutId)
          socketRef.current.off('share-count-status')
          socketRef.current.off('share-error')
        }

        socketRef.current.once('share-count-status', (data) => {
          console.log('Received share-count-status:', data)
          if (data.moduleId === (item._id || item.id)) {
            cleanup()
            resolve(data)
          }
        })

        socketRef.current.once('share-error', (error) => {
          console.log('Received share-error:', error)
          cleanup()
          reject(new Error(error.message || 'Share failed'))
        })

        const shareData = {
          moduleId: item._id || item.id,
          moduleType: 'schedules',
          moduleCreatedBy: currentUserId,
          senderId: currentUserId,
          receiverId: follower._id
        }
        console.log('Emitting share event with data:', shareData)
        socketRef.current.emit('share', shareData)
      })

      // Wait for share response
      const result = await sharePromise
      console.log('Share successful:', result)
      setShareCount(result.count || 0)
      setShowShareModal(false)
      showToast('Schedule shared successfully', 'success')
    } catch (error) {
      console.error('Share Error:', error)
      showToast(
        error.message || 'Failed to share schedule. Please try again.',
        'error'
      )
    } finally {
      // Always leave the room after sharing (whether successful or not)
      if (socketRef.current?.connected) {
        socketRef.current.emit('leave-share-room', {
          moduleId: item._id || item.id,
          moduleType: 'schedules',
          senderId: currentUserId,
          receiverId: follower._id
        })
      }
    }
  }

  const joinShareRoom = () => {
    if (!socketRef.current?.connected) {
      console.log('Socket not connected. Cannot join room.')
      return
    }

    if (!isShareRoomJoined.current) {
      const creatorId = item.createdBy?._id || item.createdBy || item.creatorId
      const roomData = {
        moduleId: item._id || item.id,
        moduleType: 'schedules',
        moduleCreatedBy: creatorId,
        senderId: currentUserId,
        receiverId: creatorId
      }
      console.log('Joining share room with data:', roomData)
      socketRef.current.emit('join-share-room', roomData)
    }
  }

  const leaveShareRoom = () => {
    if (socketRef.current?.connected && isShareRoomJoined.current) {
      console.log('Leaving share room for schedule:', item._id || item.id)
      const creatorId = item.createdBy?._id || item.createdBy || item.creatorId
      socketRef.current.emit('leave-share-room', {
        moduleId: item._id || item.id,
        moduleType: 'schedules',
        moduleCreatedBy: creatorId,
        senderId: currentUserId,
        receiverId: creatorId
      })
      isShareRoomJoined.current = false
    }
  }

  const requestShareCount = () => {
    if (socketRef.current?.connected) {
      console.log('Requesting share count for schedule:', item._id || item.id)
      socketRef.current.emit('share-count', {
        moduleId: item._id || item.id,
        moduleType: 'schedules'
      })
    }
  }

  const fetchFollowers = async () => {
    try {
      setIsLoadingFollowers(true)
      const token = await AsyncStorage.getItem('accessToken')

      if (!token) {
        showToast('Authentication token not found', 'error')
        return
      }

      const response = await fetch(
        `${base_url}/follow/getFollowers/${currentUserId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (response.ok && data.status) {
        setFollowers(data.followers)
      } else {
        showToast(data.message || 'Failed to fetch followers', 'error')
      }
    } catch (error) {
      console.error('Fetch Followers Error:', error)
      showToast(
        'Network error. Please check your connection and try again.',
        'error'
      )
    } finally {
      setIsLoadingFollowers(false)
    }
  }

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
        <MaterialCommunityIcons
          name='share-variant'
          size={20}
          color='#ff3873'
        />
      </View>
    </TouchableOpacity>
  )

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setShowMenu(false)
      const token = await AsyncStorage.getItem('accessToken')

      if (!token) {
        showToast('Authentication token not found', 'error')
        return
      }

      // Check if we have the required IDs
      const creatorId = item.createdBy?._id || item.createdBy || item.creatorId
      if (!creatorId || !item._id) {
        showToast('Missing required schedule information', 'error')
        return
      }

      const response = await fetch(
        `${base_url}/schedule/delete/descriptions/${item._id || item.id}/${creatorId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (response.ok && data.status) {
        console.log('Schedule deleted successfully')
        showToast('Schedule deleted successfully', 'success')
      } else {
        console.log('Delete failed:', data.message)
        showToast(data.message || 'Failed to delete schedule', 'error')
      }
    } catch (error) {
      console.error('Delete Error Details:', {
        message: error.message,
        stack: error.stack,
        item: item
      })
      showToast(
        'Network error. Please check your connection and try again.',
        'error'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    setShowMenu(false)
    navigation.navigate('EditSchedule', { scheduleData: item })
  }

  const handleCardPress = (item) => {
    navigation.navigate('TripDetail', { tripData: item }) // Navigate and pass data
  }

  const handleJoin = async () => {
    if (isJoining) {
      return
    }

    try {
      setIsJoining(true)
      const token = await AsyncStorage.getItem('accessToken')

      if (!token) {
        showToast('Authentication token not found', 'error')
        return
      }

      const user = await AsyncStorage.getItem('user')
      const parsedUser = user ? JSON.parse(user) : null

      if (!parsedUser || !parsedUser._id) {
        showToast('User information not found', 'error')
        return
      }

      const postData = {
        scheduleId: item._id || item.id,
        scheduleCreatedBy:
          item.createdBy?._id || item.createdBy || item.creatorId
      }

      // Validate that we have the required data
      if (!postData.scheduleCreatedBy) {
        showToast('Schedule creator information is missing', 'error')
        return
      }

      const response = await fetch(`${base_url}/schedule/join-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      })

      const data = await response.json()

      if (response.ok && data.status) {
        // Handle the response based on the actual status
        if (data.alreadyJoined) {
          showToast('You have already joined this schedule', 'info')
          setJoinStatus('joined')
          setIsJoined(true)
          setJoinRequestSent(false)
        } else if (data.alreadyRequested) {
          showToast('Join request already sent and pending approval', 'info')
          setJoinStatus('pending')
          setIsJoined(false)
          setJoinRequestSent(true)
        } else if (data.alreadyRejected) {
          showToast('Your join request was previously rejected', 'error')
          setJoinStatus('rejected')
          setIsJoined(false)
          setJoinRequestSent(false)
        } else {
          showToast('Join request sent successfully', 'success')
          setJoinStatus('pending')
          setIsJoined(false)
          setJoinRequestSent(true)
        }
      } else {
        if (data.message === 'Internal Server Error') {
          showToast(
            'Unable to process request. Please try again later.',
            'error'
          )
        } else {
          showToast(data.message || 'Failed to process request', 'error')
        }
      }
    } catch (error) {
      console.error('Join Request Error:', error)
      showToast(
        'Network error. Please check your connection and try again.',
        'error'
      )
    } finally {
      setIsJoining(false)
    }
  }

  const isScheduleCreator =
    currentUserId === (item.createdBy?._id || item.createdBy || item.creatorId)

  return (
    <View style={styles.container}>
      <TouchableOpacity
        key={item._id || item.id}
        style={[styles.card, { padding: 4 }]}
        onPress={() => handleCardPress(item)}
      >
        {isFromProfile && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowMenu(true)}
          >
            <Icon name='ellipsis-vertical' size={20} color='#333' />
          </TouchableOpacity>
        )}
        <Image
          source={{ uri: item.imageUrl }}
          style={[styles.image, { height: 160 }]}
        />
        <View style={[styles.cardContent, { padding: 8 }]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { fontSize: 14, marginBottom: 6 }]}>
              {item.title.length > 30
                ? item.title.slice(0, 28) + '..'
                : item.title}
            </Text>
          </View>
          <View style={styles.routeRow}>
            <View style={styles.routeItem}>
              <Text style={[styles.routeLabel, { fontSize: 12 }]}>From</Text>
              <View style={styles.locationRow}>
                <Icon name='location-outline' size={15} color='#333' />
                <Text style={[styles.routeText, { fontSize: 13 }]}>
                  {fromPlace.length > 20
                    ? fromPlace.slice(0, 20) + '...'
                    : fromPlace}
                </Text>
              </View>
            </View>
            <View style={[styles.routeItem, { marginTop: 6 }]}>
              <Text style={[styles.routeLabel, { fontSize: 12 }]}>To</Text>
              <View style={styles.locationRow}>
                <Icon name='location-outline' size={15} color='#333' />
                <Text style={[styles.routeText, { fontSize: 13 }]}>
                  {toPlace.length > 20 ? toPlace.slice(0, 20) + '...' : toPlace}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={[styles.date, { marginRight: 10, fontSize: 12 }]}>
              📅 {item.date}
            </Text>
            <Text style={[styles.riders, { fontSize: 12 }]}>
              🏍️ ({item.riders})
            </Text>
          </View>
        </View>
        {!isScheduleCreator && (
          <TouchableOpacity
            style={[
              styles.joinedButton,
              isJoining && styles.disabledButton,
              (isJoined || joinRequestSent) && styles.joinedButtonActive,
              joinStatus === 'rejected' && { backgroundColor: '#FF3B30' }
            ]}
            onPress={handleJoin}
            disabled={
              isJoining || joinStatus === 'joined' || joinStatus === 'pending'
            }
          >
            {isJoining ? (
              <ActivityIndicator size='small' color={colors.white} />
            ) : joinStatus === 'joined' ? (
              <Icon name='checkmark-circle' size={20} color={colors.white} />
            ) : joinStatus === 'pending' ? (
              <Icon name='time' size={20} color={colors.white} />
            ) : joinStatus === 'rejected' ? (
              <Text style={[styles.joinedText, { fontSize: 10 }]}>
                Rejected
              </Text>
            ) : (
              <Text style={styles.joinedText}>Join</Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Share Button - Positioned at top right */}
      <TouchableOpacity
        style={styles.shareButtonTopRight}
        onPress={handleShare}
      >
        <Icon name='arrow-redo-outline' size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Icon name='create-outline' size={20} color='#333' />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Icon name='trash-outline' size={20} color='#FF3B30' />
              <Text style={[styles.menuText, styles.deleteMenuText]}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType='slide'
        onRequestClose={() => {
          setShowShareModal(false)
          leaveShareRoom()
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowShareModal(false)
              leaveShareRoom()
            }}
          />
          <View style={styles.shareModalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.shareModalTitle}>Share with Followers</Text>
            {isLoadingFollowers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color='#ff3873' />
              </View>
            ) : followers.length === 0 ? (
              <View style={styles.emptyFollowersContainer}>
                <Text style={styles.emptyFollowersText}>
                  No followers to share with.
                </Text>
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
  )
}

export default AllSchedule
