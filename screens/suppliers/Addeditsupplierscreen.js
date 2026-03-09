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
import { createSupplier, updateSupplier } from '../../lib/database';

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

// ─── Field groups with metadata ───────────────────────────────
const FIELD_SECTIONS = [
  {
    title: 'Basic Information',
    icon: 'business-outline',
    color: C.blue,
    fields: [
      { key: 'name',  label: 'Supplier Name',  placeholder: 'Enter supplier name',    icon: 'business',      required: true, keyboard: 'default' },
      { key: 'email', label: 'Email Address',  placeholder: 'Enter email address',    icon: 'mail',          required: true, keyboard: 'email-address' },
      { key: 'phone', label: 'Phone Number',   placeholder: 'Enter phone number',     icon: 'call',          required: true, keyboard: 'phone-pad' },
    ],
  },
  {
    title: 'Location',
    icon: 'location-outline',
    color: C.green,
    fields: [
      { key: 'address', label: 'Address',  placeholder: 'Enter street address', icon: 'location', multiline: true, numberOfLines: 2, keyboard: 'default' },
      { key: 'city',    label: 'City',     placeholder: 'Enter city',           icon: 'pin',       keyboard: 'default' },
      { key: 'country', label: 'Country',  placeholder: 'Enter country',        icon: 'globe',     keyboard: 'default' },
    ],
  },
];

