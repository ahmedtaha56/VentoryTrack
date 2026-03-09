import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './context/Authcontext';
import AppProvider from './context/AppContext';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />
        <RootNavigator />
      </AuthProvider>
    </AppProvider>
  );
}
