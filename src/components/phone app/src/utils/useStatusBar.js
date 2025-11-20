import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { colors } from './colors';

export const useStatusBar = (backgroundColor = colors.btncolor, barStyle = 'light-content') => {
  useEffect(() => {
    StatusBar.setBackgroundColor(backgroundColor);
    StatusBar.setBarStyle(barStyle);
    StatusBar.setTranslucent(false);
  }, [backgroundColor, barStyle]);
}; 