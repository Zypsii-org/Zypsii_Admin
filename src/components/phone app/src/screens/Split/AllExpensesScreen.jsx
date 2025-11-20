import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSplit } from '../../context/SplitContext';
import { useAuth } from '../../components/Auth/AuthContext';
import { colors } from '../../utils/colors';
import { useFocusEffect } from '@react-navigation/native';

export default function AllExpensesScreen({ navigation, route }) {
  const { expenses, loading, fetchExpenses, deleteExpense } = useSplit();
  const { user } = useAuth();
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const filters = [
    { key: 'all', label: 'All', icon: 'format-list-bulleted' },
    { key: 'recent', label: 'Recent', icon: 'clock-outline' },
  ];

  useEffect(() => {
    loadExpenses();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadExpenses();
    }, [])
  );

  useEffect(() => {
    filterAndSearchExpenses();
  }, [expenses, searchQuery, selectedFilter]);

  const loadExpenses = async () => {
    try {
      await fetchExpenses();
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const filterAndSearchExpenses = () => {
    let filtered = [...expenses];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(expense => 
          new Date(expense.date || expense.createdAt) >= oneWeekAgo
        );
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => 
      new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    setFilteredExpenses(filtered);

    // Calculate total amount
    const total = filtered.reduce((sum, expense) => {
      return sum + (parseFloat(expense.amount) || 0);
    }, 0);
    setTotalAmount(total);
  };

  const handleExpensePress = (expenseId) => {
    navigation.navigate('ExpenseDetails', { expenseId });
  };

  const handleDeleteExpense = (expenseId, expenseDescription) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expenseDescription}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteExpense(expenseId);
            if (success) {
              // Expense will be removed from the list automatically
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPayerName = (expense) => {
    if (!expense.paidBy) {
      return 'Unknown';
    }
    
    // Backend populates paidBy with user fields
    if (typeof expense.paidBy === 'object') {
      return expense.paidBy.fullName || 
             expense.paidBy.userName || 
             expense.paidBy.name || 
             'Unknown';
    }
    
    return 'Unknown';
  };

  const renderExpenseItem = ({ item: expense }) => (
    <TouchableOpacity
      style={styles.expenseCard}
      onPress={() => handleExpensePress(expense._id)}
    >
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription} numberOfLines={2}>
            {expense.description}
          </Text>
          <Text style={styles.expenseDate}>
            {formatDate(expense.date || expense.createdAt)}
          </Text>
          <Text style={styles.expensePaidBy}>
            Paid by {getPayerName(expense)}
          </Text>
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>₹{parseFloat(expense.amount).toFixed(2)}</Text>
          {expense.group && (
            <Text style={styles.expenseGroup}>
              {expense.group.name || 'Group'}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.expenseFooter}>
        <View style={styles.expenseCategory}>
          <MaterialIcons name="category" size={16} color="#757575" />
          <Text style={styles.expenseCategoryText}>
            {expense.category || 'Uncategorized'}
          </Text>
        </View>
        
        {(() => {
          // Check if current user can delete this expense
          const isCreator = (typeof expense.createdBy === 'object' ? expense.createdBy?._id : expense.createdBy) === user?.id;
          const isPayer = (typeof expense.paidBy === 'object' ? expense.paidBy?._id : expense.paidBy) === user?.id;
          const canDelete = isCreator || isPayer;
          
          return canDelete ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteExpense(expense._id, expense.description)}
            >
              <MaterialIcons name="delete-outline" size={20} color="#FF5757" />
            </TouchableOpacity>
          ) : null;
        })()}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterButton,
        selectedFilter === filter.key && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter.key)}
    >
      <MaterialCommunityIcons 
        name={filter.icon} 
        size={16} 
        color={selectedFilter === filter.key ? colors.primary : '#757575'} 
      />
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter.key && styles.filterButtonTextActive
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  if (loading.expenses && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
       
        <Text style={styles.title}>All Expenses</Text>
        <Text style={styles.subtitle}>
          Total: ₹{totalAmount.toFixed(2)}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#757575" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          placeholderTextColor="#757575"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color="#757575" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map(renderFilterButton)}
      </ScrollView>

      {/* Expenses List */}
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.expensesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="receipt" size={48} color="#757575" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No expenses found' : 'No expenses yet'}
            </Text>
            <Text style={styles.emptySubText}>
              {searchQuery 
                ? 'Try adjusting your search or filters' 
                : 'Add your first expense to get started'
              }
            </Text>
          </View>
        }
      />
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
    color: '#64748B',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#1E293B',
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 8,
    maxHeight: 40,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 75,
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  filterButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.primary,
  },
  expensesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
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
    marginBottom: 2,
  },
  expensePaidBy: {
    fontSize: 12,
    color: '#64748B',
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  expenseGroup: {
    fontSize: 10,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  expenseCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expenseCategoryText: {
    fontSize: 12,
    color: '#64748B',
  },
  deleteButton: {
    padding: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
}); 