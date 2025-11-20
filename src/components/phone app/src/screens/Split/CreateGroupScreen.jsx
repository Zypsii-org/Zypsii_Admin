import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSplit } from '../../context/SplitContext';
import { colors } from '../../utils/colors';
import { useAuth } from '../../components/Auth/AuthContext';
import { usersAPI } from '../../services/splitAPI';
import { MaterialCommunityIcons } from '@expo/vector-icons';
export default function CreateGroupScreen({ navigation }) {
  const { createGroup, loading } = useSplit();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'default.png',
  });
  
  // Member management state
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  // Add state for multi-select in search results
  const [selectedSearchUsers, setSelectedSearchUsers] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Search for users to add as members
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await usersAPI.searchUsers(query);
      
      if (response.data.success) {
        // Filter out the current user from search results
        const filteredUsers = response.data.data.filter(
          searchUser => searchUser._id !== user?._id
        );
        setSearchResults(filteredUsers);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Add member to the group
  const addMember = (selectedUser) => {
    // Check if user is already added
    if (members.some(member => member._id === selectedUser._id)) {
      Alert.alert('Already Added', 'This user is already in the group');
      return;
    }

    // Check if trying to add yourself
    if (selectedUser._id === user?._id) {
      Alert.alert('Cannot Add Self', 'You cannot add yourself as a member');
      return;
    }

    setMembers(prev => [...prev, selectedUser]);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Remove member from the group
  const removeMember = (userId) => {
    setMembers(prev => prev.filter(member => member._id !== userId));
  };

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      searchUsers(text);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Add handler for toggling user selection in search results
  const handleToggleSearchUser = (userId) => {
    setSelectedSearchUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  // Add handler for adding all selected users
  const handleAddSelectedUsers = () => {
    const usersToAdd = searchResults.filter(user => selectedSearchUsers.includes(user._id));
    let alreadyAdded = false;
    usersToAdd.forEach(selectedUser => {
      if (members.some(member => member._id === selectedUser._id)) {
        alreadyAdded = true;
        return;
      }
      if (selectedUser._id === user?._id) {
        return;
      }
      setMembers(prev => [...prev, selectedUser]);
    });
    setSelectedSearchUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    if (alreadyAdded) {
      Alert.alert('Some users were already added and were skipped.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    // Prepare group data with members
    const groupData = {
      ...formData,
      members: members.map(member => ({
        user: member._id,
        role: 'member'
      }))
    };

    const success = await createGroup(groupData);
    if (success) {
      navigation.goBack();
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="plus" 
            size={48} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Create New Group</Text>
          <Text style={styles.subtitle}>
            Create a group to start splitting expenses with friends
          </Text>
        </View>

        <View style={styles.form}>
          {/* Group Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter group name"
              placeholderTextColor="#757575"
              maxLength={50}
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Enter group description (optional)"
              placeholderTextColor="#757575"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Group Icon</Text>
            <View style={styles.iconContainer}>
              <TouchableOpacity
                style={[
                  styles.iconOption,
                  formData.icon === 'default.png' && styles.iconOptionSelected
                ]}
                onPress={() => handleInputChange('icon', 'default.png')}
              >
                <MaterialIcons 
                  name="group" 
                  size={24} 
                  color={formData.icon === 'default.png' ? colors.primary : '#757575'} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconOption,
                  formData.icon === 'home.png' && styles.iconOptionSelected
                ]}
                onPress={() => handleInputChange('icon', 'home.png')}
              >
                <MaterialIcons 
                  name="home" 
                  size={24} 
                  color={formData.icon === 'home.png' ? colors.primary : '#757575'} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconOption,
                  formData.icon === 'work.png' && styles.iconOptionSelected
                ]}
                onPress={() => handleInputChange('icon', 'work.png')}
              >
                <MaterialIcons 
                  name="work" 
                  size={24} 
                  color={formData.icon === 'work.png' ? colors.primary : '#757575'} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconOption,
                  formData.icon === 'school.png' && styles.iconOptionSelected
                ]}
                onPress={() => handleInputChange('icon', 'school.png')}
              >
                <MaterialIcons 
                  name="school" 
                  size={24} 
                  color={formData.icon === 'school.png' ? colors.primary : '#757575'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Member Management */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Add Members</Text>
            <Text style={styles.subLabel}>
              Search and add friends to your group
            </Text>
            
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search users by name or email (min 2 characters)"
                placeholderTextColor="#757575"
              />
              {isSearching && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
              )}
            </View>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <View style={styles.searchResultsContainer}>
                <FlatList
                  data={searchResults}
                  keyExtractor={item => item._id}
                  style={styles.searchResultsScroll}
                  contentContainerStyle={{ flexGrow: 1 }}
                  showsVerticalScrollIndicator={true}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.searchResultItem}
                      onPress={() => handleToggleSearchUser(item._id)}
                    >
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {item.fullName ? item.fullName.charAt(0).toUpperCase() : 
                           item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {item.fullName || item.userName || 'Unknown User'}
                        </Text>
                        <Text style={styles.userEmail}>{item.email || ''}</Text>
                      </View>
                      <View style={[styles.checkbox, selectedSearchUsers.includes(item._id) && styles.checkboxSelected]}>
                        {selectedSearchUsers.includes(item._id) && (
                          <MaterialIcons name="check" size={18} color={colors.primary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
                {/* Add Selected Button */}
                {selectedSearchUsers.length > 0 && (
                  <TouchableOpacity style={styles.addSelectedButton} onPress={handleAddSelectedUsers}>
                    <Text style={styles.addSelectedButtonText}>Add Selected ({selectedSearchUsers.length})</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Selected Members */}
            {members.length > 0 && (
              <View style={styles.membersContainer}>
                <Text style={styles.membersTitle}>
                  Selected Members ({members.length})
                </Text>
                {members.map((item) => (
                  <View key={item._id} style={styles.memberItem}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {item.fullName ? item.fullName.charAt(0).toUpperCase() : 
                         item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {item.fullName || item.userName || 'Unknown User'}
                      </Text>
                      <Text style={styles.userEmail}>{item.email || ''}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeMember(item._id)}
                    >
                      <MaterialIcons name="close" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>



        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={loading.groups}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.createButton,
              (!formData.name.trim() || loading.groups || members.length === 0) && styles.createButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!formData.name.trim() || loading.groups || members.length === 0}
          >
            {loading.groups ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Group</Text>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  iconOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  searchResultsContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 250, // Fixed height for always scrollable
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  membersContainer: {
    marginTop: 16,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  removeButton: {
    padding: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  createButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: colors.primary + '50',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
  },
  addSelectedButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addSelectedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchResultsScroll: {
    flex: 1,
  },
}); 