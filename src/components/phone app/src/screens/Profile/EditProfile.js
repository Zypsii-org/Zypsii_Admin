import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Image,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { baseURL } from '../../utils/base_url';
import { colors } from '../../utils/colors';
import { alignment } from '../../utils/alignment';

const EditProfile = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        userName: '',
        email: '',
        phone: {
            code: '',
            number: ''
        },
        website: '',
        bio: '',
        profileViews: 'public',
        placeDetails: {
            name: '',
            address: ''
        }
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                userName: user.userName || '',
                email: user.email || '',
                phone: {
                    code: user.phone?.code || '',
                    number: user.phone?.number || ''
                },
                website: user.website || '',
                bio: user.bio || '',
                profileViews: user.profileViews || 'public',
                placeDetails: {
                    name: user.placeDetails?.name || '',
                    address: user.placeDetails?.address || ''
                }
            });
        }
    }, [user]);

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.fullName.trim() || !formData.userName.trim() || !formData.email.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const token = user?.token;
            const response = await fetch(`${baseURL}/user/editProfile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                Alert.alert('Success', 'Profile updated successfully', [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]);
            } else {
                Alert.alert('Error', result.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <StatusBar 
                backgroundColor={colors.Zypsii_color} 
                barStyle="light-content" 
                translucent={false}
            />
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                        <Text style={[styles.saveText, loading && styles.disabledText]}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    {/* Profile Picture Section */}
                    <View style={styles.profilePictureSection}>
                        <Image
                            source={{ uri: user?.profilePicture || 'https://via.placeholder.com/100' }}
                            style={styles.profilePicture}
                        />
                        <TouchableOpacity style={styles.changePictureButton}>
                            <Text style={styles.changePictureText}>Change Picture</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Basic Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Information</Text>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.fullName}
                                onChangeText={(value) => handleInputChange('fullName', value)}
                                placeholder="Enter your full name"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Username *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.userName}
                                onChangeText={(value) => handleInputChange('userName', value)}
                                placeholder="Enter username"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={(value) => handleInputChange('email', value)}
                                placeholder="Enter email"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={styles.phoneContainer}>
                                <TextInput
                                    style={[styles.input, styles.phoneCode]}
                                    value={formData.phone.code}
                                    onChangeText={(value) => handleInputChange('phone.code', value)}
                                    placeholder="+1"
                                />
                                <TextInput
                                    style={[styles.input, styles.phoneNumber]}
                                    value={formData.phone.number}
                                    onChangeText={(value) => handleInputChange('phone.number', value)}
                                    placeholder="Phone number"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Website</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.website}
                                onChangeText={(value) => handleInputChange('website', value)}
                                placeholder="Enter website URL"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.bio}
                                onChangeText={(value) => handleInputChange('bio', value)}
                                placeholder="Tell us about yourself"
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </View>

                    {/* Profile Privacy */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Profile Privacy</Text>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Profile Visibility</Text>
                            <Text style={styles.description}>Control who can see your profile</Text>
                            <View style={styles.radioContainer}>
                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => handleInputChange('profileViews', 'public')}
                                >
                                    <View style={[styles.radioButton, formData.profileViews === 'public' && styles.radioButtonSelected]}>
                                        {formData.profileViews === 'public' && <View style={styles.radioButtonInner} />}
                                    </View>
                                    <View style={styles.radioTextContainer}>
                                        <Text style={styles.radioText}>Public</Text>
                                        <Text style={styles.radioDescription}>Anyone can view your profile</Text>
                                    </View>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => handleInputChange('profileViews', 'private')}
                                >
                                    <View style={[styles.radioButton, formData.profileViews === 'private' && styles.radioButtonSelected]}>
                                        {formData.profileViews === 'private' && <View style={styles.radioButtonInner} />}
                                    </View>
                                    <View style={styles.radioTextContainer}>
                                        <Text style={styles.radioText}>Private</Text>
                                        <Text style={styles.radioDescription}>Only you can view your profile</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.privacyInfo}>
                            <Text style={styles.privacyInfoText}>
                                💡 <Text style={styles.privacyInfoBold}>Public profiles</Text> can be discovered by other users and appear in search results.
                            </Text>
                            <Text style={styles.privacyInfoText}>
                                🔒 <Text style={styles.privacyInfoBold}>Private profiles</Text> are hidden from search and discovery features.
                            </Text>
                        </View>
                    </View>

                    {/* Location Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Location Information</Text>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Place Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.placeDetails.name}
                                onChangeText={(value) => handleInputChange('placeDetails.name', value)}
                                placeholder="Enter place name"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.placeDetails.address}
                                onChangeText={(value) => handleInputChange('placeDetails.address', value)}
                                placeholder="Enter address"
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
    },
    cancelText: {
        fontSize: 16,
        color: colors.gray,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.black,
    },
    saveText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
    disabledText: {
        opacity: 0.5,
    },
    scrollView: {
        flex: 1,
    },
    formContainer: {
        padding: 20,
    },
    profilePictureSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
    },
    changePictureButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: colors.lightGray,
        borderRadius: 20,
    },
    changePictureText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.black,
        marginBottom: 15,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.black,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.lightGray,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: colors.white,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    phoneCode: {
        flex: 0.3,
    },
    phoneNumber: {
        flex: 0.7,
    },
    radioContainer: {
        gap: 15,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: colors.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    radioText: {
        fontSize: 16,
        color: colors.black,
        fontWeight: '500',
    },
    radioTextContainer: {
        flex: 1,
        marginLeft: 10,
    },
    radioDescription: {
        fontSize: 14,
        color: colors.gray,
        marginTop: 2,
    },
    description: {
        fontSize: 14,
        color: colors.gray,
        marginBottom: 10,
    },
    privacyInfo: {
        backgroundColor: colors.lightGray,
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    privacyInfoText: {
        fontSize: 13,
        color: colors.gray,
        lineHeight: 18,
        marginBottom: 5,
    },
    privacyInfoBold: {
        fontWeight: '600',
        color: colors.black,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default EditProfile; 