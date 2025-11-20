import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { groupsAPI, expensesAPI, balancesAPI, paymentStatusAPI } from '../services/splitAPI';

// Create context
export const SplitContext = createContext();

export const SplitProvider = ({ children }) => {
  // State for all data
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [loading, setLoading] = useState({
    groups: false,
    expenses: false,
    balances: false,
    paymentStatuses: false,
  });
  const [error, setError] = useState({
    groups: null,
    expenses: null,
    balances: null,
    paymentStatuses: null,
  });

  // Fetch groups
  const fetchGroups = async () => {
    setLoading(prev => ({ ...prev, groups: true }));
    setError(prev => ({ ...prev, groups: null }));
    
    try {
      const response = await groupsAPI.getGroups();
      
      if (response.data.success) {
        setGroups(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError(prev => ({
        ...prev,
        groups: error.response?.data?.message || 'Failed to fetch groups',
      }));
      
      // Handle 401 errors specifically
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please log in again to continue.');
      } else {
        Alert.alert('Error', 'Failed to fetch groups');
      }
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  // Fetch a single group
  const fetchGroup = async (groupId) => {
    if (!groupId) return null;
    
    try {
      const response = await groupsAPI.getGroup(groupId);
      
      if (response.data.success) {
        // Update the group in the groups array
        setGroups(prev =>
          prev.map(group =>
            group._id === groupId ? response.data.data : group
          )
        );
        return response.data.data;
      }
    } catch (error) {
      console.error(`Error fetching group ${groupId}:`, error);
      Alert.alert('Error', 'Failed to fetch group details');
      return null;
    }
  };

  // Create a new group
  const createGroup = async (groupData) => {
    try {
      const response = await groupsAPI.createGroup(groupData);
      
      if (response.data.success) {
        // Add new group to state
        setGroups(prev => [...prev, response.data.data]);
        Alert.alert('Success', 'Group created successfully!');
        return response.data.data;
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create group');
      return false;
    }
  };

  // Update a group
  const updateGroup = async (groupId, groupData) => {
    if (!groupId) return false;
    
    try {
      const response = await groupsAPI.updateGroup(groupId, groupData);
      
      if (response.data.success) {
        // Update group in state
        setGroups(prev =>
          prev.map(group =>
            group._id === groupId ? response.data.data : group
          )
        );
        Alert.alert('Success', 'Group updated successfully!');
        return true;
      }
    } catch (error) {
      console.error(`Error updating group ${groupId}:`, error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update group');
      return false;
    }
  };

  // Delete a group
  const deleteGroup = async (groupId) => {
    if (!groupId) return false;
    
    try {
      const response = await groupsAPI.deleteGroup(groupId);
      
      if (response.data.success) {
        // Remove group from state
        setGroups(prev => prev.filter(group => group._id !== groupId));
        // Also remove expenses related to this group
        setExpenses(prev => prev.filter(expense => expense.group?._id !== groupId));
        Alert.alert('Success', 'Group deleted successfully!');
        return true;
      }
    } catch (error) {
      console.error(`Error deleting group ${groupId}:`, error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete group');
      return false;
    }
  };

  // Add member to group
  const addGroupMember = async (groupId, userData) => {
    if (!groupId) return false;
    
    try {
      const response = await groupsAPI.addMember(groupId, userData);
      
      if (response.data.success) {
        // Update group in state
        setGroups(prev =>
          prev.map(group =>
            group._id === groupId ? response.data.data : group
          )
        );
        Alert.alert('Success', 'Member added successfully!');
        return true;
      }
    } catch (error) {
      console.error(`Error adding member to group ${groupId}:`, error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add member');
      return false;
    }
  };

  // Remove member from group
  const removeGroupMember = async (groupId, userId) => {
    if (!groupId || !userId) return false;
    
    try {
      const response = await groupsAPI.removeMember(groupId, userId);
      
      if (response.data.success) {
        // Update group in state
        setGroups(prev =>
          prev.map(group =>
            group._id === groupId ? response.data.data : group
          )
        );
        Alert.alert('Success', 'Member removed successfully!');
        return true;
      }
    } catch (error) {
      console.error(`Error removing member from group ${groupId}:`, error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove member');
      return false;
    }
  };

  // Fetch expenses (can be filtered by group)
  const fetchExpenses = async (groupId = null) => {
    setLoading(prev => ({ ...prev, expenses: true }));
    setError(prev => ({ ...prev, expenses: null }));
    
    try {
      const params = groupId ? { groupId } : {};
      const response = await expensesAPI.getExpenses(params);
      
      if (response.data.success) {
        
        if (groupId) {
          // If fetching for a specific group, update only that group's expenses
          setExpenses(prev => {
            const otherExpenses = prev.filter(
              expense => expense.group?._id !== groupId
            );
            return [...otherExpenses, ...response.data.data];
          });
        } else {
          // If fetching all expenses, replace the entire state
          setExpenses(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError(prev => ({
        ...prev,
        expenses: error.response?.data?.message || 'Failed to fetch expenses',
      }));
      Alert.alert('Error', 'Failed to fetch expenses');
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  };

  // Create a new expense
  const createExpense = async (expenseData) => {
    try {
      const response = await expensesAPI.createExpense(expenseData);
      
      if (response.data.success) {
        // Add new expense to state
        setExpenses(prev => [...prev, response.data.data]);
        
        // Refresh balances after creating expense
        await fetchBalances();
        
        // If it's a group expense, also refresh group balances
        if (expenseData.group) {
          await fetchGroupBalances(expenseData.group);
        }
        
        Alert.alert('Success', 'Expense created successfully!');
        return response.data.data;
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create expense');
      return false;
    }
  };

  // Update an expense
  const updateExpense = async (expenseId, expenseData) => {
    if (!expenseId) return false;
    
    try {
      const response = await expensesAPI.updateExpense(expenseId, expenseData);
      
      if (response.data.success) {
        // Update expense in state
        setExpenses(prev =>
          prev.map(expense =>
            expense._id === expenseId ? response.data.data : expense
          )
        );
        Alert.alert('Success', 'Expense updated successfully!');
        return true;
      }
    } catch (error) {
      console.error(`Error updating expense ${expenseId}:`, error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update expense');
      return false;
    }
  };

  // Delete an expense
  const deleteExpense = async (expenseId) => {
    if (!expenseId) return false;
    
    try {
      const response = await expensesAPI.deleteExpense(expenseId);
      
      if (response.data.success) {
        // Remove expense from state
        setExpenses(prev => prev.filter(expense => expense._id !== expenseId));
        Alert.alert('Success', 'Expense deleted successfully!');
        return true;
      }
    } catch (error) {
      console.error(`Error deleting expense ${expenseId}:`, error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete expense');
      return false;
    }
  };

  // Fetch balances
  const fetchBalances = async () => {
    setLoading(prev => ({ ...prev, balances: true }));
    setError(prev => ({ ...prev, balances: null }));
    
    try {
      const response = await balancesAPI.getBalances();
      
      if (response.data.success) {
        setBalances(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      setError(prev => ({
        ...prev,
        balances: error.response?.data?.message || 'Failed to fetch balances',
      }));
      
      // Handle 401 errors specifically
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please log in again to continue.');
      } else {
        Alert.alert('Error', 'Failed to fetch balances');
      }
    } finally {
      setLoading(prev => ({ ...prev, balances: false }));
    }
  };

  // Fetch balance summary
  const fetchBalanceSummary = async () => {
    try {
      const response = await balancesAPI.getBalanceSummary();
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching balance summary:', error);
      return null;
    }
  };

  // Fetch group-specific balance summary
  const fetchGroupBalanceSummary = async (groupId) => {
    if (!groupId) return null;
    
    try {
      const response = await balancesAPI.getGroupBalanceSummary(groupId);
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error(`Error fetching group balance summary for ${groupId}:`, error);
      return null;
    }
  };

  // Fetch group balances
  const fetchGroupBalances = async (groupId) => {
    if (!groupId) return;
    
    try {
      const response = await balancesAPI.getGroupBalances(groupId);
      
      if (response.data.success) {
        // Update balances for this group
        setBalances(prev => {
          const otherBalances = prev.filter(
            balance => balance.group?._id !== groupId
          );
          return [...otherBalances, ...response.data.data];
        });
      }
    } catch (error) {
      console.error(`Error fetching group balances for ${groupId}:`, error);
      Alert.alert('Error', 'Failed to fetch group balances');
    }
  };

  // Settle balance
  const settleBalance = async (settlementData) => {
    try {
      const response = await balancesAPI.settleBalance(settlementData);
      
      if (response.data.success) {
        // Refresh balances after settlement
        await fetchBalances();
        Alert.alert('Success', 'Settlement successful!');
        return true;
      }
    } catch (error) {
      console.error('Error settling balance:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to settle balance');
      return false;
    }
  };

  // Payment Status Functions
  const fetchPaymentStatuses = async (groupId = null) => {
    setLoading(prev => ({ ...prev, paymentStatuses: true }));
    setError(prev => ({ ...prev, paymentStatuses: null }));
    
    try {
      const params = groupId ? { groupId } : {};
      const response = await paymentStatusAPI.getPaymentStatuses(params);
      
      if (response.data.success) {
        setPaymentStatuses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment statuses:', error);
      setError(prev => ({
        ...prev,
        paymentStatuses: error.response?.data?.message || 'Failed to fetch payment statuses',
      }));
      Alert.alert('Error', 'Failed to fetch payment statuses');
    } finally {
      setLoading(prev => ({ ...prev, paymentStatuses: false }));
    }
  };

  const createPaymentStatus = async (paymentData) => {
    try {
      const response = await paymentStatusAPI.createPaymentStatus(paymentData);
      
      if (response.data.success) {
        // Refresh payment statuses
        await fetchPaymentStatuses(paymentData.groupId);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error creating payment status:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create payment status');
      return false;
    }
  };

  const requestPaymentConfirmation = async (paymentId) => {
    try {
      const response = await paymentStatusAPI.requestConfirmation(paymentId);
      
      if (response.data.success) {
        // Refresh payment statuses
        await fetchPaymentStatuses();
        Alert.alert('Success', 'Confirmation request sent!');
        return true;
      }
    } catch (error) {
      console.error('Error requesting confirmation:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to request confirmation');
      return false;
    }
  };

  const confirmPayment = async (paymentId, groupId = null) => {
    try {
      const response = await paymentStatusAPI.confirmPayment(paymentId);
      
      if (response.data.success) {
        // Refresh payment statuses, balances, and balance summary
        const refreshPromises = [
          fetchPaymentStatuses(groupId),
          fetchBalances()
        ];
        
        // If groupId is provided, also refresh group-specific data
        if (groupId) {
          refreshPromises.push(fetchGroupBalances(groupId));
        }
        
        await Promise.all(refreshPromises);
        
        // Small delay to ensure backend has processed the update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        Alert.alert('Success', 'Payment confirmed and balance updated!');
        return true;
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to confirm payment');
      return false;
    }
  };

  const cancelPayment = async (paymentId) => {
    try {
      const response = await paymentStatusAPI.cancelPayment(paymentId);
      
      if (response.data.success) {
        // Refresh payment statuses
        await fetchPaymentStatuses();
        Alert.alert('Success', 'Payment cancelled!');
        return true;
      }
    } catch (error) {
      console.error('Error cancelling payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel payment');
      return false;
    }
  };





  // Test API connection
  const testAPIConnection = async () => {
    try {
      console.log('Testing API connection...');
      const response = await groupsAPI.getGroups();
      console.log('API connection successful:', response.data);
      return true;
    } catch (error) {
      console.error('API connection failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      return false;
    }
  };

  // Context value
  const value = {
    // State
    groups,
    expenses,
    balances,
    paymentStatuses,
    loading,
    error,
    
    // Group functions
    fetchGroups,
    fetchGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    addGroupMember,
    removeGroupMember,
    
    // Expense functions
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    
    // Balance functions
    fetchBalances,
    fetchGroupBalances,
    fetchBalanceSummary,
    fetchGroupBalanceSummary,
    settleBalance,
    
    // Payment Status functions
    fetchPaymentStatuses,
    createPaymentStatus,
    requestPaymentConfirmation,
    confirmPayment,
    cancelPayment,
    
    // Test function
    testAPIConnection,
  };

  return (
    <SplitContext.Provider value={value}>
      {children}
    </SplitContext.Provider>
  );
};

export const useSplit = () => {
  const context = useContext(SplitContext);
  if (!context) {
    throw new Error('useSplit must be used within a SplitProvider');
  }
  return context;
}; 