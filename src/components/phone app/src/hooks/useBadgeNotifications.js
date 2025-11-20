import { useState, useEffect } from 'react';

export const useBadgeNotifications = () => {
  const [badges, setBadges] = useState({
    home: 0,
    location: 0,
    upload: 0,
    split: 0,
    menu: 0,
  });

  // Function to update badge count for a specific tab
  const updateBadge = (tabName, count) => {
    setBadges(prev => ({
      ...prev,
      [tabName]: Math.max(0, count) // Ensure count is not negative
    }));
  };

  // Function to clear badge for a specific tab
  const clearBadge = (tabName) => {
    setBadges(prev => ({
      ...prev,
      [tabName]: 0
    }));
  };

  // Function to clear all badges
  const clearAllBadges = () => {
    setBadges({
      home: 0,
      location: 0,
      upload: 0,
      split: 0,
      menu: 0,
    });
  };

  // Example: You can integrate this with your notification system
  // useEffect(() => {
  //   // Listen to notification events
  //   const unsubscribe = Notifications.addNotificationReceivedListener(notification => {
  //     // Update badges based on notification type
  //     if (notification.type === 'new_message') {
  //       updateBadge('menu', badges.menu + 1);
  //     }
  //   });
  //
  //   return unsubscribe;
  // }, [badges]);

  return {
    badges,
    updateBadge,
    clearBadge,
    clearAllBadges,
  };
}; 