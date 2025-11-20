import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../utils";

function CreatePoll() {
  const [selectedOption, setSelectedOption] = useState(null);

  const pollOptions = [
    { id: 1, option: "Yes", percentage: 30 },
    { id: 2, option: "No", percentage: 90 },
    { id: 3, option: "Change Trip Place", percentage: 20 },
  ];

  const votedMembers = [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
    "https://i.pravatar.cc/150?img=4",
    "https://i.pravatar.cc/150?img=5",
  ];

  const handleOptionSelect = (id) => {
    setSelectedOption(id);
  };

  const renderPollOption = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleOptionSelect(item.id)}
      activeOpacity={0.8}
      style={styles.pollOptionContainer}
    >
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFilled,
            { width: `${item.percentage}%` },
            selectedOption === item.id && styles.selectedProgressBar,
          ]}
        >
          <View style={styles.optionContent}>
            <View
              style={[
                styles.radioCircle,
                selectedOption === item.id && styles.selectedRadioCircle,
              ]}
            />
            <View>
              <Text
                style={[
                  styles.optionText,
                  selectedOption === item.id && styles.selectedText,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.option}
              </Text>
              <Text
                style={[
                  styles.percentageText,
                  selectedOption === item.id && styles.selectedText,
                ]}
              >
                {item.percentage}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Create Poll</Text>
        <TouchableOpacity style={styles.closeIconContainer}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <Text style={styles.questionText}>Which place you like to visit</Text>
      <FlatList
        data={pollOptions}
        renderItem={renderPollOption}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.pollList}
      />
      <View style={styles.votedMembersContainer}>
        <Text style={styles.votedMembersText}>Voted members</Text>
        <View style={styles.avatarsRow}>
          {votedMembers.map((avatar, index) => (
            <Image
              key={index}
              source={{ uri: avatar }}
              style={[
                styles.avatar,
                { marginLeft: index === 0 ? 0 : -15 }, // Overlap effect
              ]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FCFF",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  closeIconContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
  },
  questionText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 80,
  },
  pollList: {
    marginBottom: 30,
  },
  pollOptionContainer: {
    marginBottom: 35,
  },
  progressBarBackground: {
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: "hidden",
  },
  progressBarFilled: {
    height: "100%",
    backgroundColor: colors.graycolor,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  selectedProgressBar: {
    backgroundColor: colors.btncolor,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    width: 30,
    height: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.darkGrayText,
    marginRight: 15,
  },
  selectedRadioCircle: {
    borderColor: "#fff",
    backgroundColor: "#fff",
  },
  optionText: {
    fontSize: 18,
    color: colors.darkGrayText,
  },
  percentageText: {
    fontSize: 18,
    color: colors.fontMainColor,
    marginTop: 4,
  },
  selectedText: {
    color: "#fff",
  },
  votedMembersContainer: {
    marginTop: 20,
    marginBottom: 120,
  },
  votedMembersText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
  },
});

export default CreatePoll;
