import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { StatusBar } from 'react-native';
import styles from "../../utils/styles";
import { BackHeader, BottomTab } from '../../components';
import { SafeAreaView } from "react-native-safe-area-context";
import Schedule from './Schedule/AllSchedule';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';


//const baseUrl = 'https://admin.zypsii.com'; // Update the base URL if necessary

// Card-based Skeleton loader component with animation
const ScheduleSkeleton = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0F0F0', '#E0E0E0'],
  });

  return (
    <Animated.View style={{ 
      opacity,
      padding: 15, 
      backgroundColor: '#fff', 
      marginHorizontal: 15,
      marginBottom: 15, 
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    }}>
      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
        <Animated.View style={{ 
          height: 80, 
          width: 80, 
          backgroundColor: '#E8E8E8', 
          borderRadius: 8,
          marginRight: 10,
          opacity,
        }} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Animated.View style={{ 
            height: 18, 
            backgroundColor: '#F5F5F5', 
            width: '80%', 
            borderRadius: 4, 
            marginBottom: 8,
            opacity,
          }} />
          <Animated.View style={{ 
            height: 16, 
            backgroundColor: '#F0F0F0', 
            width: '60%', 
            borderRadius: 4,
            opacity,
          }} />
        </View>
      </View>
      <Animated.View style={{ 
        height: 1, 
        backgroundColor: ' #f4f4f4 ', 
        marginBottom: 15,
        opacity,
      }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Animated.View style={{ 
          height: 16, 
          backgroundColor: '#F5F5F5', 
          width: '35%', 
          borderRadius: 4,
          opacity,
        }} />
        <Animated.View style={{ 
          height: 16, 
          backgroundColor: '#F0F0F0', 
          width: '35%', 
          borderRadius: 4,
          opacity,
        }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Animated.View style={{ 
          height: 16, 
          backgroundColor: '#F5F5F5', 
          width: '45%', 
          borderRadius: 4,
          opacity,
        }} />
        <Animated.View style={{ 
          height: 16, 
          backgroundColor: '#F0F0F0', 
          width: '30%', 
          borderRadius: 4,
          opacity,
        }} />
      </View>
    </Animated.View>
  );
};

function MySchedule({ navigation }) {
  // Set Zypsii primary color for status bar
  // (If using Expo or react-native-safe-area-context, this works for Android; for iOS, barStyle can be set as needed)
  // You can move this into the return if you want it to be dynamic
  const { Zypsii_color } = require('../../utils/colors').colors;
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(null);
  const [all_schedule, setAll_schedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [limit, setLimit] = useState(10);
  const [loadedIds, setLoadedIds] = useState(new Set());

  // Fetch schedule data with pagination
  const fetch_all_schedule = async (pageNum = 1, isLoadMore = false, currentLimit = limit) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    const accessToken = await AsyncStorage.getItem('accessToken');
    try {
      const response = await fetch(`${base_url}/schedule/listing/filter?page=${pageNum}&limit=${currentLimit}`, {
        method: 'get',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }); 
      const data = await response.json();
      if (data.success && data.data) {
        const formattedData = data.data
          .filter(item => !loadedIds.has(item._id)) // Filter out already loaded items
          .map((item) => {
            const fromDate = new Date(item.Dates.from);
            const endDate = new Date(item.Dates.end);
            const createdAt = new Date(item.createdAt);
            
            // Add ID to loadedIds set
            setLoadedIds(prev => new Set([...prev, item._id]));
            
            return {
              id: item._id,
              _id: item._id,
              title: item.tripName,
              from: item.locationDetails?.[0]?.address || 'Unknown location',
              to: item.locationDetails?.[1]?.address || 'Unknown location',
              date: fromDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              travelMode: item.travelMode,
              visible: item.visible,
              numberOfDays: item.numberOfDays.toString(),
              imageUrl: item.bannerImage,
              locationDetails: item.locationDetails,
              createdAt: createdAt.toISOString().split('T')[0],
              createdBy: item.createdBy,
              joined: item.joined || false,
              riders: '0 riders',
              rawLocation: {
                from: {
                  latitude: item.location?.from?.latitude || 0,
                  longitude: item.location?.from?.longitude || 0
                },
                to: {
                  latitude: item.location?.to?.latitude || 0,
                  longitude: item.location?.to?.longitude || 0
                }
              }
            };
          });

        if (isLoadMore) {
          setAll_schedule(prev => [...prev, ...formattedData]);
        } else {
          setAll_schedule(formattedData);
        }

        setHasMore(formattedData.length === currentLimit);
      } else {
        // If no data, clear the schedule
        setAll_schedule([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setAll_schedule([]); // Optionally clear on error
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Function to update limit and refresh data
  const updateLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    setAll_schedule([]);
    fetch_all_schedule(1, false, newLimit);
  };

  // Initial data load
  useEffect(() => {
    fetch_all_schedule(1, false, limit);
  }, []);

  // Reset and reload data when date changes
  useEffect(() => {
    if (selectedDate) {
      setLoadedIds(new Set());
      setAll_schedule([]);
      setPage(1);
      fetch_all_schedule(1, false, limit);
    }
  }, [selectedDate]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      const newLimit = limit * 2;
      setPage(nextPage);
      setLimit(newLimit);
      fetch_all_schedule(nextPage, true, newLimit);
    }
  };

  // Helper function to generate dates for the current month
  const getDatesForMonth = (year, month) => {
    const dates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      dates.push({
        day: day,
        week: date.toLocaleString("en-US", { weekday: "short" })?.charAt(0) || 'D',
        fullDate: date,
        dateString: date.toISOString().split('T')[0]
      });
    }
    return dates;
  };

  const year = today.getFullYear();
  const month = today.getMonth();
  const dates = getDatesForMonth(year, month);

  // Filter schedules for the selected date
  const filteredSchedules = selectedDate ? all_schedule.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const scheduleDateString = scheduleDate.toISOString().split('T')[0];
    return scheduleDateString === selectedDateString;
  }) : all_schedule;

  // Handle navigation between months
  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setSelectedDate(newDate);
  };

  const formatMonthYear = (date) => {
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  // Back button pressed
  const backPressed = () => {
    navigation.goBack();
  };

  // Render skeleton loaders with proper count
  const renderSkeletonLoaders = (count = 3) => {
    return Array(count).fill(0).map((_, index) => (
      <ScheduleSkeleton key={`skeleton-${index}`} />
    ));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar backgroundColor={Zypsii_color} barStyle="light-content" />
      <View style={styles.protractorShape} />
      <View style={styles.backgroundCurvedContainer} />
      <BackHeader backPressed={backPressed} title="Schedule" />

      <View style={[styles.datecontainer, { flex: 1, width: '100%' }]}>
        <View style={[styles.dateScheduleContainer, { width: '100%' }]}>
          <View style={styles.monthNavigation}>
            <Text style={styles.monthText}>{formatMonthYear(today)}</Text>
            <TouchableOpacity onPress={handlePrevMonth}>
              <Text style={styles.navButton}>{"<"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextMonth}>
              <Text style={styles.navButton}>{">"}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={dates}
            horizontal
            keyExtractor={(item, index) => `${item.dateString}-${index}`}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedDate(item.fullDate)}
                style={[
                  styles.dayContainer,
                  selectedDate && item.dateString === selectedDate.toISOString().split('T')[0] &&
                  styles.selectedDayContainer,
                ]}
              >
                <Text
                  style={[
                    styles.weekText,
                    selectedDate && item.dateString === selectedDate.toISOString().split('T')[0] &&
                    styles.selectedWeekText,
                  ]}
                >
                  {item.week}
                </Text>
                <Text
                  style={[
                    styles.dayText,
                    selectedDate && item.dateString === selectedDate.toISOString().split('T')[0] &&
                    styles.selectedDayText,
                  ]}
                >
                  {item.day}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        <View style={{ flex: 1, width: '100%' }}>
          {isLoading ? (
            <View style={{ flex: 1, width: '100%', paddingTop: 10 }}>
              {renderSkeletonLoaders(5)}
            </View>
          ) : (
            <FlatList
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ 
                paddingBottom: 100,
                paddingHorizontal: 0,
                width: '100%'
              }}
              vertical
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              data={filteredSchedules}
              renderItem={({ item }) => <Schedule item={item} />}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 }}>
                  <Text style={{ color: '#666', fontSize: 16 }}>
                    {selectedDate ? 'No schedules for this date' : 'No schedules available'}
                  </Text>
                </View>
              }
              ListFooterComponent={() => (
                isLoadingMore ? (
                  <View style={{ paddingVertical: 20 }}>
                    {renderSkeletonLoaders(2)}
                  </View>
                ) : null
              )}
            />
          )}
        </View>
      </View>
     
      <BottomTab screen="WhereToGo" />

    </SafeAreaView>
  );
}

export default MySchedule;
