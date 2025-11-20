import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { AuthProvider } from './src/components/Auth/AuthContext';
import { ScheduleProvider } from './src/context/ScheduleContext';
import { FollowProvider } from './src/components/Follow/FollowContext';
import { SplitProvider } from './src/context/SplitContext';
import { ToastProvider } from './src/context/ToastContext';
import FlashMessage from 'react-native-flash-message';
import AppContainer from './src/routes/routes';

export default function App() {
  return (
    <ToastProvider>
      <Provider store={store}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <AuthProvider>
          <ScheduleProvider>
            <FollowProvider>
              <SplitProvider>
                <AppContainer />
              </SplitProvider>
            </FollowProvider>
          </ScheduleProvider>
        </AuthProvider>
        <FlashMessage position="top" />
      </Provider>
    </ToastProvider>
  );
}