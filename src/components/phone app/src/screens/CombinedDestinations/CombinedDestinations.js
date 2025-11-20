import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Text,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextDefault } from '../../components';
import { colors, scale } from '../../utils';
import ProductCard from '../../ui/ProductCard/ProductCard';
import { useNavigation, useRoute } from '@react-navigation/native';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatusBar } from '../../utils/useStatusBar';
import { MaterialIcons } from '@expo/vector-icons';
import BottomTab from '../../components/BottomTab/BottomTab';
import { AntDesign } from '@expo/vector-icons';
import DiscoverByNearest from '../../components/DiscoverByNearest/DiscoverByNearest';

const { width } = Dimensions.get('window');

const VIEW_TYPES = {
  NEAREST: 'nearest',
  BEST: 'best',
  ALL: 'all'
};

// Categories data
const categories = [
  "Backpacking", "Beach Bars", "Camping", "Diving", "Fishing",
  "Free Diving", "Hiking", "Mountains", "Nature", "Outdoors",
  "Rock Climbing", "Sailing", "Scuba Diving", "Snorkeling", "Surfing",
  "Swimming", "Trekking", "Water Sports", "Wildlife", "Adventure Sports"
];

function CombinedDestinations() {
  const navigation = useNavigation();
  const route = useRoute();
  const passedPlaces = route.params?.places;
  const [selectedView, setSelectedView] = useState(route.params?.viewType || VIEW_TYPES.NEAREST);
  const [destinations, setDestinations] = useState(passedPlaces || []);
  const [loading, setLoading] = useState(!passedPlaces);

  // Debug logging for route params
  console.log('CombinedDestinations route params:', route.params);
  console.log('CombinedDestinations passedPlaces:', passedPlaces);
  const [pagination, setPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });
  const [selectedTag, setSelectedTag] = useState(route.params?.outDoorTag || categories[0]);

  useStatusBar(colors.btncolor, 'light-content');

  const fetchDestinations = async (viewType, nextPageToken = null, tag = null) => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return;

      let url = `${base_url}/schedule/places/getNearest`;
      
      // Check if we have a category from route params (from MainLanding)
      const category = route.params?.category;
      if (category) {
        // Use category-based endpoint
        url = `${base_url}/schedule/places/getNearest?category=${encodeURIComponent(category)}`;
        if (nextPageToken) {
          url += `&page=${nextPageToken}`;
        }
      } else {
        // Use the original logic for other cases
        if (viewType === VIEW_TYPES.BEST) {
          url += '?bestDestination=true';
        } else if (viewType === VIEW_TYPES.NEAREST) {
          url += '?type=nearest';
        }

        // Add tag filter if present
        if (tag) {
          url += (url.includes('?') ? '&' : '?') + `type=${encodeURIComponent(tag)}&keyword=${encodeURIComponent(tag)}`;
        }

        if (nextPageToken) {
          url += `&nextPageToken=${nextPageToken}`;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      
      if (Array.isArray(data?.data)) {
        const formattedData = data.data.map(item => ({
          id: item._id || item.name,
          placeId: item.placeId || item._id || item.id || item.name, // ensure placeId is present
          image: item.images?.[0]?.url || item.image,
          images: item.images, // Keep the full images array
          name: item.name,
          subtitle: item.address || (item.location?.address) || 'No address available',
          address: item.address || (item.location?.address) || 'No address available',
          rating: parseFloat(item.rating) || 0,
          distanceInKilometer: item.distanceInKilometer || item.distance,
          location: item.location,
          placesByCategory: item.placesByCategory
        }));

        if (nextPageToken) {
          setDestinations(prev => [...prev, ...formattedData]);
        } else {
          setDestinations(formattedData);
        }

        setPagination({
          nextPageToken: data.pagination?.hasMore ? (data.pagination.currentPage + 1).toString() : null,
          hasMore: data.pagination?.hasMore || false
        });
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!passedPlaces) {
      fetchDestinations(selectedView, null, selectedTag);
    }
  }, [selectedView, selectedTag]);

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchDestinations(selectedView, pagination.nextPageToken, selectedTag);
    }
  };

  //Back button control
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.backButtonCustom}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <TextDefault style={styles.headerTitleCustom}>Where to Go</TextDefault>
      <View style={styles.headerRight} />
    </View>
  );

  const renderCategories = () => {
    if (passedPlaces) return null;
    return (
      <View style={{ marginVertical: 10 }}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 8, marginBottom: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: selectedTag === item ? colors.Zypsii_color : '#f2f2f2',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 6,
                marginRight: 8,
              }}
              onPress={() => setSelectedTag(item)}
            >
              <Text style={{
                color: selectedTag === item ? '#fff' : '#333',
                fontSize: 15,
              }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderItem = ({ item }) => {
    // Debug logging to see what data we have
    console.log('CombinedDestinations renderItem:', {
      placeId: item.placeId,
      _id: item._id,
      id: item.id,
      name: item.name
    });

    // Use the most reliable ID for navigation
    const navigationPlaceId = item.placeId || item._id || item.id || item.name;
    
    return (
      <TouchableOpacity
        onPress={() => {
          console.log('Navigating to Destination with placeId:', navigationPlaceId);
          navigation.navigate('Destination', { placeId: navigationPlaceId });
        }}
        activeOpacity={0.8}
      >
        <DiscoverByNearest
          image={item.images?.[0]?.url || item.photo || item.image}
          title={item.name}
          subtitle={item?.location?.address || item.subtitle || 'No address available'}
          distance={item.distanceInKilometer || item.distance ? parseFloat(item.distanceInKilometer || item.distance  ).toFixed(1) + ' km' : '0 km'}
          rating={!isNaN(Number(item.rating)) ? Number(item.rating).toFixed(1) : '0.0'}
          placeId={navigationPlaceId}
          id={item._id}
          location={item.location}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderCategories()}
      {loading && !pagination.nextPageToken ? (
        <View style={styles.initialLoaderContainer}>
          <ActivityIndicator size="large" color={colors.btncolor} />
        </View>
      ) : (
        <FlatList
          data={destinations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          onEndReached={passedPlaces ? undefined : loadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={() => (
            !passedPlaces && loading && pagination.nextPageToken ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.btncolor} />
              </View>
            ) : null
          )}
        />
      )}
      <BottomTab screen="WhereToGo" />
    </SafeAreaView>
  );
}

const CARD_GAP = scale(10);
const CARD_HORIZONTAL_PADDING = scale(30);
const CARD_WIDTH = (width - CARD_HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: colors.Zypsii_color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: colors.white,
  },
  backButtonCustom: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.Zypsii_color,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.Zypsii_color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  headerTitleCustom: {
    fontSize: scale(15),
    fontWeight: 'bold',
    color: colors.fontMainColor,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: scale(16),
    letterSpacing: 0.5,
  },
  headerRight: {
    width: scale(40),
  },
  categoriesContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  categoriesTitle: {
    marginBottom: scale(12),
  },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    margin: 4,
  },
  categoryText: {
    color: '#333',
    fontSize: 15,
  },
  listContainer: {
    paddingTop: scale(10),
    paddingBottom: scale(80), // Add padding for bottom tab
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
  },
  itemCardContainer: {
    width: CARD_WIDTH,
    marginBottom: CARD_GAP,
    marginRight: CARD_GAP,
    backgroundColor: colors.white,
    borderRadius: 12,
    elevation: 4,
    shadowColor: colors.Zypsii_color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
  },
  loaderContainer: {
    padding: scale(20),
    alignItems: 'center'
  },
  initialLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default CombinedDestinations; 