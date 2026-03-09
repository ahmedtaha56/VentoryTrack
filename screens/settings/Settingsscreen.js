import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/Authcontext';
import { ListItem, Card, Button, AccessDenied } from '../../components/Common';
import { usePermissions } from '../../hooks/usePermissions';

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

// ─── Section Header (matches Dashboard pattern) ───────────────
const SectionHeader = ({ title, color = C.primary2 }) => (
  <View style={s.secHead}>
    <View style={[s.secBar, { backgroundColor: color }]} />
    <Text style={s.secTitle}>{title}</Text>
  </View>
);

// ─── Settings Row ─────────────────────────────────────────────
const SettingRow = ({ icon, iconColor, iconBg, title, subtitle, right, onPress, isLast }) => (
  <TouchableOpacity
    style={[s.settingRow, !isLast && s.settingRowBorder]}
    onPress={onPress}
    activeOpacity={onPress ? 0.75 : 1}
    disabled={!onPress}
  >
    <View style={[s.settingIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={s.settingBody}>
      <Text style={s.settingTitle}>{title}</Text>
      {subtitle ? <Text style={s.settingSub}>{subtitle}</Text> : null}
    </View>
    {right}
    {onPress && <View style={s.settingChevron}><Ionicons name="chevron-forward" size={15} color={C.border} /></View>}
    <View style={[s.settingAccent, { backgroundColor: iconColor }]} />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────
const SettingsScreen = ({ navigation }) => {
  const { user, userData, signOut } = useContext(AuthContext);
  const { hasFeatureAccess } = usePermissions();
  const [notifications, setNotifications] = useState(true);
  const [showLogoutModal, setShowLogoutModal]   = useState(false);
  const [isLoggingOut, setIsLoggingOut]         = useState(false);

  // ── Existing permission check — untouched ─────────────────
  const hasSettingsAccess = hasFeatureAccess('settings');
  if (!hasSettingsAccess) return <AccessDenied featureName="Settings" />;

  // ── Existing handlers — untouched ─────────────────────────
  const handleLogout = () => {
    console.log('🔴 Logout button pressed');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('🔴 Logout confirmed - calling signOut()');
    setIsLoggingOut(true);
    try {
      console.log('📋 signOut function:', typeof signOut);
      const result = await signOut();
      console.log('📊 signOut result:', result);
      if (result && result.success) {
        console.log('✅ Successfully logged out');
        setShowLogoutModal(false);
      } else {
        console.log('❌ Logout failed:', result);
        Alert.alert('Error', result?.error || 'Logout failed');
        setShowLogoutModal(false);
      }
    } catch (error) {
      console.error('🔥 Logout error:', error);
      Alert.alert('Error', 'An error occurred during logout');
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const roleLabel = userData?.role
    ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
    : 'User';

  return (
    <>
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />

        {/* ──── Header ──── */}
        <View style={s.header}>
          <View style={s.hCircle1} />
          <View style={s.hCircle2} />
          <View style={s.hTop}>
            <View>
              <Text style={s.hGreet}>Settings ⚙️</Text>
              <Text style={s.hSub}>Manage your account & preferences</Text>
            </View>
            <View style={s.hAvatar}>
              <Ionicons name="settings" size={18} color="#c7d2fe" />
            </View>
          </View>

          {/* Profile chip in header */}
          <View style={s.chips}>
            <View style={s.chip}>
              <Ionicons name="person-circle-outline" size={12} color="#a5f3fc" />
              <Text style={s.chipTxt}>{userData?.name || 'User'}</Text>
            </View>
            <View style={s.chip}>
              <Ionicons name="shield-outline" size={12} color="#a5f3fc" />
              <Text style={s.chipTxt}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          {/* ──── Profile Card ──── */}
          <View style={s.section}>
            <SectionHeader title="Profile" color={C.purple} />
            <View style={s.profileCard}>
              {/* Avatar blob bg */}
              <View style={s.profileBlobL} />
              <View style={s.profileBlobR} />

              <View style={s.profileInner}>
                <View style={s.avatarWrap}>
                  <View style={s.avatarRing}>
                    <View style={s.avatarCircle}>
                      <Ionicons name="person" size={32} color="#fff" />
                    </View>
                  </View>
                  <View style={s.avatarOnline} />
                </View>

                <View style={s.profileInfo}>
                  <Text style={s.profileName}>{userData?.name || 'User'}</Text>
                  <Text style={s.profileEmail}>{user?.email}</Text>
                  <View style={s.rolePill}>
                    <View style={[s.roleDot, { backgroundColor: C.primary }]} />
                    <Text style={s.roleText}>{roleLabel}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ──── Preferences ──── */}
          <View style={s.section}>
            <SectionHeader title="Preferences" color={C.cyan} />
            <View style={s.card}>
              <View style={[s.settingRow]}>
                <View style={[s.settingIcon, { backgroundColor: '#fff7ed' }]}>
                  <Ionicons name="notifications" size={18} color={C.amber} />
                </View>
                <View style={s.settingBody}>
                  <Text style={s.settingTitle}>Push Notifications</Text>
                  <Text style={s.settingSub}>
                    {notifications ? 'Alerts are enabled' : 'Alerts are disabled'}
                  </Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={(value) => {
                    setNotifications(value);
                    console.log('🔔 Notifications:', value ? 'ON' : 'OFF');
                  }}
                  trackColor={{ false: C.border, true: '#a5b4fc' }}
                  thumbColor={notifications ? C.primary : '#fff'}
                  ios_backgroundColor={C.border}
                />
                <View style={[s.settingAccent, { backgroundColor: C.amber }]} />
              </View>
            </View>
          </View>

          {/* ──── App Information ──── */}
          <View style={s.section}>
            <SectionHeader title="App Information" color={C.blue} />
            <View style={s.card}>
              {[
                { label: 'App Version', value: '1.0.0',       icon: 'code-slash-outline',  color: C.blue,   bg: '#eff6ff' },
                { label: 'Build Number', value: '2024.01.08', icon: 'hammer-outline',       color: C.purple, bg: '#faf5ff', last: true },
              ].map((item, i) => (
                <View key={i} style={[s.infoRow, !item.last && s.settingRowBorder]}>
                  <View style={[s.settingIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text style={s.infoLabel}>{item.label}</Text>
                  <View style={s.infoPill}>
                    <Text style={[s.infoValue, { color: item.color }]}>{item.value}</Text>
                  </View>
                  <View style={[s.settingAccent, { backgroundColor: item.color }]} />
                </View>
              ))}
            </View>
          </View>

          {/* ──── Support & Legal ──── */}
          <View style={s.section}>
            <SectionHeader title="Support & Legal" color={C.green} />
            <View style={s.card}>
              {[
                { icon: 'help-circle',       iconColor: C.green,  iconBg: '#f0fdf4', title: 'Help & Support',     subtitle: 'Get help with the app',      nav: 'HelpSupport'     },
                { icon: 'shield-checkmark',  iconColor: C.blue,   iconBg: '#eff6ff', title: 'Privacy Policy',     subtitle: 'Review our privacy terms',    nav: 'PrivacyPolicy'   },
                { icon: 'document-text',     iconColor: C.purple, iconBg: '#faf5ff', title: 'Terms & Conditions', subtitle: 'Read our terms',              nav: 'TermsConditions', last: true },
              ].map((item, i) => (
                <SettingRow
                  key={i}
                  icon={item.icon}
                  iconColor={item.iconColor}
                  iconBg={item.iconBg}
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={() => navigation.navigate(item.nav)}
                  isLast={item.last}
                />
              ))}
            </View>
          </View>

          {/* ──── Logout Button ──── */}
          <View style={s.section}>
            <TouchableOpacity
              style={s.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <View style={s.logoutBlob} />
              <View style={s.logoutInner}>
                <View style={s.logoutIconBox}>
                  <Ionicons name="log-out" size={20} color={C.red} />
                </View>
                <Text style={s.logoutTxt}>Logout</Text>
                <View style={s.logoutChevron}>
                  <Ionicons name="chevron-forward" size={16} color={C.red} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ──── Footer ──── */}
          <View style={s.footer}>
            <View style={s.footerLine} />
            <View style={s.footerBadge}>
              <Ionicons name="sparkles" size={11} color={C.primary2} />
              <Text style={s.footerTxt}>StockTrack © 2024</Text>
            </View>
            <View style={s.footerLine} />
            <Text style={s.footerSub}>Inventory Management System</Text>
          </View>
        </ScrollView>
      </View>

      {/* ──── Logout Modal ──── */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            {/* Decorative blobs */}
            <View style={s.modalBlob1} />
            <View style={s.modalBlob2} />

            {/* Icon */}
            <View style={s.modalIconBox}>
              <Ionicons name="log-out" size={28} color={C.red} />
            </View>

            <Text style={s.modalTitle}>Confirm Logout</Text>
            <Text style={s.modalMsg}>Are you sure you want to logout from your account?</Text>

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => {
                  console.log('❌ Logout cancelled');
                  setShowLogoutModal(false);
                }}
                disabled={isLoggingOut}
              >
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.modalLogoutBtn, isLoggingOut && s.btnDisabled]}
                onPress={confirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="log-out" size={16} color="#fff" />}
                <Text style={s.modalLogoutTxt}>
                  {isLoggingOut ? 'Logging out…' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  scrollContent: { paddingTop: 16, paddingBottom: 32 },

  // ── Section
  section: { marginHorizontal: 14, marginBottom: 14 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  secBar:  { width: 4, height: 18, borderRadius: 2 },
  secTitle:{ fontSize: 13, fontWeight: '800', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.6 },

  // ── Card container
  card: {
    backgroundColor: C.card,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },

  // ── Profile Card
  profileCard: {
    backgroundColor: C.card,
    borderRadius: 20, padding: 18, overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 14, elevation: 4,
    borderWidth: 1, borderColor: '#e0e7ff',
  },
  profileBlobL: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#ede9fe', opacity: 0.35, top: -40, right: -30,
  },
  profileBlobR: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#ddd6fe', opacity: 0.2, bottom: -25, left: 10,
  },
  profileInner: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap:   { position: 'relative' },
  avatarRing: {
    padding: 3, borderRadius: 28,
    borderWidth: 2, borderColor: C.primary2 + '60',
  },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarOnline: {
    position: 'absolute', bottom: 2, right: 2,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: C.green, borderWidth: 2, borderColor: C.card,
  },
  profileInfo:  { flex: 1 },
  profileName:  { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  profileEmail: { fontSize: 12, color: C.textMute, marginTop: 3, fontWeight: '500' },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 7,
    backgroundColor: '#ede9fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  roleDot:  { width: 7, height: 7, borderRadius: 4 },
  roleText: { fontSize: 12, fontWeight: '700', color: C.primary },

  // ── Setting Row
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14,
    gap: 12, overflow: 'hidden', position: 'relative',
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: C.bg },
  settingIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  settingBody: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  settingSub:   { fontSize: 12, color: C.textMute, marginTop: 2, fontWeight: '500' },
  settingChevron: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  settingAccent: {
    position: 'absolute', left: 0, top: 12, bottom: 12,
    width: 3, borderRadius: 2, opacity: 0.5,
  },

  // ── Info Row
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14,
    gap: 12, overflow: 'hidden', position: 'relative',
  },
  infoLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  infoPill: {
    backgroundColor: C.bg,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  infoValue: { fontSize: 13, fontWeight: '700' },

  // ── Logout Button
  logoutBtn: {
    backgroundColor: '#fef2f2',
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#fecaca',
    shadowColor: C.red, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  logoutBlob: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fee2e2', top: -25, right: 10,
  },
  logoutInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16, gap: 12,
  },
  logoutIconBox: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
  },
  logoutTxt:    { flex: 1, fontSize: 15, fontWeight: '800', color: C.red },
  logoutChevron:{
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
  },

  // ── Footer
  footer: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  footerLine: { width: 60, height: 1, backgroundColor: C.border },
  footerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.card,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
  },
  footerTxt: { fontSize: 12, color: C.primary2, fontWeight: '700' },
  footerSub: { fontSize: 11, color: C.textMute },

  // ── Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,12,51,0.6)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: C.card, borderRadius: 28,
    padding: 28, width: '100%', alignItems: 'center',
    overflow: 'hidden',
    shadowColor: C.navy, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  modalBlob1: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#fee2e2', opacity: 0.4, top: -55, right: -40,
  },
  modalBlob2: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fecaca', opacity: 0.2, bottom: -25, left: 10,
  },
  modalIconBox: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  modalTitle: {
    fontSize: 20, fontWeight: '800', color: C.text,
    letterSpacing: -0.4, marginBottom: 8,
  },
  modalMsg: {
    fontSize: 14, color: C.textMid, textAlign: 'center',
    lineHeight: 20, marginBottom: 24, fontWeight: '500',
  },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.bg, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  modalCancelTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },
  modalLogoutBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.red, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 7,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalLogoutTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
  btnDisabled: { opacity: 0.6 },
});

export default SettingsScreen;