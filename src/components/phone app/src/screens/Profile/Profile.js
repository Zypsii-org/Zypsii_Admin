import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ImageBackground, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';
import Icon from 'react-native-vector-icons/FontAwesome';
import { BackHeader } from '../../components';
import { colors } from '../../constants/Colors';

const ProfileScreen = ({ navigation }) => {
  const [activeIcon, setActiveIcon] = useState('th-large'); // Default active icon

  // Local images for each icon
  const images = {
    'th-large': [
      { id: '1', uri: require('../../assets/image1.jpg') },
      { id: '2', uri: require('../../assets/image2.jpg') },
      { id: '3', uri: require('../../assets/image3.jpg') },
      { id: '4', uri: require('../../assets/image4.jpg') },
    ],
    briefcase: [], // No images for this icon
    'play-circle': [], // No images for this icon
  };

  // Generate placeholders if no images are available
  const imageData =
    images[activeIcon].length > 0
      ? images[activeIcon]
      : Array(6)
          .fill(null)
          .map((_, index) => ({ id: `${index + 1}`, isPlaceholder: true }));

  const backPressed = () => {
    navigation.goBack();
  };

  return (
    <>
      <StatusBar 
        backgroundColor={colors.Zypsii_color} 
        barStyle="light-content" 
        translucent={false}
      />
      <SafeAreaView style={styles.safeAreaStyle} edges={['top']}>
        <ImageBackground
          source={require('../../assets/androidbg.png')} // Background image path
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle} // Image-specific styles
        >
        <BackHeader 
          title="Profile"
          backPressed={backPressed}
        >
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </BackHeader>

        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <Image
            source={require('../../assets/profileimage.jpg')} // Local profile image
            style={styles.profileImage}
          />
          <Text style={styles.name}>Jenish</Text>
          <Text style={styles.description}> Everything is designed.</Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.buttonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Gray Line */}
        <View style={styles.separatorLine} />

        {/* Images Section */}
        <FlatList
          data={images['th-large']} 
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <Image source={item.uri} style={styles.gridImage} />
          )}
          contentContainerStyle={styles.gridContainer}
        />
        </ImageBackground>
      </SafeAreaView>
    </>
  );
};

export default ProfileScreen;