import React, { useContext, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { Card, Badge, Button } from '../../components/Common';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';

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
};

const ProductDetailScreen = ({ route, navigation }) => {
  const { state }                  = useContext(AppContext);
  const { getFeaturePermissions }  = usePermissions();
  const { canUpdate, canView }     = getFeaturePermissions('products');
  const productId                  = route.params?.productId;
  const product                    = state.products.find((p) => p.id === productId);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading]           = useState(true);

  const category = useMemo(
    () => state.categories.find((c) => c.id === product?.category_id),
    [product?.category_id, state.categories],
  );
  const supplier = useMemo(
    () => state.suppliers.find((s) => s.id === product?.supplier_id),
    [product?.supplier_id, state.suppliers],
  );

  useEffect(() => {
    if (canView === false) {
      Alert.alert('Access Denied', 'You do not have permission to view this screen.');
      navigation.goBack();
    }
  }, [canView]);

  useEffect(() => { loadStockHistory(); }, [productId]);

  const loadStockHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_logs')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setStockHistory(data || []);
    } catch (error) {
      console.error('Error loading stock history:', error);
      Alert.alert('Error', 'Failed to load stock history');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <View style={s.root}>
        <View style={s.notFound}>
          <Ionicons name="cube-outline" size={48} color={C.border} />
          <Text style={s.notFoundTxt}>Product not found</Text>
        </View>
      </View>
    );
  }

  const getStockStatus = () => {
    if (product.quantity <= 0)
      return { label: 'Out of Stock', color: C.red, bg: '#fef2f2', icon: 'close-circle' };
    if (product.quantity <= product.low_stock_alert)
      return { label: 'Low Stock', color: C.amber, bg: '#fffbeb', icon: 'alert-circle' };
    return { label: 'In Stock', color: C.green, bg: '#f0fdf4', icon: 'checkmark-circle' };
  };

  const status = getStockStatus();
  const profit = product.selling_price - product.cost_price;
  const margin = product.selling_price > 0
    ? ((profit / product.selling_price) * 100).toFixed(1)
    : '0';

  const renderHistoryItem = ({ item, index }) => (
    <View style={[s.histRow, index === stockHistory.length - 1 && { borderBottomWidth: 0 }]}>
      <View style={[
        s.histIcon,
        { backgroundColor: item.type === 'in' ? '#f0fdf4' : '#fef2f2' },
      ]}>
        <Ionicons
          name={item.type === 'in' ? 'arrow-down' : 'arrow-up'}
          size={15}
          color={item.type === 'in' ? C.green : C.red}
        />
      </View>
      <View style={s.histBody}>
        <Text style={s.histType}>Stock {item.type === 'in' ? 'In' : 'Out'}</Text>
        <Text style={s.histReason}>{item.reason}</Text>
        <Text style={s.histDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={[s.histQty, { color: item.type === 'in' ? C.green : C.red }]}>
        {item.type === 'in' ? '+' : '-'}{item.quantity}
      </Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.hCircle1} />
        <View style={s.hCircle2} />

        <View style={s.hTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#c7d2fe" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle} numberOfLines={1}>{product.name}</Text>
            <Text style={s.hSku}>SKU: {product.sku}</Text>
          </View>
          <View style={[s.statusChip, { backgroundColor: status.color + '28', borderColor: status.color + '50' }]}>
            <Ionicons name={status.icon} size={12} color={status.color === C.green ? '#6ee7b7' : status.color === C.amber ? '#fde68a' : '#fca5a5'} />
            <Text style={[s.statusChipTxt, { color: status.color === C.green ? '#6ee7b7' : status.color === C.amber ? '#fde68a' : '#fca5a5' }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* header stats row */}
        <View style={s.hStats}>
          <View style={s.hStat}>
            <Text style={s.hStatVal}>{product.quantity}</Text>
            <Text style={s.hStatLbl}>units</Text>
          </View>
          <View style={s.hStatDivider} />
          <View style={s.hStat}>
            <Text style={s.hStatVal}>${product.selling_price.toFixed(2)}</Text>
            <Text style={s.hStatLbl}>sell price</Text>
          </View>
          <View style={s.hStatDivider} />
          <View style={s.hStat}>
            <Text style={[s.hStatVal, { color: profit >= 0 ? '#6ee7b7' : '#fca5a5' }]}>
              {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
            </Text>
            <Text style={s.hStatLbl}>profit</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ── Pricing & Cost ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardHeadIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="cash-outline" size={15} color={C.green} />
            </View>
            <Text style={s.cardTitle}>Pricing & Cost</Text>
          </View>

          {[
            { label: 'Cost Price',      value: `$${product.cost_price.toFixed(2)}`,    color: C.textMid },
            { label: 'Selling Price',   value: `$${product.selling_price.toFixed(2)}`, color: C.blue    },
            { label: 'Profit / Unit',   value: `${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`, color: profit >= 0 ? C.green : C.red },
            { label: 'Margin',          value: `${margin}%`,                            color: profit >= 0 ? C.green : C.red },
          ].map((row, i, arr) => (
            <View key={i} style={[s.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={[s.infoValue, { color: row.color }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Product Information ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardHeadIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="information-circle-outline" size={15} color={C.blue} />
            </View>
            <Text style={s.cardTitle}>Product Information</Text>
          </View>

          {[
            { label: 'Category',         value: category?.name || 'N/A' },
            { label: 'Supplier',         value: supplier?.name || 'N/A' },
            { label: 'Low Stock Alert',  value: `When below ${product.low_stock_alert} units` },
            ...(product.expiry_date ? [{ label: 'Expiry Date', value: product.expiry_date }] : []),
          ].map((row, i, arr) => (
            <View key={i} style={[s.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={s.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Stock History ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardHeadIcon, { backgroundColor: '#faf5ff' }]}>
              <Ionicons name="time-outline" size={15} color={C.primary} />
            </View>
            <Text style={s.cardTitle}>Stock History</Text>
            <View style={s.countBadge}>
              <Text style={s.countTxt}>{stockHistory.length}</Text>
            </View>
          </View>

          {loading ? (
            <View style={s.centered}>
              <ActivityIndicator size="small" color={C.primary} />
            </View>
          ) : stockHistory.length > 0 ? (
            <FlatList
              data={stockHistory}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={renderHistoryItem}
            />
          ) : (
            <View style={s.emptyState}>
              <View style={s.emptyIcon}>
                <Ionicons name="time-outline" size={26} color={C.border} />
              </View>
              <Text style={s.emptyTxt}>No stock history</Text>
            </View>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={[s.card, { marginBottom: 28 }]}>
          <View style={s.cardHead}>
            <View style={[s.cardHeadIcon, { backgroundColor: '#ecfeff' }]}>
              <Ionicons name="flash-outline" size={15} color={C.cyan} />
            </View>
            <Text style={s.cardTitle}>Quick Actions</Text>
          </View>

          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#f0fdf4', borderColor: C.green + '40' }]}
              onPress={() =>
                navigation.navigate('Stock', { screen: 'StockIn', params: { productId } })
              }
              activeOpacity={0.82}
            >
              <View style={[s.actionIcon, { backgroundColor: C.green }]}>
                <Ionicons name="arrow-down" size={18} color="#fff" />
              </View>
              <Text style={[s.actionLabel, { color: C.green }]}>Stock In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#fef2f2', borderColor: C.red + '40' }]}
              onPress={() =>
                navigation.navigate('Stock', { screen: 'StockOut', params: { productId } })
              }
              activeOpacity={0.82}
            >
              <View style={[s.actionIcon, { backgroundColor: C.red }]}>
                <Ionicons name="arrow-up" size={18} color="#fff" />
              </View>
              <Text style={[s.actionLabel, { color: C.red }]}>Stock Out</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.editBtn, !canUpdate && { opacity: 0.45 }]}
            onPress={() => {
              if (!canUpdate) {
                Alert.alert('Access Denied', 'You do not have permission to edit products');
                return;
              }
              navigation.navigate('AddEditProduct', { productId });
            }}
            disabled={!canUpdate}
            activeOpacity={0.85}
          >
            <Ionicons name="pencil" size={17} color="#fff" />
            <Text style={s.editBtnTxt}>Edit Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Not Found
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundTxt: { fontSize: 15, color: C.textMute, fontWeight: '500' },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  hCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(99,102,241,0.15)', top: -60, right: -40,
  },
  hCircle2: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(99,102,241,0.1)', bottom: -30, left: 20,
  },
  hTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  hTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  hSku:   { fontSize: 12, color: '#a5b4fc', marginTop: 2 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  statusChipTxt: { fontSize: 11, fontWeight: '700' },
  hStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  hStat:        { flex: 1, alignItems: 'center' },
  hStatVal:     { fontSize: 18, fontWeight: '800', color: '#fff' },
  hStatLbl:     { fontSize: 11, color: '#a5b4fc', marginTop: 2, fontWeight: '500' },
  hStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 8 },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  // ── Card
  card: {
    backgroundColor: C.card,
    borderRadius: 20, padding: 16,
    marginBottom: 12,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
    elevation: 2,
  },
  cardHead: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 14,
  },
  cardHeadIcon: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: C.text, flex: 1 },
  countBadge: {
    backgroundColor: C.primary + '18',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  countTxt: { fontSize: 11, fontWeight: '700', color: C.primary },

  // ── Info Rows
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#f0f2f8',
  },
  infoLabel: { fontSize: 13, color: C.textMid, fontWeight: '500' },
  infoValue: { fontSize: 13, color: C.text, fontWeight: '700' },

  // ── History
  histRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f2f8',
  },
  histIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  histBody:   { flex: 1 },
  histType:   { fontSize: 13, fontWeight: '700', color: C.text },
  histReason: { fontSize: 12, color: C.textMute, marginTop: 1 },
  histDate:   { fontSize: 11, color: C.textMute, marginTop: 1 },
  histQty:    { fontSize: 17, fontWeight: '800' },

  // ── Empty / Loading
  centered:  { paddingVertical: 20, alignItems: 'center' },
  emptyState: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  emptyIcon: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTxt: { fontSize: 13, color: C.textMute, fontWeight: '500' },

  // ── Actions
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    padding: 14, alignItems: 'center', gap: 8,
  },
  actionIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 15, borderRadius: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10,
    elevation: 5,
  },
  editBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

export default ProductDetailScreen;