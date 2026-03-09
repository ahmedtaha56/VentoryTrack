import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { fetchAllNotifications } from '../../lib/database';
import { AuthContext } from '../../context/Authcontext';
import { Card } from '../../components/Common';

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

// ─── Notification type → visual meta ──────────────────────────
const TYPE_META = {
  stock_in:        { icon: 'arrow-down-circle', color: C.green,  bg: '#f0fdf4', label: 'Stock In'        },
  stock_out:       { icon: 'arrow-up-circle',   color: C.red,    bg: '#fef2f2', label: 'Stock Out'       },
  low_stock_alert: { icon: 'alert-circle',      color: C.amber,  bg: '#fffbeb', label: 'Low Stock'       },
  product_add:     { icon: 'cube',              color: C.blue,   bg: '#eff6ff', label: 'Product Added'   },
  product_update:  { icon: 'cube',              color: C.cyan,   bg: '#ecfeff', label: 'Product Updated' },
  product_delete:  { icon: 'cube',              color: C.red,    bg: '#fef2f2', label: 'Product Deleted' },
  supplier_add:    { icon: 'business',          color: C.green,  bg: '#f0fdf4', label: 'Supplier Added'  },
  supplier_update: { icon: 'business',          color: C.cyan,   bg: '#ecfeff', label: 'Supplier Updated'},
  supplier_delete: { icon: 'business',          color: C.red,    bg: '#fef2f2', label: 'Supplier Deleted'},
  category_add:    { icon: 'folder',            color: C.amber,  bg: '#fffbeb', label: 'Category Added'  },
  category_update: { icon: 'folder',            color: C.purple, bg: '#faf5ff', label: 'Category Updated'},
  category_delete: { icon: 'folder',            color: C.red,    bg: '#fef2f2', label: 'Category Deleted'},
  sales_invoice:   { icon: 'receipt',           color: C.blue,   bg: '#eff6ff', label: 'Invoice'         },
};
const DEFAULT_META = { icon: 'alert-circle', color: C.textMid, bg: C.bg, label: 'Notification' };

const getMeta = (type) => TYPE_META[type] || DEFAULT_META;

