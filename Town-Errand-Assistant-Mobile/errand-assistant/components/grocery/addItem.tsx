
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { themes } from '@/constants/theme';

const CATEGORIES = [
  'Food',
  'Toiletries',
  'Cleaning',
  'Household',
  'Personal Care',
  'Electronics',
  'Clothing',
  'Books',
  'Other',
];

const COLORS: any = {
  Food: '#10B981',
  Toiletries: '#8B5CF6',
  Cleaning: '#F59E0B',
  Household: '#3B82F6',
  'Personal Care': '#EC4899',
  Electronics: '#06B6D4',
  Clothing: '#F97316',
  Books: '#8B5CF6',
  Other: '#6B7280',
};

type AddItemModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (item: {
    name: string;
    quantity: string;
    category: string;
    estimatedPrice: string;
  }) => void;
  initialData?: {
    name: string;
    quantity: string;
    category: string;
    estimatedPrice: string;
  } | null;
  editMode?: boolean;
  onScanRequest: () => void;
};

export default function AddItemModal({
  visible,
  onClose,
  onSave,
  initialData,
  editMode,
  onScanRequest,
}: AddItemModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('Food');
  const [estimatedPrice, setEstimatedPrice] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name || '');
        setQuantity(initialData.quantity || '1');
        setCategory(initialData.category || 'Food');
        setEstimatedPrice(initialData.estimatedPrice || '');
      } else {
        // Reset defaults for new item
        setName('');
        setQuantity('1');
        setCategory('Food');
        setEstimatedPrice('');
      }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name,
        quantity,
        category,
        estimatedPrice,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            
            {/* Header  */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {editMode ? 'Edit Item' : 'New Item'}
              </Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color={themes.light.colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!editMode && (
                <Pressable
                  style={styles.scanBanner}
                  onPress={onScanRequest}
                >
                  <LinearGradient
                    colors={[themes.light.colors.primary, themes.light.colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.scanBannerGradient}
                  >
                    <Ionicons name='scan' size={20} color={themes.light.colors.surface} />
                    <Text style={styles.scanBannerText}>
                      Scan Product Label
                    </Text>
                  </LinearGradient>
                </Pressable>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>ITEM NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder='e.g. Milk, Bread'
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={themes.light.colors.textSecondary}
                  autoFocus={!initialData} 
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>PRICE (R)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder='0.00'
                    value={estimatedPrice}
                    onChangeText={setEstimatedPrice}
                    keyboardType='decimal-pad'
                    placeholderTextColor={themes.light.colors.textSecondary}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 0.6 }]}>
                  <Text style={styles.label}>QTY</Text>
                  <TextInput
                    style={styles.input}
                    placeholder='1'
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType='number-pad'
                    placeholderTextColor={themes.light.colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>CATEGORY</Text>
                {/*  Categories */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsContainer}
                >
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[
                        styles.chip,
                        category === cat && {
                          backgroundColor: COLORS[cat] || COLORS.Other,
                          borderColor: COLORS[cat] || COLORS.Other,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          category === cat && { color: themes.light.colors.surface },
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Bottom Buttons (Save/Cancel) */}
              <View style={styles.buttonRow}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.saveBtn, !name.trim() && { opacity: 0.5 }]}
                  onPress={handleSave}
                  disabled={!name.trim()}
                >
                  <Text style={styles.saveBtnText}>Save Item</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%', 
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: themes.light.colors.text,
  },
  scanBanner: {
    marginBottom: 24,
    shadowColor: themes.light.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBannerGradient: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanBannerText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: themes.light.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: themes.light.colors.border,
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: themes.light.colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  chipsContainer: {
    paddingRight: 20, 
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: themes.light.colors.border,
    backgroundColor: 'white',
    marginRight: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: themes.light.colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: themes.light.colors.textSecondary,
    fontSize: 16,
  },
  saveBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: themes.light.colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});