// ─── Main Screen ──────────────────────────────────────────────
const AddEditSupplierScreen = ({ route, navigation }) => {
  const { state, dispatch } = useContext(AppContext);
  const { userData }        = useContext(AuthContext);
  const supplierId          = route.params?.supplierId;
  const isEditing           = !!supplierId;

  const initialSupplier = supplierId
    ? state.suppliers.find((s) => s.id === supplierId)
    : null;

  const [formData, setFormData] = useState({
    name:    initialSupplier?.name    || '',
    email:   initialSupplier?.email   || '',
    phone:   initialSupplier?.phone   || '',
    address: initialSupplier?.address || '',
    city:    initialSupplier?.city    || '',
    country: initialSupplier?.country || '',
  });

  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  // ── Existing logic — all untouched ─────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name)  newErrors.name  = 'Supplier name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.email) newErrors.email = 'Email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const supplierData = {
        user_id: user.id,
        name:    formData.name,
        email:   formData.email,
        phone:   formData.phone,
        address: formData.address || null,
        city:    formData.city    || null,
        country: formData.country || null,
      };

      if (isEditing) {
        const result = await updateSupplier(supabase, supplierId, supplierData, userData.name);
        if (!result.success) throw new Error(result.error);
        dispatch({ type: 'UPDATE_SUPPLIER', payload: { ...supplierData, id: supplierId } });
        Alert.alert('Success', 'Supplier updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        const result = await createSupplier(supabase, supplierData, userData.name);
        if (!result.success) throw new Error(result.error);
        dispatch({ type: 'ADD_SUPPLIER', payload: result.data });
        Alert.alert('Success', 'Supplier added', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      Alert.alert('Error', error.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  // Count filled required fields for progress indicator
  const requiredFields  = ['name', 'email', 'phone'];
  const filledRequired  = requiredFields.filter(k => formData[k]?.trim()).length;
  const progressPct     = (filledRequired / requiredFields.length) * 100;

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
              {isEditing ? '✏️ Edit Supplier' : '➕ New Supplier'}
            </Text>
            <Text style={s.hSub}>
              {isEditing
                ? `Updating ${initialSupplier?.name || 'supplier'}`
                : 'Fill in the details below'}
            </Text>
          </View>
          <View style={s.hAvatar}>
            <Ionicons name="business" size={18} color="#c7d2fe" />
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={s.progressTxt}>
            {filledRequired}/{requiredFields.length} required fields
          </Text>
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
          {/* ──── Field Sections ──── */}
          {FIELD_SECTIONS.map((section) => (
            <View key={section.title} style={s.section}>
              {/* Section header */}
              <View style={s.sectionHead}>
                <View style={[s.sectionIconBox, { backgroundColor: section.color + '18' }]}>
                  <Ionicons name={section.icon} size={16} color={section.color} />
                </View>
                <View style={[s.sectionBar, { backgroundColor: section.color }]} />
                <Text style={s.sectionTitle}>{section.title}</Text>
              </View>

              {/* Fields card */}
              <View style={s.fieldsCard}>
                {section.fields.map((field, idx) => {
                  const isRequired = !!field.required;
                  const hasError   = !!errors[field.key];
                  const isFilled   = !!formData[field.key]?.trim();

                  return (
                    <View
                      key={field.key}
                      style={[
                        s.fieldWrap,
                        idx < section.fields.length - 1 && s.fieldBorder,
                      ]}
                    >
                      {/* Label row */}
                      <View style={s.labelRow}>
                        <View style={[s.fieldIconBox, {
                          backgroundColor: hasError
                            ? '#fef2f2'
                            : isFilled ? section.color + '15' : C.bg,
                        }]}>
                          <Ionicons
                            name={field.icon}
                            size={15}
                            color={hasError ? C.red : isFilled ? section.color : C.textMute}
                          />
                        </View>
                        <Text style={s.fieldLabel}>
                          {field.label}
                          {isRequired && <Text style={s.required}> *</Text>}
                        </Text>
                        {isFilled && !hasError && (
                          <View style={s.filledBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={C.green} />
                          </View>
                        )}
                        {hasError && (
                          <View style={s.errorBadge}>
                            <Ionicons name="alert-circle" size={14} color={C.red} />
                          </View>
                        )}
                      </View>

                      {/* Input */}
                      <InputField
                        placeholder={field.placeholder}
                        value={formData[field.key]}
                        onChangeText={(text) => {
                          setFormData({ ...formData, [field.key]: text });
                          if (errors[field.key]) setErrors({ ...errors, [field.key]: null });
                        }}
                        keyboardType={field.keyboard || 'default'}
                        multiline={field.multiline}
                        numberOfLines={field.numberOfLines}
                        error={errors[field.key]}
                        style={s.inputOverride}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          {/* ──── Required note ──── */}
          <View style={s.requiredNote}>
            <Ionicons name="information-circle-outline" size={14} color={C.textMute} />
            <Text style={s.requiredNoteTxt}>Fields marked with * are required</Text>
          </View>

          {/* ──── Action Buttons ──── */}
          <View style={s.btnSection}>
            <TouchableOpacity
              style={[s.primaryBtn, loading && s.btnDisabled]}
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
                  : (isEditing ? 'Update Supplier' : 'Add Supplier')}
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
    alignItems: 'center', marginBottom: 18,
  },
  hGreet: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  hSub:   { fontSize: 13, color: '#a5b4fc', marginTop: 3 },
  hAvatar: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Progress
  progressWrap: { gap: 6 },
  progressTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: C.primary2,
  },
  progressTxt: { fontSize: 11.5, color: '#a5b4fc', fontWeight: '600' },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 14 },

  // ── Section
  section: { marginBottom: 16 },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 10,
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

  // ── Fields Card
  fieldsCard: {
    backgroundColor: C.card, borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  fieldWrap: {
    paddingTop: 14, paddingHorizontal: 14, paddingBottom: 4,
  },
  fieldBorder: {
    borderBottomWidth: 1, borderBottomColor: C.bg,
  },

  // ── Label Row
  labelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 6,
  },
  fieldIconBox: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldLabel: {
    flex: 1, fontSize: 13, fontWeight: '700', color: C.textMid,
  },
  required: { color: C.red },
  filledBadge: { marginLeft: 4 },
  errorBadge:  { marginLeft: 4 },
  inputOverride: { marginTop: 0, marginBottom: 0 },

  // ── Required note
  requiredNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 14, paddingHorizontal: 2,
  },
  requiredNoteTxt: { fontSize: 12, color: C.textMute, fontWeight: '500' },

  // ── Buttons
  btnSection: { gap: 10, marginBottom: 6 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: C.primary,
    borderRadius: 18, paddingVertical: 16,
    overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  primaryBtnBlob: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)', top: -40, right: -20,
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

export default AddEditSupplierScreen;