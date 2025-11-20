import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../utils'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import styles from './Styles'
import { base_url } from '../../utils/base_url'
import { useToast } from '../../context/ToastContext'
import { Picker } from '@react-native-picker/picker'
import * as FileSystem from 'expo-file-system'

// gl-react imports
import { Surface } from 'gl-react-expo'
import { Node, Shaders } from 'gl-react'

const { width: screenWidth } = Dimensions.get('window')

// === Shaders for filters ===
const shaders = Shaders.create({
  // Passthrough shader for original image
  passthrough: {
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D tex;
      void main () {
        gl_FragColor = texture2D(tex, uv);
      }`
  },
  grayscale: {
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D tex;
      void main () {
        vec4 c = texture2D(tex, uv);
        float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(vec3(gray), c.a);
      }`
  },
  sepia: {
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D tex;
      void main () {
        vec4 c = texture2D(tex, uv);
        float r = dot(c.rgb, vec3(0.393, 0.769, 0.189));
        float g = dot(c.rgb, vec3(0.349, 0.686, 0.168));
        float b = dot(c.rgb, vec3(0.272, 0.534, 0.131));
        gl_FragColor = vec4(r, g, b, c.a);
      }`
  },
  vibrant: {
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D tex;
      void main () {
        vec4 c = texture2D(tex, uv);
        gl_FragColor = vec4(c.r * 1.2, c.g * 1.1, c.b * 1.3, c.a);
      }`
  }
})

// === Filter list ===
const FILTERS = [
  { id: 'original', name: 'Original' },
  { id: 'grayscale', name: 'B&W' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'vibrant', name: 'Vibrant' }
]

// === FilterPreview Component ===
const FilterPreview = ({ uri, filter, style, surfaceRef }) => {
  // For original filter, use regular Image component for better performance
  if (!filter || filter === 'original') {
    return <Image source={{ uri }} style={style} resizeMode='cover' />
  }

  // For other filters, use Surface with the appropriate shader
  const shaderToUse = shaders[filter] || shaders.passthrough

  return (
    <Surface style={style} ref={surfaceRef}>
      <Node shader={shaderToUse} uniforms={{ tex: { uri } }} />
    </Surface>
  )
}

