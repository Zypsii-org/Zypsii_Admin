import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const Hexagon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.hexagon}>
        <View style={styles.hexagonInner}>
          {/* Use proper alignment for the Icon */}
          <Icon name="plus" size={24} color="#fff" style={styles.icon} />
        </View>
        <View style={styles.hexagonBefore} />
        <View style={styles.hexagonAfter} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginLeft: 8,
  },
  hexagon: {
    width: 60,
    height: 33,
    position: 'relative',
    justifyContent: 'center', // Centers the content vertically
    alignItems: 'center', // Centers the content horizontally
  },
  hexagonInner: {
    width: 60,
    height: 33,
    backgroundColor: '#ff3873',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 1, // Ensures the inner part stays above the before/after parts
  },
  hexagonAfter: {
    position: 'absolute',
    bottom: -16, // Ensures proper placement of the bottom triangle
    left: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 30,
    borderLeftColor: 'transparent',
    borderRightWidth: 30,
    borderRightColor: 'transparent',
    borderTopWidth: 16,
    borderTopColor: '#ff3873',
    zIndex: 0, // Keeps it below the inner hexagon
  },
  hexagonBefore: {
    position: 'absolute',
    top: -16, // Ensures proper placement of the top triangle
    left: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 30,
    borderLeftColor: 'transparent',
    borderRightWidth: 30,
    borderRightColor: 'transparent',
    borderBottomWidth: 16,
    borderBottomColor: '#ff3873',
    zIndex: 0, // Keeps it below the inner hexagon
  },
  icon: {
    // Optional: Add margins or adjust if needed
  },
});

export default Hexagon;
