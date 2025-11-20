import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ImageBackground,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { colors } from '../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

const { width: screenWidth } = Dimensions.get('window');

const PostDetail = ({ route, navigation }) => {
  const { post } = route.params;
  const [showFullImage, setShowFullImage] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setAccessToken(token);

        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error fetching data from AsyncStorage:', error);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async () => {
    const token = await AsyncStorage.getItem('accessToken');

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              
              const response = await fetch(`${base_url}/post/delete/${post.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
              console.log(post)
              if (response.ok) {
                Alert.alert('Success', 'Post deleted successfully');
                navigation.goBack();
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to delete post');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Blur Effect */}
      <ImageBackground
        source={{ uri: post.imageUrl?.[0] }}
        style={styles.headerBackground}
        blurRadius={10}
      >
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Details</Text>
        </View>
      </ImageBackground>

      <ScrollView style={styles.scrollView} bounces={false}>
        {post.imageUrl && post.imageUrl.length > 0 && (
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => setShowFullImage(true)}
          >
            <Image source={{ uri: post.imageUrl[0] }} style={styles.postImage} resizeMode="cover" />
            <View style={styles.imageOverlay} />
          </TouchableOpacity>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{post.postTitle}</Text>
            <View style={styles.postTypeBadge}>
              <MaterialIcons name="public" size={14} color={colors.Zypsii_color} />
              <Text style={styles.postTypeText}>{post.postType || 'Public'}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialIcons name="favorite" size={24} color={colors.Zypsii_color} />
              <Text style={styles.statText}>{post.likes || '0'}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="comment" size={24} color={colors.Zypsii_color} />
              <Text style={styles.statText}>{post.comments || '0'}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="share" size={24} color={colors.Zypsii_color} />
              <Text style={styles.statText}>{post.shares || '0'}</Text>
            </View>
              {/* <View style={styles.statItem}>
                <TouchableOpacity onPress={handleDelete}>
                  <MaterialIcons name="delete" size={24} color={colors.Zypsii_color} />
                </TouchableOpacity>
              </View> */}
          </View>

          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.metaContainer}>
            <View style={styles.dateContainer}>
              <MaterialIcons name="access-time" size={16} color="#666" />
              <Text style={styles.dateText}>
                Posted on {new Date(post.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.authorContainer}>
              <MaterialIcons name="person" size={16} color="#666" />
              <Text style={styles.authorText}>By User</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFullImage(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: post.imageUrl?.[0] }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBackground: { height: 100, width: '100%' },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight + 10,
    paddingHorizontal: 15,
  },
  backButton: { padding: 8 },
  moreButton: { padding: 8 },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  scrollView: { flex: 1 },
  imageContainer: {
    width: screenWidth,
    height: screenWidth,
    position: 'relative',
  },
  postImage: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8E8F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  postTypeText: {
    color: colors.Zypsii_color,
    fontSize: 12,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tagItem: {
    backgroundColor: '#F8E8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: colors.Zypsii_color,
    fontSize: 12,
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
});

export default PostDetail;
