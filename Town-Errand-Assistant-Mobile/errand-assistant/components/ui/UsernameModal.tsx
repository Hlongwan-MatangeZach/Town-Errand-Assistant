import { themes } from '@/constants/theme';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface UsernameModalProps {
  visible: boolean;
  onSave: (username: string) => void;
}

export default function UsernameModal({ visible, onSave }: UsernameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);

  const handleSave = () => {
    if (name.trim().length === 0) {
      setError(true);
      return;
    }
    onSave(name.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <View style={styles.card}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={themes.light.gradients.primary}
                  style={styles.iconBackground}
                >
                  <Ionicons name="person-outline" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.subtitle}>
                Please enter a username to personalize your experience.
              </Text>

              <View style={[styles.inputContainer, error && styles.inputError]}>
                <Ionicons
                  name="at-outline"
                  size={20}
                  color={themes.light.colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError(false);
                  }}
                  autoFocus
                  placeholderTextColor={themes.light.colors.textSecondary}
                  maxLength={20}
                />
              </View>

              {error && (
                <Text style={styles.errorText}>Username cannot be empty</Text>
              )}

              <Pressable style={styles.buttonShadow} onPress={handleSave}>
                <LinearGradient
                  colors={themes.light.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: themes.light.colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginTop: -56,
    marginBottom: 16,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: themes.light.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: themes.light.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: themes.light.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themes.light.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themes.light.colors.border,
    paddingHorizontal: 16,
    height: 56,
    width: '100%',
    marginBottom: 12,
  },
  inputError: {
    borderColor: themes.light.colors.danger,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: themes.light.colors.text,
  },
  errorText: {
    color: themes.light.colors.danger,
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginLeft: 4,
  },
  buttonShadow: {
    width: '100%',
    shadowColor: themes.light.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
