import React, { useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/Authcontext';
import { usePermissions } from '../hooks/usePermissions';

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

// ─── Menu Config ──────────────────────────────────────────────
const MENU_GROUPS = [
  {
    groupLabel: 'Management',
    groupIcon: 'grid-outline',
    items: [
      {
        title: 'Categories',
        subtitle: 'Manage product categories',
        icon: 'folder',
        navigateTo: 'Categories',
        feature: 'categories',
        color: C.purple,
        bg: '#faf5ff',
      },
      {
        title: 'Suppliers',
        subtitle: 'Manage suppliers',
        icon: 'business',
        navigateTo: 'Suppliers',
        feature: 'suppliers',
        color: C.blue,
        bg: '#eff6ff',
      },
      {
        title: 'Staff Management',
        subtitle: 'Manage users and permissions',
        icon: 'people',
        navigateTo: 'StaffManagement',
        feature: 'staff',
        color: C.cyan,
        bg: '#ecfeff',
      },
    ],
  },
  {
    groupLabel: 'Insights',
    groupIcon: 'pulse-outline',
    items: [
      {
        title: 'Reports',
        subtitle: 'View sales and stock reports',
        icon: 'analytics',
        navigateTo: 'Reports',
        feature: 'reports',
        color: C.green,
        bg: '#f0fdf4',
      },
      {
        title: 'Notifications',
        subtitle: 'View all alerts and messages',
        icon: 'notifications',
        navigateTo: 'Notifications',
        feature: 'notifications',
        color: C.amber,
        bg: '#fffbeb',
      },
    ],
  },
];

const SETTINGS_ITEM = {
  title: 'Settings',
  subtitle: 'App preferences and account',
  icon: 'settings',
  navigateTo: 'Settings',
  color: C.textMid,
  bg: '#f8fafc',
};

// ─── MenuItem Card ─────────────────────────────────────────────
const MenuItem = ({ item, onPress, isLast }) => (
  <TouchableOpacity
    style={[s.menuItem, !isLast && s.menuItemBorder]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    {/* Icon */}
    <View style={[s.menuIconBox, { backgroundColor: item.bg }]}>
      <Ionicons name={item.icon} size={20} color={item.color} />
    </View>

    {/* Text */}
    <View style={s.menuBody}>
      <Text style={s.menuTitle}>{item.title}</Text>
      <Text style={s.menuSub}>{item.subtitle}</Text>
    </View>

    {/* Chevron */}
    <View style={s.menuRight}>
      <Ionicons name="chevron-forward" size={16} color={C.border} />
    </View>

    {/* Accent line */}
    <View style={[s.menuAccent, { backgroundColor: item.color }]} />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────
const MoreMenuScreen = ({ navigation }) => {
  const { getFeaturePermissions } = usePermissions();
  const { user, refreshPermissionsManually } = useContext(AuthContext);
  const lastRefreshRef = useRef(0);

  // ── Existing logic — untouched ────────────────────────────────
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (user && refreshPermissionsManually && (now - lastRefreshRef.current > 1000)) {
        console.log('🔄 Refreshing permissions...');
        lastRefreshRef.current = now;
        refreshPermissionsManually(user.id);
      }
    }, [user, refreshPermissionsManually])
  );

  const isItemVisible = (feature) => {
    if (!feature) return true;
    const { canView } = getFeaturePermissions(feature);
    return canView;
  };

  // ── Total visible item count (for header chip) ────────────────
  const totalVisible = MENU_GROUPS
    .flatMap(g => g.items)
    .filter(i => isItemVisible(i.feature)).length + 1; // +1 for Settings

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ──── Header ──── */}
      <View style={s.header}>
        <View style={s.hCircle1} />
        <View style={s.hCircle2} />

        <View style={s.hTop}>
          <View>
            <Text style={s.hGreet}>More Options ✦</Text>
            <Text style={s.hSub}>Tools & settings for your workspace</Text>
          </View>
          <View style={s.hAvatar}>
            <Ionicons name="apps" size={18} color="#c7d2fe" />
          </View>
        </View>

        <View style={s.chips}>
          <View style={s.chip}>
            <Ionicons name="grid-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>{totalVisible} features</Text>
          </View>
          <View style={s.chip}>
            <Ionicons name="shield-checkmark-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>Permission-based access</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ──── Menu Groups ──── */}
        {MENU_GROUPS.map((group) => {
          const visibleItems = group.items.filter(i => isItemVisible(i.feature));
          if (visibleItems.length === 0) return null;

          return (
            <View key={group.groupLabel} style={s.groupWrap}>
              {/* Group Label */}
              <View style={s.groupHeader}>
                <Ionicons name={group.groupIcon} size={13} color={C.primary2} />
                <Text style={s.groupLabel}>{group.groupLabel}</Text>
              </View>

              {/* Cards */}
              <View style={s.section}>
                {visibleItems.map((item, idx) => (
                  <MenuItem
                    key={item.title}
                    item={item}
                    onPress={() => navigation.navigate(item.navigateTo)}
                    isLast={idx === visibleItems.length - 1}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {/* ──── Settings (always visible) ──── */}
        <View style={s.groupWrap}>
          <View style={s.groupHeader}>
            <Ionicons name="ellipsis-horizontal-circle-outline" size={13} color={C.primary2} />
            <Text style={s.groupLabel}>General</Text>
          </View>
          <View style={s.section}>
            <MenuItem
              item={SETTINGS_ITEM}
              onPress={() => navigation.navigate(SETTINGS_ITEM.navigateTo)}
              isLast
            />
          </View>
        </View>

        {/* ──── Footer decoration ──── */}
        <View style={s.footer}>
          <View style={s.footerLine} />
          <View style={s.footerBadge}>
            <Ionicons name="sparkles" size={12} color={C.primary2} />
            <Text style={s.footerTxt}>Powered by smart permissions</Text>
          </View>
          <View style={s.footerLine} />
        </View>
      </ScrollView>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
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

  // ── Chips
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  chipTxt: { fontSize: 12, color: '#e0e7ff', fontWeight: '600' },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 18, paddingBottom: 32 },

  // ── Group
  groupWrap:   { marginHorizontal: 14, marginBottom: 14 },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8, paddingHorizontal: 2,
  },
  groupLabel: {
    fontSize: 11.5, fontWeight: '800', color: C.primary2,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // ── Section card container
  section: {
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },

  // ── Menu Item row
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 13,
    overflow: 'hidden',
    position: 'relative',
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  menuIconBox: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  menuBody: { flex: 1 },
  menuTitle: {
    fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: -0.2,
  },
  menuSub: {
    fontSize: 12, color: C.textMute, marginTop: 2, fontWeight: '500',
  },
  menuRight: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  // Thin colored left-edge accent
  menuAccent: {
    position: 'absolute',
    left: 0, top: 10, bottom: 10,
    width: 3, borderRadius: 2,
    opacity: 0.55,
  },

  // ── Footer
  footer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginTop: 8, gap: 10,
  },
  footerLine:  { flex: 1, height: 1, backgroundColor: C.border },
  footerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
  },
  footerTxt: { fontSize: 11, color: C.primary2, fontWeight: '600' },
});

export default MoreMenuScreen;