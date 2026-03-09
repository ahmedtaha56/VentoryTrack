import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import NotificationsScreen from '../screens/notifications/Notificationsscreen';
import StaffManagementScreen from '../screens/staff/Staffmanagementscreen';
import EditStaffPermissionsScreen from '../screens/staff/EditStaffPermissionsScreen';

const Stack = createNativeStackNavigator();

const DashboardNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a73e8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ headerTitle: 'Dashboard' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerTitle: 'Notifications' }}
      />
      <Stack.Screen
        name="StaffManagement"
        component={StaffManagementScreen}
        options={{ headerTitle: 'Staff Management' }}
      />
      <Stack.Screen
        name="EditStaffPermissions"
        component={EditStaffPermissionsScreen}
      />
    </Stack.Navigator>
  );
};

export default DashboardNavigator;