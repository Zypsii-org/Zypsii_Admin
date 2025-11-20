import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TextDefault from "../../components/Text/TextDefault/TextDefault";
import { alignment, colors, scale } from "../../utils";

function Review() {
  const [description, setDescription] = useState("");

  const comments = [
    {
      id: 1,
      user: "Emily Johnson",
      date: "January 10, 2025 - 15:45",
      comment:
        "This app has completely changed the way I manage my appointments. Highly recommend!",
      reactions: { like: 12, dislike: 0 },
      avatar: "https://i.pravatar.cc/150?img=11",
    },
    {
      id: 2,
      user: "Michael Williams",
      date: "January 9, 2025 - 10:30",
      comment:
        "Great interface and easy to use. Could use some improvements in loading speed, though.",
      reactions: { like: 8, dislike: 2 },
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 3,
      user: "Sophia Brown",
      date: "January 8, 2025 - 18:20",
      comment:
        "Absolutely love the reminders feature! It keeps me on track every day.",
      reactions: { like: 10, dislike: 1 },
      avatar: "https://i.pravatar.cc/150?img=13",
    },
  ];

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <View style={styles.avatarUserContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <TextDefault style={styles.userName}>{item.user}</TextDefault>
          <TextDefault style={styles.commentDate}>{item.date}</TextDefault>
        </View>
      </View>
      <View style={styles.commentContent}>
        <TextDefault style={styles.commentText}>{item.comment}</TextDefault>
        <View style={styles.reactions}>
          <View style={styles.reactionLike}>
            <TextDefault style={styles.reactionText}>👍 {item.reactions.like}</TextDefault>
          </View>
          <View style={styles.reactionDislike}>
            <TextDefault style={styles.reactionText}>👎 {item.reactions.dislike}</TextDefault>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TextDefault style={styles.header}>Reviews</TextDefault>
      <View style={styles.reviewStats}>
        <TextDefault style={styles.statsText}>200 Comments</TextDefault>
        <TextDefault style={styles.statsText}>155 Saved</TextDefault>
      </View>
      <TextDefault style={styles.leavetext}>Leave a Comment</TextDefault>
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Share your thoughts..."
          placeholderTextColor={colors.fontThirdColor}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.sendButton}>
          <TextDefault style={styles.sendButtonText}>Send</TextDefault>
        </TouchableOpacity>
      </View>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderComment}
        contentContainerStyle={styles.commentsList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: scale(20),
  },
  header: {
    fontSize: scale(20),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: scale(10),
  },
  reviewStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(20),
  },
  leavetext: {
    ...alignment.MBsmall,
  },
  statsText: {
    fontSize: scale(14),
    color: colors.fontThirdColor,
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(20),
    borderWidth: 2,
    borderColor: colors.grayLinesColor,
    borderRadius: scale(15),
    paddingHorizontal: scale(10),
  },
  input: {
    flex: 1,
    fontSize: scale(14),
    color: colors.fontMainColor,
    paddingVertical: scale(18),
  },
  sendButton: {
    backgroundColor: colors.btncolor,
    paddingVertical: scale(13),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
  },
  sendButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },
  commentsList: {
    paddingBottom: scale(20),
  },
  commentContainer: {
    backgroundColor: colors.lightBlue,
    borderRadius: scale(10),
    padding: scale(10),
    marginBottom: scale(15),
  },
  avatarUserContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(5),
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(10),
  },
  userInfo: {
    flexDirection: "column",
  },
  userName: {
    fontSize: scale(14),
    fontWeight: "bold",
    color: colors.black,
  },
  commentDate: {
    fontSize: scale(12),
    color: colors.fontThirdColor,
  },
  commentText: {
    fontSize: scale(12),
    color: colors.fontSecondColor,
    marginBottom: scale(10),
  },
  reactions: {
    flexDirection: "row",
  },
  reactionLike: {
    backgroundColor: colors.blueButton,
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    marginRight: scale(10),
  },
  reactionDislike: {
    backgroundColor: colors.blueColor,
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
  },
  reactionText: {
    color: colors.white,
    fontSize: scale(12),
  },
});

export default Review;
