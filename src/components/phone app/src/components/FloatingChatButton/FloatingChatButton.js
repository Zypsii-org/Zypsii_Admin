import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, scale } from '../../utils';

const { width, height } = Dimensions.get('window');

const FloatingSupportButton = React.memo(({ onPress }) => {
  // Use refs to prevent recreation of animated values
  const pan = useRef(new Animated.ValueXY({ 
    x: width - 45, // 45px from right edge
    y: height - 110 // 120px from bottom (to avoid bottom tab)
  })).current;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event(
      [
        null,
        {
          dx: pan.x,
          dy: pan.y,
        },
      ],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (e, gesture) => {
      let finalX = gesture.moveX;
      let finalY = gesture.moveY;

      // Ensure the button stays within screen bounds with some padding
      const buttonSize = 28;
      const padding = 5;
      const bottomTabHeight = 60; // Approximate bottom tab height
      
      if (finalX < padding) finalX = padding;
      if (finalX > width - buttonSize - padding) finalX = width - buttonSize - padding;
      if (finalY < padding) finalY = padding;
      if (finalY > height - buttonSize - bottomTabHeight - padding) {
        finalY = height - buttonSize - bottomTabHeight - padding;
      }

      Animated.spring(pan, {
        toValue: { x: finalX - buttonSize/2, y: finalY - buttonSize/2 },
        useNativeDriver: false,
        friction: 5,
        tension: 40
      }).start();
    },
  })).current;

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    }
  }, [onPress]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <MaterialIcons name="support-agent" size={14} color={colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: scale(28),
    height: scale(28),
    borderRadius: 14,
    backgroundColor: colors.Zypsii_color,
    justifyContent: 'center',
    alignItems: 'center',
    // Simplified shadows for better performance
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});

export default FloatingSupportButton; 