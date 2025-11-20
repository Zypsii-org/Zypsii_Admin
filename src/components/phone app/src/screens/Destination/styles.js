import { StyleSheet, Dimensions } from 'react-native';
import { alignment, colors, scale } from '../../utils';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
},
title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
},
viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.Zypsii_color + '10',
},
viewAllText: {
    color: colors.Zypsii_color,
    fontSize: 14,
    fontWeight: '500',
},
  loadingText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.fontMainColor,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.fontSecondColor,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.Zypsii_color,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: scale(120),
  },
  
  // Hero Section
  heroContainer: {
    width: '100%',
    height: height * 0.4,
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
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mapButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // Content Container
  contentContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  // Header Section
  headerSection: {
    marginBottom: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  placeName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.fontMainColor,
    flex: 1,
    lineHeight: 36,
  },
  wikipediaImageContainer: {
    marginLeft: 16,
  },
  wikipediaDebugContainer: {
    marginLeft: 16,
  },
  wikipediaImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    shadowColor: colors.Zypsii_color,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.Zypsii_color + '20',
  },
  wikipediaImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  ratingSection: {
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 16,
    color: colors.fontMainColor,
    marginLeft: 6,
    fontWeight: '600',
  },
  ratingCount: {
    fontSize: 14,
    color: colors.fontThirdColor,
    marginLeft: 8,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    marginLeft: 8,
    flex: 1,
    lineHeight: 22,
  },

  // Summary Section
  summarySection: {
    marginBottom: 2,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.grayBackground,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.fontMainColor,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    lineHeight: 24,
  },

  // Photos Section
  photosSection: {
    marginBottom: 24,
  },
  photosScrollContainer: {
    paddingHorizontal: 8,
    paddingRight: 20,
  },
  photoContainer: {
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: 140,
    height: 100,
    borderRadius: 12,
  },

  // YouTube Section
  youtubeSection: {
    marginBottom: 24,
  },
  youtubeListContainer: {
    paddingRight: 20,
    paddingVertical: 4,
  },
  youtubeCard: {
    width: 220,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.grayBackground,
  },
  youtubeThumbnail: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: colors.grayBackground,
  },
  youtubeCardContent: {
    padding: 10,
  },
  youtubeVideoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 6,
  },
  youtubeChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  youtubeChannelTitle: {
    fontSize: 13,
    color: colors.fontThirdColor,
    flexShrink: 1,
  },

  // Reviews Section
  reviewsSection: {
    marginBottom: 24,
  },
  reviewItem: {
    backgroundColor: colors.grayBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewTime: {
    fontSize: 12,
    color: colors.fontThirdColor,
  },
  reviewText: {
    fontSize: 14,
    color: colors.fontSecondColor,
    lineHeight: 20,
  },

  // Nearby Places Section
  nearbySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  viewAllText: {
    fontSize: 16,
    color: colors.Zypsii_color,
    fontWeight: '600',
  },
  nearbyPlacesContainer: {
    paddingRight: 20,
  },
  categoryPlacesContainer: {
    paddingLeft: 4,
    paddingRight: 20,
  },
  nearbyPlaceCard: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  nearbyPlaceImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  nearbyPlaceContent: {
    padding: 12,
  },
  nearbyPlaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  nearbyPlaceAddress: {
    fontSize: 14,
    color: colors.fontSecondColor,
    marginBottom: 8,
  },
  nearbyPlaceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nearbyPlaceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyPlaceRatingText: {
    fontSize: 14,
    color: colors.fontMainColor,
    marginLeft: 4,
    fontWeight: '500',
  },
  nearbyPlaceDistance: {
    fontSize: 12,
    color: colors.fontThirdColor,
  },

  // No Data Container
  noDataContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
    borderRadius: 12,
  },
  noDataText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    textAlign: 'center',
  },

  // Schedule Button
  scheduleButton: {
    marginTop: 20,
  },

  // Bottom Tab
  bottomTab: {
    marginTop: 16,
  },

  // Wikipedia Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
    backgroundColor: colors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.fontMainColor,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  modalLoadingText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    marginTop: 16,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  wikipediaInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  wikipediaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.fontMainColor,
    marginBottom: 16,
    textAlign: 'center',
  },
  wikipediaExtract: {
    fontSize: 16,
    color: colors.fontSecondColor,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'justify',
  },
  openWikipediaButton: {
    backgroundColor: colors.Zypsii_color,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  openWikipediaButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  webView: {
    flex: 1,
  },
  // Compact Video Card (for YouTube section)
  videoCard: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: colors.grayBackground,
  },
  videoCardContent: {
    padding: 12,
    width: '100%',
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
    width: '100%',
  },
  videoChannel: {
    fontSize: 12,
    color: colors.fontThirdColor,
    width: '100%',
  },
  shortCardModern: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  shortThumbnailModern: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: colors.grayBackground,
  },
  shortCardContentModern: {
    padding: 8,
  },
  shortUserRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  shortUserAvatarModern: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#333',
  },
  shortUserNameModern: {
    color: colors.fontMainColor,
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  shortTitleModern: {
    color: colors.fontMainColor,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  shortDescriptionModern: {
    color: colors.fontSecondColor,
    fontSize: 13,
    marginTop: 2,
  },
  // Category Place Card Styles
  categoryPlaceCard: {
    width: 168,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  categoryPlaceImage: {
    width: '100%',
    height: 116,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: colors.grayBackground,
  },
  categoryPlaceContent: {
    padding: 10,
  },
  categoryPlaceTitle: {
    color: colors.fontMainColor,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryPlaceAddress: {
    color: colors.fontSecondColor,
    fontSize: 12,
    marginBottom: 6,
  },
  categoryPlaceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPlaceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPlaceRatingText: {
    color: colors.fontMainColor,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  categoryPlaceDistance: {
    color: colors.fontThirdColor,
    fontSize: 11,
  },

  // Photo Viewer Modal Styles
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  photoCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCounter: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoDisplayContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoScrollContainer: {
    alignItems: 'center',
  },
  fullPhotoContainer: {
    width: width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhotoImage: {
    width: '100%',
    height: '100%',
  },
  photoNavButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  photoNavButtonLeft: {
    left: 20,
  },
  photoNavButtonRight: {
    right: 20,
  },
  photoNavButtonDisabled: {
    opacity: 0.3,
  },
  thumbnailStrip: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    height: 80,
    paddingHorizontal: 20,
  },
  thumbnailContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  thumbnailItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailItemActive: {
    borderColor: colors.Zypsii_color,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  morePhotosOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  morePhotosText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default styles;
