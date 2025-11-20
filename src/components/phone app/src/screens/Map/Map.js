import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, ScrollView, Image, Share, Modal } from "react-native";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";
import { BackHeader, BottomTab } from "../../components";
import { alignment, colors } from "../../utils";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { TextDefault } from '../../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DiscoverByNearest from '../../components/DiscoverByNearest/DiscoverByNearest';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import * as Location from 'expo-location';

/**
 * MAP COMPONENT - DATA ACCESS GUIDE
 * 
 * This component receives comprehensive trip data from TripDetail screen.
 * Here's how to access all the passed data:
 * 
 * 1. DIRECT ACCESS FROM route.params:
 *    - tripData: Complete trip object with all details
 *    - allLocations: Array of all locations from all days
 *    - currentDayLocations: Array of locations for current active day
 *    - activeDay: Current day number (1, 2, 3, etc.)
 *    - totalDays: Total number of days in the trip
 *    - scheduleData: Complete schedule data array
 *    - tripId: Trip ID for API calls
 *    - fromLocation: Starting location object
 *    - toLocation: Destination location object
 *    - tripMetadata: Trip metadata object
 * 
 * 2. UTILITY FUNCTIONS (recommended way):
 *    - getTripInfo(): Returns trip information (title, date, etc.)
 *    - getCurrentDayInfo(): Returns current day details
 *    - getFixedLocations(): Returns from/to locations
 *    - getAllTripLocations(): Returns all locations from all days
 *    - getLocationsForDay(dayNumber): Returns locations for specific day
 *    - getDataSummary(): Returns complete data summary
 * 
 * 3. EXAMPLE FUNCTIONS (showing practical usage):
 *    - getTripTitle(): Get trip title
 *    - getCurrentDayLocations(): Get current day locations
 *    - getRouteSummary(): Get "From → To" summary
 *    - getTotalDistance(): Calculate total trip distance
 *    - getTripDuration(): Get trip duration in days
 *    - isMultiDayTrip(): Check if multi-day trip
 *    - getUniqueLocations(): Get unique locations (no duplicates)
 *    - getLocationsByDay(dayNumber): Get locations for specific day
 *    - getTripStats(): Get comprehensive trip statistics
 * 
 * 4. DEBUG COMPONENT:
 *    - Shows all received data in development mode
 *    - Displays example function results
 *    - Shows trip statistics
 * 
 * Usage Examples:
 * - Display trip title: getTripTitle()
 * - Show route: getRouteSummary()
 * - Get current day locations: getCurrentDayLocations()
 * - Calculate total distance: getTotalDistance()
 * - Check trip type: isMultiDayTrip()
 */

const { width, height } = Dimensions.get('window');

