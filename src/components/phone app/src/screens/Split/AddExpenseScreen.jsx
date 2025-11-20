import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useSplit } from '../../context/SplitContext';
import { useToast } from '../../context/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddExpenseScreen = ({ navigation, route }) => {
  const { groupId } = route.params || {};
  const { createExpense, groups, loading } = useSplit();
  const { showToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitAmounts, setSplitAmounts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedParticipants, setSelectedParticipants] = useState({});
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  const categories = [
    'Food',
    'Transportation',
    'Accommodation',
    'Entertainment',
    'Shopping',
    'Other'
  ];

  // Fetch logged-in user on mount
  useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setLoggedInUser(user);
        }
      } catch (e) {
        setLoggedInUser(null);
      }
    })();
  }, []);

  // Set group and participants
  useEffect(() => {
    if (groupId) {
      const foundGroup = groups.find(g => g._id === groupId);
      setGroup(foundGroup);
      if (foundGroup && foundGroup.members) {
        const initialSelected = {};
        foundGroup.members.forEach(member => {
          if (member?.user?._id) {
            initialSelected[member.user._id] = true;
          }
        });
        setSelectedParticipants(initialSelected);
      }
    }
  }, [groupId, groups]);

  // Check if current user is a group member
  useEffect(() => {
    if (loggedInUser && group) {
      const creatorId = group.creator?._id || group.creator;
      const userId = loggedInUser._id;
      const creatorCheck = creatorId?.toString() === userId?.toString();
      setIsCreator(creatorCheck);
      
      // Check if user is a member of the group
      const isMember = group.members?.some(member => {
        const memberId = member.user?._id || member.user;
        return memberId?.toString() === userId?.toString();
      });
      
      // If user is not a member, show error and go back
      if (!isMember) {
        showToast('You are not a member of this group', 'error');
        navigation.goBack();
      }
    }
  }, [loggedInUser, group, navigation, showToast]);

  // Set default payer logic
  useEffect(() => {
    if (loggedInUser && group?.members) {
      const selectedIds = Object.entries(selectedParticipants)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      if (!paidBy || !selectedIds.includes(paidBy)) {
        setPaidBy(loggedInUser._id);
      }
    }
  }, [loggedInUser, selectedParticipants, group]);

  // Calculate split amounts when total amount or selected participants change
  useEffect(() => {
    if (group?.members && totalAmount) {
      const selectedIds = Object.entries(selectedParticipants)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      const selectedCount = selectedIds.length;
      if (selectedCount > 0) {
        const total = Math.floor(parseFloat(totalAmount));
        const baseShare = Math.floor(total / selectedCount);
        let remainder = total - (baseShare * selectedCount);

        const newSplitAmounts = {};
        group.members.forEach((member) => {
          if (selectedParticipants[member.user?._id]) {
            let share = baseShare;
            if (remainder > 0) {
              share += 1;
              remainder -= 1;
            }
            newSplitAmounts[member.user?._id] = {
              value: share.toString(),
              isManuallyEdited: false
            };
          } else {
            newSplitAmounts[member.user?._id] = {
              value: '0',
              isManuallyEdited: false
            };
          }
        });
        setSplitAmounts(newSplitAmounts);
      }
    }
  }, [group, totalAmount, selectedParticipants]);

  const resetForm = () => {
    setStep(1);
    setTotalAmount('');
    setDescription('');
    setCategory('');
    setPaidBy('');
    setSplitAmounts({});
    setIsSubmitting(false);
    setErrors({});
    if (group?.members) {
      const initialSelected = {};
      group.members.forEach(member => {
        if (member?.user?._id) {
          initialSelected[member.user._id] = true;
        }
      });
      setSelectedParticipants(initialSelected);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!description.trim()) {
        setErrors(prev => ({ ...prev, description: 'Please enter a description' }));
        return;
      }
      if (!category) {
        setErrors(prev => ({ ...prev, category: 'Please select a category' }));
        return;
      }
      setErrors({});
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigation.goBack();
    }
  };

  const handleSplitEqually = () => {
    if (!totalAmount || isNaN(parseFloat(totalAmount))) return;

    const selectedCount = Object.values(selectedParticipants).filter(Boolean).length;
    if (selectedCount > 0) {
      const totalAmountNum = Math.floor(parseFloat(totalAmount));
      const baseShare = Math.floor(totalAmountNum / selectedCount);
      const remainder = totalAmountNum - (baseShare * selectedCount);
      
      const newSplitAmounts = {};
      let remainingAmount = remainder;

      Object.entries(selectedParticipants).forEach(([userId, isSelected], index) => {
        if (isSelected) {
          let share = baseShare;
          if (remainingAmount > 0) {
            share += 1;
            remainingAmount -= 1;
          }
          newSplitAmounts[userId] = {
            value: share.toString(),
            isManuallyEdited: false
          };
      } else {
          newSplitAmounts[userId] = {
            value: '0',
            isManuallyEdited: false
          };
        }
      });

      setSplitAmounts(newSplitAmounts);
      }
  };

  const handleAmountChange = (value) => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanedValue.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setTotalAmount(cleanedValue);
    setErrors(prev => ({ ...prev, amount: validateAmount(cleanedValue) }));
  };

  const validateAmount = (value) => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid amount';
    }
    return null;
  };

  const handleSubmit = async () => {
    try {
      let payerId = paidBy;
      let loginUserId = null;
      // Get the logged-in user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        loginUserId = user?._id;
      }
      if (!payerId) {
        payerId = loginUserId;
      }
      if (!payerId) {
        setErrors(prev => ({ ...prev, paidBy: 'Please select who paid' }));
      return;
    }

      if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
        setErrors(prev => ({ ...prev, amount: 'Please enter a valid amount' }));
      return;
    }

      setIsSubmitting(true);
      
      // Format split details according to backend expectations
      const splitDetails = Object.entries(selectedParticipants)
        .filter(([_, isSelected]) => isSelected)
        .map(([memberId]) => ({
          user: memberId,
          amount: parseFloat(splitAmounts[memberId]?.value || '0')
        }));

      // Check if any amounts have been manually edited to determine split type
      const hasManualEdits = Object.entries(splitAmounts)
        .some(([userId, amountData]) => 
          selectedParticipants[userId] && amountData?.isManuallyEdited
        );

      // Calculate total split amount to validate
      const totalSplitAmount = splitDetails.reduce((sum, detail) => sum + detail.amount, 0);
      const expenseAmount = parseFloat(totalAmount);

      // Validate that split amounts equal the total expense amount
      if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
        setErrors(prev => ({ 
          ...prev, 
          splitDetails: `Total split amount (₹${totalSplitAmount.toFixed(2)}) must equal expense amount (₹${expenseAmount.toFixed(2)})` 
        }));
        setIsSubmitting(false);
        return;
      }

      // Determine split type based on whether amounts were manually edited
      const splitType = hasManualEdits ? 'EXACT' : 'EQUAL';

      const expenseData = {
        description: description.trim(),
        amount: expenseAmount,
        group: groupId,
        paidBy: payerId,
        splitType: splitType,
        splitDetails: splitDetails,
        category: category.trim()
      };

      console.log('\n\nwhat is the expenseData:', expenseData);
      const success = await createExpense(expenseData);
      if (success) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      showToast(error.message || 'Failed to add expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSplitAmountChange = (userId, value) => {
    const newAmount = value.replace(/[^0-9.]/g, '');
    const newAmountNum = parseFloat(newAmount || '0');
    const totalAmountNum = parseFloat(totalAmount);

    if (newAmountNum > totalAmountNum) {
      showToast(`Amount cannot exceed total expense (₹${totalAmountNum})`, 'error');
      return;
    }

    const otherSelectedParticipants = Object.entries(selectedParticipants)
      .filter(([id, isSelected]) => {
        return isSelected && id !== userId && !splitAmounts[id]?.isManuallyEdited;
      })
      .map(([id]) => id);

    const newSplitAmounts = { ...splitAmounts };

    newSplitAmounts[userId] = {
      value: newAmount,
      isManuallyEdited: true
    };

    const manuallyEditedTotal = Object.entries(newSplitAmounts)
      .filter(([id, amount]) => amount?.isManuallyEdited)
      .reduce((sum, [_, amount]) => sum + parseFloat(amount.value || 0), 0);
    
    const remainingAmount = totalAmountNum - manuallyEditedTotal;

    if (manuallyEditedTotal >= totalAmountNum) {
      otherSelectedParticipants.forEach(participantId => {
        newSplitAmounts[participantId] = {
          value: '0',
          isManuallyEdited: false
        };
      });
    } else {
      if (otherSelectedParticipants.length > 0) {
        const sharePerParticipant = Math.max(0, (remainingAmount / otherSelectedParticipants.length).toFixed(2));
        let totalDistributed = 0;
        otherSelectedParticipants.forEach((participantId, index) => {
          if (index === otherSelectedParticipants.length - 1) {
            const lastAmount = Math.max(0, (remainingAmount - totalDistributed).toFixed(2));
            newSplitAmounts[participantId] = {
              value: lastAmount,
              isManuallyEdited: false
            };
          } else {
            newSplitAmounts[participantId] = {
              value: sharePerParticipant,
              isManuallyEdited: false
            };
            totalDistributed += parseFloat(sharePerParticipant);
          }
        });
      }
    }

    setSplitAmounts(newSplitAmounts);
  };

  const handleSelectPayer = (userId) => {
    setPaidBy(userId);
    setErrors(prev => ({ ...prev, paidBy: null }));
  };

  const handleParticipantToggle = (userId) => {
    setSelectedParticipants(prev => {
      const newSelected = { ...prev, [userId]: !prev[userId] };
      if (totalAmount) {
        const selectedIds = Object.entries(newSelected)
          .filter(([_, isSelected]) => isSelected)
          .map(([id]) => id);
        const selectedCount = selectedIds.length;
        if (selectedCount > 0) {
          const equalShare = (parseFloat(totalAmount) / selectedCount).toFixed(2);
          const newSplitAmounts = {};
          group?.members?.forEach(member => {
            if (newSelected[member.user?._id]) {
              newSplitAmounts[member.user?._id] = {
                value: equalShare,
                isManuallyEdited: false
              };
            } else {
              newSplitAmounts[member.user?._id] = {
                value: '0',
                isManuallyEdited: false
              };
            }
          });
          setSplitAmounts(newSplitAmounts);
        }
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const allSelected = {};
    group?.members?.forEach(member => {
      if (member?.user?._id) {
        allSelected[member.user._id] = true;
      }
    });
    setSelectedParticipants(allSelected);
    
    // Recalculate split amounts if total amount is set
    if (totalAmount && group?.members) {
      const selectedCount = group.members.length;
      if (selectedCount > 0) {
        const equalShare = (parseFloat(totalAmount) / selectedCount).toFixed(2);
        const newSplitAmounts = {};
        group.members.forEach(member => {
          newSplitAmounts[member.user?._id] = {
            value: equalShare,
            isManuallyEdited: false
          };
        });
        setSplitAmounts(newSplitAmounts);
      }
    }
  };

  const isAllSelected = group?.members && group.members.length > 0 && 
    Object.values(selectedParticipants).filter(Boolean).length === group.members.length;

  // Calculate current total split amount
  const currentTotalSplit = Object.entries(selectedParticipants)
    .filter(([_, isSelected]) => isSelected)
    .reduce((sum, [userId]) => sum + parseFloat(splitAmounts[userId]?.value || '0'), 0);

  // Check if split amounts are valid
  const isSplitValid = !totalAmount || Math.abs(currentTotalSplit - parseFloat(totalAmount || '0')) < 0.01;

  const renderStep1 = () => (
    <View style={styles.step1Container}>
      <ScrollView style={styles.screenBody}>
        <TextInput
          style={styles.descriptionInput}
          placeholder="What is this expense for?"
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            setErrors(prev => ({ ...prev, description: null }));
          }}
          placeholderTextColor={colors.fontSecondColor}
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}

        <View style={styles.categoryContainer}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
      <TouchableOpacity
                key={cat}
        style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive
        ]}
                onPress={() => {
                  setCategory(cat);
                  setErrors(prev => ({ ...prev, category: null }));
                }}
            >
              <Text style={[
                  styles.categoryButtonText,
                  category === cat && styles.categoryButtonTextActive
                ]}>{cat}</Text>
            </TouchableOpacity>
            ))}
        </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
          </View>
  );

  const renderStep2 = () => (
    <View style={styles.step2Container}>
      <ScrollView style={styles.screenBody}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>₹</Text>
            <TextInput
            style={styles.amountInput}
            value={totalAmount}
            onChangeText={handleAmountChange}
              keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.fontSecondColor}
            />
          </View>
        {errors.amount && (
          <Text style={styles.errorText}>{errors.amount}</Text>
        )}

                <TouchableOpacity
          style={styles.paidByButton}
          onPress={() => {
            // Show payer selection alert
            if (group?.members) {
              const options = group.members.map(member => ({
                text: member.user?.fullName || member.user?.userName || 'User',
                onPress: () => handleSelectPayer(member.user._id)
              }));
              // Add cancel option
              options.push({ text: 'Cancel', style: 'cancel' });
              
              // Show alert with options
              Alert.alert('Select Payer', 'Who paid for this expense?', options);
            }
          }}
                >
          <View style={styles.paidByContent}>
            <View style={styles.paidByLeft}>
              <Text style={styles.paidByLabel}>Paid by</Text>
              <Text style={[styles.paidByName, { color: colors.fontMainColor }]}>
                {paidBy
                  ? (
                      group?.members?.find(m => m.user?._id === paidBy)?.user?.fullName ||
                      (loggedInUser && paidBy === loggedInUser._id ? loggedInUser.fullName : 'User')
                    )
                  : (loggedInUser?.fullName || 'Select payer')}
                  </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.fontMainColor} />
          </View>
        </TouchableOpacity>
        {errors.paidBy && (
          <Text style={styles.errorText}>{errors.paidBy}</Text>
        )}

        <View style={styles.splitListContainer}>
          <View style={styles.splitListHeader}>
            <View style={styles.splitListHeaderLeft}>
              <Text style={styles.splitListTitle}>
                {`${Object.values(selectedParticipants).filter(Boolean).length} of ${group?.members?.length || 0} Selected`}
                  </Text>
            </View>
            <View style={styles.splitListHeaderRight}>
              <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSplitEqually} style={styles.splitEquallyButton}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={styles.splitEquallyText}>Split Equally</Text>
                </TouchableOpacity>
            </View>
          </View>
          
          {errors.splitDetails && (
            <Text style={styles.errorText}>{errors.splitDetails}</Text>
          )}

          {/* Total Split Amount Display */}
          {totalAmount && (
            <View style={[
              styles.totalSplitContainer,
              !isSplitValid && styles.totalSplitContainerError
            ]}>
              <Text style={styles.totalSplitLabel}>Total Split Amount:</Text>
              <Text style={[
                styles.totalSplitAmount,
                !isSplitValid && styles.totalSplitAmountError
              ]}>
                ₹{currentTotalSplit.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              💡 Tap on any amount to customize individual shares. Total must equal ₹{totalAmount || '0'}.
            </Text>
          </View>

          {/* Split Validation Message */}
          {totalAmount && !isSplitValid && (
            <View style={styles.validationMessageContainer}>
              <Text style={styles.validationMessageText}>
                ⚠️ Total split amount (₹{currentTotalSplit.toFixed(2)}) must equal expense amount (₹{parseFloat(totalAmount).toFixed(2)})
              </Text>
            </View>
          )}

          {group?.members?.map((member) => (
            <View key={member.user?._id} style={styles.splitListItem}>
              <TouchableOpacity
                style={styles.participantCheckbox}
                onPress={() => handleParticipantToggle(member.user?._id)}
              >
                <View style={[
                  styles.checkbox,
                  selectedParticipants[member.user?._id] && styles.checkboxSelected
                ]}>
                  {selectedParticipants[member.user?._id] && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
            )}
          </View>
                <View style={styles.participantInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {member.user?.fullName ? member.user.fullName.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <Text style={styles.participantName}>
                    {member.user?.fullName || 'User'}
                  </Text>
                </View>
              </TouchableOpacity>
            <View style={styles.splitAmountContainer}>
              <TextInput
                style={[
                  styles.splitAmountInput,
                  !selectedParticipants[member.user?._id] && styles.splitAmountInputDisabled,
                  splitAmounts[member.user?._id]?.isManuallyEdited && styles.splitAmountInputEdited
                ]}
                value={splitAmounts[member.user?._id]?.value?.toString() || ''}
                onChangeText={(value) => handleSplitAmountChange(member.user?._id, value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.fontSecondColor}
                editable={selectedParticipants[member.user?._id]}
              />
              {splitAmounts[member.user?._id]?.isManuallyEdited && (
                <View style={styles.editedIndicator}>
                  <Ionicons name="pencil" size={12} color={colors.primary} />
                </View>
              )}
            </View>
          </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || !isSplitValid) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
          disabled={isSubmitting || !isSplitValid}
          >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
            ) : (
            <>
              <Text style={styles.submitButtonText}>Submit</Text>
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </>
            )}
          </TouchableOpacity>
        </View>
    </View>
  );

  if (loading.groups || !group || !loggedInUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading group details...</Text>
      </View>
    );
  }

  // Show loading while checking creator status
  if (!isCreator && loggedInUser && group) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
    </View>
  );
}

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name={step === 1 ? "close" : "arrow-back"} size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Add Expense Details' : 'Split Amount'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {step === 1 ? renderStep1() : renderStep2()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.fontSecondColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.fontMainColor,
    textAlign: 'center',
    flex: 1,
  },
  headerPlaceholder: {
    width: 70,
  },
  screenBody: {
    flex: 1,
  },
  step1Container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  step2Container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  descriptionInput: {
    padding: 16,
    fontSize: 16,
    color: colors.fontMainColor,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
    backgroundColor: colors.white,
  },
  categoryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  sectionLabel: {
    fontSize: 14,
    color: colors.fontSecondColor,
    marginBottom: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.grayBackground,
    minWidth: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    color: colors.fontMainColor,
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  bottomButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grayLinesColor,
    backgroundColor: colors.white,
  },
  nextButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
    backgroundColor: colors.white,
  },
  amountLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: colors.fontMainColor,
  },
  paidByButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
    backgroundColor: colors.white,
  },
  paidByContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidByLeft: {
    flex: 1,
  },
  paidByLabel: {
    fontSize: 14,
    color: colors.fontSecondColor,
    marginBottom: 4,
  },
  paidByName: {
    fontSize: 16,
    color: colors.fontMainColor,
    fontWeight: '500',
  },
  splitListContainer: {
    padding: 16,
  },
  splitListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitListHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitListTitle: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  splitListHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: `${colors.primary}15`,
  },
  selectAllText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  splitEquallyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitEquallyText: {
    marginLeft: 4,
    color: colors.primary,
    fontWeight: '600',
  },
  splitListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
  },
  participantCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grayLinesColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  participantName: {
    fontSize: 16,
    color: colors.fontMainColor,
  },
  splitAmountInput: {
    width: 80,
    textAlign: 'right',
    fontSize: 16,
    color: colors.fontMainColor,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  splitAmountInputDisabled: {
    backgroundColor: colors.grayBackground,
    color: colors.fontSecondColor,
  },
  splitAmountInputEdited: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  splitAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editedIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF5757',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  totalSplitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalSplitLabel: {
    fontSize: 14,
    color: colors.fontSecondColor,
    fontWeight: '500',
  },
  totalSplitAmount: {
    fontSize: 16,
    color: colors.fontMainColor,
    fontWeight: '600',
  },
  totalSplitContainerError: {
    backgroundColor: '#FF575715',
    borderLeftWidth: 3,
    borderLeftColor: '#FF5757',
  },
  totalSplitAmountError: {
    color: '#FF5757',
  },
  instructionsContainer: {
    padding: 12,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  instructionsText: {
    fontSize: 12,
    color: colors.fontSecondColor,
    lineHeight: 16,
  },
  validationMessageContainer: {
    padding: 12,
    backgroundColor: '#FF575715',
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5757',
  },
  validationMessageText: {
    fontSize: 12,
    color: '#FF5757',
    lineHeight: 16,
    fontWeight: '500',
  },
}); 

export default AddExpenseScreen; 