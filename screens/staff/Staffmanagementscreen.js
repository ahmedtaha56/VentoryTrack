import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Picker,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, Button, InputField, FAB, Card } from '../../components/Common';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';
import {
  fetchStaffUsers, createStaffUser, updateStaffRole,
  deleteStaffUser, subscribeToStaffChanges,
} from '../../lib/database';
import { ROLES, ROLE_DESCRIPTIONS } from '../../config/roles';
import { FEATURES, FEATURE_CATEGORIES, getAllFeatures } from '../../config/features';

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

// ─── Avatar initials helper ────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

// ─── Avatar colors by index ────────────────────────────────────
const AVATAR_COLORS = [C.blue, C.purple, C.cyan, C.green, C.amber];

// ─── Permission badge colors ───────────────────────────────────
const PERM_BADGE = {
  can_view:   { color: C.blue,   bg: '#eff6ff', label: 'View'   },
  can_create: { color: C.green,  bg: '#f0fdf4', label: 'Create' },
  can_update: { color: C.amber,  bg: '#fffbeb', label: 'Edit'   },
  can_delete: { color: C.red,    bg: '#fef2f2', label: 'Delete' },
};

// ─── Empty State ──────────────────────────────────────────────
const EmptyState = ({ icon, text, sub, iconColor = '#d1d5db' }) => (
  <View style={s.empty}>
    <View style={s.emptyIconBox}>
      <Ionicons name={icon} size={30} color={iconColor} />
    </View>
    <Text style={s.emptyTxt}>{text}</Text>
    {sub ? <Text style={s.emptySub}>{sub}</Text> : null}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────
const StaffManagementScreen = ({ navigation }) => {
  const { getFeaturePermissions } = usePermissions();
  const { canView, canCreate, canUpdate, canDelete } = getFeaturePermissions('staff');

  console.log('👤 Staff Management Permissions:', { canView, canCreate, canUpdate, canDelete });

  const [staff, setStaff]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [showAddModal, setShowAddModal]             = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedStaff, setSelectedStaff]           = useState(null);
  const [staffPermissions, setStaffPermissions]     = useState({});
  const [expandedCategory, setExpandedCategory]     = useState(null);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [showPermissionsViewModal, setShowPermissionsViewModal] = useState(false);
  const [isDeletingStaff, setIsDeletingStaff]       = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [staffToDelete, setStaffToDelete]           = useState(null);
  const unsubscribeRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: ROLES.STAFF,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Existing logic — all untouched ─────────────────────────
  const loadStaff = async () => {
    setLoading(true);
    const { success, data, error } = await fetchStaffUsers(supabase);
    if (success) setStaff(data);
    else Alert.alert('Error', error || 'Failed to fetch staff members.');
    setLoading(false);
  };

  useEffect(() => {
    if (!canView) return;
    console.log('🔌 Setting up staff real-time subscriptions...');
    unsubscribeRef.current = subscribeToStaffChanges(supabase, (changeType) => {
      console.log('📡 Staff change detected:', changeType);
      loadStaff();
    });
    return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
  }, [canView]);

  useFocusEffect(
    useCallback(() => { if (canView) loadStaff(); }, [canView])
  );

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setIsSubmitting(true);
    const result = await createStaffUser(supabase, {
      name: formData.name, email: formData.email,
      password: formData.password, role: formData.role,
    });
    if (result.success) {
      Alert.alert('Success', 'Staff member added successfully.');
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: ROLES.STAFF });
      loadStaff();
    } else {
      Alert.alert('Error', result.error || 'Failed to add staff member.');
    }
    setIsSubmitting(false);
  };

  const handleRoleChange = async (newRole) => {
    setIsSubmitting(true);
    const result = await updateStaffRole(supabase, selectedStaff.id, newRole);
    if (result.success) {
      Alert.alert('Success', `Role updated to ${ROLE_DESCRIPTIONS[newRole].label}`);
      loadStaff();
    } else {
      Alert.alert('Error', result.error || 'Failed to update role.');
    }
    setIsSubmitting(false);
  };

  const handleDeleteStaff = (staffMember) => {
    console.log('🗑️ handleDeleteStaff called for:', staffMember.name, 'ID:', staffMember.id);
    console.log('Delete permission - canDelete:', canDelete);
    if (!staffMember) { Alert.alert('Error', 'Invalid staff member'); return; }
    console.log('📋 Showing delete confirmation modal...');
    setStaffToDelete(staffMember);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    console.log('🗑️ User confirmed deletion');
    setShowDeleteConfirmModal(false);
    setIsDeletingStaff(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: currentUserData } = await supabase
        .from('users').select('name').eq('id', currentUser.id).single();
      console.log(`📤 Calling deleteStaffUser for ${staffToDelete.name} (${staffToDelete.id})`);
      const result = await deleteStaffUser(
        supabase, staffToDelete.id, staffToDelete.name, currentUserData?.name || 'Admin'
      );
      if (result.success) {
        console.log(`✅ Delete succeeded, reloading staff list...`);
        Alert.alert('Success', `${staffToDelete.name} has been deleted.`);
        setTimeout(() => { console.log(`🔄 Calling loadStaff() after deletion`); loadStaff(); }, 500);
      } else {
        console.error(`❌ Delete failed: ${result.error}`);
        Alert.alert('Error', result.error || 'Failed to delete staff member.');
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      Alert.alert('Error', 'An unexpected error occurred: ' + error.message);
    } finally {
      setIsDeletingStaff(false);
      setStaffToDelete(null);
    }
  };

  const cancelDelete = () => {
    console.log('✅ User clicked Cancel');
    setShowDeleteConfirmModal(false);
    setStaffToDelete(null);
  };

  const fetchStaffPermissions = async (staffId) => {
    try {
      const allPermissions = {};
      getAllFeatures().forEach((feature) => {
        allPermissions[feature.key] = {};
        feature.permissions.forEach((perm) => { allPermissions[feature.key][perm] = false; });
      });
      const { data, error } = await supabase.rpc('get_user_features', { p_user_id: staffId });
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
      setStaffPermissions(allPermissions);
      setExpandedCategory(Object.keys(FEATURE_CATEGORIES)[0]);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      Alert.alert('Error', 'Failed to load permissions');
    }
  };

  const openPermissionsModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowPermissionsModal(true);
    fetchStaffPermissions(staffMember.id);
  };

  const handlePermissionChange = (featureKey, action, value) => {
    setStaffPermissions(prev => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], [action]: value },
    }));
  };

  const savePermissions = async () => {
    setIsSavingPermissions(true);
    let successCount = 0, errorCount = 0;
    console.log('💾 Starting to save permissions for:', selectedStaff.name);
    console.log('📝 Permissions being saved:', staffPermissions);
    try {
      for (const [featureKey, perms] of Object.entries(staffPermissions)) {
        const cleanPerms = {
          can_view: perms.can_view || false, can_create: perms.can_create || false,
          can_update: perms.can_update || false, can_delete: perms.can_delete || false,
        };
        console.log(`🔄 Saving ${featureKey}:`, cleanPerms);
        const { error } = await supabase.rpc('update_staff_permission', {
          p_user_id: selectedStaff.id, p_feature_key: featureKey,
          p_can_view: cleanPerms.can_view, p_can_create: cleanPerms.can_create,
          p_can_update: cleanPerms.can_update, p_can_delete: cleanPerms.can_delete,
        });
        if (error) { console.error(`❌ Error updating ${featureKey}:`, error); errorCount++; }
        else { console.log(`✅ ${featureKey} saved successfully`); successCount++; }
      }
      console.log(`📊 Final count - Success: ${successCount}, Error: ${errorCount}`);
      if (errorCount === 0) {
        Alert.alert('Success', 'Permissions updated successfully');
        setShowPermissionsModal(false);
        loadStaff();
      } else {
        Alert.alert('Partial Success', `${successCount} updated, ${errorCount} failed`);
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      Alert.alert('Error', 'Failed to save permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const openRoleModal = (staffMember) => openPermissionsModal(staffMember);

  const openPermissionsViewModal = async (staffMember) => {
    setSelectedStaff(staffMember);
    console.log('🔍 Opening permissions for:', staffMember.name);
    try {
      const allPermissions = {};
      getAllFeatures().forEach((feature) => {
        allPermissions[feature.key] = {};
        feature.permissions.forEach((perm) => { allPermissions[feature.key][perm] = false; });
      });
      console.log('📋 Initial permissions structure:', allPermissions);
      const { data, error } = await supabase.rpc('get_user_features', { p_user_id: staffMember.id });
      console.log('📡 RPC Response - Data:', data);
      console.log('📡 RPC Response - Error:', error);
      if (!error && data && Array.isArray(data)) {
        console.log('✅ Data received! Rows:', data.length);
        data.forEach((perm) => {
          console.log(`   Feature: ${perm.feature_key} | View: ${perm.can_view} | Create: ${perm.can_create} | Update: ${perm.can_update} | Delete: ${perm.can_delete}`);
          if (!allPermissions[perm.feature_key]) allPermissions[perm.feature_key] = {};
          allPermissions[perm.feature_key].can_view   = perm.can_view   || false;
          allPermissions[perm.feature_key].can_create = perm.can_create || false;
          allPermissions[perm.feature_key].can_update = perm.can_update || false;
          allPermissions[perm.feature_key].can_delete = perm.can_delete || false;
        });
      } else { console.log('⚠️ No data returned or error occurred'); }
      console.log('📦 Final permissions to set:', allPermissions);
      setSelectedStaff(prev => ({ ...prev, permissions: allPermissions }));
    } catch (error) { console.error('❌ Error fetching permissions:', error); }
    setShowPermissionsViewModal(true);
  };

  // ── Not authorized ─────────────────────────────────────────
  if (!canView) {
    return (
      <View style={s.centered}>
        <View style={s.deniedCard}>
          <View style={s.deniedIconBox}>
            <Ionicons name="lock-closed" size={28} color={C.red} />
          </View>
          <Text style={s.deniedTitle}>Not Authorized</Text>
          <Text style={s.deniedSub}>
            You do not have permission to view this page. Please contact your administrator.
          </Text>
        </View>
      </View>
    );
  }

  const filteredStaff = staff.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Staff Card ─────────────────────────────────────────────
  const renderStaff = ({ item, index }) => {
    const roleDesc  = ROLE_DESCRIPTIONS[item.role];
    const initials  = getInitials(item.name || item.email);
    const avatarClr = AVATAR_COLORS[index % AVATAR_COLORS.length];

    const hasPermissions = item.permissions && Object.keys(item.permissions).some(
      key => item.permissions[key].can_view || item.permissions[key].can_create ||
             item.permissions[key].can_update || item.permissions[key].can_delete
    );

    return (
      <TouchableOpacity
        style={s.staffCard}
        onPress={() => openPermissionsViewModal(item)}
        activeOpacity={0.8}
      >
        {/* Left accent */}
        <View style={[s.cardAccent, { backgroundColor: avatarClr }]} />

        <View style={s.cardInner}>
          {/* Avatar + Info */}
          <View style={s.cardTop}>
            <View style={[s.avatar, { backgroundColor: avatarClr + '22', borderColor: avatarClr + '44' }]}>
              <Text style={[s.avatarText, { color: avatarClr }]}>{initials}</Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={s.staffName}>{item.name || item.email || 'Unknown'}</Text>
              <Text style={s.staffEmail}>{item.email}</Text>
              <View style={[s.rolePill, { backgroundColor: (roleDesc?.color || C.textMid) + '18' }]}>
                <View style={[s.roleDot, { backgroundColor: roleDesc?.color || C.textMid }]} />
                <Text style={[s.roleText, { color: roleDesc?.color || C.textMid }]}>
                  {roleDesc?.label || item.role}
                </Text>
              </View>
            </View>
          </View>

          {/* Permission tags */}
          {hasPermissions && (
            <View style={s.tagsWrap}>
              {Object.entries(item.permissions)
                .filter(([_, perms]) =>
                  perms.can_view || perms.can_create || perms.can_update || perms.can_delete
                )
                .slice(0, 4)
                .map(([featureKey]) => {
                  const feature = FEATURES[featureKey];
                  return (
                    <View key={featureKey} style={s.featureTag}>
                      <Text style={s.featureTagTxt}>{feature?.name || featureKey}</Text>
                    </View>
                  );
                })}
              {Object.entries(item.permissions).filter(([_, p]) =>
                p.can_view || p.can_create || p.can_update || p.can_delete
              ).length > 4 && (
                <View style={[s.featureTag, { backgroundColor: '#f0f2f8' }]}>
                  <Text style={[s.featureTagTxt, { color: C.textMid }]}>
                    +{Object.entries(item.permissions).filter(([_, p]) =>
                      p.can_view || p.can_create || p.can_update || p.can_delete
                    ).length - 4} more
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={s.cardActions}>
            {canUpdate && (
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => openPermissionsModal(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={15} color={C.primary} />
                <Text style={s.actionBtnTxt}>Permissions</Text>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                style={[s.actionBtn, s.deleteBtn]}
                onPress={() => {
                  console.log('🗑️ Delete button pressed for:', item.name);
                  handleDeleteStaff(item);
                }}
                disabled={isDeletingStaff}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={15} color={C.red} />
                <Text style={[s.actionBtnTxt, { color: C.red }]}>
                  {isDeletingStaff ? 'Deleting…' : 'Delete'}
                </Text>
              </TouchableOpacity>
            )}
            {!canDelete && console.log('❌ Delete button hidden - canDelete is false') && null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Modal: shared header pattern ───────────────────────────
  const ModalHeader = ({ title, onClose }) => (
    <View style={s.modalHeader}>
      <View style={s.modalHeaderBlob} />
      <Text style={s.modalTitle}>{title}</Text>
      <TouchableOpacity style={s.modalCloseBtn} onPress={onClose}>
        <Ionicons name="close" size={18} color={C.textMid} />
      </TouchableOpacity>
    </View>
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
            <Text style={s.hGreet}>Staff Management 👥</Text>
            <Text style={s.hSub}>Manage your team & permissions</Text>
          </View>
          <View style={s.hAvatar}>
            <Ionicons name="people" size={18} color="#c7d2fe" />
          </View>
        </View>
        <View style={s.chips}>
          <View style={s.chip}>
            <Ionicons name="people-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>{staff.length} members</Text>
          </View>
          {canCreate && (
            <View style={s.chip}>
              <Ionicons name="add-circle-outline" size={12} color="#a5f3fc" />
              <Text style={s.chipTxt}>Can add staff</Text>
            </View>
          )}
        </View>
      </View>

      {/* ──── Search ──── */}
      <View style={s.searchWrap}>
        <SearchBar
          placeholder="Search staff by name or email…"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ──── List ──── */}
      {loading ? (
        <View style={s.centered}>
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingTxt}>Loading staff…</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStaff}
          contentContainerStyle={s.listContent}
          onRefresh={loadStaff}
          refreshing={loading}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              text="No staff members found"
              sub="Add new staff to see them here."
            />
          }
        />
      )}

      {canCreate && <FAB icon="add" onPress={() => setShowAddModal(true)} />}

      {/* ════════════════════ MODALS ═══════════════════════════ */}

      {/* ── Add Staff Modal ── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <ModalHeader title="Add New Staff ✨" onClose={() => setShowAddModal(false)} />
            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              <InputField
                label="Full Name" placeholder="Enter name"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                icon="person"
              />
              <InputField
                label="Email" placeholder="Enter email"
                value={formData.email}
                onChangeText={(t) => setFormData({ ...formData, email: t })}
                keyboardType="email-address" icon="mail"
              />
              <InputField
                label="Password" placeholder="Enter temporary password"
                value={formData.password}
                onChangeText={(t) => setFormData({ ...formData, password: t })}
                icon="lock-closed" secureTextEntry
              />
              <View style={s.formGroup}>
                <Text style={s.formLabel}>Initial Role</Text>
                <View style={s.pickerWrap}>
                  <Picker
                    selectedValue={formData.role}
                    onValueChange={(role) => setFormData({ ...formData, role })}
                  >
                    <Picker.Item label={ROLE_DESCRIPTIONS[ROLES.STAFF].label} value={ROLES.STAFF} />
                  </Picker>
                </View>
              </View>
              <View style={s.modalBtns}>
                <TouchableOpacity
                  style={[s.primaryBtn, isSubmitting && s.btnDisabled]}
                  onPress={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="person-add" size={16} color="#fff" />}
                  <Text style={s.primaryBtnTxt}>
                    {isSubmitting ? 'Adding…' : 'Add Staff Member'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={s.secondaryBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── View Permissions Modal ── */}
      <Modal
        visible={showPermissionsViewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPermissionsViewModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <ModalHeader
              title={`${selectedStaff?.name}'s Access 🔍`}
              onClose={() => setShowPermissionsViewModal(false)}
            />
            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              {selectedStaff?.permissions ? (
                Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => {
                  const categoryFeatures = category.features
                    .map(fk => FEATURES[fk]).filter(Boolean);
                  const hasPerms = categoryFeatures.some(feature => {
                    const p = selectedStaff.permissions[feature.key];
                    return p && (p.can_view || p.can_create || p.can_update || p.can_delete);
                  });
                  if (!hasPerms) return null;

                  return (
                    <View key={categoryKey} style={s.viewCategoryBlock}>
                      <View style={[s.viewCategoryHeader, { borderLeftColor: category.color }]}>
                        <Text style={[s.viewCategoryTitle, { color: category.color }]}>{category.name}</Text>
                      </View>
                      {categoryFeatures.map((feature) => {
                        const p = selectedStaff.permissions[feature.key];
                        if (!p || (!p.can_view && !p.can_create && !p.can_update && !p.can_delete)) return null;
                        return (
                          <View key={feature.key} style={s.viewFeatureRow}>
                            <View style={[s.viewFeatureIcon, { backgroundColor: '#eff6ff' }]}>
                              <Ionicons name={feature.icon} size={14} color={C.blue} />
                            </View>
                            <Text style={s.viewFeatureName}>{feature.name}</Text>
                            <View style={s.permBadgesRow}>
                              {Object.entries(PERM_BADGE).map(([key, meta]) =>
                                p[key] ? (
                                  <View key={key} style={[s.permBadge, { backgroundColor: meta.bg }]}>
                                    <Text style={[s.permBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
                                  </View>
                                ) : null
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })
              ) : (
                <EmptyState icon="lock-closed-outline" text="No permissions assigned" />
              )}
              <TouchableOpacity style={s.secondaryBtn} onPress={() => setShowPermissionsViewModal(false)}>
                <Text style={s.secondaryBtnTxt}>Close</Text>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Edit Permissions Modal ── */}
      <Modal
        visible={showPermissionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPermissionsModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <ModalHeader
              title={`Permissions — ${selectedStaff?.name} 🔑`}
              onClose={() => setShowPermissionsModal(false)}
            />
            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => {
                const categoryFeatures = category.features.map(fk => FEATURES[fk]).filter(Boolean);
                const isExpanded = expandedCategory === categoryKey;
                return (
                  <View key={categoryKey} style={s.editCategoryBlock}>
                    <TouchableOpacity
                      style={[s.editCategoryBtn, { borderLeftColor: category.color }]}
                      onPress={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.editCategoryIcon, { backgroundColor: category.color + '18' }]}>
                        <Ionicons
                          name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                          size={15} color={category.color}
                        />
                      </View>
                      <Text style={[s.editCategoryTitle, { color: category.color }]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={s.editFeaturesWrap}>
                        {categoryFeatures.map((feature) => (
                          <View key={feature.key} style={s.editFeatureCard}>
                            <View style={s.editFeatureHeader}>
                              <View style={[s.editFeatureIcon, { backgroundColor: '#eff6ff' }]}>
                                <Ionicons name={feature.icon} size={15} color={C.blue} />
                              </View>
                              <Text style={s.editFeatureName}>{feature.name}</Text>
                            </View>
                            <View style={s.togglesGrid}>
                              {feature.permissions.map((perm) => {
                                const dbKey = `can_${perm}`;
                                const meta  = PERM_BADGE[dbKey] || { color: C.textMid, bg: C.bg, label: perm };
                                const isOn  = staffPermissions[feature.key]?.[dbKey] || false;
                                return (
                                  <View key={perm} style={s.toggleRow}>
                                    <View style={[s.toggleIcon, { backgroundColor: meta.bg }]}>
                                      <Ionicons
                                        name={
                                          perm === 'view'   ? 'eye-outline' :
                                          perm === 'create' ? 'add-circle-outline' :
                                          perm === 'update' ? 'create-outline' : 'trash-outline'
                                        }
                                        size={13} color={meta.color}
                                      />
                                    </View>
                                    <Text style={s.toggleLabel}>{meta.label}</Text>
                                    <Switch
                                      value={isOn}
                                      onValueChange={(value) => handlePermissionChange(feature.key, dbKey, value)}
                                      trackColor={{ false: C.border, true: meta.color + '55' }}
                                      thumbColor={isOn ? meta.color : '#fff'}
                                      ios_backgroundColor={C.border}
                                    />
                                  </View>
                                );
                              })}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}

              <View style={s.modalBtns}>
                <TouchableOpacity
                  style={[s.primaryBtn, isSavingPermissions && s.btnDisabled]}
                  onPress={savePermissions}
                  disabled={isSavingPermissions}
                >
                  {isSavingPermissions
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="checkmark-circle" size={16} color="#fff" />}
                  <Text style={s.primaryBtnTxt}>
                    {isSavingPermissions ? 'Saving…' : 'Save Permissions'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.secondaryBtn}
                  onPress={() => setShowPermissionsModal(false)}
                >
                  <Text style={s.secondaryBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={s.deleteOverlay}>
          <View style={s.deleteCard}>
            <View style={s.deleteCardBlob} />
            <View style={s.deleteIconBox}>
              <Ionicons name="trash" size={28} color={C.red} />
            </View>
            <Text style={s.deleteTitle}>Delete Staff Member</Text>
            <Text style={s.deleteMsg}>
              Are you sure you want to delete{' '}
              <Text style={{ fontWeight: '800', color: C.text }}>{staffToDelete?.name}</Text>?
            </Text>
            <Text style={s.deleteWarn}>⚠️ This action cannot be undone.</Text>
            <View style={s.deleteBtns}>
              <TouchableOpacity
                style={s.deleteCancelBtn}
                onPress={cancelDelete}
                disabled={isDeletingStaff}
              >
                <Text style={s.deleteCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.deleteConfirmBtn, isDeletingStaff && s.btnDisabled]}
                onPress={confirmDelete}
                disabled={isDeletingStaff}
              >
                {isDeletingStaff
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="trash-outline" size={15} color="#fff" />}
                <Text style={s.deleteConfirmTxt}>
                  {isDeletingStaff ? 'Deleting…' : 'Delete'}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingBox: { alignItems: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: C.textMute, fontWeight: '600' },

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
  chips: { flexDirection: 'row', gap: 8 },
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

  // ── Staff Card
  staffCard: {
    backgroundColor: C.card, borderRadius: 20, marginBottom: 10,
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', flexDirection: 'row',
  },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  cardTop:   { flexDirection: 'row', gap: 12, marginBottom: 10 },
  avatar: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  cardInfo:   { flex: 1, justifyContent: 'center' },
  staffName:  { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  staffEmail: { fontSize: 12, color: C.textMute, marginTop: 2, fontWeight: '500' },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 6, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  roleDot:  { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 11, fontWeight: '700' },

  // ── Feature tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  featureTag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  featureTagTxt: { fontSize: 11, color: C.purple, fontWeight: '700' },

  // ── Card Actions
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnTxt: { fontSize: 12.5, fontWeight: '700', color: C.primary },
  deleteBtn: { backgroundColor: '#fef2f2' },

  // ── Not authorized card
  deniedCard: {
    backgroundColor: C.card, borderRadius: 24, padding: 28,
    alignItems: 'center', margin: 20,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 14, elevation: 6,
  },
  deniedIconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  deniedTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  deniedSub: {
    fontSize: 13, color: C.textMid, textAlign: 'center', lineHeight: 20, fontWeight: '500',
  },

  // ── Empty State
  empty: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center',
  },
  emptyTxt: { fontSize: 15, color: C.textMid, fontWeight: '700' },
  emptySub: { fontSize: 13, color: C.textMute, fontWeight: '500' },

  // ── Modal Overlay
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,12,51,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '88%',
    shadowColor: C.navy, shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 14,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: C.bg,
    overflow: 'hidden',
  },
  modalHeaderBlob: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#ede9fe', opacity: 0.3, top: -30, left: -15,
  },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: 16 },

  // ── Form
  formGroup: { marginTop: 10 },
  formLabel: {
    fontSize: 13, fontWeight: '700', color: C.textMid,
    marginBottom: 8, marginLeft: 2,
  },
  pickerWrap: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    overflow: 'hidden', backgroundColor: '#fafbff',
  },

  // ── Modal Buttons
  modalBtns: { marginTop: 20, gap: 10 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary,
    borderRadius: 14, paddingVertical: 15,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  secondaryBtn: {
    alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.border,
  },
  secondaryBtnTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },
  btnDisabled: { opacity: 0.6 },

  // ── View Permissions Modal rows
  viewCategoryBlock: { marginBottom: 14 },
  viewCategoryHeader: {
    borderLeftWidth: 4, paddingLeft: 12, paddingVertical: 6, marginBottom: 8,
  },
  viewCategoryTitle: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  viewFeatureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: '#fafbff', borderRadius: 12, marginBottom: 6,
  },
  viewFeatureIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  viewFeatureName: { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },
  permBadgesRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  permBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  permBadgeTxt: { fontSize: 10.5, fontWeight: '700' },

  // ── Edit Permissions Modal
  editCategoryBlock: { marginBottom: 8 },
  editCategoryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fafbff', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    borderLeftWidth: 4,
  },
  editCategoryIcon: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  editCategoryTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  editFeaturesWrap:  { paddingTop: 6, paddingLeft: 4, gap: 6 },
  editFeatureCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 12,
    borderLeftWidth: 3, borderLeftColor: C.blue,
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  editFeatureHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  editFeatureIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  editFeatureName: { fontSize: 13.5, fontWeight: '800', color: C.text },
  togglesGrid: { gap: 5 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fafbff', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 10,
  },
  toggleIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: C.textMid },

  // ── Delete Modal
  deleteOverlay: {
    flex: 1, backgroundColor: 'rgba(15,12,51,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  deleteCard: {
    backgroundColor: C.card, borderRadius: 28,
    padding: 28, width: '100%', alignItems: 'center',
    overflow: 'hidden',
    shadowColor: C.navy, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  deleteCardBlob: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#fee2e2', opacity: 0.35, top: -55, right: -30,
  },
  deleteIconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  deleteTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8, letterSpacing: -0.3 },
  deleteMsg: { fontSize: 14, color: C.textMid, textAlign: 'center', marginBottom: 6, lineHeight: 20 },
  deleteWarn: { fontSize: 13, color: C.red, fontWeight: '700', marginBottom: 24 },
  deleteBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  deleteCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.bg, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  deleteCancelTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },
  deleteConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.red, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 7,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  deleteConfirmTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

export default StaffManagementScreen;