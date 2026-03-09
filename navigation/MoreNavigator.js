import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// More Menu Screens
import MoreMenuScreen from '../screens/Moremenuscreen';

// Category Screens
import CategoryListScreen from '../screens/categories/Categorylistscreen';
import AddEditCategoryScreen from '../screens/categories/Addeditcategoryscreen';

// Supplier Screens
import SupplierListScreen from '../screens/suppliers/Supplierlistscreen';
import AddEditSupplierScreen from '../screens/suppliers/Addeditsupplierscreen';

// Other Screens
import NotificationsScreen from '../screens/notifications/Notificationsscreen';
import StaffManagementScreen from '../screens/staff/Staffmanagementscreen';
import SettingsScreen from '../screens/settings/Settingsscreen';

// App Info Screens
import HelpSupportScreen from '../app info/HelpSupportScreen';
import PrivacyPolicyScreen from '../app info/PrivacyPolicyScreen';
import TermsConditionsScreen from '../app info/TermsConditionsScreen';

const Stack = createNativeStackNavigator();

const MoreNavigator = ({ userRole }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a73e8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="MoreMenu"
        options={{ headerTitle: 'More Options' }}
      >
        {(props) => <MoreMenuScreen {...props} userRole={userRole} />}
      </Stack.Screen>

      <Stack.Screen
        name="Categories"
        component={CategoryListScreen}
        options={{ headerTitle: 'Categories' }}
      />
      <Stack.Screen
        name="AddEditCategory"
        component={AddEditCategoryScreen}
        options={({ route }) => ({
          headerTitle: route.params?.categoryId ? 'Edit Category' : 'Add Category',
        })}
      />

      <Stack.Screen
        name="Suppliers"
        component={SupplierListScreen}
        options={{ headerTitle: 'Suppliers' }}
      />
      <Stack.Screen
        name="AddEditSupplier"
        component={AddEditSupplierScreen}
        options={({ route }) => ({
          headerTitle: route.params?.supplierId ? 'Edit Supplier' : 'Add Supplier',
        })}
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
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: 'Settings' }}
      />

      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ headerTitle: 'Help & Support' }}
      />

      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerTitle: 'Privacy Policy' }}
      />

      <Stack.Screen
        name="TermsConditions"
        component={TermsConditionsScreen}
        options={{ headerTitle: 'Terms & Conditions' }}
      />
    </Stack.Navigator>
  );
};

export default MoreNavigator;