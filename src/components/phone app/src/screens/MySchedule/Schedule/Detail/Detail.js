import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSchedule } from '../../../../context/ScheduleContext';
import { format } from 'date-fns';
import { useToast } from '../../../../context/ToastContext';

function Detail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { scheduleId } = route.params;
  const { getScheduleById } = useSchedule();
  const { showToast } = useToast();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await getScheduleById(scheduleId);
        setSchedule(data);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        showToast('Failed to load schedule details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId]);

  const handleMapPress = () => {
    if (schedule) {
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
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!schedule) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Schedule not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={handleMapPress}
          >
            <MaterialCommunityIcons name="map-marker-path" size={24} color={colors.btncolor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Image
          source={{ uri: schedule.bannerImage }}
          style={styles.bannerImage}
        />
        
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{schedule.tripName}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.fontSecondColor} />
              <Text style={styles.infoText}>
                {format(new Date(schedule.Dates.from), 'MMM dd, yyyy')} - {format(new Date(schedule.Dates.end), 'MMM dd, yyyy')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={colors.fontSecondColor} />
              <Text style={styles.infoText}>{schedule.numberOfDays} Days</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locations</Text>
            {schedule.locationDetails.map((location, index) => (
              <View key={index} style={styles.locationItem}>
                <View style={styles.locationHeader}>
                  <MaterialCommunityIcons name="map-marker" size={20} color={colors.btncolor} />
                  <Text style={styles.locationText}>{location.address}</Text>
                </View>
                {location.attractions && location.attractions.length > 0 && (
                  <View style={styles.attractionsContainer}>
                    {location.attractions.map((attraction, idx) => (
                      <View key={idx} style={styles.attractionItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.attractionText}>{attraction}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.Zypsii_color,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
    backgroundColor: colors.white,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  mapButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  bannerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  infoText: {
    marginLeft: 8,
    color: colors.fontSecondColor,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 12,
  },
  locationItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    color: colors.fontMainColor,
    fontWeight: '500',
    marginLeft: 8,
  },
  attractionsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  attractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.btncolor,
    marginRight: 8,
  },
  attractionText: {
    fontSize: 14,
    color: colors.fontSecondColor,
    flex: 1,
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

export default Detail; 