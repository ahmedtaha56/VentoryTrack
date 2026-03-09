import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { AuthContext } from '../../context/Authcontext';
import { InputField, Button } from '../../components/Common';
import { supabase } from '../../lib/supabase';
import { createCategory, updateCategory } from '../../lib/database';

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

// ─── Preview palette — user picks a color accent ──────────────
const ACCENTS = [
  { color: C.purple, bg: '#faf5ff', label: 'Violet'  },
  { color: C.blue,   bg: '#eff6ff', label: 'Blue'    },
  { color: C.cyan,   bg: '#ecfeff', label: 'Cyan'    },
  { color: C.green,  bg: '#f0fdf4', label: 'Green'   },
  { color: C.amber,  bg: '#fffbeb', label: 'Amber'   },
  { color: C.primary,bg: '#eef2ff', label: 'Indigo'  },
];

// ─── Main Screen ──────────────────────────────────────────────
const AddEditCategoryScreen = ({ route, navigation }) => {
  const { state, dispatch } = useContext(AppContext);
  const { userData }        = useContext(AuthContext);
  const categoryId          = route.params?.categoryId;
  const isEditing           = !!categoryId;

  const initialCategory = categoryId
    ? state.categories.find((c) => c.id === categoryId)
    : null;

  const [formData, setFormData] = useState({
    name:        initialCategory?.name        || '',
    description: initialCategory?.description || '',
  });
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [accentIdx, setAccentIdx]   = useState(0);

  const accent = ACCENTS[accentIdx];

  // ── Existing logic — all untouched ─────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Category name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const categoryData = {
        user_id:     user.id,
        name:        formData.name,
        description: formData.description || null,
      };

      if (isEditing) {
        const result = await updateCategory(supabase, categoryId, categoryData, userData.name);
        if (!result.success) throw new Error(result.error);
        dispatch({ type: 'UPDATE_CATEGORY', payload: { ...categoryData, id: categoryId } });
        Alert.alert('Success', 'Category updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        const result = await createCategory(supabase, categoryData, userData.name);
        if (!result.success) throw new Error(result.error);
        dispatch({ type: 'ADD_CATEGORY', payload: result.data });
        Alert.alert('Success', 'Category added', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const nameFilled = !!formData.name.trim();

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ──── Header ──── */}
      <View style={s.header}>
        <View style={s.hCircle1} />
        <View style={s.hCircle2} />
        <View style={s.hTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.hGreet}>
              {isEditing ? '✏️ Edit Category' : '🗂️ New Category'}
            </Text>
            <Text style={s.hSub}>
              {isEditing
                ? `Updating "${initialCategory?.name || 'category'}"`
                : 'Create a new product group'}
            </Text>
          </View>
          <View style={s.hAvatar}>
            <Ionicons name="folder-open" size={18} color="#c7d2fe" />
          </View>
        </View>
        <View style={s.chips}>
          <View style={s.chip}>
            <Ionicons
              name={nameFilled ? 'checkmark-circle-outline' : 'ellipse-outline'}
              size={12}
              color={nameFilled ? '#6ee7b7' : '#a5f3fc'}
            />
            <Text style={[s.chipTxt, nameFilled && { color: '#6ee7b7' }]}>
              {nameFilled ? 'Name set ✓' : 'Name required'}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ──── Live Preview Card ──── */}
          <View style={s.previewCard}>
            <View style={s.previewBlobTL} />
            <View style={s.previewBlobBR} />
            <Text style={s.previewLabel}>Preview</Text>
            <View style={s.previewInner}>
              <View style={[s.previewIconBox, { backgroundColor: accent.bg, borderColor: accent.color + '40' }]}>
                <Ionicons name="folder" size={28} color={accent.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.previewName, { color: accent.color }]}>
                  {formData.name || 'Category Name'}
                </Text>
                <Text style={s.previewDesc} numberOfLines={2}>
                  {formData.description || 'No description provided'}
                </Text>
              </View>
              <View style={[s.previewBadge, { backgroundColor: accent.bg }]}>
                <Text style={[s.previewBadgeTxt, { color: accent.color }]}>0</Text>
                <Text style={[s.previewBadgeLbl, { color: accent.color }]}>items</Text>
              </View>
            </View>
          </View>

          {/* ──── Accent Picker ──── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIconBox, { backgroundColor: '#ede9fe' }]}>
                <Ionicons name="color-palette-outline" size={16} color={C.purple} />
              </View>
              <View style={[s.sectionBar, { backgroundColor: C.purple }]} />
              <Text style={s.sectionTitle}>Accent Colour</Text>
            </View>
            <View style={s.accentGrid}>
              {ACCENTS.map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.accentDot,
                    { backgroundColor: a.color },
                    accentIdx === i && s.accentDotActive,
                  ]}
                  onPress={() => setAccentIdx(i)}
                  activeOpacity={0.8}
                >
                  {accentIdx === i && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.accentLabel}>{accent.label} selected</Text>
          </View>

          {/* ──── Form Fields ──── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIconBox, { backgroundColor: accent.bg }]}>
                <Ionicons name="create-outline" size={16} color={accent.color} />
              </View>
              <View style={[s.sectionBar, { backgroundColor: accent.color }]} />
              <Text style={s.sectionTitle}>Category Details</Text>
            </View>

            <View style={s.fieldsCard}>
              {/* Name */}
              <View style={s.fieldWrap}>
                <View style={s.labelRow}>
                  <View style={[s.fieldIconBox, {
                    backgroundColor: errors.name ? '#fef2f2' : nameFilled ? accent.bg : C.bg,
                  }]}>
                    <Ionicons
                      name="folder"
                      size={15}
                      color={errors.name ? C.red : nameFilled ? accent.color : C.textMute}
                    />
                  </View>
                  <Text style={s.fieldLabel}>
                    Category Name <Text style={s.required}>*</Text>
                  </Text>
                  {nameFilled && !errors.name && (
                    <Ionicons name="checkmark-circle" size={15} color={C.green} />
                  )}
                  {errors.name && (
                    <Ionicons name="alert-circle" size={15} color={C.red} />
                  )}
                </View>
                <InputField
                  placeholder="Enter category name"
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  error={errors.name}
                />
              </View>

              {/* Divider */}
              <View style={s.fieldDivider} />

              {/* Description */}
              <View style={[s.fieldWrap, { paddingBottom: 14 }]}>
                <View style={s.labelRow}>
                  <View style={[s.fieldIconBox, {
                    backgroundColor: formData.description.trim() ? accent.bg : C.bg,
                  }]}>
                    <Ionicons
                      name="document-text"
                      size={15}
                      color={formData.description.trim() ? accent.color : C.textMute}
                    />
                  </View>
                  <Text style={s.fieldLabel}>Description</Text>
                  <View style={s.optionalBadge}>
                    <Text style={s.optionalTxt}>Optional</Text>
                  </View>
                </View>
                <InputField
                  placeholder="Enter description (optional)"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* ──── Required note ──── */}
          <View style={s.requiredNote}>
            <Ionicons name="information-circle-outline" size={13} color={C.textMute} />
            <Text style={s.requiredNoteTxt}>Fields marked with * are required</Text>
          </View>

          {/* ──── Action Buttons ──── */}
          <View style={s.btnSection}>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: accent.color }, loading && s.btnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <View style={s.primaryBtnBlob} />
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name={isEditing ? 'checkmark-circle' : 'add-circle'} size={20} color="#fff" />}
              <Text style={s.primaryBtnTxt}>
                {loading
                  ? (isEditing ? 'Updating…' : 'Adding…')
                  : (isEditing ? 'Update Category' : 'Add Category')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color={C.textMid} />
              <Text style={s.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 22, paddingHorizontal: 20, overflow: 'hidden',
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
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  chipTxt: { fontSize: 12, color: '#e0e7ff', fontWeight: '600' },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 14 },

  // ── Preview Card
  previewCard: {
    backgroundColor: C.card, borderRadius: 22,
    padding: 18, marginBottom: 14, overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 14, elevation: 4,
    borderWidth: 1, borderColor: '#e0e7ff',
  },
  previewBlobTL: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#ede9fe', opacity: 0.35, top: -35, left: -25,
  },
  previewBlobBR: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#ddd6fe', opacity: 0.2, bottom: -20, right: -10,
  },
  previewLabel: {
    fontSize: 10.5, fontWeight: '800', color: C.primary2,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  previewInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  previewIconBox: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  previewName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  previewDesc: { fontSize: 12.5, color: C.textMute, fontWeight: '500', lineHeight: 17 },
  previewBadge: {
    alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 14,
  },
  previewBadgeTxt: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  previewBadgeLbl: { fontSize: 10, fontWeight: '700' },

  // ── Section
  section: { marginBottom: 14 },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  sectionIconBox: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionBar:   { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: C.textMid,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // ── Accent Picker
  accentGrid:     { flexDirection: 'row', gap: 10, marginBottom: 8 },
  accentDot: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  accentDotActive: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
    transform: [{ scale: 1.12 }],
  },
  accentLabel: { fontSize: 12, color: C.textMute, fontWeight: '600', marginTop: 2 },

  // ── Fields Card
  fieldsCard: {
    backgroundColor: C.card, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  fieldWrap:    { paddingTop: 14, paddingHorizontal: 14 },
  fieldDivider: { height: 1, backgroundColor: C.bg, marginHorizontal: 14 },
  labelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  fieldIconBox: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldLabel:  { flex: 1, fontSize: 13, fontWeight: '700', color: C.textMid },
  required:    { color: C.red },
  optionalBadge: {
    backgroundColor: C.bg,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  optionalTxt: { fontSize: 10.5, color: C.textMute, fontWeight: '600' },

  // ── Required note
  requiredNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 14, paddingHorizontal: 2,
  },
  requiredNoteTxt: { fontSize: 12, color: C.textMute, fontWeight: '500' },

  // ── Buttons
  btnSection:   { gap: 10, marginBottom: 6 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 18, paddingVertical: 16, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  primaryBtnBlob: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)', top: -40, right: -20,
  },
  primaryBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.card,
    borderRadius: 18, paddingVertical: 14,
    borderWidth: 1, borderColor: C.border,
  },
  cancelBtnTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },
  btnDisabled:  { opacity: 0.6 },
});

export default AddEditCategoryScreen;