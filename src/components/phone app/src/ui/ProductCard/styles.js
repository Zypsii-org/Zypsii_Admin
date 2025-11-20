import { StyleSheet, Dimensions } from 'react-native'
import { alignment, colors, scale} from '../../utils'

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: scale(12),
    marginBottom: scale(8),
    marginTop: scale(8),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  topCardContainer: {
    width: '100%',
    height: scale(180),
    borderTopLeftRadius: scale(8),
    borderTopRightRadius: scale(8),
    overflow: 'hidden',
  },
  imgResponsive: {
    width: '100%',
    height: '100%',
  },
  botCardContainer: {
    padding: scale(6),
  },
  botSubCardContainer: {
    flexDirection: 'column',
    gap: scale(2),
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
  },
  distanceText: {
    fontSize: scale(11),
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
  },
  ratingText: {
    fontSize: scale(11),
    fontWeight: '500',
  },
  aboutRestaurant: {
    width: '20%',
    justifyContent: 'center'
  },
  likeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 5,
  },
  offerContainer: {
    position: 'absolute', // Positioned relative to the parent container
    top: 0, // Distance from the top edge
    left: 0, // Distance from the left edge
    backgroundColor: colors.greenColor, // Green background color
    paddingHorizontal: 10, // Horizontal padding
    paddingVertical: 5, // Vertical padding
    borderRadius: 5, // Rounded corners
    zIndex: 1, // Ensure it appears above the image
  }, 
  font: {
    marginLeft: 2,
    backgroundColor: 'aqua',
    alignContent: 'center'
  },
  locationText: {
    fontSize: scale(12),
    color: colors.grayColor,
    marginTop: scale(4),
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: scale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default styles;
