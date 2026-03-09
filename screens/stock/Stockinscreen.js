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
import { handleStockIn } from '../../lib/database';

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
  greenLight: '#d1fae5',
  blue:     '#2563eb',
  amber:    '#d97706',
  red:      '#dc2626',
};

// ─── Step Indicator ───────────────────────────────────────────
const StepDot = ({ active, done, number }) => (
  <View style={[sd.wrap, done && sd.doneBg, active && sd.activeBg]}>
    {done
      ? <Ionicons name="checkmark" size={13} color="#fff" />
      : <Text style={[sd.num, active && { color: '#fff' }, done && { color: '#fff' }]}>{number}</Text>}
  </View>
);
const sd = StyleSheet.create({
  wrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e8ecf4',
    alignItems: 'center', justifyContent: 'center',
  },
  activeBg: { backgroundColor: C.green },
  doneBg:   { backgroundColor: C.green },
  num:      { fontSize: 12, fontWeight: '800', color: C.textMute },
});

// ─── Stat Badge (shows selected product info) ─────────────────
const StatBadge = ({ icon, label, value, color = C.green }) => (
  <View style={[sb.wrap, { borderColor: color + '30', backgroundColor: color + '0f' }]}>
    <View style={[sb.iconBox, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={14} color={color} />
    </View>
    <View>
      <Text style={sb.label}>{label}</Text>
      <Text style={[sb.value, { color }]}>{value}</Text>
    </View>
  </View>
);
const sb = StyleSheet.create({
  wrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 8, borderRadius: 12, borderWidth: 1.5, padding: 10,
  },
  iconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 10, color: C.textMute, fontWeight: '600', marginBottom: 1 },
  value:   { fontSize: 13, fontWeight: '800' },
});

