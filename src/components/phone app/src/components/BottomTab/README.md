# Enhanced BottomTab Component

## Overview
The BottomTab component has been significantly enhanced with modern UI/UX features including animations, haptic feedback, badge notifications, and improved styling.

## Features

### 🎨 Visual Enhancements
- **Animated Tab Presses**: Smooth scale animations when tabs are pressed
- **Enhanced Upload Button**: Prominent circular upload button with shadow effects
- **Improved Modal Design**: Modern bottom sheet modal with better visual hierarchy
- **Badge Notifications**: Red notification badges on tabs with unread counts
- **Better Typography**: Improved font weights and spacing

### 📱 User Experience
- **Haptic Feedback**: Tactile feedback on iOS and vibration on Android
- **Active Tab Tracking**: Proper state management for active tab indication
- **Smooth Transitions**: Animated tab switching with proper visual feedback
- **Accessibility**: Better touch targets and visual feedback

### 🔧 Technical Improvements
- **Modular Badge System**: Custom hook for managing notification badges
- **Fallback Support**: Graceful handling of missing dependencies (expo-haptics)
- **Performance Optimized**: Efficient animations using native driver
- **Type Safety**: Better prop handling and state management

## Usage

### Basic Usage
```jsx
import BottomTab from './components/BottomTab/BottomTab';

<BottomTab screen="HOME" />
```

### With Badge Notifications
```jsx
import { useBadgeNotifications } from './hooks/useBadgeNotifications';

const { updateBadge, clearBadge } = useBadgeNotifications();

// Update badge count
updateBadge('home', 5);

// Clear badge when user visits tab
clearBadge('home');
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `screen` | string | - | Current active screen name |

## Badge Integration

The component uses a custom hook `useBadgeNotifications` that can be easily integrated with your notification system:

```jsx
// In your notification service
import { useBadgeNotifications } from '../hooks/useBadgeNotifications';

const { updateBadge } = useBadgeNotifications();

// When receiving a new message
updateBadge('menu', currentCount + 1);

// When user opens the menu
updateBadge('menu', 0);
```

## Styling

The component uses a separate styles file (`styles.js`) for better maintainability. Key style classes:

- `footerContainer`: Main bottom tab container
- `footerBtnContainer`: Individual tab button container
- `uploadContainer`: Special styling for upload button
- `uploadIconContainer`: Circular upload button styling
- `iconContainer`: Icon wrapper with badge positioning

## Dependencies

### Required
- `react-native-vector-icons`
- `@expo/vector-icons`
- `@react-navigation/native`

### Optional
- `expo-haptics` (for enhanced haptic feedback)

## Customization

### Colors
Update colors in `src/utils/colors.js`:
```jsx
export const colors = {
  greenColor: '#ff3873', // Active tab color
  darkGrayText: '#9B9B9B', // Inactive tab color
  // ... other colors
};
```

### Animations
Modify animation timing in the `animatePress` function:
```jsx
const animatePress = (tabKey) => {
  const animation = Animated.sequence([
    Animated.timing(scaleAnimations[tabKey], {
      toValue: 0.8, // Scale down amount
      duration: 100, // Animation duration
      useNativeDriver: true,
    }),
    // ... rest of animation
  ]);
};
```

### Badge Styling
Customize badge appearance in the `badgeStyles` object:
```jsx
const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    // ... other styles
  },
});
```

## Migration Guide

### From Old Version
1. The component now uses a custom hook for badges
2. Haptic feedback is automatically handled with fallbacks
3. Upload modal has been redesigned with better UX
4. Animation system has been improved

### Breaking Changes
- Badge state is now managed externally via the hook
- Upload button styling has changed significantly
- Modal structure has been updated

## Performance Notes

- Animations use `useNativeDriver: true` for optimal performance
- Badge updates are optimized to prevent unnecessary re-renders
- Haptic feedback is debounced to prevent excessive vibrations

## Accessibility

- Proper touch targets (minimum 44x44 points)
- Visual feedback for all interactions
- Screen reader friendly labels
- High contrast color scheme

## Browser Support

- iOS: iOS 11+
- Android: API level 21+
- Web: Modern browsers with React Native Web support 