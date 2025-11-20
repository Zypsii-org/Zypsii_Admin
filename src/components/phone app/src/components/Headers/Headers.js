import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import styles from './styles'
import { useNavigation } from '@react-navigation/native';

function BackHeader(props) {
  const navigation = useNavigation();
  
  const handleSearchPress = () => {
    if (props.onSearchPress) {
      props.onSearchPress();
    } else {
      navigation.navigate('SearchPage');
    }
  };

  const handleNotificationPress = () => {
    if (props.onNotificationPress) {
      props.onNotificationPress();
    } else {
      navigation.navigate('Notification');
    }
  };

  const handleProfilePress = () => {
    if (props.onProfilePress) {
      props.onProfilePress();
    } else {
      navigation.navigate('ProfileDashboard');
    }
  };

  const handleChatPress = () => {
    if (props.onChatPress) {
      props.onChatPress();
    } else {
      navigation.navigate('MessageList');
    }
  };

  const handleBackPress = () => {
    if (props.backPressed) {
      props.backPressed();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.subContainer}>
        {/* Back Arrow Inside Circle */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={handleBackPress}>
          <MaterialIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerText}>
          {props.title || ''}
        </Text>
        {/* Right Icons */}
        <View style={styles.rightContainer}>
          {props.showSearch !== false && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.iconButton}
              onPress={handleSearchPress}>
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          {props.showChat !== false && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.iconButton}
              onPress={handleChatPress}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          
        </View>
      </View>
    </View>
  )
}

function HeaderRightText(props) {
  return (
    <View style={styles.container}>
      <View style={[styles.subContainer, { justifyContent: 'space-between' }]}>
        <View style={styles.titleContainer}>
          <TouchableOpacity
            activeOpacity={0}
            onPress={() => props.backPressed()}>
            <Ionicons name="ios-arrow-back" size={30} />
          </TouchableOpacity>
          <Text numberOfLines={1} style={styles.headerText}>
            {props.title}
          </Text>
        </View>
        <Text style={styles.rightTitle}>New Address</Text>
      </View>
    </View>
  )
}

export { BackHeader, HeaderRightText }
