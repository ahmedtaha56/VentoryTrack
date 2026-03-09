import React, {
  useState,
  useRef,
  useCallback,
  useContext,
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/Authcontext';
import { AppContext } from '../../context/AppContext';
import { Card, StatCard, Badge, AccessDenied } from '../../components/Common';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';
import { fetchReportData } from '../../lib/database';

// ─── Design Tokens (matching Dashboard exactly) ───────────────
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

// ─── Mini Progress Bar ─────────────────────────────────────────
const ProgressBar = ({ value, max, color }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
};
const pb = StyleSheet.create({
  track: { height: 5, borderRadius: 3, backgroundColor: '#f0f2f8', overflow: 'hidden', flex: 1 },
  fill:  { height: '100%', borderRadius: 3 },
});

// ─── Reusable Section Header (matches Dashboard) ──────────────
const SectionHeader = ({ title, color, right }) => (
  <View style={s.secHead}>
    <View style={s.secTitleRow}>
      <View style={[s.secBar, { backgroundColor: color }]} />
      <Text style={s.secTitle}>{title}</Text>
    </View>
    {right}
  </View>
);

// ─── Empty State (matches Dashboard) ─────────────────────────
const EmptyState = ({ icon, text, iconColor = '#d1d5db' }) => (
  <View style={s.empty}>
    <View style={s.emptyIconBox}>
      <Ionicons name={icon} size={26} color={iconColor} />
    </View>
    <Text style={s.emptyTxt}>{text}</Text>
  </View>
);

// ─── Rank medal colors ────────────────────────────────────────
const RANK_BG    = ['#fef3c7', '#f0fdf4', '#eff6ff', '#faf5ff', '#fce7f3'];
const RANK_COLOR = [C.amber,   C.green,   C.blue,    C.purple,  '#db2777' ];

// ─── Main Screen ──────────────────────────────────────────────
const ReportsScreen = () => {
  const { user }          = useContext(AuthContext);
  const { state }         = useContext(AppContext);
  const { hasFeatureAccess } = usePermissions();
  const [period, setPeriod]       = useState('weekly');
  const [loading, setLoading]     = useState(true);
  const [displayData, setDisplayData] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);

  // Permission check — no functional change
  const hasReportsAccess = hasFeatureAccess('reports');
  if (!hasReportsAccess) return <AccessDenied featureName="Reports" />;

  const reportDataCache = useRef({});

  const periods = [
    { id: 'daily',   label: 'Daily',   icon: 'sunny-outline'    },
    { id: 'weekly',  label: 'Weekly',  icon: 'calendar-outline' },
    { id: 'monthly', label: 'Monthly', icon: 'stats-chart-outline' },
  ];

  const loadReportData = useCallback(async (isRefresh = false) => {
    if (!user) return;
    const cached = reportDataCache.current[period];
    if (cached && !isRefresh && cached.version === state.dataVersion) {
      setDisplayData(cached.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await fetchReportData(supabase, user.id, period);
    if (result.success) {
      reportDataCache.current[period] = { data: result.data, version: state.dataVersion };
      setDisplayData(result.data);
    } else {
      Alert.alert('Error', 'Failed to load report data.');
      console.error(result.error);
    }
    setLoading(false);
  }, [user, period, state.dataVersion]);

  useFocusEffect(
    useCallback(() => { loadReportData(); }, [loadReportData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportData(true);
    setRefreshing(false);
  };

  // ── Loading (matches Dashboard style) ────────────────────────
  if (loading || !displayData) {
    return (
      <View style={s.loadingWrap}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.loadingBox}>
          <View style={s.loadingSpinner}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
          <Text style={s.loadingTitle}>Generating Reports</Text>
          <Text style={s.loadingHint}>Crunching your numbers…</Text>
        </View>
      </View>
    );
  }

  const {
    totalSales,
    ordersCount,
    avgOrderValue,
    stockValue,
    lowStockProducts,
    topProducts,
    totalProductsCount,
    inStockCount,
    outOfStockCount,
  } = displayData;

  const maxSold = topProducts.length > 0
    ? Math.max(...topProducts.map(p => p.soldCount))
    : 1;

  const periodLabel = periods.find(p => p.id === period)?.label ?? '';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ──── Header ──── */}
      <View style={s.header}>
        <View style={s.hCircle1} />
        <View style={s.hCircle2} />
        <View style={s.hTop}>
          <View>
            <Text style={s.hGreet}>Reports & Analytics 📊</Text>
            <Text style={s.hSub}>Your {periodLabel.toLowerCase()} business snapshot</Text>
          </View>
          <View style={s.hAvatar}>
            <Ionicons name="bar-chart" size={18} color="#c7d2fe" />
          </View>
        </View>

        {/* ── Period Tabs inside header (chip style like Dashboard) ── */}
        <View style={s.chips}>
          {periods.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[s.chip, period === p.id && s.chipActive]}
              onPress={() => setPeriod(p.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={p.icon}
                size={12}
                color={period === p.id ? '#fff' : '#a5f3fc'}
              />
              <Text style={[s.chipTxt, period === p.id && s.chipTxtActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Hero KPI row ── */}
        <View style={s.heroRow}>
          <View style={s.heroKpi}>
            <Text style={s.heroVal}>${totalSales.toFixed(0)}</Text>
            <Text style={s.heroLbl}>Total Sales</Text>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroKpi}>
            <Text style={s.heroVal}>{ordersCount}</Text>
            <Text style={s.heroLbl}>Orders</Text>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroKpi}>
            <Text style={s.heroVal}>${avgOrderValue.toFixed(0)}</Text>
            <Text style={s.heroLbl}>Avg. Order</Text>
          </View>
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
        {/* ──── Financial Summary ──── */}
        <View style={s.statGrid}>
          {[
            {
              icon: 'cash-outline',       color: C.green,  bg: '#f0fdf4',
              value: `$${totalSales.toFixed(2)}`,
              label: 'Total Sales',
              sub: `${ordersCount} orders`,
            },
            {
              icon: 'receipt-outline',    color: C.blue,   bg: '#eff6ff',
              value: ordersCount.toString(),
              label: 'Total Orders',
              sub: periodLabel,
            },
            {
              icon: 'trending-up-outline', color: C.purple, bg: '#faf5ff',
              value: `$${avgOrderValue.toFixed(2)}`,
              label: 'Avg. Order Value',
              sub: 'Per invoice',
            },
            {
              icon: 'layers-outline',     color: C.cyan,   bg: '#ecfeff',
              value: `$${stockValue.toFixed(0)}`,
              label: 'Stock Value',
              sub: 'Current inventory',
            },
          ].map((item, i) => (
            <View key={i} style={s.statCard}>
              <View style={[s.statIconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={s.statValue}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
              {item.sub
                ? <Text style={[s.statSub, { color: item.color }]}>{item.sub}</Text>
                : null}
              <View style={[s.statAccent, { backgroundColor: item.color }]} />
            </View>
          ))}
        </View>

        {/* ──── Inventory Overview Card ──── */}
        <View style={s.section}>
          <SectionHeader title="Inventory Overview" color={C.cyan} />

          {/* Stock Value hero */}
          <View style={s.stockHero}>
            <View style={s.stockHeroBlobL} />
            <View style={s.stockHeroBlobR} />
            <View style={s.stockHeroInner}>
              <Text style={s.stockHeroLabel}>Current Stock Value</Text>
              <Text style={s.stockHeroVal}>${stockValue.toFixed(2)}</Text>
              <View style={[s.stockHeroBadge]}>
                <Ionicons name="cube-outline" size={12} color={C.cyan} />
                <Text style={s.stockHeroBadgeTxt}>{totalProductsCount} total products</Text>
              </View>
            </View>
          </View>

          {/* 3-stat row */}
          <View style={s.invRow}>
            {[
              { label: 'Total Products', value: totalProductsCount,  color: C.blue,  icon: 'cube',               bg: '#eff6ff' },
              { label: 'In Stock',        value: inStockCount,         color: C.green, icon: 'checkmark-circle',   bg: '#f0fdf4' },
              { label: 'Out of Stock',    value: outOfStockCount,      color: C.red,   icon: 'close-circle',       bg: '#fef2f2' },
            ].map((item, i) => (
              <View key={i} style={s.invCell}>
                <View style={[s.invIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[s.invVal, { color: item.color }]}>{item.value}</Text>
                <Text style={s.invLbl}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Mini visual bar */}
          <View style={s.invBarWrap}>
            <View style={{ flex: inStockCount,     backgroundColor: C.green  + 'cc', height: 8, borderRadius: 4 }} />
            <View style={{ flex: outOfStockCount || 0.01, backgroundColor: C.red    + 'cc', height: 8, borderRadius: 4 }} />
          </View>
          <View style={s.invBarLegend}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: C.green }]} />
              <Text style={s.legendTxt}>In Stock</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: C.red }]} />
              <Text style={s.legendTxt}>Out of Stock</Text>
            </View>
          </View>
        </View>

        {/* ──── Top Selling Products ──── */}
        <View style={s.section}>
          <SectionHeader
            title="Top Selling Products"
            color={C.green}
            right={
              topProducts.length > 0 && (
                <View style={s.countBadge}>
                  <Text style={s.countBadgeTxt}>{topProducts.length} items</Text>
                </View>
              )
            }
          />

          {topProducts.length > 0 ? (
            topProducts.map((product, idx) => (
              <View key={product.id} style={s.row}>
                {/* Rank */}
                <View style={[s.rankBox, { backgroundColor: RANK_BG[idx] ?? '#f8fafc' }]}>
                  <Text style={[s.rankNum, { color: RANK_COLOR[idx] ?? C.textMid }]}>
                    #{idx + 1}
                  </Text>
                </View>

                {/* Info */}
                <View style={s.rowBody}>
                  <Text style={s.rowTitle}>{product.name}</Text>
                  <View style={s.progressRow}>
                    <ProgressBar
                      value={product.soldCount}
                      max={maxSold}
                      color={RANK_COLOR[idx] ?? C.blue}
                    />
                    <Text style={[s.progressLbl, { color: RANK_COLOR[idx] ?? C.blue }]}>
                      {product.soldCount}u
                    </Text>
                  </View>
                </View>

                {/* Revenue */}
                <View style={s.rowRight}>
                  <Text style={s.amount}>
                    ${(product.soldCount * (product.selling_price || 0)).toFixed(0)}
                  </Text>
                  <Text style={s.rowSub}>{product.soldCount} sold</Text>
                </View>
              </View>
            ))
          ) : (
            <EmptyState icon="bar-chart-outline" text="No sales data for this period" />
          )}
        </View>

        {/* ──── Low Stock Alerts ──── */}
        <View style={[s.section, { marginBottom: 28 }]}>
          <SectionHeader
            title="Low Stock Alerts"
            color={C.red}
            right={
              <View style={[s.alertCountBadge, { backgroundColor: lowStockProducts.length > 0 ? '#fef2f2' : '#f0fdf4' }]}>
                <Ionicons
                  name={lowStockProducts.length > 0 ? 'alert-circle' : 'checkmark-circle'}
                  size={13}
                  color={lowStockProducts.length > 0 ? C.red : C.green}
                />
                <Text style={[s.alertCountTxt, { color: lowStockProducts.length > 0 ? C.red : C.green }]}>
                  {lowStockProducts.length > 0
                    ? `${lowStockProducts.length} alerts`
                    : 'All clear'}
                </Text>
              </View>
            }
          />

          {lowStockProducts.length > 0 ? (
            lowStockProducts.map((product) => {
              const isVeryLow = product.quantity <= 3;
              const color     = isVeryLow ? C.red : C.amber;
              return (
                <View key={product.id} style={[s.alertRow, { borderLeftColor: color }]}>
                  <View style={[s.alertIcon, { backgroundColor: color + '18' }]}>
                    <Ionicons name="alert-circle" size={17} color={color} />
                  </View>
                  <View style={s.alertBody}>
                    <Text style={s.alertMsg}>{product.name}</Text>
                    <View style={s.alertMeta}>
                      <Text style={[s.alertType, { color }]}>
                        {isVeryLow ? '🔴 Critical' : '🟡 Low Stock'}
                      </Text>
                      <View style={s.alertDot} />
                      <Text style={s.alertUnits}>{product.quantity} units left</Text>
                    </View>
                  </View>
                  {/* Mini stock bar */}
                  <View style={s.alertBarWrap}>
                    <View style={[s.alertBarFill, {
                      height: `${Math.min((product.quantity / 10) * 100, 100)}%`,
                      backgroundColor: color,
                    }]} />
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState
              icon="checkmark-circle-outline"
              text="All products have healthy stock levels"
              iconColor="#6ee7b7"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

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
    paddingBottom: 20,
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
    alignItems: 'center', marginBottom: 16,
  },
  hGreet: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  hSub:   { fontSize: 13, color: '#a5b4fc', marginTop: 3 },
  hAvatar: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Period Chips
  chips:        { flexDirection: 'row', gap: 8, marginBottom: 18 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary2,
  },
  chipTxt:       { fontSize: 12, color: '#e0e7ff', fontWeight: '600' },
  chipTxtActive: { color: '#fff' },

  // ── Hero KPI row
  heroRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
  },
  heroKpi:    { flex: 1, alignItems: 'center' },
  heroVal:    { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroLbl:    { fontSize: 11, color: '#a5b4fc', fontWeight: '600', marginTop: 3 },
  heroDivider: {
    width: 1, backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 6,
  },

  // ── Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingTop: 14 },

  // ── Stat Grid (identical to Dashboard)
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
  statValue:  { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.6 },
  statLabel:  { fontSize: 12, color: C.textMute, fontWeight: '600', marginTop: 3 },
  statSub:    { fontSize: 11, fontWeight: '700', marginTop: 3 },
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
  secHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secBar:      { width: 4, height: 18, borderRadius: 2 },
  secTitle:    { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2 },

  // ── Stock Hero Card
  stockHero: {
    backgroundColor: '#ecfeff',
    borderRadius: 16, padding: 18, marginBottom: 16,
    overflow: 'hidden', alignItems: 'center',
    borderWidth: 1, borderColor: '#cffafe',
  },
  stockHeroBlobL: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#a5f3fc', opacity: 0.25, top: -30, left: -20,
  },
  stockHeroBlobR: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#67e8f9', opacity: 0.2, bottom: -25, right: -15,
  },
  stockHeroInner: { alignItems: 'center', gap: 4 },
  stockHeroLabel:  { fontSize: 12, color: C.cyan, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  stockHeroVal:    { fontSize: 36, fontWeight: '800', color: C.navy, letterSpacing: -1 },
  stockHeroBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginTop: 4,
    shadowColor: C.cyan, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  stockHeroBadgeTxt: { fontSize: 12, color: C.cyan, fontWeight: '700' },

  // ── Inventory 3-cell row
  invRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  invCell: {
    flex: 1, alignItems: 'center',
    backgroundColor: '#fafbff', borderRadius: 14,
    paddingVertical: 12, gap: 5,
    borderWidth: 1, borderColor: C.border,
  },
  invIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  invVal:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  invLbl:  { fontSize: 10.5, color: C.textMute, fontWeight: '600', textAlign: 'center' },

  // ── Inventory bar + legend
  invBarWrap: {
    flexDirection: 'row', height: 8, borderRadius: 4,
    overflow: 'hidden', gap: 2, marginBottom: 8,
  },
  invBarLegend:  { flexDirection: 'row', gap: 16 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendTxt:     { fontSize: 11.5, color: C.textMid, fontWeight: '600' },

  // ── Badges
  countBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0',
  },
  countBadgeTxt: { fontSize: 11.5, color: C.green, fontWeight: '700' },
  alertCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: '#fecaca',
  },
  alertCountTxt: { fontSize: 11.5, fontWeight: '700' },

  // ── List Row (matches Dashboard)
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
  rankNum:   { fontSize: 12, fontWeight: '800' },
  rowBody:   { flex: 1, gap: 6 },
  rowTitle:  { fontSize: 14, fontWeight: '700', color: C.text },
  rowSub:    { fontSize: 12, color: C.textMute, marginTop: 2 },
  rowRight:  { alignItems: 'flex-end', gap: 2 },
  amount:    { fontSize: 14, color: C.green, fontWeight: '800' },

  // ── Progress row
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLbl:  { fontSize: 11, fontWeight: '700', minWidth: 28, textAlign: 'right' },

  // ── Alert Rows (matches Dashboard style)
  alertRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fafbff', borderRadius: 12,
    padding: 12, borderLeftWidth: 3.5,
    marginBottom: 8, gap: 12,
  },
  alertIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertBody: { flex: 1 },
  alertMsg:  { fontSize: 13.5, fontWeight: '700', color: C.text, marginBottom: 4 },
  alertMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertType: { fontSize: 11.5, fontWeight: '600' },
  alertDot:  { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textMute },
  alertUnits: { fontSize: 11.5, color: C.textMid, fontWeight: '500' },
  alertBarWrap: {
    width: 5, height: 40, borderRadius: 3,
    backgroundColor: '#f0f2f8', overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  alertBarFill: { width: '100%', borderRadius: 3 },

  // ── Empty State
  empty:       { paddingVertical: 26, alignItems: 'center', gap: 10 },
  emptyIconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTxt: { fontSize: 13, color: C.textMute, fontWeight: '500' },
});

export default ReportsScreen;