import { themes } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

type AddBasketModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, budget: string) => void;
  editMode?: boolean;
  initialName?: string;
  initialBudget?: string;
};

const sanitizeBudget = (raw: string) => {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join('')}`;
};

export default function AddBasketModal({
  visible,
  onClose,
  onSave,
  editMode = false,
  initialName = '',
  initialBudget = '',
}: AddBasketModalProps) {
  const nameRef = useRef<TextInput>(null);
  const budgetRef = useRef<TextInput>(null);

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [nameFocused, setNameFocused] = useState(false);

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setBudget(initialBudget);

      const t = setTimeout(() => nameRef.current?.focus(), 220);
      return () => clearTimeout(t);
    }
  }, [visible, initialName, initialBudget]);

  const isNameValid = useMemo(() => name.trim().length >= 2, [name]);
  const canSave = isNameValid;

  // Close modal (always)
  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  // Backdrop tap: dismiss keyboard first, only close modal if keyboard is already closed
  const handleBackdropPress = () => {
    if (keyboardOpen) {
      Keyboard.dismiss();
      return;
    }
    onClose();
  };

  const handleSave = () => {
    if (!canSave) return;
    Keyboard.dismiss();
    onSave(name.trim(), budget.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        {/* Tap outside */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />

        <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
            style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={{ width: '100%' }}>
            <View style={styles.modalCard}>
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.title}>{editMode ? 'Edit Basket' : 'New Basket'}</Text>

                <Pressable
                  onPress={handleClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={22} color={themes.light.colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.content}>
                {/* Basket Name */}
                <View style={styles.block}>
                  <Text style={styles.fieldLabel}>Basket Name</Text>

                  <View style={[styles.nameInputWrap, nameFocused && styles.nameInputWrapFocused]}>
                    <TextInput
                      ref={nameRef}
                      style={styles.nameInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="My Groceries"
                      placeholderTextColor={themes.light.colors.textSecondary}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => budgetRef.current?.focus()}
                    />

                    {/* Right validation icon */}
                    <View style={styles.nameRightIcon}>
                      {isNameValid ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={themes.light.colors.success}
                        />
                      ) : (
                        <View style={styles.iconPlaceholder} />
                      )}
                    </View>
                  </View>
                </View>

                {/* Budget */}
                <View style={styles.block}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Budget</Text>
                    <View style={styles.optionalChip}>
                      <Text style={styles.optionalChipText}>Optional</Text>
                    </View>
                  </View>

                  <View style={styles.budgetWrap}>
                    <View style={styles.currencyBox}>
                      <Text style={styles.currencyText}>R</Text>
                    </View>

                    <View style={styles.divider} />

                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color={themes.light.colors.textSecondary}
                      style={{ marginLeft: 10 }}
                    />

                    <TextInput
                      ref={budgetRef}
                      style={styles.budgetInput}
                      value={budget}
                      onChangeText={(t) => setBudget(sanitizeBudget(t))}
                      placeholder="Budget"
                      placeholderTextColor={themes.light.colors.textSecondary}
                      keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                      returnKeyType="done"
                      onSubmitEditing={handleSave}
                    />
                  </View>
                </View>

                {/* CTA */}
                <Pressable
                  onPress={handleSave}
                  disabled={!canSave}
                  style={({ pressed }) => [
                    styles.ctaPressable,
                    (!canSave || pressed) && { opacity: !canSave ? 0.55 : 0.9 },
                  ]}
                >
                  <LinearGradient
                    colors={[themes.light.colors.primary, themes.light.colors.primaryAlt]}
                    start={{ x: 0, y: 0.3 }}
                    end={{ x: 1, y: 0.7 }}
                    style={styles.ctaGradient}
                  >
                    <Text style={styles.ctaText}>
                      {editMode ? 'Save Changes' : 'Create Basket'}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Cancel link */}
                <Pressable onPress={handleClose} style={styles.cancelLink}>
                  <Text style={styles.cancelLinkText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: themes.light.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: themes.light.colors.text,
  },
  content: {
    paddingTop: 6,
    paddingBottom: 10,
  },
  block: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: themes.light.colors.text,
    marginBottom: 10,
  },
  nameInputWrap: {
    backgroundColor: themes.light.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themes.light.colors.primaryAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: themes.light.colors.primaryAlt,
    shadowOpacity: 0.0,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  nameInputWrapFocused: {
    borderColor: themes.light.colors.primaryAlt,
    shadowOpacity: 0.18,
    elevation: 3,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    color: themes.light.colors.text,
    paddingVertical: 0,
  },
  nameRightIcon: {
    marginLeft: 10,
  },
  iconPlaceholder: {
    width: 22,
    height: 22,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionalChip: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  optionalChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: themes.light.colors.textSecondary,
  },
  budgetWrap: {
    backgroundColor: themes.light.colors.surface,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
  },
  currencyBox: {
    width: 44,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.55)',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  budgetInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: themes.light.colors.text,
    paddingVertical: 0,
  },
  ctaPressable: {
    marginTop: 22,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: themes.light.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  ctaGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  ctaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelLink: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  cancelLinkText: {
    fontSize: 16,
    fontWeight: '800',
    color: themes.light.colors.primary,
  },
});