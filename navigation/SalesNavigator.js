import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Sales Screens
import SalesListScreen from '../screens/sales/Saleslistscreen';
import CreateInvoiceScreen from '../screens/sales/Createinvoicescreen';
import InvoiceDetailScreen from '../screens/sales/Invoicedetailscreen';

const Stack = createNativeStackNavigator();

const SalesNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a73e8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="SalesList"
        component={SalesListScreen}
        options={{ headerTitle: 'Sales' }}
      />
      <Stack.Screen
        name="CreateInvoice"
        component={CreateInvoiceScreen}
        options={{ headerTitle: 'Create Invoice' }}
      />
      <Stack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{ headerTitle: 'Invoice Details' }}
      />
    </Stack.Navigator>
  );
};

export default SalesNavigator;