import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useNavigation } from '@react-navigation/native';

const ContentTypeModal = ({ visible, onClose, onSelectType }) => {
  const navigation = useNavigation();

  const handleCancel = () => {
    onClose();
    navigation.goBack();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose Content Type</Text>
          <Text style={styles.modalSubtitle}>Select how you want to create your content</Text>
          
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => {
              onSelectType('reel');
              navigation.navigate('ShortsUpload');
            }}
          >
            <Ionicons name="videocam" size={24} color={colors.Zypsii_color} />
            <Text style={styles.optionText}>Create Reel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => {
              onSelectType('post');
              navigation.navigate('PostUpload');
            }}
          >
            <Ionicons name="image" size={24} color={colors.Zypsii_color} />
            <Text style={styles.optionText}>Create Post</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionButton, styles.filterOptionButton]}
            onPress={() => {
              onSelectType('post-with-filters');
              navigation.navigate('PostUpload');
            }}
          >
            <Ionicons name="color-filter" size={24} color={colors.Zypsii_color} />
            <Text style={styles.optionText}>Create Post with Filters</Text>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.Zypsii_color,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  filterOptionButton: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 3,
    borderLeftColor: colors.Zypsii_color,
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.Zypsii_color,
    fontSize: 16,
    fontWeight: 'bold',
  },
  newBadge: {
    position: 'absolute',
    right: 15,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ContentTypeModal; 