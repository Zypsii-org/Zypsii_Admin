import { fontStyles } from '../../utils/fontStyles';
import { scale } from '../../utils/scaling';
import { colors } from '../../utils/colors';
import { Dimensions } from 'react-native';
import { alignment } from '../../utils';
import { StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export default {
  container: {
    width: width,
    height: height * 0.10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 999,
    elevation: 999,
  },
  subContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 47, 47, 0.5)',
    borderRadius: 25,
    marginRight: 15,
    elevation: 5,
    zIndex: 1000,
  },
  headerText: {
    fontFamily: fontStyles.PoppinsBold,
    fontSize: scale(16),
    color: colors.white,
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    color: colors.white,
    width: 120,
    height: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 47, 47, 0.5)',
    borderRadius: 20,
    marginLeft: 10,
    elevation: 5,
    zIndex: 1000,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.btncolor,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 1001,
  },
  badgeText: {
    color: colors.white,
    fontSize: scale(10),
    fontWeight: 'bold',
  },
};
