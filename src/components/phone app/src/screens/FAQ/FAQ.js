import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { useNavigation } from '@react-navigation/native';

function FAQ() {
  const navigation = useNavigation();
  const [expandedItem, setExpandedItem] = useState(null);

  const toggleExpand = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setExpandedItem(expandedItem === key ? null : key);
  };

  const faqData = [
    {
      category: 'Booking & Reservations',
      questions: [
        {
          question: 'How do I book a trip?',
          answer: 'You can book a trip by selecting your destination, dates, and travel preferences in our app. Follow the booking wizard to complete your reservation.'
        },
        {
          question: 'Can I modify my booking?',
          answer: 'Yes, you can modify your booking up to 48 hours before your trip. Go to "My Trips" and select the booking you wish to modify.'
        }
      ]
    },
    {
      category: 'Payment & Refunds',
      questions: [
        {
          question: 'What payment methods are accepted?',
          answer: 'We accept all major credit cards, debit cards, and digital payment methods like PayPal and Apple Pay.'
        },
        {
          question: 'What is your cancellation policy?',
          answer: 'You can cancel your booking up to 24 hours before the trip for a full refund. Cancellations within 24 hours may be subject to a fee.'
        }
      ]
    },
    {
      category: 'Travel & Safety',
      questions: [
        {
          question: 'What safety measures are in place?',
          answer: 'We follow all local health guidelines and ensure our partners maintain high safety standards. All vehicles are regularly sanitized.'
        },
        {
          question: 'Do I need travel insurance?',
          answer: 'While not mandatory, we strongly recommend purchasing travel insurance for international trips to cover unexpected situations.'
        }
      ]
    }
  ];

  return (
    <>
      <StatusBar 
        backgroundColor={colors.Zypsii_color} 
        barStyle="light-content" 
        translucent={false}
      />
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQ</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.title}>Frequently Asked Questions</Text>
          <Text style={styles.subtitle}>Find answers to common questions about our services</Text>
          
          {faqData.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <Ionicons 
                  name="help-circle" 
                  size={24} 
                  color={colors.Zypsii_color} 
                  style={styles.categoryIcon}
                />
                <Text style={styles.categoryTitle}>{category.category}</Text>
              </View>
              {category.questions.map((item, qIndex) => {
                const isExpanded = expandedItem === `${categoryIndex}-${qIndex}`;
                return (
                  <TouchableOpacity 
                    key={qIndex} 
                    style={styles.questionContainer}
                    onPress={() => toggleExpand(categoryIndex, qIndex)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.questionHeader}>
                      <Text style={styles.question}>{item.question}</Text>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colors.Zypsii_color} 
                      />
                    </View>
                    {isExpanded && (
                      <Text style={styles.answer}>{item.answer}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Contact Support Section */}
          <View style={styles.supportContainer}>
            <Ionicons name="chatbubble-ellipses" size={40} color={colors.Zypsii_color} />
            <Text style={styles.supportTitle}>Still have questions?</Text>
            <Text style={styles.supportText}>Our support team is here to help you</Text>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.themeBackground,
  },
  header: {
    backgroundColor: colors.Zypsii_color,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  paddingTop:StatusBar.currentHeight || 0,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.fontThirdColor,
    marginBottom: 30,
    lineHeight: 20,
  },
  categoryContainer: {
    marginBottom: 25,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.lightpink,
  },
  categoryIcon: {
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.Zypsii_color,
    flex: 1,
  },
  questionContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: colors.lightpink,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    flex: 1,
    marginRight: 10,
    lineHeight: 22,
  },
  answer: {
    fontSize: 14,
    color: colors.fontSecondColor,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightHorizontalLine,
  },
  supportContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginTop: 15,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: colors.fontThirdColor,
    textAlign: 'center',
    marginBottom: 20,
  },
  supportButton: {
    backgroundColor: colors.Zypsii_color,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: colors.Zypsii_color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  supportButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FAQ; 