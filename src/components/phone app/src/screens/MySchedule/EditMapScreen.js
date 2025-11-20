import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, TextInput, Alert, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';
import { colors } from '../../utils';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

function EditMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { type, initialLocation } = route.params;

  // Debug the incoming location data
  console.log('EditMapScreen - Received params:', route.params);
  console.log('EditMapScreen - Initial location:', initialLocation);

  // Validate and set initial region
  const getInitialRegion = () => {
    if (initialLocation && 
        initialLocation.latitude && 
        initialLocation.longitude && 
        initialLocation.latitude !== 0 && 
        initialLocation.longitude !== 0 &&
        !isNaN(initialLocation.latitude) && 
        !isNaN(initialLocation.longitude)) {
      return {
        latitude: parseFloat(initialLocation.latitude),
        longitude: parseFloat(initialLocation.longitude),
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }
    
    // Default to a more central location (Bangalore)
    console.warn('No valid initial location provided, using default coordinates');
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  };

  const [region, setRegion] = useState(getInitialRegion());

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);

  // Add useEffect to handle initial location setup
  useEffect(() => {
    if (initialLocation && 
        initialLocation.latitude && 
        initialLocation.longitude && 
        initialLocation.latitude !== 0 && 
        initialLocation.longitude !== 0) {
      console.log('Setting initial location on map:', initialLocation);
    } else {
      console.log('No initial location provided, using default coordinates');
    }
  }, [initialLocation]);

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (latitude && longitude) {
      console.log('Map pressed at:', { latitude, longitude });
      setRegion({
        ...region,
        latitude,
        longitude,
      });
      setLocationSelected(true);
    }
  };

  const handleSearch = async () => {
    if (searchText.trim()) {
      try {
        setLoading(true);
        const accessToken = await AsyncStorage.getItem('accessToken');
        const url = `${base_url}/schedule/places/getNearest?searchPlaceName=${encodeURIComponent(searchText)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Search results:', result);

        if (result.data && result.data.length > 0) {
          const firstResult = result.data[0];
          if (firstResult.location && firstResult.location.lat && firstResult.location.lng) {
            setRegion({
              ...region,
              latitude: firstResult.location.lat,
              longitude: firstResult.location.lng,
            });
            setSearchResults(result.data);
            setLocationSelected(true);
          }
        } else {
          Alert.alert('No Results', 'No places found for your search.');
        }
      } catch (error) {
        console.error("Error searching places:", error);
        Alert.alert('Error', 'Failed to search places. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDone = () => {
    if (region.latitude && region.longitude) {
      // Get the place name from search results if available
      const selectedPlace = searchResults.find(
        place => place.location.lat === region.latitude && place.location.lng === region.longitude
      );
      
      navigation.navigate("EditSchedule", {
        latitude: region.latitude,
        longitude: region.longitude,
        type: type,
        scheduleId: route.params.scheduleId,
        dayIndex: route.params.dayIndex,
        placeName: selectedPlace ? selectedPlace.name : 'Selected Location'
      });
    } else {
      Alert.alert('Error', 'Please select a valid location.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a place"
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={colors.gray}
        />
        <TouchableOpacity 
          style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker 
          coordinate={region} 
          title={locationSelected ? "Selected Location" : "Tap to select location"}
          description={locationSelected ? "Location selected" : "Tap anywhere on the map"}
        />
      </MapView>

      <TouchableOpacity 
        style={[styles.doneButton, !locationSelected && styles.doneButtonDisabled]} 
        onPress={handleDone}
        disabled={!locationSelected}
      >
        <Text style={[styles.doneButtonText, !locationSelected && styles.doneButtonTextDisabled]}>
          {locationSelected ? 'Done' : 'Select a location first'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.Zypsii_color,
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  searchContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.white,
    marginRight: 10,
    color: colors.fontMainColor,
  },
  searchButton: {
    backgroundColor: colors.Zypsii_color,
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: colors.gray,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
  doneButton: {
    backgroundColor: colors.Zypsii_color,
    padding: 15,
    borderRadius: 5,
    margin: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonDisabled: {
    backgroundColor: colors.gray,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButtonTextDisabled: {
    color: colors.white,
    opacity: 0.7,
  },
});

export default EditMapScreen; 