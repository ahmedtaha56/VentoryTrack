import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Stock Screens
import StockInScreen from '../screens/stock/Stockinscreen';
import StockOutScreen from '../screens/stock/Stockoutscreen';

const Stack = createNativeStackNavigator();

const StockNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a73e8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="StockHome"
        component={StockInScreen}
        options={{ headerTitle: 'Stock Management' }}
      />
      <Stack.Screen
        name="StockIn"
        component={StockInScreen}
        options={{ headerTitle: 'Stock In' }}
      />
      <Stack.Screen
        name="StockOut"
        component={StockOutScreen}
        options={{ headerTitle: 'Stock Out' }}
      />
    </Stack.Navigator>
  );
};

export default StockNavigator;