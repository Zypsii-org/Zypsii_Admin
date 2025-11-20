import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Vibration,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import styles from './styles';
import { scale, colors } from '../../utils';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useBadgeNotifications } from '../../hooks/useBadgeNotifications';

// Haptics fallback implementation
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch (error) {
  // Haptics not available, will use Vibration API as fallback
  Haptics = {
    impactAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: {
      Light: 'light',
      Medium: 'medium',
      Heavy: 'heavy'
    }
  };
}

const { width } = Dimensions.get('window');

function BottomTab({ screen }) {
  const navigation = useNavigation();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState(screen);
  
  // Use custom badge hook
  const { badges, clearBadge } = useBadgeNotifications();
  
  // Animation values
  const [scaleAnimations] = useState({
    home: new Animated.Value(1),
    location: new Animated.Value(1),
    upload: new Animated.Value(1),
    split: new Animated.Value(1),
    menu: new Animated.Value(1),
  });

  // Update active tab when screen prop changes
  useEffect(() => {
    setActiveTab(screen);
  }, [screen]);

  const getIconColor = (currentScreen) => {
    return activeTab === currentScreen ? colors.greenColor : colors.darkGrayText;
  };

  const getTextStyle = (currentScreen) => {
    return activeTab === currentScreen ? styles.activeText : styles.inactiveText;
  };

  const animatePress = (tabKey) => {
    const animation = Animated.sequence([
      Animated.timing(scaleAnimations[tabKey], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimations[tabKey], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
  };

  const handleTabPress = (tabName, screenName) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(50);
    }

    // Animate the press
    animatePress(tabName);
    
    // Clear badge when tab is pressed
    if (badges[tabName] > 0) {
      clearBadge(tabName);
    }
    
    // Navigate
    navigation.navigate(screenName);
  };

  const handleUploadPress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(100);
    }

    animatePress('upload');
    setShowUploadModal(true);
  };

  const handleCreateReel = () => {
    setShowUploadModal(false);
    navigation.navigate('ShortsUpload');
  };

  const handleCreatePost = () => {
    setShowUploadModal(false);
    navigation.navigate('PostUpload');
  };

  const handleCreateSchedule = () => {
    setShowUploadModal(false);
    navigation.navigate('MakeSchedule');
  };

  const renderBadge = (count, tabKey) => {
    if (count === 0) return null;
    
    return (
      <View style={[badgeStyles.badge, { backgroundColor: colors.greenColor }]}>
        <Text style={badgeStyles.badgeText}>
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.footerContainer}>
      {/* Home Icon */}
      <TouchableOpacity
        onPress={() => handleTabPress('home', 'MainLanding')}
        style={styles.footerBtnContainer}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnimations.home }] }}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="home"
              size={scale(22)}
              color={getIconColor('HOME')}
            />
            {renderBadge(badges.home, 'home')}
          </View>
        </Animated.View>
        <Text style={getTextStyle('HOME')}>Home</Text>
      </TouchableOpacity>

      {/* Location Icon */}
      <TouchableOpacity
        onPress={() => handleTabPress('location', 'WhereToGo')}
        style={styles.footerBtnContainer}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnimations.location }] }}>
          <View style={styles.iconContainer}>
            <SimpleLineIcons
              name="location-pin"
              size={scale(22)}
              color={getIconColor('WhereToGo')}
            />
            {renderBadge(badges.location, 'location')}
          </View>
        </Animated.View>
        <Text style={getTextStyle('WhereToGo')}>Where to Go</Text>
      </TouchableOpacity>

      {/* Upload Icon */}
      <TouchableOpacity
        onPress={handleUploadPress}
        style={[styles.footerBtnContainer, styles.uploadContainer]}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnimations.upload }] }}>
          <View style={[styles.iconContainer, styles.uploadIconContainer]}>
            <MaterialCommunityIcons
              name="camera-plus"
              size={scale(24)}
              color={colors.white}
            />
          </View>
        </Animated.View>
        <Text style={styles.uploadText}>Upload</Text>
      </TouchableOpacity>

      {/* Split/Expense Calculator Icon */}
      <TouchableOpacity
        onPress={() => handleTabPress('split', 'SplitwiseHome')}
        style={styles.footerBtnContainer}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnimations.split }] }}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name="attach-money"
              size={scale(22)}
              color={getIconColor('SPLIT')}
            />
            {renderBadge(badges.split, 'split')}
          </View>
        </Animated.View>
        <Text style={getTextStyle('SPLIT')}>Split</Text>
      </TouchableOpacity>

      {/* Profile Icon */}
      <TouchableOpacity
        onPress={() => handleTabPress('menu', 'DummyScreen')}
        style={styles.footerBtnContainer}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnimations.menu }] }}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="menu"
              size={scale(22)}
              color={getIconColor('PROFILE')}
            />
            {renderBadge(badges.menu, 'menu')}
          </View>
        </Animated.View>
        <Text style={getTextStyle('PROFILE')}>Menu</Text>
      </TouchableOpacity>

      {/* Enhanced Upload Options Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <TouchableOpacity 
          style={modalStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUploadModal(false)}
        >
          <View style={modalStyles.modalContent}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>Create New</Text>
              <TouchableOpacity 
                onPress={() => setShowUploadModal(false)}
                style={modalStyles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={modalStyles.optionButton}
              onPress={handleCreateReel}
              activeOpacity={0.7}
            >
              <View style={[modalStyles.iconContainer, { backgroundColor: '#FF6B6B' }]}>
                <MaterialCommunityIcons name="video-plus" size={24} color="white" />
              </View>
              <View style={modalStyles.optionContent}>
                <Text style={modalStyles.optionText}>Create Reel</Text>
                <Text style={modalStyles.optionSubtext}>Share your moments in video</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={modalStyles.optionButton}
              onPress={handleCreatePost}
              activeOpacity={0.7}
            >
              <View style={[modalStyles.iconContainer, { backgroundColor: '#4ECDC4' }]}>
                <MaterialCommunityIcons name="image-plus" size={24} color="white" />
              </View>
              <View style={modalStyles.optionContent}>
                <Text style={modalStyles.optionText}>Create Post</Text>
                <Text style={modalStyles.optionSubtext}>Share photos and stories</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={modalStyles.optionButton}
              onPress={handleCreateSchedule}
              activeOpacity={0.7}
            >
              <View style={[modalStyles.iconContainer, { backgroundColor: '#45B7D1' }]}>
                <MaterialCommunityIcons name="calendar-plus" size={24} color="white" />
              </View>
              <View style={modalStyles.optionContent}>
                <Text style={modalStyles.optionText}>Create Schedule</Text>
                <Text style={modalStyles.optionSubtext}>Plan your next adventure</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionSubtext: {
    fontSize: 12,
    color: '#666',
  },
});

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default BottomTab;
