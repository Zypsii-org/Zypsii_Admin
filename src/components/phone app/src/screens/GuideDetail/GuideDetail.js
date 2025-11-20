import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, StatusBar,SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const GuideDetail = ({ route, navigation }) => {
  const { guide } = route.params;
  const { width } = useWindowDimensions();

  const backPressed = () => {
    navigation.goBack();
  };

  const getYoutubeEmbedUrl = (url) => {
    const videoId = url.split('v=')[1];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const isYoutubeShorts = (url) => {
    return url.includes('youtube.com/shorts/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
    <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />
      
      {/* Hero Image Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: guide.image || 'https://via.placeholder.com/400x300?text=No+Image' }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={backPressed}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{guide.category}</Text>
        </View>

        {/* Gradient Overlay */}
        <View style={styles.heroOverlay} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{guide.title}</Text>
          
          {/* Author Info */}
          {guide.author && (
            <View style={styles.authorSection}>
              <Image
                source={{ 
                  uri: guide.author.profilePicture || 'https://via.placeholder.com/40?text=User'
                }}
                style={styles.authorImage}
              />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>
                  {guide.author.name || guide.author.email || 'Anonymous'}
                </Text>
                <Text style={styles.dateText}>
                  {new Date(guide.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tags Section */}
        {guide.tags && guide.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {guide.tags.map((tag, index) => (
              <View key={index} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <RenderHtml
            contentWidth={width - 32}
            source={{ html: guide.description }}
            tagsStyles={{
              p: {
                color: colors.fontMainColor,
                fontSize: 16,
                lineHeight: 24,
                marginBottom: 16,
              },
              strong: {
                color: colors.fontMainColor,
                fontWeight: 'bold',
              },
              a: {
                color: colors.Zypsii_color,
                textDecorationLine: 'underline',
              },
            }}
          />
        </View>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
   backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  heroContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
    backgroundGradient: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.Zypsii_color,
    zIndex: 1,
  },
  categoryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
  },
  dateText: {
    fontSize: 14,
    color: colors.fontThirdColor,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: colors.fontMainColor,
    fontSize: 14,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  placeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 16,
  },
  placeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeImage: {
    width: '100%',
    height: 200,
  },
  placeInfo: {
    padding: 16,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 14,
    color: colors.fontThirdColor,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: colors.fontMainColor,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.fontThirdColor,
    marginLeft: 4,
  },
});

export default GuideDetail; 