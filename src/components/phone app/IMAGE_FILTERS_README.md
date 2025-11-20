# Image Filter System for Zypsii

This document explains how the Instagram-like image filter system works in the Zypsii app.

## Overview

The image filter system allows users to apply various filters to their images before posting, similar to Instagram's filter functionality. The system uses `react-native-image-filter-kit` for real-time filter previews and creates filtered image files for upload.

## Components

### 1. ImageFilterModal (`src/components/ImageFilterModal/ImageFilterModal.js`)
- Main modal component for selecting and applying filters
- Shows filter previews in real-time
- Creates filtered image files with metadata
- Supports 12 different Instagram-like filters

### 2. FilteredImageDisplay (`src/components/ImageFilterModal/FilteredImageDisplay.js`)
- Utility component for displaying filtered images
- Automatically applies the correct filter when rendering
- Handles both filtered and unfiltered images

### 3. PostUpload Integration (`src/screens/PostUpload/PostUpload.js`)
- Integrates filter functionality into post creation
- Handles filtered image uploads
- Sends filter metadata to the backend

## Available Filters

1. **Normal** - No filter applied
2. **Clarendon** - Bright, high contrast with enhanced saturation
3. **Gingham** - Soft, muted colors with reduced contrast
4. **Moon** - Dark, high contrast black and white
5. **Lark** - Bright with enhanced saturation
6. **Reyes** - Warm, vintage look with sepia
7. **Juno** - Bright with warm hue shift
8. **Slumber** - Cool, desaturated with blue tint
9. **Crema** - Warm with slight sepia
10. **Ludwig** - Bright with enhanced contrast
11. **Aden** - Soft, cool tones
12. **Perpetua** - Bright with warm pink tint

## How It Works

### 1. Filter Selection
- User opens the filter modal from the PostUpload screen
- Real-time previews show how each filter affects the image
- User selects desired filter and applies it

### 2. Filter Application
- Creates a copy of the original image in the app's document directory
- Stores filter metadata in a JSON file
- The filtered image object contains:
  - `uri`: Path to the filtered image file
  - `isFiltered`: Boolean indicating if filter is applied
  - `appliedFilter`: ID of the applied filter
  - `filterConfig`: Complete filter configuration
  - `filterComponent`: React component for rendering the filter
  - `originalUri`: Path to the original image

### 3. Image Display
- `FilteredImageDisplay` component automatically applies the correct filter
- Uses `react-native-image-filter-kit` for real-time rendering
- Falls back to original image if no filter is applied

### 4. Upload Process
- Filtered images are uploaded with metadata
- Backend receives filter information for storage
- Filename includes filter information for identification

## File Structure

```
src/
├── components/
│   └── ImageFilterModal/
│       ├── ImageFilterModal.js          # Main filter modal
│       └── FilteredImageDisplay.js      # Filter display component
└── screens/
    └── PostUpload/
        └── PostUpload.js                # Post creation with filters
```

## Usage

### Applying Filters
1. Select an image in PostUpload screen
2. Tap the "Filter" button
3. Choose from available filters
4. Tap "Apply" to confirm

### Removing Filters
1. Tap "Remove" button next to filter controls
2. Image returns to original state

### Uploading Filtered Images
1. Filtered images are automatically uploaded with metadata
2. Backend receives filter information
3. Posts display with applied filters

## Technical Details

### Dependencies
- `react-native-image-filter-kit`: For filter effects
- `expo-file-system`: For file operations
- `@expo/vector-icons`: For UI icons

### Filter Configuration
Each filter has specific values for:
- Brightness (-1.0 to 1.0)
- Contrast (0.0 to 2.0)
- Saturation (0.0 to 2.0)
- Sepia (0.0 to 1.0)
- Grayscale (boolean)
- Hue (-180 to 180)

### File Management
- Original images are preserved
- Filtered images are stored in app's document directory
- Metadata files track filter information
- Automatic cleanup can be implemented

## Backend Integration

The system sends the following data to the backend:

### Upload Request
```json
{
  "mediaFile": "filtered_image_file",
  "filterMetadata": {
    "filterName": "Clarendon",
    "filterId": "clarendon",
    "appliedAt": "2024-01-01T12:00:00Z",
    "originalUri": "original_image_path"
  }
}
```

### Post Creation
```json
{
  "postTitle": "My Post",
  "postType": "Public",
  "mediaType": "image",
  "mediaUrl[]": "uploaded_image_url",
  "filterApplied": "clarendon",
  "filterName": "Clarendon"
}
```

## Troubleshooting

### Common Issues
1. **Filter not showing**: Check if `react-native-image-filter-kit` is properly installed
2. **Upload fails**: Verify file permissions and network connectivity
3. **Performance issues**: Consider image compression for large files

### Debugging
- Check console logs for filter application errors
- Verify file paths in document directory
- Test with different image formats

## Future Enhancements

1. **Custom Filters**: Allow users to create custom filter combinations
2. **Filter Intensity**: Add slider for filter strength adjustment
3. **Batch Processing**: Apply filters to multiple images
4. **Filter Presets**: Save favorite filter combinations
5. **Advanced Effects**: Add blur, vignette, and other effects

## Support

For issues or questions about the filter system, check:
1. Console logs for error messages
2. File system permissions
3. Dependencies installation
4. Backend API compatibility 