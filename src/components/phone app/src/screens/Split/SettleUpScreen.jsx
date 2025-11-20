import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSplit } from '../../context/SplitContext';
import { useAuth } from '../../components/Auth/AuthContext';
import { colors } from '../../utils/colors';
import { openGPay, showGPayInstallPrompt } from '../../utils/gpayIntegration';
import { balancesAPI } from '../../services/splitAPI';

// Payment status constants
const PAYMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMATION_REQUESTED: 'confirmation_requested',
  WAITING_CONFIRMATION: 'waiting_confirmation',
  COMPLETED: 'completed'
};

export default function SettleUpScreen({ navigation, route }) {
  const { groupId, groupName } = route.params || {};
  const { 
    balances, 
    loading, 
    settleBalance, 
    fetchGroupBalances, 
    fetchGroupBalanceSummary,
    paymentStatuses,
    fetchPaymentStatuses,
    createPaymentStatus,
    requestPaymentConfirmation,
    confirmPayment,
    cancelPayment
  } = useSplit();
  const { user: currentUser } = useAuth();
  const [groupBalances, setGroupBalances] = useState([]);
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (groupId) {
      loadInitialData();
    }
  }, [groupId]);

  const loadInitialData = async () => {
    setIsInitialLoading(true);
    try {
      console.log('Loading initial data for group:', groupId);
      
      // Load group balances, summary, and payment statuses in parallel
      await Promise.all([
        fetchGroupBalances(groupId),
        loadBalanceSummary(),
        fetchPaymentStatuses(groupId)
      ]);
      
      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load settlement data. Please try again.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadBalanceSummary = async () => {
    setLoadingSummary(true);
    try {
      console.log('Loading balance summary...');
      const summary = await fetchGroupBalanceSummary(groupId);
      console.log('Received balance summary:', summary);
      setBalanceSummary(summary);
      console.log('Balance summary state updated');
      
      // Debug: Log individual balances
      if (summary?.individualBalances) {
        console.log('Individual balances in summary:', summary.individualBalances.map(b => ({
          userName: b.userName,
          amount: b.amount,
          userId: b.userId
        })));
      }
      
      // Debug: Also log current group balances
      console.log('Current group balances from context:', groupBalances.map(b => ({
        otherUser: b.otherUser?.fullName || b.otherUser?.userName,
        amount: b.amount,
        balanceId: b._id
      })));
    } catch (error) {
      console.error('Error loading balance summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    console.log('Current user:', currentUser?._id);
    console.log('Group ID:', groupId);
    console.log('All balances from context:', balances.length);
    console.log('Balance summary:', balanceSummary);
    console.log('Refresh trigger:', refreshTrigger);
    
    // Filter balances for this group and show ALL balances (both owing and owed)
    const filteredBalances = balances.filter(balance => 
      balance.group?._id === groupId || balance.group === groupId
    );
    
    console.log('Filtered balances for group:', filteredBalances);
    console.log('Setting groupBalances:', filteredBalances.length);
    setGroupBalances(filteredBalances);
  }, [balances, groupId, currentUser, balanceSummary, refreshTrigger]);

  const handleBalanceSelect = (balance) => {
    setSelectedBalance(balance);
    // Pre-fill with the settle amount from summary if available, otherwise use balance amount
    const amount = balanceSummary?.settleAmount > 0 ? balanceSummary.settleAmount : Math.abs(balance.amount);
    setSettlementAmount(amount.toString());
  };

  const handleSettle = async () => {
    if (!selectedBalance) {
      Alert.alert('Error', 'Please select a balance to settle');
      return;
    }

    const amount = parseFloat(settlementAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount > Math.abs(selectedBalance.amount)) {
      Alert.alert('Error', 'Settlement amount cannot exceed the balance');
      return;
    }

    const settlementData = {
      otherUserId: selectedBalance.otherUser._id,
      amount: amount,
      groupId: groupId,
    };

    const success = await settleBalance(settlementData);
    if (success) {
      setSelectedBalance(null);
      setSettlementAmount('');
      // Refresh balances
      await fetchGroupBalances(groupId);
      await loadBalanceSummary();
    }
  };

  // GPay Integration Functions
  const handleGPayPayment = async (balance) => {
    try {
      const amount = Math.abs(balance.amount);
      const recipientName = balance.otherUser?.fullName || balance.otherUser?.userName || 'User';
      
      // Create payment status in backend
      const paymentData = {
        balanceId: balance._id || null, // Allow null balanceId, backend will handle it
        recipientId: balance.otherUser._id,
        amount: amount,
        groupId: groupId,
        paymentMethod: 'gpay',
        paymentDetails: {
          note: 'Splitwise Payment'
        }
      };
      
      const paymentStatus = await createPaymentStatus(paymentData);
      
      if (paymentStatus) {
        // Open GPay
        const success = await openGPay({
          amount: amount,
          recipientName: recipientName,
          note: 'Splitwise Payment'
        });
        
        if (success) {
          Alert.alert(
            'GPay Opened',
            'Please complete the payment in GPay and return to this app.',
            [
              {
                text: 'Payment Completed',
                onPress: () => handlePaymentCompleted(paymentStatus._id)
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => handlePaymentCancelled(paymentStatus._id)
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error handling GPay payment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  const handlePaymentCompleted = async (paymentId) => {
    Alert.alert(
      'Payment Completed',
      'Great! Now you can request payment confirmation from the recipient.',
      [
        {
          text: 'Request Confirmation',
          onPress: async () => {
            const success = await requestPaymentConfirmation(paymentId);
            if (success) {
              // Refresh payment statuses
              await fetchPaymentStatuses(groupId);
            }
          }
        }
      ]
    );
  };

  const handlePaymentCancelled = async (paymentId) => {
    const success = await cancelPayment(paymentId);
    if (success) {
      // Refresh payment statuses
      await fetchPaymentStatuses(groupId);
    }
  };



  const handleConfirmPayment = async (paymentStatus) => {
    const payerName = paymentStatus.payer?.fullName || paymentStatus.payer?.userName || 'User';
    
    Alert.alert(
      'Confirm Payment',
      `Did you receive ₹${paymentStatus.amount.toFixed(2)} from ${payerName}?`,
      [
        {
          text: 'Yes, I received it',
          onPress: async () => {
              console.log('Starting payment confirmation...');
              const success = await confirmPayment(paymentStatus._id, groupId);
            if (success) {
                console.log('Payment confirmed, refreshing balance summary...');
                // Force refresh all data with multiple attempts
                for (let i = 0; i < 3; i++) {
                  console.log(`Refresh attempt ${i + 1}`);
                  await Promise.all([
                    fetchGroupBalances(groupId),
                    loadBalanceSummary(),
                    fetchPaymentStatuses(groupId)
                  ]);
                  // Small delay between attempts
                  if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
                }
                // Force UI refresh
                setRefreshTrigger(prev => prev + 1);
                console.log('Payment confirmed successfully and balance summary refreshed');
                Alert.alert(
                  'Payment Confirmed',
                  'Payment has been confirmed and your balance has been updated successfully.',
                  [{ text: 'OK' }]
                );
            }
          }
        },
        {
          text: 'No, I didn\'t receive it',
          style: 'cancel',
          onPress: () => {
            Alert.alert(
              'Payment Not Confirmed',
              'The payment has not been confirmed. Please contact the payer to resolve this issue.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handlePayNow = async (balance) => {
    // Find existing payment status for this balance
    const existingPayment = paymentStatuses.find(p => p.balanceId === balance._id);
    
    if (!existingPayment) {
      // First time payment - open GPay
      await handleGPayPayment(balance);
    } else if (existingPayment.status === 'payment_sent') {
      // Payment sent but not confirmed - request confirmation
      const success = await requestPaymentConfirmation(existingPayment._id);
      if (success) {
        await fetchPaymentStatuses(groupId);
      }
    } else if (existingPayment.status === 'waiting_confirmation') {
      // Already waiting for confirmation
      Alert.alert(
        'Waiting for Confirmation',
        'Payment confirmation is already pending. Please wait for the recipient to confirm.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMarkReceived = async (balance) => {
    console.log('=== MARK RECEIVED DEBUG ===');
    console.log('Balance:', {
      _id: balance._id,
      amount: balance.amount,
      otherUser: balance.otherUser
    });
    
    const otherUserName = balance.otherUser?.fullName || balance.otherUser?.userName || 'User';
    const amount = Math.abs(balance.amount);
    
    Alert.alert(
      'Mark as Received',
      `Did you receive ₹${amount.toFixed(2)} from ${otherUserName}?`,
      [
        {
          text: 'Yes, I received it',
          onPress: async () => {
            try {
              console.log('Marking balance as received for user:', balance.otherUser._id);
              
              const response = await balancesAPI.markBalanceAsReceived({
                otherUserId: balance.otherUser._id,
                groupId: groupId,
                amount: amount
              });
              
              if (response.data.success) {
                console.log('Balance marked as received successfully');
                
                // Refresh all data
                await Promise.all([
                  fetchGroupBalances(groupId),
                  loadBalanceSummary(),
                  fetchPaymentStatuses(groupId)
                ]);
                
                // Force UI refresh
                setRefreshTrigger(prev => prev + 1);
                
                Alert.alert(
                  'Payment Confirmed',
                  `Payment of ₹${amount.toFixed(2)} has been marked as received and your balance has been updated successfully.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', 'Failed to mark payment as received. Please try again.');
              }
            } catch (error) {
              console.error('Error marking balance as received:', error);
              Alert.alert(
                'Error', 
                error.response?.data?.message || 'Failed to mark payment as received. Please try again.'
              );
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleManualPaymentConfirmation = async (balance) => {
    // This is for the person who is owed money to mark that they've received payment manually
    const payerName = balance.otherUser?.fullName || balance.otherUser?.userName || 'User';
    
    Alert.alert(
      'Confirm Manual Payment',
      `Did you receive ₹${Math.abs(balance.amount).toFixed(2)} from ${payerName}?`,
      [
        {
          text: 'Yes, I received it',
          onPress: async () => {
            console.log('Creating manual payment confirmation for balance:', balance._id);
            
            // Create a payment status for manual payment confirmation
            // In this case, the current user (recipient) is confirming they received payment from the other user (payer)
            const paymentData = {
              balanceId: balance._id || null,
              recipientId: currentUser._id,
              payerId: balance.otherUser._id, // Add payerId to specify who paid
              amount: Math.abs(balance.amount),
              groupId: groupId,
              paymentMethod: 'manual',
              paymentDetails: {
                note: 'Manual payment confirmed by recipient'
              }
            };
            
            const paymentStatus = await createPaymentStatus(paymentData);
            if (paymentStatus) {
              console.log('Manual payment status created:', paymentStatus._id);
              
              // Automatically confirm the payment
              const success = await confirmPayment(paymentStatus._id, groupId);
              if (success) {
                console.log('Manual payment confirmed successfully');
                // Force refresh all data with multiple attempts
                for (let i = 0; i < 3; i++) {
                  console.log(`Refresh attempt ${i + 1}`);
                  await Promise.all([
                    fetchGroupBalances(groupId),
                    loadBalanceSummary(),
                    fetchPaymentStatuses(groupId)
                  ]);
                  // Small delay between attempts
                  if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
                }
                // Force UI refresh
                setRefreshTrigger(prev => prev + 1);
                Alert.alert(
                  'Payment Confirmed',
                  'Manual payment has been confirmed and your balance has been updated successfully.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleMarkAsPaid = (balance) => {
    // This is for the person who owes money to mark that they've paid
    const recipientName = balance.otherUser?.fullName || balance.otherUser?.userName || 'User';
    
    Alert.alert(
      'Mark as Paid',
      `Have you already paid ₹${Math.abs(balance.amount).toFixed(2)} to ${recipientName}?`,
      [
        {
          text: 'Yes, I paid',
          onPress: async () => {
            // Create a payment status for manual payment
            const paymentData = {
              balanceId: balance._id || null,
              recipientId: balance.otherUser._id,
              amount: Math.abs(balance.amount),
              groupId: groupId,
              paymentMethod: 'manual',
              paymentDetails: {
                note: 'Manual payment marked by user'
              }
            };
            
            const paymentStatus = await createPaymentStatus(paymentData);
            if (paymentStatus) {
              // Automatically request confirmation
              const success = await requestPaymentConfirmation(paymentStatus._id);
              if (success) {
                await fetchPaymentStatuses(groupId);
                Alert.alert(
                  'Confirmation Requested',
                  `Payment confirmation request has been sent to ${recipientName}. They will be notified to confirm the payment.`,
                  [{ text: 'OK' }]
                );
              }
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };



  const getPaymentButtonText = (balance) => {
    const existingPayment = paymentStatuses.find(p => p.balanceId === balance._id);
    
    if (!existingPayment) {
      return 'Pay now';
    }
    
    switch (existingPayment.status) {
      case 'payment_sent':
        return 'Request Confirmation';
      case 'waiting_confirmation':
        return 'Waiting for Confirmation';
      case 'confirmed':
        return 'Payment Confirmed';
      case 'completed':
        return 'Payment Completed';
      default:
        return 'Pay now';
    }
  };

  const getPaymentButtonStyle = (balance) => {
    const existingPayment = paymentStatuses.find(p => p.balanceId === balance._id);
    
    if (!existingPayment) {
      return styles.payNowButton;
    }
    
    switch (existingPayment.status) {
      case 'payment_sent':
        return [styles.payNowButton, styles.confirmationButton];
      case 'waiting_confirmation':
        return [styles.payNowButton, styles.waitingButton];
      case 'confirmed':
        return [styles.payNowButton, styles.confirmedButton];
      case 'completed':
        return [styles.payNowButton, styles.completedButton];
      default:
        return styles.payNowButton;
    }
  };

  const getPaymentButtonTextStyle = (balance) => {
    const existingPayment = paymentStatuses.find(p => p.balanceId === balance._id);
    
    if (!existingPayment) {
      return styles.payNowButtonText;
    }
    
    switch (existingPayment.status) {
      case 'payment_sent':
        return [styles.payNowButtonText, styles.confirmationButtonText];
      case 'waiting_confirmation':
        return [styles.payNowButtonText, styles.waitingButtonText];
      case 'confirmed':
        return [styles.payNowButtonText, styles.confirmedButtonText];
      case 'completed':
        return [styles.payNowButtonText, styles.completedButtonText];
      default:
        return styles.payNowButtonText;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading settlement information...</Text>
      </View>
    );
  }

  // Calculate totals from balance summary if available, otherwise from group balances
  let totalOwing, totalOwed, netAmount;
  
  if (balanceSummary) {
    totalOwing = balanceSummary.totalOwing || 0;
    totalOwed = balanceSummary.totalOwed || 0;
    netAmount = balanceSummary.netBalance || 0;
  } else {
    totalOwing = groupBalances.filter(b => b.amount < 0).reduce((sum, b) => sum + Math.abs(b.amount), 0);
    totalOwed = groupBalances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);
    netAmount = totalOwed - totalOwing;
  }

  // Create balance items from individual balances if available
  let owingBalances = [];
  let owedBalances = [];

  if (balanceSummary?.individualBalances) {
    // Use individual balances from summary
    balanceSummary.individualBalances.forEach(balance => {
      // Skip if this is the current user
      if (balance.userId === currentUser._id) {
        return;
      }
      
      if (balance.amount < 0) {
        owingBalances.push({
          _id: balance.userId,
          amount: balance.amount,
          otherUser: {
            _id: balance.userId,
            fullName: balance.userName,
            userName: balance.userName,
            profilePicture: balance.profilePicture
          }
        });
      } else if (balance.amount > 0) {
        owedBalances.push({
          _id: balance.userId,
          amount: balance.amount,
          otherUser: {
            _id: balance.userId,
            fullName: balance.userName,
            userName: balance.userName,
            profilePicture: balance.profilePicture
          }
        });
      }
    });
  } else {
    // Use group balances - filter out current user
    owingBalances = groupBalances.filter(b => b.amount < 0 && b.otherUser._id !== currentUser._id);
    owedBalances = groupBalances.filter(b => b.amount > 0 && b.otherUser._id !== currentUser._id);
  }

  console.log('Display data:', {
    totalOwing,
    totalOwed,
    netAmount,
    owingBalances: owingBalances.length,
    owedBalances: owedBalances.length,
    balanceSummary: !!balanceSummary,
    balanceSummaryData: balanceSummary
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Settle Up</Text>
          </View>
          {groupName && (
            <Text style={styles.subtitle}>Group: {groupName}</Text>
          )}
        </View>

        {/* Quick Summary */}
        <View style={styles.quickSummary}>
          <Text style={styles.quickSummaryTitle}>Quick Summary</Text>
          <View style={styles.quickSummaryRow}>
            <Text style={styles.quickSummaryLabel}>You need to pay:</Text>
            <Text style={[styles.quickSummaryValue, styles.negativeAmount]}>
              ₹{totalOwing.toFixed(2)}
            </Text>
          </View>
          <View style={styles.quickSummaryRow}>
            <Text style={styles.quickSummaryLabel}>You get back:</Text>
            <Text style={[styles.quickSummaryValue, styles.positiveAmount]}>
              ₹{totalOwed.toFixed(2)}
            </Text>
          </View>
          {Math.abs(netAmount) > 0.01 && (
            <View style={styles.quickSummaryRow}>
              <Text style={styles.quickSummaryLabel}>
                {netAmount > 0 ? 'Net you get back:' : 'Net you need to pay:'}
              </Text>
              <Text style={[
                styles.quickSummaryValue,
                netAmount > 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                ₹{Math.abs(netAmount).toFixed(2)}
              </Text>
            </View>
          )}
        </View>


        {/* YOU NEED TO PAY Section */}
        {owingBalances.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>YOU NEED TO PAY</Text>
              <View style={styles.sectionLine} />
            </View>
            
            <View style={styles.balancesList}>
              {owingBalances.map((balance, index) => {
                const otherUserName = balance.otherUser?.fullName || balance.otherUser?.userName || 'Unknown';
                const initials = getInitials(otherUserName);
                const avatarColor = getRandomColor(otherUserName);
                
                return (
                  <View key={balance._id || index} style={styles.balanceItem}>
                    <View style={styles.userInfo}>
                      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{otherUserName}</Text>
                        <Text style={styles.balanceAmount}>₹{Math.abs(balance.amount).toFixed(2)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={getPaymentButtonStyle(balance)}
                      onPress={() => handlePayNow(balance)}
                      disabled={paymentStatuses.find(p => p.balanceId === balance._id)?.status === 'waiting_confirmation'}
                    >
                      <Text style={getPaymentButtonTextStyle(balance)}>
                        {getPaymentButtonText(balance)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* YOU GET BACK FROM Section */}
        {owedBalances.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>YOU GET BACK FROM</Text>
              <View style={styles.sectionLine} />
            </View>
            
            <View style={styles.balancesList}>
              {owedBalances.map((balance, index) => {
                const otherUserName = balance.otherUser?.fullName || balance.otherUser?.userName || 'Unknown';
                const initials = getInitials(otherUserName);
                const avatarColor = getRandomColor(otherUserName);
                
                return (
                  <View key={balance._id || index} style={styles.balanceItem}>
                    <View style={styles.userInfo}>
                      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{otherUserName}</Text>
                        <Text style={[styles.balanceAmount, styles.positiveAmount]}>₹{balance.amount.toFixed(2)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.markReceivedButton}
                      onPress={() => handleMarkReceived(balance)}
                    >
                      <Text style={styles.markReceivedButtonText}>Mark as Received</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Pending Confirmations Section */}
        {paymentStatuses.filter(p => p.status === 'waiting_confirmation' && p.recipient._id === currentUser._id).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PENDING CONFIRMATIONS</Text>
              <View style={styles.sectionLine} />
            </View>
            
            <View style={styles.balancesList}>
              {paymentStatuses
                .filter(p => p.status === 'waiting_confirmation' && p.recipient._id === currentUser._id)
                .map((paymentStatus) => {
                  const payerName = paymentStatus.payer?.fullName || paymentStatus.payer?.userName || 'Unknown';
                  const initials = getInitials(payerName);
                  const avatarColor = getRandomColor(payerName);
                  
                  return (
                    <View key={paymentStatus._id} style={styles.balanceItem}>
                      <View style={styles.userInfo}>
                        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.userDetails}>
                          <Text style={styles.userName}>{payerName}</Text>
                          <Text style={styles.balanceAmount}>₹{paymentStatus.amount.toFixed(2)}</Text>
                          <Text style={styles.confirmationStatus}>Waiting for confirmation</Text>
                        </View>
                      </View>
                      <View style={styles.confirmationActions}>
                        <TouchableOpacity 
                          style={styles.confirmButton}
                          onPress={() => handleConfirmPayment(paymentStatus)}
                        >
                          <Text style={styles.confirmButtonText}>Confirm</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Empty State */}
        {owingBalances.length === 0 && owedBalances.length === 0 && paymentStatuses.filter(p => p.status === 'waiting_confirmation' && p.recipient._id === currentUser._id).length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#00C853" />
            <Text style={styles.emptyStateTitle}>All Settled Up!</Text>
            <Text style={styles.emptyStateSubtitle}>
              No outstanding balances in this group
            </Text>
          </View>
        )}

        {/* Settlement Form */}
        {selectedBalance && (
          <View style={styles.settlementSection}>
            <Text style={styles.sectionTitle}>
              Settle with {selectedBalance.otherUser?.fullName || selectedBalance.otherUser?.userName || selectedBalance.otherUser?.name}
            </Text>
            
            <View style={styles.settlementForm}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Amount to Settle</Text>
                <TextInput
                  style={styles.input}
                  value={settlementAmount}
                  onChangeText={setSettlementAmount}
                  placeholder="0.00"
                  placeholderTextColor="#757575"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Total Balance:</Text>
                <Text style={[
                  styles.balanceValue,
                  selectedBalance.amount < 0 ? styles.negativeAmount : styles.positiveAmount
                ]}>
                  ₹{Math.abs(selectedBalance.amount).toFixed(2)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.settleButton,
                  (!settlementAmount || parseFloat(settlementAmount) <= 0) && styles.settleButtonDisabled
                ]}
                onPress={handleSettle}
                disabled={!settlementAmount || parseFloat(settlementAmount) <= 0}
              >
                <Text style={styles.settleButtonText}>Settle Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    paddingVertical: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  netAmountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  netAmountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  netAmountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  netAmountTitle: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  infoButton: {
    padding: 4,
  },
  netAmountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  balancesList: {
    gap: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  confirmationStatus: {
    fontSize: 12,
    color: '#F59E0B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  payNowButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  confirmationButton: {
    backgroundColor: colors.primary,
  },
  waitingButton: {
    backgroundColor: colors.primary,
  },
  confirmedButton: {
    backgroundColor: colors.primary,
  },
  completedButton: {
    backgroundColor: colors.primary,
  },
  payNowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmationButtonText: {
    color: '#FFFFFF',
  },
  waitingButtonText: {
    color: '#FFFFFF',
  },
  confirmedButtonText: {
    color: '#FFFFFF',
  },
  completedButtonText: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  markReceivedButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  markReceivedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  markAsPaidButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  markAsPaidButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  confirmationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  balanceStatus: {
    alignItems: 'flex-end',
  },
  balanceStatusText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  emptyStateSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  settlementSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settlementForm: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settleButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  settleButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  settleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  settledAmount: {
    color: '#94A3B8',
  },
  quickSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quickSummaryLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  quickSummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 8,
  },
  summaryCardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  netBalanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  netBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  netBalanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 8,
  },
  netBalanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
}); 