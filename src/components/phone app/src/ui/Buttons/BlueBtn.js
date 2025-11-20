import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Spinner } from '../../components';
import { blueBtn as styles } from './styles';
import { colors } from '../../utils';

/* =============================================================================
<BlueBtn />
Blue button component with customizable styles.

Props:
  - onPress (function): Function to call on button press.
  - text (string): Text to display on the button.
  - loading (boolean): Whether to show a loading spinner.
  - style (object): Additional styles for the button.
============================================================================= */

const BlueBtn = (props) => (
  <View style={[styles.backgroundColor, props.style]}>
    {/* {props.loading ? (
      <Spinner backColor="rgba(0,0,0,0.9)" spinnerColor={colors.white} />
    ) : ( */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={props.onPress}
        style={[styles.main_blue_btn, props.style]} // Apply custom styles here
      >
        <Text style={styles.btn_text}>{props.text}</Text>
      </TouchableOpacity>
    {/* )} */}
  </View>
);

export default BlueBtn;
