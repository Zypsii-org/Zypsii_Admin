import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

const FollowContext = createContext();

// Helper function to extract actual IDs from objects if needed
const getActualId = (id) => {
  if (!id) return null;
  if (typeof id === 'object' && id !== null && id._id) {
    return id._id;
  }
  return String(id);
};

export const FollowProvider = ({ children }) => {
  const [following, setFollowing] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});

  // Load followed users from storage when app starts
  useEffect(() => {
    const loadFollowing = async () => {
      try {
        const storedFollowing = await AsyncStorage.getItem('following');
        if (storedFollowing) {
          setFollowing(JSON.parse(storedFollowing));
        }
      } catch (error) {
        console.error('Error loading following data:', error);
      }
    };
    loadFollowing();
  }, []);

  const setLoading = (userId, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [userId]: isLoading
    }));
  };

  const followUser = async (followerId, followingId) => {
    const followerIdStr = getActualId(followerId);
    const followingIdStr = getActualId(followingId);
    
    if (!followerIdStr || !followingIdStr) {
      console.error('Invalid IDs:', { followerId: followerIdStr, followingId: followingIdStr });
      return;
    }

    setLoading(followingIdStr, true);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(
        `${base_url}/follow/followUser/${followingIdStr}/${followerIdStr}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to follow user');
      }

      // Accept both 'success' and 'status' as true
      if (data.success === true || data.status === true) {
        setFollowing(prev => [...new Set([...prev, followingIdStr])]);
        await AsyncStorage.setItem('following', JSON.stringify([...new Set([...following, followingIdStr])]));
      } else if (data.message && data.message.toLowerCase().includes('already follow')) {
        // If already following, just update state
        setFollowing(prev => [...new Set([...prev, followingIdStr])]);
      } else {
        throw new Error(data.message || 'Follow operation failed');
      }
    } catch (error) {
      console.error('Error following user:', error);
      throw error; // Re-throw to handle in the component
    } finally {
      setLoading(followingIdStr, false);
    }
  };

  const unfollowUser = async (followerId, followingId) => {
    const followerIdStr = getActualId(followerId);
    const followingIdStr = getActualId(followingId);

    if (!followerIdStr || !followingIdStr) {
      console.error('Invalid IDs:', { followerId: followerIdStr, followingId: followingIdStr });
      return;
    }

    setLoading(followingIdStr, true);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(
        `${base_url}/follow/unfollowUser/${followingIdStr}/${followerIdStr}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unfollow user');
      }

      // Accept both 'success' and 'status' as true
      if (data.success === true || data.status === true) {
        setFollowing(prev => prev.filter(id => id !== followingIdStr));
        await AsyncStorage.setItem('following', JSON.stringify(following.filter(id => id !== followingIdStr)));
      } else if (data.message && data.message.toLowerCase().includes('not following')) {
        // If already not following, just update state
        setFollowing(prev => prev.filter(id => id !== followingIdStr));
      } else {
        throw new Error(data.message || 'Unfollow operation failed');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error; // Re-throw to handle in the component
    } finally {
      setLoading(followingIdStr, false);
    }
  };

  const isFollowing = (userId) => {
    const actualId = getActualId(userId);
    return actualId ? following.includes(actualId) : false;
  };
  
  const isLoading = (userId) => {
    const actualId = getActualId(userId);
    return actualId ? loadingStates[actualId] || false : false;
  };

  return (
    <FollowContext.Provider value={{ 
      following, 
      followUser, 
      unfollowUser, 
      isFollowing,
      isLoading 
    }}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};