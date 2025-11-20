import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import { colors } from '../../utils';
import { useToast } from '../../context/ToastContext';

const categories = [
  'Food',
  'Transportation',
  'Accommodation',
  'Entertainment',
  'Shopping',
  'Other'
];

const ExpenseCalculator = ({ navigation }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [numberOfMembers, setNumberOfMembers] = useState('');
  const [members, setMembers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleNext = () => {
    switch (step) {
      case 1:
        if (!expenseAmount || isNaN(expenseAmount) || parseFloat(expenseAmount) <= 0) {
          showToast('Please enter a valid expense amount', 'error');
          return;
        }
        break;
      case 2:
        if (!selectedCategory) {
          showToast('Please select a category', 'error');
          return;
        }
        break;
      case 3:
        if (!description.trim()) {
          showToast('Please enter a description', 'error');
          return;
        }
        break;
      case 4:
        if (!numberOfMembers || isNaN(numberOfMembers) || parseInt(numberOfMembers) <= 0) {
          showToast('Please enter a valid number of members', 'error');
          return;
        }
        break;
    }
    setStep(step + 1);
  };

  const handleCalculate = () => {
    const num = parseInt(numberOfMembers);
    const amount = parseFloat(expenseAmount);

    const splitAmount = (amount / num).toFixed(2);
    const newMembers = Array(num).fill(null).map((_, index) => ({
      id: index + 1,
      name: `Member ${index + 1}`,
      amount: splitAmount,
      paid: false,
    }));

    setMembers(newMembers);
    setShowResults(true);
    showToast('Expense split calculated successfully', 'success');
  };

  const togglePaidStatus = (memberId) => {
    setMembers(members.map(member => 
      member.id === memberId 
        ? { ...member, paid: !member.paid }
        : member
    ));
    const member = members.find(m => m.id === memberId);
    showToast(`${member.name} marked as ${member.paid ? 'unpaid' : 'paid'}`, 'success');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Enter Expense Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              placeholder="Enter amount"
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.selectedCategory
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.selectedCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Add Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
            />
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Number of Members</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={numberOfMembers}
              onChangeText={setNumberOfMembers}
              placeholder="Enter number of members"
            />
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.summaryTitle}>Expense Summary</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Category:</Text>
              <Text style={styles.summaryValue}>{selectedCategory}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Description:</Text>
              <Text style={styles.summaryValue}>{description}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Members:</Text>
              <Text style={styles.summaryValue}>{numberOfMembers}</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Calculator</Text>
      </View>

      <ScrollView style={styles.content}>
        {renderStep()}

        {!showResults && (
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={step === 5 ? handleCalculate : handleNext}
          >
            <Text style={styles.nextButtonText}>
              {step === 5 ? 'Calculate Split' : 'Next'}
            </Text>
          </TouchableOpacity>
        )}

        {showResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Split Details</Text>
            {members.map(member => (
              <TouchableOpacity 
                key={member.id}
                style={[
                  styles.memberCard,
                  member.paid && styles.memberCardPaid
                ]}
                onPress={() => togglePaidStatus(member.id)}
              >
                <Text style={styles.memberName}>{member.name}</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.amount}>₹{member.amount}</Text>
                  <Text style={styles.paidStatus}>
                    {member.paid ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExpenseCalculator;