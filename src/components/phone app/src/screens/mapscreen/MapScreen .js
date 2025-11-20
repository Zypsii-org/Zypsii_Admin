import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, TextInput, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';
import colors from "../../components/Text/TextDefault/styles";

const { width, height } = Dimensions.get("window");

function MapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { dayId } = route.params;

  const [region, setRegion] = useState({
    latitude: 11.1276,
    longitude: 78.6569,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (latitude && longitude) {
      setRegion({
        ...region,
        latitude,
        longitude,
      });
    }
  };

  const handleSearch = async () => {
    if (searchText.trim()) {
      try {
        setLoading(true);
        const accessToken = await AsyncStorage.getItem('accessToken');
        const url = `${base_url}/schedule/places/getNearest?searchPlaceName=${(searchText)}`;
        
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
        console.log(result)

        if (result.data && result.data.length > 0) {
          const firstResult = result.data[0];
          if (firstResult.location && firstResult.location.lat && firstResult.location.lng) {
            setRegion({
              ...region,
              latitude: firstResult.location.lat,
              longitude: firstResult.location.lng,
            });
            setSearchResults(result.data);
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
      navigation.navigate("MakeSchedule", {
        dayId,
        latitude: region.latitude,
        longitude: region.longitude,
      });
    } else {
      Alert.alert('Error', 'Please select a valid location.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a place (e.g., kovalam kanyakumari)"
          value={searchText}
          onChangeText={setSearchText}
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
      >
        <Marker coordinate={region} />
      </MapView>

      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText }>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  searchContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  map: {
    width,
    height: height,
  },
  doneButton: {
    backgroundColor: '#ff3873',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    width: '90%',
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: "#ccc",
    borderWidth: 1,
    backgroundColor: "#fff",
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#ff3873',
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MapScreen; 