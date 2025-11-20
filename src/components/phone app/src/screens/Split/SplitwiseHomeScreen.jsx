import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useSplit } from '../../context/SplitContext';
import { useFocusEffect } from '@react-navigation/native';
import BottomTab from '../../components/BottomTab/BottomTab';

export default function SplitwiseHomeScreen({ navigation }) {
  const { groups, expenses, fetchGroups, fetchExpenses, fetchBalanceSummary, loading } = useSplit();
  const [balanceSummary, setBalanceSummary] = useState({
    totalOwing: 0,
    totalOwed: 0,
    settleAmount: 0,
    getBackAmount: 0
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOverviewData();
  }, []);

  // Refresh data when screen comes into focus (e.g., after creating an expense)
  useFocusEffect(
    React.useCallback(() => {
      loadOverviewData();
    }, [])
  );

  const loadOverviewData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setOverviewLoading(true);
    }
    
    try {
      // Fetch groups and expenses
      await Promise.all([
        fetchGroups(),
        fetchExpenses()
      ]);

      // Fetch balance summary
      const summary = await fetchBalanceSummary();
      if (summary) {
        setBalanceSummary(summary);
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setOverviewLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadOverviewData(true);
  };

  const menuItems = [
    {
      title: 'Groups',
      subtitle: 'Manage expense groups',
      icon: 'account-group',
      screen: 'GroupsScreen',
      color: '#00C853',
    },
    {
      title: 'View All Expenses',
      subtitle: 'See all your expenses',
      icon: 'receipt',
      screen: 'AllExpenses',
      color: '#FF9800',
    },
    {
      title: 'Create Group',
      subtitle: 'Start a new expense group',
      icon: 'plus',
      screen: 'CreateGroup',
      color: '#9C27B0',
    },
  ];

  const handleMenuPress = (screen) => {
    navigation.navigate(screen);
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
            name="currency-usd" 
            size={48} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Splitwise</Text>
          <Text style={styles.subtitle}>
            Split expenses with friends and groups
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons 
                  name={item.icon} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748B" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Summary */}
        <View style={styles.quickSummary}>
          <Text style={styles.quickSummaryTitle}>Quick Summary</Text>
          <View style={styles.quickSummaryRow}>
            <Text style={styles.quickSummaryLabel}>You need to pay:</Text>
            <Text style={[styles.quickSummaryValue, styles.negativeAmount]}>
              ₹{overviewLoading ? '...' : balanceSummary.totalOwing?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.quickSummaryRow}>
            <Text style={styles.quickSummaryLabel}>You get back:</Text>
            <Text style={[styles.quickSummaryValue, styles.positiveAmount]}>
              ₹{overviewLoading ? '...' : balanceSummary.totalOwed?.toFixed(2) || '0.00'}
            </Text>
          </View>
          {Math.abs((balanceSummary.totalOwed || 0) - (balanceSummary.totalOwing || 0)) > 0.01 && (
            <View style={styles.quickSummaryRow}>
              <Text style={styles.quickSummaryLabel}>
                {(balanceSummary.totalOwed || 0) > (balanceSummary.totalOwing || 0) ? 'Net you get back:' : 'Net you need to pay:'}
              </Text>
              <Text style={[
                styles.quickSummaryValue,
                (balanceSummary.totalOwed || 0) > (balanceSummary.totalOwing || 0) ? styles.positiveAmount : styles.negativeAmount
              ]}>
                ₹{Math.abs((balanceSummary.totalOwed || 0) - (balanceSummary.totalOwing || 0)).toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Quick Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons 
                name="account-group" 
                size={24} 
                color={colors.primary} 
              />
              {overviewLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.statValue} />
              ) : (
                <Text style={styles.statValue}>{groups?.length || 0}</Text>
              )}
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons 
                name="receipt" 
                size={24} 
                color={colors.primary} 
              />
              {overviewLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.statValue} />
              ) : (
                <Text style={styles.statValue}>{expenses?.length || 0}</Text>
              )}
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            
          </View>
        </View>

        {/* Getting Started */}
        <View style={styles.gettingStartedContainer}>
          <Text style={styles.gettingStartedTitle}>Getting Started</Text>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create a Group</Text>
              <Text style={styles.stepDescription}>
                Start by creating a group for your expenses
              </Text>
            </View>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Add Expenses</Text>
              <Text style={styles.stepDescription}>
                Add expenses and split them among group members
              </Text>
            </View>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Settle Up</Text>
              <Text style={styles.stepDescription}>
                Track balances and settle up with friends
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Add BottomTab at the bottom */}
      <BottomTab screen="SPLIT" />
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
  menuContainer: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748B',
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
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  balanceSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  balanceSummaryText: {
    fontSize: 14,
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 20,
  },
  owingText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  owedText: {
    color: '#10B981',
    fontWeight: '600',
  },
  gettingStartedContainer: {
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
  gettingStartedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cardButtonText: {
    fontSize: 14,
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
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  expenseDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
}); 