import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSplit } from '../../context/SplitContext';
import { colors } from '../../utils/colors';
import { calculateBalanceSummary } from '../../utils/splitCalculations';
import { useFocusEffect } from '@react-navigation/native';

export default function GroupsScreen({ navigation }) {
  const { groups, expenses, loading, fetchGroups, fetchExpenses, fetchBalances, fetchGroupBalanceSummary, balances } = useSplit();
  const [groupSummaries, setGroupSummaries] = useState({});
  const [groupSummaryLoading, setGroupSummaryLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch groups, expenses, and balances when component mounts
    fetchGroups();
    fetchExpenses();
    fetchBalances();
    loadGroupSummaries();
  }, []);

  // Refresh data when screen comes into focus (e.g., after creating an expense)
  useFocusEffect(
    React.useCallback(() => {
      fetchGroups();
      fetchExpenses();
      fetchBalances();
      // Add a small delay to ensure balances are loaded before summary
      setTimeout(() => {
        loadGroupSummaries();
      }, 500);
    }, [])
  );

  const loadGroupSummaries = async () => {
    if (!groups || groups.length === 0) return;
    
    setGroupSummaryLoading(prev => {
      const newState = {};
      groups.forEach(group => {
        newState[group._id] = true;
      });
      return newState;
    });

    try {
      const summaryPromises = groups.map(async (group) => {
        try {
          const summary = await fetchGroupBalanceSummary(group._id);
          return { groupId: group._id, summary };
        } catch (error) {
          console.error(`Error loading summary for group ${group._id}:`, error);
          return { groupId: group._id, summary: null };
        }
      });

      const results = await Promise.all(summaryPromises);
      const summaries = {};
      results.forEach(({ groupId, summary }) => {
        summaries[groupId] = summary;
      });

      setGroupSummaries(summaries);
    } catch (error) {
      console.error('Error loading group summaries:', error);
    } finally {
      setGroupSummaryLoading(prev => {
        const newState = {};
        groups.forEach(group => {
          newState[group._id] = false;
        });
        return newState;
      });
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchGroups(),
        fetchExpenses(),
        fetchBalances()
      ]);
      // Add a small delay to ensure balances are loaded
      setTimeout(() => {
        loadGroupSummaries();
        setRefreshing(false);
      }, 500);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Load group summaries when groups change
    if (groups.length > 0) {
      loadGroupSummaries();
    }
  }, [groups]);

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const openGroupDetails = (groupId) => {
    navigation.navigate('GroupDetails', { groupId });
  };

  const calculateGroupTotalExpenses = (groupId) => {
    const groupExpenses = expenses.filter(expense => expense.group?._id === groupId);
    return groupExpenses.reduce((sum, expense) => {
      return sum + (parseFloat(expense.amount) || 0);
    }, 0);
  };

  const renderGroupCard = (group) => {
    const groupSummary = groupSummaries[group._id];
    const isLoading = groupSummaryLoading[group._id];
    
    return (
      <TouchableOpacity
        key={group._id}
        style={styles.groupCard}
        onPress={() => openGroupDetails(group._id)}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <MaterialCommunityIcons 
              name="account-group" 
              size={24} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupMembers}>
              {group.members?.length || 0} members
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#64748B" />
        </View>
        
        <View style={styles.groupBalanceContainer}>
          <View style={styles.groupBalance}>
            <Text style={styles.balanceAmount}>₹{calculateGroupTotalExpenses(group._id).toFixed(2)}</Text>
            <Text style={styles.balanceStatus}>Total Expenses</Text>
          </View>
          
          {isLoading ? (
            <View style={styles.groupSummaryLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : groupSummary ? (
            <View style={styles.groupSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>You owe:</Text>
                <Text style={[styles.summaryAmount, styles.owingAmount]}>
                  ₹{groupSummary.totalOwing?.toFixed(2) || '0.00'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>You're owed:</Text>
                <Text style={[styles.summaryAmount, styles.owedAmount]}>
                  ₹{groupSummary.totalOwed?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.groupSummary}>
              <Text style={styles.noSummaryText}>No balance data</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="account-group" 
            size={28} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Groups</Text>
          <Text style={styles.subtitle}>
            Manage your expense groups and balances
          </Text>
        </View>

        {/* Groups List */}
        {loading.groups ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        ) : (
          <View style={styles.groupsContainer}>
            {groups && groups.length > 0 ? (
              groups.map(renderGroupCard)
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons 
                  name="account-group" 
                  size={48} 
                  color="#64748B" 
                />
                <Text style={styles.emptyText}>No groups yet</Text>
                <Text style={styles.emptySubText}>
                  Create a group to start splitting expenses
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.createGroupButton}
            onPress={handleCreateGroup}
          >
            <MaterialIcons name="group-add" size={16} color={colors.primary} />
            <Text style={styles.createGroupText}>Start a new group</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewAllExpensesButton}
            onPress={() => navigation.navigate('AllExpenses')}
          >
            <MaterialIcons name="receipt" size={16} color="#FF9800" />
            <Text style={styles.viewAllExpensesText}>View All Expenses</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 17,
    color: '#1E293B',
  },
  owingText: {
    color: '#EF4444',
  },
  owedText: {
    color: '#10B981',
  },
  filterButton: {
    padding: 4,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  settleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  settleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  settleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  settleAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  settleSubtitle: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  infoAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748B',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  balanceStatus: {
    fontSize: 12,
    color: '#64748B',
  },
  groupsContainer: {
    gap: 16,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    color: '#64748B',
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  groupBalanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  groupSummary: {
    flex: 1,
    marginLeft: 12,
  },
  groupSummaryLoading: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  owingAmount: {
    color: '#EF4444',
  },
  owedAmount: {
    color: '#10B981',
  },
  noSummaryText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  createGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  createGroupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    gap: 8,
  },
  createGroupText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllExpensesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#FF9800',
    borderRadius: 8,
    gap: 8,
  },
  viewAllExpensesText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#92400E',
    marginBottom: 2,
  },
}); 