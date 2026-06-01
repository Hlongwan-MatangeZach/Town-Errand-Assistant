import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TopToastRef {
  show: (message: string, duration?: number) => void;
}

const TopToast = forwardRef<TopToastRef, {}>((props, ref) => {
  const [message, setMessage] = useState('');
  
  // Animation values
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  // Ref to keep track of the timeout so we can clear it if called repeatedly
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMessage(''); // Clear message after animation completes
    });
  }, [translateY, opacity]);

  const show = useCallback((newMessage: string, duration = 3000) => {
    setMessage(newMessage);

    // Clear any existing timers so toast doesn't hide prematurely if called twice quickly
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Set timer to animate out
    timerRef.current = setTimeout(() => {
      hide();
    }, duration);
  }, [hide, translateY, opacity]);

  // Expose the show method to the parent component
  useImperativeHandle(ref, () => ({
    show,
  }));

  // If there's no message and it's invisible, don't render the box contents
  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none" // Prevents the toast from blocking touches underneath it
    >
      <View style={styles.toastContent}>
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.icon} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40, // Adjust based on SafeArea
    left: 20,
    right: 20,
    zIndex: 9999, // Ensure it sits on top of everything
    elevation: 10,
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 100, // Pill shape
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    maxWidth: '100%',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TopToast;