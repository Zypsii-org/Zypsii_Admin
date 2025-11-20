import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import styles from './Styles';
import { colors } from '../../utils';
import { base_url } from '../../utils/base_url';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../context/ToastContext';

function ShortsUpload({ navigation }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const searchTimeoutRef = useRef(null);

  const handleBackPress = () => {
      navigation.navigate('MainLanding');
  };

  const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Please grant permission to access your media library', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
        videoMaxDuration: 30,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
        videoQuality: 0.7,
        aspect: [9, 16],
      });

      if (!result.canceled) {
        const picked = result.assets[0];
        const info = await FileSystem.getInfoAsync(picked.uri);
        const sizeBytes = Number(info?.size || 0);
        if (sizeBytes > MAX_VIDEO_BYTES) {
          showToast('Video size must be less than 50 MB.', 'error');
          return;
        }
        setVideo({ ...picked });
        setThumbnail(picked.uri);
      }
    } catch (error) {
      console.error('Video picker error:', error);
      showToast(error.message || 'Failed to pick video', 'error');
    }
  };

  const validateMediaType = (mediaType) => {
    if (typeof mediaType !== 'string') {
      throw new Error('mediaType must be a string');
    }
    return true;
  };

  const fetchPlaces = async (query) => {
    if (!query || query.trim().length < 2) {
      setPlaceResults([]);
      return;
    }
    try {
      setIsSearchingPlace(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const url = `${base_url}/schedule/places/search?searchPlaceName=${encodeURIComponent(query)}&page=1&limit=10`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        setPlaceResults([]);
        return;
      }

      const data = await response.json();
      const places = Array.isArray(data?.data?.suggestions)
        ? data.data.suggestions
        : (Array.isArray(data?.data) ? data.data : []);

      const mapped = places.map((place) => {
        const latRaw = place?.location?.latitude ?? place?.location?.lat ?? 0;
        const lngRaw = place?.location?.longitude ?? place?.location?.lng ?? 0;
        const latitude = typeof latRaw === 'string' ? parseFloat(latRaw) : latRaw;
        const longitude = typeof lngRaw === 'string' ? parseFloat(lngRaw) : lngRaw;
        return {
          id: place?._id || place?.id || `${place?.name}-${latitude}-${longitude}`,
          name: place?.name || 'Unknown Place',
          address: place?.location?.address || place?.tagline || '',
          latitude: latitude,
          longitude: longitude,
          image: (place?.images && place?.images[0]?.url) || place?.image || '',
        };
      });
      setPlaceResults(mapped);
    } catch (e) {
      setPlaceResults([]);
    } finally {
      setIsSearchingPlace(false);
    }
  };

  const handlePlaceQueryChange = (text) => {
    setPlaceQuery(text);
    setSelectedPlace(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!text || text.trim().length < 2) {
      setPlaceResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchPlaces(text.trim());
    }, 400);
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    setPlaceQuery(place?.name || '');
    setPlaceResults([]);
  };

  const clearSelectedPlace = () => {
    setSelectedPlace(null);
    setPlaceQuery('');
    setPlaceResults([]);
  };

  const handleSubmit = async () => {
    if (!video) {
      showToast('Please select a video', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }
    if (!selectedPlace || typeof selectedPlace.latitude !== 'number' || typeof selectedPlace.longitude !== 'number') {
      showToast('Please search and select a place', 'error');
      return;
    }

    try {
      setIsUploading(true);
      validateMediaType('shorts');
      const accessToken = await AsyncStorage.getItem('accessToken');

      const videoFormData = new FormData();
      
      // Get file extension from video URI
      const fileExtension = video.uri.split('.').pop().toLowerCase();
      
      // Set mime type based on file extension
      let mimeType;
      switch (fileExtension) {
        case 'mp4':
          mimeType = 'video/mp4';
          break;
        case 'mov':
          mimeType = 'video/quicktime';
          break;
        case 'm4v':
          mimeType = 'video/x-m4v';
          break;
        default:
          mimeType = 'video/mp4'; // default to mp4
      }
      
      videoFormData.append('mediaFile', {
        uri: video.uri,
        type: mimeType,
        name: `shorts.${fileExtension}`
      });

      const videoUploadResponse = await fetch(`${base_url}/uploadFile?mediaType=shorts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: videoFormData,
      });

      let videoResponseText;
      try {
        videoResponseText = await videoUploadResponse.text();
        console.log('Video Upload Response:', videoResponseText);
      } catch (error) {
        console.error('Error reading response:', error);
        throw new Error('Failed to read server response');
      }

      if (!videoUploadResponse.ok) {
        console.error('Video Upload Error:', {
          status: videoUploadResponse.status,
          statusText: videoUploadResponse.statusText,
          response: videoResponseText
        });
        if (videoUploadResponse.status === 413) {
          showToast('Video size must be less than 50 MB.', 'error');
          throw new Error('Upload rejected due to size limit');
        }
        throw new Error(`Failed to upload video: ${videoResponseText}`);
      }

      let videoData;
      try {
        videoData = JSON.parse(videoResponseText);
        console.log('Parsed Video Data:', videoData);
      } catch (error) {
        console.error('Error parsing video response:', error);
        throw new Error('Invalid server response format');
      }

      if (!videoData || typeof videoData !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const videoUrl = videoData.urls || videoData.data?.urls;
      if (!videoUrl) {
        throw new Error('Video URL not found in response');
      }

      // Handle videoUrl if it's an array
      const finalVideoUrl = Array.isArray(videoUrl) ? videoUrl[0] : videoUrl;
      if (!finalVideoUrl) {
        throw new Error('Invalid video URL format');
      }

      const createShortResponse = await fetch(`${base_url}/shorts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: title,
          description: description,
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalVideoUrl, // Using the same URL for thumbnail as it's a video
          latitude: Number(selectedPlace.latitude),
          longitude: Number(selectedPlace.longitude)
        }),
      });

      let createShortResponseText;
      try {
        createShortResponseText = await createShortResponse.text();
      } catch (error) {
        console.error('Error reading create short response:', error);
        throw new Error('Failed to read create short response');
      }

      if (!createShortResponse.ok) {
        console.error('Create Short Error:', {
          status: createShortResponse.status,
          statusText: createShortResponse.statusText,
          response: createShortResponseText
        });
        throw new Error(`Failed to create short: ${createShortResponseText}`);
      }

      let createShortData;
      try {
        createShortData = JSON.parse(createShortResponseText);
      } catch (error) {
        throw new Error('Invalid create short response format');
      }

      if (!createShortData || typeof createShortData !== 'object') {
        throw new Error('Invalid create short response format');
      }

      showToast('Short created successfully', 'success');
      navigation.navigate('MainLanding');
    } catch (error) {
      console.error('Error creating short:', error?.message || error);
      if (!String(error?.message || '').includes('size')) {
        showToast('Failed to create short. Please try again.', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Short</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.videoContainer} onPress={pickVideo}>
          {video ? (
            <View style={styles.videoPreviewContainer}>
              <Video
                source={{ uri: video.uri }}
                style={styles.videoPreview}
                resizeMode="cover"
                shouldPlay={false}
                isMuted={true}
              />
              <View style={styles.videoOverlay}>
                <MaterialIcons name="play-circle-outline" size={50} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialIcons name="video-library" size={50} color={colors.btncolor} />
              <Text style={styles.placeholderText}>Select Video (max 30s)</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Search place"
            value={placeQuery}
            onChangeText={handlePlaceQueryChange}
          />
          {isSearchingPlace ? (
            <ActivityIndicator style={{ marginTop: 8 }} />
          ) : null}
        </View>

        {selectedPlace ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontWeight: '600', color: colors.fontMainColor }}>{selectedPlace.name}</Text>
                {selectedPlace.address ? (
                  <Text style={{ color: '#666', marginTop: 2 }}>{selectedPlace.address}</Text>
                ) : null}
                <Text style={{ color: '#666', marginTop: 2 }}>Lat: {Number(selectedPlace.latitude).toFixed(6)}, Lng: {Number(selectedPlace.longitude).toFixed(6)}</Text>
              </View>
              <TouchableOpacity onPress={clearSelectedPlace} style={{ padding: 8 }}>
                <Text style={{ color: colors.btncolor }}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {!selectedPlace && placeResults && placeResults.length > 0 ? (
          <View style={{ maxHeight: 220, marginHorizontal: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 8, overflow: 'hidden' }}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={placeResults}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelectPlace(item)} style={{ padding: 12, backgroundColor: '#fff' }}>
                  <Text style={{ fontWeight: '500', color: colors.fontMainColor }}>{item.name}</Text>
                  {item.address ? (
                    <Text style={{ color: '#666', marginTop: 2 }} numberOfLines={1}>{item.address}</Text>
                  ) : null}
                  <Text style={{ color: '#999', marginTop: 4, fontSize: 12 }}>Lat: {Number(item.latitude).toFixed(6)}  Lng: {Number(item.longitude).toFixed(6)}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />}
            />
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, isUploading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Upload Short</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ShortsUpload;