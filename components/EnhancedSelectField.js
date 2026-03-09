import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

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

// ─── Type config ──────────────────────────────────────────────
const TYPE_CONFIG = {
  category: { icon: 'pricetag',    color: C.primary, label: 'Category' },
  supplier: { icon: 'business',    color: C.blue,    label: 'Supplier' },
  product:  { icon: 'cube',        color: C.amber,   label: 'Product'  },
};

const EnhancedSelectField = ({
  label,
  placeholder,
  value,
  items,
  onSelect,
  error,
  type = 'category',
  onAddItem,
  categories,
  suppliers,
}) => {
  const [modalVisible,        setModalVisible]        = useState(false);
  const [showAddForm,         setShowAddForm]          = useState(false);
  const [newItemName,         setNewItemName]          = useState('');
  const [selectedCategoryId,  setSelectedCategoryId]  = useState(null);
  const [selectedSupplierId,  setSelectedSupplierId]  = useState(null);
  const [showCategoryPicker,  setShowCategoryPicker]  = useState(false);
  const [showSupplierPicker,  setShowSupplierPicker]  = useState(false);
  const [loading,             setLoading]             = useState(false);
  const [search,              setSearch]              = useState('');

  const tc = TYPE_CONFIG[type] || TYPE_CONFIG.category;

  const getSelectedLabel = () => {
    if (!value) return null;
    const selected = items.find((item) => item.id === value);
    return selected?.name || null;
  };

  const selectedLabel = getSelectedLabel();

  const filteredItems = search
    ? items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleAddNewItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', `Please enter ${type} name`);
      return;
    }
    if (type === 'product' && !selectedCategoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (type === 'product' && !selectedSupplierId) {
      Alert.alert('Error', 'Please select a supplier');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let tableName, dataToInsert;

      if (type === 'category') {
        tableName    = 'categories';
        dataToInsert = { user_id: user.id, name: newItemName.trim() };
      } else if (type === 'supplier') {
        tableName    = 'suppliers';
        dataToInsert = { user_id: user.id, name: newItemName.trim(), phone: '', email: '', address: '' };
      } else if (type === 'product') {
        tableName    = 'products';
        dataToInsert = {
          user_id: user.id, name: newItemName.trim(), sku: newItemName.trim(),
          category_id: selectedCategoryId, cost_price: 0, selling_price: 0,
          quantity: 0, low_stock_alert: 0, supplier_id: selectedSupplierId,
          expiry_date: null, status: 'out-of-stock',
        };
      } else {
        throw new Error(`Unsupported type: ${type}`);
      }

      const { data, error } = await supabase.from(tableName).insert([dataToInsert]).select().single();
      if (error) throw error;

      if (onAddItem) onAddItem(data);
      onSelect(data.id);

      setNewItemName('');
      setSelectedCategoryId(null);
      setSelectedSupplierId(null);
      setShowAddForm(false);
      setShowCategoryPicker(false);
      setShowSupplierPicker(false);
      setModalVisible(false);
      setSearch('');

      Alert.alert('Success', `${type} added successfully`);
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      Alert.alert('Error', error.message || `Failed to add ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setShowAddForm(false);
    setNewItemName('');
    setSearch('');
    setSelectedCategoryId(null);
    setSelectedSupplierId(null);
    setShowCategoryPicker(false);
    setShowSupplierPicker(false);
  };

  // ── Mini inline picker (for category/supplier inside add-product form) ──
  const InlinePicker = ({ data, selectedId, onPick, onBack }) => (
    <View style={ip.wrap}>
      <View style={ip.header}>
        <TouchableOpacity style={ip.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={16} color={C.textMid} />
        </TouchableOpacity>
        <Text style={ip.headerTxt}>Select one</Text>
      </View>
      <FlatList
        data={data || []}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled
        nestedScrollEnabled
        style={{ maxHeight: 180 }}
        renderItem={({ item }) => {
          const active = selectedId === item.id;
          return (
            <TouchableOpacity
              style={[ip.row, active && ip.rowActive]}
              onPress={() => onPick(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[ip.rowTxt, active && { color: C.green, fontWeight: '700' }]}>
                {item.name}
              </Text>
              {active && <Ionicons name="checkmark-circle" size={18} color={C.green} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const ip = StyleSheet.create({
    wrap:   { borderRadius: 12, borderWidth: 1.5, borderColor: C.border, marginBottom: 14, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn:{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
    headerTxt: { fontSize: 12, fontWeight: '700', color: C.textMid },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f0f2f8' },
    rowActive: { backgroundColor: '#f0fdf4' },
    rowTxt: { fontSize: 13, color: C.textMid, fontWeight: '500', flex: 1 },
  });

  return (
    <View style={s.container}>
      {label && <Text style={s.label}>{label}</Text>}

      {/* ── Trigger Button ── */}
      <TouchableOpacity
        style={[s.trigger, error && s.triggerError, selectedLabel && s.triggerFilled]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.82}
      >
        <View style={[s.triggerIcon, { backgroundColor: tc.color + '15' }]}>
          <Ionicons name={tc.icon} size={15} color={selectedLabel ? tc.color : C.textMute} />
        </View>
        <Text style={[s.triggerTxt, !selectedLabel && s.triggerPlaceholder]} numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        {selectedLabel && (
          <View style={[s.selectedDot, { backgroundColor: tc.color }]} />
        )}
        <Ionicons name="chevron-down" size={16} color={selectedLabel ? C.textMid : C.textMute} />
      </TouchableOpacity>

      {error && (
        <View style={s.errorRow}>
          <Ionicons name="alert-circle" size={12} color={C.red} />
          <Text style={s.errorTxt}>{error}</Text>
        </View>
      )}

      {/* ══════════ MODAL ══════════ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={m.overlay}>
          {/* Tap outside to close */}
          <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={closeModal} />

          <View style={m.sheet}>
            {/* ── Sheet Handle ── */}
            <View style={m.handle} />

            {/* ── Header ── */}
            <View style={m.header}>
              <View style={m.headerLeft}>
                <View style={[m.headerIcon, { backgroundColor: tc.color + '18' }]}>
                  <Ionicons name={showAddForm ? 'add' : tc.icon} size={16} color={tc.color} />
                </View>
                <View>
                  <Text style={m.headerTitle}>
                    {showAddForm ? `Add New ${tc.label}` : `Select ${tc.label}`}
                  </Text>
                  {!showAddForm && items.length > 0 && (
                    <Text style={m.headerSub}>{items.length} option{items.length > 1 ? 's' : ''} available</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={m.closeBtn} onPress={closeModal} activeOpacity={0.8}>
                <Ionicons name="close" size={17} color={C.textMid} />
              </TouchableOpacity>
            </View>

            {/* ══ ADD FORM ══ */}
            {showAddForm ? (
              <View style={m.formBody}>

                {/* Category picker for product */}
                {type === 'product' && (
                  <View style={m.formGroup}>
                    <Text style={m.formLabel}>
                      <Ionicons name="pricetag" size={12} color={C.textMid} />{'  '}Category
                    </Text>
                    {showCategoryPicker ? (
                      <InlinePicker
                        data={categories}
                        selectedId={selectedCategoryId}
                        onPick={(id) => { setSelectedCategoryId(id); setShowCategoryPicker(false); }}
                        onBack={() => setShowCategoryPicker(false)}
                      />
                    ) : (
                      <TouchableOpacity
                        style={[m.miniSelect, selectedCategoryId && m.miniSelectFilled]}
                        onPress={() => setShowCategoryPicker(true)}
                        activeOpacity={0.85}
                      >
                        <Text style={[m.miniSelectTxt, !selectedCategoryId && { color: C.textMute }]}>
                          {selectedCategoryId
                            ? categories?.find(c => c.id === selectedCategoryId)?.name || 'Select Category'
                            : 'Tap to select category'}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={C.textMute} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Supplier picker for product */}
                {type === 'product' && (
                  <View style={m.formGroup}>
                    <Text style={m.formLabel}>
                      <Ionicons name="business" size={12} color={C.textMid} />{'  '}Supplier
                    </Text>
                    {showSupplierPicker ? (
                      <InlinePicker
                        data={suppliers}
                        selectedId={selectedSupplierId}
                        onPick={(id) => { setSelectedSupplierId(id); setShowSupplierPicker(false); }}
                        onBack={() => setShowSupplierPicker(false)}
                      />
                    ) : (
                      <TouchableOpacity
                        style={[m.miniSelect, selectedSupplierId && m.miniSelectFilled]}
                        onPress={() => setShowSupplierPicker(true)}
                        activeOpacity={0.85}
                      >
                        <Text style={[m.miniSelectTxt, !selectedSupplierId && { color: C.textMute }]}>
                          {selectedSupplierId
                            ? suppliers?.find(s => s.id === selectedSupplierId)?.name || 'Select Supplier'
                            : 'Tap to select supplier'}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={C.textMute} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Name input */}
                <View style={m.formGroup}>
                  <Text style={m.formLabel}>
                    <Ionicons name="text" size={12} color={C.textMid} />{'  '}{tc.label} Name
                  </Text>
                  <View style={m.inputWrap}>
                    <Ionicons name={tc.icon} size={16} color={newItemName ? tc.color : C.textMute} style={{ marginLeft: 12 }} />
                    <TextInput
                      style={m.input}
                      placeholder={`Type ${type} name…`}
                      value={newItemName}
                      onChangeText={setNewItemName}
                      editable={!loading}
                      placeholderTextColor={C.textMute}
                      autoFocus
                    />
                    {newItemName.length > 0 && (
                      <TouchableOpacity onPress={() => setNewItemName('')} style={{ marginRight: 10 }}>
                        <Ionicons name="close-circle" size={16} color={C.textMute} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Form Buttons */}
                <View style={m.formBtns}>
                  <TouchableOpacity
                    style={m.formCancel}
                    onPress={() => {
                      setShowAddForm(false);
                      setNewItemName('');
                      setSelectedCategoryId(null);
                      setSelectedSupplierId(null);
                      setShowCategoryPicker(false);
                      setShowSupplierPicker(false);
                    }}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={m.formCancelTxt}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[m.formSubmit, { backgroundColor: tc.color }, loading && { opacity: 0.65 }]}
                    onPress={handleAddNewItem}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Ionicons name="add-circle" size={16} color="#fff" />}
                    <Text style={m.formSubmitTxt}>
                      {loading ? 'Saving…' : `Add ${tc.label}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

            ) : (
              /* ══ SELECT LIST ══ */
              <>
                {/* Search bar */}
                <View style={m.searchWrap}>
                  <Ionicons name="search" size={15} color={C.textMute} />
                  <TextInput
                    style={m.searchInput}
                    placeholder={`Search ${type}s…`}
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={C.textMute}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={16} color={C.textMute} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Items list */}
                {filteredItems.length === 0 ? (
                  <View style={m.emptyWrap}>
                    <View style={m.emptyIcon}>
                      <Ionicons name={tc.icon} size={26} color={C.border} />
                    </View>
                    <Text style={m.emptyTxt}>
                      {search ? 'No results found' : `No ${type}s yet`}
                    </Text>
                    {!search && type !== 'product' && (
                      <Text style={m.emptySub}>Tap "Add New" below to create one</Text>
                    )}
                  </View>
                ) : (
                  <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled
                    contentContainerStyle={m.listContent}
                    renderItem={({ item }) => {
                      const active = value === item.id;
                      return (
                        <TouchableOpacity
                          style={[m.listRow, active && m.listRowActive]}
                          onPress={() => { onSelect(item.id); closeModal(); }}
                          activeOpacity={0.82}
                        >
                          <View style={[m.listRowIcon, { backgroundColor: active ? tc.color + '18' : '#f1f5f9' }]}>
                            <Ionicons name={tc.icon} size={14} color={active ? tc.color : C.textMute} />
                          </View>
                          <Text style={[m.listRowTxt, active && { color: C.text, fontWeight: '700' }]}>
                            {item.name}
                          </Text>
                          {active && (
                            <View style={[m.checkCircle, { backgroundColor: tc.color }]}>
                              <Ionicons name="checkmark" size={12} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}

                {/* Add New Button — only for category/supplier */}
                {type !== 'product' && (
                  <TouchableOpacity
                    style={[m.addNewBtn, { borderColor: tc.color + '40' }]}
                    onPress={() => setShowAddForm(true)}
                    activeOpacity={0.85}
                  >
                    <View style={[m.addNewIcon, { backgroundColor: tc.color + '18' }]}>
                      <Ionicons name="add" size={16} color={tc.color} />
                    </View>
                    <Text style={[m.addNewTxt, { color: tc.color }]}>
                      Add New {tc.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={tc.color + '80'} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Trigger Styles ───────────────────────────────────────────
const s = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 13, fontWeight: '700', color: '#374151',
    marginBottom: 7, letterSpacing: -0.1,
  },
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#e8ecf4',
    borderRadius: 13, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#fff',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  triggerFilled: { borderColor: '#c7d2fe', backgroundColor: '#fafbff' },
  triggerError:  { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  triggerIcon:   { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  triggerTxt:    { flex: 1, fontSize: 14, color: '#0d1117', fontWeight: '500' },
  triggerPlaceholder: { color: '#9ca3af', fontWeight: '400' },
  selectedDot:   { width: 6, height: 6, borderRadius: 3 },
  errorRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  errorTxt:      { color: '#dc2626', fontSize: 11, fontWeight: '600' },
});

// ─── Modal / Sheet Styles ─────────────────────────────────────
const m = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,14,23,0.5)',
  },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '82%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12, shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f2f8',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0d1117', letterSpacing: -0.3 },
  headerSub:   { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 14, marginBottom: 6,
    backgroundColor: '#f1f5f9', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#e8ecf4',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0d1117', fontWeight: '500', padding: 0 },

  // List
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 10, paddingVertical: 12,
    borderRadius: 12, marginBottom: 4,
    borderWidth: 1, borderColor: 'transparent',
  },
  listRowActive: {
    backgroundColor: '#fafbff',
    borderColor: '#c7d2fe',
  },
  listRowIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  listRowTxt: { flex: 1, fontSize: 14, color: '#4b5563', fontWeight: '500' },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center', paddingVertical: 32, gap: 10,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center',
  },
  emptyTxt:  { fontSize: 14, color: '#9ca3af', fontWeight: '600' },
  emptySub:  { fontSize: 12, color: '#d1d5db' },

  // Add New Button
  addNewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 8,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5,
    backgroundColor: '#fafbff',
  },
  addNewIcon: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  addNewTxt:  { flex: 1, fontSize: 14, fontWeight: '700' },

  // ── Add Form ──
  formBody: { padding: 20 },
  formGroup: { marginBottom: 14 },
  formLabel: {
    fontSize: 12, fontWeight: '700', color: '#374151',
    marginBottom: 8, letterSpacing: 0.2,
  },
  miniSelect: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#e8ecf4', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11,
    backgroundColor: '#f8fafc',
  },
  miniSelectFilled: { borderColor: '#c7d2fe', backgroundColor: '#fafbff' },
  miniSelectTxt:    { fontSize: 13, color: '#0d1117', fontWeight: '500', flex: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e8ecf4', borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  input: {
    flex: 1, fontSize: 14, color: '#0d1117',
    paddingHorizontal: 10, paddingVertical: 12,
    fontWeight: '500',
  },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  formCancel: {
    flex: 1, paddingVertical: 13, borderRadius: 13,
    borderWidth: 1.5, borderColor: '#e8ecf4',
    backgroundColor: '#f8fafc', alignItems: 'center',
  },
  formCancelTxt: { fontSize: 14, fontWeight: '700', color: '#4b5563' },
  formSubmit: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 13,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  formSubmitTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

export default EnhancedSelectField;