import React, { useContext, useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { AuthContext } from '../../context/Authcontext';
import { InputField, Button, SelectField } from '../../components/Common';
import EnhancedSelectField from '../../components/EnhancedSelectField';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import { createProduct, updateProduct } from '../../lib/database';

// ─── Design Tokens (same as Dashboard) ───────────────────────
const C = {
  primary: '#4f46e5',
  primary2: '#6366f1',
  navy: '#1e1b4b',
  bg: '#f0f2f8',
  card: '#ffffff',
  border: '#e8ecf4',
  text: '#0d1117',
  textMid: '#4b5563',
  textMute: '#9ca3af',
  blue: '#2563eb',
  green: '#059669',
  amber: '#d97706',
  red: '#dc2626',
  purple: '#7c3aed',
};

// ─── Section Card ─────────────────────────────────────────────
const FormSection = ({ title, icon, color = C.primary, children }) => (
  <View style={fs.section}>
    <View style={fs.sectionHead}>
      <View style={[fs.sectionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={fs.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const fs = StyleSheet.create({
  section: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.2,
  },
});

const AddEditProductScreen = ({ route, navigation }) => {
  const { state, dispatch } = useContext(AppContext);
  const { userData } = useContext(AuthContext);
  const productId = route.params?.productId;
  const isEditing = !!productId;

  const { getFeaturePermissions } = usePermissions();
  const { canCreate, canUpdate } = getFeaturePermissions('products');

  useEffect(() => {
    if ((isEditing && !canUpdate) || (!isEditing && !canCreate)) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to ' + (isEditing ? 'edit' : 'add') + ' products.',
      );
      navigation.goBack();
    }
  }, [canCreate, canUpdate, isEditing]);

  const initialProduct = productId
    ? state.products.find((p) => p.id === productId)
    : null;

  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    sku: initialProduct?.sku || '',
    category_id: initialProduct?.category_id || null,
    cost_price: initialProduct?.cost_price?.toString() || '',
    selling_price: initialProduct?.selling_price?.toString() || '',
    quantity: initialProduct?.quantity?.toString() || '',
    low_stock_alert: initialProduct?.low_stock_alert?.toString() || '',
    supplier_id: initialProduct?.supplier_id || null,
    expiry_date: initialProduct?.expiry_date || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategoriesAndSuppliers = async () => {
      try {
        const { data: categories, error: catError } = await supabase
          .from('categories')
          .select('*');
        if (catError) throw catError;
        dispatch({ type: 'SET_CATEGORIES', payload: categories });

        const { data: suppliers, error: supError } = await supabase
          .from('suppliers')
          .select('*');
        if (supError) throw supError;
        dispatch({ type: 'SET_SUPPLIERS', payload: suppliers });
      } catch (error) {
        console.error('Error loading categories and suppliers:', error);
      }
    };
    loadCategoriesAndSuppliers();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Product name is required';
    if (!formData.sku) newErrors.sku = 'SKU is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.cost_price) newErrors.cost_price = 'Cost price is required';
    if (!formData.selling_price) newErrors.selling_price = 'Selling price is required';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    if (!formData.low_stock_alert) newErrors.low_stock_alert = 'Low stock alert is required';
    if (!formData.supplier_id) newErrors.supplier_id = 'Supplier is required';

    if (formData.cost_price && isNaN(parseFloat(formData.cost_price)))
      newErrors.cost_price = 'Cost price must be a number';
    if (formData.selling_price && isNaN(parseFloat(formData.selling_price)))
      newErrors.selling_price = 'Selling price must be a number';
    if (formData.quantity && isNaN(parseInt(formData.quantity)))
      newErrors.quantity = 'Quantity must be a number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const productData = {
        user_id: user.id,
        name: formData.name,
        sku: formData.sku,
        category_id: formData.category_id,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        quantity: parseInt(formData.quantity),
        low_stock_alert: parseInt(formData.low_stock_alert),
        supplier_id: formData.supplier_id,
        expiry_date: formData.expiry_date || null,
        status: parseInt(formData.quantity) <= 0 ? 'out-of-stock' : 'in-stock',
      };

      if (isEditing) {
        console.log('📝 Updating product:', formData.name);
        const result = await updateProduct(supabase, productId, productData, userData.name);
        if (!result.success) throw new Error(result.error);
        dispatch({ type: 'UPDATE_PRODUCT', payload: { ...productData, id: productId } });
        dispatch({ type: 'INVALIDATE_DATA' });
        console.log('✅ Product updated and notifications sent to team');
        Alert.alert('Success', 'Product updated successfully and team notified', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        console.log('➕ Creating new product:', formData.name);
        const result = await createProduct(supabase, productData, userData.name);
        if (!result.success) throw new Error(result.error);
        dispatch({ type: 'ADD_PRODUCT', payload: result.data });
        dispatch({ type: 'INVALIDATE_DATA' });
        console.log('✅ Product created and notifications sent to team');
        Alert.alert('Success', 'Product added successfully and team notified', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  // Profit preview
  const cost = parseFloat(formData.cost_price) || 0;
  const sell = parseFloat(formData.selling_price) || 0;
  const profit = sell - cost;
  const margin = cost > 0 ? ((profit / sell) * 100).toFixed(1) : null;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Mini Header ── */}
      <View style={s.header}>
        <View style={s.hCircle} />
        <View style={s.hTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#c7d2fe" />
          </TouchableOpacity>
          <View style={s.hTitles}>
            <Text style={s.hTitle}>{isEditing ? 'Edit Product' : 'New Product'}</Text>
            <Text style={s.hSub}>{isEditing ? 'Update product details' : 'Fill in product info'}</Text>
          </View>
          <View style={[s.hBadge, { backgroundColor: isEditing ? C.amber + '30' : C.green + '30' }]}>
            <Ionicons
              name={isEditing ? 'pencil' : 'add'}
              size={14}
              color={isEditing ? '#fde68a' : '#6ee7b7'}
            />
          </View>
        </View>

        {/* Profit preview pill */}
        {(cost > 0 || sell > 0) && (
          <View style={s.profitPill}>
            <Ionicons
              name={profit >= 0 ? 'trending-up' : 'trending-down'}
              size={12}
              color={profit >= 0 ? '#6ee7b7' : '#fca5a5'}
            />
            <Text style={[s.profitTxt, { color: profit >= 0 ? '#6ee7b7' : '#fca5a5' }]}>
              {profit >= 0 ? '+' : ''}${profit.toFixed(2)} profit
              {margin !== null ? ` · ${margin}% margin` : ''}
            </Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Basic Info ── */}
          <FormSection title="Basic Information" icon="cube-outline" color={C.blue}>
            <InputField
              label="Product Name"
              placeholder="Enter product name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              error={errors.name}
              icon="cube"
            />
            <InputField
              label="SKU / Barcode"
              placeholder="Enter SKU or barcode"
              value={formData.sku}
              onChangeText={(text) => setFormData({ ...formData, sku: text })}
              error={errors.sku}
              icon="barcode"
            />
            <EnhancedSelectField
              label="Category"
              placeholder="Select category"
              value={formData.category_id}
              items={state.categories}
              onSelect={(id) => setFormData({ ...formData, category_id: id })}
              onAddItem={(newCat) => dispatch({ type: 'ADD_CATEGORY', payload: newCat })}
              error={errors.category_id}
              type="category"
            />
            <EnhancedSelectField
              label="Supplier"
              placeholder="Select supplier"
              value={formData.supplier_id}
              items={state.suppliers}
              onSelect={(id) => setFormData({ ...formData, supplier_id: id })}
              onAddItem={(newSup) => dispatch({ type: 'ADD_SUPPLIER', payload: newSup })}
              error={errors.supplier_id}
              type="supplier"
            />
          </FormSection>

          {/* ── Pricing ── */}
          <FormSection title="Pricing" icon="cash-outline" color={C.green}>
            <InputField
              label="Cost Price ($)"
              placeholder="0.00"
              value={formData.cost_price}
              onChangeText={(text) => setFormData({ ...formData, cost_price: text })}
              keyboardType="decimal-pad"
              error={errors.cost_price}
              icon="cash"
            />
            <InputField
              label="Selling Price ($)"
              placeholder="0.00"
              value={formData.selling_price}
              onChangeText={(text) => setFormData({ ...formData, selling_price: text })}
              keyboardType="decimal-pad"
              error={errors.selling_price}
              icon="cash"
            />

            {/* Inline profit preview */}
            {cost > 0 && sell > 0 && (
              <View style={[s.profitRow, { borderColor: profit >= 0 ? C.green + '40' : C.red + '40', backgroundColor: profit >= 0 ? '#f0fdf4' : '#fef2f2' }]}>
                <View style={s.profitItem}>
                  <Text style={s.profitLabel}>Profit / unit</Text>
                  <Text style={[s.profitVal, { color: profit >= 0 ? C.green : C.red }]}>
                    {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                  </Text>
                </View>
                <View style={s.profitDivider} />
                <View style={s.profitItem}>
                  <Text style={s.profitLabel}>Margin</Text>
                  <Text style={[s.profitVal, { color: profit >= 0 ? C.green : C.red }]}>
                    {margin}%
                  </Text>
                </View>
              </View>
            )}
          </FormSection>

          {/* ── Stock ── */}
          <FormSection title="Stock Management" icon="layers-outline" color={C.amber}>
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
              label="Low Stock Alert"
              placeholder="Alert when below this quantity"
              value={formData.low_stock_alert}
              onChangeText={(text) => setFormData({ ...formData, low_stock_alert: text })}
              keyboardType="number-pad"
              error={errors.low_stock_alert}
              icon="alert"
            />
            <InputField
              label="Expiry Date (Optional)"
              placeholder="YYYY-MM-DD"
              value={formData.expiry_date}
              onChangeText={(text) => setFormData({ ...formData, expiry_date: text })}
              icon="calendar"
            />
          </FormSection>

          {/* ── Buttons ── */}
          <View style={s.btnGroup}>
            <TouchableOpacity
              style={[s.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isEditing ? 'checkmark-circle' : 'add-circle'}
                size={18}
                color="#fff"
              />
              <Text style={s.saveBtnTxt}>
                {loading ? 'Saving…' : isEditing ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={s.cancelBtnTxt}>Cancel</Text>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  hCircle: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(99,102,241,0.15)', top: -60, right: -40,
  },
  hTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  hTitles: { flex: 1 },
  hTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  hSub: { fontSize: 12, color: '#a5b4fc', marginTop: 2 },
  hBadge: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  profitPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  profitTxt: { fontSize: 12, fontWeight: '700' },

  // ── Scroll
  scrollContent: { padding: 14, paddingBottom: 40 },

  // ── Profit preview inside pricing section
  profitRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  profitItem: { flex: 1, alignItems: 'center' },
  profitLabel: { fontSize: 11, color: C.textMute, fontWeight: '600', marginBottom: 3 },
  profitVal: { fontSize: 18, fontWeight: '800' },
  profitDivider: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 },

  // ── Buttons
  btnGroup: { gap: 10, marginTop: 6, marginBottom: 16 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10,
    elevation: 6,
  },
  saveBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  cancelBtn: {
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center',
  },
  cancelBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
});

export default AddEditProductScreen;