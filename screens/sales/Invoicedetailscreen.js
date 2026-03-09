import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { Card, Button } from '../../components/Common';
import { supabase } from '../../lib/supabase';
import { fetchSaleById } from '../../lib/database';

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
  cyan:     '#0891b2',
  red:      '#dc2626',
};

const PM_CONFIG = {
  cash:  { icon: 'cash',          color: C.green, label: 'Cash'          },
  card:  { icon: 'card',          color: C.blue,  label: 'Card'          },
  check: { icon: 'document-text', color: C.amber, label: 'Check'         },
  bank:  { icon: 'business',      color: C.cyan,  label: 'Bank Transfer' },
};

const InvoiceDetailScreen = ({ route, navigation }) => {
  const { state }  = useContext(AppContext);
  const saleId     = route.params?.saleId;
  const [sale, setSale]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSale = async () => {
      if (saleId && state.user) {
        const result = await fetchSaleById(supabase, saleId, state.user.id);
        if (result.success) setSale(result.sale);
      }
      setLoading(false);
    };
    loadSale();
  }, [saleId, state.user]);

  const handlePrint = () => { Alert.alert('Print', 'Invoice print feature coming soon'); };
  const handleShare = () => { Alert.alert('Share', 'Invoice share feature coming soon'); };

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <View style={s.header}>
          <View style={s.hBlob} />
          <View style={s.hTop}>
            {navigation && (
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={18} color="#c7d2fe" />
              </TouchableOpacity>
            )}
            <Text style={s.hTitle}>Invoice Detail</Text>
          </View>
        </View>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingTxt}>Loading invoice…</Text>
        </View>
      </View>
    );
  }

  // ── Not found ─────────────────────────────────────────────
  if (!sale) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <View style={s.header}>
          <View style={s.hBlob} />
          <View style={s.hTop}>
            {navigation && (
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={18} color="#c7d2fe" />
              </TouchableOpacity>
            )}
            <Text style={s.hTitle}>Invoice Detail</Text>
          </View>
        </View>
        <View style={s.centered}>
          <View style={s.emptyIconBox}>
            <Ionicons name="document-outline" size={30} color={C.border} />
          </View>
          <Text style={s.emptyTxt}>Invoice not found</Text>
        </View>
      </View>
    );
  }

  const date          = new Date(sale.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const pm            = PM_CONFIG[sale.paymentMethod] || PM_CONFIG.cash;
  const isToday       = date.toDateString() === new Date().toDateString();

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.hBlob} />
        <View style={s.hBlob2} />

        <View style={s.hTop}>
          {navigation && (
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={18} color="#c7d2fe" />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.hTitle}>Invoice</Text>
            <Text style={s.hInvNum}>#{sale.invoiceNumber}</Text>
          </View>
          <View style={s.paidBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#6ee7b7" />
            <Text style={s.paidTxt}>Paid</Text>
          </View>
        </View>

        {/* Header amount display */}
        <View style={s.hAmountRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.hAmountLbl}>Total Amount</Text>
            <Text style={s.hAmount}>${sale.total.toFixed(2)}</Text>
          </View>
          <View style={s.hDateBox}>
            <Text style={s.hDateLbl}>{isToday ? 'Today' : formattedDate}</Text>
            <Text style={s.hTime}>{formattedTime}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ── Customer & Payment ── */}
        <View style={s.card}>
          <View style={s.cardRow}>
            {/* Customer */}
            <View style={s.infoHalf}>
              <Text style={s.infoCaption}>BILL TO</Text>
              <View style={s.customerBox}>
                <View style={s.customerAvatar}>
                  <Text style={s.customerInitial}>
                    {(sale.customerName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={s.customerName}>{sale.customerName}</Text>
              </View>
            </View>

            <View style={s.cardRowDivider} />

            {/* Payment */}
            <View style={s.infoHalf}>
              <Text style={s.infoCaption}>PAYMENT</Text>
              <View style={[s.pmBox, { backgroundColor: pm.color + '12' }]}>
                <Ionicons name={pm.icon} size={15} color={pm.color} />
                <Text style={[s.pmName, { color: pm.color }]}>{pm.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Items Table ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.headIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="list" size={15} color={C.blue} />
            </View>
            <Text style={s.cardTitle}>Items</Text>
            <View style={s.itemsBadge}>
              <Text style={s.itemsBadgeTxt}>{sale.items.length} item{sale.items.length > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Table header */}
          <View style={s.tableHead}>
            <Text style={[s.thCell, s.colProduct]}>Product</Text>
            <Text style={[s.thCell, s.colQty]}>Qty</Text>
            <Text style={[s.thCell, s.colPrice]}>Price</Text>
            <Text style={[s.thCell, s.colTotal]}>Total</Text>
          </View>

          {sale.items.map((item, index) => (
            <View
              key={item.id || index}
              style={[
                s.tableRow,
                index % 2 === 0 && { backgroundColor: '#fafbff' },
                index === sale.items.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={s.colProduct}>
                <Text style={s.tdName} numberOfLines={1}>{item.productName}</Text>
              </View>
              <Text style={[s.tdCell, s.colQty]}>{item.quantity}</Text>
              <Text style={[s.tdCell, s.colPrice]}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={[s.tdCell, s.colTotal, { color: C.green, fontWeight: '800' }]}>
                ${item.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.headIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="calculator-outline" size={15} color={C.green} />
            </View>
            <Text style={s.cardTitle}>Summary</Text>
          </View>

          <View style={s.summaryRow}>
            <Text style={s.summaryLbl}>Subtotal</Text>
            <Text style={s.summaryVal}>${sale.total.toFixed(2)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLbl}>Tax (0%)</Text>
            <Text style={s.summaryVal}>$0.00</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.grandLbl}>TOTAL</Text>
            <Text style={s.grandVal}>${sale.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Payment Info ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.headIcon, { backgroundColor: pm.color + '18' }]}>
              <Ionicons name={pm.icon} size={15} color={pm.color} />
            </View>
            <Text style={s.cardTitle}>Payment Information</Text>
          </View>

          {[
            { label: 'Payment Method', value: pm.label, color: pm.color },
            { label: 'Status',         value: 'Paid ✓',  color: C.green },
            { label: 'Invoice Date',   value: formattedDate },
            { label: 'Invoice Time',   value: formattedTime },
          ].map((row, i, arr) => (
            <View key={i} style={[s.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.infoLbl}>{row.label}</Text>
              <Text style={[s.infoVal, row.color && { color: row.color }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Actions ── */}
        <View style={[s.card, { marginBottom: 28 }]}>
          <View style={s.actionsRow}>
            <TouchableOpacity style={s.actionBtn} onPress={handlePrint} activeOpacity={0.82}>
              <View style={[s.actionIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="print" size={18} color={C.blue} />
              </View>
              <Text style={[s.actionTxt, { color: C.blue }]}>Print</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={handleShare} activeOpacity={0.82}>
              <View style={[s.actionIcon, { backgroundColor: '#faf5ff' }]}>
                <Ionicons name="share-social" size={18} color={C.primary} />
              </View>
              <Text style={[s.actionTxt, { color: C.primary }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View style={s.footerLine} />
          <Text style={s.footerTxt}>Thank you for your business!</Text>
          <Text style={s.footerSub}>{sale.invoiceNumber}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: C.textMute, fontWeight: '500' },
  emptyIconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center',
  },
  emptyTxt: { fontSize: 14, color: C.textMute, fontWeight: '500' },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  hBlob: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(99,102,241,0.15)', top: -70, right: -50,
  },
  hBlob2: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(5,150,105,0.12)', bottom: -25, left: 15,
  },
  hTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  hTitle:  { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  hInvNum: { fontSize: 12, color: '#a5b4fc', marginTop: 2 },
  paidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(5,150,105,0.25)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(110,231,183,0.3)',
  },
  paidTxt: { fontSize: 11, color: '#6ee7b7', fontWeight: '700' },
  hAmountRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  hAmountLbl: { fontSize: 11, color: '#a5b4fc', fontWeight: '600', marginBottom: 4 },
  hAmount:    { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  hDateBox:   { alignItems: 'flex-end' },
  hDateLbl:   { fontSize: 12, color: '#a5b4fc', fontWeight: '600' },
  hTime:      { fontSize: 11, color: '#6366f180', marginTop: 3 },

  // ── Scroll
  scroll:       { flex: 1 },
  scrollContent:{ padding: 14 },

  // ── Card
  card: {
    backgroundColor: C.card, borderRadius: 20,
    padding: 16, marginBottom: 12,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  headIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle:{ fontSize: 14, fontWeight: '800', color: C.text, flex: 1 },
  itemsBadge: {
    backgroundColor: C.blue + '18',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  itemsBadgeTxt: { fontSize: 11, fontWeight: '700', color: C.blue },

  // ── Customer & Payment row
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoHalf:    { flex: 1 },
  cardRowDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 16, alignSelf: 'stretch' },
  infoCaption: { fontSize: 10, color: C.textMute, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  customerBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customerAvatar: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: C.primary + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  customerInitial: { fontSize: 15, fontWeight: '800', color: C.primary },
  customerName:    { fontSize: 13, fontWeight: '700', color: C.text, flex: 1 },
  pmBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  pmName: { fontSize: 12, fontWeight: '700' },

  // ── Table
  tableHead: {
    flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 8,
    backgroundColor: '#f8fafc', borderRadius: 10,
    borderWidth: 1, borderColor: C.border, marginBottom: 6,
  },
  thCell: { fontSize: 11, fontWeight: '800', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.3 },
  tableRow: {
    flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#f0f2f8',
    borderRadius: 8, marginBottom: 2, alignItems: 'center',
  },
  tdName: { fontSize: 13, fontWeight: '700', color: C.text },
  tdCell: { fontSize: 13, color: C.textMid, fontWeight: '600', textAlign: 'center' },
  colProduct: { flex: 2 },
  colQty:     { flex: 0.7, textAlign: 'center' },
  colPrice:   { flex: 1, textAlign: 'right' },
  colTotal:   { flex: 1, textAlign: 'right' },

  // ── Summary
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f2f8',
  },
  summaryLbl: { fontSize: 13, color: C.textMid },
  summaryVal: { fontSize: 13, fontWeight: '600', color: C.textMid },
  grandRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 14,
    backgroundColor: '#f0fdf4', borderRadius: 12,
    padding: 14, marginTop: 6,
    borderWidth: 1, borderColor: C.green + '30',
  },
  grandLbl: { fontSize: 13, fontWeight: '800', color: C.green, letterSpacing: 0.5 },
  grandVal: { fontSize: 24, fontWeight: '800', color: C.green, letterSpacing: -0.5 },

  // ── Info rows
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f0f2f8',
  },
  infoLbl: { fontSize: 13, color: C.textMid, fontWeight: '500' },
  infoVal: { fontSize: 13, fontWeight: '700', color: C.text },

  // ── Actions
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5, borderColor: C.border,
  },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionTxt:  { fontSize: 13, fontWeight: '700' },

  // ── Footer
  footer: { alignItems: 'center', paddingVertical: 16, gap: 6, marginBottom: 12 },
  footerLine: { width: 40, height: 3, borderRadius: 2, backgroundColor: C.border, marginBottom: 6 },
  footerTxt:  { fontSize: 13, color: C.textMute, fontStyle: 'italic' },
  footerSub:  { fontSize: 11, color: C.border, fontWeight: '500' },
});

export default InvoiceDetailScreen;