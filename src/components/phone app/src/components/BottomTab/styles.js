import { StyleSheet } from 'react-native';
import { alignment, colors, scale } from '../../utils';

export default StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: colors.themeBackground,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 999,
  },
  footerBtnContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(2),
  },
  iconContainer: {
    width: scale(24),
    height: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  uploadContainer: {
    marginTop: scale(-4),
  },
  uploadIconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: colors.greenColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.greenColor,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  uploadText: {
    fontSize: scale(8),
    marginTop: scale(1),
    color: colors.greenColor,
    fontWeight: '600',
  },
  imgContainer: {
    width: scale(24),
    height: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    width: scale(24),
    height: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeText: {
    fontSize: scale(8),
    marginTop: scale(1),
    color: colors.greenColor,
    fontWeight: '600',
  },
  inactiveText: {
    fontSize: scale(8),
    marginTop: scale(1),
    color: colors.darkGrayText,
    fontWeight: '400',
  },
});
