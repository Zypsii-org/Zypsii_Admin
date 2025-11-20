import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedRef,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import data from '../../data/data';
import styles from './styles';
import { Pagination, CustomButton } from '../../components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTutorialSeen, setTutorialSeen } from '../../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnboardingScreen = ({navigation}) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const flatListRef = useAnimatedRef(null);
  const x = useSharedValue(0);
  const flatListIndex = useSharedValue(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      const seen = await getTutorialSeen();
      const user = await AsyncStorage.getItem('user');
      
      if (seen && user) {
        // If user has seen tutorial and is logged in, go to main app
        navigation.replace('Drawer');
      } else if (seen && !user) {
        // If user has seen tutorial but not logged in, go to login
        navigation.replace('Login');
      }
    };
    
    checkTutorialStatus();
  }, []);

  // Stabilize onViewableItemsChanged using useRef
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    flatListIndex.value = viewableItems[0]?.index || 0;
  }).current;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  const handleTutorialComplete = async () => {
    await setTutorialSeen();
    const user = await AsyncStorage.getItem('user');
    if (user) {
      navigation.replace('Drawer');
    } else {
      navigation.replace('Login');
    }
  };

  const RenderItem = ({ item, index }) => {
    const imageAnimationStyle = useAnimatedStyle(() => {
      const opacityAnimation = interpolate(
        x.value,
        [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ],
        [0, 1, 0],
        Extrapolation.CLAMP
      );
      const translateYAnimation = interpolate(
        x.value,
        [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ],
        [100, 0, 100],
        Extrapolation.CLAMP
      );
      return {
        opacity: opacityAnimation,
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        transform: [{ translateY: translateYAnimation }],
        marginBottom: 100, // Add space below the image
      };
    });
  
    const textAnimationStyle = useAnimatedStyle(() => {
      const opacityAnimation = interpolate(
        x.value,
        [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ],
        [0, 1, 0],
        Extrapolation.CLAMP
      );
      const translateYAnimation = interpolate(
        x.value,
        [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ],
        [100, 0, 100],
        Extrapolation.CLAMP
      );
  
      return {
        opacity: opacityAnimation,
        transform: [{ translateY: translateYAnimation }],
      };
    });
  
    return (
      <View style={[styles.itemContainer, { width: SCREEN_WIDTH }]}>
        <Animated.Image source={item.image} style={imageAnimationStyle} />
        <Animated.View style={textAnimationStyle}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemText}>{item.text}</Text>
          <Text style={styles.itemText1}>{item.text1}</Text>
        </Animated.View>
      </View>
    );
  };
  

  return (
    <SafeAreaView style={styles.container}>
      {/* Onboarding FlatList */}
      <Animated.FlatList
        ref={flatListRef}
        onScroll={onScroll}
        data={data}
        renderItem={({ item, index }) => <RenderItem item={item} index={index} />}
        keyExtractor={(item) => item.id}
        scrollEventThrottle={16}
        horizontal
        bounces={false}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          minimumViewTime: 300,
          viewAreaCoveragePercentThreshold: 10,
        }}
      />

      {/* Pagination - Outside ItemContainer */}
      <View style={styles.paginationContainer}>
        
      </View>

      {/* Custom Button */}
      <View style={styles.bottomContainer}>
        <Pagination data={data} x={x} screenWidth={SCREEN_WIDTH} />
        <CustomButton
          flatListRef={flatListRef}
          flatListIndex={flatListIndex}
          dataLength={data.length}
          onComplete={handleTutorialComplete}
        />
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
