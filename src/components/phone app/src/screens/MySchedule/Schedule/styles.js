import { StyleSheet } from 'react-native';
import { alignment, colors } from '../../../utils';
import { scale } from '../../../utils';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    ...alignment.PTsmall,
    zIndex: 2, // Place it above the protractorShape
    position: 'relative', // Adjust from absolute to prevent overlap
    width: '100%',
    ...alignment.Psmall
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  header: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    fontSize: scale(14),
    color: colors.Zypsii_color,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.lightpink,
    borderRadius: scale(20),
    padding: scale(0),
    marginBottom: scale(10),
    ...alignment.MBsmall,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    elevation: 4,
    width: '102%',
    alignSelf: 'center'
  },
  image: {
    width: scale(100),
    height: scale(110),
    borderRadius: scale(25),
    marginRight: scale(10),
    marginTop: 4
  },
  cardContent: {
    flex: 1,
    position: 'relative',
  },
  title: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(6),
    width: '100%',
  },
  routeRow: {
    flexDirection: 'colum',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: scale(5),
  },
  routeItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  routeLabel: {
    fontSize: scale(12),
    color: '#555',
    fontWeight: 'bold',
  },
  routeText: {
    fontSize: scale(14),
    color: '#555',
    marginTop: scale(5),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dash: {
    fontSize: scale(12),
    color: '#555',
    alignSelf: 'center',
  },
  date: {
    fontSize: scale(12),
    color: '#777',
    marginTop: scale(5),
  },
  riders: {
    fontSize: scale(12),
    color: '#777',
    marginTop: scale(5),
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(5),
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: scale(4),
    fontSize: scale(14),
    color: colors.Zypsii_color,
  },
  nameText: {
    fontSize: scale(14),
    color: '#333',
    fontWeight: '500',
  },
  joinedButton: {
    backgroundColor: colors.greenColor,
    borderRadius: scale(30),
    paddingVertical: scale(5),
    paddingHorizontal: scale(15),
    marginTop: scale(90),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedButtonActive: {
    backgroundColor: colors.greenColor,
  },
  joinedText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: scale(5),
  },
  joinedIcon: {
    marginRight: scale(5),
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    width: scale(36),
    height: scale(36),
    position: 'absolute',
    right: scale(10),
    top: scale(10),
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  moreButton: {
    position: 'absolute',
    right: scale(10),
    top: scale(10),
    zIndex: 1,
    padding: scale(5),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: scale(10),
    padding: scale(10),
    width: scale(200),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(8),
  },
  menuText: {
    marginLeft: scale(10),
    fontSize: scale(16),
    color: '#333',
  },
  deleteMenuItem: {
    marginTop: scale(5),
  },
  deleteMenuText: {
    color: '#FF3B30',
  },
  // Share Button
  shareButton: {
    padding: scale(5),
    marginLeft: scale(8),
    borderRadius: scale(20),
    position: 'absolute',
    right: 0,
    top: 0,
  },

  // Share Button Top Right
  shareButtonTopRight: {
    position: 'absolute',
    right: scale(8),
    top: scale(10),
    zIndex: 3,
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: scale(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Share Modal
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  shareModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: '50%',
    maxHeight: '80%',
  },

  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },

  shareModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  // Followers List
  followersList: {
    flex: 1,
  },

  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: colors.white,
  },

  followerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#f5f5f5',
  },

  followerInfo: {
    flex: 1,
  },

  followerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },

  followerUsername: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyFollowersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFollowersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  shareIconContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
});
