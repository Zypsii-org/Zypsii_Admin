import { StyleSheet } from 'react-native';
import { colors, scale } from '../../../utils';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
  },
  backButton: {
    padding: scale(5),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  inviteButton: {
    backgroundColor: colors.Zypsii_color,
    paddingHorizontal: scale(15),
    paddingVertical: scale(8),
    borderRadius: 5,
  },
  inviteButtonText: {
    color: colors.white,
    fontSize: scale(14),
    fontWeight: '600',
  },
  tripInfo: {
    padding: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
  },
  tripName: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: scale(5),
  },
  tripDates: {
    fontSize: scale(14),
    color: colors.fontSecondColor,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
    margin: scale(15),
    padding: scale(10),
    borderRadius: 8,
  },
  searchText: {
    marginLeft: scale(10),
    color: colors.fontSecondColor,
    fontSize: scale(14),
  },
  contactList: {
    padding: scale(15),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(10),
    marginBottom: scale(10),
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grayBackground,
  },
  selectedContactItem: {
    borderColor: colors.Zypsii_color,
    backgroundColor: colors.grayBackground,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: 20,
    backgroundColor: colors.Zypsii_color,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  avatarText: {
    color: colors.white,
    fontSize: scale(18),
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: scale(2),
  },
  contactSubtext: {
    fontSize: scale(12),
    color: colors.fontSecondColor,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  emptyText: {
    fontSize: scale(16),
    color: colors.fontSecondColor,
    textAlign: 'center',
  },
});

export default styles; 