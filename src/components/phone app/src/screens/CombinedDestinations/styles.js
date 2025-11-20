import { StyleSheet, Dimensions } from 'react-native';
import { colors, scale } from '../../utils';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  headerContainer: {
    padding: scale(10),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor
  },
  viewSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: scale(10)
  },
  viewButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(20),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.btncolor
  },
  selectedViewButton: {
    backgroundColor: colors.btncolor
  },
  viewButtonText: {
    color: colors.btncolor,
    fontSize: scale(14)
  },
  selectedViewButtonText: {
    color: colors.white
  },
  listContainer: {
    padding: scale(10),
    paddingBottom: 100
  },
  itemCardContainer: {
    width: (width - scale(30)) / 2,
    margin: scale(5)
  },
  loaderContainer: {
    padding: scale(20),
    alignItems: 'center'
  }
});

export default styles; 