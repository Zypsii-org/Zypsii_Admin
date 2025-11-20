import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSplit } from '../../context/SplitContext';
import { useAuth } from '../../components/Auth/AuthContext';
import { colors } from '../../utils/colors';

export default function ExpenseDetailsScreen({ navigation, route }) {
  const { expenseId } = route.params;
  const { expenses, loading, deleteExpense } = useSplit();
  const { user } = useAuth();
  const [expense, setExpense] = useState(null);

  useEffect(() => {
    const foundExpense = expenses.find(e => e._id === expenseId);
    setExpense(foundExpense);
  }, [expenses, expenseId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteExpense(expenseId);
            if (success) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditExpense', { expenseId });
  };

  if (loading.expenses || !expense) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading expense details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Expense Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{expense.description}</Text>
          <Text style={styles.amount}>₹{Math.round(expense.amount)}</Text>
        </View>

        {/* Expense Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{expense.category}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid by</Text>
            <Text style={styles.detailValue}>
              {(() => {
                // Debug: Log the expense structure to see what we're working with
                console.log('Zypsii ExpenseDetails - paidBy structure:', JSON.stringify(expense.paidBy, null, 2));
                
                // Zypsii Backend populates paidBy directly with user fields
                if (!expense.paidBy) {
                  return 'Unknown';
                }
                
                if (typeof expense.paidBy === 'object') {
                  return expense.paidBy.fullName || 
                         expense.paidBy.userName || 
                         expense.paidBy.name || 
                         'Unknown';
                }
                
                return 'Unknown';
              })()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date(expense.date).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Split Type</Text>
            <Text style={styles.detailValue}>{expense.splitType}</Text>
          </View>
          
          {expense.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{expense.notes}</Text>
            </View>
          )}
        </View>

        {/* Split Details */}
        <View style={styles.splitSection}>
          <Text style={styles.sectionTitle}>Split Details</Text>
          {expense.splitDetails?.map((split, index) => (
            <View key={index} style={styles.splitItem}>
              <View style={styles.splitInfo}>
                <Text style={styles.splitUserName}>
                  {split.user?.fullName || split.user?.userName || split.user?.name || 'Unknown'}
                </Text>
                <Text style={styles.splitAmount}>₹{Math.round(split.amount)}</Text>
              </View>
              {split.settled && (
                <View style={styles.settledBadge}>
                  <Text style={styles.settledText}>Settled</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        {(() => {
          // Check if current user can edit/delete this expense
          const isCreator = (typeof expense.createdBy === 'object' ? expense.createdBy?._id : expense.createdBy) === user?.id;
          const isPayer = (typeof expense.paidBy === 'object' ? expense.paidBy?._id : expense.paidBy) === user?.id;
          const canModify = isCreator || isPayer;
          
          return canModify ? (
            <View style={styles.actionButtons}>
              {isCreator && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEdit}
                >
                  <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>Edit Expense</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <MaterialIcons name="delete" size={20} color="#DC2626" />
                <Text style={styles.deleteButtonText}>Delete Expense</Text>
              </TouchableOpacity>
            </View>
          ) : null;
        })()}
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
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  splitSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  splitInfo: {
    flex: 1,
  },
  splitUserName: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 4,
  },
  splitAmount: {
    fontSize: 14,
    color: '#64748B',
  },
  settledBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  settledText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  paidByLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  paidByInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paidByName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  splitTypeText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  splitDetailsList: {
    gap: 12,
  },
  splitDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  splitDetailInfo: {
    flex: 1,
  },
  splitDetailName: {
    fontSize: 16,
    color: '#1E293B',
  },
  splitDetailSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  notesText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 5,
    paddingVertical: 12,
    marginHorizontal: 5,
    gap: 8,
  },
  actionButtonText: {
    color: '#10B981',
    fontWeight: '500',
    fontSize: 14,
  },
}); 