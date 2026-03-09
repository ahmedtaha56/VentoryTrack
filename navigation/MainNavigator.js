import React, { useEffect, useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

// Stack Navigators
import DashboardNavigator from './DashboardNavigator';
import ProductNavigator from './ProductNavigator';
import StockNavigator from './StockNavigator';
import SalesNavigator from './SalesNavigator';
import MoreNavigator from './MoreNavigator';

// Screens
import ReportsScreen from '../screens/reports/Reportsscreen';

const Tab = createBottomTabNavigator();

const MainNavigator = ({ userRole }) => {
  const { dispatch } = useContext(AppContext);

  // Load initial data on app startup
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🚀 Loading initial app data...');

        // Load products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*');
        if (productsError) throw productsError;
        dispatch({ type: 'SET_PRODUCTS', payload: products || [] });
        console.log('✅ Products loaded:', products?.length || 0);

        // Load categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
        if (categoriesError) throw categoriesError;
        dispatch({ type: 'SET_CATEGORIES', payload: categories || [] });
        console.log('✅ Categories loaded:', categories?.length || 0);

        // Load suppliers
        const { data: suppliers, error: suppliersError } = await supabase
          .from('suppliers')
          .select('*');
        if (suppliersError) throw suppliersError;
        dispatch({ type: 'SET_SUPPLIERS', payload: suppliers || [] });
        console.log('✅ Suppliers loaded:', suppliers?.length || 0);

        // Load sales
        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select('*');
        if (salesError) throw salesError;
        dispatch({ type: 'SET_SALES', payload: sales || [] });
        console.log('✅ Sales loaded:', sales?.length || 0);

        // Load stock logs
        const { data: stockLogs, error: stockLogsError } = await supabase
          .from('stock_logs')
          .select('*');
        if (stockLogsError) throw stockLogsError;
        dispatch({ type: 'SET_STOCK_LOGS', payload: stockLogs || [] });
        console.log('✅ Stock logs loaded:', stockLogs?.length || 0);
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [dispatch]);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Stock') {
            iconName = focused ? 'layers' : 'layers-outline';
          } else if (route.name === 'Sales') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'menu' : 'menu-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductNavigator}
        options={{ tabBarLabel: 'Products' }}
      />
      <Tab.Screen
        name="Stock"
        component={StockNavigator}
        options={{ tabBarLabel: 'Stock' }}
      />
      <Tab.Screen
        name="Sales"
        component={SalesNavigator}
        options={{ tabBarLabel: 'Sales' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ 
          tabBarLabel: 'Reports',
          headerShown: true,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <Tab.Screen
        name="More"
        options={{ tabBarLabel: 'More' }}
      >
        {() => <MoreNavigator userRole={userRole} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainNavigator;