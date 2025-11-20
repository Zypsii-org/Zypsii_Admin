import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

const filters = [
  {
    id: 'normal',
    name: 'Normal',
    icon: 'image-outline',
    style: null,
  },
  {
    id: 'clarendon',
    name: 'Clarendon',
    icon: 'sunny-outline',
    style: {
      tintColor: '#ffffff',
      opacity: 0.9,
    },
  },
  {
    id: 'gingham',
    name: 'Gingham',
    icon: 'color-palette-outline',
    style: {
      tintColor: '#f0f0f0',
      opacity: 0.8,
    },
  },
  {
    id: 'moon',
    name: 'Moon',
    icon: 'moon-outline',
    style: {
      tintColor: '#000000',
      opacity: 0.7,
    },
  },
  {
    id: 'lark',
    name: 'Lark',
    icon: 'leaf-outline',
    style: {
      tintColor: '#90EE90',
      opacity: 0.85,
    },
  },
  {
    id: 'reyes',
    name: 'Reyes',
    icon: 'camera-outline',
    style: {
      tintColor: '#D2B48C',
      opacity: 0.8,
    },
  },
  {
    id: 'juno',
    name: 'Juno',
    icon: 'flower-outline',
    style: {
      tintColor: '#FFB6C1',
      opacity: 0.9,
    },
  },
  {
    id: 'slumber',
    name: 'Slumber',
    icon: 'bed-outline',
    style: {
      tintColor: '#87CEEB',
      opacity: 0.75,
    },
  },
  {
    id: 'crema',
    name: 'Crema',
    icon: 'cafe-outline',
    style: {
      tintColor: '#F5DEB3',
      opacity: 0.85,
    },
  },
  {
    id: 'ludwig',
    name: 'Ludwig',
    icon: 'diamond-outline',
    style: {
      tintColor: '#E6E6FA',
      opacity: 0.9,
    },
  },
  {
    id: 'aden',
    name: 'Aden',
    icon: 'water-outline',
    style: {
      tintColor: '#B0E0E6',
      opacity: 0.8,
    },
  },
  {
    id: 'perpetua',
    name: 'Perpetua',
    icon: 'heart-outline',
    style: {
      tintColor: '#FFC0CB',
      opacity: 0.9,
    },
  },
];

const ImageFilterModal = ({ visible, onClose, originalImage, onFilterApplied }) => {
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [isProcessing, setIsProcessing] = useState(false);

  const createFilteredImageFile = async (imageUri, filter) => {
    // For visual filters, we don't need to create actual files
    // The filter effect is applied through CSS styles
    if (!filter || filter.id === 'normal') {
      return imageUri;
    }

    // Return the original image URI - filters are applied visually
    return imageUri;
  };

  const handleApplyFilter = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const selectedFilterConfig = filters.find(f => f.id === selectedFilter);
      
      // Create the filtered image object (no file creation needed)
      const filteredImage = {
        ...originalImage,
        uri: originalImage.uri, // Keep original URI
        appliedFilter: selectedFilter,
        filterConfig: selectedFilterConfig,
        filterStyle: selectedFilterConfig.style,
        isFiltered: selectedFilter !== 'normal',
        originalUri: originalImage.uri,
        // Add filter metadata for display purposes
        filterMetadata: {
          filterName: selectedFilterConfig.name,
          filterId: selectedFilter,
          appliedAt: new Date().toISOString(),
        }
      };
      
      onFilterApplied(filteredImage);
      onClose();
    } catch (error) {
      console.error('Error applying filter:', error);
      Alert.alert(
        'Filter Error',
        'Failed to apply filter. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderFilterPreview = (filter) => {
    if (!originalImage) {
      return (
        <View style={styles.filterPreviewPlaceholder}>
          <Ionicons name="image-outline" size={24} color={colors.btncolor} />
        </View>
      );
    }

    return (
      <Image 
        source={{ uri: originalImage.uri }} 
        style={[styles.filterPreview, filter.style]}
      />
    );
  };

  const renderFilterOption = (filter) => {
    const isSelected = selectedFilter === filter.id;

    return (
      <TouchableOpacity
        key={filter.id}
        style={[styles.filterOption, isSelected && styles.selectedFilterOption]}
        onPress={() => setSelectedFilter(filter.id)}
      >
        <View style={styles.filterPreviewContainer}>
          {renderFilterPreview(filter)}
        </View>
        <View style={styles.filterInfo}>
          <Ionicons
            name={filter.icon}
            size={16}
            color={isSelected ? colors.white : colors.fontMainColor}
          />
          <Text style={[styles.filterName, isSelected && styles.selectedFilterName]}>
            {filter.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMainPreview = () => {
    if (!originalImage) return null;

    const selectedFilterConfig = filters.find(f => f.id === selectedFilter);
    
    return (
      <Image
        source={{ uri: originalImage.uri }}
        style={[styles.mainPreview, selectedFilterConfig.style]}
        resizeMode="contain"
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.fontMainColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity
            onPress={handleApplyFilter}
            style={[styles.applyButton, isProcessing && styles.applyButtonDisabled]}
            disabled={isProcessing}
          >
            <Text style={styles.applyButtonText}>
              {isProcessing ? 'Processing...' : 'Apply'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewContainer}>
          {renderMainPreview()}
        </View>

        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Choose a filter</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {filters.map(renderFilterOption)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.themeBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightHorizontalLine,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.fontMainColor,
  },
  applyButton: {
    backgroundColor: colors.btncolor,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  mainPreview: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 8,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    paddingVertical: 20,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterOption: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.lightpink,
  },
  selectedFilterOption: {
    backgroundColor: colors.btncolor,
  },
  filterPreviewContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  filterPreview: {
    width: '100%',
    height: '100%',
  },
  filterPreviewPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightHorizontalLine,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterInfo: {
    alignItems: 'center',
  },
  filterName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.fontMainColor,
    marginTop: 4,
  },
  selectedFilterName: {
    color: colors.white,
  },
});

export default ImageFilterModal; 