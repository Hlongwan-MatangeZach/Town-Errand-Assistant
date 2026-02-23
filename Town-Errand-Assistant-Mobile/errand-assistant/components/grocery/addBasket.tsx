// AddBasketModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { themes } from '@/constants/theme';

type AddBasketModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, budget: string) => void;
  editMode?: boolean;
  initialName?: string;
  initialBudget?: string;
};

export default function AddBasketModal({
  visible,
  onClose,
  onSave,
  editMode = false,
  initialName = "",
  initialBudget = "",
}: AddBasketModalProps) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setBudget(initialBudget);
    }
  }, [visible, initialName, initialBudget]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name, budget);
      handleClose();
    }
  };

  const handleClose = () => {
    setName('');
    setBudget('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType='slide' transparent>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {editMode ? 'Edit Basket' : 'New Basket'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name='close' size={24} color={themes.light.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>BASKET NAME</Text>
              <TextInput
                style={styles.input}
                placeholder='e.g. Weekly Groceries'
                placeholderTextColor={themes.light.colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>BUDGET (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder='R 0.00'
                placeholderTextColor={themes.light.colors.textSecondary}
                value={budget}
                onChangeText={setBudget}
                keyboardType='decimal-pad'
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addBtn, !name.trim() && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={!name.trim()}
              >
                <Text style={styles.addText}>
                  {editMode ? 'Save Changes' : 'Create Basket'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: themes.light.colors.text,
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
    backgroundColor: themes.light.colors.background,
    borderWidth: 1,
    borderColor: themes.light.colors.border,
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: themes.light.colors.text,
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
    backgroundColor: themes.light.colors.background,
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '600',
    color: themes.light.colors.textSecondary,
  },
  addBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: themes.light.colors.primary,
    alignItems: 'center',
  },
  addText: {
    color: 'white',
    fontWeight: '700',
  },
});
