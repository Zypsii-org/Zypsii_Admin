import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  TextInput,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { colors, scale } from '../../../utils';
import { TextDefault } from '../../../components';
import { useToast } from '../../../context/ToastContext';
import styles from './styles';

const TripDetail = ({ route, navigation }) => {
  const { trip } = route.params;
  const { showToast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    requestContactsPermission();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts]);

  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'This app needs access to your contacts to invite friends.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        fetchContacts();
      } else {
        showToast('Please enable contacts permission in settings to invite friends.', 'error');
        setLoading(false);
      }
    } else {
      fetchContacts();
    }
  };

  const fetchContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });
        setContacts(data);
        setFilteredContacts(data);
      } else {
        showToast('Please enable contacts permission in settings to invite friends.', 'error');
      }
    } catch (error) {
      showToast('Failed to fetch contacts. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
      return;
    }
    const filtered = contacts.filter(contact => {
      const name = contact.name?.toLowerCase() || '';
      const phone = contact.phoneNumbers?.[0]?.number?.toLowerCase() || '';
      const email = contact.emails?.[0]?.email?.toLowerCase() || '';
      return name.includes(searchQuery.toLowerCase()) ||
             phone.includes(searchQuery.toLowerCase()) ||
             email.includes(searchQuery.toLowerCase());
    });
    setFilteredContacts(filtered);
  };

  const toggleContactSelection = (contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleInvite = () => {
    if (selectedContacts.length === 0) {
      showToast('Please select at least one contact to invite.', 'error');
      return;
    }
    // TODO: Implement invitation logic
    showToast(`${selectedContacts.length} friends invited to the trip!`, 'success');
    navigation.goBack();
  };

  const renderContactItem = ({ item }) => {
    const isSelected = selectedContacts.some(c => c.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.selectedContactItem]}
        onPress={() => toggleContactSelection(item)}
      >
        <View style={styles.contactInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{item.name || 'Unknown'}</Text>
            <Text style={styles.contactSubtext}>
              {item.phoneNumbers?.[0]?.number || item.emails?.[0]?.email || 'No contact info'}
            </Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.btncolor} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={handleInvite}
        >
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tripInfo}>
        <Text style={styles.tripName}>{trip.name}</Text>
        <Text style={styles.tripDates}>
          {trip.startDate} - {trip.endDate}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.fontSecondColor} />
        <TextInput
          style={styles.searchText}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.fontSecondColor}
        />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading contacts...</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No contacts found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.contactList}
        />
      )}
    </View>
  );
};

export default TripDetail; 