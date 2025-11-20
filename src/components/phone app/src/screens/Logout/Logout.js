import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../components/Auth/AuthContext'; // Adjust the import path as needed
import Icon from 'react-native-vector-icons/MaterialIcons'; // Example icon library

const LogoutButton = () => {
  const navigation = useNavigation();
  const { logout } = useAuth(); // Access the logout function from AuthContext
  const [isHovered, setIsHovered] = useState(false); // State to track hover

  const handleLogout = () => {
    console.log('User logged out');
    logout(); // Call the logout function to remove the user from AsyncStorage and state
    navigation.navigate('Login'); // Navigate to the Login screen after logout
  };

  const handleCancel = () => {
    console.log('Cancel button pressed');
    navigation.goBack(); // Navigate back to the previous screen
  };

  return (
    <View style={styles.container}>
        <Text
        bolder
        H5
        style={{
            padding: 25,
            textAlign: 'center',
            fontWeight: '900',
            fontSize:25
        }}>
        Are you Sure you want to Logout Your Account?
        </Text>

      <TouchableOpacity
        onPress={handleLogout}
        style={[styles.button, styles.logoutButton]}
      >
        <View style={styles.iconContainer}>
          <Icon name="logout" size={24} color="#fff" />
        </View>
        <Text style={styles.text}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleCancel}
        style={[styles.button, styles.cancelButton, isHovered && styles.cancelButtonHover]} // Apply hover style
      >
        <Text>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10, // Add some vertical spacing between buttons
  },
  logoutButton: {
    backgroundColor: '#ff4444', // Red color for logout button
  },
  cancelButton: {
    backgroundColor: '#d9d7d9', // Light gray color for cancel button
  },
  cancelButtonHover: {
    backgroundColor: '#940f8d', // Purple color on hover
  },
  iconContainer: {
    marginRight: 10,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});

export default LogoutButton;