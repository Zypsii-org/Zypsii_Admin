import React from 'react';
import { View, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

const SkeletonLoader = ({ width, height, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: '#E1E9EE',
          opacity,
          borderRadius: 4,
        },
        style,
      ]}
    />
  );
};

export const ProfileSkeleton = () => (
  <View style={{ alignItems: 'center', padding: 20 }}>
    <SkeletonLoader width={100} height={100} style={{ borderRadius: 50 }} />
    <SkeletonLoader width={150} height={20} style={{ marginTop: 10 }} />
    <SkeletonLoader width={200} height={15} style={{ marginTop: 5 }} />
  </View>
);

export const StatsSkeleton = () => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 20 }}>
    <View style={{ alignItems: 'center' }}>
      <SkeletonLoader width={40} height={20} />
      <SkeletonLoader width={60} height={15} style={{ marginTop: 5 }} />
    </View>
    <View style={{ alignItems: 'center' }}>
      <SkeletonLoader width={40} height={20} />
      <SkeletonLoader width={60} height={15} style={{ marginTop: 5 }} />
    </View>
    <View style={{ alignItems: 'center' }}>
      <SkeletonLoader width={40} height={20} />
      <SkeletonLoader width={60} height={15} style={{ marginTop: 5 }} />
    </View>
  </View>
);

export const GridSkeleton = () => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 5 }}>
    {[...Array(6)].map((_, index) => (
      <View key={index} style={{ width: '33.33%', padding: 5 }}>
        <SkeletonLoader width="100%" height={120} />
        <SkeletonLoader width="80%" height={15} style={{ marginTop: 5 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
          <SkeletonLoader width={30} height={15} />
          <SkeletonLoader width={30} height={15} />
        </View>
      </View>
    ))}
  </View>
);

export const ScheduleSkeleton = () => (
  <View style={{ padding: 15 }}>
    {[...Array(3)].map((_, index) => (
      <View key={index} style={{ marginBottom: 15 }}>
        <SkeletonLoader width="100%" height={180} />
        <View style={{ padding: 15 }}>
          <SkeletonLoader width="60%" height={20} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <SkeletonLoader width="40%" height={15} />
              <SkeletonLoader width="80%" height={15} style={{ marginTop: 5 }} />
            </View>
            <View style={{ flex: 1 }}>
              <SkeletonLoader width="40%" height={15} />
              <SkeletonLoader width="80%" height={15} style={{ marginTop: 5 }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <SkeletonLoader width={80} height={15} />
            <SkeletonLoader width={80} height={15} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

export default SkeletonLoader; 