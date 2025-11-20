import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from "../../utils";
import { base_url } from '../../utils/base_url';

const Notification = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMarkedAllRead, setHasMarkedAllRead] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Retrieved token:', token);
      
      if (!token) {
        throw new Error('User not authenticated. Please login again.');
      }

      const response = await fetch(`${base_url}/user/getNotifications?offset=0&limit=30`, {        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API response data:', result);
      
      if (result.success && result.data) {
        const formattedData = result.data.map(item => ({
          id: item._id,
          description: item.content,
          title: item.notificationType === 'chat' ? 'New Message' : 'New Like',
          time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(item.createdAt),
          read: item.read,
          type: item.notificationType
        }));
        setNotifications(formattedData);
      } else {
        throw new Error(result.message || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && !hasMarkedAllRead) {
      markAllAsRead();
      markAllNotificationsAsReadOnBackend();
      setHasMarkedAllRead(true);
    }
  }, [notifications, hasMarkedAllRead]);

  // Function to mark all as read (local state)
  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  // Function to mark all notifications as read on backend
  const markAllNotificationsAsReadOnBackend = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('User not authenticated. Please login again.');

      const response = await fetch(`${base_url}/user/updateNotificationStatus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ read: true }) // No notificationId means bulk update
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update notifications');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleToggleReadStatus = async (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
    // Call backend for single notification
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('User not authenticated. Please login again.');

      await fetch(`${base_url}/user/updateNotificationStatus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId: id, read: true })
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "All") return true;
    if (activeTab === "Read") return notification.read;
    if (activeTab === "Unread") return !notification.read;
  });

  const groupNotificationsByDate = (notifications) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayItems = notifications.filter(item => {
      return item.date.toDateString() === today.toDateString();
    });
    
    const yesterdayItems = notifications.filter(item => {
      return item.date.toDateString() === yesterday.toDateString();
    });
    
    const olderItems = notifications.filter(item => {
      return item.date.toDateString() !== today.toDateString() && 
             item.date.toDateString() !== yesterday.toDateString();
    });
    
    const sections = [];
    
    if (todayItems.length > 0) {
      sections.push({ title: "Today", data: todayItems });
    }
    
    if (yesterdayItems.length > 0) {
      sections.push({ title: "Yesterday", data: yesterdayItems });
    }
    
    if (olderItems.length > 0) {
      sections.push({ title: "Older", data: olderItems });
    }
    
    console.log('Grouped notifications:', sections);
    return sections;
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleToggleReadStatus(item.id)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationDescription}>{item.description}</Text>
        <Text style={styles.notificationTime}>
          {item.date.toLocaleDateString()} • {item.time}
        </Text>
      </View>
      <View style={styles.notificationIcon}>
        <Text style={styles.iconText}>{item.type === 'chat' ? '💬' : '❤️'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <Text style={styles.dateHeader}>{section.title}</Text>
  );

  const unreadCount = notifications.filter(n => !n.read).length;
  const groupedSections = groupNotificationsByDate(filteredNotifications);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.btncolor} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (error && error.includes('not authenticated')) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Session Expired</Text>
        <Text style={styles.errorDetail}>Please login again</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.retryText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading notifications</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchNotifications}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Notifications</Text>
        {/* {unreadCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{unreadCount}</Text>
          </View>
        )} */}
      </View>

      <View style={styles.tabBar}>
        {["All", "Read", "Unread"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {groupedSections.length > 0 ? (
        <SectionList
          sections={groupedSections}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications found</Text>
          <Text style={styles.emptySubText}>You're all caught up!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: colors.fontMainColor,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 10,
  },
  errorDetail: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.btncolor,
    padding: 10,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.btncolor,
  },
  tabText: {
    fontSize: 14,
    color: colors.fontMainColor,
    fontWeight: "bold",
  },
  activeTabText: {
    color: colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.fontMainColor,
    marginBottom: 10,
    marginTop: 15,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.btncolor,
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: '#333',
  },
  notificationDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  notificationIcon: {
    backgroundColor: "#FFD700",
    borderRadius: 20,
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 18,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  countBadge: {
    backgroundColor: colors.btncolor,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  }
});

export default Notification;