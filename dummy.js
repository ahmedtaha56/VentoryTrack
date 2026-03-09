import React, {
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/Authcontext';
import { SummaryCard, Button, ListItem, Card } from '../../components/Common';
import { supabase } from '../../lib/supabase';
import { fetchDashboardData, subscribeToDashboardChanges } from '../../lib/database';

const DashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstLoad = useRef(true);
  const unsubscribeRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    todaysSalesCount: 0,
    todaysSalesAmount: 0,
    todaysSales: [],
    salesCount: 0,
    monthlySales: 0,
    topProducts: [],
    recentSales: [],
    notifications: [],
  });

  // Safe number getter
  const getNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number') return value;
    return parseFloat(value) || defaultValue;
  };

  const loadDashboardData = useCallback(async (showLoading = true) => {
    if (!user) return;

    if (showLoading) setLoading(true);
    setRefreshing(true);

    console.log('📊 Loading dashboard data for team...');
    const result = await fetchDashboardData(supabase);

    if (result.success) {
      console.log('✅ Dashboard data loaded:', {
        totalProducts: result.data.totalProducts,
        lowStockCount: result.data.lowStockCount,
        todaysSalesCount: result.data.todaysSalesCount,
        todaysSalesAmount: result.data.todaysSalesAmount,
        salesCount: result.data.salesCount,
        monthlySales: result.data.monthlySales,
        topProducts: result.data.topProducts?.length || 0,
        recentSales: result.data.recentSales?.length || 0,
      });
      
      // Ensure all values are properly formatted
      const processedData = {
        totalProducts: getNumber(result.data.totalProducts),
        lowStockCount: getNumber(result.data.lowStockCount),
        todaysSalesCount: getNumber(result.data.todaysSalesCount),
        todaysSalesAmount: getNumber(result.data.todaysSalesAmount),
        todaysSales: Array.isArray(result.data.todaysSales) ? result.data.todaysSales : [],
        salesCount: getNumber(result.data.salesCount),
        monthlySales: getNumber(result.data.monthlySales),
        topProducts: Array.isArray(result.data.topProducts) ? result.data.topProducts : [],
        recentSales: Array.isArray(result.data.recentSales) ? result.data.recentSales : [],
        notifications: Array.isArray(result.data.notifications) ? result.data.notifications : [],
      };
      
      setDashboardData(processedData);
    } else {
      Alert.alert('Error', 'Failed to load dashboard data.');
      console.error(result.error);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Setting up dashboard real-time subscriptions...');

    // Subscribe to changes
    unsubscribeRef.current = subscribeToDashboardChanges(supabase, (changeType) => {
      console.log('📡 Dashboard change detected:', changeType);

      // Debounce the refresh to avoid too many requests
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Refreshing dashboard due to team data change...');
        loadDashboardData(false);
      }, 500);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [user, loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      const loadDashboard = async () => {
        if (!user) return;

        const showLoading = isFirstLoad.current;
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
        }
        await loadDashboardData(showLoading);
      };

      loadDashboard();
    }, [user, loadDashboardData]),
  );

  const onRefresh = async () => {
    await loadDashboardData(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.summarySection}>
        <TouchableOpacity onPress={() => navigation.navigate('Products', { screen: 'ProductList' })}>
          <SummaryCard
            title="Total Products"
            value={getNumber(dashboardData.totalProducts).toString()}
            icon="cube"
            color="#1a73e8"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Products', { screen: 'ProductList', params: { filter: 'low_stock' } })}>
          <SummaryCard
            title="Low Stock Items"
            value={getNumber(dashboardData.lowStockCount).toString()}
            icon="alert-circle"
            color="#f57c00"
            subtitle={getNumber(dashboardData.lowStockCount) > 0 ? 'Action required' : 'All good'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Sales', { screen: 'SalesList' })}>
          <SummaryCard
            title="Today's Invoices"
            value={getNumber(dashboardData.todaysSalesCount).toString()}
            icon="document"
            color="#4caf50"
            subtitle={`$${getNumber(dashboardData.todaysSalesAmount).toFixed(2)}`}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
          <SummaryCard
            title="Monthly Revenue"
            value={`$${getNumber(dashboardData.monthlySales).toFixed(2)}`}
            icon="trending-up"
            color="#00acc1"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          <Button
            title="Add Product"
            icon="add-circle"
            onPress={() => navigation.navigate('Products', { screen: 'AddEditProduct' })}
            style={styles.actionButton}
          />
          <Button
            title="Stock In"
            icon="arrow-down-circle"
            onPress={() => navigation.navigate('Stock', { screen: 'StockIn' })}
            style={styles.actionButton}
          />
          <Button
            title="Stock Out"
            icon="arrow-up-circle"
            onPress={() => navigation.navigate('Stock', { screen: 'StockOut' })}
            style={styles.actionButton}
          />
          <Button
            title="Create Invoice"
            icon="document"
            onPress={() => navigation.navigate('Sales', { screen: 'CreateInvoice' })}
            style={styles.actionButton}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Selling Products</Text>
          <Text
            style={styles.viewAll}
            onPress={() => navigation.navigate('Products', { screen: 'ProductList' })}
          >
            View All
          </Text>
        </View>
        <View>
          {dashboardData.topProducts && dashboardData.topProducts.length > 0 ? (
            dashboardData.topProducts.slice(0, 3).map((product) => (
              <ListItem
                key={product.id}
                title={product.name}
                subtitle={`Sold: ${product.totalSold} units`}
                rightText={`${product.quantity} in stock`}
                onPress={() =>
                  navigation.navigate('Products', {
                    screen: 'ProductDetail',
                    params: { productId: product.id },
                  })
                }
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No sales data available</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Invoices</Text>
          <Text
            style={styles.viewAll}
            onPress={() => navigation.navigate('Sales', { screen: 'SalesList' })}
          >
            View All
          </Text>
        </View>
        <View>
          {dashboardData.todaysSales && dashboardData.todaysSales.length > 0 ? (
            dashboardData.todaysSales.map((sale) => (
              <ListItem
                key={sale.id}
                title={`Invoice #${sale.invoiceNumber}`}
                subtitle={sale.customerName}
                rightText={`$${getNumber(sale.total).toFixed(2)}`}
                onPress={() =>
                  navigation.navigate('Sales', {
                    screen: 'InvoiceDetail',
                    params: { saleId: sale.id },
                  })
                }
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No invoices today</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <Text
            style={styles.viewAll}
            onPress={() => navigation.navigate('Sales', { screen: 'SalesList' })}
          >
            View All
          </Text>
        </View>
        <View>
          {dashboardData.recentSales && dashboardData.recentSales.length > 0 ? (
            dashboardData.recentSales.slice(0, 3).map((sale) => (
              <ListItem
                key={sale.id}
                title={`Invoice #${sale.invoiceNumber}`}
                subtitle={sale.customerName}
                rightText={`$${getNumber(sale.total).toFixed(2)}`}
                onPress={() =>
                  navigation.navigate('Sales', {
                    screen: 'InvoiceDetail',
                    params: { saleId: sale.id },
                  })
                }
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No sales yet</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stock Alerts</Text>
          <Text
            style={styles.viewAll}
            onPress={() => navigation.navigate('Notifications')}
          >
            View All
          </Text>
        </View>
        {dashboardData.notifications && dashboardData.notifications.length > 0 ? (
          dashboardData.notifications.slice(0, 3).map((notification) => (
            <Card key={notification.id} style={styles.alertCard}>
              <View style={styles.alertContent}>
                <Ionicons
                  name="alert-circle"
                  size={24}
                  color={
                    notification.type === 'low-stock' ? '#f57c00' : '#d32f2f'
                  }
                  style={styles.alertIcon}
                />
                <View style={styles.alertTextContainer}>
                  <Text style={styles.alertMessage}>{notification.message}</Text>
                  <Text style={styles.alertType}>
                    {notification.type === 'low-stock'
                      ? 'Low Stock Alert'
                      : 'Expiry Alert'}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>No new alerts</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  summarySection: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewAll: {
    color: '#1a73e8',
    fontSize: 13,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexBasis: '48%',
  },
  emptyText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  alertCard: {
    backgroundColor: '#fff3e0',
    borderLeftColor: '#f57c00',
    borderLeftWidth: 4,
    marginBottom: 8,
    padding: 12,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  alertType: {
    fontSize: 12,
    color: '#999',
  },
});

export default DashboardScreen;