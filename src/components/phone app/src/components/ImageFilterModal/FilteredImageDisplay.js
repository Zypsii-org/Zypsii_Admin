import React from 'react';
import { Image, StyleSheet } from 'react-native';

const FilteredImageDisplay = ({ image, style, resizeMode = 'cover' }) => {
  if (!image) return null;

  // Apply filter style if available
  const imageStyle = image.isFiltered && image.filterStyle 
    ? [styles.image, style, image.filterStyle]
    : [styles.image, style];

  return (
    <Image
      source={{ uri: image.uri }}
      style={imageStyle}
      resizeMode={resizeMode}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

export default FilteredImageDisplay; 