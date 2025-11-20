import { colors, alignment, textStyles, scale } from '../../utils'
import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroudGray,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    borderRadius: scale(5),
    ...alignment.PLsmall
  },
  button: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...alignment.PLxSmall,
    ...alignment.PRxSmall,
    ...alignment.MRxSmall
  },
  textfield: {
    ...textStyles.Regular,
    ...textStyles.H5,
    ...alignment.PLsmall,
    flex: 1
  }
})
export default styles
