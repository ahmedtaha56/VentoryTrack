import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { AuthContext } from '../../context/Authcontext';
import { SearchBar, ListItem, FAB, EmptyState, AccessDenied } from '../../components/Common';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';
import { subscribeToCategories, deleteCategory } from '../../lib/database';

// ─── Design Tokens (identical to Dashboard) ───────────────────
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

// ─── Palette for category cards ───────────────────────────────
const PALETTES = [
  { color: C.purple, bg: '#faf5ff', icon: 'folder' },
  { color: C.blue,   bg: '#eff6ff', icon: 'folder-open' },
  { color: C.cyan,   bg: '#ecfeff', icon: 'folder' },
  { color: C.green,  bg: '#f0fdf4', icon: 'folder-open' },
  { color: C.amber,  bg: '#fffbeb', icon: 'folder' },
  { color: C.primary,bg: '#eef2ff', icon: 'folder-open' },
];

// ─── Category Card ─────────────────────────────────────────────
const CategoryCard = ({ item, index, productCount, onEdit, onDelete }) => {
  const pal = PALETTES[index % PALETTES.length];

  return (
    <TouchableOpacity style={s.card} onPress={onEdit} activeOpacity={0.8}>
      {/* Colored left accent */}
      <View style={[s.cardAccent, { backgroundColor: pal.color }]} />

      <View style={s.cardInner}>
        <View style={s.cardTop}>
          {/* Icon box */}
          <View style={[s.cardIconBox, { backgroundColor: pal.bg, borderColor: pal.color + '30' }]}>
            <Ionicons name={pal.icon} size={24} color={pal.color} />
          </View>

          {/* Info */}
          <View style={s.cardInfo}>
            <Text style={s.cardName}>{item.name}</Text>
            {item.description ? (
              <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
            ) : (
              <Text style={s.cardDescEmpty}>No description</Text>
            )}
          </View>

          {/* Product count badge */}
          <View style={[s.countBadge, { backgroundColor: pal.bg, borderColor: pal.color + '40' }]}>
            <Ionicons name="cube-outline" size={12} color={pal.color} />
            <Text style={[s.countTxt, { color: pal.color }]}>{productCount}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={s.cardDivider} />

        {/* Actions */}
        <View style={s.cardActions}>
          <View style={[s.productChip, { backgroundColor: pal.bg }]}>
            <Ionicons name="layers-outline" size={12} color={pal.color} />
            <Text style={[s.productChipTxt, { color: pal.color }]}>
              {productCount} {productCount === 1 ? 'product' : 'products'}
            </Text>
          </View>
          <View style={s.actionBtns}>
            <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={14} color={C.primary} />
              <Text style={s.editBtnTxt}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={14} color={C.red} />
              <Text style={s.deleteBtnTxt}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────
const CategoryListScreen = ({ navigation }) => {
  const { state, dispatch }                        = useContext(AppContext);
  const { userData }                               = useContext(AuthContext);
  const { hasFeatureAccess, getFeaturePermissions } = usePermissions();
  const { canDelete }                              = getFeaturePermissions('categories');
  const [search, setSearch]                        = useState('');
  const [loading, setLoading]                      = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingId, setDeletingId]                = useState(null);
  const [isDeleting, setIsDeleting]                = useState(false);
  const unsubscribeRef                             = useRef(null);

  // ── Existing permission check — untouched ─────────────────
  const hasCategoriesAccess = hasFeatureAccess('categories');
  if (!hasCategoriesAccess) return <AccessDenied featureName="Categories" />;

  // ── Existing logic — all untouched ─────────────────────────
  useEffect(() => {
    loadCategories();
    unsubscribeRef.current = subscribeToCategories(supabase, (payload) => {
      console.log('📡 Category change detected, reloading...');
      loadCategories();
    });
    return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      dispatch({ type: 'SET_CATEGORIES', payload: data || [] });
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = state.categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (categoryId) => {
    console.log('🗑️ Delete category pressed:', categoryId);
    if (!canDelete) {
      Alert.alert('Access Denied', 'You do not have permission to delete categories');
      return;
    }
    setDeletingId(categoryId);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const categoryToDelete = state.categories.find(c => c.id === deletingId);
      if (!categoryToDelete) throw new Error('Category not found');
      const result = await deleteCategory(supabase, deletingId, categoryToDelete.name, userData.name);
      if (!result.success) throw new Error(result.error);
      console.log('✅ Category deleted successfully');
      dispatch({ type: 'DELETE_CATEGORY', payload: deletingId });
      setDeleteModalVisible(false);
      setDeletingId(null);
      Alert.alert('Success', 'Category deleted successfully');
    } catch (error) {
      console.error('🔥 Error deleting category:', error);
      Alert.alert('Error', error.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setDeletingId(null);
  };

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.loadingBox}>
          <View style={s.loadingSpinner}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
          <Text style={s.loadingTitle}>Loading Categories</Text>
          <Text style={s.loadingHint}>Fetching your category list…</Text>
        </View>
      </View>
    );
  }

  const deletingCategory = state.categories.find(c => c.id === deletingId);
  const totalProducts    = state.categories.reduce((sum, cat) =>
    sum + state.products.filter(p => p.category_id === cat.id).length, 0
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ──── Header ──── */}
      <View style={s.header}>
        <View style={s.hCircle1} />
        <View style={s.hCircle2} />
        <View style={s.hTop}>
          <View>
            <Text style={s.hGreet}>Categories 🗂️</Text>
            <Text style={s.hSub}>Organise your product catalog</Text>
          </View>
          <View style={s.hAvatar}>
            <Ionicons name="folder-open" size={18} color="#c7d2fe" />
          </View>
        </View>

        {/* Stats chips */}
        <View style={s.chips}>
          <View style={s.chip}>
            <Ionicons name="folder-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>{state.categories.length} categories</Text>
          </View>
          <View style={s.chip}>
            <Ionicons name="cube-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>{totalProducts} products tagged</Text>
          </View>
          {filteredCategories.length !== state.categories.length && (
            <View style={s.chip}>
              <Ionicons name="search-outline" size={12} color="#a5f3fc" />
              <Text style={s.chipTxt}>{filteredCategories.length} results</Text>
            </View>
          )}
        </View>
      </View>

      {/* ──── Search ──── */}
      <View style={s.searchWrap}>
        <SearchBar
          placeholder="Search categories…"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ──── List ──── */}
      {filteredCategories.length > 0 ? (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <CategoryCard
              item={item}
              index={index}
              productCount={state.products.filter(p => p.category_id === item.id).length}
              onEdit={() => navigation.navigate('AddEditCategory', { categoryId: item.id })}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconBox}>
            <Ionicons name="folder-outline" size={32} color={C.textMute} />
          </View>
          <Text style={s.emptyTitle}>
            {search ? 'No results found' : 'No Categories Yet'}
          </Text>
          <Text style={s.emptySub}>
            {search
              ? 'Try a different search term'
              : 'Create your first category to organise products'}
          </Text>
          {!search && (
            <TouchableOpacity
              style={s.emptyAction}
              onPress={() => navigation.navigate('AddEditCategory')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={16} color="#fff" />
              <Text style={s.emptyActionTxt}>Add Category</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FAB icon="add" onPress={() => navigation.navigate('AddEditCategory')} />

      {/* ──── Delete Modal ──── */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalBlob} />

            <View style={s.modalIconBox}>
              <Ionicons name="trash" size={28} color={C.red} />
            </View>

            <Text style={s.modalTitle}>Delete Category</Text>

            {deletingCategory && (
              <View style={s.modalNamePill}>
                <Ionicons name="folder-outline" size={13} color={C.textMid} />
                <Text style={s.modalNameTxt}>{deletingCategory.name}</Text>
              </View>
            )}

            <Text style={s.modalMsg}>
              Are you sure you want to delete this category? This action cannot be undone.
            </Text>

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={handleCancelDelete}
                disabled={isDeleting}
              >
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalDeleteBtn, isDeleting && s.btnDisabled]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
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

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Loading
  loadingWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg,
  },
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
    paddingBottom: 20, paddingHorizontal: 20, overflow: 'hidden',
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
  chips:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  chipTxt: { fontSize: 12, color: '#e0e7ff', fontWeight: '600' },

  // ── Search
  searchWrap: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },

  // ── List
  listContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 100 },

  // ── Category Card
  card: {
    backgroundColor: C.card,
    borderRadius: 20, marginBottom: 10,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: C.border,
  },
  cardAccent: { width: 4 },
  cardInner:  { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12,
  },
  cardIconBox: {
    width: 48, height: 48, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  cardInfo:       { flex: 1 },
  cardName:       { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2, marginBottom: 4 },
  cardDesc:       { fontSize: 12.5, color: C.textMid, lineHeight: 17, fontWeight: '500' },
  cardDescEmpty:  { fontSize: 12, color: C.textMute, fontStyle: 'italic' },
  countBadge: {
    flexDirection: 'column', alignItems: 'center', gap: 2,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 14, borderWidth: 1,
    minWidth: 44,
  },
  countTxt:   { fontSize: 13, fontWeight: '800' },

  // ── Card bottom row
  cardDivider: { height: 1, backgroundColor: C.bg, marginBottom: 10 },
  cardActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  productChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
  },
  productChipTxt: { fontSize: 11.5, fontWeight: '700' },
  actionBtns:     { flexDirection: 'row', gap: 8 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  editBtnTxt:   { fontSize: 12.5, fontWeight: '700', color: C.primary },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  deleteBtnTxt: { fontSize: 12.5, fontWeight: '700', color: C.red },

  // ── Empty State
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 10,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, marginBottom: 4,
  },
  emptyTitle:     { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  emptySub:       { fontSize: 13, color: C.textMute, fontWeight: '500', textAlign: 'center' },
  emptyAction: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14, marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  emptyActionTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // ── Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,12,51,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: C.card, borderRadius: 28,
    padding: 28, width: '100%', alignItems: 'center',
    overflow: 'hidden',
    shadowColor: C.navy, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  modalBlob: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#fee2e2', opacity: 0.35, top: -55, right: -30,
  },
  modalIconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  modalTitle: {
    fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.4, marginBottom: 10,
  },
  modalNamePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.bg,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  modalNameTxt: { fontSize: 13, fontWeight: '700', color: C.textMid },
  modalMsg: {
    fontSize: 14, color: C.textMid, textAlign: 'center',
    lineHeight: 20, marginBottom: 24, fontWeight: '500',
  },
  modalBtns:      { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.bg, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  modalCancelTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },
  modalDeleteBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.red, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 7,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalDeleteTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
  btnDisabled:    { opacity: 0.6 },
});

export default CategoryListScreen;