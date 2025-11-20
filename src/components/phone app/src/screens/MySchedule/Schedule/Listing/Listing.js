import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../utils';
import { useNavigation } from '@react-navigation/native';
import { useSchedule } from '../../../../context/ScheduleContext';
import { format } from 'date-fns';
import { useToast } from '../../../../context/ToastContext';

function Listing() {
  const navigation = useNavigation();
  const { schedules, loading, error } = useSchedule();
  const { showToast } = useToast();

  const handleMapPress = (schedule) => {
    navigation.navigate('TripMap', {
      tripDetails: {
        title: schedule.tripName,
        totalDays: `${schedule.numberOfDays} Days`,
        startPrice: schedule.startPrice || '₹0',
        days: schedule.locationDetails.map((location, index) => ({
          day: index + 1,
          location: location.address,
          distance: location.distance || '0 km',
          attractions: location.attractions || []
        }))
      }
    });
  };

  const renderScheduleItem = ({ item }) => (
    <TouchableOpacity
      style={styles.scheduleItem}
      onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: item._id })}
    >
      <Image
        source={{ uri: item.bannerImage }}
        style={styles.scheduleImage}
      />
      <View style={styles.scheduleInfo}>
        <Text style={styles.scheduleTitle}>{item.tripName}</Text>
        <View style={styles.scheduleMeta}>
          <Text style={styles.scheduleDate}>
            {format(new Date(item.Dates.from), 'MMM dd, yyyy')} - {format(new Date(item.Dates.end), 'MMM dd, yyyy')}
          </Text>
          <Text style={styles.scheduleDays}>{item.numberOfDays} Days</Text>
        </View>
        <View style={styles.scheduleActions}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => handleMapPress(item)}
          >
            <MaterialCommunityIcons name="map-marker-path" size={20} color={colors.btncolor} />
            <Text style={styles.mapButtonText}>View Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedules</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  listContainer: {
    padding: 16,
  },
  scheduleItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scheduleImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  scheduleInfo: {
    padding: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 8,
  },
  scheduleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scheduleDate: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  scheduleDays: {
    fontSize: 14,
    color: colors.btncolor,
    fontWeight: '500',
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapButtonText: {
    marginLeft: 4,
    color: colors.btncolor,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});

export default Listing; 