import { StyleSheet } from 'react-native';
import { colors, alignment } from '../../utils';

const styles = StyleSheet.create({
  // wrapper: {
  //   alignItems: 'center', // Center the card and text together
  //   marginBottom: 20, // Vertical spacing between cards
  //   width: '100%',
  // },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.grayLinesColor,
    justifyContent: 'center',
    alignItems: 'center',
    ...alignment.PxSmall,
    borderRadius: 10 ,
    marginBottom: 50
   
  },
  cardImageContainer: {
    width: '100%',
    height: '100%',
    // aspectRatio: 1.2, // Maintain consistent card size
    borderRadius: 10,
    overflow: 'hidden',
  },
  imgResponsive: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardText: {
    marginTop: -8, // Space between card and text
    marginBottom: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '90%', // Match text width to card width
    // marginLeft: -40,
  },
});

export default styles;
