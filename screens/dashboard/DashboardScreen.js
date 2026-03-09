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
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/Authcontext';
import { SummaryCard, Button, ListItem, Card } from '../../components/Common';
import { supabase } from '../../lib/supabase';
import { fetchDashboardData, subscribeToDashboardChanges } from '../../lib/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateBusinessInsights, generateQuickInsights } from '../../lib/aiService';

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  primary:  '#4f46e5',
  primary2: '#6366f1',
  navy:     '#1e1b4b',
  bg:       '#f0f2f8',
  card:     '#ffffff',
  border:   '#e8ecf4',
  text:     '#0d1117',
  textMid:  '#4b5563',
  textMute: '#9ca3af',
  blue:     '#2563eb',
  green:    '#059669',
  amber:    '#d97706',
  cyan:     '#0891b2',
  red:      '#dc2626',
  purple:   '#7c3aed',
};

const DashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const isFirstLoad       = useRef(true);
  const unsubscribeRef    = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const [aiInsights, setAiInsights]         = useState([]);
  const [loadingAI, setLoadingAI]           = useState(false);
  const [aiLastUpdated, setAiLastUpdated]   = useState(null);
  const [dashboardData, setDashboardData]   = useState({
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
      const processedData = {
        totalProducts:     getNumber(result.data.totalProducts),
        lowStockCount:     getNumber(result.data.lowStockCount),
        todaysSalesCount:  getNumber(result.data.todaysSalesCount),
        todaysSalesAmount: getNumber(result.data.todaysSalesAmount),
        todaysSales:   Array.isArray(result.data.todaysSales)   ? result.data.todaysSales   : [],
        salesCount:        getNumber(result.data.salesCount),
        monthlySales:      getNumber(result.data.monthlySales),
        topProducts:   Array.isArray(result.data.topProducts)   ? result.data.topProducts   : [],
        recentSales:   Array.isArray(result.data.recentSales)   ? result.data.recentSales   : [],
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

  const loadAIInsights = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    setLoadingAI(true);
    try {
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem('ai_insights_cache');
        if (cached) {
          const { insights, timestamp } = JSON.parse(cached);
          const age    = Date.now() - timestamp;
          const maxAge = 30 * 60 * 1000;
          if (age < maxAge) {
            console.log('📦 Using cached AI insights');
            setAiInsights(insights);
            setAiLastUpdated(new Date(timestamp));
            setLoadingAI(false);
            return;
          }
        }
      }
      console.log('🤖 Fetching fresh AI insights from Gemini...');
      const result = await generateBusinessInsights(supabase);
      if (result.success && result.insights.length > 0) {
        setAiInsights(result.insights);
        setAiLastUpdated(new Date());
        await AsyncStorage.setItem('ai_insights_cache', JSON.stringify({
          insights: result.insights,
          timestamp: Date.now(),
        }));
        console.log('✅ Gemini insights cached');
      } else {
        const quick = await generateQuickInsights(supabase);
        if (quick.success) setAiInsights(quick.insights);
      }
    } catch (error) {
      console.error('AI Load Error:', error);
      setAiInsights([{
        type: 'error',
        icon: 'cloud-offline',
        color: '#64748b',
        message: 'Network slow hai. Baad mein try karo.',
        priority: 'medium',
      }]);
    } finally {
      setLoadingAI(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    console.log('🔌 Setting up dashboard real-time subscriptions...');
    unsubscribeRef.current = subscribeToDashboardChanges(supabase, (changeType) => {
      console.log('📡 Dashboard change detected:', changeType);
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Refreshing dashboard due to team data change...');
        loadDashboardData(false);
      }, 500);
    });
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [user, loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      const loadDashboard = async () => {
        if (!user) return;
        const showLoading = isFirstLoad.current;
        if (isFirstLoad.current) isFirstLoad.current = false;
        await Promise.all([loadDashboardData(showLoading), loadAIInsights()]);
      };
      loadDashboard();
    }, [user, loadDashboardData, loadAIInsights]),
  );

  const onRefresh = async () => { await loadDashboardData(false); };

  // ──────────────────────────────────────────────────────────────
  //  AI Insights
  // ──────────────────────────────────────────────────────────────
  const renderAIInsights = () => (
    <View style={s.aiCard}>
      <View style={s.aiBlob} />
      <View style={s.aiBlob2} />

      <View style={s.aiHeader}>
        <View style={s.aiLeft}>
          <View style={s.aiIconBox}>
            <Ionicons name="sparkles" size={15} color="#fff" />
          </View>
          <View>
            <Text style={s.aiTitle}>AI Insights</Text>
            <Text style={s.aiSub}>Powered by Gemini</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => loadAIInsights(true)}
          disabled={loadingAI}
          style={s.aiRefreshBtn}
        >
          {loadingAI
            ? <ActivityIndicator size="small" color={C.primary2} />
            : <Ionicons name="refresh-outline" size={17} color={C.primary2} />}
        </TouchableOpacity>
      </View>

      {loadingAI && aiInsights.length === 0 ? (
        <View style={s.aiLoadingRow}>
          <ActivityIndicator size="small" color={C.primary2} />
          <Text style={s.aiLoadingText}>Analyzing your business data…</Text>
        </View>
      ) : (
        <>
          {aiInsights.map((insight, i) => (
            <View key={i} style={[s.insightRow, { borderLeftColor: insight.color }]}>
              <View style={[s.insightDot, { backgroundColor: insight.color + '22' }]}>
                <Ionicons name={insight.icon} size={16} color={insight.color} />
              </View>
              <View style={s.insightBody}>
                <Text style={s.insightMsg}>{insight.message}</Text>
                <View style={[s.badge, { backgroundColor: insight.color + '18' }]}>
                  <Text style={[s.badgeText, { color: insight.color }]}>
                    {insight.priority === 'high' ? '⚠️ Urgent' : '💡 Tip'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {aiLastUpdated && (
            <Text style={s.aiTs}>Last updated · {aiLastUpdated.toLocaleTimeString()}</Text>
          )}
        </>
      )}
    </View>
  );

  // ──────────────────────────────────────────────────────────────
  //  Loading Screen
  // ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.loadingBox}>
          <View style={s.loadingSpinner}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
          <Text style={s.loadingTitle}>Loading Dashboard</Text>
          <Text style={s.loadingHint}>Fetching your latest data…</Text>
        </View>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────
  //  Main
  // ──────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ──── Header ──── */}
      <View style={s.header}>
        <View style={s.hCircle1} />
        <View style={s.hCircle2} />
        <View style={s.hTop}>
          <View>
            <Text style={s.hGreet}>Welcome back 👋</Text>
            <Text style={s.hSub}>Here's your business overview</Text>
          </View>
          <View style={s.hAvatar}>
            <Ionicons name="person" size={18} color="#c7d2fe" />
          </View>
        </View>
        <View style={s.chips}>
          <View style={s.chip}>
            <Ionicons name="trending-up-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>${getNumber(dashboardData.todaysSalesAmount).toFixed(0)} today</Text>
          </View>
          <View style={s.chip}>
            <Ionicons name="cube-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>{getNumber(dashboardData.totalProducts)} products</Text>
          </View>
          {getNumber(dashboardData.lowStockCount) > 0 && (
            <View style={[s.chip, s.chipWarn]}>
              <Ionicons name="alert-circle-outline" size={12} color="#fde68a" />
              <Text style={[s.chipTxt, { color: '#fde68a' }]}>
                {getNumber(dashboardData.lowStockCount)} low stock
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* ──── AI Insights ──── */}
        {renderAIInsights()}

        {/* ──── Stat Grid ──── */}
        <View style={s.statGrid}>
          {[
            {
              icon: 'cube', color: C.blue, bg: '#eff6ff',
              value: getNumber(dashboardData.totalProducts).toString(),
              label: 'Total Products', sub: null,
              onPress: () => navigation.navigate('Products', { screen: 'ProductList' }),
            },
            {
              icon: 'alert-circle', color: C.amber, bg: '#fffbeb',
              value: getNumber(dashboardData.lowStockCount).toString(),
              label: 'Low Stock',
              sub: getNumber(dashboardData.lowStockCount) > 0 ? 'Needs attention' : 'All good ✓',
              onPress: () => navigation.navigate('Products', { screen: 'ProductList', params: { filter: 'low_stock' } }),
            },
            {
              icon: 'document-text', color: C.green, bg: '#f0fdf4',
              value: getNumber(dashboardData.todaysSalesCount).toString(),
              label: "Today's Invoices",
              sub: `$${getNumber(dashboardData.todaysSalesAmount).toFixed(2)}`,
              onPress: () => navigation.navigate('Sales', { screen: 'SalesList' }),
            },
            {
              icon: 'trending-up', color: C.cyan, bg: '#ecfeff',
              value: `$${getNumber(dashboardData.monthlySales).toFixed(0)}`,
              label: 'Monthly Revenue', sub: null,
              onPress: () => navigation.navigate('Reports'),
            },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={s.statCard} onPress={item.onPress} activeOpacity={0.82}>
              <View style={[s.statIconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={s.statValue}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
              {item.sub ? <Text style={[s.statSub, { color: item.color }]}>{item.sub}</Text> : null}
              <View style={[s.statAccent, { backgroundColor: item.color }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ──── Quick Actions ──── */}
        <View style={s.section}>
          <View style={s.secHeadSimple}>
            <Text style={s.secTitle}>Quick Actions</Text>
          </View>
          <View style={s.actionGrid}>
            {[
              { icon: 'add-circle',       label: 'Add Product',   color: C.blue,   bg: '#eff6ff', onPress: () => navigation.navigate('Products', { screen: 'AddEditProduct' }) },
              { icon: 'arrow-down-circle', label: 'Stock In',      color: C.green,  bg: '#f0fdf4', onPress: () => navigation.navigate('Stock',    { screen: 'StockIn' }) },
              { icon: 'arrow-up-circle',  label: 'Stock Out',      color: C.amber,  bg: '#fffbeb', onPress: () => navigation.navigate('Stock',    { screen: 'StockOut' }) },
              { icon: 'document',         label: 'Create Invoice', color: C.purple, bg: '#faf5ff', onPress: () => navigation.navigate('Sales',    { screen: 'CreateInvoice' }) },
            ].map((a, i) => (
              <TouchableOpacity
                key={i}
                style={[s.actionBtn, { backgroundColor: a.bg }]}
                onPress={a.onPress}
                activeOpacity={0.8}
              >
                <View style={[s.actionIconBox, { backgroundColor: a.color }]}>
                  <Ionicons name={a.icon} size={19} color="#fff" />
                </View>
                <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ──── Top Selling Products ──── */}
        <View style={s.section}>
          <SectionHeader
            title="Top Selling Products"
            color={C.green}
            onViewAll={() => navigation.navigate('Products', { screen: 'ProductList' })}
          />
          {dashboardData.topProducts && dashboardData.topProducts.length > 0 ? (
            dashboardData.topProducts.slice(0, 3).map((product, idx) => (
              <TouchableOpacity
                key={product.id}
                style={s.row}
                onPress={() =>
                  navigation.navigate('Products', { screen: 'ProductDetail', params: { productId: product.id } })
                }
                activeOpacity={0.75}
              >
                <View style={[s.rankBox, { backgroundColor: ['#fef3c7', '#f0fdf4', '#eff6ff'][idx] }]}>
                  <Text style={[s.rankNum, { color: [C.amber, C.green, C.blue][idx] }]}>#{idx + 1}</Text>
                </View>
                <View style={s.rowBody}>
                  <Text style={s.rowTitle}>{product.name}</Text>
                  <Text style={s.rowSub}>Sold: {product.totalSold} units</Text>
                </View>
                <View style={s.rowRight}>
                  <Text style={s.rowRightTxt}>{product.quantity} in stock</Text>
                  <Ionicons name="chevron-forward" size={13} color={C.border} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState icon="bar-chart-outline" text="No sales data available" />
          )}
        </View>

        {/* ──── Today's Invoices ──── */}
        <View style={s.section}>
          <SectionHeader
            title="Today's Invoices"
            color={C.blue}
            onViewAll={() => navigation.navigate('Sales', { screen: 'SalesList' })}
          />
          {dashboardData.todaysSales && dashboardData.todaysSales.length > 0 ? (
            dashboardData.todaysSales.map((sale) => (
              <TouchableOpacity
                key={sale.id}
                style={s.row}
                onPress={() =>
                  navigation.navigate('Sales', { screen: 'InvoiceDetail', params: { saleId: sale.id } })
                }
                activeOpacity={0.75}
              >
                <View style={[s.rowIcon, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="document-text" size={15} color={C.blue} />
                </View>
                <View style={s.rowBody}>
                  <Text style={s.rowTitle}>Invoice #{sale.invoiceNumber}</Text>
                  <Text style={s.rowSub}>{sale.customerName}</Text>
                </View>
                <View style={s.rowRight}>
                  <Text style={s.amount}>${getNumber(sale.total).toFixed(2)}</Text>
                  <Ionicons name="chevron-forward" size={13} color={C.border} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState icon="document-outline" text="No invoices today" />
          )}
        </View>

        {/* ──── Recent Sales ──── */}
        <View style={s.section}>
          <SectionHeader
            title="Recent Sales"
            color={C.cyan}
            onViewAll={() => navigation.navigate('Sales', { screen: 'SalesList' })}
          />
          {dashboardData.recentSales && dashboardData.recentSales.length > 0 ? (
            dashboardData.recentSales.slice(0, 3).map((sale) => (
              <TouchableOpacity
                key={sale.id}
                style={s.row}
                onPress={() =>
                  navigation.navigate('Sales', { screen: 'InvoiceDetail', params: { saleId: sale.id } })
                }
                activeOpacity={0.75}
              >
                <View style={[s.rowIcon, { backgroundColor: '#ecfeff' }]}>
                  <Ionicons name="receipt" size={15} color={C.cyan} />
                </View>
                <View style={s.rowBody}>
                  <Text style={s.rowTitle}>Invoice #{sale.invoiceNumber}</Text>
                  <Text style={s.rowSub}>{sale.customerName}</Text>
                </View>
                <View style={s.rowRight}>
                  <Text style={s.amount}>${getNumber(sale.total).toFixed(2)}</Text>
                  <Ionicons name="chevron-forward" size={13} color={C.border} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState icon="receipt-outline" text="No sales yet" />
          )}
        </View>

        {/* ──── Stock Alerts ──── */}
        <View style={[s.section, { marginBottom: 28 }]}>
          <SectionHeader
            title="Stock Alerts"
            color={C.red}
            onViewAll={() => navigation.navigate('Notifications')}
          />
          {dashboardData.notifications && dashboardData.notifications.length > 0 ? (
            dashboardData.notifications.slice(0, 3).map((n) => {
              const isLow = n.type === 'low-stock';
              const color = isLow ? C.amber : C.red;
              return (
                <View key={n.id} style={[s.alertRow, { borderLeftColor: color }]}>
                  <View style={[s.alertIcon, { backgroundColor: color + '18' }]}>
                    <Ionicons name="alert-circle" size={17} color={color} />
                  </View>
                  <View style={s.alertBody}>
                    <Text style={s.alertMsg}>{n.message}</Text>
                    <Text style={[s.alertType, { color }]}>
                      {isLow ? 'Low Stock Alert' : 'Expiry Alert'}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState icon="checkmark-circle-outline" text="No new alerts" iconColor="#6ee7b7" />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Reusable sub-components ─────────────────────────────────
const SectionHeader = ({ title, color, onViewAll }) => (
  <View style={s.secHead}>
    <View style={s.secTitleRow}>
      <View style={[s.secBar, { backgroundColor: color }]} />
      <Text style={s.secTitle}>{title}</Text>
    </View>
    <TouchableOpacity onPress={onViewAll} style={s.viewAllBtn}>
      <Text style={s.viewAllTxt}>View All</Text>
      <Ionicons name="arrow-forward" size={12} color={C.primary2} />
    </TouchableOpacity>
  </View>
);

const EmptyState = ({ icon, text, iconColor = '#d1d5db' }) => (
  <View style={s.empty}>
    <View style={s.emptyIconBox}>
      <Ionicons name={icon} size={26} color={iconColor} />
    </View>
    <Text style={s.emptyTxt}>{text}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Loading
  loadingWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loadingBox:     { alignItems: 'center', gap: 12 },
  loadingSpinner: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 14, elevation: 8,
  },
  loadingTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  loadingHint:  { fontSize: 13, color: C.textMute },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  hCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(99,102,241,0.15)', top: -70, right: -50,
  },
  hCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(99,102,241,0.1)', bottom: -20, left: 20,
  },
  hTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  hGreet: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  hSub:   { fontSize: 13, color: '#a5b4fc', marginTop: 3 },
  hAvatar: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  chips:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  chipWarn: {
    backgroundColor: 'rgba(253,230,138,0.14)',
    borderColor: 'rgba(253,230,138,0.3)',
  },
  chipTxt: { fontSize: 12, color: '#e0e7ff', fontWeight: '600' },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16 },

  // ── AI Card
  aiCard: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1, borderColor: '#e0e7ff',
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 14,
    elevation: 5,
  },
  aiBlob: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#ede9fe', opacity: 0.4,
    top: -55, right: -45,
  },
  aiBlob2: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#ddd6fe', opacity: 0.25,
    bottom: -35, left: -20,
  },
  aiHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  aiLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiIconBox: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  aiTitle:  { fontSize: 15, fontWeight: '800', color: C.navy, letterSpacing: -0.2 },
  aiSub:    { fontSize: 11, color: C.primary2, fontWeight: '600', marginTop: 1 },
  aiRefreshBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: '#f5f3ff',
    alignItems: 'center', justifyContent: 'center',
  },
  aiLoadingRow: {
    paddingVertical: 20, flexDirection: 'row',
    alignItems: 'center', gap: 10, justifyContent: 'center',
  },
  aiLoadingText: { fontSize: 13, color: C.primary, fontWeight: '500' },
  insightRow: {
    flexDirection: 'row', backgroundColor: '#fafbff',
    borderRadius: 12, padding: 12, borderLeftWidth: 3.5,
    alignItems: 'flex-start', gap: 10, marginBottom: 8,
  },
  insightDot: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  insightBody: { flex: 1 },
  insightMsg:  {
    fontSize: 13.5, color: '#334155',
    lineHeight: 19, marginBottom: 6, fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  aiTs: { fontSize: 11, color: C.textMute, textAlign: 'right', marginTop: 2 },

  // ── Stat Grid
  statGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 14, gap: 10, marginBottom: 12,
  },
  statCard: {
    width: '47.5%', backgroundColor: '#fff',
    borderRadius: 18, padding: 16, minHeight: 130,
    justifyContent: 'flex-start',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  statIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: {
    fontSize: 28, fontWeight: '800', color: C.text,
    letterSpacing: -0.7, lineHeight: 32,
  },
  statLabel: { fontSize: 12, color: C.textMute, fontWeight: '600', marginTop: 3 },
  statSub:   { fontSize: 11, fontWeight: '700', marginTop: 3 },
  statAccent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 4, borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
    opacity: 0.55,
  },

  // ── Section
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  secHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  secHeadSimple: { marginBottom: 14 },
  secTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secBar:        { width: 4, height: 18, borderRadius: 2 },
  secTitle:      { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  viewAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewAllTxt:    { fontSize: 12.5, color: C.primary2, fontWeight: '700' },

  // ── Action Grid
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    width: '47.5%', borderRadius: 14,
    padding: 15, alignItems: 'center', gap: 9,
  },
  actionIconBox: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // ── List Rows
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#f0f2f8',
    gap: 12,
  },
  rankBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rankNum:     { fontSize: 12, fontWeight: '800' },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody:     { flex: 1 },
  rowTitle:    { fontSize: 14, fontWeight: '700', color: C.text },
  rowSub:      { fontSize: 12, color: C.textMute, marginTop: 2 },
  rowRight:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowRightTxt: { fontSize: 12, color: C.textMid, fontWeight: '600' },
  amount:      { fontSize: 14, color: C.green, fontWeight: '800' },

  // ── Empty State
  empty:       { paddingVertical: 26, alignItems: 'center', gap: 10 },
  emptyIconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTxt: { fontSize: 13, color: C.textMute, fontWeight: '500' },

  // ── Alert Rows
  alertRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fafbff', borderRadius: 12,
    padding: 12, borderLeftWidth: 3.5,
    marginBottom: 8, gap: 12,
  },
  alertIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  alertBody:  { flex: 1 },
  alertMsg:   { fontSize: 13.5, fontWeight: '700', color: C.text, marginBottom: 2 },
  alertType:  { fontSize: 11.5, fontWeight: '600' },
});

export default DashboardScreen;