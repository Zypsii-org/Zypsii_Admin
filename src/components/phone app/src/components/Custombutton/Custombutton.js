import { StyleSheet, Text, TouchableWithoutFeedback, Image } from "react-native";
import React from "react";
import { colors } from "../../utils";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const CustomButton = ({ flatListRef, flatListIndex, dataLength, onComplete }) => {
  const buttonAnimationStyle = useAnimatedStyle(() => {
    return {
      width:
        flatListIndex.value === dataLength - 1
          ? withSpring(140)
          : withSpring(60),
      height: 60,
    };
  });

  const arrowAnimationStyle = useAnimatedStyle(() => {
    return {
      width: 30,
      height: 30,
      opacity:
        flatListIndex.value === dataLength - 1 ? withTiming(0) : withTiming(1),
      transform: [
        {
          translateX:
            flatListIndex.value === dataLength - 1
              ? withTiming(100)
              : withTiming(0),
        },
      ],
    };
  });

  const textAnimationStyle = useAnimatedStyle(() => {
    return {
      opacity:
        flatListIndex.value === dataLength - 1 
        ? withTiming(1) 
        : withTiming(0),
      transform: [
        {
          translateX:
            flatListIndex.value === dataLength - 1
              ? withTiming(0)
              : withTiming(-100),
        },
      ],
    };
  });

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (flatListIndex.value < dataLength - 1) {
          flatListRef.current.scrollToIndex({
            index: flatListIndex.value + 1,
          });
        } else {
          // Call the onComplete callback when tutorial is finished
          onComplete();
        }
      }}
    >
      <Animated.View style={[styles.container, buttonAnimationStyle]}>
        <Animated.Text style={[styles.textbutton, textAnimationStyle]}>
          Get started
        </Animated.Text>
        <Animated.Image
          source={require("../../assets/arrowicon.png")}
          style={[styles.arrow, arrowAnimationStyle]}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.btncolor,
    padding: 10,
    borderRadius: 100,
    justifyContent: "center", // Center items vertically
    alignItems: "center",     // Center items horizontally
    overflow: "hidden",       // Ensure children stay inside the container
  },
  arrow: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    fontSize: 'bold'   // Ensure the image scales within the given size
  },
  textbutton: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    position: "absolute",
  },
});
