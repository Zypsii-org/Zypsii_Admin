import { View, Text } from 'react-native'
import React from 'react'
import Constants from 'expo-constants'

// const ENV = {
//   development: {
//     SERVER_URL: 'https://zypsii.com/api',
//   },
//   staging: {
//     SERVER_URL: 'https://zypsii.com/api',
//   },
//   production: {
//     SERVER_URL: 'https://zypsii.com/api',
//   },
//   socket: {
//     SOCKET_URL: 'https://zypsii.com',
//   }
// }


const ENV = {
  development: {
    SERVER_URL: 'http://192.168.1.11:3030',
  },
  staging: {
    SERVER_URL: 'http://192.168.1.11:3030',
  },
  production: {
    SERVER_URL: 'http://192.168.1.11:3030',
  },
  socket: {
    SOCKET_URL: 'http://192.168.1.11:3030',
  }
}

const getEnvVars = () => {
  try {
    // Use Constants.expoConfig instead of Constants.manifest
    const config = Constants.expoConfig || Constants.manifest;
    const env = config?.releaseChannel || 'development';
    
    if (__DEV__) {
      return ENV.development;
    } else if (env === 'production') {
      return ENV.production;
    } else if (env === 'staging') {
      return ENV.staging;
    } else {
      return ENV.development;
    }
  } catch (error) {
    console.warn('Error getting environment variables:', error);
    return ENV.development; // Fallback to development
  }
}

export const base_url = getEnvVars().SERVER_URL;

export const socket_url = ENV.socket.SOCKET_URL;