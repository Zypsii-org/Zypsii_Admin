import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSplit } from '../../context/SplitContext';
import { colors } from '../../utils/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function GroupDetailsScreen({ navigation, route }) {
  const { groupId } = route.params;
  const { 
    groups, 
    expenses, 
    loading, 
    fetchGroup, 
    fetchExpenses, 
    deleteGroup,
    deleteExpense,
    fetchGroupBalances 
  } = useSplit();
  
  const [group, setGroup] = useState(null);
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    loadGroupData();
    loadCurrentUser();
  }, [groupId]);

  // Refresh data when screen comes into focus (e.g., after creating an expense)
  useFocusEffect(
    React.useCallback(() => {
      loadGroupData();
    }, [groupId])
  );

  useEffect(() => {
    // Check if current user is the group creator and member
    if (currentUser && group) {
      const creatorId = group.creator?._id || group.creator;
      const userId = currentUser._id;
      setIsCreator(creatorId?.toString() === userId?.toString());
      
      // Check if user is a member of the group
      const memberCheck = group.members?.some(member => {
        const memberId = member.user?._id || member.user;
        return memberId?.toString() === userId?.toString();
      });
      setIsMember(memberCheck);
    }
  }, [currentUser, group]);

  useEffect(() => {
    // Find the group from the groups array
    const foundGroup = groups.find(g => g._id === groupId);
    if (foundGroup) {
      setGroup(foundGroup);
    }
  }, [groups, groupId]);

  useEffect(() => {
    // Filter expenses for this group
    const filteredExpenses = expenses.filter(expense => expense.group?._id === groupId);
    setGroupExpenses(filteredExpenses);
    
    // Calculate total expenses
    const total = filteredExpenses.reduce((sum, expense) => {
      return sum + (parseFloat(expense.amount) || 0);
    }, 0);
    setTotalExpenses(total);
  }, [expenses, groupId]);

  const loadGroupData = async () => {
    await Promise.all([
      fetchGroup(groupId),
      fetchExpenses(groupId),
      fetchGroupBalances(groupId)
    ]);
  };

  const loadCurrentUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', { groupId });
  };

  const handleSettleUp = () => {
    navigation.navigate('SettleUp', { groupId, groupName: group?.name });
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteGroup(groupId);
            if (success) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleDeleteExpense = (expenseId, expenseDescription) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expenseDescription}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteExpense(expenseId);
            if (success) {
              // Refresh expenses after deletion
              await fetchExpenses(groupId);
            }
          },
        },
      ]
    );
  };

  const handleExpensePress = (expenseId) => {
    navigation.navigate('ExpenseDetails', { expenseId });
  };

  const renderExpenseCard = (expense) => {
    return (
      <TouchableOpacity
        key={expense._id}
        style={styles.expenseCard}
        onPress={() => handleExpensePress(expense._id)}
      >
        <View style={styles.expenseHeader}>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseDescription}>{expense.description}</Text>
            <Text style={styles.expenseDate}>
              {new Date(expense.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.expenseHeaderRight}>
            <Text style={styles.expenseAmount}>₹{Math.round(expense.amount)}</Text>
          </View>
        </View>
        <View style={styles.expenseFooter}>
          <Text style={styles.expensePaidBy}>
            Paid by {(() => {
              // Handle different possible data structures for paidBy
              if (typeof expense.paidBy === 'string') {
                // If paidBy is just a user ID, we need to find the user in the group members
                const payer = group?.members?.find(member => 
                  member.user?._id === expense.paidBy || member.user === expense.paidBy
                )?.user;
                return payer?.fullName || payer?.userName || payer?.name || 'Unknown';
              } else if (expense.paidBy && typeof expense.paidBy === 'object') {
                // If paidBy is a populated user object
                return expense.paidBy.fullName || expense.paidBy.userName || expense.paidBy.name || 'Unknown';
              }
              return 'Unknown';
            })()}
          </Text>
          <Text style={styles.expenseCategory}>{expense.category}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading.groups || !group) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading group details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Header */}
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <MaterialCommunityIcons 
              name="account-group" 
              size={32} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>
              {group.description || 'No description'}
            </Text>
            <Text style={styles.groupMembers}>
              {group.members?.length || 0} members
            </Text>
          </View>
        </View>

        {/* Group Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{totalExpenses.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{groupExpenses.length}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{group.members?.length || 0}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isMember && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddExpense}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, !isMember && { flex: 1 }]}
            onPress={handleSettleUp}
          >
            <MaterialIcons name="account-balance-wallet" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Settle Up</Text>
          </TouchableOpacity>
        </View>

        {/* Group Actions */}
        {isCreator && (
          <View style={styles.groupActions}>
            <TouchableOpacity
              style={styles.groupActionButton}
              onPress={handleDeleteGroup}
            >
              <MaterialIcons name="delete" size={20} color="#EF4444" />
              <Text style={[styles.groupActionText, { color: '#EF4444' }]}>
                Delete Group
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          {group && group.members ? (
            <View style={styles.membersList}>
              {group.members.map((member, index) => (
                <View key={index} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {(member.user?.fullName || member.user?.userName || member.user?.name || 'U')?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>
                        {member.user?.fullName || member.user?.userName || member.user?.name || 'Unknown User'}
                      </Text>
                      <Text style={styles.memberEmail}>
                        {member.user?.email || ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.memberRole}>
                    {member.isAdmin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminText}>Admin</Text>
                      </View>
                    )}
                    {group.creator?.toString() === member.user?._id?.toString() && (
                      <View style={styles.creatorBadge}>
                        <Text style={styles.creatorText}>Creator</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="account-group" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No members found</Text>
              <Text style={styles.emptySubText}>
                This group has no members
              </Text>
            </View>
          )}
        </View>

        {/* Expenses List */}
        <View style={styles.expensesSection}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          
          {loading.expenses ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading expenses...</Text>
            </View>
          ) : groupExpenses.length > 0 ? (
            <View style={styles.expensesList}>
              {groupExpenses.slice(0, 5).map(renderExpenseCard)}
              {groupExpenses.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('AllExpenses')}
                >
                  <Text style={styles.viewAllText}>View All Expenses</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubText}>
                Add your first expense to get started
              </Text>
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
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748B',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    color: '#64748B',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
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
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  groupActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  groupActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  groupActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  expensesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  expensesList: {
    gap: 12,
  },
  expenseCard: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteExpenseButton: {
    padding: 4,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#64748B',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expensePaidBy: {
    fontSize: 12,
    color: '#64748B',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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
  membersSection: {
    marginBottom: 32,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  memberEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  memberRole: {
    flexDirection: 'row',
    gap: 8,
  },
  adminBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  creatorBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  creatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  balanceCard: {
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
  balanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  balanceSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  memberCard: {
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
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  memberBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
}); 