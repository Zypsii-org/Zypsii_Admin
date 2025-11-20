import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSplit } from '../../context/SplitContext';
import { colors } from '../../utils/colors';

export default function SimplifiedDebtsScreen({ navigation, route }) {
  const { groupId } = route.params;
  const { getSimplifiedDebts } = useSplit();
  
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimplifiedDebts();
  }, [groupId]);

  const loadSimplifiedDebts = async () => {
    setLoading(true);
    try {
      const debts = await getSimplifiedDebts(groupId);
      setSimplifiedDebts(debts || []);
    } catch (error) {
      console.error('Error loading simplified debts:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading simplified debts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Simplified Debts</Text>
          <Text style={styles.subtitle}>
            Minimum transactions needed to settle all debts
          </Text>
        </View>

        {simplifiedDebts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="account-balance-wallet" size={64} color="#666" />
            <Text style={styles.emptyText}>No debts to settle</Text>
            <Text style={styles.emptySubtext}>
              All balances are already settled in this group
            </Text>
          </View>
        ) : (
          <View style={styles.debtsContainer}>
            {simplifiedDebts.map((transaction, index) => (
              <View key={index} style={styles.debtItem}>
                <View style={styles.transactionInfo}>
                  <View style={styles.fromUser}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(transaction.from?.fullName || transaction.from?.userName)?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>
                        {transaction.from?.fullName || transaction.from?.userName || 'Unknown User'}
                      </Text>
                      <Text style={styles.userEmail}>
                        {transaction.from?.email || ''}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.transactionArrow}>
                    <MaterialIcons name="arrow-forward" size={24} color="#4CAF50" />
                    <Text style={styles.amount}>
                      ₹{transaction.amount.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.toUser}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(transaction.to?.fullName || transaction.to?.userName)?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>
                        {transaction.to?.fullName || transaction.to?.userName || 'Unknown User'}
                      </Text>
                      <Text style={styles.userEmail}>
                        {transaction.to?.email || ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoContainer}>
          <MaterialIcons name="info" size={20} color="#666" />
          <Text style={styles.infoText}>
            This shows the minimum number of transactions needed to settle all debts in the group.
          </Text>
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
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#CCCCCC',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  debtsContainer: {
    marginTop: 20,
  },
  debtItem: {
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    marginBottom: 12,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fromUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
    marginHorizontal: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  transactionArrow: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 12,
    lineHeight: 20,
  },
  debtCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  debtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  debtInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  debtStatus: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  settleButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  settleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
}); 