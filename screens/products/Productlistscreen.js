import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { SearchBar, ListItem, FAB, Badge, EmptyState } from '../../components/Common';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import { AuthContext } from '../../context/Authcontext';
import { subscribeToProducts, deleteProduct } from '../../lib/database';

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
  red:      '#dc2626',
};

const ProductListScreen = ({ navigation, route }) => {
  const { state, dispatch }        = useContext(AppContext);
  const { user, userData }         = useContext(AuthContext);
  const { getFeaturePermissions }  = usePermissions();
  const { canCreate, canUpdate, canDelete, canView } = getFeaturePermissions('products');

  const [search, setSearch]                     = useState('');
  const [refreshing, setRefreshing]             = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [activeFilter, setActiveFilter]         = useState(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deletingProductId, setDeletingProductId]     = useState(null);
  const [isDeleting, setIsDeleting]             = useState(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadProducts();
      unsubscribeRef.current = subscribeToProducts(supabase, (payload) => {
        console.log('📡 Product change detected, reloading...');
        loadProducts();
      });
    }
    return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
  }, [user]);

  useEffect(() => {
    if (route.params?.filter) setActiveFilter(route.params.filter);
  }, [route.params?.filter]);

  const loadProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      dispatch({ type: 'SET_PRODUCTS', payload: data || [] });
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let products = state.products;
    if (activeFilter === 'low_stock')
      products = products.filter(p => p.quantity <= (p.low_stock_alert || 5));
    if (search)
      products = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()),
      );
    return products;
  }, [state.products, search, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleDelete = (productId) => {
    console.log('🗑️ Delete button pressed for product:', productId);
    console.log('🔐 canDelete permission:', canDelete);
    if (!canDelete) {
      console.log('❌ No delete permission');
      Alert.alert('Access Denied', 'You do not have permission to delete products');
      return;
    }
    console.log('✅ Permission granted, showing delete confirmation dialog');
    setDeletingProductId(productId);
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProductId) return;
    setIsDeleting(true);
    try {
      const productToDelete = state.products.find(p => p.id === deletingProductId);
      if (!productToDelete) throw new Error('Product not found');
      console.log('🗑️ Deleting product:', productToDelete.name);
      const result = await deleteProduct(supabase, deletingProductId, productToDelete.name, userData.name);
      if (!result.success) throw new Error(result.error);
      console.log('✅ Product deleted successfully and notifications sent');
      dispatch({ type: 'DELETE_PRODUCT', payload: deletingProductId });
      dispatch({ type: 'INVALIDATE_DATA' });
      await loadProducts();
      setDeleteDialogVisible(false);
      setDeletingProductId(null);
      Alert.alert('Success', 'Product deleted successfully and team notified');
    } catch (error) {
      console.error('🔥 Error deleting product:', error);
      Alert.alert('Error', error.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('❌ Delete cancelled');
    setDeleteDialogVisible(false);
    setDeletingProductId(null);
  };

  const clearFilter = () => {
    setActiveFilter(null);
    navigation.setParams({ filter: null });
  };

  // ── Stock status helper ───────────────────────────────────
  const getStockInfo = (item) => {
    if (item.quantity <= 0)
      return { color: C.red, bg: '#fef2f2', label: 'Out of Stock', variant: 'danger' };
    if (item.quantity <= item.low_stock_alert)
      return { color: C.amber, bg: '#fffbeb', label: 'Low Stock', variant: 'warning' };
    return { color: C.green, bg: '#f0fdf4', label: 'In Stock', variant: 'success' };
  };

  // ── Product Card ──────────────────────────────────────────
  const renderProduct = ({ item }) => {
    const supplier   = state.suppliers.find(s => s.id === item.supplier_id);
    const supplierName = supplier?.name || 'N/A';
    const stock      = getStockInfo(item);

    return (
      <TouchableOpacity
        style={s.productCard}
        onPress={() => {
          if (!canView) {
            Alert.alert('Access Denied', 'You do not have permission to view product details.');
            return;
          }
          navigation.navigate('ProductDetail', { productId: item.id });
        }}
        activeOpacity={0.82}
      >
        {/* left accent bar */}
        <View style={[s.cardAccent, { backgroundColor: stock.color }]} />

        <View style={s.cardBody}>
          {/* top row */}
          <View style={s.cardTop}>
            <View style={[s.cardIconBox, { backgroundColor: stock.bg }]}>
              <Ionicons name="cube" size={18} color={stock.color} />
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.cardSku}>SKU: {item.sku}</Text>
            </View>
            <Text style={s.cardPrice}>${(item.selling_price || 0).toFixed(2)}</Text>
          </View>

          {/* bottom row */}
          <View style={s.cardBottom}>
            <View style={[s.stockBadge, { backgroundColor: stock.bg, borderColor: stock.color + '40' }]}>
              <View style={[s.stockDot, { backgroundColor: stock.color }]} />
              <Text style={[s.stockTxt, { color: stock.color }]}>
                {item.quantity} units · {stock.label}
              </Text>
            </View>
            <Text style={s.supplierTxt}>{supplierName}</Text>
          </View>

          {/* action icons */}
          {(canUpdate || canDelete) && (
            <View style={s.cardActions}>
              {canUpdate && (
                <TouchableOpacity
                  style={s.cardActionBtn}
                  onPress={() => navigation.navigate('AddEditProduct', { productId: item.id })}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="pencil-outline" size={15} color={C.primary2} />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  style={[s.cardActionBtn, { backgroundColor: '#fef2f2' }]}
                  onPress={() => handleDelete(item.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="trash-outline" size={15} color={C.red} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <View style={s.header}>
          <View style={s.hCircle} />
          <Text style={s.hTitle}>Products</Text>
        </View>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.hCircle} />
        <View style={s.hRow}>
          <View>
            <Text style={s.hTitle}>Products</Text>
            <Text style={s.hSub}>{state.products.length} total items</Text>
          </View>
          {canCreate && (
            <TouchableOpacity
              style={s.hAddBtn}
              onPress={() => navigation.navigate('AddEditProduct')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.hAddTxt}>Add New</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary chips */}
        <View style={s.hChips}>
          <View style={s.hChip}>
            <View style={[s.hChipDot, { backgroundColor: C.green }]} />
            <Text style={s.hChipTxt}>
              {state.products.filter(p => p.quantity > (p.low_stock_alert || 5)).length} In Stock
            </Text>
          </View>
          <View style={s.hChip}>
            <View style={[s.hChipDot, { backgroundColor: C.amber }]} />
            <Text style={s.hChipTxt}>
              {state.products.filter(p => p.quantity > 0 && p.quantity <= (p.low_stock_alert || 5)).length} Low
            </Text>
          </View>
          <View style={s.hChip}>
            <View style={[s.hChipDot, { backgroundColor: C.red }]} />
            <Text style={s.hChipTxt}>
              {state.products.filter(p => p.quantity <= 0).length} Out
            </Text>
          </View>
        </View>
      </View>

      {/* ── Search + Filter ── */}
      <View style={s.searchWrap}>
        <SearchBar
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
        />
        {activeFilter && (
          <TouchableOpacity style={s.filterChip} onPress={clearFilter} activeOpacity={0.8}>
            <Ionicons name="filter" size={12} color={C.primary2} />
            <Text style={s.filterTxt}>Low Stock</Text>
            <Ionicons name="close" size={13} color={C.primary2} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── List ── */}
      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          icon="cube-outline"
          title={activeFilter ? 'No Low Stock Products' : 'No Products Found'}
          message={search ? 'No products match your search' : 'Add your first product'}
          action={canCreate ? () => navigation.navigate('AddEditProduct') : undefined}
          actionTitle="Add Product"
        />
      )}

      {/* FAB hidden — we have Add button in header */}
      {canCreate && (
        <FAB
          icon="add"
          onPress={() => navigation.navigate('AddEditProduct')}
        />
      )}

      {/* ── Delete Modal ── */}
      <Modal
        visible={deleteDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            {/* icon */}
            <View style={s.modalIcon}>
              <Ionicons name="trash" size={26} color={C.red} />
            </View>
            <Text style={s.modalTitle}>Delete Product?</Text>
            <Text style={s.modalMsg}>
              This action cannot be undone. The product will be permanently removed and your team will be notified.
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalCancel}
                onPress={handleCancelDelete}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalDelete, isDeleting && { opacity: 0.7 }]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                activeOpacity={0.85}
              >
                {isDeleting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="trash-outline" size={15} color="#fff" />}
                <Text style={s.modalDeleteTxt}>
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 18,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  hCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(99,102,241,0.14)', top: -70, right: -50,
  },
  hRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  hTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  hSub:   { fontSize: 12, color: '#a5b4fc', marginTop: 3 },
  hAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primary2,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6,
    elevation: 4,
  },
  hAddTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  hChips: { flexDirection: 'row', gap: 8 },
  hChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  hChipDot:  { width: 6, height: 6, borderRadius: 3 },
  hChipTxt:  { fontSize: 12, color: '#e0e7ff', fontWeight: '600' },

  // ── Search
  searchWrap: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginTop: 8,
    backgroundColor: C.primary + '12',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: C.primary2 + '40',
  },
  filterTxt: { fontSize: 12, color: C.primary2, fontWeight: '700' },

  // ── List
  listContent: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 100 },

  // ── Product Card
  productCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 13 },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 10,
  },
  cardIconBox: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo:  { flex: 1 },
  cardName:  { fontSize: 14, fontWeight: '700', color: C.text },
  cardSku:   { fontSize: 12, color: C.textMute, marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '800', color: C.blue },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  stockDot: { width: 5, height: 5, borderRadius: 3 },
  stockTxt:  { fontSize: 11, fontWeight: '700' },
  supplierTxt: { fontSize: 11, color: C.textMute, fontWeight: '500' },
  cardActions: {
    flexDirection: 'row', gap: 8, justifyContent: 'flex-end',
    marginTop: 10, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#f0f2f8',
  },
  cardActionBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#f5f3ff',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Delete Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(15,14,23,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    backgroundColor: C.card,
    borderRadius: 24, padding: 24,
    marginHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 30,
    elevation: 20,
  },
  modalIcon: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '800', color: C.text,
    marginBottom: 8, letterSpacing: -0.3,
  },
  modalMsg: {
    fontSize: 13.5, color: C.textMid, textAlign: 'center',
    lineHeight: 20, marginBottom: 22,
  },
  modalBtns:      { flexDirection: 'row', gap: 10, width: '100%' },
  modalCancel: {
    flex: 1, paddingVertical: 13,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', backgroundColor: '#f8fafc',
  },
  modalCancelTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },
  modalDelete: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 14,
    backgroundColor: C.red,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 4,
  },
  modalDeleteTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default ProductListScreen;