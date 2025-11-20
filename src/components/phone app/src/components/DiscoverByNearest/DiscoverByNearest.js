import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TextDefault } from '../../components';
import { colors } from "../../utils";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

const DiscoverByNearest = (props) => {
  const navigation = useNavigation();

  // Normalize id and placeId for robust navigation
  const id = props.id || props._id;
  const placeId = props.placeId || id;

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const formatDistanceKm = (value) => {
    const numeric = Number(value);
    if (!isNaN(numeric) && isFinite(numeric)) {
      return `${numeric.toFixed(1)} km`;
    }
    const str = String(value || '').trim();
    if (!str) return '0 km';
    return str.toLowerCase().includes('km') ? str : `${str} km`;
  };

  const getDistanceLabel = () => {
    if (props.distanceInKilometer !== undefined && props.distanceInKilometer !== null) {
      return formatDistanceKm(props.distanceInKilometer);
    }
    if (props.formattedDistance !== undefined && props.formattedDistance !== null) {
      return formatDistanceKm(props.formattedDistance);
    }
    if (props.distance !== undefined && props.distance !== null) {
      return formatDistanceKm(props.distance);
    }
    return '0 km';
  };

  if (props.placesByCategory) {
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('Destination', { placeId })}
        style={styles.categoryCard}
      >
        <View style={styles.categoryImageContainer}>
          <Image 
            source={{ uri: props.image }} 
            style={styles.categoryImage}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
          {imageLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.Zypsii_color} />
            </View>
          )}
          {imageError && (
            <View style={styles.errorContainer}>
              <Ionicons name="image-outline" size={24} color={colors.graycolor} />
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{props.category || 'Place'}</Text>
          </View>
        </View>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle} numberOfLines={1}>{props.title || props.name}</Text>
          <View style={styles.categoryInfo}>
            <View style={styles.categoryRating}>
              <MaterialIcons name="star" size={14} color={colors.Zypsii_color} />
              <Text style={styles.categoryRatingText}>
                {!isNaN(Number(props.rating)) ? Number(props.rating).toFixed(1) : '0.0'}
              </Text>
            </View>
            <Text style={styles.categoryDistance}>{getDistanceLabel()}</Text>
          </View>
          <Text style={styles.categoryAddress} numberOfLines={1}>
            {props.location?.address || props.subtitle || 'No address available'}
          </Text>
          {props.priceRange && (
            <Text style={styles.categoryPrice}>
              {props.priceRange === 'Free' ? 'Free Entry' : `From ${props.priceRange}`}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Function to search for place coordinates by name
  const searchPlaceCoordinates = async (placeName) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken || !placeName) return null;

      const response = await fetch(`${base_url}/schedule/places/getNearest?searchPlaceName=${encodeURIComponent(placeName)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        console.error('Place search failed:', response.status);
        return null;
      }

      const result = await response.json();

      if (result.data && result.data.length > 0) {
        const place = result.data[0];
        const latitude = place.location?.latitude ?? place.location?.lat;
        const longitude = place.location?.longitude ?? place.location?.lng;

        if (latitude && longitude) {
          return { latitude, longitude };
        }
      }

      return null;
    } catch (error) {
      console.error('Error searching place coordinates:', error);
      return null;
    }
  };

  const handlePress = async () => {
    // Fallback logic for coordinates
    let latitude = props.location?.latitude ?? props.location?.lat;
    let longitude = props.location?.longitude ?? props.location?.lng;

    // If coordinates are missing, try to search by place name
    if ((latitude === undefined || longitude === undefined) && props.title) {
      const coordinates = await searchPlaceCoordinates(props.title);
      if (coordinates) {
        latitude = coordinates.latitude;
        longitude = coordinates.longitude;
      }
    }

    // If still no coordinates, proceed without them (no alert)
    if (latitude === undefined || longitude === undefined) {
      // Navigate without coordinates - let the destination screen handle it
      navigation.navigate('Destination', {
        placeId: placeId
      });
      return;
    }

    navigation.navigate('Destination', {
      placeId: placeId
    });
  };

  // Removed duplicate empty return block

  return (
    <TouchableOpacity onPress={handlePress} style={styles.discoverCard}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: props.image }}
          style={styles.discoverCardImage}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
        {imageLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.Zypsii_color} />
          </View>
        )}
        {imageError && (
          <View style={styles.errorContainer}>
            <Ionicons name="image-outline" size={24} color={colors.graycolor} />
          </View>
        )}
      </View>
      <View style={styles.discoverCardContent}>
        <TextDefault numberOfLines={1} style={styles.discoverCardTitle}>
          {props.title}
        </TextDefault>
        <TextDefault numberOfLines={1} style={styles.discoverCardSubtitle}>
          {props.name && props.name.trim().length > 0
            ? props.name
            : props.subtitle && props.subtitle.trim().length > 0
              ? props.subtitle
              : 'No address available'}
        </TextDefault>
        <View style={styles.discoverCardFooter}>
          <View style={styles.discoverCardDistance}>
            <Ionicons name="location-outline" size={14} color={colors.Zypsii_color} />
            <TextDefault style={styles.distanceText}>{getDistanceLabel()}</TextDefault>
          </View>
          <View style={styles.discoverCardRating}>
            <MaterialIcons name="star" size={14} color={colors.Zypsii_color} />
            <TextDefault style={styles.ratingText}>
              {!isNaN(Number(props.rating)) ? Number(props.rating).toFixed(1) : '0.0'}
            </TextDefault>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Category Card Styles
  categoryCard: {
    width: 180,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  categoryImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.Zypsii_color,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryContent: {
    padding: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 6,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryRatingText: {
    fontSize: 14,
    color: colors.fontMainColor,
    marginLeft: 4,
    fontWeight: '600',
  },
  categoryDistance: {
    fontSize: 12,
    color: colors.fontThirdColor,
  },
  categoryAddress: {
    fontSize: 12,
    color: colors.fontThirdColor,
    marginBottom: 6,
  },
  categoryPrice: {
    fontSize: 12,
    color: colors.Zypsii_color,
    fontWeight: '600',
  },

  // Original styles
  discoverCard: {
    width: 150,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: colors.grayBackground,
    position: 'relative',
  },
  discoverCardImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
  },
  discoverCardContent: {
    padding: 10,
  },
  discoverCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  discoverCardSubtitle: {
    fontSize: 12,
    color: colors.fontThirdColor,
    marginBottom: 8,
  },
  discoverCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discoverCardDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: colors.fontThirdColor,
    marginLeft: 4,
  },
  discoverCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: colors.fontMainColor,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default DiscoverByNearest;
