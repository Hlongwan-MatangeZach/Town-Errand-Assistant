import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedLinearGradient = createAnimatedComponent(LinearGradient);

const {width}= Dimensions.get('window');

export default function SplashScreen() {
  const router= useRouter();
  // check if the useer is the firsst time the open our app
  const [isFirstLaunch, setIsFirstLaunch] =useState<boolean | null>(null);

  //logo animation
  const scale= useSharedValue(0);
  const float= useSharedValue(0);

  //loading dots 
  const dot1= useSharedValue(0);
  const dot2= useSharedValue(0);
  const dot3= useSharedValue(0);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try{
        const hasLaunched = await AsyncStorage.getItem('@app_has_launched');
        if (hasLaunched === null) {
          await AsyncStorage.setItem('@app_has_launched', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      }catch(error){
        console.log(error);
        setIsFirstLaunch(false);
      }
    };
    checkFirstLaunch();
    
  }, []);

  useEffect(() => {
    if (isFirstLaunch === null) return;

    //logo animation
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    float.value = withRepeat(withTiming(-10, { duration: 4500 }), -1, true);

    //loading dots
    dot1.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
    setTimeout(()=>{
    dot2.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);

    },150);
    setTimeout(()=>{
    dot3.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);

    },300);

    //navigate after 3 seconds
    const timer = setTimeout(() => {
      if (isFirstLaunch) {
        router.replace('/onboarding/transport');
      } else {
        router.replace('/auth/auth');
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [isFirstLaunch]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: float.value }],
  }));

  const dotStyle = (dot: any) => 
    useAnimatedStyle(() => ({
    opacity: dot.value,
    transform: [{ translateY: dot.value ? -4: 0}],

  }));

 
  return (
    <LinearGradient
      colors={["#F0F9FF", "#E0F2FE", "#FEF3C7"]}
      style={styles.container }>
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circleBig]} />
      <View style={[styles.circle, styles.circleSmall]} />

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <View style={styles.logoBg}>
            <Ionicons name="location" size={48} color="#3B82F6" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInUp.delay(500).duration(700)}
          style={styles.title}
        >
          Errand Assistant
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInDown.delay(800).duration(700)}
          style={styles.subtitle}
        >
          Your friendly companion for{"\n"}taxi trips & town errands
        </Animated.Text>

        {/* Loading dots */}
        <Animated.View entering={FadeIn.delay(1200)} style={styles.dots}>
          <Animated.View style={[styles.dot, dotStyle(dot1)]} />
          <Animated.View style={[styles.dot, dotStyle(dot2)]} />
          <Animated.View style={[styles.dot, dotStyle(dot3)]} />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  /* Logo */
  logoWrapper: {
    marginBottom: 40,
  },
  logoBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 12,
  },

  /* Text */
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },

  /* Dots */
  dots: {
    flexDirection: "row",
    marginTop: 50,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
    marginHorizontal: 6,
  },

  /* Decorative circles */
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#3B82F6",
    opacity: 0.08,
  },
  circleBig: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.5,
    left: -width * 0.3,
  },
  circleSmall: {
    width: 140,
    height: 140,
    bottom: 120,
    right: -40,
    backgroundColor: "#F59E0B",
    opacity: 0.12,
  },
});
