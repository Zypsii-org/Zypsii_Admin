import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';
import CustomLoader from '../../components/Loader/CustomLoader';
import { useToast } from '../../context/ToastContext';
import RecommendCard from '../../components/Recommendation/RecommendCard';

const { width } = Dimensions.get('window');

const PlaceDetailsScreen = ({ route, navigation }) => {
    const { place, isAllPlaces, places } = route.params;
    // Ensure each place has both id and placeId for robust navigation
    const normalizedPlace = place ? { ...place, id: place.id || place._id, placeId: place.placeId || place.id || place._id } : null;
    const normalizedPlaces = Array.isArray(places)
      ? places.map(p => ({ ...p, id: p.id || p._id, placeId: p.placeId || p.id || p._id }))
      : [];
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const getVehicleIcon = (vehicle) => {
        let icon = '🚗';
        switch(vehicle) {
            case 'bike':
                icon = '🚲';
                break;
            case 'car':
                icon = '🚗';
                break;
            case 'jeep':
                icon = '🚙';
                break;
        }
        return <Text>{icon}</Text>;
    };

    const handleCreateSchedule = async () => {
        try {
            setIsLoading(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            
            if (!accessToken) {
                showToast('Authentication required', 'error');
                return;
            }

            // Debug logs
            console.log('Route params:', route.params);
            console.log('Place:', place);
            console.log('Places:', places);
            console.log('IsAllPlaces:', isAllPlaces);

            // Get the correct place data based on isAllPlaces
            let selectedPlace;
            if (isAllPlaces) {
                selectedPlace = normalizedPlaces && normalizedPlaces.length > 0 ? normalizedPlaces[0] : null;
            } else {
                selectedPlace = normalizedPlace;
            }
            
            console.log('Selected Place:', selectedPlace);

            if (!selectedPlace) {
                showToast('No place data available', 'error');
                return;
            }

            // Create form data for the schedule
            const formData = new FormData();
            
            // Add banner image - hardcoded default image
            formData.append('bannerImage', {
                uri: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                type: 'image/jpeg',
                name: 'banner.jpg'
            });
            
            // Add required fields with hardcoded values
            const tripName = selectedPlace.name || selectedPlace.placeName || 'Goa Adventure Trip';
            console.log('Trip Name:', tripName);
            
            formData.append('tripName', tripName);
            formData.append('travelMode', "Bike");
            formData.append('visible', "Public");
            
            // Use hardcoded valid coordinates (Goa, India)
            const latitude = 15.2993;  // Goa latitude
            const longitude = 74.1240; // Goa longitude
            
            console.log('Using hardcoded coordinates:', { latitude, longitude });
            
            formData.append('location[from][latitude]', latitude.toString());
            formData.append('location[from][longitude]', longitude.toString());
            formData.append('location[to][latitude]', latitude.toString());
            formData.append('location[to][longitude]', longitude.toString());
            
            // Set dates (current date to next day)
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            formData.append('dates[from]', today.toISOString().split('T')[0]);
            formData.append('dates[end]', tomorrow.toISOString().split('T')[0]);
            formData.append('numberOfDays', '2');

            // First API call to create schedule
            const response = await fetch(`${base_url}/schedule/create`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            const responseText = await response.text();
            console.log('Schedule creation response:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Parse error:', parseError);
                throw new Error('Invalid server response');
            }

            if (!response.ok) {
                console.error('Response not OK:', data);
                throw new Error(data.message || 'Failed to create schedule');
            }

            const scheduleId = data.schedule._id || data.id;
            if (!scheduleId) {
                throw new Error('Schedule ID not received from server');
            }

            // Prepare description data with ALL hardcoded values
            const today_formatted = new Date();
            const formattedDate = `${today_formatted.getDate()}-${today_formatted.getMonth() + 1}-${today_formatted.getFullYear()}`;
            
            // Hardcoded description - ensure it's never empty
            const hardcodedDescription = "Explore the beautiful beaches and vibrant culture of Goa. Visit stunning coastal areas, enjoy water sports, and experience the local cuisine and nightlife.";
            
            const descriptionData = {
                Description: hardcodedDescription,
                date: formattedDate,
                location: {
                    from: {
                        latitude: 15.2993,  // Hardcoded Goa latitude
                        longitude: 74.1240  // Hardcoded Goa longitude
                    },
                    to: {
                        latitude: 15.2993,  // Hardcoded Goa latitude
                        longitude: 74.1240  // Hardcoded Goa longitude
                    }
                }
            };

            console.log('Description data being sent:', JSON.stringify(descriptionData, null, 2));

            // Second API call to add description
            const descriptionResponse = await fetch(`${base_url}/schedule/add/descriptions/${scheduleId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(descriptionData),
            });

            const descriptionResponseText = await descriptionResponse.text();
            console.log('Description response:', descriptionResponseText);

            let descriptionResponseData;
            try {
                descriptionResponseData = JSON.parse(descriptionResponseText);
            } catch (parseError) {
                console.error('Description parse error:', parseError);
                throw new Error('Invalid description response');
            }

            if (!descriptionResponse.ok) {
                if (descriptionResponseData.errors) {
                    const errorMessages = descriptionResponseData.errors.map(err => err.msg).join('\n');
                    throw new Error(errorMessages);
                } else {
                    throw new Error(descriptionResponseData.message || 'Failed to add description');
                }
            }

            showToast('Schedule created successfully!', 'success');
            navigation.navigate('MySchedule');

        } catch (error) {
            console.error('Schedule creation error:', error);
            showToast(error.message || 'Failed to create schedule', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent={true}
            />
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.Zypsii_color} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isAllPlaces ? 'All Places' : 'Place Details'}
                    </Text>
                </View>

                <ScrollView style={styles.content}>
                    {isAllPlaces ? (
                        <>
                            {normalizedPlaces && normalizedPlaces.map((place, index) => (
                                <RecommendCard
                                    key={index}
                                    title={place.name}
                                    suggestions={[{ tripName: place.name, places: [place] }]}
                                    navigation={navigation}
                                />
                            ))}
                            <View style={styles.bottomSpacer} />
                        </>
                    ) : (
                        <>
                            {normalizedPlace && (
                                <RecommendCard
                                    title={normalizedPlace.name}
                                    suggestions={[{ tripName: normalizedPlace.name, places: [normalizedPlace] }]}
                                    navigation={navigation}
                                />
                            )}
                            <View style={styles.bottomSpacer} />
                        </>
                    )}
                </ScrollView>

                <TouchableOpacity 
                    style={styles.createScheduleButton}
                    onPress={handleCreateSchedule}
                    activeOpacity={0.8}
                    disabled={isLoading}
                >
                    <Ionicons name="calendar" size={24} color="#fff" />
                    <Text style={styles.createScheduleText}>
                        {isLoading ? 'Creating Schedule...' : 'Create Schedule'}
                    </Text>
                </TouchableOpacity>
            </View>
            {isLoading && <CustomLoader message="Creating your schedule..." />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: StatusBar.currentHeight || 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 16,
        paddingBottom: 100,
    },
    placeCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
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
    placeContent: {
        padding: 16,
    },
    placeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    placeIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    placeInfo: {
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
    placeMeta: {
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
    metaText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
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
    vehicleText: {
        fontSize: 14,
        color: '#666',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 8,
        marginVertical: 8,
    },
    expandButtonText: {
        color: colors.Zypsii_color,
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
    },
    createScheduleButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: colors.Zypsii_color,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    createScheduleText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    bottomSpacer: {
        height: 100,
    },
});

export default PlaceDetailsScreen;