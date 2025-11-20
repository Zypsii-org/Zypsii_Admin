import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setUserPreferences } from '../redux/slices/userSlice';

const categories = [
  { id: 1, name: 'Restaurants', icon: '🍽️' },
  { id: 2, name: 'Parks', icon: '🌳' },
  { id: 3, name: 'Museums', icon: '🏛️' },
  { id: 4, name: 'Cafes', icon: '☕' },
  { id: 5, name: 'Beaches', icon: '🏖️' },
  { id: 6, name: 'Shopping', icon: '🛍️' },
  { id: 7, name: 'Entertainment', icon: '🎭' },
  { id: 8, name: 'Sports', icon: '⚽' },
];

const WelcomeScreen = ({ navigation }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const dispatch = useDispatch();

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleSubmit = async () => {
    const selectedCategoryNames = categories
      .filter((cat) => selectedCategories.includes(cat.id))
      .map((cat) => cat.name);
    
    // Save preferences to Redux store
    dispatch(setUserPreferences(selectedCategoryNames));
    
    // Navigate to main screen
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>
          Let's personalize your experience. What types of places do you love to explore?
        </Text>
        
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTile,
                selectedCategories.includes(category.id) && styles.selectedTile,
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            selectedCategories.length === 0 && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={selectedCategories.length === 0}
        >
          <Text style={styles.submitButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 24,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  categoryTile: {
    width: '48%',
    aspectRatio: 1.5,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTile: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen; 