// === FilterModal Component ===
const FilterModal = ({ visible, onClose, image, onFilterApplied }) => {
  const [selectedFilter, setSelectedFilter] = useState('original')
  const surfaceRef = useRef(null)

  if (!visible) return null

  const captureFilteredImage = async () => {
    try {
      if (selectedFilter === 'original') {
        // Return original image
        onFilterApplied({
          ...image,
          isFiltered: false,
          appliedFilter: null,
          filteredUri: null
        })
        return
      }

      if (surfaceRef.current) {
        // Capture the filtered image from GL Surface
        const result = await surfaceRef.current.glView.capture({
          format: 'jpg',
          quality: 0.8,
          result: 'tmpfile'
        })

        onFilterApplied({
          ...image,
          isFiltered: true,
          appliedFilter: selectedFilter,
          filteredUri: result.uri
        })
      } else {
        // Fallback to original image with filter metadata
        onFilterApplied({
          ...image,
          isFiltered: true,
          appliedFilter: selectedFilter,
          filteredUri: null
        })
      }
    } catch (error) {
      console.error('Error capturing filtered image:', error)
      // Fallback to original image
      onFilterApplied({
        ...image,
        isFiltered: false,
        appliedFilter: null,
        filteredUri: null
      })
    }
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        zIndex: 1000
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 15
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Ionicons name='close' size={28} color='#fff' />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
            Filters
          </Text>
          <TouchableOpacity
            onPress={captureFilteredImage}
            style={{
              backgroundColor: colors.btncolor,
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Main Preview */}
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <FilterPreview
            uri={image.uri}
            filter={selectedFilter}
            style={{
              width: screenWidth - 40,
              height: (screenWidth - 40) * 1.25
            }}
            surfaceRef={selectedFilter !== 'original' ? surfaceRef : null}
          />
        </View>

        {/* Filter Options */}
        <View style={{ paddingVertical: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setSelectedFilter(f.id)}
                style={{ alignItems: 'center', marginHorizontal: 8 }}
              >
                <FilterPreview
                  uri={image.uri}
                  filter={f.id}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 10,
                    borderWidth: selectedFilter === f.id ? 3 : 1,
                    borderColor:
                      selectedFilter === f.id
                        ? colors.btncolor
                        : 'rgba(255,255,255,0.3)'
                  }}
                />
                <Text
                  style={{
                    color: selectedFilter === f.id ? colors.btncolor : '#fff',
                    fontSize: 12,
                    fontWeight: selectedFilter === f.id ? '700' : '500',
                    marginTop: 4
                  }}
                >
                  {f.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  )
}

// === Main Component ===
function PostUpload() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [originalImage, setOriginalImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [postType, setPostType] = useState('Public')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const navigation = useNavigation()
  const { showToast } = useToast()

  const handleBackPress = () => navigation.goBack()

  const handleFilterApplied = (filteredImage) => {
    setImage(filteredImage)
    setShowFilterModal(false)

    if (filteredImage.isFiltered) {
      showToast(`${filteredImage.appliedFilter} filter applied!`, 'success')
    } else {
      showToast('Filter removed', 'success')
    }
  }

  const openFilterModal = () => {
    if (image) {
      setShowFilterModal(true)
    } else {
      showToast('Please select an image first', 'error')
    }
  }

  const removeFilter = () => {
    if (originalImage) {
      setImage({
        ...originalImage,
        isFiltered: false,
        appliedFilter: null,
        filteredUri: null
      })
      showToast('Filter removed', 'success')
    }
  }

  const pickImage = async () => {
    Alert.alert('Select Media', 'Choose an option', [
      { text: 'Camera', onPress: () => openCamera() },
      { text: 'Gallery', onPress: () => openGallery() },
      { text: 'Cancel', style: 'cancel' }
    ])
  }

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8
      })
      if (!result.canceled) {
        const selected = result.assets[0]
        setImage(selected)
        setOriginalImage(selected)
      }
    } else {
      showToast('Camera access required.', 'error')
    }
  }

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permission.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8
      })
      if (!result.canceled) {
        const selected = result.assets[0]
        setImage(selected)
        setOriginalImage(selected)
      }
    } else {
      showToast('Media library access required.', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!image) {
      showToast('Please select an image', 'error')
      return
    }
    if (!title.trim()) {
      showToast('Please add a title', 'error')
      return
    }

    try {
      setIsLoading(true)
      const accessToken = await AsyncStorage.getItem('accessToken')
      if (!accessToken) {
        showToast('You need to log in first.', 'error')
        setIsLoading(false)
        return
      }

      // Determine which image URI to upload
      const imageToUpload =
        image.isFiltered && image.filteredUri ? image.filteredUri : image.uri

      // Check if filtered image file exists
      if (image.isFiltered && image.filteredUri) {
        const fileInfo = await FileSystem.getInfoAsync(image.filteredUri)
        if (!fileInfo.exists) {
          console.warn('Filtered image file not found, using original')
          imageToUpload = image.uri
        }
      }

      const uploadFormData = new FormData()
      uploadFormData.append('mediaFile', {
        uri: imageToUpload,
        type: 'image/jpeg',
        name: `post_${Date.now()}${image.isFiltered ? '_filtered' : ''}.jpg`
      })

      const uploadResponse = await fetch(
        `${base_url}/uploadFile?mediaType=post`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          },
          body: uploadFormData
        }
      )

      const uploadData = await uploadResponse.json()
      if (!uploadData.status) {
        throw new Error('Upload failed')
      }

      const postFormData = new FormData()
      postFormData.append('postTitle', title.trim())
      postFormData.append('postType', postType)
      postFormData.append('mediaType', 'image')
      postFormData.append('mediaUrl[]', uploadData.urls[0])
      postFormData.append('tags[]', 'tag1')

      if (description.trim()) {
        postFormData.append('postDescription', description.trim())
      }

      // Add filter information
      if (image.isFiltered) {
        postFormData.append('filterApplied', image.appliedFilter)
        postFormData.append('isFiltered', 'true')
        postFormData.append(
          'hasFilteredImage',
          image.filteredUri ? 'true' : 'false'
        )
      }

      const response = await fetch(`${base_url}/post/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        },
        body: postFormData
      })

      if (response.ok) {
        showToast('Post created successfully!', 'success')

        // Clean up temporary filtered image file
        if (image.isFiltered && image.filteredUri) {
          try {
            await FileSystem.deleteAsync(image.filteredUri, {
              idempotent: true
            })
          } catch (cleanupError) {
            console.warn('Failed to cleanup filtered image:', cleanupError)
          }
        }

        navigation.goBack()
      } else {
        const errorData = await response.json()
        console.error('Post creation failed:', errorData)
        showToast('Error creating post', 'error')
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      showToast('Error uploading post.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name='arrow-back' size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {image ? (
            <View style={styles.imageContainer}>
              <FilterPreview
                uri={
                  image.isFiltered && image.filteredUri
                    ? image.filteredUri
                    : image.uri
                }
                filter={image.appliedFilter || 'original'}
                style={styles.selectedImage}
              />
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name='camera' size={50} color={colors.btncolor} />
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Filter Controls */}
        {image && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 15,
              marginBottom: 20
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: colors.btncolor,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 25,
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 12
              }}
              onPress={openFilterModal}
            >
              <Ionicons
                name='color-filter-outline'
                size={20}
                color={colors.white}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: colors.white, fontWeight: '600' }}>
                {image.isFiltered ? 'Change Filter' : 'Add Filter'}
              </Text>
            </TouchableOpacity>

            {image.isFiltered && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#ff4757',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 25,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
                onPress={removeFilter}
              >
                <Ionicons
                  name='close-circle-outline'
                  size={20}
                  color={colors.white}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: colors.white, fontWeight: '600' }}>
                  Remove
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Filter Status Indicator */}
        {image && image.isFiltered && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 15
            }}
          >
            <View
              style={{
                backgroundColor: colors.btncolor,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 15,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Ionicons
                name='checkmark-circle'
                size={16}
                color={colors.white}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{ color: colors.white, fontSize: 12, fontWeight: '500' }}
              >
                {image.appliedFilter} filter applied
              </Text>
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder='Add a title...'
            placeholderTextColor='#999'
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.descriptionInput}
            placeholder='Add a description...'
            placeholderTextColor='#999'
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Post Type:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={postType}
              style={styles.picker}
              onValueChange={(itemValue) => setPostType(itemValue)}
            >
              <Picker.Item label='Public' value='Public' />
              <Picker.Item label='Followers Only' value='FollowersOnly' />
              <Picker.Item label='My Posts' value='my' />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
            { marginTop: 20, marginBottom: 30 }
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color='#fff' size='small' />
              <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>
                {image && image.isFiltered
                  ? 'Sharing filtered image...'
                  : 'Sharing...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Share Post</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showFilterModal && (
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          image={originalImage}
          onFilterApplied={handleFilterApplied}
        />
      )}
    </SafeAreaView>
  )
}

export default PostUpload