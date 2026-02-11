import { themes } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, {
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import InputField from '../../components/ui/InputField';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type ToggleMode = 'login' | 'signup';


export default function AuthScreen() {
  const [mode, setMode] = useState<ToggleMode>('login');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const isLogin = mode === "login";

  //form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  //navigate to home screen as guest
  const router = useRouter();

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);

  const toggleMode = (newMode: "login" | "signup") => {
    if (mode === newMode) return;
    Keyboard.dismiss();
    setMode(newMode);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style='dark' />

        {/* Background Decorative Blob */}
        <View style={styles.bgBlob} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.formContainer}>

            {/* FIXED HEADER - Always stays in the same position */}
            <View style={styles.fixedTop}>
              {/*HEADER*/}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Welcome</Text>
                <Text style={styles.headerSubtitle}>Please sign in or create an account to continue</Text>
              </View>

              {/*MODE TOGGLE BUTTONS*/}
              <View style={styles.toggleContainer}>
                <Pressable style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]} onPress={() => toggleMode('login')}>
                  <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
                </Pressable>
                <Pressable style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]} onPress={() => toggleMode('signup')}>
                  <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign Up</Text>
                </Pressable>
              </View>
            </View>

            {/* SCROLLABLE FORM CONTENT - Only this part scrolls/shifts */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {/*FORM FIELDS*/}
              <View style={styles.formFields}>
                {!isLogin && (
                  <InputField
                    icon='person-outline'
                    placeholder='Username'
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize='words'
                  />
                )}
                <InputField
                  icon='mail-outline'
                  placeholder='Email'
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize='none'
                />
                <InputField
                  icon='lock-closed-outline'
                  placeholder='Password'
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                />

                {/*FORGOT PASSWORD */}
                {isLogin && (
                  <View style={styles.forgotPasswordContainer}>
                    <Pressable>
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/*SUBMIT BUTTON*/}
              <Pressable style={styles.buttonShadow}>
                <LinearGradient
                  colors={themes.light.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}>
                  <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
                </LinearGradient>
              </Pressable>

              {/*DIVIDER */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/*SOCIAL LOGIN BUTTONS*/}
              <View style={styles.socialRow}>
                <Pressable style={styles.socialBtn}>
                  <Ionicons name="logo-google" size={22} color={themes.light.colors.primary} />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <Ionicons name="logo-apple" size={22} color={themes.light.colors.primary} />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <Ionicons name="logo-facebook" size={22} color={themes.light.colors.primary} />
                </Pressable>
              </View>

              {/*GUEST LOGIN*/}
              {isLogin && (
                <Pressable style={styles.guestBtn} onPress={() => router.replace('/home/home')}>
                  <Ionicons name="arrow-forward-outline" size={16} color={themes.light.colors.primaryAlt} />
                  <Text style={styles.guestText}>Continue as Guest</Text>
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
    paddingTop: 0,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
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
    marginTop: 4,
  },
  forgotPasswordText: {
    color: themes.light.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  buttonShadow: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    backgroundColor: themes.light.colors.primary,
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

});