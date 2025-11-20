import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const Toast = ({ message, type = 'success', visible, onHide, duration = 3000 }) => {
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'x-circle';
      case 'warning':
        return 'alert-circle';
      default:
        return 'info';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          background: '#ff3873',
          iconBackground: '#8B0D7A',
          border: '#C412A6'
        };
      case 'error':
        return {
          background: '#FF0000',
          iconBackground: '#CC0000',
          border: '#FF3333'
        };
      case 'warning':
        return {
          background: '#FFA000',
          iconBackground: '#E68A00',
          border: '#FFB033'
        };
      default:
        return {
          background: '#ff3873',
          iconBackground: '#8B0D7A',
          border: '#C412A6'
        };
    }
  };

  if (!visible) return null;

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.toastContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.iconBackground }]}>
          <Feather name={getIcon()} size={20} color="white" />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 50,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    width: width - 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  message: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default Toast; 