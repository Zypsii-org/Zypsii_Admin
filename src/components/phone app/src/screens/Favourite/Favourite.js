import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors } from "../../utils"; // Import colors if you have them
import { base_url } from "../../utils/base_url";
import AsyncStorage from '@react-native-async-storage/async-storage';

//const baseUrl = 'https://admin.zypsii.com'; // Backend API base URL

function FavoritesPage({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to get address from coordinates
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      console.log('Getting address for coordinates:', { latitude, longitude });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ZipsiiApp/1.0'
          }
        }
      );
      const data = await response.json();
      console.log('Geocoding API response:', data);
      return data.display_name || 'Address not available';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Address not available';
    }
  };

  // Fetch favorites data
  const fetchFavorites = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('No access token found');
        return;
      }

      const response = await fetch(`${base_url}/place/listFavorite`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const result = await response.json();

      if (result.status && result.data) {
        const processedFavorites = await Promise.all(
          result.data.map(async (item) => {
            console.log('Processing item:', item);
            const hasCoordinates = item.location?.latitude && item.location?.longitude;
            console.log('Has coordinates:', hasCoordinates, 'Coordinates:', {
              lat: item.location?.latitude,
              lng: item.location?.longitude
            });

            let address = item.address;
            if (address === 'Address not available' && hasCoordinates) {
              address = await getAddressFromCoordinates(
                item.location.latitude,
                item.location.longitude
              );
            }

            return {
              ...item,
              address
            };
          })
        );

        console.log('Processed favorites:', processedFavorites);
        setFavorites(processedFavorites);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Format distance to show in a more readable format
  const formatDistance = (distance) => {
    if (!distance) return 'N/A';
    const km = parseFloat(distance);
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1)} km`;
    }
    return `${km.toFixed(1)} km`;
  };

  // Render each favorite item
  const renderItem = ({ item }) => {
    console.log('Rendering item:', item); // Log the item being rendered
    
    return (
      <TouchableOpacity 
        style={styles.itemContainer}
        onPress={() => navigation.navigate('Destination', { 
          placeId: item.placeId || item._id
        })}
      >
        <Image 
          source={{ uri: item.image }} 
          style={styles.image}
          defaultSource={require('../../assets/dummy-image.png')}
        />
        <View style={styles.details}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color={colors.Zypsii_color} />
            <Text style={styles.ratingText}>{item.rating || '0.0'}</Text>
          </View>
          <Text style={styles.itemAddress} numberOfLines={1}>
            {item.address || 'Address not available'}
          </Text>
          <Text style={styles.distanceText}>
            {formatDistance(item.distanceInKilometer)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.Zypsii_color} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Favorites</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="heart-outline" size={50} color={colors.Zypsii_color} />
            <Text style={styles.noFavorites}>No favorites found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 5,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  details: {
    marginLeft: 15,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: colors.Zypsii_color,
    marginLeft: 4,
    fontWeight: '500',
  },
  itemAddress: {
    fontSize: 14,
    color: colors.fontThirdColor,
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    color: colors.fontThirdColor,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  noFavorites: {
    textAlign: "center",
    fontSize: 16,
    color: colors.fontThirdColor,
    marginTop: 10,
  },
});

export default FavoritesPage;