// ─── Section Wrapper ──────────────────────────────────────────
const FormSection = ({ step, activeStep, title, subtitle, icon, color = C.green, children }) => {
  const isActive = activeStep >= step;
  return (
    <View style={[fsc.wrap, !isActive && fsc.dimmed]}>
      <View style={fsc.head}>
        <StepDot active={activeStep === step} done={activeStep > step} number={step} />
        <View style={fsc.headLine} />
        <View style={[fsc.headIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={15} color={isActive ? color : C.textMute} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[fsc.title, !isActive && { color: C.textMute }]}>{title}</Text>
          {subtitle ? <Text style={fsc.sub}>{subtitle}</Text> : null}
        </View>
      </View>
      {isActive && <View style={fsc.body}>{children}</View>}
    </View>
  );
};
const fsc = StyleSheet.create({
  wrap:     { marginBottom: 10 },
  dimmed:   { opacity: 0.45 },
  head:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  headLine: { width: 1, height: 20, backgroundColor: C.border },
  headIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  sub:      { fontSize: 11, color: C.textMute, marginTop: 1 },
  body:     { paddingLeft: 0 },
});

// ─── Main Component ───────────────────────────────────────────
const StockInScreen = ({ route, navigation }) => {
  const { state, dispatch }       = useContext(AppContext);
  const { userData }              = useContext(AuthContext);
  const { hasFeatureAccess }      = usePermissions();
  const productId                 = route.params?.productId;
  const hasStockInAccess          = hasFeatureAccess('stock_in');

  const progressAnim = useRef(new Animated.Value(0)).current;

  if (!hasStockInAccess) {
    return <AccessDenied featureName="Stock In" />;
  }

  const [formData, setFormData] = useState({
    productId:     productId || null,
    supplier:      null,
    quantity:      '',
    purchasePrice: '',
    date:          new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  // Determine which step is active based on what's filled
  const activeStep = formData.productId
    ? formData.quantity
      ? 3
      : 2
    : 1;

  // Animate progress bar
  useEffect(() => {
    const pct = formData.productId ? (formData.quantity ? (formData.purchasePrice ? 1 : 0.66) : 0.33) : 0.05;
    Animated.spring(progressAnim, {
      toValue: pct,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [formData.productId, formData.quantity, formData.purchasePrice]);

  const selectedProduct = state.products.find(p => p.id === formData.productId);
  const qty    = parseInt(formData.quantity) || 0;
  const price  = parseFloat(formData.purchasePrice) || 0;
  const total  = qty * price;
  const newStock = selectedProduct ? selectedProduct.quantity + qty : null;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.productId) newErrors.productId = 'Product is required';
    if (!formData.quantity)  newErrors.quantity  = 'Quantity is required';
    if (formData.quantity && isNaN(parseInt(formData.quantity)))
      newErrors.quantity = 'Quantity must be a number';
    if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice)))
      newErrors.purchasePrice = 'Price must be a number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStockIn = async () => {
    console.log('=== handleSubmitStockIn called ===');
    console.log('Form data:', formData);
    if (!validateForm()) { console.log('Form validation failed'); return; }
    if (!state.user || !state.user.id) {
      console.log('User not authenticated:', state.user);
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    setLoading(true);
    try {
      const product = state.products.find(p => p.id === formData.productId);
      console.log('Found product:', product);
      console.log('User ID:', state.user.id);
      console.log('Product ID:', formData.productId);
      console.log('Quantity:', parseInt(formData.quantity));
      console.log('Current product quantity:', product?.quantity);

      const result = await handleStockIn(
        supabase,
        state.user.id,
        userData.name,
        formData.productId,
        parseInt(formData.quantity),
        'Purchase',
        product.quantity,
        null,
      );
      console.log('Stock in result:', result);
      if (!result.success) throw new Error(result.error);

      dispatch({
        type: 'STOCK_IN',
        payload: {
          productId:     formData.productId,
          quantity:      parseInt(formData.quantity),
          reason:        'Purchase',
          purchasePrice: parseFloat(formData.purchasePrice || 0),
          supplierId:    formData.supplier,
        },
      });
      dispatch({ type: 'INVALIDATE_DATA' });
      Alert.alert('Success', 'Stock added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Stock in error:', error);
      Alert.alert('Error', error.message || 'Failed to add stock');
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
            <Text style={s.hTitle}>Stock In</Text>
            <Text style={s.hSub}>Add inventory to your store</Text>
          </View>
          <View style={s.hBadge}>
            <Ionicons name="arrow-down-circle" size={16} color="#6ee7b7" />
            <Text style={s.hBadgeTxt}>Incoming</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <Animated.View
              style={[s.progressFill, {
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]}
            />
          </View>
          <Text style={s.progressTxt}>
            {!formData.productId ? 'Select a product to begin' :
             !formData.quantity ? 'Enter quantity' : 'Ready to submit'}
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
          {/* ── Live Preview Card ── */}
          {selectedProduct && (
            <View style={s.previewCard}>
              <View style={s.previewTop}>
                <View style={s.previewIconBox}>
                  <Ionicons name="cube" size={20} color={C.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.previewName} numberOfLines={1}>{selectedProduct.name}</Text>
                  <Text style={s.previewSku}>SKU: {selectedProduct.sku}</Text>
                </View>
                <View style={s.previewArrow}>
                  <Text style={s.previewOld}>{selectedProduct.quantity}</Text>
                  <Ionicons name="arrow-forward" size={14} color={C.green} />
                  <Text style={s.previewNew}>
                    {qty > 0 ? newStock : '—'}
                  </Text>
                </View>
              </View>
              <View style={s.statRow}>
                <StatBadge icon="layers" label="Current Stock" value={`${selectedProduct.quantity} units`} color={C.blue} />
                <StatBadge icon="add-circle" label="Adding" value={qty > 0 ? `+${qty} units` : '—'} color={C.green} />
              </View>
              {qty > 0 && price > 0 && (
                <View style={s.totalRow}>
                  <Ionicons name="cash-outline" size={15} color={C.green} />
                  <Text style={s.totalTxt}>
                    Total Purchase Cost: <Text style={s.totalVal}>${total.toFixed(2)}</Text>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Form Card ── */}
          <View style={s.formCard}>

            {/* Step 1: Product */}
            <FormSection step={1} activeStep={activeStep} title="Select Product" subtitle="Which product are you restocking?" icon="cube-outline" color={C.green}>
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
              <EnhancedSelectField
                label="Supplier (Optional)"
                placeholder="Select supplier"
                value={formData.supplier}
                items={state.suppliers}
                onSelect={(id) => setFormData({ ...formData, supplier: id })}
                onAddItem={(newSupplier) => dispatch({ type: 'ADD_SUPPLIER', payload: newSupplier })}
                type="supplier"
              />
            </FormSection>

            <View style={s.sectionDivider} />

            {/* Step 2: Quantity */}
            <FormSection step={2} activeStep={activeStep} title="Quantity & Price" subtitle="How many units are you adding?" icon="layers-outline" color={C.blue}>
              <InputField
                label="Quantity"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                keyboardType="number-pad"
                error={errors.quantity}
                icon="layers"
              />
              <InputField
                label="Purchase Price Per Unit ($)"
                placeholder="0.00"
                value={formData.purchasePrice}
                onChangeText={(text) => setFormData({ ...formData, purchasePrice: text })}
                keyboardType="decimal-pad"
                error={errors.purchasePrice}
                icon="cash"
              />
            </FormSection>

            <View style={s.sectionDivider} />

            {/* Step 3: Date */}
            <FormSection step={3} activeStep={activeStep} title="Date" subtitle="When is this stock being added?" icon="calendar-outline" color={C.amber}>
              <InputField
                label="Date"
                placeholder="YYYY-MM-DD"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                icon="calendar"
              />
            </FormSection>
          </View>

          {/* ── Buttons ── */}
          <View style={s.btnGroup}>
            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmitStockIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              <View style={s.submitBtnInner}>
                <View style={s.submitIcon}>
                  <Ionicons name="arrow-down-circle" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={s.submitTitle}>{loading ? 'Adding Stock…' : 'Add Stock'}</Text>
                  {!loading && qty > 0 && (
                    <Text style={s.submitSub}>+{qty} units{total > 0 ? ` · $${total.toFixed(2)}` : ''}</Text>
                  )}
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
    backgroundColor: 'rgba(5,150,105,0.2)', top: -70, right: -40,
  },
  hBlob2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(99,102,241,0.12)', bottom: -30, left: 20,
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
    backgroundColor: 'rgba(5,150,105,0.25)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(110,231,183,0.3)',
  },
  hBadgeTxt: { fontSize: 11, color: '#6ee7b7', fontWeight: '700' },
  progressWrap: { gap: 8 },
  progressTrack: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, overflow: 'hidden',
  },
  progressFill:  { height: '100%', backgroundColor: C.green, borderRadius: 10 },
  progressTxt:   { fontSize: 11, color: '#a5b4fc', fontWeight: '500' },

  // ── Scroll
  scrollContent: { padding: 14, paddingBottom: 40 },

  // ── Preview Card
  previewCard: {
    backgroundColor: C.card,
    borderRadius: 20, padding: 16,
    marginBottom: 12,
    borderWidth: 1.5, borderColor: C.green + '30',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12,
    elevation: 4,
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  previewIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.green + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  previewName:    { fontSize: 14, fontWeight: '800', color: C.text },
  previewSku:     { fontSize: 11, color: C.textMute, marginTop: 2 },
  previewArrow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0fdf4', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: C.green + '30',
  },
  previewOld: { fontSize: 13, fontWeight: '700', color: C.textMid },
  previewNew: { fontSize: 14, fontWeight: '800', color: C.green },
  statRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  totalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: C.green + '30',
  },
  totalTxt: { fontSize: 13, color: C.textMid, fontWeight: '500' },
  totalVal: { fontSize: 14, fontWeight: '800', color: C.green },

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
  sectionDivider: { height: 1, backgroundColor: '#f0f2f8', marginVertical: 16 },

  // ── Buttons
  btnGroup: { gap: 10 },
  submitBtn: {
    backgroundColor: C.green,
    borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14,
    elevation: 8,
  },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  submitIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  submitTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  submitSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  cancelBtn: {
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center',
  },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
});

export default StockInScreen;