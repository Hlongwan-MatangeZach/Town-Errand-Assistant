import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { use } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 
"react-native";
import { FeatureRow } from "./featureRow";
import { ProgressDots } from "./progressDots";
import { useOnboardingAnimations } from "./onboardingAnimations";

const AnimatedView = Animated.createAnimatedComponent(View);

type Feature = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
};

type Theme = {
  background: [string, string];
  primary: string;         // for active dot, feature icon, etc.
  primaryDark: string;     // title/contrast text
  iconGradient: [string, string];
  ringBg: string;          // rgba(...)
  ringBorder: string;      // rgba(...)
  ringBorderOuter: string; // rgba(...)
};

export function OnboardingSlides({
  theme,
  icon,
  title,
  subtitle,
  description,
  features,
  progressIndex,
  progressTotal,

  onSkip,
  onBack,
  onNext,

  nextLabel = 'Next',
}: {
  theme: Theme;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  description: string;
  features: Feature[];
  progressIndex: number;
  progressTotal: number;

  onSkip: () => void;
  onBack?: () => void;
  onNext: () => void;


  nextLabel?: string;
}) {
  const { contentAnimStyle, iconAnimStyle, ringPulseStyle } = useOnboardingAnimations();    
return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.skipButtonPressed,
          ]}
          onPress={onSkip}
        >
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.centerContent}>
        <AnimatedView style={[styles.heroWrap, contentAnimStyle]}>
          <View style={styles.iconSection}>
            <View style={[styles.iconContainer, { backgroundColor: theme.ringBg }]}>
              <AnimatedView
                style={[
                  styles.decorativeRing,
                  ringPulseStyle,
                  { borderColor: theme.ringBorder },
                ]}
              />
              <View
                style={[
                  styles.decorativeRingOuter,
                  { borderColor: theme.ringBorderOuter },
                ]}
              />

              <AnimatedView style={[styles.iconBubble, iconAnimStyle]}>
                <LinearGradient colors={theme.iconGradient} style={styles.iconGradient}>
                  <Ionicons name={icon} size={46} color="white" />
                </LinearGradient>
              </AnimatedView>
            </View>
          </View>

          <View style={styles.textSection}>
            <Text style={[styles.title, { color: theme.primaryDark }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.primary }]}>{subtitle}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.featuresList}>
            {features.map((f, idx) => (
              <FeatureRow
                key={`${f.icon}-${idx}`}
                icon={f.icon}
                text={f.text}
                color={theme.primary}
                textColor={theme.primaryDark}
              />
            ))}
          </View>
        </AnimatedView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <ProgressDots
            index={progressIndex}
            total={progressTotal}
            activeColor={theme.primary}
          />

          <View style={styles.buttonRow}>
            {onBack ? (
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  { borderColor: theme.primary },
                  pressed && styles.backButtonPressed,
                ]}
                onPress={onBack}
              >
                <Ionicons name="chevron-back" size={16} color={theme.primaryDark} />
                <Text style={[styles.backText, { color: theme.primaryDark }]}>Back</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <Pressable
              style={({ pressed }) => [
                styles.nextButton,
                pressed && styles.nextButtonPressed,
              ]}
              onPress={onNext}
            >
              <LinearGradient colors={theme.iconGradient} style={styles.nextButtonGradient}>
                <Text style={styles.nextText}>{nextLabel}</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header:{
    marginTop: Platform.OS === 'ios' ? 10 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  skipButton:{ 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  skipButtonPressed:{ 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    transform: [{ scale: 0.95 }] },
  skip:{ 
    color: '#6B7280', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  placeholder:{ 
    width: 40 
  },

  centerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  heroWrap: { width: "100%", maxWidth: 420, alignItems: "center" },

  iconSection: { alignItems: "center", marginBottom: 18 },
  iconContainer: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  decorativeRing: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
  },
  decorativeRingOuter: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
  },
  iconBubble: {
    width: 110,
    height: 110,
    borderRadius: 55,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
    overflow: "hidden",
  },
  iconGradient: { flex: 1, alignItems: "center", justifyContent: "center" },

  textSection: { alignItems: "center", marginTop: 6 },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  description: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },

  featuresList: { marginTop: 18, alignItems: "center" },

  footer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: Platform.OS === "ios" ? 40 : 30,
  },
  footerContent: { width: "100%", alignItems: "center" },

  buttonRow: { width: "100%", flexDirection: "row", alignItems: "center" },

  backButton: {
    flexDirection: "row",
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    flex: 1,
    maxWidth: 120,
  },
  backButtonPressed: { transform: [{ scale: 0.95 }] },
  backText: { marginLeft: 6, fontWeight: "600" },

  nextButton: {
    borderRadius: 25,
    overflow: "hidden",
    marginLeft: "auto",
    minWidth: 120,
  },
  nextButtonPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  nextText: { color: "white", fontWeight: "600", fontSize: 15, marginRight: 6 },
});