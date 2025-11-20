import { Dimensions, StyleSheet } from 'react-native';
import { colors } from '../../utils';

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white, // Light purple background
  },
  itemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white, // Light purple
    paddingVertical: 20,
  },
  itemTitle: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  itemText: {
    textAlign: 'center',
    marginHorizontal: 20,
    color: '#333',
    lineHeight: 20,
  },
  itemText1: {
    textAlign: 'center',
    marginHorizontal: 35,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20, // Add space before Pagination
  },
  paginationContainer: {
    marginTop: -100, // Pulls the Pagination upward (negative margin)
    marginBottom: 10, // Optional: Controls spacing below
    alignItems: 'center',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 20,
  },
  
});

export default styles;
