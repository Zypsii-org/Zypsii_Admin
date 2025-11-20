import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../utils'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import styles from './Styles'
import { base_url } from '../../utils/base_url'
import NotificationService from '../../services/NotificationService'
import ContentTypeModal from '../../components/ContentTypeModal/ContentTypeModal'
import { useToast } from '../../context/ToastContext'

const { height: screenHeight } = Dimensions.get('window')

function ReelUpload() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [video, setVideo] = useState(null)
  const [showContentTypeModal, setShowContentTypeModal] = useState(true)
  const [contentType, setContentType] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isSearchingPlace, setIsSearchingPlace] = useState(false)
  const [showPlaceModal, setShowPlaceModal] = useState(false)
  const navigation = useNavigation()
  const { showToast } = useToast()
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    setShowContentTypeModal(true)
  }, [])

  const handleContentTypeSelect = (type) => {
    setContentType(type)
    setShowContentTypeModal(false)
  }

  const handleBackPress = () => {
    navigation.goBack()
  }

  const pickVideo = async () => {
    Alert.alert(
      'Select Media',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => openCamera()
        },
        {
          text: 'Gallery',
          onPress: () => openGallery()
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    )
  }

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync()
    if (permissionResult.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60
      })

      if (!result.canceled) {
        setVideo(result.assets[0])
      }
    } else {
      showToast('You need to allow camera access to record videos.', 'error')
    }
  }

  const openGallery = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permissionResult.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60
      })

      if (!result.canceled) {
        setVideo(result.assets[0])
      }
    } else {
      showToast('You need to allow access to your media library.', 'error')
    }
  }

  const fetchPlaces = async (query) => {
    if (!query || query.trim().length < 2) {
      setPlaceResults([])
      return
    }
    try {
      setIsSearchingPlace(true)
      const accessToken = await AsyncStorage.getItem('accessToken')
      const url = `${base_url}/schedule/places/search?searchPlaceName=${encodeURIComponent(query)}&page=1&limit=10`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('ok', response)

      if (!response.ok) {
        setPlaceResults([])
        return
      }

      const data = await response.json()
      const places = Array.isArray(data?.data?.suggestions)
        ? data.data.suggestions
        : Array.isArray(data?.data)
          ? data.data
          : []

      const mapped = places.map((place) => {
        const latRaw = place?.location?.latitude ?? place?.location?.lat ?? 0
        const lngRaw = place?.location?.longitude ?? place?.location?.lng ?? 0
        const latitude =
          typeof latRaw === 'string' ? parseFloat(latRaw) : latRaw
        const longitude =
          typeof lngRaw === 'string' ? parseFloat(lngRaw) : lngRaw
        return {
          id:
            place?._id ||
            place?.id ||
            `${place?.name}-${latitude}-${longitude}`,
          name: place?.name || 'Unknown Place',
          address: place?.location?.address || place?.tagline || '',
          latitude: latitude,
          longitude: longitude,
          image: (place?.images && place?.images[0]?.url) || place?.image || ''
        }
      })
      setPlaceResults(mapped)
    } catch (e) {
      setPlaceResults([])
    } finally {
      setIsSearchingPlace(false)
    }
  }

  const openPlaceSearchModal = () => {
    setShowPlaceModal(true)
  }

  const closePlaceSearchModal = () => {
    setShowPlaceModal(false)
    setPlaceResults([])
  }

  const handlePlaceQueryChange = (text) => {
    setPlaceQuery(text)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (!text || text.trim().length < 2) {
      setPlaceResults([])
      return
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchPlaces(text.trim())
    }, 400)
  }

  const handleSelectPlace = (place) => {
    setSelectedPlace(place)
    setPlaceQuery(place?.name || '')
    setPlaceResults([])
    setShowPlaceModal(false)
  }

  const clearSelectedPlace = () => {
    setSelectedPlace(null)
    setPlaceQuery('')
    setPlaceResults([])
  }

  const handleSubmit = async () => {
    if (!video) {
      showToast('Please select a video to upload.', 'error')
      return
    }

    if (
      !selectedPlace ||
      typeof selectedPlace.latitude !== 'number' ||
      typeof selectedPlace.longitude !== 'number'
    ) {
      showToast('Please search and select a place', 'error')
      return
    }

    try {
      setIsLoading(true)
      const accessToken = await AsyncStorage.getItem('accessToken')

      if (!accessToken) {
        showToast('You need to be logged in to submit.', 'error')
        setIsLoading(false)
        return
      }

      const uploadFormData = new FormData()
      const fileUri = video.uri.replace('file://', '')

      uploadFormData.append('mediaFile', {
        uri: video.uri,
        type: 'video/mp4',
        name: 'video.mp4'
      })

      try {
        const uploadResponse = await fetch(
          `${base_url}/uploadFile?mediaType=reel`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'multipart/form-data'
            },
            body: uploadFormData
          }
        )

        if (uploadResponse.status === 413) {
          showToast(
            'The file is too large. Please try uploading a smaller file.',
            'error'
          )
          setIsLoading(false)
          return
        }

        let uploadResponseData
        try {
          const responseText = await uploadResponse.text()
          uploadResponseData = JSON.parse(responseText)
        } catch (error) {
          console.error('Error parsing response:', error)
          showToast(
            'Failed to process the upload response. Please try again.',
            'error'
          )
          setIsLoading(false)
          return
        }

        if (!uploadResponseData.status) {
          showToast(
            uploadResponseData.message || 'Failed to upload file',
            'error'
          )
          setIsLoading(false)
          return
        }

        if (!uploadResponseData.urls || !uploadResponseData.urls[0]) {
          showToast('No file URL returned from upload', 'error')
          setIsLoading(false)
          return
        }

        const reelFormData = new FormData()
        reelFormData.append('reelTitle', title)
        reelFormData.append('reelType', 'Public')
        reelFormData.append('mediaType', 'video')
        reelFormData.append('mediaUrl', uploadResponseData.urls[0])
        reelFormData.append('tags[]', 'new')
        reelFormData.append('latitude', Number(selectedPlace.latitude))
        reelFormData.append('longitude', Number(selectedPlace.longitude))

        const response = await fetch(`${base_url}/reel/create`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          },
          body: reelFormData
        })

        const responseData = await response.json()

        if (response.ok) {
          showToast('Your reel was successfully created!', 'success')
          navigation.goBack()
        } else {
          console.error('Error creating reel. Status:', response.status)
          console.error('Error response data:', responseData)
          showToast(
            responseData.message || 'There was an error creating your reel.',
            'error'
          )
        }
      } catch (error) {
        console.error('Network error:', error)
        showToast(
          'Please check your internet connection and try again. If the problem persists, try uploading a smaller file.',
          'error'
        )
      }
    } catch (error) {
      console.error('Error in creating reel:', error)
      showToast(
        'There was an error creating your reel. Please try again.',
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const testNotification = async () => {
    try {
      const userData = await AsyncStorage.getItem('user')
      const user = JSON.parse(userData)

      const expoPushToken = await AsyncStorage.getItem('expoPushToken')

      if (!expoPushToken) {
        showToast(
          "No push token found. Please make sure you're logged in.",
          'error'
        )
        return
      }

      await NotificationService.sendReelNotification(
        user.fullName,
        expoPushToken
      )
      showToast('Test notification sent!', 'success')
    } catch (error) {
      console.error('Error sending test notification:', error)
      showToast('Failed to send test notification', 'error')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ContentTypeModal
        visible={showContentTypeModal}
        onClose={() => setShowContentTypeModal(false)}
        onSelectType={handleContentTypeSelect}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name='arrow-back' size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
      </View>

      {contentType && (
        <ScrollView>
          <TouchableOpacity style={styles.videoContainer} onPress={pickVideo}>
            {video ? (
              <Image source={{ uri: video.uri }} style={styles.selectedVideo} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name='videocam' size={50} color={colors.btncolor} />
                <Text style={styles.placeholderText}>Tap to add video</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder='Add a title...'
              placeholderTextColor='#999'
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.descriptionInput}
              placeholder='Add a description...'
              placeholderTextColor='#999'
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[
                styles.titleInput,
                {
                  justifyContent: 'center',
                  flexDirection: 'row',
                  alignItems: 'center'
                }
              ]}
              onPress={openPlaceSearchModal}
            >
              <View style={{ flex: 1 }}>
                {selectedPlace ? (
                  <View>
                    <Text
                      style={{ fontWeight: '600', color: colors.fontMainColor }}
                    >
                      {selectedPlace.name}
                    </Text>
                    {selectedPlace.address ? (
                      <Text
                        style={{ color: '#666', marginTop: 2, fontSize: 12 }}
                        numberOfLines={1}
                      >
                        {selectedPlace.address}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={{ color: '#999' }}>
                    Search and select a place
                  </Text>
                )}
              </View>
              {selectedPlace && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation()
                    clearSelectedPlace()
                  }}
                  style={{ padding: 4, marginLeft: 8 }}
                >
                  <Ionicons name='close-circle' size={20} color='#999' />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.submitButtonText}>Share</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Place Search Modal */}
      <Modal
        visible={showPlaceModal}
        animationType='fade'
        transparent={true}
        onRequestClose={closePlaceSearchModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closePlaceSearchModal}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                backgroundColor: '#fff',
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                maxHeight: screenHeight * 0.7,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5
              }}
            >
              {/* Search Results - Now at the top */}
              <SafeAreaView style={{ flex: 0 }}>
                {isSearchingPlace ? (
                  <View
                    style={{
                      padding: 20,
                      alignItems: 'center',
                      minHeight: 150
                    }}
                  >
                    <ActivityIndicator size='large' color={colors.btncolor} />
                    <Text style={{ marginTop: 10, color: '#666' }}>
                      Searching...
                    </Text>
                  </View>
                ) : placeResults.length > 0 ? (
                  <ScrollView style={{ maxHeight: screenHeight * 0.5 }}>
                    {placeResults.map((item, index) => (
                      <View key={String(item.id)}>
                        <TouchableOpacity
                          onPress={() => handleSelectPlace(item)}
                          style={{
                            padding: 16,
                            backgroundColor: '#fff'
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center'
                            }}
                          >
                            <Ionicons
                              name='location'
                              size={24}
                              color={colors.btncolor}
                              style={{ marginRight: 12 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontWeight: '600',
                                  fontSize: 16,
                                  color: colors.fontMainColor
                                }}
                              >
                                {item.name}
                              </Text>
                              {item.address ? (
                                <Text
                                  style={{
                                    color: '#666',
                                    marginTop: 4,
                                    fontSize: 14
                                  }}
                                  numberOfLines={1}
                                >
                                  {item.address}
                                </Text>
                              ) : null}
                              <Text
                                style={{
                                  color: '#999',
                                  marginTop: 4,
                                  fontSize: 12
                                }}
                              >
                                Lat: {Number(item.latitude).toFixed(6)}, Lng:{' '}
                                {Number(item.longitude).toFixed(6)}
                              </Text>
                            </View>
                            <Ionicons
                              name='chevron-forward'
                              size={20}
                              color='#ccc'
                            />
                          </View>
                        </TouchableOpacity>
                        {index < placeResults.length - 1 && (
                          <View
                            style={{
                              height: 1,
                              backgroundColor: '#f0f0f0',
                              marginLeft: 52
                            }}
                          />
                        )}
                      </View>
                    ))}
                  </ScrollView>
                ) : placeQuery.length >= 2 ? (
                  <View
                    style={{
                      padding: 20,
                      alignItems: 'center',
                      minHeight: 150
                    }}
                  >
                    <Ionicons name='search' size={48} color='#ccc' />
                    <Text
                      style={{
                        marginTop: 10,
                        color: '#666',
                        textAlign: 'center'
                      }}
                    >
                      No places found
                    </Text>
                    <Text
                      style={{
                        marginTop: 5,
                        color: '#999',
                        textAlign: 'center'
                      }}
                    >
                      Try a different search term
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      padding: 20,
                      alignItems: 'center',
                      minHeight: 150
                    }}
                  >
                    <Ionicons name='location-outline' size={48} color='#ccc' />
                    <Text
                      style={{
                        marginTop: 10,
                        color: '#666',
                        textAlign: 'center'
                      }}
                    >
                      Search for a place
                    </Text>
                    <Text
                      style={{
                        marginTop: 5,
                        color: '#999',
                        textAlign: 'center'
                      }}
                    >
                      Type at least 2 characters to search
                    </Text>
                  </View>
                )}

                {/* Search Input - Now at the bottom */}
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: '#eee',
                    backgroundColor: '#fff'
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 10,
                        paddingHorizontal: 12
                      }}
                    >
                      <Ionicons name='search' size={20} color='#999' />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          paddingHorizontal: 10,
                          fontSize: 16,
                          color: colors.fontMainColor
                        }}
                        placeholder='Type place name...'
                        placeholderTextColor='#999'
                        value={placeQuery}
                        onChangeText={handlePlaceQueryChange}
                        autoFocus={true}
                      />
                      {placeQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            setPlaceQuery('')
                            setPlaceResults([])
                          }}
                        >
                          <Ionicons
                            name='close-circle'
                            size={20}
                            color='#999'
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Close button at the very bottom */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      paddingBottom: 12
                    }}
                  >
                    <TouchableOpacity
                      onPress={closePlaceSearchModal}
                      style={{
                        paddingHorizontal: 24,
                        paddingVertical: 10,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 20
                      }}
                    >
                      <Text
                        style={{
                          color: colors.fontMainColor,
                          fontWeight: '600'
                        }}
                      >
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

export default ReelUpload
