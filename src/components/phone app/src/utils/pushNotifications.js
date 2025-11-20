import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from './base_url';

export async function sendPushTokenToBackend(token) {
  try {
    console.log('The sendPushTokenToBackend is working properly');
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      console.warn('No access token found, cannot update push token on backend.');
      return;
    }
    const response = await fetch(`${base_url}/user/push-notification-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    console.log('what is the data form /user/push-notification-token', data);
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update push token');
    }
    // Optionally handle success
    console.log('Push token updated on backend:', data);
  } catch (error) {
    console.error('Failed to send push token to backend:', error);
  }
} 