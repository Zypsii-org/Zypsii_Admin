import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFollow } from './FollowContext';
import { useAuth } from '../Auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors } from '../../utils/colors';

const FollowButton = ({ userId }) => {
  const { user } = useAuth();
  const { 
    isFollowing, 
    followUser, 
    unfollowUser, 
    isLoading 
  } = useFollow();
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Extract the actual user ID from the userId prop
  const getUserId = () => {
    if (!userId) return null;
    
    // If userId is an object with _id property
    if (typeof userId === 'object' && userId !== null && userId._id) {
      return userId._id;
    }
    
    // If userId is already a string
    if (typeof userId === 'string') {
      return userId;
    }
    
    // Fallback to string conversion
    return String(userId);
  };

  const actualUserId = getUserId();

  const handlePress = async () => {
    if (!user?._id) {
      showToast('Please log in to follow users', 'error');
      return;
    }

    if (!actualUserId) {
      showToast('Invalid user ID', 'error');
      return;
    }
    
    try {
      setError(null);
      const isCurrentlyFollowing = isFollowing(actualUserId);
      
      if (isCurrentlyFollowing) {
        await unfollowUser(user._id, actualUserId);
      } else {
        try {
          await followUser(user._id, actualUserId);
        } catch (followError) {
          // If the error indicates user is already following, trigger unfollow
          if (followError.message === 'You already follow this user') {
            await unfollowUser(user._id, actualUserId);
          } else {
            throw followError;
          }
        }
      }
    } catch (error) {
      console.error("Follow action failed:", error.message);
      setError(error.message);
      showToast(error.message || 'Failed to update follow status', 'error');
    }
  };

  const buttonLoading = isLoading(actualUserId);
  const following = isFollowing(actualUserId);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        following ? styles.following : styles.notFollowing,
        buttonLoading && styles.disabled,
        error && styles.error
      ]}
      onPress={handlePress}
      disabled={buttonLoading || !user?._id}
    >
      {buttonLoading ? (
        <ActivityIndicator size="small" color={following ? '#fff' : colors.primary} />
      ) : (
        <>
          <Text style={[
            styles.buttonText,
            following && styles.followingText,
            error && styles.errorText
          ]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  following: {
    backgroundColor: colors.primary,
  },
  notFollowing: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    borderColor: 'red',
  },
  buttonText: {
    marginLeft: 5,
    fontSize: 14,
    color: colors.primary,
  },
  followingText: {
    color: '#fff',
  },
  errorText: {
    color: 'red',
  },
});

export default FollowButton;