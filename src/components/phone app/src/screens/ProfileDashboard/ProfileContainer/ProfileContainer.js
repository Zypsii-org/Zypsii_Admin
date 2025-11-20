import React, { useContext, useState } from 'react';
import { TouchableOpacity, View, Image, ScrollView, Share, Modal, Text } from 'react-native';
import styles from './styles';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TextDefault } from '../../../components';
import { useAuth } from '../../../components/Auth/AuthContext';
import { colors } from '../../../utils';

function ProfileContainer({profileInfo}) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = async () => {
    try {
      const userName = user?.userName || profileInfo?.userName || 'User';
      const fullName = user?.fullName || profileInfo?.fullName || userName;
      const userId = user?._id || profileInfo?.id || '';
      const profileImage = user?.profilePicture || profileInfo?.image || '';
      const deepLink = `https://zypsii.app/profile/${userId}`;
      let message = `${fullName} (@${userName}) on Zypsii!\n`;
      if (profileImage) message += `Profile Image: ${profileImage}\n`;
      message += `Check out my profile: ${deepLink}`;
      const shareOptions = {
        message,
        url: deepLink,
        title: `Share ${fullName}'s Profile`
      };
      const result = await Share.share(shareOptions);
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const openShareModal = () => {
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const handleShareFromModal = async () => {
    closeShareModal();
    await handleShare();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.protractorShape} />
      <View style={styles.backgroundCurvedContainer} />
      <View style={styles.maincontainer}>

        {/* Icons Row */}
        <View style={styles.topIconsRow}>
          <View style={styles.circle}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.circle}>
            <TouchableOpacity onPress={openShareModal}>
              <MaterialCommunityIcons name="share-all-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Picture and Name */}
        <View style={styles.profileSection}>
          <Image 
            source={{uri: user?.profilePicture || profileInfo?.image}} 
            style={styles.profileImage} 
          />
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => navigation.navigate('PageCreation')}>
            <Feather name="edit" size={18} color={colors.white} />
          </TouchableOpacity>
          <TextDefault style={styles.profileName} H4>
            {user?.fullName || profileInfo?.name || 'User Name'}
          </TextDefault>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <TextDefault style={styles.statLabel}>Posts</TextDefault>
            <TextDefault style={styles.statNumber}>{profileInfo?.Posts || '0'}</TextDefault>
          </View>
          <TouchableOpacity 
            style={styles.stat}
            onPress={() => navigation.navigate('FollowersList', { initialTab: 'Followers' })}
          >
            <TextDefault style={styles.statLabel}>Followers</TextDefault>
            <TextDefault style={styles.statNumber}>{profileInfo?.Followers || '0'}</TextDefault>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statLast}
            onPress={() => navigation.navigate('FollowersList', { initialTab: 'Following' })}
          >
            <TextDefault style={styles.statLabel}>Following</TextDefault>
            <TextDefault style={styles.statNumber}>{profileInfo?.Following || '0'}</TextDefault>
          </TouchableOpacity>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection} H5>
          {[
            { label: 'Share Profile', icon: 'share', onPress: openShareModal },
            { label: 'Logout', icon: 'logout', route: 'Logout' },
            { label: 'FAQ', icon: 'help-outline', route: 'FAQ' },
            { label: 'My Schedule', icon: 'list', route: 'MySchedule' },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingsItem}
              onPress={item.onPress ? item.onPress : () => navigation.navigate(item.route)}>
              <View style={styles.settingsItemContent}>
                <MaterialIcons name={item.icon} size={24} color={colors.darkGrayText} />
                <TextDefault style={styles.settingsItemText} H5>
                  {item.label}
                </TextDefault>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={colors.darkGrayText}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Share Profile Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeShareModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.shareModalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.shareModalTitle}>Share Your Profile</Text>
            
            <View style={styles.sharePreviewContainer}>
              <Image 
                source={{uri: user?.profilePicture || profileInfo?.image}} 
                style={styles.sharePreviewImage} 
              />
              <Text style={styles.sharePreviewName}>
                {user?.fullName || profileInfo?.name || 'User Name'}
              </Text>
              <Text style={styles.sharePreviewUsername}>
                @{user?.userName || profileInfo?.userName || 'username'}
              </Text>
            </View>

            <View style={styles.shareModalButtons}>
              <TouchableOpacity 
                style={styles.shareModalButton} 
                onPress={handleShareFromModal}
              >
                <MaterialCommunityIcons name="share-variant" size={24} color={colors.white} />
                <Text style={styles.shareModalButtonText}>Share Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelModalButton} 
                onPress={closeShareModal}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default ProfileContainer;
