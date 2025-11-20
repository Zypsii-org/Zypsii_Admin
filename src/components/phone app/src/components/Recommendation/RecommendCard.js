import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions, Animated, Easing, ActivityIndicator } from 'react-native';
import { colors } from "../../utils";
import { Ionicons } from '@expo/vector-icons';
import navigationService from '../../routes/navigationService';
import { base_url } from "../../utils/base_url";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.80; // 85% of screen width
const CARD_SPACING = width * 0.075; // 7.5% spacing on each side


const DirectionIndicator = ({ duration, distance }) => {
    const animation = useRef(new Animated.Value(0)).current;
    const pulseAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animation, {
                    toValue: 1,
                    duration: 8000,
                    useNativeDriver: true,
                    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                }),
                Animated.timing(animation, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnimation, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnimation, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateX = animation.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, CARD_WIDTH - 60, CARD_WIDTH - 60, 0, 0],
    });

    const translateY = animation.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, 30, 60, 30, 0],
    });

    const rotate = animation.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '45deg', '90deg', '135deg', '180deg'],
    });

    const scale = pulseAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });

    return (
        <View style={styles.directionContainer}>
            <View style={styles.roadContainer}>
                <View style={styles.roadInner}>
                    <View style={styles.roadLine} />
                    <View style={styles.roadLine} />
                    <View style={styles.roadLine} />
                    <View style={styles.roadLine} />
                    <View style={styles.roadLine} />
                </View>
                <View style={styles.roadEdgeLeft} />
                <View style={styles.roadEdgeRight} />
                <View style={styles.distanceInfo}>
                    <Text style={styles.distanceText}>{distance}</Text>
                    {/* <Text style={styles.durationText}>{duration}</Text> */}
                </View>
            </View>
            <Animated.View 
                style={[
                    styles.bikeContainer, 
                    { 
                        transform: [
                            { translateX },
                            { translateY },
                            { rotate },
                            { scale }
                        ]
                    }
                ]}
            >
                <Ionicons name="bicycle" size={32} color={colors.Zypsii_color} style={styles.bikeIcon} />
                <View style={styles.bikeShadow} />
            </Animated.View>
        </View>
    );
};

