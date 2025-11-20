import { StyleSheet } from 'react-native';
import { scale } from '../../utils';
import { colors } from '../../utils';

const styles = StyleSheet.create({
  safeAreaStyle: {
    flex: 1,
    backgroundColor: colors.Zypsii_color,
  },
  container: {
    flex: 1,
    backgroundColor: colors.Zypsii_color,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.Zypsii_color,
  },
  backgroundImageStyle: {
    resizeMode: 'contain',
    width: '100%',
    marginTop: scale(-80),
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 5,
    borderColor: colors.Zypsii_color,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  description: {
    fontSize: 14,
    color: colors.fontSecondColor,
    textAlign: 'center',
    marginHorizontal: 30,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  editProfileButton: {
    backgroundColor: colors.Zypsii_color,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: colors.Zypsii_color,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
  },
  separatorLine: {
    height: 1,
    backgroundColor: colors.graycolor,
    marginVertical: -2,
  },
  gridContainer: {
    marginTop: 0,
    borderWidth: 0,
    borderColor: colors.white,
  },
  gridImage: {
    width: 140,
    height: 120,
    margin: 0,
    borderWidth: 1,
    borderColor: colors.white,
  },
  placeholderBox: {
    width: 100,
    height: 100,
    margin: 5,
    backgroundColor: colors.graycolor,
  },
  activeIconBox: {
    borderBottomWidth: 3,
    borderBottomColor: colors.Zypsii_color,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 3,
  },
  iconBox: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
  },
});

export default styles;