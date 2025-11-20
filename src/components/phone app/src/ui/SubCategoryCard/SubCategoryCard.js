import React from 'react';
import { TouchableOpacity, View, ImageBackground } from 'react-native';
import styles from './styles';
import { useNavigation } from '@react-navigation/native';
import { TextDefault } from '../../components';

function SubCategoryCard(props) {
  const navigation = useNavigation();
  return (
    <View style={styles.wrapper}>
      {/* Touchable Card Container */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() =>
          navigation.navigate('WhereToGo', { id: props.data._id })
        }
        style={[styles.container, props.style]}>
        <View style={styles.cardImageContainer}>
          <ImageBackground
            // source={
            //   props.data.image
            //     ? { uri: props.data.image }
            //     : require('../../assets/images/formBackground.png')
            // }
            source={require('../../storage/images/profile2.jpg')}
            defaultSource={require('../../assets/images/formBackground.png')}
            resizeMode="cover"
            style={styles.imgResponsive}
          />
        </View>
      </TouchableOpacity>

      {/* Card Text Outside the Container */}
      <TextDefault
        numberOfLines={1}
        textColor="#000" // Adjust text color for better visibility
        H5
        style={styles.cardText}>
        {/* {props.data?.title ?? '....'} */}place
      </TextDefault>
    </View>
  );
}

export default React.memo(SubCategoryCard);
