import React, { useContext } from 'react';
import { View, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import styles from './ProfileContainer/styles';
import ProfileContainer from './ProfileContainer/ProfileContainer';
import { BottomTab, TextDefault } from '../../components';
// import CardContainer from './CardContainer/CardContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { colors } from '../../utils';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../context/ToastContext';

//const baseUrl = 'https://admin.zypsii.com';
function ProfileDashboard(props) {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [profileInfo, setProfileInfo] = useState({
    id: '',
    name: '',
    userName: '',
    email: '',
    website: '',
    bio: '',
    Posts: '0',
    Followers: '0',
    Following: '0',
    image: null
  });

  useEffect(() => {
    fetchProfileInfo();
  }, []);

  const fetchProfileInfo = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${base_url}/user/getProfile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const userData = result.data[0];
        
        // Set basic profile info
        setProfileInfo({
          id: userData._id || '',
          name: userData.fullName || '',
          userName: userData.userName || '',
          email: userData.email || '',
          website: userData.website || '',
          bio: userData.bio || '',
          Posts: '0', // Will be fetched separately
          Followers: '0', // Will be fetched separately
          Following: '0', // Will be fetched separately
          image: userData.profilePicture || null
        });

        // Fetch post count
        const postCountResponse = await fetch(`${base_url}/post/listing/postCount?userId=${userData._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('ProfileDashboard - postCountResponse status:', postCountResponse.status);
        console.log('ProfileDashboard - postCountResponse ok:', postCountResponse.ok);

        if (postCountResponse.ok) {
          const postCountResult = await postCountResponse.json();
          console.log('ProfileDashboard - postCountResult:', postCountResult);
          if (postCountResult.success) {
            console.log('ProfileDashboard - Setting post count to:', postCountResult.postCountData);
            setProfileInfo(prev => ({
              ...prev,
              Posts: postCountResult.postCountData?.toString() || '0'
            }));
          } else {
            console.error('ProfileDashboard - Post count API returned success: false:', postCountResult.message);
          }
        } else {
          console.error('ProfileDashboard - Post count API failed with status:', postCountResponse.status);
          const errorText = await postCountResponse.text();
          console.error('ProfileDashboard - Post count API error response:', errorText);
        }

        // Fetch followers count
        const followersResponse = await fetch(`${base_url}/follow/getFollowers/${userData._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (followersResponse.ok) {
          const followersResult = await followersResponse.json();
          if (followersResult.status) {
            setProfileInfo(prev => ({
              ...prev,
              Followers: followersResult.followersCount?.toString() || '0'
            }));
          }
        }

        // Fetch following count
        const followingResponse = await fetch(`${base_url}/follow/getFollowing/${userData._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (followingResponse.ok) {
          const followingResult = await followingResponse.json();
          if (followingResult.status) {
            setProfileInfo(prev => ({
              ...prev,
              Following: followingResult.followingCount?.toString() || '0'
            }));
          }
        }
      } else {
        throw new Error('No profile data found');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      showToast('Failed to load profile data. Please try again.', 'error');
    }
  };

  return (
    <>
      <StatusBar 
        backgroundColor={colors.Zypsii_color} 
        barStyle="light-content" 
        translucent={false}
      />
      <SafeAreaView style={styles.safeAreaStyle} edges={['top']}>
        <View style={styles.flex}>
          <ScrollView 
            contentContainerStyle={styles.mainContainer}
            showsVerticalScrollIndicator={false}
          >
            <ProfileContainer profileInfo={profileInfo}/>
          </ScrollView>
          <View style={{height:200,backgroundColor:'white'}}></View>
        </View>
      </SafeAreaView>
    </>
  );
}

export default ProfileDashboard;