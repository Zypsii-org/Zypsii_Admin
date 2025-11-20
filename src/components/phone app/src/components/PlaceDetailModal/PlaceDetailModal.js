import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
  Animated,
  StatusBar
} from 'react-native';
import { MaterialIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './styles';

const PlaceDetailModal = ({ visible, onClose, placeId, placeName }) => {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Animation for booming (pulsing) effect
  const boomAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (visible && placeId) {
      fetchPlaceDetails();
    }
  }, [visible, placeId]);

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

  const fetchPlaceDetails = async () => {
    if (!placeId) return;

    try {
      setLoading(true);
      setError(null);

      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Authentication required');
      }

      const url = `${base_url}/schedule/listing/full-place-detail/${placeId}`;
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
      if (data.success && data.data) {
        setPlaceDetails(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch place details');
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMap = () => {
    if (placeDetails?.geometry?.location) {
      const { lat, lng } = placeDetails.geometry.location;
      const url = `https://maps.google.com/?q=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  const handleWikipediaPress = () => {
    if (placeDetails?.wikipedia?.websiteUrl) {
      Linking.openURL(placeDetails.wikipedia.websiteUrl);
    }
  };

  const getImageSource = () => {
    if (placeDetails?.photos && placeDetails.photos.length > 0) {
      return { uri: placeDetails.photos[0].url };
    }
    if (placeDetails?.images && placeDetails.images.length > 0) {
      return { uri: placeDetails.images[0].url };
    }
    return require('../../assets/dummy-image.png');
  };

  const renderOpeningHours = () => {
    if (!placeDetails?.openingHours) return null;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <View style={styles.openingHoursContainer}>
        <Text style={styles.openingHoursTitle}>Opening Hours</Text>
        {days.map((day, index) => (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.dayName}>{dayNames[index]}</Text>
            <Text style={styles.dayHours}>{placeDetails.openingHours[day]}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPhotos = () => {
    if (!placeDetails?.photos || placeDetails.photos.length === 0) return null;

    return (
      <View style={styles.photosContainer}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosScrollContainer}
        >
          {placeDetails.photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image
                source={{ uri: photo.url }}
                style={styles.photoImage}
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderVideos = () => {
    // Placeholder for video gallery - can be expanded later
    return (
      <View style={styles.videosContainer}>
        <Text style={styles.sectionTitle}>Videos</Text>
        <View style={styles.videoPlaceholder}>
          <Ionicons name="videocam-outline" size={48} color={colors.fontThirdColor} />
          <Text style={styles.videoPlaceholderText}>No videos available</Text>
        </View>
      </View>
    );
  };

  const renderReviews = () => {
    if (!placeDetails?.reviewCount || placeDetails.reviewCount === 0) {
      return (
        <View style={styles.reviewsContainer}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.noReviewsContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.fontThirdColor} />
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.reviewsContainer}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <View style={styles.reviewSummary}>
          <View style={styles.ratingContainer}>
            <AntDesign name="star" size={20} color={colors.Zypsii_color} />
            <Text style={styles.ratingText}>{placeDetails.rating}</Text>
          </View>
          <Text style={styles.reviewCountText}>{placeDetails.reviewCount} reviews</Text>
        </View>
      </View>
    );
  };

  if (!visible) return null;



  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>





          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.Zypsii_color} />
              <Text style={styles.loadingText}>Loading place details...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={64} color={colors.fontSecondColor} />
              <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchPlaceDetails}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : placeDetails ? (
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Hero Image Section */}
              <View style={styles.heroContainer}>
                <Image
                  source={getImageSource()}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
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
                        style={styles.wikipediaButton}
                        onPress={handleWikipediaPress}
                        activeOpacity={0.8}
                      >
                        <Animated.View style={[styles.wikipediaIcon, { transform: [{ scale: boomAnim }] }]}>
                          <Ionicons name="library" size={20} color={colors.Zypsii_color} />
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
                          <Text style={styles.distanceText}>{placeDetails.distanceInKilometer}</Text>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={styles.addressSection}>
                    <Ionicons name="location-outline" size={16} color={colors.fontThirdColor} />
                    <Text style={styles.addressText}>{placeDetails.address}</Text>
                  </View>
                </View>

                {/* Description Section */}
                {placeDetails.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{placeDetails.description}</Text>
                  </View>
                )}

                {/* Photo Gallery */}
                {renderPhotos()}

                {/* Video Gallery */}
                {renderVideos()}

                {/* Opening Hours */}
                {renderOpeningHours()}

                {/* Reviews */}
                {renderReviews()}

                {/* Additional Info */}
                <View style={styles.additionalInfoContainer}>
                  {placeDetails.category && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Category:</Text>
                      <Text style={styles.infoValue}>{placeDetails.category}</Text>
                    </View>
                  )}
                  {placeDetails.priceRange && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Price:</Text>
                      <Text style={styles.infoValue}>{placeDetails.priceRange}</Text>
                    </View>
                  )}
                  {placeDetails.bestTimeToVisit && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Best Time:</Text>
                      <Text style={styles.infoValue}>{placeDetails.bestTimeToVisit}</Text>
                    </View>
                  )}
                  {placeDetails.difficulty && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Difficulty:</Text>
                      <Text style={styles.infoValue}>{placeDetails.difficulty}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
                    <MaterialIcons name="map" size={20} color={colors.white} />
                    <Text style={styles.mapButtonText}>Open in Maps</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No place details available</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PlaceDetailModal;
