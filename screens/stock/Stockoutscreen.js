import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { AuthContext } from '../../context/Authcontext';
import { InputField, Button, SelectField, AccessDenied } from '../../components/Common';
import EnhancedSelectField from '../../components/EnhancedSelectField';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';
import { handleStockOut } from '../../lib/database';

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
  green:    '#059669',
  blue:     '#2563eb',
  amber:    '#d97706',
  red:      '#dc2626',
  orange:   '#ea580c',
};

// ─── Reason config ────────────────────────────────────────────
const REASONS = [
  { id: 'sale',   name: 'Sale',       icon: 'cart',            color: C.blue  },
  { id: 'damage', name: 'Damage',     icon: 'warning',         color: C.orange},
  { id: 'return', name: 'Return',     icon: 'refresh-circle',  color: C.amber },
  { id: 'loss',   name: 'Loss/Theft', icon: 'alert-circle',    color: C.red   },
  { id: 'other',  name: 'Other',      icon: 'ellipsis-horizontal-circle', color: C.textMid },
];

// ─── Reason Pill Selector ─────────────────────────────────────
const ReasonSelector = ({ value, onChange }) => (
  <View style={rs.wrap}>
    {REASONS.map((r) => {
      const active = value === r.id;
      return (
        <TouchableOpacity
          key={r.id}
          style={[rs.pill, active && { backgroundColor: r.color, borderColor: r.color }]}
          onPress={() => onChange(r.id)}
          activeOpacity={0.8}
        >
          <Ionicons name={r.icon} size={14} color={active ? '#fff' : C.textMute} />
          <Text style={[rs.txt, active && { color: '#fff' }]}>{r.name}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);
const rs = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: '#f8fafc',
  },
  txt:  { fontSize: 12, fontWeight: '700', color: C.textMid },
});

// ─── Stock Level Bar ──────────────────────────────────────────
const StockLevelBar = ({ current, max, removing }) => {
  const pct      = max > 0 ? Math.min(current / max, 1) : 0;
  const afterPct = max > 0 ? Math.max((current - removing) / max, 0) : 0;
  const barColor = afterPct < 0.2 ? C.red : afterPct < 0.4 ? C.amber : C.green;
  return (
    <View style={slb.wrap}>
      <View style={slb.labels}>
        <Text style={slb.labelTxt}>Stock Level</Text>
        <Text style={[slb.labelVal, { color: barColor }]}>
          {removing > 0 ? `${current} → ${Math.max(current - removing, 0)}` : `${current} units`}
        </Text>
      </View>
      <View style={slb.track}>
        <View style={[slb.fill, { width: `${pct * 100}%`, backgroundColor: '#e2e8f0' }]} />
        <View style={[slb.fill, slb.after, { width: `${afterPct * 100}%`, backgroundColor: barColor }]} />
      </View>
      {removing > 0 && current - removing < 0 && (
        <View style={slb.warning}>
          <Ionicons name="warning" size={13} color={C.red} />
          <Text style={slb.warningTxt}>Cannot remove more than available stock</Text>
        </View>
      )}
    </View>
  );
};
const slb = StyleSheet.create({
  wrap:    { marginBottom: 12 },
  labels:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  labelTxt:{ fontSize: 12, color: C.textMute, fontWeight: '600' },
  labelVal:{ fontSize: 13, fontWeight: '800' },
  track:   { height: 8, backgroundColor: '#f0f2f8', borderRadius: 6, overflow: 'hidden', position: 'relative' },
  fill:    { position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 6 },
  after:   { zIndex: 1 },
  warning: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 6, backgroundColor: '#fef2f2',
    borderRadius: 8, padding: 8, borderWidth: 1, borderColor: C.red + '30',
  },
  warningTxt: { fontSize: 11, color: C.red, fontWeight: '600', flex: 1 },
});

