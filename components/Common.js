import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ═══════════════════════════════════════════════════════════════
//  DESIGN TOKENS — identical to Dashboard
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
//  BUTTON
//  Variants: primary | secondary | danger | success
// ═══════════════════════════════════════════════════════════════
export const Button = ({
  title,
  onPress,
  style,
  textStyle,
  disabled,
  loading,
  variant = 'primary',
  icon,
}) => {
  const VARIANT_STYLES = {
    primary:   { bg: C.primary,  shadow: C.primary,  textColor: '#fff' },
    secondary: { bg: 'transparent', shadow: 'transparent', textColor: C.primary },
    danger:    { bg: C.red,      shadow: C.red,      textColor: '#fff' },
    success:   { bg: C.green,    shadow: C.green,    textColor: '#fff' },
  };
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity
      style={[
        cs.btn,
        isSecondary
          ? cs.btnSecondary
          : [
              { backgroundColor: v.bg },
              { shadowColor: v.shadow, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6 },
            ],
        (disabled || loading) && cs.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {!isSecondary && <View style={cs.btnGlow} />}

      {loading ? (
        <ActivityIndicator color={isSecondary ? C.primary : '#fff'} size="small" />
      ) : (
        <View style={cs.btnRow}>
          {icon && (
            <View style={[cs.btnIconBox, { backgroundColor: isSecondary ? C.primary + '15' : 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name={icon} size={15} color={v.textColor} />
            </View>
          )}
          <Text style={[cs.btnText, { color: v.textColor }, isSecondary && cs.btnTextSecondary, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
//  INPUT FIELD
// ═══════════════════════════════════════════════════════════════
export const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  icon,
  editable = true,
  secureTextEntry,
  style,
}) => {
  const filled = value && value.length > 0;

  return (
    <View style={cs.inputOuter}>
      {label && (
        <View style={cs.inputLabelRow}>
          <Text style={cs.inputLabel}>{label}</Text>
          {filled && !error && <Ionicons name="checkmark-circle" size={13} color={C.green} />}
        </View>
      )}

      <View style={[
        cs.inputBox,
        error  && cs.inputBoxError,
        filled && !error && cs.inputBoxFilled,
        !editable && cs.inputBoxDisabled,
      ]}>
        {icon && (
          <View style={[
            cs.inputLeftIcon,
            error  ? { backgroundColor: '#fef2f2' }
            : filled ? { backgroundColor: '#ede9fe' }
            : { backgroundColor: C.bg },
          ]}>
            <Ionicons
              name={icon}
              size={17}
              color={error ? C.red : filled ? C.primary : C.textMute}
            />
          </View>
        )}

        <TextInput
          style={[cs.inputText, icon && { paddingLeft: 8 }, multiline && cs.inputMultiline, style]}
          placeholder={placeholder}
          placeholderTextColor={C.textMute}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          secureTextEntry={secureTextEntry}
        />

        {error && (
          <View style={cs.inputTrail}>
            <Ionicons name="alert-circle" size={17} color={C.red} />
          </View>
        )}
        {!error && filled && (
          <View style={cs.inputTrail}>
            <Ionicons name="checkmark-circle" size={17} color={C.green} />
          </View>
        )}
      </View>

      {error && (
        <View style={cs.inputErrorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={C.red} />
          <Text style={cs.inputErrorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
//  CARD
// ═══════════════════════════════════════════════════════════════
export const Card = ({ children, style, onPress }) => (
  <TouchableOpacity
    style={[cs.card, style]}
    onPress={onPress}
    activeOpacity={onPress ? 0.78 : 1}
    disabled={!onPress}
  >
    {children}
  </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════
//  SUMMARY CARD
// ═══════════════════════════════════════════════════════════════
export const SummaryCard = ({ title, value, icon, color = C.primary, subtitle }) => (
  <Card style={[cs.summaryCard]}>
    <View style={[cs.summaryAccentBar, { backgroundColor: color }]} />
    <View style={[cs.summaryBlob, { backgroundColor: color + '12' }]} />

    <View style={cs.summaryCardInner}>
      <View style={{ flex: 1 }}>
        <Text style={cs.summaryCardLabel}>{title}</Text>
        <Text style={[cs.summaryCardValue, { color }]}>{value}</Text>
        {subtitle && (
          <View style={[cs.summarySubPill, { backgroundColor: color + '15' }]}>
            <Text style={[cs.summarySubText, { color }]}>{subtitle}</Text>
          </View>
        )}
      </View>
      {icon && (
        <View style={[cs.summaryIconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      )}
    </View>

    <View style={[cs.summaryBottomLine, { backgroundColor: color }]} />
  </Card>
);

// ═══════════════════════════════════════════════════════════════
//  LIST ITEM
// ═══════════════════════════════════════════════════════════════
export const ListItem = ({
  title,
  subtitle,
  rightText,
  icon,
  onPress,
  onDelete,
  onEdit,
  rightIcon = 'chevron-forward',
}) => (
  <View style={cs.listItemCard}>
    <View style={cs.listItemTopAccent} />

    <TouchableOpacity
      style={cs.listItemBody}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={cs.listItemLeftAccent} />

      {icon && (
        <View style={cs.listItemIconBox}>
          <Ionicons name={icon} size={18} color={C.primary} />
        </View>
      )}

      <View style={cs.listItemInfo}>
        <Text style={cs.listItemTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={cs.listItemSub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      {rightText && (
        <View style={cs.listItemRightPill}>
          <Text style={cs.listItemRightTxt}>{rightText}</Text>
        </View>
      )}

      <View style={cs.listItemChevronBox}>
        <Ionicons name={rightIcon} size={13} color={C.textMute} />
      </View>
    </TouchableOpacity>

    {(onEdit || onDelete) && (
      <View style={cs.listItemActions}>
        {onEdit && (
          <TouchableOpacity style={cs.listEditBtn} onPress={onEdit} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={14} color={C.primary} />
            <Text style={cs.listEditTxt}>Edit</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={cs.listDeleteBtn} onPress={onDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={14} color={C.red} />
            <Text style={cs.listDeleteTxt}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </View>
);

// ═══════════════════════════════════════════════════════════════
//  BADGE
// ═══════════════════════════════════════════════════════════════
const BADGE_VARIANTS = {
  primary: { bg: '#ede9fe', border: C.primary + '45', text: C.primary  },
  danger:  { bg: '#fef2f2', border: C.red     + '45', text: C.red      },
  success: { bg: '#f0fdf4', border: C.green   + '45', text: C.green    },
  warning: { bg: '#fffbeb', border: C.amber   + '45', text: C.amber    },
};

export const Badge = ({ label, variant = 'primary', style }) => {
  const bv = BADGE_VARIANTS[variant] || BADGE_VARIANTS.primary;
  return (
    <View style={[cs.badge, { backgroundColor: bv.bg, borderColor: bv.border }, style]}>
      <Text style={[cs.badgeText, { color: bv.text }]}>{label}</Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
//  EMPTY STATE
// ═══════════════════════════════════════════════════════════════
export const EmptyState = ({ icon, title, message, action, actionTitle }) => (
  <View style={cs.emptyWrap}>
    {icon && (
      <View style={cs.emptyIconRing}>
        <View style={cs.emptyIconBox}>
          <Ionicons name={icon} size={30} color={C.textMute} />
        </View>
      </View>
    )}
    <Text style={cs.emptyTitle}>{title}</Text>
    <Text style={cs.emptyMsg}>{message}</Text>
    {action && actionTitle && (
      <TouchableOpacity style={cs.emptyBtn} onPress={action} activeOpacity={0.85}>
        <View style={cs.emptyBtnBlob} />
        <Ionicons name="add-circle" size={16} color="#fff" />
        <Text style={cs.emptyBtnTxt}>{actionTitle}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ═══════════════════════════════════════════════════════════════
//  SELECT FIELD
// ═══════════════════════════════════════════════════════════════
export const SelectField = ({ label, value, items, onSelect, error, placeholder }) => {
  const [showModal, setShowModal] = React.useState(false);
  const selectedItem = items.find(item => item.id === value);
  const hasValue = !!value;

  return (
    <View style={cs.inputOuter}>
      {label && (
        <View style={cs.inputLabelRow}>
          <Text style={cs.inputLabel}>{label}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[cs.inputBox, error && cs.inputBoxError, hasValue && cs.inputBoxFilled]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <View style={[cs.inputLeftIcon, { backgroundColor: hasValue ? '#ede9fe' : C.bg }]}>
          <Ionicons name="list-outline" size={17} color={hasValue ? C.primary : C.textMute} />
        </View>
        <Text style={[cs.inputText, { paddingLeft: 8 }, !hasValue && { color: C.textMute }]}>
          {selectedItem ? selectedItem.name : placeholder || 'Select…'}
        </Text>
        <View style={cs.inputTrail}>
          <Ionicons name="chevron-down" size={16} color={C.textMute} />
        </View>
      </TouchableOpacity>

      {error && (
        <View style={cs.inputErrorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={C.red} />
          <Text style={cs.inputErrorText}>{error}</Text>
        </View>
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <TouchableOpacity
          style={cs.selectOverlay}
          onPress={() => setShowModal(false)}
          activeOpacity={1}
        >
          <View style={cs.selectSheet}>
            <View style={cs.selectHandle} />

            <View style={cs.selectHeader}>
              <View style={cs.selectHeaderBlob} />
              <View style={cs.selectHeaderIconBox}>
                <Ionicons name="list-outline" size={16} color={C.primary} />
              </View>
              <Text style={cs.selectHeaderTitle}>{label}</Text>
              <TouchableOpacity style={cs.selectCloseBtn} onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={16} color={C.textMid} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={cs.selectList}
              renderItem={({ item }) => {
                const active = item.id === value;
                return (
                  <TouchableOpacity
                    style={[cs.selectItem, active && cs.selectItemActive]}
                    onPress={() => { onSelect(item.id); setShowModal(false); }}
                    activeOpacity={0.78}
                  >
                    {active && <View style={cs.selectItemDot} />}
                    <Text style={[cs.selectItemText, active && cs.selectItemTextActive]}>
                      {item.name}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
//  LOADING SPINNER
// ═══════════════════════════════════════════════════════════════
export const LoadingSpinner = () => (
  <View style={cs.loadingWrap}>
    <View style={cs.loadingCard}>
      <View style={cs.loadingCardBlob} />
      <View style={cs.loadingSpinnerBox}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
      <Text style={cs.loadingTitle}>Loading…</Text>
      <Text style={cs.loadingHint}>Please wait a moment</Text>
    </View>
  </View>
);

// ═══════════════════════════════════════════════════════════════
//  SEARCH BAR
// ═══════════════════════════════════════════════════════════════
export const SearchBar = ({ placeholder, value, onChangeText, onFilterPress }) => (
  <View style={cs.searchWrap}>
    <View style={cs.searchBox}>
      <View style={cs.searchIconBox}>
        <Ionicons name="search-outline" size={16} color={C.primary} />
      </View>
      <TextInput
        style={cs.searchInput}
        placeholder={placeholder}
        placeholderTextColor={C.textMute}
        value={value}
        onChangeText={onChangeText}
      />
      {value?.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={cs.searchClearBtn} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={16} color={C.textMute} />
        </TouchableOpacity>
      )}
    </View>
    {onFilterPress && (
      <TouchableOpacity style={cs.filterBtn} onPress={onFilterPress} activeOpacity={0.8}>
        <Ionicons name="options-outline" size={18} color={C.primary} />
      </TouchableOpacity>
    )}
  </View>
);

// ═══════════════════════════════════════════════════════════════
//  FAB — Floating Action Button
// ═══════════════════════════════════════════════════════════════
export const FAB = ({ icon, onPress }) => (
  <TouchableOpacity style={cs.fab} onPress={onPress} activeOpacity={0.85}>
    <View style={cs.fabBlob} />
    <Ionicons name={icon} size={26} color="#fff" />
  </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════
//  STAT CARD
// ═══════════════════════════════════════════════════════════════
export const StatCard = ({ label, value, change, changeColor = C.green }) => (
  <View style={cs.statCard}>
    <View style={[cs.statCardBlob, { backgroundColor: changeColor + '10' }]} />
    <Text style={cs.statLabel}>{label}</Text>
    <Text style={cs.statValue}>{value}</Text>
    {change && (
      <View style={[cs.statChangePill, { backgroundColor: changeColor + '18' }]}>
        <Text style={[cs.statChangeTxt, { color: changeColor }]}>{change}</Text>
      </View>
    )}
    <View style={[cs.statBottomBar, { backgroundColor: changeColor }]} />
  </View>
);

// ═══════════════════════════════════════════════════════════════
//  ACCESS DENIED
// ═══════════════════════════════════════════════════════════════
export const AccessDenied = ({ featureName = 'This feature' }) => (
  <View style={cs.accessWrap}>
    <View style={cs.accessCard}>
      <View style={cs.accessBlobTL} />
      <View style={cs.accessBlobBR} />

      <View style={cs.accessIconRing}>
        <View style={cs.accessIconBox}>
          <Ionicons name="lock-closed" size={28} color={C.red} />
        </View>
      </View>

      <Text style={cs.accessTitle}>Access Denied</Text>

      <View style={cs.accessFeaturePill}>
        <Ionicons name="apps-outline" size={13} color={C.textMid} />
        <Text style={cs.accessFeatureTxt}>{featureName}</Text>
      </View>

      <Text style={cs.accessMsg}>
        You don't have permission to access this feature
      </Text>

      <View style={cs.accessDivider} />

      <View style={cs.accessHint}>
        <Ionicons name="information-circle-outline" size={14} color={C.textMute} />
        <Text style={cs.accessHintTxt}>
          Contact your administrator to request access
        </Text>
      </View>
    </View>
  </View>
);

// ═══════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════
const cs = StyleSheet.create({

  // ─── Button
  btn: {
    paddingVertical: 14, paddingHorizontal: 22,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 0,
  },
  btnSecondary: {
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  btnDisabled:    { opacity: 0.52 },
  btnGlow: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.13)', top: -36, right: -18,
  },
  btnRow:         { flexDirection: 'row', alignItems: 'center', gap: 9 },
  btnIconBox: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText:          { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  btnTextSecondary: { color: C.primary },

  // ─── InputField
  inputOuter:   { marginBottom: 14 },
  inputLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 7, marginLeft: 2,
  },
  inputLabel: {
    fontSize: 12, fontWeight: '800', color: C.textMid,
    textTransform: 'uppercase', letterSpacing: 0.6, flex: 1,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, backgroundColor: C.card,
    overflow: 'hidden', minHeight: 50,
  },
  inputBoxError:    { borderColor: C.red + 'cc' },
  inputBoxFilled:   { borderColor: C.primary + '55' },
  inputBoxDisabled: { backgroundColor: '#f8fafc', opacity: 0.65 },
  inputLeftIcon: {
    width: 46, alignSelf: 'stretch',
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: C.border,
  },
  inputText: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 12,
    fontSize: 14, color: C.text, fontWeight: '500',
  },
  inputMultiline: { textAlignVertical: 'top', paddingTop: 12 },
  inputTrail: { paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  inputErrorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, marginLeft: 3,
  },
  inputErrorText: { color: C.red, fontSize: 12, fontWeight: '600' },

  // ─── Card
  card: {
    backgroundColor: C.card, borderRadius: 18,
    padding: 16, marginBottom: 10,
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },

  // ─── SummaryCard
  summaryCard:    { paddingBottom: 14, position: 'relative' },
  summaryAccentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
  },
  summaryBlob: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40, top: -25, right: -20,
  },
  summaryCardInner: {
    flexDirection: 'row', alignItems: 'center', paddingLeft: 12, gap: 14,
  },
  summaryCardLabel: {
    fontSize: 11, fontWeight: '700', color: C.textMute,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5,
  },
  summaryCardValue: {
    fontSize: 26, fontWeight: '800', letterSpacing: -0.7, marginBottom: 6,
  },
  summarySubPill: {
    alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
  },
  summarySubText: { fontSize: 11.5, fontWeight: '700' },
  summaryIconBox: {
    width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  summaryBottomLine: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, opacity: 0.4,
  },

  // ─── ListItem
  listItemCard: {
    backgroundColor: C.card, borderRadius: 16,
    marginBottom: 8, overflow: 'hidden',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 5, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  listItemTopAccent: { height: 3, backgroundColor: C.primary, opacity: 0.45 },
  listItemBody: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingRight: 12, gap: 10,
  },
  listItemLeftAccent: {
    width: 3, height: 36, borderRadius: 2,
    backgroundColor: C.primary, marginLeft: 10, opacity: 0.55,
  },
  listItemIconBox: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center',
  },
  listItemInfo:   { flex: 1 },
  listItemTitle:  { fontSize: 14, fontWeight: '700', color: C.text, letterSpacing: -0.1 },
  listItemSub:    { fontSize: 12, color: C.textMute, marginTop: 2, fontWeight: '500' },
  listItemRightPill: {
    backgroundColor: '#ede9fe', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, marginRight: 4,
  },
  listItemRightTxt: { fontSize: 12, fontWeight: '700', color: C.primary },
  listItemChevronBox: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  listItemActions: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: C.bg, gap: 8,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  listEditBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ede9fe', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  listEditTxt:   { fontSize: 12.5, fontWeight: '700', color: C.primary },
  listDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  listDeleteTxt: { fontSize: 12.5, fontWeight: '700', color: C.red },

  // ─── Badge
  badge: {
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1,
  },
  badgeText: { fontSize: 11.5, fontWeight: '700' },

  // ─── Empty State
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 48, gap: 10,
  },
  emptyIconRing: {
    width: 90, height: 90, borderRadius: 26,
    backgroundColor: C.border + '55',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 8, elevation: 3,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.4, textAlign: 'center',
  },
  emptyMsg: {
    fontSize: 13.5, color: C.textMute, fontWeight: '500', textAlign: 'center', lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primary, paddingHorizontal: 22, paddingVertical: 13,
    borderRadius: 15, marginTop: 8, overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  emptyBtnBlob: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.12)', top: -28, right: -14,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // ─── SelectField modal
  selectOverlay: {
    flex: 1, backgroundColor: 'rgba(15,12,51,0.55)', justifyContent: 'flex-end',
  },
  selectSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '70%', paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    shadowColor: C.navy, shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 14,
  },
  selectHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: C.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 2,
  },
  selectHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.bg, overflow: 'hidden',
  },
  selectHeaderBlob: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#ede9fe', opacity: 0.3, top: -28, left: -14,
  },
  selectHeaderIconBox: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center',
  },
  selectHeaderTitle: {
    flex: 1, fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2,
  },
  selectCloseBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  selectList: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10 },
  selectItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 14,
    borderRadius: 13, marginBottom: 6,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  selectItemActive: { backgroundColor: '#ede9fe', borderColor: C.primary + '55' },
  selectItemDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary,
  },
  selectItemText:       { flex: 1, fontSize: 14, color: C.textMid, fontWeight: '600' },
  selectItemTextActive: { color: C.primary, fontWeight: '800' },

  // ─── Loading Spinner
  loadingWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg,
  },
  loadingCard: {
    alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 26, padding: 32, overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
    borderWidth: 1, borderColor: C.border,
  },
  loadingCardBlob: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#ede9fe', opacity: 0.35, top: -35, right: -25,
  },
  loadingSpinnerBox: {
    width: 62, height: 62, borderRadius: 18, backgroundColor: '#ede9fe',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  loadingTitle: { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  loadingHint:  { fontSize: 12, color: C.textMute, fontWeight: '500' },

  // ─── Search Bar
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card,
    paddingHorizontal: 14, paddingVertical: 10,
    gap: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    overflow: 'hidden',
  },
  searchIconBox: {
    width: 42, height: 42,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ede9fe', borderRightWidth: 1, borderRightColor: C.border,
  },
  searchInput: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12,
    fontSize: 14, color: C.text, fontWeight: '500',
  },
  searchClearBtn: { paddingHorizontal: 10 },
  filterBtn: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: '#ede9fe',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.primary + '30',
  },

  // ─── FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 58, height: 58, borderRadius: 18,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42, shadowRadius: 14, elevation: 10,
  },
  fabBlob: {
    position: 'absolute', width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.14)', top: -22, right: -18,
  },

  // ─── Stat Card
  statCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    alignItems: 'center', overflow: 'hidden', position: 'relative',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  statCardBlob: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35, top: -25, right: -20,
  },
  statLabel: {
    fontSize: 10.5, color: C.textMute, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7,
  },
  statValue: {
    fontSize: 23, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginBottom: 7,
  },
  statChangePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statChangeTxt:  { fontSize: 12, fontWeight: '700' },
  statBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, opacity: 0.45,
  },

  // ─── Access Denied
  accessWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bg, paddingHorizontal: 24,
  },
  accessCard: {
    backgroundColor: C.card, borderRadius: 28,
    padding: 34, width: '100%', alignItems: 'center', overflow: 'hidden',
    shadowColor: C.navy, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13, shadowRadius: 24, elevation: 10,
    borderWidth: 1, borderColor: C.border,
  },
  accessBlobTL: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: '#fee2e2', opacity: 0.38, top: -45, left: -35,
  },
  accessBlobBR: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fecaca', opacity: 0.22, bottom: -28, right: -18,
  },
  accessIconRing: {
    width: 86, height: 86, borderRadius: 24,
    backgroundColor: '#fee2e230',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  accessIconBox: {
    width: 68, height: 68, borderRadius: 20, backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  accessTitle: {
    fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.4, marginBottom: 12,
  },
  accessFeaturePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.bg, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: C.border,
  },
  accessFeatureTxt: { fontSize: 13, fontWeight: '700', color: C.textMid },
  accessMsg: {
    fontSize: 14, color: C.textMid, textAlign: 'center', lineHeight: 21, fontWeight: '500',
  },
  accessDivider: {
    width: 40, height: 2, borderRadius: 1, backgroundColor: C.border, marginVertical: 16,
  },
  accessHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accessHintTxt: {
    fontSize: 12.5, color: C.textMute, fontWeight: '500', textAlign: 'center', flex: 1,
  },
});