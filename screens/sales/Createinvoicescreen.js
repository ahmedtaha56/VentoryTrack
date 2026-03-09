import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { InputField, SelectField, Card, AccessDenied } from '../../components/Common';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';
import { insertSaleWithNotification, handleStockOut, getLowStockProducts } from '../../lib/database';

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
const PAYMENT_METHODS = [
  { id: 'cash',  name: 'Cash',          icon: 'cash',          color: C.green  },
  { id: 'card',  name: 'Card',          icon: 'card',          color: C.blue   },
  { id: 'check', name: 'Check',         icon: 'document-text', color: C.amber  },
  { id: 'bank',  name: 'Bank Transfer', icon: 'business',      color: C.cyan   },
];

// ─── Payment Method Pill Selector ────────────────────────────
const PaymentSelector = ({ value, onChange }) => (
  <View style={ps.wrap}>
    {PAYMENT_METHODS.map((pm) => {
      const active = value === pm.id;
      return (
        <TouchableOpacity
          key={pm.id}
          style={[ps.pill, active && { backgroundColor: pm.color, borderColor: pm.color }]}
          onPress={() => onChange(pm.id)}
          activeOpacity={0.8}
        >
          <Ionicons name={pm.icon} size={14} color={active ? '#fff' : C.textMute} />
          <Text style={[ps.txt, active && { color: '#fff' }]}>{pm.name}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);
const ps = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: '#f8fafc',
  },
  txt: { fontSize: 12, fontWeight: '700', color: C.textMid },
});

// ─── Section Block ────────────────────────────────────────────
const Block = ({ icon, color = C.primary, title, children }) => (
  <View style={bl.wrap}>
    <View style={bl.head}>
      <View style={[bl.iconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={bl.title}>{title}</Text>
    </View>
    {children}
  </View>
);
const bl = StyleSheet.create({
  wrap:    { marginBottom: 4 },
  head:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
});

const CreateInvoiceScreen = ({ navigation }) => {
  const { state, dispatch }   = useContext(AppContext);
  const { hasFeatureAccess }  = usePermissions();
  const hasSalesCreateAccess  = hasFeatureAccess('sales_create');

  const progressAnim = useRef(new Animated.Value(0)).current;

  if (!hasSalesCreateAccess) return <AccessDenied featureName="Create Invoice" />;

  const [formData, setFormData] = useState({
    customerName:  '',
    paymentMethod: 'cash',
  });
  const [items, setItems]               = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemQuantity, setItemQuantity] = useState('');
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);
  const [lowStockWarning, setLowStockWarning] = useState([]);

  useEffect(() => {
    console.log('=== CreateInvoiceScreen Mounted ===');
    console.log('Products available:', state.products.length);
    console.log('User:', state.user);
    if (state.products.length === 0) {
      console.log('⚠️ Products not loaded, fetching...');
      loadProducts();
    }
    checkLowStock();
  }, []);

  // Progress animation
  useEffect(() => {
    const pct = formData.customerName ? (items.length > 0 ? 1 : 0.5) : 0.1;
    Animated.spring(progressAnim, {
      toValue: pct, useNativeDriver: false, tension: 50, friction: 8,
    }).start();
  }, [formData.customerName, items.length]);

  const checkLowStock = async () => {
    const result = await getLowStockProducts(supabase);
    if (result.success && result.products.length > 0) {
      setLowStockWarning(result.products);
      console.log('⚠️ Low stock products:', result.products);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('📦 Fetching products for invoice creation...');
      console.log('🔍 Fetching ALL products (no filters)...');
      const { data, error } = await supabase
        .from('products').select('*').order('name', { ascending: true });

      console.log('📋 Query response - data:', data);
      console.log('📋 Query response - error:', error);
      console.log('📋 Data type:', typeof data, 'Data is array?', Array.isArray(data));

      if (error) {
        console.error('❌ Error fetching products:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        return;
      }

      console.log('✅ Products loaded:', data ? data.length : 0);
      if (data && data.length > 0) {
        console.log('📝 First product sample:', JSON.stringify(data[0], null, 2));
        console.log('📝 Product keys:', Object.keys(data[0]));
        console.log('📝 Product count:', data.length);
      } else {
        console.warn('⚠️ Products array is empty');
        console.log('🔄 Trying alternative query without order...');
        const { data: altData, error: altError } = await supabase.from('products').select('*');
        console.log('🔄 Alternative query - data:', altData ? altData.length : 0, 'error:', altError);
      }

      dispatch({ type: 'SET_PRODUCTS', payload: data || [] });
      console.log('✅ Products dispatched to AppContext');
      return true;
    } catch (error) {
      console.error('🔥 Exception loading products:', error);
      console.error('🔥 Exception message:', error.message);
      console.error('🔥 Exception stack:', error.stack);
      return false;
    }
  };

  const addItem = () => {
    console.log('=== Add Item Button Pressed ===');
    console.log('Selected Product:', selectedProduct);
    console.log('Item Quantity:', itemQuantity);

    if (!selectedProduct || !itemQuantity) {
      console.log('Error: Missing product or quantity');
      Alert.alert('Error', 'Please select product and quantity');
      return;
    }

    const product = state.products.find((p) => p.id === selectedProduct);
    console.log('Found product:', product);
    console.log('Product keys:', product ? Object.keys(product) : 'N/A');

    if (!product) {
      console.log('Error: Product not found');
      Alert.alert('Error', 'Product not found');
      return;
    }

    const quantity = parseInt(itemQuantity);
    console.log('Parsed quantity:', quantity);

    if (isNaN(quantity) || quantity <= 0) {
      console.log('Error: Invalid quantity');
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (quantity > product.quantity) {
      console.log(`Error: Not enough stock. Available: ${product.quantity}`);
      Alert.alert('Error', `Only ${product.quantity} units available`);
      return;
    }

    const sellingPrice = product.selling_price || product.sellingPrice;
    console.log('Selling price:', sellingPrice);

    if (!sellingPrice || isNaN(sellingPrice) || parseFloat(sellingPrice) <= 0) {
      console.log('Error: Invalid or missing price');
      Alert.alert('Error', `Product "${product.name}" does not have a valid selling price. Please update the product first.`);
      return;
    }

    const newItem = {
      id:          Date.now(),
      productId:   selectedProduct,
      productName: product.name,
      quantity,
      unitPrice:   parseFloat(sellingPrice),
      total:       quantity * parseFloat(sellingPrice),
    };

    console.log('New item created:', newItem);
    setItems([...items, newItem]);
    console.log('Items after adding:', [...items, newItem]);
    setSelectedProduct(null);
    setItemQuantity('');
    Alert.alert('Success', `${product.name} added to invoice`);
  };

  const removeItem = (itemId) => {
    console.log('Removing item:', itemId);
    setItems(items.filter((item) => item.id !== itemId));
  };

  const total = items.reduce((sum, item) => sum + item.total, 0);

  const validateForm = () => {
    console.log('=== Validating Form ===');
    console.log('Customer Name:', formData.customerName);
    console.log('Items count:', items.length);
    const newErrors = {};
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (items.length === 0) {
      Alert.alert('Error', 'Add at least one item to invoice');
      return false;
    }
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Validation result:', isValid);
    return isValid;
  };

  const handleCreateInvoice = async () => {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🚀 CREATE INVOICE BUTTON PRESSED 🚀');
    console.log('═══════════════════════════════════════');
    console.log('Customer Name:', formData.customerName);
    console.log('Payment Method:', formData.paymentMethod);
    console.log('Items Count:', items.length);
    console.log('Total Amount:', total);
    console.log('User:', state.user);
    console.log('═══════════════════════════════════════');

    if (!validateForm()) { console.log('❌ Validation failed'); return; }
    if (!state.user || !state.user.id) {
      console.log('❌ No user logged in');
      Alert.alert('Error', 'User not logged in. Please log in to create an invoice.');
      return;
    }

    console.log('✅ Starting invoice creation');
    setLoading(true);

    try {
      const invoiceNumber = `INV-${Date.now()}`;
      console.log('📝 Invoice number:', invoiceNumber);

      const notes = JSON.stringify({
        customerName: formData.customerName, invoiceNumber, paymentMethod: formData.paymentMethod,
      });

      const saleItems = items.map(item => ({
        productId: item.productId, quantity: item.quantity,
        unitPrice: item.unitPrice, subtotal: item.total,
      }));

      console.log('📦 Sale items:', saleItems);
      console.log('💰 Total:', total);
      console.log('🔄 Calling insertSaleWithNotification...');

      const { data: userData } = await supabase
        .from('users').select('name').eq('id', state.user.id).single();
      const userName = userData?.name || state.user.email?.split('@')[0] || 'User';

      const result = await insertSaleWithNotification(
        supabase, state.user.id, userName, total, notes, saleItems, items,
      );

      console.log('✅ insertSaleWithNotification result:', result);
      if (!result.success) throw new Error(result.error || 'Failed to create sale');

      console.log('🔄 Starting stock updates...');
      for (const item of items) {
        const product = state.products.find(p => p.id === item.productId);
        if (!product) { console.error(`❌ Product not found for ID: ${item.productId}`); continue; }
        console.log(`📦 Updating stock for ${product.name}...`);
        const stockResult = await handleStockOut(
          supabase, state.user.id, state.user.name || state.user.email,
          item.productId, item.quantity, 'Sale', product.quantity, null, false,
        );
        console.log('Stock result:', stockResult);
        if (!stockResult.success) throw new Error(stockResult.error || 'Failed to update stock');
        dispatch({ type: 'STOCK_OUT', payload: { productId: item.productId, quantity: item.quantity } });
      }

      dispatch({
        type: 'ADD_SALE',
        payload: {
          id: result.sale.id, invoiceNumber,
          customerName: formData.customerName, date: new Date(),
          items, total, paymentMethod: formData.paymentMethod,
        },
      });

      dispatch({ type: 'INVALIDATE_DATA' });
      console.log('🔄 Refreshing products after invoice creation...');
      const refreshResult = await loadProducts();
      if (refreshResult) console.log('✅ Products refreshed with updated quantities');
      console.log('✅✅✅ Invoice created successfully! ✅✅✅');

      Alert.alert('Success', `Invoice ${invoiceNumber} created successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('❌❌❌ Error creating invoice ❌❌❌');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      Alert.alert('Error', error.message || 'Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { console.log('Items updated:', items); }, [items]);

  const selectedPM = PAYMENT_METHODS.find(p => p.id === formData.paymentMethod) || PAYMENT_METHODS[0];

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
            <Text style={s.hTitle}>Create Invoice</Text>
            <Text style={s.hSub}>New sales transaction</Text>
          </View>
          {items.length > 0 && (
            <View style={s.itemCountBadge}>
              <Text style={s.itemCountTxt}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]} />
          </View>
          <Text style={s.progressTxt}>
            {!formData.customerName ? 'Enter customer info' :
             items.length === 0    ? 'Add products' : 'Ready to create invoice'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Low Stock Warning ── */}
          {lowStockWarning.length > 0 && (
            <View style={s.warnCard}>
              <View style={s.warnIcon}>
                <Ionicons name="warning" size={18} color={C.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.warnTitle}>⚠️ Low Stock Alert</Text>
                <Text style={s.warnSub}>{lowStockWarning.length} product(s) running low:</Text>
                {lowStockWarning.map(p => (
                  <Text key={p.id} style={s.warnItem}>· {p.name}: {p.quantity} units</Text>
                ))}
              </View>
            </View>
          )}

          {/* ── Customer & Payment ── */}
          <View style={s.card}>
            <Block icon="person-outline" color={C.primary} title="Customer Details">
              <InputField
                label="Customer Name"
                placeholder="Enter customer name"
                value={formData.customerName}
                onChangeText={(text) => {
                  console.log('Customer name changed:', text);
                  setFormData({ ...formData, customerName: text });
                }}
                error={errors.customerName}
                icon="person"
              />
            </Block>

            <View style={s.divider} />

            <Block icon="cash-outline" color={selectedPM.color} title="Payment Method">
              <PaymentSelector
                value={formData.paymentMethod}
                onChange={(method) => {
                  console.log('Payment method selected:', method);
                  setFormData({ ...formData, paymentMethod: method });
                }}
              />
              {/* Hidden SelectField for existing functionality */}
              <View style={{ height: 0, overflow: 'hidden' }}>
                <SelectField
                  label="" placeholder="" value={formData.paymentMethod}
                  items={[
                    { id: 'cash', name: 'Cash' }, { id: 'card', name: 'Card' },
                    { id: 'check', name: 'Check' }, { id: 'bank', name: 'Bank Transfer' },
                  ]}
                  onSelect={(method) => setFormData({ ...formData, paymentMethod: method })}
                />
              </View>
            </Block>
          </View>

          {/* ── Add Items ── */}
          <View style={s.card}>
            <Block icon="cube-outline" color={C.blue} title="Add Products">
              {state.products.length === 0 ? (
                <View style={s.emptyProducts}>
                  <View style={s.emptyProductsIcon}>
                    <Ionicons name="cube-outline" size={30} color={C.border} />
                  </View>
                  <Text style={s.emptyProductsTxt}>No products available</Text>
                  <Text style={s.emptyProductsSub}>Contact your administrator to add products.</Text>
                </View>
              ) : (
                <>
                  <SelectField
                    label="Product"
                    placeholder="Select product"
                    value={selectedProduct}
                    items={state.products.filter((p) => p.quantity > 0)}
                    onSelect={(productId) => {
                      console.log('Product selected:', productId);
                      console.log('Total products available:', state.products.length);
                      console.log('Products with quantity > 0:', state.products.filter((p) => p.quantity > 0).length);
                      setSelectedProduct(productId);
                    }}
                  />

                  {/* Selected product quick info */}
                  {selectedProduct && (() => {
                    const p = state.products.find(pr => pr.id === selectedProduct);
                    if (!p) return null;
                    return (
                      <View style={s.productPreview}>
                        <View style={s.productPreviewLeft}>
                          <Text style={s.productPreviewName}>{p.name}</Text>
                          <Text style={s.productPreviewStock}>{p.quantity} units available</Text>
                        </View>
                        <Text style={s.productPreviewPrice}>${(p.selling_price || 0).toFixed(2)}/unit</Text>
                      </View>
                    );
                  })()}

                  <InputField
                    label="Quantity"
                    placeholder="Enter quantity"
                    value={itemQuantity}
                    onChangeText={(text) => {
                      console.log('Quantity changed:', text);
                      setItemQuantity(text);
                    }}
                    keyboardType="number-pad"
                    icon="layers"
                  />

                  {/* Live subtotal preview */}
                  {selectedProduct && itemQuantity && (() => {
                    const p = state.products.find(pr => pr.id === selectedProduct);
                    const qty = parseInt(itemQuantity) || 0;
                    const sub = qty * (p?.selling_price || 0);
                    if (!p || qty === 0) return null;
                    return (
                      <View style={s.subPreview}>
                        <Text style={s.subPreviewTxt}>
                          {qty} × ${(p.selling_price || 0).toFixed(2)} =
                        </Text>
                        <Text style={s.subPreviewVal}>${sub.toFixed(2)}</Text>
                      </View>
                    );
                  })()}

                  <TouchableOpacity
                    style={s.addItemBtn}
                    onPress={() => {
                      console.log('ADD BUTTON PHYSICALLY PRESSED');
                      addItem();
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={18} color="#fff" />
                    <Text style={s.addItemTxt}>Add to Invoice</Text>
                  </TouchableOpacity>
                </>
              )}
            </Block>
          </View>

          {/* ── Invoice Items List ── */}
          {items.length > 0 && (
            <View style={s.card}>
              <View style={s.itemsHeader}>
                <View style={s.itemsHeaderLeft}>
                  <View style={[bl.iconBox, { backgroundColor: C.green + '18' }]}>
                    <Ionicons name="receipt-outline" size={15} color={C.green} />
                  </View>
                  <Text style={bl.title}>Invoice Items</Text>
                </View>
                <View style={s.itemCountPill}>
                  <Text style={s.itemCountPillTxt}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
                </View>
              </View>

              {items.map((item, idx) => (
                <View key={item.id} style={[s.itemRow, idx === items.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={s.itemNum}>
                    <Text style={s.itemNumTxt}>{idx + 1}</Text>
                  </View>
                  <View style={s.itemBody}>
                    <Text style={s.itemName}>{item.productName}</Text>
                    <Text style={s.itemMeta}>
                      {item.quantity} × ${(item.unitPrice || 0).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={s.itemTotal}>${(item.total || 0).toFixed(2)}</Text>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={s.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color={C.red} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Totals */}
              <View style={s.totalsBox}>
                <View style={s.totalLine}>
                  <Text style={s.totalLineLbl}>Subtotal</Text>
                  <Text style={s.totalLineVal}>${total.toFixed(2)}</Text>
                </View>
                <View style={s.totalLine}>
                  <Text style={s.totalLineLbl}>Tax (0%)</Text>
                  <Text style={s.totalLineVal}>$0.00</Text>
                </View>
                <View style={[s.totalLine, s.grandLine]}>
                  <View>
                    <Text style={s.grandLbl}>Total</Text>
                    <Text style={s.grandSub}>{items.length} item{items.length > 1 ? 's' : ''} · {selectedPM.name}</Text>
                  </View>
                  <Text style={s.grandVal}>${total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Buttons ── */}
          <View style={s.btnGroup}>
            <TouchableOpacity
              style={[s.createBtn, loading && { opacity: 0.7 }]}
              onPress={handleCreateInvoice}
              disabled={loading}
              activeOpacity={0.85}
            >
              <View style={s.createBtnInner}>
                <View style={s.createBtnIcon}>
                  {loading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="checkmark-circle" size={22} color="#fff" />}
                </View>
                <View>
                  <Text style={s.createBtnTitle}>{loading ? 'Creating Invoice…' : 'Create Invoice'}</Text>
                  {!loading && items.length > 0 && (
                    <Text style={s.createBtnSub}>${total.toFixed(2)} · {items.length} item{items.length > 1 ? 's' : ''}</Text>
                  )}
                </View>
              </View>
              {!loading && <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => {
                console.log('Cancel button pressed');
                navigation.goBack();
              }}
              activeOpacity={0.8}
            >
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
    backgroundColor: 'rgba(99,102,241,0.18)', top: -60, right: -40,
  },
  hBlob2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(5,150,105,0.12)', bottom: -30, left: 20,
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
  itemCountBadge: {
    backgroundColor: C.primary2,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  itemCountTxt: { fontSize: 12, color: '#fff', fontWeight: '700' },
  progressWrap: { gap: 8 },
  progressTrack: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.primary2, borderRadius: 10 },
  progressTxt:  { fontSize: 11, color: '#a5b4fc', fontWeight: '500' },

  // ── Scroll
  scrollContent: { padding: 14, paddingBottom: 40 },

  // ── Warning Card
  warnCard: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: C.amber + '40',
    marginBottom: 12,
  },
  warnIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.amber + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  warnTitle: { fontSize: 13, fontWeight: '800', color: C.amber, marginBottom: 3 },
  warnSub:   { fontSize: 12, color: C.amber, marginBottom: 5 },
  warnItem:  { fontSize: 11, color: C.amber + 'cc', marginTop: 2 },

  // ── Card
  card: {
    backgroundColor: C.card, borderRadius: 20,
    padding: 16, marginBottom: 12,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  divider: { height: 1, backgroundColor: '#f0f2f8', marginVertical: 16 },

  // ── Product Preview
  productPreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#eff6ff', borderRadius: 11, padding: 11,
    borderWidth: 1, borderColor: C.blue + '25', marginBottom: 10,
  },
  productPreviewLeft: { flex: 1 },
  productPreviewName:  { fontSize: 13, fontWeight: '700', color: C.text },
  productPreviewStock: { fontSize: 11, color: C.textMute, marginTop: 2 },
  productPreviewPrice: { fontSize: 14, fontWeight: '800', color: C.blue },

  // ── Subtotal Preview
  subPreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: C.green + '30', marginBottom: 10,
  },
  subPreviewTxt: { fontSize: 13, color: C.textMid, fontWeight: '500' },
  subPreviewVal: { fontSize: 16, fontWeight: '800', color: C.green },

  // ── Add Item Button
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.blue,
    paddingVertical: 13, borderRadius: 14,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
    marginTop: 4,
  },
  addItemTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // ── Items List
  itemsHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  itemsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemCountPill: {
    backgroundColor: C.green + '18',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  itemCountPillTxt: { fontSize: 11, color: C.green, fontWeight: '700' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#f0f2f8',
  },
  itemNum: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  itemNumTxt:  { fontSize: 11, fontWeight: '800', color: C.textMid },
  itemBody:    { flex: 1 },
  itemName:    { fontSize: 13, fontWeight: '700', color: C.text },
  itemMeta:    { fontSize: 12, color: C.textMute, marginTop: 2 },
  itemTotal:   { fontSize: 14, fontWeight: '800', color: C.green },
  removeBtn:   { padding: 2 },

  // ── Totals
  totalsBox: {
    marginTop: 14, backgroundColor: '#f8fafc',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  totalLine: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#e8ecf4',
  },
  totalLineLbl: { fontSize: 13, color: C.textMute, fontWeight: '500' },
  totalLineVal: { fontSize: 13, fontWeight: '600', color: C.textMid },
  grandLine: {
    borderBottomWidth: 0, paddingTop: 12, paddingBottom: 2,
    alignItems: 'center',
  },
  grandLbl: { fontSize: 15, fontWeight: '800', color: C.text },
  grandSub: { fontSize: 11, color: C.textMute, marginTop: 2 },
  grandVal: { fontSize: 26, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },

  // ── Empty Products
  emptyProducts: {
    alignItems: 'center', paddingVertical: 30, gap: 10,
    backgroundColor: '#f8fafc', borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  emptyProductsIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  emptyProductsTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  emptyProductsSub: { fontSize: 13, color: C.textMute, textAlign: 'center', paddingHorizontal: 20 },

  // ── Buttons
  btnGroup: { gap: 10, marginTop: 6 },
  createBtn: {
    backgroundColor: C.green, borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 14, elevation: 8,
  },
  createBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  createBtnIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  createBtnTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  createBtnSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  cancelBtn: {
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center',
  },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
});

export default CreateInvoiceScreen;