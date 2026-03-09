import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../../components/Common';
import { FEATURES, FEATURE_CATEGORIES, PERMISSION_LABELS } from '../../config/features';

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

// permission type → color/icon map
const PERM_META = {
  can_view:   { color: C.blue,   bg: '#eff6ff', icon: 'eye-outline'          },
  can_create: { color: C.green,  bg: '#f0fdf4', icon: 'add-circle-outline'   },
  can_update: { color: C.amber,  bg: '#fffbeb', icon: 'create-outline'       },
  can_delete: { color: C.red,    bg: '#fef2f2', icon: 'trash-outline'        },
};

// ─── Main Screen ──────────────────────────────────────────────
const EditStaffPermissionsScreen = ({ route, navigation }) => {
  const { staffId, staffName } = route.params;
  const [permissions, setPermissions]               = useState({});
  const [loading, setLoading]                       = useState(true);
  const [isSaving, setIsSaving]                     = useState(false);
  const [initialPermissions, setInitialPermissions] = useState({});
  const [expandedCategory, setExpandedCategory]     = useState(null);

  // ── Existing logic — untouched ─────────────────────────────
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const allPermissions = {};
      FEATURES.forEach((feature) => {
        allPermissions[feature.key] = {};
        feature.permissions.forEach((perm) => {
          allPermissions[feature.key][perm] = false;
        });
      });

      const { data, error } = await supabase.rpc('get_user_features', {
        p_user_id: staffId,
      });
      if (error) throw error;

      if (data && Array.isArray(data)) {
        data.forEach((perm) => {
          if (!allPermissions[perm.feature_key]) allPermissions[perm.feature_key] = {};
          allPermissions[perm.feature_key].can_view   = perm.can_view   || false;
          allPermissions[perm.feature_key].can_create = perm.can_create || false;
          allPermissions[perm.feature_key].can_update = perm.can_update || false;
          allPermissions[perm.feature_key].can_delete = perm.can_delete || false;
        });
      }

      setPermissions(allPermissions);
      setInitialPermissions(JSON.parse(JSON.stringify(allPermissions)));
      setExpandedCategory(Object.keys(FEATURE_CATEGORIES)[0]);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      Alert.alert('Error', 'Failed to fetch permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: `Permissions for ${staffName}` });
    fetchPermissions();
  }, [staffId, staffName]);

  const handlePermissionChange = (featureKey, action, value) => {
    setPermissions(prev => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], [action]: value },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    let successCount = 0;
    let totalUpdates = 0;

    for (const [featureKey, perms] of Object.entries(permissions)) {
      const initialPerms = initialPermissions[featureKey];
      const permChanged = JSON.stringify(perms) !== JSON.stringify(initialPerms);

      if (!permChanged) { successCount++; totalUpdates++; continue; }
      totalUpdates++;

      try {
        const { data, error } = await supabase.rpc('update_staff_permission', {
          p_user_id:    staffId,
          p_feature_key: featureKey,
          p_can_view:   perms.can_view   || false,
          p_can_create: perms.can_create || false,
          p_can_update: perms.can_update || false,
          p_can_delete: perms.can_delete || false,
        });
        if (!error) successCount++;
        else console.error(`Error updating ${featureKey}:`, error);
      } catch (error) {
        console.error(`Exception updating ${featureKey}:`, error);
      }
    }

    setIsSaving(false);
    if (successCount === totalUpdates) {
      Alert.alert('Success', 'All permissions updated successfully.');
      navigation.goBack();
    } else {
      Alert.alert('Partial Success', `${successCount} out of ${totalUpdates} permissions updated.`);
    }
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
          <Text style={s.loadingTitle}>Loading Permissions</Text>
          <Text style={s.loadingHint}>Fetching access settings…</Text>
        </View>
      </View>
    );
  }

  // ── Render helpers ─────────────────────────────────────────
  const renderPermissionToggle = (featureKey, permissionType) => {
    const isAvailable = FEATURES[featureKey]?.permissions.includes(permissionType);
    if (!isAvailable) return null;

    const meta    = PERM_META[permissionType] || { color: C.textMid, bg: C.bg, icon: 'toggle-outline' };
    const label   = PERMISSION_LABELS[permissionType]?.label || permissionType;
    const isOn    = permissions[featureKey]?.[permissionType] || false;

    return (
      <View key={permissionType} style={s.permToggle}>
        <View style={[s.permIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={15} color={meta.color} />
        </View>
        <Text style={s.permLabel}>{label}</Text>
        <Switch
          value={isOn}
          onValueChange={(value) => handlePermissionChange(featureKey, permissionType, value)}
          trackColor={{ false: C.border, true: meta.color + '55' }}
          thumbColor={isOn ? meta.color : '#fff'}
          ios_backgroundColor={C.border}
        />
      </View>
    );
  };

  const renderFeature = (feature) => (
    <View key={feature.key} style={s.featureCard}>
      {/* Feature header */}
      <View style={s.featureHeader}>
        <View style={[s.featureIconBox, { backgroundColor: '#eff6ff' }]}>
          <Ionicons name={feature.icon} size={18} color={C.blue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.featureName}>{feature.name}</Text>
          <Text style={s.featureDesc}>{feature.description}</Text>
        </View>
      </View>
      {/* Toggles */}
      <View style={s.permGrid}>
        {feature.permissions.map((perm) => renderPermissionToggle(feature.key, perm))}
      </View>
    </View>
  );

  const renderCategory = (categoryKey) => {
    const category   = FEATURE_CATEGORIES[categoryKey];
    const isExpanded = expandedCategory === categoryKey;

    return (
      <View key={categoryKey} style={s.categoryWrap}>
        <TouchableOpacity
          style={[s.categoryBtn, { borderLeftColor: category.color }]}
          onPress={() => setExpandedCategory(isExpanded ? null : categoryKey)}
          activeOpacity={0.8}
        >
          <View style={[s.categoryIconBox, { backgroundColor: category.color + '18' }]}>
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={category.color}
            />
          </View>
          <Text style={[s.categoryTitle, { color: category.color }]}>{category.name}</Text>
          <View style={[s.categoryBadge, { backgroundColor: category.color + '18' }]}>
            <Text style={[s.categoryBadgeTxt, { color: category.color }]}>
              {category.features.length} features
            </Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.categoryContent}>
            {category.features
              .map((fk) => FEATURES[fk])
              .filter(Boolean)
              .map((feature) => renderFeature(feature))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ──── Header ──── */}
      <View style={s.header}>
        <View style={s.hCircle1} />
        <View style={s.hCircle2} />
        <View style={s.hTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.hGreet}>Permissions 🔑</Text>
            <Text style={s.hSub} numberOfLines={1}>{staffName}</Text>
          </View>
          <View style={s.hAvatar}>
            <Ionicons name="shield-checkmark" size={18} color="#c7d2fe" />
          </View>
        </View>
        <View style={s.chips}>
          <View style={s.chip}>
            <Ionicons name="layers-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>{Object.keys(FEATURE_CATEGORIES).length} categories</Text>
          </View>
          <View style={s.chip}>
            <Ionicons name="person-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>Staff member</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ──── Info Banner ──── */}
        <View style={s.infoBanner}>
          <View style={s.infoIconBox}>
            <Ionicons name="information-circle" size={20} color={C.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.infoTitle}>Permission Info</Text>
            <Text style={s.infoText}>
              Toggle permissions to grant or restrict access. Users will only see features they have permission for.
            </Text>
          </View>
        </View>

        {/* ──── Categories ──── */}
        {Object.keys(FEATURE_CATEGORIES).map((categoryKey) => renderCategory(categoryKey))}

        {/* ──── Save Button ──── */}
        <TouchableOpacity
          style={[s.saveBtn, isSaving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <View style={s.saveBtnBlob} />
          {isSaving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="checkmark-circle" size={20} color="#fff" />}
          <Text style={s.saveBtnTxt}>
            {isSaving ? 'Saving…' : 'Save All Permissions'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Loading
  loadingWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
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
    paddingBottom: 24, paddingHorizontal: 20, overflow: 'hidden',
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
  scrollContent: { padding: 14 },

  // ── Info Banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 16, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#fde68a',
    borderLeftWidth: 4, borderLeftColor: C.amber,
  },
  infoIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fef3c7',
    alignItems: 'center', justifyContent: 'center',
  },
  infoTitle: { fontSize: 13.5, fontWeight: '800', color: C.text, marginBottom: 3 },
  infoText:  { fontSize: 12.5, color: C.textMid, lineHeight: 18, fontWeight: '500' },

  // ── Category
  categoryWrap: { marginBottom: 10 },
  categoryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card,
    borderRadius: 16, padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  categoryIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryTitle: { flex: 1, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  categoryBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  categoryBadgeTxt: { fontSize: 11, fontWeight: '700' },

  // ── Category expanded content
  categoryContent: {
    paddingTop: 8, paddingLeft: 4,
  },

  // ── Feature Card
  featureCard: {
    backgroundColor: C.card,
    borderRadius: 16, padding: 14, marginBottom: 8,
    borderLeftWidth: 3.5, borderLeftColor: C.blue,
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  featureHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  featureIconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  featureName: { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  featureDesc: { fontSize: 11.5, color: C.textMute, marginTop: 2, fontWeight: '500' },

  // ── Permission Grid
  permGrid: { gap: 6 },
  permToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fafbff', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  permIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  permLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: C.textMid },

  // ── Save Button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: C.primary,
    borderRadius: 18, paddingVertical: 16,
    marginTop: 20, overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  saveBtnBlob: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)', top: -40, right: -20,
  },
  saveBtnTxt:     { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  saveBtnDisabled:{ opacity: 0.6 },
});

export default EditStaffPermissionsScreen;