// ─── Time ago formatter ────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ─── Notification Card ────────────────────────────────────────
const NotifCard = ({ item, isAdmin, onDeletePress, isDeleting }) => {
  const meta = getMeta(item.type);

  return (
    <View style={s.card}>
      {/* Left accent */}
      <View style={[s.cardAccent, { backgroundColor: meta.color }]} />

      <View style={s.cardInner}>
        <View style={s.cardTop}>
          {/* Icon */}
          <View style={[s.notifIcon, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>

          {/* Text */}
          <View style={s.cardBody}>
            <Text style={s.cardMsg}>{item.message}</Text>
            <View style={s.cardMeta}>
              {/* Type badge */}
              <View style={[s.typeBadge, { backgroundColor: meta.bg }]}>
                <Text style={[s.typeBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
              </View>
              {/* Time */}
              <View style={s.timeRow}>
                <Ionicons name="time-outline" size={11} color={C.textMute} />
                <Text style={s.timeTxt}>{timeAgo(item.created_at)}</Text>
              </View>
            </View>
          </View>

          {/* Delete (admin only) */}
          {isAdmin && (
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => onDeletePress(item)}
              disabled={isDeleting === item.id}
              activeOpacity={0.8}
            >
              {isDeleting === item.id
                ? <ActivityIndicator size="small" color={C.red} />
                : <Ionicons name="trash-outline" size={16} color={C.red} />}
            </TouchableOpacity>
          )}
        </View>

        {/* Full date — compact */}
        <Text style={s.fullDate}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────
const NotificationsScreen = () => {
  const { user, userData } = useContext(AuthContext);
  const [activities, setActivities]               = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [deleting, setDeleting]                   = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete]           = useState(null);
  const subscriptionRef       = useRef(null);
  const notificationChannelRef = useRef(null);
  const recentlyAddedRef      = useRef(new Set());
  const dedupTimerRef         = useRef(null);

  const isAdmin = userData?.role === 'admin';

  // ── All existing logic — 100% untouched ───────────────────
  const loadActivities = useCallback(async (showLoading = true) => {
    if (!user) {
      console.log('[NotificationsScreen] 🔴 loadActivities: No user, returning early');
      return;
    }
    if (showLoading) {
      console.log('[NotificationsScreen] 📋 loadActivities: Setting loading to true');
      setLoading(true);
    }
    try {
      console.log('[NotificationsScreen] 🔍 loadActivities: Fetching notifications for user:', user.id);
      console.log('[NotificationsScreen] 👤 User role:', userData?.role);
      const result = await fetchAllNotifications(supabase, user.id, userData?.role);
      console.log('[NotificationsScreen] 📊 fetchAllNotifications result:', result);
      console.log('[NotificationsScreen] 📊 Total notifications received:', result.data?.length || 0);
      if (result.success) {
        console.log(`[NotificationsScreen] ✅ Fetched ${result.data.length} notifications.`);
        console.log('[NotificationsScreen] 📋 Notification details:', result.data.map(n => ({
          id: n.id, type: n.type,
          message: n.message.substring(0, 50) + '...', created_at: n.created_at,
        })));
        const newActivities = result.data.filter(item => {
          const isRecent = recentlyAddedRef.current.has(item.id);
          if (isRecent) console.log(`[NotificationsScreen] ⏭️ Skipping recently added notification: ${item.id}`);
          return !isRecent;
        });
        setActivities(newActivities);
        console.log('[NotificationsScreen] ✅ setActivities called with', newActivities.length, 'items (filtered)');
      } else {
        console.error('[NotificationsScreen] ❌ Fetch Error:', result.error);
        Alert.alert('Error', 'Failed to load notifications.');
      }
    } catch (error) {
      console.error('[NotificationsScreen] 🔥 Error loading notifications:', error);
      console.error('[NotificationsScreen] 🔥 Error stack:', error.stack);
      Alert.alert('Error', 'An unexpected error occurred while loading.');
    } finally {
      if (showLoading) {
        console.log('[NotificationsScreen] 📋 loadActivities: Setting loading to false');
        setLoading(false);
      }
    }
  }, [user, userData?.role]);

  useFocusEffect(
    useCallback(() => {
      console.log('[NotificationsScreen] 🎯 useFocusEffect triggered - Screen focused');
      console.log('[NotificationsScreen] 👤 Current user:', user?.id);
      console.log('[NotificationsScreen] 👤 Current role:', userData?.role);
      recentlyAddedRef.current.clear();
      console.log('[NotificationsScreen] 🧹 Cleared recently added set');
      if (user && user.id) {
        console.log('[NotificationsScreen] 📡 Setting up real-time subscriptions');
        setupRealtimeNotifications();
      } else {
        console.log('[NotificationsScreen] 🔴 No user ID available for subscriptions');
      }
      const timer = setTimeout(() => {
        console.log('[NotificationsScreen] ⏱️ Timeout completed, calling loadActivities');
        loadActivities();
      }, 100);
      return () => {
        console.log('[NotificationsScreen] 🔌 Cleanup - Screen unfocused');
        clearTimeout(timer);
        if (dedupTimerRef.current) {
          clearTimeout(dedupTimerRef.current);
          console.log('[NotificationsScreen] 🔌 Cleared dedup timer');
        }
        if (subscriptionRef.current) {
          console.log('[NotificationsScreen] 🔌 Unsubscribing from real-time notifications (INSERT)');
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }
        if (notificationChannelRef.current) {
          console.log('[NotificationsScreen] 🔌 Unsubscribing from real-time notifications (DELETE)');
          supabase.removeChannel(notificationChannelRef.current);
          notificationChannelRef.current = null;
        }
      };
    }, [loadActivities, user, userData?.role])
  );

  const setupRealtimeNotifications = () => {
    console.log('[NotificationsScreen] 📡 setupRealtimeNotifications called');
    if (!user || !user.id) {
      console.log('[NotificationsScreen] 🔴 No user or user.id, cannot setup subscriptions');
      return;
    }
    if (subscriptionRef.current || notificationChannelRef.current) {
      console.log('[NotificationsScreen] ℹ️ Real-time subscription already active, skipping setup');
      return;
    }
    console.log('[NotificationsScreen] 📢 Setting up real-time notification subscription for user:', user.id);
    console.log('[NotificationsScreen] 📢 User role:', userData?.role);
    try {
      const insertChannel = supabase
        .channel(`notifications:insert:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public',
          table: 'notifications', filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          console.log('[NotificationsScreen] 🔔 New real-time notification received');
          console.log('[NotificationsScreen] 🔔 Payload:', JSON.stringify(payload, null, 2));
          const newNotification = {
            id: payload.new.id, user_id: payload.new.user_id,
            message: payload.new.message, type: payload.new.type, created_at: payload.new.created_at,
          };
          console.log('[NotificationsScreen] ✅ Creating notification object:', newNotification);
          recentlyAddedRef.current.add(newNotification.id);
          console.log('[NotificationsScreen] 📝 Added to recently added set:', newNotification.id);
          if (dedupTimerRef.current) {
            clearTimeout(dedupTimerRef.current);
            console.log('[NotificationsScreen] 🧹 Cleared previous dedup timer');
          }
          dedupTimerRef.current = setTimeout(() => {
            console.log('[NotificationsScreen] 🧹 Clearing recently added set after 3s');
            recentlyAddedRef.current.clear();
          }, 3000);
          setActivities((prevActivities) => {
            try {
              const isDuplicate = prevActivities.some(a => a.id === newNotification.id);
              if (isDuplicate) {
                console.log('[NotificationsScreen] ⚠️ Duplicate realtime notification ignored:', newNotification.id);
                return prevActivities;
              }
            } catch (e) {
              console.error('[NotificationsScreen] ❌ Error checking duplicates:', e);
            }
            console.log('[NotificationsScreen] ✅ Adding new notification to state:', newNotification.id);
            console.log('[NotificationsScreen] 📊 Previous count:', prevActivities.length, '-> New count:', prevActivities.length + 1);
            return [newNotification, ...prevActivities];
          });
        })
        .subscribe((status) => {
          console.log('[NotificationsScreen] 📡 INSERT subscription status:', status);
        });
      console.log('[NotificationsScreen] ✅ INSERT channel created and subscribed');
      const deleteChannel = supabase
        .channel(`notifications:delete:${user.id}`)
        .on('postgres_changes', {
          event: 'DELETE', schema: 'public',
          table: 'notifications', filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          console.log('[NotificationsScreen] 🗑️ Real-time notification delete received:', payload);
          setActivities((prevActivities) => {
            const filtered = prevActivities.filter(item => item.id !== payload.old.id);
            console.log(`[NotificationsScreen] 🗑️ Removed notification ${payload.old.id}. Count: ${prevActivities.length} → ${filtered.length}`);
            return filtered;
          });
        })
        .subscribe((status) => {
          console.log('[NotificationsScreen] 📡 DELETE subscription status:', status);
        });
      console.log('[NotificationsScreen] ✅ DELETE channel created and subscribed');
      subscriptionRef.current = insertChannel;
      notificationChannelRef.current = deleteChannel;
      console.log('[NotificationsScreen] ✅ All subscriptions set up successfully');
    } catch (error) {
      console.error('[NotificationsScreen] 🔥 Error setting up real-time subscriptions:', error);
      console.error('[NotificationsScreen] 🔥 Error stack:', error.stack);
    }
  };

  const handleDelete = useCallback((item) => {
    console.log('[NotificationsScreen] 🗑️ handleDelete called for item:', item);
    console.log('[NotificationsScreen] 👤 User role:', userData?.role);
    if (userData?.role !== 'admin') {
      console.log('[NotificationsScreen] 🔴 Access denied - user is not admin');
      Alert.alert('Access Denied', 'Only admins can delete notifications');
      return;
    }
    console.log('[NotificationsScreen] ✅ User has admin role, showing delete modal');
    setItemToDelete(item);
    setDeleteModalVisible(true);
  }, [userData]);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) {
      console.log('[NotificationsScreen] 🔴 No item to delete');
      return;
    }
    const { id: notificationId, message } = itemToDelete;
    console.log(`[NotificationsScreen] 🗑️ ===== DELETE START =====`);
    console.log(`[NotificationsScreen] 📌 Notification ID: ${notificationId}`);
    console.log(`[NotificationsScreen] 📝 Message: ${message}`);
    console.log(`[NotificationsScreen] 👤 Current User: ${user?.id}`);
    console.log(`[NotificationsScreen] 🔐 User Role: ${userData?.role}`);
    try {
      setDeleting(notificationId);
      console.log(`[NotificationsScreen] 🚀 Calling RPC function: delete_notification_by_id`);
      console.log(`[NotificationsScreen] 📤 RPC Parameters:`, { p_notification_id: notificationId });
      const { data, error } = await supabase.rpc('delete_notification_by_id', {
        p_notification_id: notificationId,
      });
      console.log(`[NotificationsScreen] 📥 RPC Response - Data:`, data);
      console.log(`[NotificationsScreen] 📥 RPC Response - Error:`, error);
      if (error) {
        console.error(`[NotificationsScreen] ❌ RPC Error:`, error);
        Alert.alert('Error', error.message || 'Failed to delete notification.');
      } else if (data && !data.success) {
        console.error(`[NotificationsScreen] ❌ Delete Failed:`, data.error);
        Alert.alert('Error', data.error || 'Failed to delete notification.');
      } else {
        console.log(`[NotificationsScreen] ✅ Delete successful! Response:`, data);
        setActivities((prev) => {
          const filtered = prev.filter((item) => item.id !== notificationId);
          console.log(`[NotificationsScreen] 📊 Activities before: ${prev.length}, after: ${filtered.length}`);
          return filtered;
        });
        Alert.alert('Success', 'Notification deleted for the entire team.');
        setTimeout(() => {
          console.log(`[NotificationsScreen] 🔄 Refreshing notifications after delete...`);
          loadActivities(false);
        }, 500);
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      console.error(`[NotificationsScreen] ❌ Exception in confirmDelete:`, error);
      console.error(`[NotificationsScreen] 📋 Error Stack:`, error.stack);
      Alert.alert('Error', errorMessage);
    } finally {
      console.log(`[NotificationsScreen] 🗑️ ===== DELETE END =====`);
      setDeleting(null);
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, user, userData, loadActivities]);

  // ── Loading ────────────────────────────────────────────────
  if (loading && activities.length === 0) {
    return (
      <View style={s.loadingWrap}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.loadingBox}>
          <View style={s.loadingSpinner}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
          <Text style={s.loadingTitle}>Loading Activity</Text>
          <Text style={s.loadingHint}>Fetching your notifications…</Text>
        </View>
      </View>
    );
  }

  // ─── Counts per type group for header chips ───────────────
  const alertCount  = activities.filter(a => a.type === 'low_stock_alert').length;
  const stockCount  = activities.filter(a => a.type === 'stock_in' || a.type === 'stock_out').length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ──── Header ──── */}
      <View style={s.header}>
        <View style={s.hCircle1} />
        <View style={s.hCircle2} />
        <View style={s.hTop}>
          <View>
            <Text style={s.hGreet}>Notifications 🔔</Text>
            <Text style={s.hSub}>Activity feed & stock alerts</Text>
          </View>
          <View style={s.hAvatar}>
            <Ionicons name="notifications" size={18} color="#c7d2fe" />
          </View>
        </View>

        {/* Chips */}
        <View style={s.chips}>
          <View style={s.chip}>
            <Ionicons name="list-outline" size={12} color="#a5f3fc" />
            <Text style={s.chipTxt}>{activities.length} total</Text>
          </View>
          {alertCount > 0 && (
            <View style={[s.chip, s.chipWarn]}>
              <Ionicons name="alert-circle-outline" size={12} color="#fde68a" />
              <Text style={[s.chipTxt, { color: '#fde68a' }]}>{alertCount} alerts</Text>
            </View>
          )}
          {stockCount > 0 && (
            <View style={s.chip}>
              <Ionicons name="swap-vertical-outline" size={12} color="#a5f3fc" />
              <Text style={s.chipTxt}>{stockCount} stock moves</Text>
            </View>
          )}
          {isAdmin && (
            <View style={[s.chip, s.chipAdmin]}>
              <Ionicons name="shield-checkmark-outline" size={12} color="#c4b5fd" />
              <Text style={[s.chipTxt, { color: '#c4b5fd' }]}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      {/* ──── List ──── */}
      <FlatList
        data={activities}
        renderItem={({ item }) => (
          <NotifCard
            item={item}
            isAdmin={isAdmin}
            onDeletePress={handleDelete}
            isDeleting={deleting}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyWrap}>
              <View style={s.emptyIconBox}>
                <Ionicons name="notifications-off-outline" size={32} color={C.textMute} />
              </View>
              <Text style={s.emptyTitle}>No Notifications</Text>
              <Text style={s.emptySub}>No recent activity found</Text>
            </View>
          ) : null
        }
        onRefresh={() => loadActivities(false)}
        refreshing={loading}
      />

      {/* ──── Delete Confirm Modal ──── */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalBlob} />

            <View style={s.modalIconBox}>
              <Ionicons name="trash" size={28} color={C.red} />
            </View>

            <Text style={s.modalTitle}>Delete Activity</Text>

            {itemToDelete && (
              <View style={s.modalPreview}>
                <View style={[s.modalPreviewIcon, { backgroundColor: getMeta(itemToDelete.type).bg }]}>
                  <Ionicons
                    name={getMeta(itemToDelete.type).icon}
                    size={14}
                    color={getMeta(itemToDelete.type).color}
                  />
                </View>
                <Text style={s.modalPreviewTxt} numberOfLines={2}>{itemToDelete.message}</Text>
              </View>
            )}

            <Text style={s.modalMsg}>
              Are you sure you want to permanently delete this item?
            </Text>

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => {
                  console.log('[NotificationsScreen] Delete cancelled.');
                  setDeleteModalVisible(false);
                  setItemToDelete(null);
                }}
              >
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalDeleteBtn}
                onPress={confirmDelete}
              >
                <Ionicons name="trash-outline" size={15} color="#fff" />
                <Text style={s.modalDeleteTxt}>Delete</Text>
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
  chips:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  chipWarn: {
    backgroundColor: 'rgba(253,230,138,0.14)',
    borderColor: 'rgba(253,230,138,0.3)',
  },
  chipAdmin: {
    backgroundColor: 'rgba(196,181,253,0.14)',
    borderColor: 'rgba(196,181,253,0.3)',
  },
  chipTxt: { fontSize: 12, color: '#e0e7ff', fontWeight: '600' },

  // ── List
  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 32 },

  // ── Notification Card
  card: {
    backgroundColor: C.card, borderRadius: 18, marginBottom: 10,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: C.border,
  },
  cardAccent: { width: 4 },
  cardInner:  { flex: 1, paddingTop: 13, paddingBottom: 10, paddingHorizontal: 13 },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 6 },
  notifIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardMsg: {
    fontSize: 13.5, fontWeight: '700', color: C.text,
    lineHeight: 19, marginBottom: 7,
  },
  cardMeta:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  typeBadgeTxt: { fontSize: 11, fontWeight: '700' },
  timeRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeTxt:      { fontSize: 11.5, color: C.textMute, fontWeight: '500' },
  fullDate:     { fontSize: 11, color: C.textMute, fontWeight: '400', marginTop: 2 },

  // ── Delete button (inside card)
  deleteBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Empty State
  emptyWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, gap: 10,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  emptySub:   { fontSize: 13, color: C.textMute, fontWeight: '500' },

  // ── Delete Modal
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
    fontSize: 20, fontWeight: '800', color: C.text,
    letterSpacing: -0.4, marginBottom: 12,
  },
  modalPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bg, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 14, width: '100%',
    borderWidth: 1, borderColor: C.border,
  },
  modalPreviewIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  modalPreviewTxt: {
    flex: 1, fontSize: 12.5, color: C.textMid,
    fontWeight: '600', lineHeight: 18,
  },
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
});

export default NotificationsScreen;