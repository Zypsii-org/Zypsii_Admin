import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import baseStyles from '../../utils/styles'
import BottomTab from '../../components/BottomTab/BottomTab';
import { BackHeader } from '../../components/Headers/Headers'; 
import { MaterialCommunityIcons, SimpleLineIcons, Ionicons } from '@expo/vector-icons'; 
import { colors } from '../../utils';
import { TextDefault } from '../../components';
import { textStyles } from '../../utils';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

// Skeleton Loader Component
const SkeletonLoader = () => (
  <View style={styles.grayContainer}>
    {[...Array(6)].map((_, index) => (
      <View key={index} style={styles.skeletonCard}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
          <View style={styles.skeletonFooter}>
            <View style={styles.skeletonRating} />
            <View style={styles.skeletonDistance} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

// Merge the styles
const styles = {
  ...baseStyles,
  safeAreaStyle: {
    flex: 1,
    backgroundColor: colors.Zypsii_color,
  },
  contentContainer: {
    padding: 8,
    width: '100%',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: colors.fontMainColor,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: colors.fontMainColor,
    marginLeft: 4,
  },
  selectedTripButton: {
    backgroundColor: colors.primary,
  },
  selectedTripButtonText: {
    color: colors.white,
  },
  skeletonCard: {
    width: '48%',
    backgroundColor: colors.white,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    padding: 10,
  },
  skeletonImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.grayLinesColor,
    borderRadius: 10,
    marginBottom: 10,
  },
  skeletonContent: {
    padding: 5,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: colors.grayLinesColor,
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  skeletonSubtitle: {
    height: 12,
    backgroundColor: colors.grayLinesColor,
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonRating: {
    height: 12,
    width: 40,
    backgroundColor: colors.grayLinesColor,
    borderRadius: 4,
  },
  skeletonDistance: {
    height: 12,
    width: 40,
    backgroundColor: colors.grayLinesColor,
    borderRadius: 4,
  },
};


function DiscoverPlace({ navigation }) {
  const backPressed = () => {
    navigation.goBack();
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notification');
  };

  const handleSearchPress = () => {
    navigation.navigate('SearchPage');
  };

  const handleProfilePress = () => {
    navigation.navigate('ProfileDashboard');
  };

  const [cardData, setCardData] = useState([]);
  const [selectedTripType, setSelectedTripType] = useState('Friendship Trip');
  const [loading, setLoading] = useState(false);

  const tripTypes = ['Friendship Trip', 'Honeymoon Trip', 'Weekend Trip'];

  const getApiParams = (tripType) => {
    switch (tripType) {
      case 'Friendship Trip':
        return { type: 'adventure', keyword: 'adventure', opennow: true };
      case 'Honeymoon Trip':
        return { type: 'hotel', keyword: 'resort', opennow: true };
      case 'Weekend Trip':
        return { type: 'attraction', keyword: 'park', opennow: true };
      default:
        return { type: 'adventure', keyword: 'adventure', opennow: true };
    }
  };

  const fetchCardData = async (tripType) => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const params = getApiParams(tripType);
      const queryString = new URLSearchParams(params).toString();
      
      const response = await fetch(`${base_url}/schedule/places/getNearest?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const responseData = await response.json();
      
      // Check if responseData exists and has the expected structure
      if (!responseData || !responseData.data) {
        console.warn('Unexpected API response structure:', responseData);
        setCardData([]);
        return;
      }

      // Ensure data is an array before using slice
      const dataArray = Array.isArray(responseData.data) ? responseData.data : [];
      
      const formattedData = dataArray.map(item => ({
        id: item._id || item.id,
        placeId: item.placeId || item._id || item.id,
        image: item.images[0]?.url || item.image,
        title: item.name,
        subtitle: item?.location?.state || 'No address',
        rating: parseFloat(item.rating) || 0,
        location: item?.location?.address,
        distance: item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null
      }));
      
      setCardData(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setCardData([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardData(selectedTripType);
  }, [selectedTripType]);

  const handleTripTypePress = (tripType) => {
    setSelectedTripType(tripType);
  };

  return (
    <>
      <StatusBar 
        backgroundColor={colors.Zypsii_color} 
        barStyle="light-content" 
        translucent={false}
      />
      <SafeAreaView style={styles.safeAreaStyle} edges={['top']}>
        <View style={{ flex: 1, backgroundColor: colors.white }}>
          <View style={styles.protractorShape} />
          <View style={styles.backgroundCurvedContainer} />
        
        <BackHeader 
          backPressed={backPressed} 
          //title="Discover Place"
          onNotificationPressed={handleNotificationPress}
          onSearchPressed={handleSearchPress}
          onProfilePressed={handleProfilePress}
        /> 

        <View style={styles.headerContainer}>
          <Text style={styles.title}>{'Which trip would you love to go on?'}</Text>
          <View style={styles.buttonRow}>
            {tripTypes.map((label) => (
              <TouchableOpacity 
                key={label} 
                style={[
                  styles.tripButton,
                  selectedTripType === label && styles.selectedTripButton
                ]}
                onPress={() => handleTripTypePress(label)}
              >
                <Text style={[
                  styles.tripButtonText,
                  selectedTripType === label && styles.selectedTripButtonText
                ]}>{label}</Text>
                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={selectedTripType === label ? colors.Zypsii_color : colors.fontMainColor}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card List */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {loading ? (
            <SkeletonLoader />
          ) : (
            <View style={styles.grayContainer}>
              {cardData.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.card}
                  onPress={() => {
                    const navId = card.placeId || card.id;
                    console.log('Navigating to Destination with:', navId);
                    navigation.navigate('Destination', {
                      placeId: navId
                    });
                  }}
                >
                  <View style={styles.likeIconContainer}>
                    <MaterialCommunityIcons name="heart-outline" size={20} color={colors.errorColor} />
                  </View>
                  <Image
                    source={{ uri: card.image || 'https://via.placeholder.com/150' }}
                    style={styles.cardImage}
                  />
                  <View style={styles.contentContainer}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <View style={styles.infoContainer}>
                      <View style={styles.distanceContainer}>
                        <Ionicons name="location-outline" size={14} color={colors.Zypsii_color} />
                        <Text style={styles.distanceText}>{card.distance} km</Text>
                      </View>
                      <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={14} color={colors.Zypsii_color} />
                        <Text style={styles.ratingText}>{card.rating}</Text>
                      </View>
                    </View>
                    <View style={styles.subtitleContainer}>
                      <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
          <BottomTab screen="WhereToGo" />
        </View>
      </SafeAreaView>
    </>
  );
}

export default DiscoverPlace;
