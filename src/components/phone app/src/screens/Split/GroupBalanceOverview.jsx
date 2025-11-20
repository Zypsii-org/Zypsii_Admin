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

export default function GroupBalanceOverview({ groupId, groupName, onNavigateToSettle }) {
  const [detailedBalances, setDetailedBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllRelationships, setShowAllRelationships] = useState(false);

  useEffect(() => {
    if (groupId) {
      loadDetailedBalances();
    }
  }, [groupId]);

  const loadDetailedBalances = async () => {
    setLoading(true);
    try {
      const response = await balancesAPI.getDetailedGroupBalances(groupId);
      
      if (response.data.success) {
        setDetailedBalances(response.data.data);
      }
    } catch (error) {
      console.error('Error loading detailed balances:', error);
      Alert.alert('Error', 'Failed to load balance relationships');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading balance relationships...</Text>
      </View>
    );
  }

  const displayedBalances = showAllRelationships ? detailedBalances : detailedBalances.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Group Balance Relationships</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadDetailedBalances}
        >
          <MaterialIcons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        Shows who owes whom in this group and recent transaction activity.
      </Text>

      {detailedBalances.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-group-outline" size={48} color="#757575" />
          <Text style={styles.emptyStateText}>No Balance Relationships</Text>
          <Text style={styles.emptyStateSubText}>
            Add expenses to see balance relationships between group members
          </Text>
        </View>
      ) : (
        <View style={styles.relationshipsList}>
          {displayedBalances.map((relationship, index) => {
            const isPositive = relationship.netAmount > 0;
            const isNegative = relationship.netAmount < 0;
            
            return (
              <View key={index} style={[
                styles.relationshipItem,
                isPositive && styles.positiveRelationship,
                isNegative && styles.negativeRelationship
              ]}>
                <View style={styles.relationshipHeader}>
                  <View style={styles.relationshipIcon}>
                    {isPositive ? (
                      <MaterialCommunityIcons name="arrow-left" size={16} color="#00C853" />
                    ) : isNegative ? (
                      <MaterialCommunityIcons name="arrow-right" size={16} color="#FF5757" />
                    ) : (
                      <MaterialCommunityIcons name="minus" size={16} color="#757575" />
                    )}
                  </View>
                  <Text style={styles.relationshipTitle}>
                    {relationship.user1.fullName} ↔ {relationship.user2.fullName}
                  </Text>
                </View>

                <View style={styles.relationshipDetails}>
                  <View style={styles.relationshipAmount}>
                    <Text style={[
                      styles.relationshipAmountValue,
                      isPositive ? styles.positiveAmount : isNegative ? styles.negativeAmount : styles.settledAmount
                    ]}>
                      ₹{Math.abs(relationship.netAmount).toFixed(2)}
                    </Text>
                    <Text style={styles.relationshipAmountLabel}>
                      {isPositive ? 
                        `${relationship.user2.fullName} owes ${relationship.user1.fullName}` :
                        isNegative ? 
                        `${relationship.user1.fullName} owes ${relationship.user2.fullName}` :
                        'Settled up'
                      }
                    </Text>
                  </View>

                  {relationship.transactionHistory && relationship.transactionHistory.length > 0 && (
                    <View style={styles.recentActivity}>
                      <Text style={styles.recentActivityTitle}>Recent Activity</Text>
                      {relationship.transactionHistory.slice(0, 2).map((transaction, txIndex) => (
                        <View key={txIndex} style={styles.activityItem}>
                          <Text style={styles.activityDescription}>
                            {transaction.description}
                          </Text>
                          <Text style={[
                            styles.activityAmount,
                            transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount
                          ]}>
                            {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                      {relationship.transactionHistory.length > 2 && (
                        <Text style={styles.moreActivityText}>
                          +{relationship.transactionHistory.length - 2} more transactions
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.relationshipActions}>
                  <TouchableOpacity 
                    style={styles.viewHistoryButton}
                    onPress={() => {
                      // Navigate to detailed history view
                      // This would need to be implemented based on your navigation structure
                    }}
                  >
                    <Text style={styles.viewHistoryButtonText}>View History</Text>
                  </TouchableOpacity>
                  
                  {Math.abs(relationship.netAmount) > 0.01 && (
                    <TouchableOpacity 
                      style={styles.settleButton}
                      onPress={() => {
                        if (onNavigateToSettle) {
                          onNavigateToSettle(relationship);
                        }
                      }}
                    >
                      <Text style={styles.settleButtonText}>Settle</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {detailedBalances.length > 3 && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowAllRelationships(!showAllRelationships)}
            >
              <Text style={styles.showMoreText}>
                {showAllRelationships ? 'Show Less' : `Show All ${detailedBalances.length} Relationships`}
              </Text>
              <MaterialIcons 
                name={showAllRelationships ? "expand-less" : "expand-more"} 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  emptyStateSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  relationshipsList: {
    gap: 12,
  },
  relationshipItem: {
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
  positiveRelationship: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  negativeRelationship: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  relationshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  relationshipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  relationshipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  relationshipDetails: {
    marginBottom: 16,
  },
  relationshipAmount: {
    alignItems: 'center',
    marginBottom: 12,
  },
  relationshipAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  relationshipAmountLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  recentActivity: {
    marginTop: 12,
  },
  recentActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  activityAmount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreActivityText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  relationshipActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewHistoryButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewHistoryButtonText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  settleButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  settleButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  showMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  settledAmount: {
    color: '#64748B',
  },
}); 