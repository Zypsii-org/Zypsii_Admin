import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const AnimatedView = Animated.View;

const SkeletonLoader = ({ 
  count = 6, 
  circleSize = 68, 
  textWidth = 40, 
  textHeight = 10,
  containerStyle,
  circleStyle,
  textStyle
}) => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const renderSkeletonItem = () => (
    <View style={[styles.container, containerStyle]}>
      <AnimatedView
        style={[
          styles.circle, 
          { width: circleSize, height: circleSize, opacity }, 
          circleStyle
        ]}
      />
      <AnimatedView
        style={[
          styles.text, 
          { 
            width: textWidth, 
            height: textHeight, 
            opacity,
            marginTop: circleSize * 0.1 
          },
          textStyle
        ]}
      />
    </View>
  );

  return (
    <View style={styles.row}>
      {Array(count).fill(0).map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeletonItem()}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 20,
  },
  container: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  circle: {
    backgroundColor: '#e1e1e1',
    borderRadius: 100,
  },
  text: {
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    alignSelf: 'center',
  },
});

export default SkeletonLoader;