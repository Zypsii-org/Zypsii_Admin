import { Dimensions, StyleSheet } from 'react-native'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'; // Ensure correct import
import {
  alignment,
  fontStyles,
  colors,
  scale,
  verticalScale
} from '../../utils'
const { height, width } = Dimensions.get('window')

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  safeAreaStyle: {
    backgroundColor: colors.headerbackground
  },
  leftIconPadding: {
    ...alignment.PLsmall,
    ...alignment.PRlarge
  },
  scrollViewStyle: {
    marginTop: verticalScale(20),
    backgroundColor: colors.themeBackground
  },
  grayBackground: {
    backgroundColor: colors.white
  },
  caroselContainer: {
    width: '100%',
    height: height * 0.3,
    position: 'relative',
    padding: 20,
    borderRadius: scale(70), // Increase borderRadius here
    overflow: 'hidden', // Ensure content respects rounded corners
    marginTop: verticalScale(15),
    marginBottom: verticalScale(-16),
    alignItems: 'center',
    
  },
  caroselStyle: {
    width,
    height: height * 0.3,
    borderRadius: scale(70), // Increase borderRadius here
  },
  headerContainer: {
    flexDirection: 'row', // Keeps the notification button and location at the same horizontal level
    justifyContent: 'space-between', // Ensures proper spacing
    alignItems: 'center', // Aligns items to the top
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
  },
  locationWrapper: {
    alignItems: 'flex-start', // Ensures everything aligns left
  },
  
  locationContainer: {
    flexDirection: 'row', // Ensures the icon, text, and arrow stay row-wise
    alignItems: 'center', // Vertically aligns items in the row
  },
  notificationIconWrapper: {
    marginLeft: 10,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.Zypsii_color || '#6366f1',
    borderRadius: scale(10),
    minWidth: scale(18),
    height: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(4),
    zIndex: 10,
  },
  notificationText: {
    color: colors.white,
    fontSize: scale(10),
    fontWeight: '600',
  },
  locationText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#00000',
    marginLeft: scale(5),
    marginRight: scale(5),
  },
  
  notificationIcon: {
    marginLeft: scale(5),
    padding: scale(10)
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#808080',
    marginBottom: verticalScale(5), // Space between "Location" and the container
    padding: scale(7)
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: scale(15),
    marginLeft: scale(0)
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background
    borderRadius: scale(10),
    marginHorizontal: scale(20),
    marginTop: verticalScale(10),
    padding: scale(13),
    // Shadow for iOS
    shadowColor: '#808080', // Gray shadow color
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 5, // Adjust elevation for the desired shadow effect
  },  
  
  searchInput: {
    flex: 1,
    marginLeft: scale(10),
    color: '#000',
    fontSize: 18,
  },
  menuDrawerContainer: {
    position: 'absolute',
    top: '10%',
    left: '2%'
  },
  imgResponsive: {
    flex: 1,
    width: undefined,
    height: undefined
  },
  headingText: {
    fontFamily: fontStyles.PoppinsRegular,
    fontSize: scale(16)
  },
  itemCardContainer: {
    width: scale(160),
    height: scale(220),
    borderRadius: scale(6),
    borderColor: colors.whiteColor,
    borderWidth: scale(3),
    ...alignment.MTsmall,
    ...alignment.MRlarge,
    
  },
  iconContainer: {
    width: scale(60),  // Adjust width as needed
    height: verticalScale(60),  // Adjust height
    marginRight: scale(27),  // Decreased space between containers
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(40),
    overflow: 'hidden',
    backgroundColor: '#E0F8FF',  // Replace this with your desired color code
    marginTop: scale(16)
  },  
  iconImage: {
    width: '100%',  // Image fills the container
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    resizeMode: 'cover',  // Ensures image covers the circle without distortion
  },
  categoryContainer: {
    marginTop: verticalScale(10),
    paddingHorizontal: scale(10), // Adjust for proper spacing
  },
  titleSpacer: {
    marginLeft: '1%',
    marginTop: scale(15)
  },
  titleSpacernearest: {
    marginLeft: '1%',
    marginTop: scale(5),
    marginBottom: '1%',
  },
  titleSpaceredge: {
    marginLeft: '1%',
    marginTop: scale(5)
  },
  titleSpacerdesti: {
    marginLeft: '1%',
    marginTop: scale(5)
  },
  productCard: {
    marginLeft: '1%',
    width: '43%',
    height: scale(180),
    marginTop: scale(10),
    marginBottom: scale(10),
    borderColor: colors.whiteColor,
    borderWidth: scale(8),
  },
  seeAllTextContainer: {
    flex: 1, // Ensures it takes the remaining space and pushes text to the right
    alignItems: 'flex-end', // Aligns text to the right
    marginTop: scale(1), // If you want a bit of space above
  },
  locationImage: {
    width: 34,  // Adjust width
    height: 34, // Adjust height
    marginRight: 8, // Space between image and text
  },
  locationText: {
    fontSize: 16,  // Adjust text size
    color: '#333',  // Adjust text color
  },

  icon: {
    paddingHorizontal: 5,
  },

  rightIconsContainer: {
    flexDirection: 'row', // Align icons in a row
    alignItems: 'center', // Center them vertically
  },
  
  seeAllText: {
    textAlign: 'right', // Align the text itself to the right
    marginRight: '6%',
    marginTop: scale(-35), // Move the "See All" text upwards (negative value to shift it up
  },
  
  spacer: {
    ...alignment.MBsmall
  },
  categoryWrapper: {
    alignItems: 'center', // Center align the icon and text
    marginRight: scale(17), // Add some spacing between categories
    padding: 12,
    marginLeft: scale(-6),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
   likeIconContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    marginTop: 200, // Ensure it overlaps the protractorShape
    paddingVertical: 20,
    zIndex: 2, // Place it above the protractorShape
    position: 'relative', // Adjust from absolute to prevent overlap
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.Zypsii_color,
  },
  buttonText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    fontWeight: '500',
  },
  selectedButtonText: {
    color: colors.Zypsii_color,
    fontWeight: '600',
  },
  videoShortsContainer: {
    marginVertical: verticalScale(-5),
    paddingHorizontal: scale(10),
    marginTop: 0
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  scheduleContainer: {
    //padding: wp('4%'), // Dynamic padding based on screen width
    //marginTop: hp('2%'),
    // marginTop: verticalScale(20),
    paddingHorizontal: scale(0),
    backgroundColor: '#fff',
    paddingBottom: verticalScale(0),
  },
  scheduleheadContainer:{
    flexDirection: 'row',
    //marginBottom: hp('2%'),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: scale(6),
    ...alignment.PxSmall
  },
  card: {
    width: 150,
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: scale(5),
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: scale(5),
  },
  routeItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  routeLabel: {
    color: colors.fontMainColor,
    fontWeight: 'bold',
  },
  routeText: {
    color: colors.fontSecondColor,
    marginTop: scale(5),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    color: colors.fontSecondColor,
    marginTop: scale(5),
    fontSize: 14
  },
  riders: {
    color: colors.fontSecondColor,
    marginTop: scale(5),
    fontSize: 14
  },
  joinedButton: {
    backgroundColor: colors.btncolor,
    borderRadius: scale(30),
    paddingVertical: scale(5),
    paddingHorizontal: scale(15),
    marginTop: scale(90),
    marginLeft: -80
  },
  joinedText: {
    color: colors.white,
    fontSize: 14,
  },
  discoverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginVertical: 10,
    ...alignment.MBmedium,
  },
  discoverText: {
   fontSize: 16,
   fontWeight: "bold",
   color: colors.fontMainColor,
 },
 viewAllText: {
   fontSize: 14,
   color: colors.btncolor,
   fontWeight: "500",
 },
 contentContainer: {
    flex: 1,
    width: '100%',
  },
  bottomTabContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: colors.themeBackground,
  },
  mainContent: {
    flex: 1,
    paddingBottom: scale(60), // Add padding for bottom tab
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: scale(60), // Add padding for bottom tab
  },
  discoverCard: {
    width: width * 0.45,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: scale(10),
    marginBottom: scale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  discoverCardImage: {
    width: '100%',
    height: scale(120),
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  discoverCardContent: {
    padding: scale(10),
  },
  discoverCardTitle: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: scale(4),
  },
  discoverCardSubtitle: {
    fontSize: scale(12),
    color: colors.fontThirdColor,
    marginBottom: scale(8),
  },
  discoverCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discoverCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoverCardDistance: {
    fontSize: scale(12),
    color: colors.fontThirdColor,
  },
  // Shorts Section Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  shortsListContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  shortItemContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: colors.black,
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  interactionButtonsContainer: {
    position: 'absolute',
    right: scale(15),
    bottom: verticalScale(120),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  interactionButton: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  interactionCount: {
    marginTop: verticalScale(4),
    fontSize: 12,
    color: colors.white,
  },
  videoInfoOverlay: {
    position: 'absolute',
    bottom: verticalScale(20),
    left: scale(15),
    right: scale(80),
    padding: scale(10),
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    zIndex: 2,
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  followButtonContainer: {
    marginTop: 5,
    minWidth: 80,
  },
  videoTitle: {
    color: colors.white,
    fontSize: scale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  videoDescription: {
    color: colors.white,
    fontSize: scale(14),
    opacity: 0.8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  errorMessageContainer: {
    position: 'absolute',
    bottom: verticalScale(20),
    left: scale(15),
    right: scale(15),
    padding: scale(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    alignItems: 'center',
  },
 buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.Zypsii_color,
  },
  buttonText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    fontWeight: '500',
  },
  selectedButtonText: {
    color: colors.Zypsii_color,
    fontWeight: '600',
  },})
export default styles

