import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { SearchBar, ListItem, FAB, EmptyState, Badge, AccessDenied } from '../../components/Common';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';
import { fetchSales } from '../../lib/database';

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

// ─── Payment method config ─────────────────────────────────────
const PM = {
  cash:  { icon: 'cash',         color: C.green,  label: 'Cash'          },
  card:  { icon: 'card',         color: C.blue,   label: 'Card'          },
  check: { icon: 'document-text',color: C.amber,  label: 'Check'         },
  bank:  { icon: 'business',     color: C.cyan,   label: 'Bank Transfer' },
};

const SalesListScreen = ({ navigation }) => {
  const { state, dispatch }       = useContext(AppContext);
  const { hasFeatureAccess }      = usePermissions();
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const hasSalesViewAccess = hasFeatureAccess('sales_view');
  if (!hasSalesViewAccess) return <AccessDenied featureName="Sales View" />;

  useEffect(() => {
    const loadSales = async () => {
      if (state.user) {
        const result = await fetchSales(supabase, state.user.id);
        if (result.success) dispatch({ type: 'SET_SALES', payload: result.sales });
      }
      setLoading(false);
    };
    loadSales();
  }, [state.user, dispatch]);

  const sorted = [...state.sales].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredSales = sorted.filter((sale) => {
    const matchSearch =
      (sale?.customerName?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (sale?.invoiceNumber?.includes(search) || false);
    if (!matchSearch) return false;
    if (activeTab === 'all') return true;
    return sale?.paymentMethod === activeTab;
  });

  // Stats
  const totalRevenue = sorted.reduce((sum, s) => sum + (s.total || 0), 0);
  const todaysSales  = sorted.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todaysRevenue = todaysSales.reduce((sum, s) => sum + (s.total || 0), 0);

  const tabs = ['all', 'cash', 'card', 'bank', 'check'];

  const renderSale = ({ item, index }) => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const pm = PM[item?.paymentMethod] || PM.cash;
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <TouchableOpacity
        style={s.saleCard}
        onPress={() => navigation.navigate('InvoiceDetail', { saleId: item.id })}
        activeOpacity={0.82}
      >
        {/* left accent */}
        <View style={[s.cardAccent, { backgroundColor: pm.color }]} />

        <View style={s.cardBody}>
          {/* Top row */}
          <View style={s.cardTop}>
            <View style={[s.pmIconBox, { backgroundColor: pm.color + '18' }]}>
              <Ionicons name={pm.icon} size={17} color={pm.color} />
            </View>
            <View style={s.cardMeta}>
              <Text style={s.customerName} numberOfLines={1}>
                {item?.customerName || 'Unknown Customer'}
              </Text>
              <Text style={s.invoiceNum}>#{item?.invoiceNumber || 'N/A'}</Text>
            </View>
            <View style={s.cardRight}>
              <Text style={s.cardAmount}>${(item?.total || 0).toFixed(2)}</Text>
              {isToday && (
                <View style={s.todayDot}>
                  <Text style={s.todayTxt}>Today</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom row */}
          <View style={s.cardBottom}>
            <View style={[s.pmBadge, { backgroundColor: pm.color + '12', borderColor: pm.color + '35' }]}>
              <Text style={[s.pmBadgeTxt, { color: pm.color }]}>{pm.label}</Text>
            </View>
            <Text style={s.dateStr}>{dateStr} · {timeStr}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={14} color={C.border} style={s.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.hBlob1} />
        <View style={s.hBlob2} />

        <View style={s.hRow}>
          <View>
            <Text style={s.hTitle}>Sales</Text>
            <Text style={s.hSub}>{sorted.length} invoices total</Text>
          </View>
          <TouchableOpacity
            style={s.hAddBtn}
            onPress={() => navigation.navigate('CreateInvoice')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.hAddTxt}>New Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* Revenue stats */}
        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={s.statVal}>${totalRevenue.toFixed(0)}</Text>
            <Text style={s.statLbl}>Total Revenue</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statVal}>${todaysRevenue.toFixed(0)}</Text>
            <Text style={s.statLbl}>Today</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statVal}>{todaysSales.length}</Text>
            <Text style={s.statLbl}>Today's Invoices</Text>
          </View>
        </View>
      </View>

      {/* ── Payment Method Tabs ── */}
      <View style={s.tabsWrap}>
        <FlatList
          horizontal
          data={tabs}
          keyExtractor={(t) => t}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabs}
          renderItem={({ item: tab }) => {
            const active = activeTab === tab;
            const pm = PM[tab];
            const color = pm?.color || C.primary;
            return (
              <TouchableOpacity
                style={[s.tab, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                {pm && <Ionicons name={pm.icon} size={12} color={active ? '#fff' : C.textMute} />}
                <Text style={[s.tabTxt, active && { color: '#fff' }]}>
                  {tab === 'all' ? 'All' : pm?.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <SearchBar
          placeholder="Search by customer or invoice #..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={s.centered}>
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingTxt}>Loading sales…</Text>
          </View>
        </View>
      ) : filteredSales.length > 0 ? (
        <FlatList
          data={filteredSales}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSale}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          icon="cash-outline"
          title="No Sales"
          message="Create your first invoice"
          action={() => navigation.navigate('CreateInvoice')}
          actionTitle="Create Invoice"
        />
      )}

      <FAB icon="add" onPress={() => navigation.navigate('CreateInvoice')} />
    </View>
  );
};

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingBox:  { alignItems: 'center', gap: 12 },
  loadingTxt:  { fontSize: 14, color: C.textMute, fontWeight: '500' },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  hBlob1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(99,102,241,0.15)', top: -70, right: -50,
  },
  hBlob2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(5,150,105,0.12)', bottom: -30, left: 20,
  },
  hRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  hTitle:  { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  hSub:    { fontSize: 12, color: '#a5b4fc', marginTop: 3 },
  hAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primary2,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 13,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  hAddTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Stats row
  statRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statBox:     { flex: 1, alignItems: 'center' },
  statVal:     { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLbl:     { fontSize: 11, color: '#a5b4fc', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 8 },

  // ── Tabs
  tabsWrap: { backgroundColor: C.card, paddingTop: 12, paddingBottom: 2 },
  tabs:     { paddingHorizontal: 14, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: '#f8fafc',
  },
  tabTxt: { fontSize: 12, fontWeight: '700', color: C.textMute },

  // ── Search
  searchWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },

  // ── List
  listContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 100 },

  // ── Sale Card
  saleCard: {
    backgroundColor: C.card, borderRadius: 16,
    marginBottom: 10, flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    alignItems: 'center',
  },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  cardBody:   { flex: 1, padding: 13 },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 10,
  },
  pmIconBox: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  cardMeta:     { flex: 1 },
  customerName: { fontSize: 14, fontWeight: '700', color: C.text },
  invoiceNum:   { fontSize: 12, color: C.textMute, marginTop: 2 },
  cardRight:    { alignItems: 'flex-end', gap: 4 },
  cardAmount:   { fontSize: 16, fontWeight: '800', color: C.green },
  todayDot: {
    backgroundColor: C.primary + '18',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
  },
  todayTxt: { fontSize: 10, color: C.primary2, fontWeight: '700' },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pmBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  pmBadgeTxt: { fontSize: 11, fontWeight: '700' },
  dateStr:  { fontSize: 11, color: C.textMute, fontWeight: '500' },
  chevron:  { marginRight: 12 },
});

export default SalesListScreen;