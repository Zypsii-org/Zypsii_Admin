import { Dimensions, StyleSheet } from 'react-native'
import { colors, scale, alignment, textStyles } from '../../utils'
const { height } = Dimensions.get('window')




const styles = StyleSheet.create({
    scrollview: {
        marginTop: 20, padding: 12
    },
    titletop: {
        color:'Black',
        fontSize: 20,
        textAlign: 'center',
        fontWeight: '700'
      },
    view1:{
        marginVertical:12,
        padding:55
    },
    backbutton: {
        backgroundColor:'white',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
        width:30,
        height:30,
        marginHorizontal:20
      },
      
});