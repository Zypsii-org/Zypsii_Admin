import { alignment } from './alignment';
import { colors } from './colors';
import { StyleSheet, Dimensions } from 'react-native';
import { scale } from './scaling';
import { textStyles } from './textStyles';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    position: 'relative',
  },
  backgroundCurvedContainer: {
    backgroundColor: colors.btncolor,
    height: 200,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  protractorShape: {
    backgroundColor: colors.white,
    height: 500,
    width: 1000,
    borderTopLeftRadius: 500,
    borderTopRightRadius: 500,
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    zIndex: 1,
    overflow: 'hidden',
  },
  scrollContainer: {
    marginTop: 200, // Ensure it overlaps the protractorShape
    paddingVertical: 20,
    zIndex: 2, // Place it above the protractorShape
    position: 'relative', // Adjust from absolute to prevent overlap
    width: '100%',
  },
  grayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  card: {
    width: '48%',
    backgroundColor: colors.white,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
    padding: 10,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    alignSelf: 'flex-start',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.fontThirdColor,
    marginLeft: 5,
  },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  headerContainer: {
    position: 'absolute',
    top: 110, // Adjusted top margin to ensure space from the top
    zIndex: 2, // Placed above the protractorShape
    width: '100%',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  tripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightpink,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  tripButtonText: {
    fontSize: 13,
    color: colors.fontMainColor,
    marginRight: 5,
    fontWeight: 'bold',
  },
  title: {
    ...alignment.Psmall,
    ...alignment.PLxSmall,
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.fontMainColor,
    textAlign: 'left',
    alignSelf: 'flex-start',
    ...alignment.PBsmall
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

datecontainer:{
    zIndex: 2, // Place it above the protractorShape
    position: 'relative', // Adjust from absolute to prevent overlap
    width: '100%',
    // marginTop: 110,
    ...alignment.Pmedium
  },
  dateScheduleContainer: {
    backgroundColor: colors.white,
    ...alignment.Pmedium,
    borderRadius: 20,
    // elevation: 2,
    ...alignment.MBmedium, // Example of using margin-bottom from alignment
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    shadowColor: colors.grayLinesColor,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 6,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 2, // Place it above the protractorShape
    position: 'relative', // Adjust from absolute to prevent overlap
    width: '100%',
    marginTop: 110
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...alignment.MBsmall,
  },
  monthText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  navButton: {
    fontSize: 20,
    fontWeight: "bold",
  },
  dayContainer: {
    alignItems: "center",
    ...alignment.Msmall,
    ...alignment.Psmall,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  selectedDayContainer: {
    backgroundColor: colors.btncolor,
  },
  weekText: {
    fontSize: 14,
    color: "#6b7280",
  },
  selectedWeekText: {
    color: "#ffffff",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  selectedDayText: {
    color: "#ffffff",
  },
  content: {
    ...alignment.MTmedium,
    ...alignment.Pmedium,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.btncolor,
    ...alignment.MBsmall,
  },
  noScheduleText: {
    fontSize: 16,
    color: "#6b7280",
  },
  
});

export default styles;