// ─── Stat Badge ───────────────────────────────────────────────
const StatBadge = ({ icon, label, value, color }) => (
  <View style={[sbx.wrap, { borderColor: color + '30', backgroundColor: color + '0f' }]}>
    <View style={[sbx.iconBox, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={14} color={color} />
    </View>
    <View>
      <Text style={sbx.label}>{label}</Text>
      <Text style={[sbx.value, { color }]}>{value}</Text>
    </View>
  </View>
);
const sbx = StyleSheet.create({
  wrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 8, borderRadius: 12, borderWidth: 1.5, padding: 10,
  },
  iconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 10, color: C.textMute, fontWeight: '600', marginBottom: 1 },
  value:   { fontSize: 13, fontWeight: '800' },
});

// ─── Main Component ───────────────────────────────────────────
const StockOutScreen = ({ route, navigation }) => {
  const { state, dispatch }  = useContext(AppContext);
  const { userData }         = useContext(AuthContext);
  const { hasFeatureAccess } = usePermissions();
  const productId            = route.params?.productId;
  const hasStockOutAccess    = hasFeatureAccess('stock_out');

  const progressAnim   = useRef(new Animated.Value(0)).current;
  const warningAnim    = useRef(new Animated.Value(1)).current;

  if (!hasStockOutAccess) {
    return <AccessDenied featureName="Stock Out" />;
  }

  const reasons = [
    { id: 'sale',   name: 'Sale'       },
    { id: 'damage', name: 'Damage'     },
    { id: 'return', name: 'Return'     },
    { id: 'loss',   name: 'Loss/Theft' },
    { id: 'other',  name: 'Other'      },
  ];

  const [formData, setFormData] = useState({
    productId: productId || null,
    quantity:  '',
    reason:    'sale',
    date:      new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const selectedProduct = state.products.find(p => p.id === formData.productId);
  const qty             = parseInt(formData.quantity) || 0;
  const isOverStock     = selectedProduct && qty > selectedProduct.quantity;
  const newStock        = selectedProduct ? Math.max(selectedProduct.quantity - qty, 0) : null;
  const selectedReason  = REASONS.find(r => r.id === formData.reason) || REASONS[0];

  // Progress animation
  useEffect(() => {
    const pct = formData.productId ? (formData.quantity ? 1 : 0.45) : 0.05;
    Animated.spring(progressAnim, {
      toValue: pct,
      useNativeDriver: false,
      tension: 50, friction: 8,
    }).start();
  }, [formData.productId, formData.quantity]);

  // Warning pulse when over-stock
  useEffect(() => {
    if (isOverStock) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(warningAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(warningAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      warningAnim.stopAnimation();
      warningAnim.setValue(1);
    }
  }, [isOverStock]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.productId) newErrors.productId = 'Product is required';
    if (!formData.quantity)  newErrors.quantity  = 'Quantity is required';
    if (formData.quantity && isNaN(parseInt(formData.quantity)))
      newErrors.quantity = 'Quantity must be a number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStockOut = async () => {
    if (!validateForm()) return;
    if (!state.user || !state.user.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    const product = state.products.find(p => p.id === formData.productId);
    setLoading(true);
    try {
      console.log('User ID:', state.user.id);
      console.log('Product ID:', formData.productId);
      console.log('Quantity:', parseInt(formData.quantity));

      const result = await handleStockOut(
        supabase,
        state.user.id,
        userData.name,
        formData.productId,
        parseInt(formData.quantity),
        formData.reason,
        product.quantity,
        null,
      );
      console.log('Stock out result:', result);
      if (!result.success) throw new Error(result.error);

      dispatch({
        type: 'STOCK_OUT',
        payload: {
          productId: formData.productId,
          quantity:  parseInt(formData.quantity),
          reason:    formData.reason,
        },
      });
      dispatch({ type: 'INVALIDATE_DATA' });
      Alert.alert('Success', 'Stock removed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Stock out error:', error);
      Alert.alert('Error', error.message || 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.hBlob1} />
        <View style={s.hBlob2} />
        <View style={s.hTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#c7d2fe" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Stock Out</Text>
            <Text style={s.hSub}>Remove items from inventory</Text>
          </View>
          <View style={[s.hBadge, { backgroundColor: 'rgba(220,38,38,0.2)', borderColor: 'rgba(252,165,165,0.3)' }]}>
            <Ionicons name="arrow-up-circle" size={16} color="#fca5a5" />
            <Text style={[s.hBadgeTxt, { color: '#fca5a5' }]}>Outgoing</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <Animated.View
              style={[s.progressFill, {
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: isOverStock ? C.red : C.red,
              }]}
            />
          </View>
          <Text style={s.progressTxt}>
            {!formData.productId ? 'Select a product to begin' :
             !formData.quantity   ? 'Enter removal quantity' : 'Ready to submit'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Live Product Preview ── */}
          {selectedProduct && (
            <View style={s.previewCard}>
              <View style={s.previewTop}>
                <View style={[s.previewIconBox, { backgroundColor: selectedReason.color + '18' }]}>
                  <Ionicons name={selectedReason.icon} size={20} color={selectedReason.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.previewName} numberOfLines={1}>{selectedProduct.name}</Text>
                  <Text style={s.previewSku}>Reason: {selectedReason.name}</Text>
                </View>
                <View style={[s.previewArrow, isOverStock && { borderColor: C.red + '40', backgroundColor: '#fef2f2' }]}>
                  <Text style={s.previewOld}>{selectedProduct.quantity}</Text>
                  <Ionicons name="arrow-forward" size={14} color={isOverStock ? C.red : C.red} />
                  <Text style={[s.previewNew, { color: isOverStock ? C.red : C.red }]}>
                    {qty > 0 ? (isOverStock ? '⚠ 0' : newStock) : '—'}
                  </Text>
                </View>
              </View>

              {/* Stock level bar */}
              <StockLevelBar
                current={selectedProduct.quantity}
                max={Math.max(selectedProduct.quantity * 2, 100)}
                removing={qty}
              />

              <View style={s.statRow}>
                <StatBadge
                  icon="layers"
                  label="Current Stock"
                  value={`${selectedProduct.quantity} units`}
                  color={C.blue}
                />
                <StatBadge
                  icon="remove-circle"
                  label="Removing"
                  value={qty > 0 ? `-${qty} units` : '—'}
                  color={isOverStock ? C.red : C.red}
                />
              </View>

              {/* Over-stock warning */}
              {isOverStock && (
                <Animated.View style={[s.overStockWarn, { opacity: warningAnim }]}>
                  <Ionicons name="warning" size={16} color={C.red} />
                  <Text style={s.overStockTxt}>
                    Cannot remove {qty} units — only {selectedProduct.quantity} available
                  </Text>
                </Animated.View>
              )}
            </View>
          )}

          {/* ── Form Card ── */}
          <View style={s.formCard}>

            {/* Product select */}
            <View style={s.formBlock}>
              <View style={s.blockHead}>
                <View style={[s.blockIcon, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="cube-outline" size={15} color={C.blue} />
                </View>
                <Text style={s.blockTitle}>Select Product</Text>
              </View>
              <EnhancedSelectField
                label="Product"
                placeholder="Select product"
                value={formData.productId}
                items={state.products}
                onSelect={(id) => setFormData({ ...formData, productId: id })}
                onAddItem={(newProduct) => dispatch({ type: 'ADD_PRODUCT', payload: newProduct })}
                error={errors.productId}
                type="product"
                categories={state.categories}
                suppliers={state.suppliers}
              />
            </View>

            <View style={s.divider} />

            {/* Reason pills */}
            <View style={s.formBlock}>
              <View style={s.blockHead}>
                <View style={[s.blockIcon, { backgroundColor: selectedReason.color + '18' }]}>
                  <Ionicons name={selectedReason.icon} size={15} color={selectedReason.color} />
                </View>
                <Text style={s.blockTitle}>Reason for Removal</Text>
              </View>
              <ReasonSelector
                value={formData.reason}
                onChange={(r) => setFormData({ ...formData, reason: r })}
              />
              {/* Hidden SelectField to keep existing functionality intact */}
              <View style={{ height: 0, overflow: 'hidden' }}>
                <SelectField
                  label=""
                  placeholder=""
                  value={formData.reason}
                  items={reasons}
                  onSelect={(r) => setFormData({ ...formData, reason: r })}
                />
              </View>
            </View>

            <View style={s.divider} />

            {/* Quantity + Date */}
            <View style={s.formBlock}>
              <View style={s.blockHead}>
                <View style={[s.blockIcon, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="layers-outline" size={15} color={C.red} />
                </View>
                <Text style={s.blockTitle}>Quantity & Date</Text>
              </View>
              <InputField
                label="Quantity to Remove"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                keyboardType="number-pad"
                error={errors.quantity}
                icon="layers"
              />
              <InputField
                label="Date"
                placeholder="YYYY-MM-DD"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                icon="calendar"
              />
            </View>
          </View>

          {/* ── Buttons ── */}
          <View style={s.btnGroup}>
            <TouchableOpacity
              style={[
                s.submitBtn,
                (loading || isOverStock) && { opacity: 0.65 },
              ]}
              onPress={handleSubmitStockOut}
              disabled={loading || isOverStock}
              activeOpacity={0.85}
            >
              <View style={s.submitBtnInner}>
                <View style={s.submitIcon}>
                  <Ionicons name="arrow-up-circle" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={s.submitTitle}>{loading ? 'Removing Stock…' : 'Remove Stock'}</Text>
                  {!loading && qty > 0 && !isOverStock && (
                    <Text style={s.submitSub}>
                      -{qty} units · {selectedReason.name}
                    </Text>
                  )}
                  {isOverStock && <Text style={s.submitSub}>⚠ Exceeds available stock</Text>}
                </View>
              </View>
              {!loading && <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />}
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 22,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  hBlob1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(220,38,38,0.18)', top: -70, right: -40,
  },
  hBlob2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(99,102,241,0.1)', bottom: -30, left: 20,
  },
  hTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  hTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  hSub:   { fontSize: 12, color: '#a5b4fc', marginTop: 2 },
  hBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  hBadgeTxt: { fontSize: 11, fontWeight: '700' },
  progressWrap: { gap: 8 },
  progressTrack: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 10 },
  progressTxt:  { fontSize: 11, color: '#a5b4fc', fontWeight: '500' },

  // ── Scroll
  scrollContent: { padding: 14, paddingBottom: 40 },

  // ── Preview Card
  previewCard: {
    backgroundColor: C.card,
    borderRadius: 20, padding: 16,
    marginBottom: 12,
    borderWidth: 1.5, borderColor: C.red + '25',
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09, shadowRadius: 12,
    elevation: 4,
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  previewIconBox: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  previewName: { fontSize: 14, fontWeight: '800', color: C.text },
  previewSku:  { fontSize: 11, color: C.textMute, marginTop: 2 },
  previewArrow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fef2f2', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: C.red + '30',
  },
  previewOld: { fontSize: 13, fontWeight: '700', color: C.textMid },
  previewNew: { fontSize: 14, fontWeight: '800' },
  statRow: { flexDirection: 'row', gap: 8 },
  overStockWarn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10,
    padding: 10, marginTop: 10,
    borderWidth: 1, borderColor: C.red + '40',
  },
  overStockTxt: { fontSize: 12, color: C.red, fontWeight: '600', flex: 1 },

  // ── Form Card
  formCard: {
    backgroundColor: C.card,
    borderRadius: 20, padding: 16,
    marginBottom: 12,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
    elevation: 2,
  },
  formBlock:  { marginBottom: 4 },
  blockHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  blockIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  blockTitle: { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  divider:    { height: 1, backgroundColor: '#f0f2f8', marginVertical: 16 },

  // ── Buttons
  btnGroup: { gap: 10 },
  submitBtn: {
    backgroundColor: C.red,
    borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 14,
    elevation: 8,
  },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  submitIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  submitTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  submitSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  cancelBtn: {
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center',
  },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
});

export default StockOutScreen;