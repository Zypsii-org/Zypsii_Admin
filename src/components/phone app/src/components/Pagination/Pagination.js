import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { interpolate, Extrapolation, useAnimatedStyle } from 'react-native-reanimated';

const Pagination = ({ data, x, screenWidth }) => {
  return (
    <View style={styles.container}>
      {data.map((_, index) => {
        // Create animated styles for each dot
        const animatedStyle = useAnimatedStyle(() => {
          const inputRange = [
            (index - 1) * screenWidth, // Previous page
            index * screenWidth,       // Current page
            (index + 1) * screenWidth, // Next page
          ];

          // Width animation for the dots
          const width = interpolate(
            x.value, // Shared value
            inputRange,
            [8, 16, 8], // Output range for width
            Extrapolation.CLAMP
          );

          // Opacity animation for the dots
          const opacity = interpolate(
            x.value, // Shared value
            inputRange,
            [0.3, 1, 0.3], // Output range for opacity
            Extrapolation.CLAMP
          );

          return {
            width,
            opacity,
          };
        });

        return (
          <Animated.View
            key={index.toString()}
            style={[styles.dot, animatedStyle]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
});

export default Pagination;
