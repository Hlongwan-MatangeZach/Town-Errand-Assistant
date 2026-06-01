import { themes } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import InputField from '../../components/ui/InputField';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@/context/UserContext';
import TopToast, { TopToastRef } from '../../components/ui/TopToast';

type ToggleMode = 'login' | 'signup';
type SocialProvider = 'google' | 'apple' | 'facebook';

export default function AuthScreen() {
  const router = useRouter();
  const { setGuestMode, login, signup, socialLogin } = useUser();

  const toastRef = useRef<TopToastRef>(null);

  const [mode, setMode] = useState<ToggleMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

  const isLogin = mode === 'login';

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  /* ============================
     Validation
  ============================ */
  const validateForm = (): boolean => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter both email and password.');
      return false;
    }

    if (!isLogin && !username.trim()) {
      Alert.alert('Required Fields', 'Please enter a username.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return false;
    }

    return true;
  };

  /* Mode Toggle*/
  const toggleMode = (newMode: ToggleMode) => {
    if (mode === newMode) return;
    dismissKeyboard();
    setFormError('');
    setMode(newMode);
  };

  /* Submit Handler*/
  const handleSubmit = async () => {
    setFormError('');
    if (!validateForm()) return;

    setSubmitting(true);
    dismissKeyboard();

    try {
      if (isLogin) {
        const result = await login(email.trim(), password);

        if (result.success) {
          toastRef.current?.show('Welcome back! Happy to have you back.');
          setTimeout(() => router.replace('/home/home'), 800);
        } else {
          setFormError(result.error || 'Invalid email or password.');
        }
      } else {
        const result = await signup(email.trim(), password, username.trim());

        if (result.success) {
          toastRef.current?.show(
            'Account created! 🎉 Please log in with your credentials.'
          );
          setUsername('');
          setEmail('');
          setPassword('');
          setMode('login');
        } else {
          Alert.alert(
            'Registration Failed',
            result.error || 'Failed to create an account.'
          );
        }
      }
    } catch (err: any) {
      Alert.alert(
        'Connection Error',
        err.message ||
          'Unable to connect to the server. Please check your internet connection.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* Social Login*/
  const handleSocialLogin = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    dismissKeyboard();

    try {
      const result = await socialLogin(provider);

      if (result.success) {
        toastRef.current?.show(`Signed in with ${provider}! 👋`);
        setTimeout(() => router.replace('/home/home'), 800);
      } else if (
        result.error &&
        result.error !== 'Sign-in was cancelled'
      ) {
        Alert.alert('Sign-in Failed', result.error);
      }
    } catch (err: any) {
      Alert.alert(
        'Sign-in Error',
        err.message || 'Unable to complete social sign-in.'
      );
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <TopToast ref={toastRef} />

        <View style={styles.bgBlob} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.formContainer}>
            {/* Header */}
            <View style={styles.fixedTop}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Welcome</Text>
                <Text style={styles.headerSubtitle}>
                  Please sign in or create an account to continue
                </Text>
              </View>

              {/* Toggle Buttons */}
              <View style={styles.toggleContainer}>
                <Pressable
                  style={[
                    styles.toggleBtn,
                    isLogin && styles.toggleBtnActive,
                  ]}
                  onPress={() => toggleMode('login')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      isLogin && styles.toggleTextActive,
                    ]}
                  >
                    Login
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.toggleBtn,
                    !isLogin && styles.toggleBtnActive,
                  ]}
                  onPress={() => toggleMode('signup')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      !isLogin && styles.toggleTextActive,
                    ]}
                  >
                    Sign Up
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formFields}>
                {!isLogin && (
                  <InputField
                    icon="person-outline"
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="words"
                  />
                )}

                <InputField
                  icon="mail-outline"
                  placeholder="Email"
                  value={email}
                  onChangeText={(text) => {
                    setFormError('');
                    setEmail(text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <InputField
                  icon="lock-closed-outline"
                  placeholder="Password"
                  value={password}
                  onChangeText={(text) => {
                    setFormError('');
                    setPassword(text);
                  }}
                  isPassword
                />

                {formError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                {isLogin && (
                  <View style={styles.forgotPasswordContainer}>
                    <Pressable
                      onPress={() =>
                        router.push('/auth/forgot-password')
                      }
                    >
                      <Text style={styles.forgotPasswordText}>
                        Forgot Password?
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <Pressable
                style={styles.buttonShadow}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <LinearGradient
                  colors={themes.light.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isLogin ? 'Login' : 'Sign Up'}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  Or continue with
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialRow}>
                {(['google', 'apple', 'facebook'] as SocialProvider[]).map(
                  (provider) => (
                    <Pressable
                      key={provider}
                      style={styles.socialBtn}
                      onPress={() => handleSocialLogin(provider)}
                      disabled={!!socialLoading}
                    >
                      {socialLoading === provider ? (
                        <ActivityIndicator
                          size="small"
                          color={themes.light.colors.primary}
                        />
                      ) : (
                        <Ionicons
                          name={`logo-${provider}` as any}
                          size={22}
                          color={themes.light.colors.primary}
                        />
                      )}
                    </Pressable>
                  )
                )}
              </View>

              {/* Guest Mode */}
              {isLogin && (
                <Pressable
                  style={styles.guestBtn}
                  onPress={() => {
                    setGuestMode(true);
                    router.replace('/home/home');
                  }}
                >
                  <Ionicons
                    name="arrow-forward-outline"
                    size={16}
                    color={themes.light.colors.primaryAlt}
                  />
                  <Text style={styles.guestText}>
                    Continue as Guest
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themes.light.colors.background,
  },
  formContainer: {
    flex: 1,
  },
  bgBlob: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: themes.light.colors.primary,
    transform: [{ scale: 1.5 }],
    opacity: 0.3,
  },
  keyboardView: {
    flex: 1,
  },
  fixedTop: {
    paddingHorizontal: 24,
    paddingTop: 150,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: themes.light.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 20,
    color: themes.light.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: themes.light.colors.surface,
    borderRadius: 100,
    padding: 4,
    marginBottom: 30,
    height: 50,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 100,
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: themes.light.colors.primary,
  },
  toggleText: {
    fontSize: 16,
    color: themes.light.colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  formFields: {
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -2,
  },
  forgotPasswordText: {
    color: themes.light.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  buttonShadow: {
    marginBottom: 32,
  },
  button: {
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: themes.light.colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: themes.light.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 32,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: themes.light.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guestText: {
    color: themes.light.colors.primaryAlt,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 10,
    paddingHorizontal: 8,
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 14,
    fontWeight: '600',
  },
});