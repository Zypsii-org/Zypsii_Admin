import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_KEY = '@tutorial_seen';

export const setTutorialSeen = async () => {
  try {
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
  } catch (error) {
    console.error('Error saving tutorial status:', error);
  }
};

export const getTutorialSeen = async () => {
  try {
    const value = await AsyncStorage.getItem(TUTORIAL_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error getting tutorial status:', error);
    return false;
  }
}; 