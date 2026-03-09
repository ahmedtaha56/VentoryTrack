import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../context/Authcontext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const RootNavigator = () => {
  const { user, userData, loading } = useContext(AuthContext);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate initialization delay
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  console.log('🟣 RootNavigator render - user:', user ? '✅ logged in' : '❌ null', 'loading:', loading, 'initializing:', isInitializing);

  if (loading || isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <>
          {console.log('🟣 Rendering MainNavigator (user exists)')}
          <MainNavigator userRole={userData?.role || 'staff'} />
        </>
      ) : (
        <>
          {console.log('🟣 Rendering AuthNavigator (user is null)')}
          <AuthNavigator />
        </>
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;