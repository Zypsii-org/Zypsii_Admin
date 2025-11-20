import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../../utils';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../../context/ToastContext';
import Moment from 'moment';

const { width } = Dimensions.get('window');

function formatDateForBackend(dateString) {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return undefined; // Invalid date
  return date.toISOString(); // Return ISO string for backend
}

// Function to get place name from coordinates using BigDataCloud API (free, no API key required)
const getPlaceNameFromCoordinates = async (lat, lng) => {
  try {
    console.log('Making geocoding request for:', lat, lng);
    
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Geocoding API response:', data);
    
    if (data.locality && data.city) {
      const address = `${data.locality}, ${data.city}, ${data.countryName}`;
      console.log('Successfully got address:', address);
      return address;
    } else if (data.city) {
      const address = `${data.city}, ${data.countryName}`;
      console.log('Successfully got address:', address);
      return address;
    } else if (data.countryName) {
      const address = data.countryName;
      console.log('Successfully got address:', address);
      return address;
    } else {
      console.log('No results found for coordinates:', lat, lng);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  } catch (error) {
    console.error('Error getting place name:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

const EditSchedule = ({ route, navigation }) => {
  const { scheduleId, scheduleData, onScheduleUpdated } = route.params || {};
  const { showToast } = useToast();
  
  // Validate scheduleId
  useEffect(() => {
    if (!scheduleId) {
      showToast('Invalid schedule ID', 'error');
      navigation.goBack();
      return;
    }
  }, [scheduleId]);

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [bannerImage, setBannerImage] = useState(
    scheduleData?.bannerImage || scheduleData?.imageUrl || null
  );

  // Add state for date pickers
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [showFromTimePicker, setShowFromTimePicker] = useState(false);
  const [showToTimePicker, setShowToTimePicker] = useState(false);

  // Initialize form data with all fields from scheduleData
  const [formData, setFormData] = useState({
    tripName: scheduleData?.title || '',
    description: scheduleData?.description || '',
    travelMode: scheduleData?.travelMode || '',
    visible: scheduleData?.visible || scheduleData?.privacy || 'Public',
    fromPlace: scheduleData?.fromPlace || 
               scheduleData?.location?.from?.place || 
               scheduleData?.rawLocation?.from?.place || 
               '',
    toPlace: scheduleData?.toPlace || 
             scheduleData?.location?.to?.place || 
             scheduleData?.rawLocation?.to?.place || 
             '',
    fromLatitude: scheduleData?.location?.from?.latitude || 
                  scheduleData?.rawLocation?.from?.latitude || 
                  scheduleData?.fromLatitude ||
                  null,
    fromLongitude: scheduleData?.location?.from?.longitude || 
                   scheduleData?.rawLocation?.from?.longitude || 
                   scheduleData?.fromLongitude ||
                   null,
    toLatitude: scheduleData?.location?.to?.latitude || 
                scheduleData?.rawLocation?.to?.latitude || 
                scheduleData?.toLatitude ||
                null,
    toLongitude: scheduleData?.location?.to?.longitude || 
                 scheduleData?.rawLocation?.to?.longitude || 
                 scheduleData?.toLongitude ||
                 null,
    fromDate: scheduleData?.Dates?.from ? new Date(scheduleData.Dates.from).toISOString() : scheduleData?.date ? new Date(scheduleData.date).toISOString() : '',
    toDate: scheduleData?.Dates?.end ? new Date(scheduleData.Dates.end).toISOString() : scheduleData?.toDate ? new Date(scheduleData.toDate).toISOString() : '',
    fromTime: scheduleData?.fromTime || '09:00',
    toTime: scheduleData?.toTime || '17:00',
    numberOfDays: scheduleData?.numberOfDays || scheduleData?.riders || '',
    budget: scheduleData?.budget || '',
    maxRiders: scheduleData?.maxRiders || '',
    bannerImage: scheduleData?.bannerImage || scheduleData?.imageUrl || '',
  });

  // Function to update place names from coordinates when they are empty
  const updatePlaceNamesFromCoordinates = async (formDataToUpdate) => {
    const updatedFormData = { ...formDataToUpdate };
    
    try {
      // Update fromPlace if it's empty or 'Unknown location' but coordinates exist
      if (
        (!updatedFormData.fromPlace || updatedFormData.fromPlace.trim() === '' || updatedFormData.fromPlace === 'Unknown location') &&
        updatedFormData.fromLatitude && updatedFormData.fromLongitude
      ) {
        const fromPlaceName = await getPlaceNameFromCoordinates(
          parseFloat(updatedFormData.fromLatitude), 
          parseFloat(updatedFormData.fromLongitude)
        );
        updatedFormData.fromPlace = fromPlaceName;
      }
      
      // Update toPlace if it's empty or 'Unknown location' but coordinates exist
      if (
        (!updatedFormData.toPlace || updatedFormData.toPlace.trim() === '' || updatedFormData.toPlace === 'Unknown location') &&
        updatedFormData.toLatitude && updatedFormData.toLongitude
      ) {
        const toPlaceName = await getPlaceNameFromCoordinates(
          parseFloat(updatedFormData.toLatitude), 
          parseFloat(updatedFormData.toLongitude)
        );
        updatedFormData.toPlace = toPlaceName;
      }
      
      return updatedFormData;
    } catch (error) {
      console.error('Error updating place names from coordinates:', error);
      return formDataToUpdate;
    }
  };

  // Add useEffect to log the initial data and handle missing location data
  useEffect(() => {
    // Only check for missing location data if scheduleData is actually loaded and we're not loading
    if (scheduleData && Object.keys(scheduleData).length > 0 && !dataLoading) {
      // Check all possible sources for location coordinates
      const hasLocationData =
        (scheduleData?.location?.from?.latitude && scheduleData?.location?.from?.longitude &&
         scheduleData?.location?.to?.latitude && scheduleData?.location?.to?.longitude) ||
        (scheduleData?.rawLocation?.from?.latitude && scheduleData?.rawLocation?.from?.longitude &&
         scheduleData?.rawLocation?.to?.latitude && scheduleData?.rawLocation?.to?.longitude) ||
        (scheduleData?.fromLatitude && scheduleData?.fromLongitude &&
         scheduleData?.toLatitude && scheduleData?.toLongitude);
      
      if (!hasLocationData) {
        console.warn('Missing location coordinates in schedule data');
        console.log('Available location data:', {
          location: scheduleData?.location,
          rawLocation: scheduleData?.rawLocation,
          fromPlace: scheduleData?.fromPlace,
          toPlace: scheduleData?.toPlace
        });
        showToast('Location data is missing. Please select locations on the map before updating.', 'warning');
      } else {
        console.log('Location data found:', hasLocationData);
      }

      // Update place names from coordinates if they are empty
      const updatePlaceNames = async () => {
        const updatedFormData = await updatePlaceNamesFromCoordinates(formData);
        if (updatedFormData.fromPlace !== formData.fromPlace || updatedFormData.toPlace !== formData.toPlace) {
          setFormData(updatedFormData);
          console.log('Updated form data with place names from coordinates');
        }
      };
      
      updatePlaceNames();
    } else {
      console.log('Schedule data not yet loaded or still loading');
    }
  }, [scheduleData, dataLoading]);

  // Monitor form data changes for debugging
  useEffect(() => {
    console.log('Form data updated:', {
      fromLatitude: formData.fromLatitude,
      fromLongitude: formData.fromLongitude,
      toLatitude: formData.toLatitude,
      toLongitude: formData.toLongitude,
      fromPlace: formData.fromPlace,
      toPlace: formData.toPlace,
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      numberOfDays: formData.numberOfDays
    });

    // Check if we have valid location data in form data
    const hasValidLocationData = formData.fromLatitude && 
                                 formData.fromLongitude && 
                                 formData.toLatitude && 
                                 formData.toLongitude &&
                                 formData.fromLatitude !== null && 
                                 formData.fromLongitude !== null && 
                                 formData.toLatitude !== null && 
                                 formData.toLongitude !== null;

    if (hasValidLocationData && !dataLoading) {
      console.log('Valid location data found in form data');
    }
  }, [formData.fromLatitude, formData.fromLongitude, formData.toLatitude, formData.toLongitude, formData.fromPlace, formData.toPlace, formData.fromDate, formData.toDate, formData.numberOfDays, dataLoading]);

  // Add function to calculate end date based on start date and number of days
  const calculateEndDate = (startDate, numberOfDays) => {
    if (!startDate || !numberOfDays) return null;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(numberOfDays) - 1);
    return endDate.toISOString();
  };

  // Add function to calculate number of days between two dates
  const calculateNumberOfDays = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 because we count both start and end day
    return daysDiff > 0 ? daysDiff : 1;
  };

  // Add function to handle input changes
  const handleInputChange = (field, value) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // If numberOfDays changed and we have a start date, recalculate end date
      if (field === 'numberOfDays' && value && prev.fromDate) {
        const endDate = calculateEndDate(prev.fromDate, value);
        if (endDate) {
          updated.toDate = endDate;
          updated.toTime = '17:00';
        }
      }

      return updated;
    });
  };

  // Add useEffect to set default dates when form loads
  useEffect(() => {
    // Set default start date to today if not already set
    if (!formData.fromDate) {
      const today = new Date();
      today.setHours(9, 0, 0, 0); // Set to 9:00 AM
      setFormData(prev => ({
        ...prev,
        fromDate: today.toISOString(),
        fromTime: '09:00'
      }));
    }
  }, []); // Run only once when component mounts

  // Consolidated useEffect to calculate end date whenever start date, end date, or number of days changes
  useEffect(() => {
    // If fromDate is set but toDate is missing, set toDate based on fromDate and numberOfDays (default 1)
    if (formData.fromDate && (!formData.toDate || formData.toDate === '')) {
      const days = parseInt(formData.numberOfDays) || 1;
      const endDate = calculateEndDate(formData.fromDate, days);
      if (endDate) {
        setFormData(prev => ({
          ...prev,
          toDate: endDate,
          toTime: prev.toTime || '17:00',
          numberOfDays: days.toString(), // ensure numberOfDays is set
        }));
      }
    } else if (formData.fromDate && formData.numberOfDays) {
      // If both fromDate and numberOfDays are set, always keep toDate in sync
      const days = parseInt(formData.numberOfDays);
      if (!isNaN(days) && days > 0) {
        const endDate = calculateEndDate(formData.fromDate, days);
        if (endDate && formData.toDate !== endDate) {
          setFormData(prev => ({
            ...prev,
            toDate: endDate,
            toTime: prev.toTime || '17:00',
          }));
        }
      }
    }
  }, [formData.fromDate, formData.toDate, formData.numberOfDays]);

  // Function to refresh schedule listing data
  const refreshScheduleListing = async () => {
    try {
      console.log('Refreshing schedule listing data...');
      const accessToken = await AsyncStorage.getItem('accessToken');
      const user = await AsyncStorage.getItem('user');
      const currentUserId = user ? JSON.parse(user)._id : null;

      if (!accessToken || !currentUserId) {
        console.error('Missing token or userId for refresh');
        return;
      }

      // Determine which APIs to call based on context
      const refreshApis = [];
      
      // Always refresh my schedules
      refreshApis.push({
        name: 'My Schedules',
        url: `${base_url}/schedule/listing/filter?filter=my&userId=${currentUserId}&limit=20`
      });

      // Add other APIs based on context or always include them
      refreshApis.push({
        name: 'Public Schedules',
        url: `${base_url}/schedule/listing/filter?filter=Public`
      });

      refreshApis.push({
        name: 'Joined Schedules',
        url: `${base_url}/schedule/listing/joined-schedules?limit=20&offset=0`
      });

      // Call all the APIs
      const refreshPromises = refreshApis.map(api => 
        fetch(api.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
      );

      const responses = await Promise.allSettled(refreshPromises);
      
      let successCount = 0;
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.ok) {
          successCount++;
          console.log(`${refreshApis[index].name} refreshed successfully`);
        } else {
          console.error(`Failed to refresh ${refreshApis[index].name}:`, result.reason || result.value?.status);
        }
      });

      if (successCount > 0) {
        console.log(`Successfully refreshed ${successCount}/${refreshApis.length} schedule listings`);
        showToast('Schedule data refreshed successfully', 'success');
      } else {
        console.error('Failed to refresh any schedule listings');
        showToast('Failed to refresh schedule data', 'error');
      }
    } catch (error) {
      console.error('Error refreshing schedule listing:', error);
      showToast('Error refreshing schedule data', 'error');
    }
  };

  // Add state for day schedules with location data
  const [daySchedules, setDaySchedules] = useState([
    { 
      day: 1, 
      activities: '', 
      time: '',
      location: '',
      description: '',
      planDescription: [],
      latitude: '',
      longitude: ''
    }
  ]);

  // Fetch schedule data if not provided
  useEffect(() => {
    const fetchScheduleData = async () => {
      // If we already have scheduleData, don't fetch again
      if (scheduleData && Object.keys(scheduleData).length > 0) {
        console.log('Schedule data already available');
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const user = await AsyncStorage.getItem('user');
        const currentUserId = user ? JSON.parse(user)._id : null;

        if (!accessToken || !currentUserId || !scheduleId) {
          console.error('Missing token, userId, or scheduleId');
          return;
        }

        console.log('Fetching schedule data for ID:', scheduleId);
        
        const response = await fetch(
          `${base_url}/schedule/listing/schedule/${scheduleId}/${currentUserId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        const data = await response.json();
        console.log('Fetched Schedule Data:', data);
        
        if (data.success && data.data) {
          // Create initial form data with fetched schedule data
          const initialFormData = {
            ...formData,
            tripName: data.data.title || data.data.tripName || formData.tripName,
            description: data.data.description || formData.description,
            travelMode: data.data.travelMode || formData.travelMode,
            visible: data.data.visible || data.data.privacy || formData.visible,
            fromPlace: data.data.fromPlace || 
                       data.data.location?.from?.place || 
                       data.data.rawLocation?.from?.place || 
                       formData.fromPlace,
            toPlace: data.data.toPlace || 
                     data.data.location?.to?.place || 
                     data.data.rawLocation?.to?.place || 
                     formData.toPlace,
            fromLatitude: data.data.location?.from?.latitude || 
                          data.data.rawLocation?.from?.latitude || 
                          data.data.fromLatitude ||
                          formData.fromLatitude,
            fromLongitude: data.data.location?.from?.longitude || 
                           data.data.rawLocation?.from?.longitude || 
                           data.data.fromLongitude ||
                           formData.fromLongitude,
            toLatitude: data.data.location?.to?.latitude || 
                        data.data.rawLocation?.to?.latitude || 
                        data.data.toLatitude ||
                        formData.toLatitude,
            toLongitude: data.data.location?.to?.longitude || 
                         data.data.rawLocation?.to?.longitude || 
                         data.data.toLongitude ||
                         formData.toLongitude,
            fromDate: data.data.Dates?.from ? new Date(data.data.Dates.from).toISOString() : 
                     data.data.date ? new Date(data.data.date).toISOString() : formData.fromDate,
            toDate: data.data.Dates?.end ? new Date(data.data.Dates.end).toISOString() : 
                   data.data.toDate ? new Date(data.data.toDate).toISOString() : formData.toDate,
            numberOfDays: data.data.numberOfDays || data.data.riders || formData.numberOfDays,
            bannerImage: data.data.bannerImage || data.data.imageUrl || formData.bannerImage,
          };

          // Update place names from coordinates if they are empty
          const updatedFormData = await updatePlaceNamesFromCoordinates(initialFormData);
          
          // Set the form data with updated place names
          setFormData(updatedFormData);
          console.log('Updated form data with fetched schedule data and place names from coordinates');
        }
      } catch (error) {
        console.error('Error fetching schedule data:', error);
        showToast('Failed to load schedule data', 'error');
      } finally {
        setDataLoading(false);
      }
    };

    fetchScheduleData();
  }, [scheduleId, scheduleData]);

  // Fetch schedule description data
  useEffect(() => {
    const fetchScheduleDescription = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const user = await AsyncStorage.getItem('user');
        const currentUserId = user ? JSON.parse(user)._id : null;

        if (!accessToken || !currentUserId) {
          console.error('Missing token or userId');
          return;
        }

        const response = await fetch(
          `${base_url}/schedule/listing/scheduleDescription/${scheduleId}/${currentUserId}?offset=0&limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        const data = await response.json();
        console.log('Schedule Description Data:', data);
        
        if (data.success && data.data) {
          // Transform the API data into daySchedules format
          const transformedSchedules = data.data.map((day, index) => ({
            _id: day._id, // Store the description ID
            day: index + 1,
            activities: '',
            time: '',
            location: day.planDescription?.[0]?.name || '',
            description: day.Description || '',
            planDescription: day.planDescription || [],
            latitude: day.planDescription?.[0]?.location?.lat || '',
            longitude: day.planDescription?.[0]?.location?.lng || '',
            date: day.date // Store the original date
          }));
          
          setDaySchedules(transformedSchedules);
        }
      } catch (error) {
        console.error('Error fetching schedule description:', error);
        Alert.alert('Error', 'Failed to load schedule details');
      }
    };

    fetchScheduleDescription();
  }, [scheduleId]);

  // Update openMapForLocation function
  const openMapForLocation = (type, dayIndex) => {
    let initialLocation;
    
    if (type === 'day') {
      // For day-specific locations, use the day's current location
      const daySchedule = daySchedules[dayIndex];
      const lat = parseFloat(daySchedule?.latitude);
      const lng = parseFloat(daySchedule?.longitude);
      
      if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        initialLocation = {
          latitude: lat,
          longitude: lng,
          place: daySchedule?.location || ''
        };
      } else {
        initialLocation = null;
      }
    } else if (type === 'from') {
      const lat = parseFloat(formData.fromLatitude);
      const lng = parseFloat(formData.fromLongitude);
      
      if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        initialLocation = {
          latitude: lat,
          longitude: lng,
          place: formData.fromPlace
        };
      } else {
        initialLocation = null;
      }
    } else if (type === 'to') {
      const lat = parseFloat(formData.toLatitude);
      const lng = parseFloat(formData.toLongitude);
      
      if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        initialLocation = {
          latitude: lat,
          longitude: lng,
          place: formData.toPlace
        };
      } else {
        initialLocation = null;
      }
    }

    console.log('Opening map for location:', { type, initialLocation });
    
    navigation.navigate('EditMapScreen', { 
      type,
      scheduleId,
      dayIndex,
      initialLocation
    });
  };

  // Update handleLocationSelect function
  const handleLocationSelect = async (type, place, latitude, longitude, dayIndex) => {
    console.log('Location selected:', { type, place, latitude, longitude, dayIndex });
    
    if (type === 'day' && dayIndex !== undefined) {
      // Update specific day's location
      const updatedSchedules = [...daySchedules];
      updatedSchedules[dayIndex] = {
        ...updatedSchedules[dayIndex],
        location: place,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        planDescription: [{
          name: place,
          location: {
            lat: latitude.toString(),
            lng: longitude.toString()
          }
        }]
      };
      setDaySchedules(updatedSchedules);
    } else if (type === 'from') {
      // If place is empty or just coordinates, get the place name
      let placeName = place;
      if (!place || place.trim() === '' || /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(place)) {
        try {
          placeName = await getPlaceNameFromCoordinates(latitude, longitude);
          console.log('Got place name for from location:', placeName);
        } catch (error) {
          console.error('Error getting place name for from location:', error);
          placeName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        fromPlace: placeName,
        fromLatitude: latitude.toString(),
        fromLongitude: longitude.toString()
      }));
      console.log('Updated from location:', { placeName, latitude, longitude });
      showToast(`From location set to: ${placeName}`, 'success');
    } else if (type === 'to') {
      // If place is empty or just coordinates, get the place name
      let placeName = place;
      if (!place || place.trim() === '' || /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(place)) {
        try {
          placeName = await getPlaceNameFromCoordinates(latitude, longitude);
          console.log('Got place name for to location:', placeName);
        } catch (error) {
          console.error('Error getting place name for to location:', error);
          placeName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        toPlace: placeName,
        toLatitude: latitude.toString(),
        toLongitude: longitude.toString()
      }));
      console.log('Updated to location:', { placeName, latitude, longitude });
      showToast(`To location set to: ${placeName}`, 'success');
    }
  };

  // Update useEffect for location updates
  useEffect(() => {
    if (route.params?.latitude && route.params?.longitude) {
      const { latitude, longitude, type, placeName, dayIndex } = route.params;
      console.log('Received location update:', { latitude, longitude, type, placeName, dayIndex });
      
      handleLocationSelect(type, placeName, latitude, longitude, dayIndex);
      
      // Clear the route params to prevent duplicate updates
      navigation.setParams({ 
        latitude: undefined, 
        longitude: undefined, 
        type: undefined, 
        placeName: undefined,
        dayIndex: undefined 
      });
    }
  }, [route.params]);

  // Validation functions
  const validateForm = () => {
    const errors = [];

    if (formData.tripName && typeof formData.tripName !== 'string') {
      errors.push('Trip name must be a string');
    }

    if (formData.travelMode && !['Car', 'Bike', 'Cycle'].includes(formData.travelMode)) {
      errors.push('Invalid travel mode. Must be Car, Bike, or Cycle');
    }

    if (formData.visible && !['Public', 'Private', 'FriendOnly'].includes(formData.visible)) {
      errors.push('Invalid visibility option');
    }

    if (formData.fromLatitude && (isNaN(formData.fromLatitude) || formData.fromLatitude < -90 || formData.fromLatitude > 90)) {
      errors.push('Invalid from latitude');
    }

    if (formData.fromLongitude && (isNaN(formData.fromLongitude) || formData.fromLongitude < -180 || formData.fromLongitude > 180)) {
      errors.push('Invalid from longitude');
    }

    if (formData.toLatitude && (isNaN(formData.toLatitude) || formData.toLatitude < -90 || formData.toLatitude > 90)) {
      errors.push('Invalid to latitude');
    }

    if (formData.toLongitude && (isNaN(formData.toLongitude) || formData.toLongitude < -180 || formData.toLongitude > 180)) {
      errors.push('Invalid to longitude');
    }

    if (formData.fromDate && !isValidDate(formData.fromDate)) {
      errors.push('Invalid from date');
    }

    if (formData.toDate && !isValidDate(formData.toDate)) {
      errors.push('Invalid to date');
    }

    if (formData.numberOfDays && (!Number.isInteger(Number(formData.numberOfDays)) || Number(formData.numberOfDays) < 1)) {
      errors.push('Number of days must be a positive integer');
    }

    return errors;
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  // Add image picker function
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Image Permission Error:', 'Permission not granted');
        showToast('Please grant permission to access your photos', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        // Create form data for image upload
        const formDataUpload = new FormData();
        const imageUri = result.assets[0].uri;
        const imageName = imageUri.split('/').pop();
        const match = /(\.\w+)$/.exec(imageName);
        const imageType = match ? `image/${match[1]}` : 'image/jpeg';

        // Check image size
        const imageResponse = await fetch(imageUri);
        const blob = await imageResponse.blob();
        const fileSizeInMB = blob.size / (1024 * 1024);
        
        if (fileSizeInMB > 10) {
          throw new Error('Image size exceeds 10MB limit. Please select a smaller image.');
        }

        formDataUpload.append('mediaFile', {
          uri: imageUri,
          type: imageType,
          name: imageName
        });

        console.log('Uploading image with data:', {
          uri: imageUri,
          type: imageType,
          name: imageName
        });

        // Upload image to server using the correct endpoint with mediaType
        const response = await fetch(`${base_url}/uploadFile?mediaType=post`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formDataUpload
        });

        const data = await response.json();
        console.log('Image upload response:', data);
        
        if (data.status && data.urls && data.urls.length > 0) {
          // Get the image URL from the response
          const imageUrl = data.urls[0];
          console.log('Image uploaded successfully, URL:', imageUrl);
          setBannerImage(imageUrl);
          setFormData(prev => ({
            ...prev,
            bannerImage: imageUrl
          }));
          showToast(data.message || 'Image uploaded successfully', 'success');
        } else {
          console.error('Image upload failed:', data.message);
          throw new Error(data.message || 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error picking/uploading image:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showToast(error.message || 'Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update the banner section in the render
  const renderBannerSection = () => (
    <View style={styles.bannerContainer}>
      {bannerImage ? (
        <ImageBackground
          source={{ uri: bannerImage }}
          style={styles.bannerImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.bannerGradient}
          >
            <Text style={styles.bannerTitle}>{formData.tripName}</Text>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <TouchableOpacity 
          style={styles.bannerPlaceholder} 
          onPress={pickImage}
        >
          <Ionicons name="camera" size={40} color={colors.white} />
          <Text style={styles.bannerPlaceholderText}>Add Banner Image</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={styles.changeImageButton}
        onPress={pickImage}
      >
        <Ionicons name="camera" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  // Update handleUpdate function
  const handleUpdate = async () => {
    try {
      if (!scheduleId) {
        console.error('Validation Error: Invalid schedule ID');
        showToast('Invalid schedule ID', 'error');
        return;
      }

      // Validate form data
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        console.error('Form Validation Errors:', validationErrors);
        showToast(validationErrors.join('\n'), 'error');
        return;
      }

      // Additional validation for required fields
      if (!formData.tripName || formData.tripName.length < 3) {
        console.error('Validation Error: Invalid trip name');
        showToast('Trip name is required and must be at least 3 characters long', 'error');
        return;
      }

      if (!formData.travelMode) {
        console.error('Validation Error: Travel mode required');
        showToast('Travel mode is required', 'error');
        return;
      }

      if (!formData.fromPlace || !formData.toPlace) {
        console.error('Validation Error: Location required');
        showToast('From and To locations are required', 'error');
        return;
      }

      if (!formData.fromDate) {
        console.error('Validation Error: Start date required');
        showToast('Start date is required', 'error');
        return;
      }

      if (!formData.numberOfDays || isNaN(parseInt(formData.numberOfDays)) || parseInt(formData.numberOfDays) < 1) {
        console.error('Validation Error: Invalid number of days');
        showToast('Number of days must be a valid number and at least 1', 'error');
        return;
      }

      // Debug location coordinates
      console.log('Location coordinates check:', {
        fromLatitude: formData.fromLatitude,
        fromLongitude: formData.fromLongitude,
        toLatitude: formData.toLatitude,
        toLongitude: formData.toLongitude,
        fromPlace: formData.fromPlace,
        toPlace: formData.toPlace
      });

      // Validate location coordinates - check for both coordinates and place names
      if (!formData.fromLatitude || !formData.fromLongitude || !formData.toLatitude || !formData.toLongitude ||
          formData.fromLatitude === '' || formData.fromLongitude === '' || formData.toLatitude === '' || formData.toLongitude === '' ||
          formData.fromLatitude === null || formData.fromLongitude === null || formData.toLatitude === null || formData.toLongitude === null) {
        console.error('Validation Error: Location coordinates required');
        showToast('Location coordinates are required. Please tap on "From Place" and "To Place" to select locations on the map.', 'error');
        return;
      }

      // Validate that coordinates are valid numbers
      if (isNaN(parseFloat(formData.fromLatitude)) || isNaN(parseFloat(formData.fromLongitude)) || 
          isNaN(parseFloat(formData.toLatitude)) || isNaN(parseFloat(formData.toLongitude))) {
        console.error('Validation Error: Invalid coordinate values');
        showToast('Invalid location coordinates. Please reselect locations.', 'error');
        return;
      }

      setLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');

      // Prepare update data
      const updateData = {
        tripName: formData.tripName.trim(),
        travelMode: formData.travelMode.trim(),
        visible: formData.visible.trim(),
        fromLatitude: formData.fromLatitude ? parseFloat(formData.fromLatitude) : undefined,
        fromLongitude: formData.fromLongitude ? parseFloat(formData.fromLongitude) : undefined,
        toLatitude: formData.toLatitude ? parseFloat(formData.toLatitude) : undefined,
        toLongitude: formData.toLongitude ? parseFloat(formData.toLongitude) : undefined,
        numberOfDays: formData.numberOfDays ? parseInt(formData.numberOfDays) : undefined,
      };

      // Only include non-empty string values
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'string' && updateData[key].trim() === '') {
          delete updateData[key];
        }
      });

      // Remove undefined values to avoid sending them to backend
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null || updateData[key] === '') {
          delete updateData[key];
        }
      });
      // Only add fromDate and toDate if valid
      if (formData.fromDate) {
        const fromDate = new Date(formData.fromDate);
        if (!isNaN(fromDate.getTime())) {
          // Set the time from fromTime
          const [hours, minutes] = formData.fromTime.split(':');
          fromDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          updateData.fromDate = fromDate.toISOString();
        }
      }
      
      if (formData.toDate) {
        const toDate = new Date(formData.toDate);
        if (!isNaN(toDate.getTime())) {
          // Set the time from toTime
          const [hours, minutes] = formData.toTime.split(':');
          toDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          updateData.toDate = toDate.toISOString();
        }
      }

      // Check bannerImage type
      const bannerImage = formData.bannerImage;
      let useFormData = false;
      if (bannerImage && bannerImage.trim() !== '') {
        if (/^https?:\/\//.test(bannerImage)) {
          // Remote URL, send as string
          updateData.bannerImage = bannerImage;
        } else if (bannerImage.startsWith('file://')) {
          useFormData = true;
        } else {
          // If it's not empty but not a URL or file, don't send it
          console.warn('Invalid banner image format:', bannerImage);
        }
      }

      console.log('Sending update data:', updateData);
      console.log('Using FormData:', useFormData);

      // Ensure we have at least one field to update
      if (Object.keys(updateData).length === 0) {
        console.error('No data to update');
        showToast('No changes detected. Please modify at least one field.', 'error');
        return;
      }

      let response, responseData;
      if (useFormData) {
        // Use FormData for local file
        const formDataToSend = new FormData();
        // Append all updateData fields
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formDataToSend.append(key, String(value));
          }
        });
        // Append bannerImage as file
        formDataToSend.append('bannerImage', {
          uri: bannerImage,
          type: 'image/jpeg',
          name: 'banner.jpg',
        });
        response = await fetch(`${base_url}/schedule/edit/${scheduleId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            // 'Content-Type' will be set automatically by fetch for FormData
          },
          body: formDataToSend,
        });
        responseData = await response.json();
      } else {
        // Use JSON as before
        response = await fetch(`${base_url}/schedule/edit/${scheduleId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        responseData = await response.json();
      }

      console.log('Update response:', responseData);
      console.log('Response status:', response.status);

      if (!response.ok) {
        if (responseData.errors) {
          console.error('Server validation errors:', responseData.errors);
          const errorMessages = Object.values(responseData.errors).flat();
          showToast(errorMessages.join('\n'), 'error');
          return;
        }
        console.error('Update failed:', responseData.message);
        console.error('Response data:', responseData);
        throw new Error(responseData.message || `Failed to update schedule (Status: ${response.status})`);
      }

      console.log('Schedule updated successfully');
      showToast('Schedule updated successfully', 'success');
      
      // Call the listing API to refresh data
      await refreshScheduleListing();
      
      // Notify parent component that schedule was updated
      if (onScheduleUpdated && typeof onScheduleUpdated === 'function') {
        onScheduleUpdated();
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Update error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showToast(error.message || 'Failed to update schedule. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add new day schedule
  const addDaySchedule = () => {
    setDaySchedules([...daySchedules, { 
      day: daySchedules.length + 1, 
      activities: '', 
      time: '',
      location: '',
      description: '',
      planDescription: [],
      latitude: '',
      longitude: ''
    }]);
  };

  // Remove day schedule
  const removeDaySchedule = (index) => {
    if (daySchedules.length > 1) {
      const newDaySchedules = daySchedules.filter((_, i) => i !== index);
      const updatedDaySchedules = newDaySchedules.map((schedule, i) => ({
        ...schedule,
        day: i + 1
      }));
      setDaySchedules(updatedDaySchedules);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Date and time picker handlers
  const onFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      try {
        const date = new Date(selectedDate);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        const time = new Date(`2000-01-01T${formData.fromTime}`);
        date.setHours(time.getHours(), time.getMinutes());
        
        setFormData(prev => {
          const updated = {
            ...prev,
            fromDate: date.toISOString()
          };

          // Recalculate end date if numberOfDays is set
          if (prev.numberOfDays) {
            const days = parseInt(prev.numberOfDays);
            if (!isNaN(days) && days > 0) {
              const endDate = calculateEndDate(date.toISOString(), days);
              if (endDate) {
                updated.toDate = endDate;
                updated.toTime = '17:00';
              }
            }
          } else {
            // If no numberOfDays set, default to 1 day
            const endDate = calculateEndDate(date.toISOString(), 1);
            if (endDate) {
              updated.toDate = endDate;
              updated.toTime = '17:00';
            }
          }

          return updated;
        });
      } catch (error) {
        console.error('Error setting from date:', error);
        showToast('Invalid date selected', 'error');
      }
    }
  };

  const onToDateChange = (event, selectedDate) => {
    setShowToDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      try {
        const date = new Date(selectedDate);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        const time = new Date(`2000-01-01T${formData.toTime}`);
        date.setHours(time.getHours(), time.getMinutes());
        
        setFormData(prev => {
          const updated = {
            ...prev,
            toDate: date.toISOString()
          };

          // Calculate and update numberOfDays based on the selected end date
          if (prev.fromDate) {
            const daysDiff = calculateNumberOfDays(prev.fromDate, date.toISOString());
            if (daysDiff) {
              updated.numberOfDays = daysDiff.toString();
            }
          }

          return updated;
        });
      } catch (error) {
        console.error('Error setting to date:', error);
        showToast('Invalid date selected', 'error');
      }
    }
  };

  const onFromTimeChange = (event, selectedTime) => {
    setShowFromTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      try {
        const time = selectedTime.toTimeString().slice(0, 5);
        setFormData(prev => ({
          ...prev,
          fromTime: time
        }));
      } catch (error) {
        console.error('Error setting from time:', error);
        showToast('Invalid time selected', 'error');
      }
    }
  };

  const onToTimeChange = (event, selectedTime) => {
    setShowToTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      try {
        const time = selectedTime.toTimeString().slice(0, 5);
        setFormData(prev => ({
          ...prev,
          toTime: time
        }));
      } catch (error) {
        console.error('Error setting to time:', error);
        showToast('Invalid time selected', 'error');
      }
    }
  };

  // Update the day schedule section in the render to include description editing
  const renderDaySchedule = (daySchedule, index) => (
    <View key={index} style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{`Day ${daySchedule.day}`}</Text>
        {daySchedules.length > 1 && (
          <TouchableOpacity
            style={styles.removeDayButton}
            onPress={() => removeDaySchedule(index)}
          >
            <Ionicons name="close-circle" size={24} color="#e53935" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          value={daySchedule.description}
          onChangeText={(text) => {
            const updatedSchedules = [...daySchedules];
            updatedSchedules[index] = {
              ...updatedSchedules[index],
              description: text
            };
            setDaySchedules(updatedSchedules);
          }}
          placeholder="Enter day description"
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        onPress={() => openMapForLocation('day', index)}
        style={styles.mapButton}
      >
        <Ionicons name="location-sharp" size={24} color="white" />
        <Text style={styles.mapButtonText}>
          {daySchedule.location || 'Select Location'}
        </Text>
      </TouchableOpacity>

      {daySchedule.latitude && daySchedule.longitude && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: parseFloat(daySchedule.latitude),
              longitude: parseFloat(daySchedule.longitude),
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(daySchedule.latitude),
                longitude: parseFloat(daySchedule.longitude),
              }}
            />
          </MapView>
        </View>
      )}

      <View style={styles.timeContainer}>
        <TouchableOpacity 
          style={styles.timeButton}
          onPress={() => openTimePicker(index, 'start')}
        >
          <Text style={styles.timeText}>
            Start: {daySchedule.startTime || "09:00"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.timeButton}
          onPress={() => openTimePicker(index, 'end')}
        >
          <Text style={styles.timeText}>
            End: {daySchedule.endTime || "17:00"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Display plan description locations */}
      {daySchedule.planDescription && daySchedule.planDescription.length > 0 && (
        <View style={styles.locationList}>
          {daySchedule.planDescription.map((location, locIndex) => (
            <View key={locIndex} style={styles.locationItem}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress}>{location.address}</Text>
              <Text style={styles.locationDistance}>{location.distanceInKilometer}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Schedule</Text>
      </View>

      <ScrollView style={styles.content}>
        {renderBannerSection()}
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>BASIC DETAILS</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Trip Name</Text>
            <TextInput
              style={styles.input}
              value={formData.tripName}
              onChangeText={(text) => handleInputChange('tripName', text)}
              placeholder="Enter trip name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Enter trip description"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Number of Days</Text>
              <TextInput
                style={styles.input}
                value={formData.numberOfDays}
                onChangeText={(text) => handleInputChange('numberOfDays', text)}
                placeholder="Enter days"
                keyboardType="numeric"
              />
            </View>

            {/* <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Max Riders</Text>
              <TextInput
                style={styles.input}
                value={formData.maxRiders}
                onChangeText={(text) => handleInputChange('maxRiders', text)}
                placeholder="Enter max riders"
                keyboardType="numeric"
              />
            </View> */}
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Travel Mode</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.travelMode}
                  onValueChange={(value) => handleInputChange('travelMode', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select mode" value="" />
                  <Picker.Item label="Car" value="Car" />
                  <Picker.Item label="Bike" value="Bike" />
                  <Picker.Item label="Cycle" value="Cycle" />
                </Picker>
              </View>
            </View>

            {/* <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Budget</Text>
              <TextInput
                style={styles.input}
                value={formData.budget}
                onChangeText={(text) => handleInputChange('budget', text)}
                placeholder="Enter budget"
                keyboardType="numeric"
              />
            </View> */}
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.visible}
                  onValueChange={(value) => handleInputChange('visible', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Public" value="Public" />
                  <Picker.Item label="Private" value="Private" />
                  <Picker.Item label="Friends Only" value="FriendOnly" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>LOCATION</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>From Place</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => openMapForLocation('from')}
            >
              <Text style={styles.locationText}>
                {formData.fromPlace && formData.fromPlace !== '' 
                  ? formData.fromPlace 
                  : (formData.fromLatitude && formData.fromLongitude 
                      ? `${parseFloat(formData.fromLatitude).toFixed(5)}, ${parseFloat(formData.fromLongitude).toFixed(5)}`
                      : 'Select starting location')}
              </Text>
            </TouchableOpacity>
            {formData.fromLatitude && formData.fromLongitude && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: parseFloat(formData.fromLatitude),
                    longitude: parseFloat(formData.fromLongitude),
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: parseFloat(formData.fromLatitude),
                      longitude: parseFloat(formData.fromLongitude),
                    }}
                  />
                </MapView>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>To Place</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => openMapForLocation('to')}
            >
              <Text style={styles.locationText}>
                {formData.toPlace && formData.toPlace !== '' 
                  ? formData.toPlace 
                  : (formData.toLatitude && formData.toLongitude 
                      ? `${parseFloat(formData.toLatitude).toFixed(5)}, ${parseFloat(formData.toLongitude).toFixed(5)}`
                      : 'Select destination')}
              </Text>
            </TouchableOpacity>
            {formData.toLatitude && formData.toLongitude && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: parseFloat(formData.toLatitude),
                    longitude: parseFloat(formData.toLongitude),
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: parseFloat(formData.toLatitude),
                      longitude: parseFloat(formData.toLongitude),
                    }}
                  />
                </MapView>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>DATES</Text>
          
          {/* Default Date Button */}
          <TouchableOpacity 
            style={styles.defaultDateButton}
            onPress={() => {
              console.log('Set Default Dates button clicked');
              
              // Create today's date at 9:00 AM
              const today = new Date();
              today.setHours(9, 0, 0, 0);
              
              // Get current number of days or default to 1
              const currentDays = parseInt(formData.numberOfDays) || 1;
              
              // Calculate end date manually to ensure it works
              const endDate = new Date(today);
              endDate.setDate(endDate.getDate() + currentDays - 1);
              endDate.setHours(17, 0, 0, 0); // Set to 5:00 PM
              
              console.log('Setting default dates:', {
                today: today.toISOString(),
                endDate: endDate.toISOString(),
                days: currentDays
              });
              
              setFormData(prev => ({
                ...prev,
                fromDate: today.toISOString(),
                fromTime: '09:00',
                toDate: endDate.toISOString(),
                toTime: '17:00',
                numberOfDays: currentDays.toString()
              }));
              
              showToast(`Default dates set (Today + ${currentDays} days)`, 'success');
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.defaultDateButtonText}>Set Default Dates</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Start Date & Time</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowFromDatePicker(true)}
              >
                <Text style={[styles.dateText, !formData.fromDate && styles.datePlaceholder]}>
                  {formData.fromDate ? formatDate(formData.fromDate) : 'Select date'}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
              {showFromDatePicker && (
                <DateTimePicker
                  value={formData.fromDate ? new Date(formData.fromDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onFromDateChange}
                  minimumDate={new Date()}
                />
              )}
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => setShowFromTimePicker(true)}
              >
                <Text style={styles.timeText}>
                  {formData.fromTime || 'Select time'}
                </Text>
                <Ionicons name="time" size={20} color={colors.primary} />
              </TouchableOpacity>
              {showFromTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${formData.fromTime}`)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onFromTimeChange}
                />
              )}
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>End Date & Time</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowToDatePicker(true)}
              >
                <Text style={[styles.dateText, !formData.toDate && styles.datePlaceholder]}>
                  {formData.toDate ? formatDate(formData.toDate) : 'Select date'}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
              {showToDatePicker && (
                <DateTimePicker
                  value={formData.toDate ? new Date(formData.toDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onToDateChange}
                  minimumDate={formData.fromDate ? new Date(formData.fromDate) : new Date()}
                />
              )}
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => setShowToTimePicker(true)}
              >
                <Text style={styles.timeText}>
                  {formData.toTime || 'Select time'}
                </Text>
                <Ionicons name="time" size={20} color={colors.primary} />
              </TouchableOpacity>
              {showToTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${formData.toTime}`)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onToTimeChange}
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>PLAN DESCRIPTION</Text>
          {daySchedules.map((daySchedule, index) => renderDaySchedule(daySchedule, index))}

          <TouchableOpacity style={styles.addDayButton} onPress={addDaySchedule}>
            <Ionicons name="add-circle" size={24} color="#ff3873" />
            <Text style={styles.addDayButtonText}>Add Another Day</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.updateButtonText}>Update Schedule</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditSchedule; 