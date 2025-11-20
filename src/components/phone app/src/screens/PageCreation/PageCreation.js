import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import { colors } from '../../utils'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location' // Importing Location module
import { base_url } from '../../utils/base_url'
import { styles } from './styles'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../components/Auth/AuthContext'
import { useToast } from '../../context/ToastContext'

const ProfilePage = () => {
  const navigation = useNavigation();
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [profileImage, setProfileImage] = useState(null)
  const [profileViews, setProfileViews] = useState('public')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${base_url}/user/getProfile`, {
        method: 'get',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const userData = result.data[0];
        console.log('Fetched profile data:', userData); // Debug log
        setFullName(userData.fullName || '');
        setUsername(userData.userName || '');
        setWebsite(userData.website || '');
        setBio(userData.bio || '');
        setLocation(userData.location || '');
        setProfileViews(userData.profileViews || 'public');
        console.log('Setting profileViews to:', userData.profileViews || 'public'); // Debug log
        if (userData.profilePicture) {
          setProfileImage(userData.profilePicture);
        }
      } else {
        throw new Error('No profile data found');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      showToast('Failed to load profile data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Failed to pick image', 'error');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('website', website);
      formData.append('bio', bio);
      formData.append('profileViews', profileViews);
      
      if (profileImage) {
        const imageUri = profileImage;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('profilePicture', {
          uri: imageUri,
          name: filename,
          type: type
        });
      }

      const response = await fetch(`${base_url}/user/editProfile`, {
        method: 'put',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      if (data.success) {
        const updatedUser = {
          ...user,
          fullName,
          userName: username,
          website,
          bio,
          profileViews,
          profilePicture: profileImage || user.profilePicture
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        await login(updatedUser);
        
        showToast('Profile updated successfully', 'success');
        navigation.goBack();
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(`Failed to update profile: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.btncolor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave} 
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="camera" size={24} color={colors.graycolor} />
              <Text style={styles.profileImagePlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.graycolor}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={colors.graycolor}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="Enter your website"
              placeholderTextColor={colors.graycolor}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Write something about yourself"
              placeholderTextColor={colors.graycolor}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Profile Privacy Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Profile Visibility</Text>
            <Text style={styles.description}>Control who can see your profile</Text>
            
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setProfileViews('public')}
              >
                <View style={[styles.radioButton, profileViews === 'public' && styles.radioButtonSelected]}>
                  {profileViews === 'public' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioText}>Public</Text>
                  <Text style={styles.radioDescription}>Anyone can view your profile</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setProfileViews('private')}
              >
                <View style={[styles.radioButton, profileViews === 'private' && styles.radioButtonSelected]}>
                  {profileViews === 'private' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioText}>Private</Text>
                  <Text style={styles.radioDescription}>Only you can view your profile</Text>
                </View>
              </TouchableOpacity>
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

          {/* <View style={styles.inputContainer}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
            />
          </View> */}
        </View>
      </ScrollView>
    </View>
  )
}

export default ProfilePage
