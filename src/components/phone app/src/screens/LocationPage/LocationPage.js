import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../utils";
import { color } from "react-native-reanimated";

function LocationPage({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.circleContainer}>
        <Image
          source={require("../../assets/illustration.png")} // Replace with your location icon image
          style={styles.image}
        />
      </View>
      <Text style={styles.title}>Select Your Location</Text>
      <Text style={styles.subtitle}>
        We need to know your location in order to suggest nearby services.
      </Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Allow Location Access</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  circleContainer: {
    width: 160, // Diameter of the circle
    height: 160, // Diameter of the circle
    backgroundColor: colors.backgroudGray, // Gray color
    borderRadius: 80, // Makes the shape circular
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.fontMainColor,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.fontSecondColor,
    marginBottom: 30,
    justifyContent: "flex-start"
  },
  button: {
    backgroundColor: colors.btncolor,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    width: '100%'
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LocationPage;
