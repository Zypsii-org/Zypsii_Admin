import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { balancesAPI } from '../../services/splitAPI';
import { colors } from '../../utils/colors';

export default function BalanceHistoryScreen({ navigation, route }) {
  const { balanceId, balanceTitle } = route.params || {};
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (balanceId) {
      loadBalanceHistory();
    }
  }, [balanceId]);

  const loadBalanceHistory = async () => {
    setLoading(true);
    try {
      const response = await balancesAPI.getBalanceHistory(balanceId);
      
      if (response.data.success) {
        setBalance(response.data.data.balance);
        setHistory(response.data.data.history);
      }
    } catch (error) {
      console.error('Error loading balance history:', error);
      Alert.alert('Error', 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'SETTLED':
        return <MaterialCommunityIcons name="check-circle" size={16} color="#00C853" />;
      case 'ADDED':
        return <MaterialCommunityIcons name="plus-circle" size={16} color="#FF9800" />;
      case 'DELETED':
        return <MaterialCommunityIcons name="minus-circle" size={16} color="#F44336" />;
      default:
        return <MaterialCommunityIcons name="circle" size={16} color="#757575" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'SETTLED':
        return '#00C853';
      case 'ADDED':
        return '#FF9800';
      case 'DELETED':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading transaction history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadBalanceHistory}
        >
          <MaterialIcons name="refresh" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {balance && (
          <View style={styles.balanceSummary}>
            <Text style={styles.balanceTitle}>{balanceTitle || 'Balance Summary'}</Text>
            <View style={styles.balanceAmountContainer}>
              <Text style={[
                styles.balanceAmount,
                balance.amount > 0 ? styles.owedAmount : balance.amount < 0 ? styles.owingAmount : styles.settledAmount
              ]}>
                ₹{Math.abs(balance.amount).toFixed(2)}
              </Text>
              <Text style={styles.balanceLabel}>
                {balance.amount > 0 ? 'You are owed' : balance.amount < 0 ? 'You owe' : 'Settled'}
              </Text>
            </View>
            <Text style={styles.lastUpdated}>
              Last updated: {formatDate(balance.lastUpdated)}
            </Text>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <MaterialCommunityIcons name="history" size={48} color="#757575" />
              <Text style={styles.emptyHistoryText}>No transactions found</Text>
              <Text style={styles.emptyHistorySubText}>
                Transaction history will appear here when expenses are added or settlements are made.
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {history.map((transaction, index) => (
                <View key={transaction.id || index} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    {getActionIcon(transaction.action)}
                  </View>
                  
                  <View style={styles.historyContent}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyAction}>
                        {transaction.action === 'SETTLED' ? 'Settlement' : 
                         transaction.action === 'ADDED' ? 'Expense Added' : 
                         transaction.action === 'DELETED' ? 'Expense Removed' : 
                         transaction.action}
                      </Text>
                      <Text style={[
                        styles.historyAmount,
                        transaction.amount > 0 ? styles.owedAmount : styles.owingAmount
                      ]}>
                        {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                      </Text>
                    </View>
                    
                    <Text style={styles.historyDescription}>
                      {transaction.description}
                    </Text>
                    
                    <View style={styles.historyDetails}>
                      <Text style={styles.historyDate}>
                        {formatDate(transaction.date)}
                      </Text>
                      {transaction.expenseAmount && (
                        <Text style={styles.historyExpenseAmount}>
                          Expense: ₹{transaction.expenseAmount.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  balanceSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  balanceAmountContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#64748B',
  },
  historySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 40,
  },
  emptyHistoryText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  emptyHistorySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
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
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
  },
  historyExpenseAmount: {
    fontSize: 12,
    color: '#64748B',
  },
  owedAmount: {
    color: '#10B981',
  },
  owingAmount: {
    color: '#EF4444',
  },
  settledAmount: {
    color: '#64748B',
  },
}); 