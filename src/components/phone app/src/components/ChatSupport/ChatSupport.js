import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Animated,
  Vibration,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, scale } from '../../utils';

// Haptics fallback implementation
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch (error) {
  // Haptics not available, will use Vibration API as fallback
  Haptics = {
    impactAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: {
      Light: 'light',
      Medium: 'medium',
      Heavy: 'heavy'
    }
  };
}

const { width, height } = Dimensions.get('window');

const faqCategories = [
  {
    id: 'travel',
    title: 'Travel Planning',
    icon: 'map-marker-path',
    color: '#FF6B6B',
    questions: [
      {
        id: 1,
        question: "How do I create a travel schedule?",
        answer: "To create a travel schedule:\n1. Go to 'Schedule' tab\n2. Click 'Create New Schedule'\n3. Select your destination\n4. Choose dates\n5. Add activities\n6. Save your schedule"
      },
      {
        id: 2,
        question: "How do I find best places to visit?",
        answer: "You can find best places by:\n1. Checking 'Best Destination' section\n2. Using 'Discover by Interest'\n3. Exploring 'Discover by Nearest'\n4. Viewing popular destinations in 'All Destination'"
      },
      {
        id: 3,
        question: "How do I share my travel plans?",
        answer: "To share your travel plans:\n1. Open your schedule\n2. Click the share icon\n3. Choose sharing method\n4. Select contacts to share with"
      }
    ]
  },
  {
    id: 'companions',
    title: 'Travel Companions',
    icon: 'account-group',
    color: '#4ECDC4',
    questions: [
      {
        id: 4,
        question: "How do I find travel companions?",
        answer: "To find travel companions:\n1. Create a public schedule\n2. Enable 'Find Companions' option\n3. View and accept companion requests\n4. Chat with potential companions"
      },
      {
        id: 5,
        question: "How do I manage companion requests?",
        answer: "To manage companion requests:\n1. Go to 'Companions' tab\n2. View pending requests\n3. Accept or decline requests\n4. Message accepted companions"
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Settings',
    icon: 'account-cog',
    color: '#45B7D1',
    questions: [
      {
        id: 6,
        question: "How do I update my profile?",
        answer: "To update your profile:\n1. Go to 'Profile' tab\n2. Click 'Edit Profile'\n3. Update your information\n4. Save changes"
      },
      {
        id: 7,
        question: "How do I change notification settings?",
        answer: "To change notifications:\n1. Go to 'Settings'\n2. Select 'Notifications'\n3. Toggle desired notifications\n4. Save preferences"
      }
    ]
  },
  {
    id: 'features',
    title: 'App Features',
    icon: 'apps',
    color: '#96CEB4',
    questions: [
      {
        id: 8,
        question: "How do I use the map feature?",
        answer: "To use the map:\n1. Open 'Discover' tab\n2. Click map icon\n3. View nearby places\n4. Get directions to locations"
      },
      {
        id: 9,
        question: "How do I save favorite places?",
        answer: "To save favorites:\n1. Find a place you like\n2. Click the heart icon\n3. View saved places in 'Favorites'\n4. Access them anytime"
      }
    ]
  }
];

const ChatSupport = React.memo(({ visible, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [customQuestion, setCustomQuestion] = useState('');
  
  // Use refs to prevent recreation of animated values
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(height)).current;
  const categoryAnimations = useRef(
    faqCategories.map(() => new Animated.Value(1))
  ).current;

  // Memoize haptic feedback function to prevent recreation
  const triggerHapticFeedback = useCallback((style = 'Light') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);
    } else {
      Vibration.vibrate(style === 'Medium' ? 100 : 50);
    }
  }, []);

  // Optimize animation effect
  useEffect(() => {
    if (visible) {
      // Use parallel animations instead of staggered for faster opening
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 250, // Reduced duration
          useNativeDriver: true,
        }),
        Animated.timing(modalAnimation, {
          toValue: 1,
          duration: 250, // Reduced duration
          useNativeDriver: true,
        }),
        // Simplified category animations - no staggering
        ...categoryAnimations.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        )
      ]).start();
    } else {
      // Faster closing animation
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, slideAnimation, modalAnimation, categoryAnimations]);

  const handleCategorySelect = useCallback((category, index) => {
    triggerHapticFeedback('Light');

    // Simplified press animation
    Animated.sequence([
      Animated.timing(categoryAnimations[index], {
        toValue: 0.95,
        duration: 50, // Faster animation
        useNativeDriver: true,
      }),
      Animated.timing(categoryAnimations[index], {
        toValue: 1,
        duration: 50, // Faster animation
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedCategory(category);
    setSelectedQuestion(null);
  }, [categoryAnimations, triggerHapticFeedback]);

  const handleQuestionSelect = useCallback((question) => {
    triggerHapticFeedback('Light');
    setSelectedQuestion(question);
  }, [triggerHapticFeedback]);

  const handleBackToCategories = useCallback(() => {
    triggerHapticFeedback('Light');
    setSelectedCategory(null);
    setSelectedQuestion(null);
  }, [triggerHapticFeedback]);

  const handleBackToQuestions = useCallback(() => {
    triggerHapticFeedback('Light');
    setSelectedQuestion(null);
  }, [triggerHapticFeedback]);

  const handleSendCustomQuestion = useCallback(() => {
    if (customQuestion.trim()) {
      triggerHapticFeedback('Medium');
      setSelectedQuestion({
        id: 'custom',
        question: customQuestion,
        answer: "Thank you for your question. Our support team will get back to you shortly."
      });
      setCustomQuestion('');
    }
  }, [customQuestion, triggerHapticFeedback]);

  // Memoize content rendering
  const renderContent = useMemo(() => {
    if (selectedQuestion) {
      return (
        <View style={styles.messageContainer}>
          <View style={styles.questionBubble}>
            <Text style={styles.questionText}>{selectedQuestion.question}</Text>
          </View>
          <View style={styles.answerBubble}>
            <Text style={styles.answerText}>{selectedQuestion.answer}</Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToQuestions}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={16} color={colors.white} />
            <Text style={styles.backButtonText}>Back to Questions</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (selectedCategory) {
      return (
        <View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToCategories}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={16} color={colors.white} />
            <Text style={styles.backButtonText}>Back to Categories</Text>
          </TouchableOpacity>
          
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
              <MaterialCommunityIcons name={selectedCategory.icon} size={24} color="white" />
            </View>
            <Text style={styles.sectionTitle}>{selectedCategory.title}</Text>
          </View>
          
          {selectedCategory.questions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.questionItem}
              onPress={() => handleQuestionSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.questionItemText}>{item.question}</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.fontMainColor} />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeIcon}>
            <MaterialCommunityIcons name="headset" size={32} color={colors.greenColor} />
          </View>
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeSubtitle}>Choose a category to get started</Text>
        </View>
        
        {faqCategories.map((category, index) => (
          <Animated.View
            key={category.id}
            style={{
              transform: [{ scale: categoryAnimations[index] }],
              opacity: categoryAnimations[index],
            }}
          >
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => handleCategorySelect(category, index)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <MaterialCommunityIcons name={category.icon} size={24} color="white" />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categorySubtitle}>
                  {category.questions.length} questions available
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.fontMainColor} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </>
    );
  }, [selectedQuestion, selectedCategory, categoryAnimations, handleCategorySelect, handleQuestionSelect, handleBackToCategories, handleBackToQuestions]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Animated.View 
        style={[
          styles.modalContainer,
          { opacity: modalAnimation }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnimation }] }
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name="headset" size={24} color={colors.greenColor} />
              <Text style={styles.headerText}>Travel Support</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <MaterialIcons name="close" size={24} color={colors.fontMainColor} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.chatContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          >
            {renderContent}
          </ScrollView>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.input}
              placeholder="Type your question here..."
              placeholderTextColor={colors.fontThirdColor}
              value={customQuestion}
              onChangeText={setCustomQuestion}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: customQuestion.trim() ? colors.greenColor : colors.darkGrayText }
              ]}
              onPress={handleSendCustomQuestion}
              activeOpacity={0.7}
              disabled={!customQuestion.trim()}
            >
              <MaterialIcons name="send" size={20} color={colors.white} />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '75%',
    // Simplified shadows for better performance
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  chatContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  welcomeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.fontSecondColor,
    textAlign: 'center',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    // Simplified shadows
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryContent: {
    flex: 1,
    marginLeft: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 12,
    color: colors.fontSecondColor,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    // Simplified shadows
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  questionItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.fontMainColor,
    marginRight: 12,
  },
  messageContainer: {
    paddingVertical: 10,
  },
  questionBubble: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
    maxWidth: width * 0.8,
    // Simplified shadows
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  answerBubble: {
    backgroundColor: colors.greenColor,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: 'flex-end',
    maxWidth: width * 0.8,
    // Simplified shadows
    elevation: 2,
    shadowColor: colors.greenColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  questionText: {
    color: colors.fontMainColor,
    fontSize: 14,
    lineHeight: 20,
  },
  answerText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenColor,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 16,
    // Simplified shadows
    elevation: 2,
    shadowColor: colors.greenColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: colors.white,
    minHeight: 60,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 14,
    maxHeight: 120,
    minHeight: 24,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // Simplified shadows
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
});

export default ChatSupport; 