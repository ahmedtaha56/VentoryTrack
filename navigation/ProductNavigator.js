import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Product Screens
import ProductListScreen from '../screens/products/Productlistscreen';
import AddEditProductScreen from '../screens/products/Addeditproductscreen';
import ProductDetailScreen from '../screens/products/Productdetailscreen';

const Stack = createNativeStackNavigator();

const ProductNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a73e8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ headerTitle: 'Products' }}
      />
      <Stack.Screen
        name="AddEditProduct"
        component={AddEditProductScreen}
        options={({ route }) => ({
          headerTitle: route.params?.productId ? 'Edit Product' : 'Add Product',
        })}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerTitle: 'Product Details' }}
      />
    </Stack.Navigator>
  );
};

export default ProductNavigator;