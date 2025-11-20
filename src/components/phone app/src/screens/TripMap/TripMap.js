import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  Image,
  LinearGradient,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../utils';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

function TripMap() {
  const navigation = useNavigation();
  const route = useRoute();
  const { tripDetails } = route.params;

  // Ensure each day and attraction has both id and placeId for robust navigation
  const daysWithPlaceIds = (tripDetails.days || []).map(day => ({
    ...day,
    id: day.id,
    placeId: day.placeId || day.id,
    attractions: (day.attractions || []).map(attraction =>
      typeof attraction === 'object'
        ? {
            ...attraction,
            id: attraction.id,
            placeId: attraction.placeId || attraction.id
          }
        : attraction // fallback for string attractions
    )
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tripDetails.title}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => Alert.alert('Info', 'Sharing functionality is currently unavailable')}
          >
            <Ionicons name="share-outline" size={24} color={colors.fontMainColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => Alert.alert('Info', 'Download functionality is currently unavailable')}
          >
            <Ionicons name="download-outline" size={24} color={colors.fontMainColor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.mapContainer}>
          <View style={styles.titleContainer}>
            <View style={styles.titleBackground}>
              <Text style={styles.mainTitle}>{tripDetails.title}</Text>
              <View style={styles.divider} />
              <Text style={styles.subtitle}>{tripDetails.totalDays}</Text>
              <Text style={styles.priceText}>Starts @ {tripDetails.startPrice}</Text>
             
            </View>
          </View>

          <View style={styles.routeContainer}>
            {daysWithPlaceIds.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                <View style={styles.locationPin}>
                  <View style={styles.pinOuter}>
                    <View style={styles.pinInner} />
                  </View>
                </View>

                <View style={styles.dayContent}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayText}>Day {day.day}</Text>
                    </View>
                    <View style={styles.distanceContainer}>
                      <MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.fontSecondColor} />
                      <Text style={styles.distanceText}>{day.distance}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.locationContainer}>
                    <View style={styles.locationHeader}>
                      <MaterialCommunityIcons name="map-marker" size={20} color={colors.btncolor} />
                      <Text style={styles.locationText}>{day.location}</Text>
                    </View>
                    {day.attractions.length > 0 && (
                      <View style={styles.attractionsContainer}>
                        {day.attractions.map((attraction, idx) => (
                          <View key={idx} style={styles.attractionItem}>
                            <View style={styles.bulletPoint} />
                            {/* If attraction is an object, prepare for navigation */}
                            {typeof attraction === 'object' ? (
                              <TouchableOpacity
                                onPress={() => navigation.navigate('Destination', { placeId: attraction.placeId || attraction.id })}
                              >
                                <Text style={styles.attractionText}>{attraction.name || attraction.title || 'Attraction'}</Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={styles.attractionText}>{attraction}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {index < daysWithPlaceIds.length - 1 && (
                  <View style={styles.routeLineContainer}>
                    <View style={styles.routeLine}>
                      {[...Array(5)].map((_, i) => (
                        <View key={i} style={styles.routeDot} />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <View style={styles.contactContainer}>
              <MaterialCommunityIcons name="phone" size={20} color={colors.btncolor} />
              <Text style={styles.contactText}>Contact: 955 327 2777, 808 875 8157</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mapContainer: {
    padding: 16,
  },
  titleContainer: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titleBackground: {
    backgroundColor: '#FFF5F5',
    padding: 20,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.btncolor,
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: colors.btncolor,
    marginVertical: 12,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    color: colors.fontMainColor,
    marginBottom: 8,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 24,
    color: colors.btncolor,
    fontWeight: '700',
    marginBottom: 12,
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  websiteText: {
    fontSize: 14,
    color: colors.fontSecondColor,
    marginLeft: 8,
  },
  routeContainer: {
    paddingHorizontal: 8,
  },
  dayContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    position: 'relative',
  },
  locationPin: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  pinOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  dayContent: {
    flex: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayBadge: {
    backgroundColor: colors.btncolor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dayText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  distanceText: {
    color: colors.fontSecondColor,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  locationContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginLeft: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  routeLineContainer: {
    position: 'absolute',
    left: 19,
    top: 32,
    bottom: -24,
    width: 2,
    alignItems: 'center',
  },
  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.btncolor,
    opacity: 0.3,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  routeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.btncolor,
    marginVertical: 2,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  contactText: {
    fontSize: 14,
    color: colors.fontSecondColor,
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default TripMap; 