// Nearby Places Card Component
const RecommendedScheduleCard = ({ onSchedulePress, title, suggestions, navigation }) => {
    const scrollViewRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const currentIndex = useRef(0);
    const autoScrollTimer = useRef(null);

    useEffect(() => {
        if (suggestions && suggestions.length > 0 && suggestions[0].places.length > 1) {
            startAutoScroll();
        }
        return () => stopAutoScroll();
    }, [suggestions]);

    const startAutoScroll = () => {
        if (scrollViewRef.current && suggestions && suggestions[0].places.length > 1) {
            autoScrollTimer.current = setInterval(() => {
                currentIndex.current = (currentIndex.current + 1) % suggestions[0].places.length;
                scrollViewRef.current.scrollTo({
                    x: currentIndex.current * (CARD_WIDTH + CARD_SPACING),
                    animated: true,
                });
            }, 3000);
        }
    };

    const stopAutoScroll = () => {
        if (autoScrollTimer.current) {
            clearInterval(autoScrollTimer.current);
        }
    };

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING));
        if (newIndex !== currentIndex.current) {
            currentIndex.current = newIndex;
            stopAutoScroll();
            startAutoScroll();
        }
    };

    const handleViewDetails = (place) => {
        // Get the placeId for navigation - prioritize placeId, then id, then _id
        const placeId = place.placeId || place.id || place._id;
        
        if (navigation) {
            navigation.navigate('Destination', { 
                placeId: placeId
            });
        } else {
            navigationService.navigate('Destination', { 
                placeId: placeId
            });
        }
    };

    const handleViewAll = (suggestion) => {
        if (navigation) {
            navigation.navigate('PlaceDetails', {
                places: suggestion.places,
                isAllPlaces: true
            });
        } else {
            navigationService.navigate('PlaceDetails', {
                places: suggestion.places,
                isAllPlaces: true
            });
        }
    };
  
    const getVehicleIcon = (vehicle) => {
        switch (vehicle) {
          case 'bike':
            return <Text>🚲</Text>;
          case 'car':
            return <Text>🚗</Text>;
          case 'jeep':
            return <Text>🚙</Text>;
          default:
            return <Text>🚗</Text>;
        }
      };
  
    const renderActivities = (activities) => {
        return (
            <View style={styles.activitiesContainer}>
                {activities.slice(0, 2).map((activity, activityIndex) => (
                    <View key={activityIndex} style={styles.activityTag}>
                        <Text style={styles.activityText}>{activity}</Text>
                    </View>
                ))}
                {activities.length > 2 && (
                    <View style={styles.moreActivities}>
                        <Text style={styles.moreActivitiesText}>+{activities.length - 2} more</Text>
                    </View>
                )}
            </View>
        );
    };
  
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };
  
    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    // Render header with title and View All if title is provided
    const renderHeader = () => {
        if (!title) return null;
        return (
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {suggestions && suggestions[0]?.places?.length > 1 && (
                    <TouchableOpacity 
                        style={styles.viewAllButton}
                        onPress={() => handleViewAll(suggestions[0])}
                    >
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderHeader()}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false, listener: handleScroll }
                )}
                scrollEventThrottle={16}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                snapToAlignment="start"
            >
                {suggestions[0].places.map((place, index) => (
                    <TouchableOpacity
                        key={`${place.id}-${index}`}
                        style={styles.placeCard}
                        onPress={() => handleViewDetails(place)}
                    >
                        <View style={styles.dayHeader}>
                            <View style={styles.dayMarker}>
                                <Text style={styles.dayText}>Day {index + 1}</Text>
                                <Text style={styles.dateText}>{formatDate(place.date)}</Text>
                            </View>
                        </View>
                        <View style={styles.placeInfo}>
                            <View style={styles.placeHeader}>
                            <View style={{ width: 60, height: 60, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden', marginRight: 12 }}>
                                <Image
                                    source={place.image ? { uri: place.image } : require('../../assets/images/productPlaceholder.jpg')}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                    onError={(e) => {  }}
                                />
                            </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.placeName}>{place.name}</Text>
                                    <Text style={styles.placeTime}>{place.time}</Text>
                                </View>
                            </View>
                            <Text style={styles.placeDescription} numberOfLines={2}>
                                {place.description}
                            </Text>
                            <View style={styles.detailsContainer}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="star" size={16} color="#FFD700" />
                                    <Text style={styles.ratingText}>{place.rating}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="location-outline" size={16} color="#666" />
                                    <Text style={styles.ratingText}>{place.distance}</Text>
                                </View>
                            </View>
                            {/* {renderActivities(place.activities)} */}
                            {/* <View style={styles.vehicleContainer}>
                                {getVehicleIcon(place.vehicle)}
                                <Text style={styles.vehicleText}>
                                    {place.vehicle.charAt(0).toUpperCase() + place.vehicle.slice(1)}
                                </Text>
                            </View> */}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.paginationContainer}>
                {suggestions[0].places.map((_, index) => {
                    const inputRange = [
                        (index - 1) * (CARD_WIDTH + CARD_SPACING),
                        index * (CARD_WIDTH + CARD_SPACING),
                        (index + 1) * (CARD_WIDTH + CARD_SPACING),
                    ];

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    const scale = scrollX.interpolate({
                        inputRange,
                        outputRange: [1, 1.2, 1],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.paginationDot,
                                { opacity, transform: [{ scale }] }
                            ]}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 5,
        paddingBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    viewAllButton: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: colors.Zypsii_color + '10',
    },
    viewAllText: {
        color: colors.Zypsii_color,
        fontSize: 14,
        fontWeight: '500',
    },
    scrollView: {
        width: width,
    },
    scrollViewContent: {
        paddingHorizontal: CARD_SPACING,
    },
    placeCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        width: CARD_WIDTH,
        marginRight: CARD_SPACING,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dayHeader: {
        backgroundColor: colors.Zypsii_color,
        padding: 12,
    },
    dayMarker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dayText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    dateText: {
        fontSize: 14,
        color: '#fff',
    },
    placeInfo: {
        padding: 16,
    },
    placeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 12,
        backgroundColor: colors.Zypsii_color + '10',
        padding: 12,
        borderRadius: 12,
    },
    icon: {
        fontSize: 32,
    },
    textContainer: {
        flex: 1,
    },
    placeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    placeTime: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    placeDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    detailsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    distanceText: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    activitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
        gap: 8,
    },
    activityTag: {
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    activityText: {
        fontSize: 12,
        color: '#666',
    },
    vehicleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    vehicleIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    vehicleText: {
        fontSize: 14,
        color: '#666',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        height: 20,
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.Zypsii_color,
        marginHorizontal: 3,
        opacity: 0.3,
    },
    activeDot: {
        opacity: 1,
        transform: [{ scale: 1.2 }],
    },
    directionContainer: {
        height: 120,
        marginVertical: 8,
        position: 'relative',
        paddingHorizontal: 15,
    },
    roadContainer: {
        position: 'absolute',
        top: 20,
        left: 15,
        right: 15,
        height: 80,
        backgroundColor: '#E8E8E8',
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#D0D0D0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    roadInner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    roadLine: {
        width: 20,
        height: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
        transform: [{ rotate: '45deg' }],
    },
    roadEdgeLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 8,
        backgroundColor: '#D8D8D8',
        borderTopLeftRadius: 40,
        borderBottomLeftRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    roadEdgeRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 8,
        backgroundColor: '#D8D8D8',
        borderTopRightRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: -1, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    distanceInfo: {
        position: 'absolute',
        top: 0,
        right: 10,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    durationText: {
        fontSize: 10,
        color: colors.Zypsii_color,
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    bikeContainer: {
        position: 'absolute',
        top: 40,
        left: 15,
        zIndex: 2,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    bikeIcon: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        transform: [{ scale: 1.2 }],
    },
    bikeShadow: {
        width: 30,
        height: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 3,
        marginTop: 2,
        transform: [{ scaleX: 0.8 }],
    },
    roadDetails: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    roadMarker: {
        width: 6,
        height: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
});

export default RecommendedScheduleCard;