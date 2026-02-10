import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
  type TextInputProps,
} from 'react-native';
import { useRouter } from 'expo-router';
import {themes} from '@/constants/theme';

type ToggleMode = 'login' | 'signup';


export default function AuthScreen(){
    const[mode, setMode] = useState<ToggleMode>('login');
    
    const[showPassword, setShowPassword]= useState(false);
    const[rememberMe, setRememberMe]= useState(false);
    const isLogin = mode === "login";

    //form state
    const[email, setEmail]= useState('');
    const[password, setPassword]= useState('');
    const[username, setUsername]= useState('');

    const usernameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);


    return(

      <View style={styles.container}>
        <StatusBar style='dark' />

        {/* Background Decorative Blob */}
        <View style={styles.bgBlob} />
          <View style={styles.formContainer}>

            <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}></KeyboardAvoidingView>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              {/*HEADER*/}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Welcome</Text>
                <Text style={styles.headerSubtitle}>Please sign in or create an account to continue</Text>
              </View>

              {/*MODE TOGGLE BUTTONS*/}
              <View style={styles.toggleContainer}>
              <Pressable style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}>
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
              </Pressable>
              <Pressable style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}>
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign Up</Text>
              </Pressable>
              </View>


            </ScrollView>
            

        </View>

      </View>
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
  scrollContent: {
   flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: 'center'
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
    maxWidth:'85%',
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
});