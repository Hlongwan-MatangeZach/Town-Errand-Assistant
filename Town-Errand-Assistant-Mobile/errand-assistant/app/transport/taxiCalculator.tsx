import { themes } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import Navigation from '../../components/navigation';
import ConfirmationModal from '../../components/ui/ConfirmationModal';


const MAX_GROUPS = 10;
type PaymentEntry = {
  people: string;
  amount: string;
};
const sanitizePeople = (value: string) => value.replace(/[^0-9]/g, '');
const sanitizeAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const firstDotIndex = cleaned.indexOf('.');
  if (firstDotIndex === -1) return cleaned;
  return (
    cleaned.slice(0, firstDotIndex + 1) +
    cleaned.slice(firstDotIndex + 1).replace(/\./g, '')
  );
};

export default function TaxiCalculator() {
  const [seats, setSeats] = useState('');
  const [fare, setFare] = useState('');
  const [focusedInput, setFocusedInput] = useState<'passengers' | 'fare' | null>(null);
  const [tripCount, setTripCount] = useState(0);
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { people: '1', amount: '' },
  ]);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  const fareNum = useMemo(() => parseFloat(fare) || 0, [fare]);
  const expectedTotal = useMemo(() => {
    const s = parseFloat(seats) || 0;
    return s * fareNum;
  }, [seats, fareNum]);

  const totalPaid = useMemo(() => {
    return payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  }, [payments]);

  const totalPeoplePaid = useMemo(() => {
    return payments.reduce((s, p) => s + (parseInt(p.people) || 0), 0);
  }, [payments]);

  const unpaidPeople = useMemo(() => {
    const s = parseInt(seats) || 0;
    return Math.max(0, s - totalPeoplePaid);
  }, [seats, totalPeoplePaid]);

  const balance = useMemo(() => totalPaid - expectedTotal, [totalPaid, expectedTotal]);
  const isBalanced = Math.abs(balance) < 0.01;

  const paidStatus = useMemo(() => {
    if (expectedTotal === 0) return 'Pending';
    if (isBalanced) return 'Paid';
    return balance > 0 ? 'Overpaid' : 'Partial';
  }, [expectedTotal, isBalanced, balance]);

  const clearAll = useCallback(() => {
    setResetModalVisible(true);
  }, []);

  const confirmReset = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSeats('');
    setFare('');
    setPayments([{ people: '1', amount: '' }]);
    setTripCount((prev) => prev+1);
    setResetModalVisible(false);
  }, []);

  const addPayment = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPayments((prev) => {
      if (prev.length >= MAX_GROUPS) {
        setLimitModalVisible(true);
        return prev;
      }
      return [...prev, { people: '1', amount: '' }];
    });
  }, []);
  const removePayment = useCallback((index: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPayments((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updatePayment = useCallback(
    (index: number, key: keyof PaymentEntry, value: string) => {
      const clean = key === 'people' ? sanitizePeople(value) : sanitizeAmount(value);
      setPayments((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [key]: clean } : item))
      );
    },
    []
  );

  const groupBalances = useMemo(() => {
    const f = parseFloat(fare) || 0;
    return payments.map((p, i) => {
      const peopleCount = parseInt(p.people) || 0;
      const paidAmount = parseFloat(p.amount) || 0;
      const owedAmount = peopleCount * f;
      return { index: i, balance: paidAmount - owedAmount };
    });
  }, [payments, fare]);

  const relevantBalances = useMemo(
    () => groupBalances.filter((b) => Math.abs(b.balance) > 0.009),
    [groupBalances]
  );

  const totalChangeOwed = useMemo(
    () => groupBalances.filter((b) => b.balance > 0).reduce((s, c) => s + c.balance, 0),
    [groupBalances]
  );

  const totalShortfall = useMemo(
    () => groupBalances.filter((b) => b.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0),
    [groupBalances]
  );
  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor={styles.container.backgroundColor} />

      {/* Header */}
      <View style={styles.header}>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Taxi Calculator</Text>
          <Text style={styles.headerSubtitle}>
            Instantly verify fares and balances during trips
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name='car' size={29} color={themes.light.colors.primary} />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>

          {/* TAXI FARE INPUTS */}
          <View style={styles.essentialContainer}>
            <Text style={styles.essentialTitle}>Taxi Fare Inputs</Text>

            <View style={styles.essentialWrapper}>
              <View
                style={[styles.inputContainer, focusedInput === 'passengers' && styles.inputContainerActive]}
              >
                <Ionicons
                  name='people-outline'
                  size={20}
                  color={
                    focusedInput === 'passengers'
                      ? themes.light.colors.primary
                      : themes.light.colors.textSecondary
                  }
                />
                <TextInput
                  style={styles.textInput}
                  placeholder='Passengers'
                  placeholderTextColor={themes.light.colors.textSecondary}
                  keyboardType='number-pad'
                  value={seats}
                  onChangeText={(v) => setSeats(sanitizePeople(v))}
                  onFocus={() => setFocusedInput('passengers')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View
                style={[styles.inputContainer, focusedInput === 'fare' && styles.inputContainerActive]}
              >
                <Text
                  style={[
                    styles.currencyIcon,
                    {
                      color:
                        focusedInput === 'fare'
                          ? themes.light.colors.primary
                          : themes.light.colors.textSecondary,
                    },
                  ]}
                >
                  R
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder='Fare per seat'
                  placeholderTextColor={themes.light.colors.textSecondary}
                  keyboardType='decimal-pad'
                  value={fare}
                  onChangeText={(v) => setFare(sanitizeAmount(v))}
                  onFocus={() => setFocusedInput('fare')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View style={styles.totalFareSection}>
              <Text style={styles.totalLabel}>Total Fare:</Text>
              <Text style={styles.totalValue}>R{expectedTotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* PASSENGER GROUPS */}
          <View style={styles.essentialContainer}>
            <Text style={styles.essentialTitle}>Passenger Groups</Text>

            {payments.map((p, i) => (
              <View key={i} style={styles.groupItem}>
                <View style={styles.groupBadge}>
                  <Text style={styles.groupBadgeText}>{i + 1}</Text>
                </View>

                <View style={styles.miniInputContainer}>
                  <Ionicons name='person-outline' size={12} color={themes.light.colors.textSecondary} />
                  <TextInput
                    value={p.people}
                    onChangeText={(v) => updatePayment(i, 'people', v)}
                    keyboardType='number-pad'
                    placeholder='1'
                    placeholderTextColor={themes.light.colors.textSecondary}
                    style={styles.miniTextInput}
                  />
                </View>

                <View style={styles.miniInputContainer}>
                  <Text style={styles.miniCurrency}>R</Text>
                  <TextInput
                    value={p.amount}
                    onChangeText={(v) => updatePayment(i, 'amount', v)}
                    keyboardType='decimal-pad'
                    placeholder='0.00'
                    placeholderTextColor={themes.light.colors.textSecondary}
                    style={styles.miniTextInput}
                  />
                </View>

                {payments.length > 1 && (
                  <Pressable onPress={() => removePayment(i)} style={styles.removeBtn}>
                    <Ionicons name='trash-outline' size={14} color={themes.light.colors.warning} />
                  </Pressable>
                )}
              </View>
            ))}

            <Pressable onPress={addPayment} style={styles.addFullBtn}>
              <Ionicons name='add-circle-outline' size={20} color={themes.light.colors.surface} />
              <Text style={styles.addFullBtnText}>Add Another Group</Text>
            </Pressable>

            <View style={styles.footerMeta}>
              <View style={styles.metaBadge}>
                <Ionicons name='layers-outline' size={12} color={themes.light.colors.primary} />
                <Text style={styles.metaBadgeText}>{payments.length}/{MAX_GROUPS} Groups</Text>
              </View>
              <View style={styles.metaBadge}>
                <Ionicons name='flash-outline' size={12} color='#F59E0B' />
                <Text style={styles.metaBadgeText}>Real-time Calc</Text>
              </View>
            </View>
          </View>

          {/* PAYMENT STATUS BREAKDOWN */}
          {relevantBalances.length > 0 && (
            <View style={[styles.essentialContainer, { marginTop: 10 }]}>
              <Text style={styles.essentialTitle}>Payment Status</Text>
              {relevantBalances.map((c) => {
                const isOverpaid = c.balance > 0;
                return (
                  <View key={c.index} style={styles.groupItem}>
                    <View
                      style={[
                        styles.groupBadge,
                        { backgroundColor: isOverpaid ? '#10B98120' : '#EF444420' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.groupBadgeText,
                          { color: isOverpaid ? themes.light.colors.success : themes.light.colors.warning },
                        ]}
                      >
                        {c.index + 1}
                      </Text>
                    </View>
                    <Text style={styles.groupTitle}>Group {c.index + 1}</Text>
                    <View style={isOverpaid ? styles.changeTag : styles.shortfallTag}>
                      <Text style={isOverpaid ? styles.changeTagText : styles.shortfallTagText}>
                        {isOverpaid ? `R${c.balance.toFixed(2)}` : `-R${Math.abs(c.balance).toFixed(2)}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* TRIP SUMMARY */}
          <View style={[styles.essentialContainer, { marginTop: 10 }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.essentialTitle}>Trip Summary</Text>
              <View
                style={[
                  styles.statusPill,
                  paidStatus === 'Paid' ? styles.statusPaid : styles.statusUnpaid,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    paidStatus === 'Paid' ? styles.statusTextPaid : styles.statusTextUnpaid,
                  ]}
                >
                  {paidStatus}
                </Text>
              </View>
            </View>

            <View style={styles.summaryList}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Expected total fare:</Text>
                <Text style={styles.summaryVal}>R{expectedTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Total collected amount:</Text>
                <Text style={styles.summaryVal}>R{totalPaid.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Unpaid passenger count:</Text>
                <Text style={styles.summaryVal}>{fareNum > 0 ? unpaidPeople : 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Number of groups added:</Text>
                <Text style={styles.summaryVal}>{payments.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>People recorded:</Text>
                <Text style={styles.summaryVal}>{totalPeoplePaid}</Text>
              </View>
            </View>

            {!isBalanced && expectedTotal > 0 && (
              <View
                style={[
                  styles.balanceBanner,
                  balance > 0 ? styles.balanceOver : styles.balanceUnder,
                ]}
              >
                <Ionicons
                  name={balance > 0 ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                  size={16}
                  color={balance > 0 ? themes.light.colors.primary : '#B45309'}
                />
                <Text
                  style={[
                    styles.balanceBannerText,
                    { color: balance > 0 ? themes.light.colors.primary : '#B45309' },
                  ]}
                >
                  {balance > 0
                    ? `Overpaid by R${balance.toFixed(2)}`
                    : `Underpaid by R${Math.abs(balance).toFixed(2)}`}
                </Text>
              </View>
            )}
          </View>

          {/* RESET BUTTON */}
          <View style={{ marginTop: 20, marginBottom: 10 }}>
            <Pressable onPress={clearAll} style={styles.resetWrap}>
              <LinearGradient
                colors={[themes.light.colors.primary, themes.light.colors.primary + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resetBtn}
              >
                <Ionicons name='refresh' size={18} color={themes.light.colors.surface} />
                <Text style={styles.resetText}>Reset Trip</Text>
              </LinearGradient>
            </Pressable>
            <Text style={styles.resetHint}>Current Trip #{tripCount + 1}</Text>
          </View>

          <View style={{ height: 20 }} />

        </ScrollView>

      </KeyboardAvoidingView>
      <Navigation />
      
      <ConfirmationModal
        visible={resetModalVisible}
        title="Reset Trip"
        message="Are you sure you want to clear everything?"
        onConfirm={confirmReset}
        onCancel={() => setResetModalVisible(false)}
        confirmText="Reset"
        type="danger"
      />

      <ConfirmationModal
        visible={limitModalVisible}
        title="Limit Reached"
        message="You can only add up to 10 passenger groups."
        onConfirm={() => setLimitModalVisible(false)}
        onCancel={() => setLimitModalVisible(false)}
        confirmText="OK"
        type="info"
        showCancelButton={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themes.light.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: themes.light.colors.background,

  },

  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: themes.light.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: themes.light.colors.text,
  },
  headerIcon: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 10,
  },

  essentialContainer: {
    paddingVertical: 1,
  },
  essentialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themes.light.colors.text,
    marginBottom: 10,
  },
  essentialWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 48,
  },
  inputContainerActive: {
    borderColor: themes.light.colors.primary,
    backgroundColor: `${themes.light.colors.primary}10`,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: themes.light.colors.text,
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  currencyIcon: {
    fontSize: 16,
    fontWeight: '700',
  },

  totalFareSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: themes.light.colors.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: themes.light.colors.text,
  },
  groupItem: {
    backgroundColor: themes.light.colors.surface,
    borderRadius: 14,
    padding: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: themes.light.colors.surface + '20',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  groupBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: themes.light.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: themes.light.colors.primary,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  changeTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeTagText: {
    fontSize: 12,
    fontWeight: '900',
    color: themes.light.colors.success,
  },
  shortfallTag: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  shortfallTagText: {
    fontSize: 12,
    fontWeight: '900',
    color: themes.light.colors.warning,
  },
  removeBtn: {
    padding: 6,
  },
  miniInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    
  },
  miniTextInput: {
    flex: 1,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: themes.light.colors.text,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    height: '100%',
  },
  miniCurrency: {
    fontSize: 11,
    fontWeight: '700',
    color: themes.light.colors.text,
  },
  addFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themes.light.colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
    shadowColor: themes.light.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addFullBtnText: {
    color: themes.light.colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  footerMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusPaid: {
    backgroundColor: '#10B98120',
  },
  statusUnpaid: {
    backgroundColor: '#EF444420',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextPaid: {
    color: themes.light.colors.success,
  },
  statusTextUnpaid: {
    color: themes.light.colors.warning,
  },
  summaryList: {
    backgroundColor: themes.light.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  summaryKey: {
    fontSize: 13,
    color: themes.light.colors.textSecondary,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 13,
    color: themes.light.colors.text,
    fontWeight: '700',
  },
  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  balanceOver: {
    backgroundColor: '#DBEAFE',
  },
  balanceUnder: {
    backgroundColor: '#FEF3C7',
  },
  balanceBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resetWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  resetText: {
    color: themes.light.colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  resetHint: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 11,
    color: themes.light.colors.textSecondary,
    fontWeight: '600',
  },
});