const Map = ({ route }) => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  
  // Extract all data passed from TripDetail
  const {
    tripData,
    allLocations,
    currentDayLocations,
    activeDay,
    totalDays,
    scheduleData: passedScheduleData,
    tripId,
    fromLocation,
    toLocation,
    tripMetadata
  } = route.params || {};
  
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSearchPress = () => {
    navigation.navigate('SearchPage');
  };

  const handleChatPress = () => {
    navigation.navigate('MessageList');
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notification');
  };

  const handleProfilePress = () => {
    navigation.navigate('ProfileDashboard');
  };

  const [discoverbynearest, setDiscoverbyNearest] = useState([]);
  const [scheduleData, setScheduleData] = useState(passedScheduleData || []);
  const [loading, setLoading] = useState(true);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [isFullMapVisible, setIsFullMapVisible] = useState(false);
  const mapRef = useRef(null);
  const fullMapRef = useRef(null);
  const [dayRoutes, setDayRoutes] = useState([]); // [{day: 1, polyline: [...]}, ...]
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentToDay1Route, setCurrentToDay1Route] = useState([]);

  useEffect(() => {
    // If we have passed schedule data, use it; otherwise fetch from API
    if (passedScheduleData && passedScheduleData.length > 0) {
      setScheduleData(passedScheduleData);
      const allPlaces = passedScheduleData.flatMap(day => day.planDescription || []);
      setSelectedPlaces(allPlaces);
      setLoading(false);
    } else if (tripId) {
      fetchScheduleData();
    } else {
      setLoading(false);
    }
  }, [tripId, passedScheduleData]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation(null);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const fetchScheduleData = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const user = await AsyncStorage.getItem('user');
      const currentUserId = user ? JSON.parse(user)._id : null;
      
      if (!token || !currentUserId) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${base_url}/schedule/listing/scheduleDescription/${tripId}/${currentUserId}?offset=0&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.success && response.data.data) {
        setScheduleData(response.data.data);
        // Set all places as selected by default
        const allPlaces = response.data.data.flatMap(day => day.planDescription || []);
        setSelectedPlaces(allPlaces);
      } else {
        setScheduleData([]);
        setSelectedPlaces([]);
      }
      setLoading(false);
    } catch (error) {
      setScheduleData([]);
      setSelectedPlaces([]);
      setLoading(false);
    }
  };

  // Get all locations from all days
  const getAllLocations = () => {
    return scheduleData.flatMap(day => day.planDescription || []);
  };

  // Update map region when selections change
  useEffect(() => {
    if (mapRef.current && selectedPlaces.length > 0) {
      const locations = selectedPlaces;
      const latitudes = locations.map(loc => loc.location.lat);
      const longitudes = locations.map(loc => loc.location.lng);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      mapRef.current.animateToRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.abs(maxLat - minLat) * 1.5,
        longitudeDelta: Math.abs(maxLng - minLng) * 1.5,
      }, 1000);
    }
  }, [selectedPlaces]);

  const handlePlaceSelect = (place) => {
    setSelectedPlaces(prev => {
      // If place is already selected, remove it
      if (prev.some(p => p._id === place._id)) {
        return prev.filter(p => p._id !== place._id);
      }
      // Add new place to selection
      return [...prev, place];
    });
  };

  // Calculate initial region based on selected locations
  const getInitialRegion = () => {
    try {
      // First try to use actual trip locations
      const tripLocations = getAllTripLocations();
      if (tripLocations && tripLocations.length > 0) {
        const validLocations = tripLocations.filter(loc => 
          loc && loc.location && 
          typeof loc.location.lat === 'number' && 
          typeof loc.location.lng === 'number' &&
          !isNaN(loc.location.lat) && 
          !isNaN(loc.location.lng)
        );
        
        if (validLocations.length > 0) {
          const latitudes = validLocations.map(loc => loc.location.lat);
          const longitudes = validLocations.map(loc => loc.location.lng);
          
          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLng = Math.min(...longitudes);
          const maxLng = Math.max(...longitudes);

          return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(Math.abs(maxLat - minLat) * 1.5, 0.1),
            longitudeDelta: Math.max(Math.abs(maxLng - minLng) * 1.5, 0.1),
          };
        }
      }

      // Try to use current day locations
      const currentLocations = getCurrentDayLocations();
      if (currentLocations && currentLocations.length > 0) {
        const validLocations = currentLocations.filter(loc => 
          loc && loc.location && 
          typeof loc.location.lat === 'number' && 
          typeof loc.location.lng === 'number' &&
          !isNaN(loc.location.lat) && 
          !isNaN(loc.location.lng)
        );
        
        if (validLocations.length > 0) {
          const latitudes = validLocations.map(loc => loc.location.lat);
          const longitudes = validLocations.map(loc => loc.location.lng);
          
          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLng = Math.min(...longitudes);
          const maxLng = Math.max(...longitudes);

          return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(Math.abs(maxLat - minLat) * 1.5, 0.1),
            longitudeDelta: Math.max(Math.abs(maxLng - minLng) * 1.5, 0.1),
          };
        }
      }

      // Try to use from/to locations
      const fixedLocations = getFixedLocations();
      if (fixedLocations.from && fixedLocations.from.location) {
        const lat = parseFloat(fixedLocations.from.location.lat);
        const lng = parseFloat(fixedLocations.from.location.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          };
        }
      }

      // Default to Bangalore coordinates
      return {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    } catch (error) {
      // Fallback to Bangalore coordinates
      return {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
  };

  // Get route coordinates from selected locations
  const getRouteCoordinates = () => {
    try {
      const locations = selectedPlaces.length > 0 ? selectedPlaces : getAllLocations();
      if (!locations || locations.length === 0) {
        return [];
      }
      
      return locations
        .filter(loc => 
          loc && loc.location && 
          typeof loc.location.lat === 'number' && 
          typeof loc.location.lng === 'number' &&
          !isNaN(loc.location.lat) && 
          !isNaN(loc.location.lng)
        )
        .map(loc => ({
          latitude: loc.location.lat,
          longitude: loc.location.lng
        }));
    } catch (error) {
      return [];
    }
  };

  // Utility functions to work with passed data
  
  // Get locations for a specific day
  const getLocationsForDay = (dayNumber) => {
    try {
      if (scheduleData && scheduleData.length > 0) {
        const dayData = scheduleData.find(day => day && day.dayNumber === dayNumber);
        return dayData ? (dayData.planDescription || []) : [];
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  // Get all locations from all days
  const getAllTripLocations = () => {
    try {
      if (allLocations && allLocations.length > 0) {
        return allLocations;
      }
      if (scheduleData && scheduleData.length > 0) {
        return scheduleData.flatMap(day => day && day.planDescription ? day.planDescription : []);
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  // Get trip information
  const getTripInfo = () => {
    if (tripData) {
      return {
        title: tripData.title,
        date: tripData.date,
        numberOfDays: tripData.numberOfDays,
        riders: tripData.riders,
        travelMode: tripData.travelMode,
        visible: tripData.visible,
        imageUrl: tripData.imageUrl,
        createdBy: tripData.createdBy,
        createdAt: tripData.createdAt,
        updatedAt: tripData.updatedAt
      };
    }
    if (tripMetadata) {
      return tripMetadata;
    }
    return null;
  };

  // Get from and to locations
  const getFixedLocations = () => {
    return {
      from: fromLocation || null,
      to: toLocation || null
    };
  };

  // Get current day information
  const getCurrentDayInfo = () => {
    return {
      activeDay: activeDay || 1,
      totalDays: totalDays || 3, // Default to 3 days
      currentDayLocations: currentDayLocations || []
    };
  };

  // Get all available data summary
  const getDataSummary = () => {
    return {
      tripInfo: getTripInfo(),
      currentDay: getCurrentDayInfo(),
      fixedLocations: getFixedLocations(),
      allLocations: getAllTripLocations(),
      scheduleData: scheduleData,
      tripId: tripId
    };
  };

  // Example functions showing how to use the received data
  
  // Example: Get trip title and display it
  const getTripTitle = () => {
    const tripInfo = getTripInfo();
    return tripInfo?.title || 'Untitled Trip';
  };

  // Example: Get all locations for the current active day
  const getCurrentDayLocations = () => {
    const currentDay = getCurrentDayInfo();
    const locations = getLocationsForDay(currentDay.activeDay);
    return locations || [];
  };

  // Example: Get route summary (from -> to)
  const getRouteSummary = () => {
    const fixedLocations = getFixedLocations();
    const from = fixedLocations.from?.name || 'Starting Point';
    const to = fixedLocations.to?.name || 'Destination';
    return `${from} → ${to}`;
  };

  // Example: Get total distance of the trip
  const getTotalDistance = () => {
    const locations = getAllTripLocations();
    if (!locations || locations.length === 0) {
      return 0;
    }
    return locations.reduce((total, location) => {
      const distance = parseFloat(location.distanceInKilometer) || 0;
      return total + distance;
    }, 0);
  };

  // Example: Get trip duration
  const getTripDuration = () => {
    const currentDay = getCurrentDayInfo();
    const days = currentDay.totalDays || 3; // Default to 3 days if no data
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  // Example: Check if trip is multi-day
  const isMultiDayTrip = () => {
    const currentDay = getCurrentDayInfo();
    const days = currentDay.totalDays || 3; // Default to 3 days if no data
    return days > 1;
  };

  // Example: Get all unique locations (no duplicates)
  const getUniqueLocations = () => {
    try {
      const locations = getAllTripLocations() || [];
      const unique = [];
      const seen = new Set();
      
      locations.forEach(location => {
        if (location) {
          const key = location.name || location.title || location._id || Math.random().toString();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(location);
          }
        }
      });
      
      return unique;
    } catch (error) {
      return [];
    }
  };

  // Example: Get locations by day number
  const getLocationsByDay = (dayNumber) => {
    try {
      if (scheduleData && scheduleData.length > 0) {
        const dayData = scheduleData.find(day => day && day.dayNumber === dayNumber);
        return dayData ? (dayData.planDescription || []) : [];
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  // Example: Get trip statistics
  const getTripStats = () => {
    try {
      const locations = getAllTripLocations() || [];
      const uniqueLocations = getUniqueLocations() || [];
      const totalDistance = getTotalDistance() || 0;
      const currentDay = getCurrentDayInfo();
      
      return {
        totalLocations: locations.length || 0,
        uniqueLocations: uniqueLocations.length || 0,
        totalDistance: totalDistance.toFixed(2) || '0.00',
        totalDays: currentDay.totalDays || 3,
        currentDay: currentDay.activeDay || 1,
        isMultiDay: isMultiDayTrip() || false
      };
    } catch (error) {
      return {
        totalLocations: 0,
        uniqueLocations: 0,
        totalDistance: '0.00',
        totalDays: 3,
        currentDay: 1,
        isMultiDay: true
      };
    }
  };

  useEffect(() => {
    const fetchDiscoverbyNearest = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) {
          return;
        }

        const url = `${base_url}/schedule/places/getNearest?type=adventure&keyword=adventure`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data) {
          setDiscoverbyNearest([]);
          return;
        }

        if (!data.data || !Array.isArray(data.data)) {
          setDiscoverbyNearest([]);
          return;
        }

        const formattedData = data.data.map(item => {
          if (!item) {
            return null;
          }

          const id = item._id || item.id;
          const placeId = item.placeId || id;
          const formattedItem = {
            id,
            placeId,
            image: item.image ? (item.image.startsWith('http') ? item.image : `${base_url}/${item.image.replace(/^\/+/, '')}`) : null,
            title: item.name || item.title || 'Unknown Place',
            subtitle: item.address || item.subtitle || 'No address available',
            rating: parseFloat(item.rating) || 0,
            distance: parseFloat(item.distanceInKilometer) || 0
          };
          return formattedItem;
        }).filter(item => item !== null); // Remove any null items
        
        if (formattedData.length === 0) {
        }

        setDiscoverbyNearest(formattedData);
      } catch (error) {
        setDiscoverbyNearest([]);
      }
    };

    fetchDiscoverbyNearest();
  }, []);

  useEffect(() => {
    const fetchAllDayRoutes = async () => {
      if (!scheduleData || scheduleData.length === 0) return;
      const routes = [];
      for (const day of scheduleData) {
        if (day.planDescription && day.planDescription.length > 1) {
          const waypoints = day.planDescription.map(loc => ({
            lat: loc.location.lat,
            lng: loc.location.lng,
          }));
          const polyline = await fetchRouteFromORS(waypoints);
          routes.push({ day: day.dayNumber, polyline });
        }
      }
      setDayRoutes(routes);
    };
    fetchAllDayRoutes();
  }, [scheduleData]);

  useEffect(() => {
    const fetchCurrentToDay1 = async () => {
      if (!currentLocation || !scheduleData || scheduleData.length === 0) return;
      const day1 = scheduleData.find(day => day.dayNumber === 1) || scheduleData[0];
      if (!day1 || !day1.planDescription || day1.planDescription.length === 0) return;
      const firstPlace = day1.planDescription[0];
      if (!firstPlace || !firstPlace.location) return;
      const waypoints = [
        { lat: currentLocation.latitude, lng: currentLocation.longitude },
        { lat: firstPlace.location.lat, lng: firstPlace.location.lng }
      ];
      const polyline = await fetchRouteFromORS(waypoints);
      setCurrentToDay1Route(polyline);
    };
    fetchCurrentToDay1();
  }, [currentLocation, scheduleData]);

  // Update the FlatList to handle empty states better
  const renderDiscoverList = () => {
    if (!discoverbynearest || discoverbynearest.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="map-search-outline" size={48} color={colors.btncolor} />
          <Text style={styles.emptyText}>No places to discover</Text>
          <Text style={styles.emptySubText}>Check back later for recommendations</Text>
        </View>
      );
    }

    return (
      <FlatList
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id || item._id}
        data={discoverbynearest}
        renderItem={({ item }) => {
          if (!item) {
            return null;
          }
          return (
            <View style={styles.discoverItemWrapper}>
              <DiscoverByNearest
                id={item.id}
                placeId={item.placeId}
                image={item.image}
                title={item.title || item.name || 'Unknown Place'}
                subtitle={item.subtitle || item.address || 'No address available'}
                rating={item.rating || 0}
                distance={item.distance || item.distanceInKilometer || 0}
              />
            </View>
          );
        }}
        style={styles.discoverList}
        contentContainerStyle={styles.discoverListContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="map-search-outline" size={48} color={colors.btncolor} />
            <Text style={styles.emptyText}>No places to discover</Text>
            <Text style={styles.emptySubText}>Check back later for recommendations</Text>
          </View>
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
        }}
      />
    );
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        mapRef.current.animateCamera({
          ...camera,
          zoom: camera.zoom + 1
        }, { duration: 300 });
      });
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        mapRef.current.animateCamera({
          ...camera,
          zoom: Math.max(1, camera.zoom - 1)
        }, { duration: 300 });
      });
    }
  };

  const handleFullMapBack = () => {
    setIsFullMapVisible(false);
  };

  const handleFullMapZoomIn = () => {
    if (fullMapRef.current) {
      fullMapRef.current.getCamera().then((camera) => {
        const newZoom = camera.zoom + 1;
        fullMapRef.current.animateCamera({
          ...camera,
          zoom: newZoom
        }, { duration: 300 });
      });
    }
  };

  const handleFullMapZoomOut = () => {
    if (fullMapRef.current) {
      fullMapRef.current.getCamera().then((camera) => {
        const newZoom = Math.max(1, camera.zoom - 1);
        fullMapRef.current.animateCamera({
          ...camera,
          zoom: newZoom
        }, { duration: 300 });
      });
    }
  };

  const handleExportLocations = async () => {
    if (selectedPlaces.length === 0) {
      showToast('Please select at least one location to export', 'error');
      return;
    }

    const locationsText = selectedPlaces.map((place, index) => {
      return `${index + 1}. ${place.name}\n   Address: ${place.address}\n   Coordinates: ${place.location.lat}, ${place.location.lng}\n`;
    }).join('\n');

    try {
      await Share.share({
        message: `Selected Locations:\n\n${locationsText}`,
        title: 'Trip Locations Export'
      });
    } catch (error) {
      showToast('Failed to export locations', 'error');
    }
  };

  const renderMapMarkers = () => {
    try {
      // If scheduleData is available, use it to get day numbers
      if (scheduleData && scheduleData.length > 0) {
        return scheduleData.flatMap((day, dayIndex) => {
          if (!day || !day.planDescription || day.planDescription.length === 0) {
            return [];
          }
          const dayNumber = day.dayNumber || (dayIndex + 1);

          return day.planDescription
            .filter(loc => 
              loc && loc.location && 
              typeof loc.location.lat === 'number' && 
              typeof loc.location.lng === 'number' &&
              !isNaN(loc.location.lat) && 
              !isNaN(loc.location.lng)
            )
            .map((location, locationIndex) => (
              <Marker
                key={location._id || location.id || `${dayIndex}-${locationIndex}`}
                coordinate={{
                  latitude: location.location.lat,
                  longitude: location.location.lng
                }}
                title={location.name || location.title || 'Location'}
                description={`Day ${dayNumber} - ${location.address || 'No address'}`}
              >
                <View style={styles.customMarker}>
                  <View style={[styles.markerInner, { backgroundColor: colors.btncolor }]}>
                    <Text style={styles.markerText}>{`D${dayNumber}`}</Text>
                  </View>
                </View>
              </Marker>
            ));
        });
      }

      // Fallback to allLocations if scheduleData is not available
      const locations = getAllTripLocations();
      if (!locations || locations.length === 0) {
        return null;
      }

      // Render without day numbers if only a flat list is available
      return locations
        .filter(loc => 
          loc && loc.location && 
          typeof loc.location.lat === 'number' && 
          typeof loc.location.lng === 'number' &&
          !isNaN(loc.location.lat) && 
          !isNaN(loc.location.lng)
        )
        .map((location, index) => (
          <Marker
            key={location._id || location.id || index}
            coordinate={{
              latitude: location.location.lat,
              longitude: location.location.lng
            }}
            title={location.name || location.title || 'Location'}
            description={location.address || 'No address'}
          >
            <View style={styles.customMarker}>
              <View style={[styles.markerInner, { backgroundColor: colors.btncolor }]}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </View>
          </Marker>
        ));
    } catch (error) {
      return null;
    }
  };

  const renderDayPolylines = () => {
    if (!dayRoutes || dayRoutes.length === 0) return null;
    const colors = ['#FF0000', '#00AA00', '#0000FF', '#FFA500', '#800080'];
    return dayRoutes.map((route, idx) => (
      <Polyline
        key={route.day}
        coordinates={route.polyline}
        strokeColor={colors[idx % colors.length]}
        strokeWidth={4}
      />
    ));
  };

  const renderCurrentToDay1Polyline = () => {
    if (currentToDay1Route && currentToDay1Route.length > 1) {
      return (
        <Polyline
          coordinates={currentToDay1Route}
          strokeColor="#00BFFF" // Distinct color (e.g., blue)
          strokeWidth={5}
          lineDashPattern={[10, 5]} // Dashed line for distinction
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.protractorShape} />
      <View style={styles.backgroundCurvedContainer} />

      {/* Back Header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999 }}>
        <BackHeader 
          backPressed={handleBackPress}
          onSearchPress={handleSearchPress}
          onChatPress={handleChatPress}
          onNotificationPress={handleNotificationPress}
          onProfilePress={handleProfilePress}
          title=""
          showSearch={true}
          showChat={true}
          showNotification={true}
          showProfile={true}
        />
      </View>

      <View style={styles.mainContent}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }} // Add padding to account for bottom tab
        >
          {/* Enhanced Route Display */}
          {(() => {
            const locations = getAllTripLocations();
            return locations && locations.length > 0 ? (
              <View style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <MaterialCommunityIcons name="navigation" size={20} color={colors.btncolor} />
                  <Text style={[styles.routeTitle, { color: colors.btncolor }]}>
                    {getTripTitle() || 'Trip Route'}
                  </Text>
                </View>
                <View style={styles.fromToContainer}>
                  <View style={styles.locationInfo}>
                    <View style={[styles.startMarker, { backgroundColor: colors.btncolor }]}>
                      <MaterialCommunityIcons name="map-marker" size={16} color={colors.white} />
                    </View>
                    <Text style={styles.locationText} numberOfLines={1}>
                      {locations[0]?.name || locations[0]?.title || 'Starting Point'}
                    </Text>
                  </View>
                  <View style={styles.routeLine}>
                    <View style={[styles.dashedLine, { backgroundColor: colors.btncolor }]} />
                    <MaterialCommunityIcons name="arrow-right" size={16} color={colors.btncolor} />
                  </View>
                  <View style={styles.locationInfo}>
                    <View style={[styles.endMarker, { backgroundColor: colors.btncolor }]}>
                      <MaterialCommunityIcons name="flag" size={16} color={colors.white} />
                    </View>
                    <Text style={styles.locationText} numberOfLines={1}>
                      {locations[locations.length - 1]?.name || locations[locations.length - 1]?.title || 'Destination'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null;
          })()}

          {/* Enhanced Map Container */}
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>Interactive Map</Text>
              <TouchableOpacity 
                style={styles.fullMapButton}
                onPress={() => setIsFullMapVisible(true)}
              >
                <MaterialCommunityIcons name="fullscreen" size={18} color={colors.btncolor} />
                <Text style={styles.fullMapText}>Full View</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={getInitialRegion()}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                toolbarEnabled={false}
              >
                {currentLocation && (
                  <Marker
                    coordinate={currentLocation}
                    title="You are here"
                    pinColor="#00BFFF"
                  />
                )}
                {renderCurrentToDay1Polyline()}
                {renderMapMarkers()}
                {renderDayPolylines()}
              </MapView>

              <View style={styles.zoomControls}>
                <TouchableOpacity 
                  style={styles.zoomButton}
                  onPress={handleZoomIn}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.zoomButton, { marginTop: 8 }]}
                  onPress={handleZoomOut}
                >
                  <MaterialCommunityIcons name="minus" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Enhanced Discover Section */}
          <View style={styles.discoverSection}>
            <View style={styles.discoverRow}>
              <View style={styles.discoverHeaderLeft}>
                <MaterialCommunityIcons name="compass-outline" size={24} color={colors.btncolor} />
                <TextDefault style={styles.discoverText}>Near by Adventure</TextDefault>
              </View>
                <TouchableOpacity onPress={() => navigation.navigate('CombinedDestinations', { viewType: 'nearest', outDoorTag: 'adventure' }) } style={styles.viewAllButton}>

                <TextDefault style={styles.viewAllText}>View All</TextDefault>
                <MaterialCommunityIcons name="arrow-right" size={16} color={colors.btncolor} />
              </TouchableOpacity>
            </View>
            {renderDiscoverList()}
          </View>
        </ScrollView>
      </View>

      {/* Full Map Modal */}
      <Modal
        visible={isFullMapVisible}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsFullMapVisible(false)}
      >
        <View style={styles.fullMapContainer}>
          <View style={styles.fullMapHeader}>
            <Text style={styles.fullMapTitle}>Full Map View</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <MapView
            ref={fullMapRef}
            style={styles.fullMap}
            initialRegion={getInitialRegion()}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
          >
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="You are here"
                pinColor="#00BFFF"
              />
            )}
            {renderCurrentToDay1Polyline()}
            {renderMapMarkers()}
            {renderDayPolylines()}
          </MapView>

          <View style={styles.fullMapZoomControls}>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomTabContainer}>
      
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backgroundCurvedContainer: {
    backgroundColor: colors.btncolor,
    height: 200,
    width: "100%",
    position: "absolute",
    top: 0,
    zIndex: 0,
  },
  protractorShape: {
    backgroundColor: colors.white,
    height: 500,
    width: 1000,
    borderTopLeftRadius: 500,
    borderTopRightRadius: 500,
    position: "absolute",
    top: 80,
    alignSelf: "center",
    zIndex: 1,
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    paddingTop: 90,
    zIndex: 99,
  },
  
  // Enhanced Route Card
  routeCard: {
    backgroundColor: colors.white,
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginLeft: 8,
  },
  fromToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  startMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    color: colors.fontMainColor,
    flex: 1,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  dashedLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.btncolor,
    marginRight: 8,
    opacity: 0.5,
  },

  // Enhanced Map Card
  mapCard: {
    backgroundColor: colors.white,
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  fullMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.btncolor,
  },
  fullMapText: {
    color: colors.btncolor,
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  mapContainer: {
    position: 'relative',
    width: '100%',
    height: width * 0.6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  zoomControls: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  zoomButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.btncolor,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Enhanced Discover Section
  discoverSection: {
    backgroundColor: colors.white,
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  discoverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  discoverHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoverText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.fontMainColor,
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.btncolor,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.btncolor,
    fontWeight: "600",
    marginRight: 4,
  },
  discoverList: {
    width: '100%',
  },
  discoverListContent: {
    paddingVertical: 0,
  },
  discoverItemWrapper: {
    marginRight: 2,
    width: 160,
  },

  // Enhanced Empty State
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    marginVertical: 10,
  },
  emptyText: {
    color: colors.fontMainColor,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    color: colors.darkGray,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },

  // Full Map Modal Styles
  fullMapContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  fullMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.btncolor,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 44, // Account for status bar
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fullMapBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullMapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  fullMap: {
    flex: 1,
  },
  fullMapZoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    zIndex: 1000,
  },
  fullMapZoomButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.btncolor,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
  },

  // Bottom Tab Container
  bottomTabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    backgroundColor: colors.white,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  // Additional utility styles
  cardContainer: {
    marginRight: 15,
    width: 180,
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
});

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNlOGNlNDQyNjZhODQwMDhhNGRlN2U3YWJkOGNiMDQzIiwiaCI6Im11cm11cjY0In0='; // Replace with your key

// Fetch route for a set of waypoints (array of {lat, lng})
const fetchRouteFromORS = async (waypoints) => {
  try {
    const coordinates = waypoints.map(wp => [wp.lng, wp.lat]);
    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      { coordinates },
      {
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    // Convert GeoJSON to array of {latitude, longitude}
    return response.data.features[0].geometry.coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));
  } catch (error) {
    console.error('ORS route error:', error);
    return [];
  }
};

export default Map;