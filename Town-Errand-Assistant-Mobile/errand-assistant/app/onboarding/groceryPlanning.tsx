import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {OnboardingSlides} from '@/components/onboarding/onboardingSlides';

const groceryTheme = {
  background: ["#ECFDF5", "#FFFFFF"] as [string, string],
  primary: "#10B981",
  primaryDark: "#064E3B",
  iconGradient: ["#10B981", "#059669"] as [string, string],
  ringBg: "rgba(16,185,129,0.12)",
  ringBorder: "rgba(16,185,129,0.25)",
  ringBorderOuter: "rgba(16,185,129,0.12)",
};

export default function GroceryPlanning() {
  const router = useRouter();

  return (
    <OnboardingSlides
      theme={groceryTheme}
      icon="basket-outline"
      title="Grocery Planning"
      subtitle="Shop with confidence"
      description="Create shopping lists, track your budget in real-time, and never forget an item again."
      features={[
        { icon: "list-outline", text: "Organized shopping lists" },
        { icon: "pulse-outline", text: "Real-time budget tracking" },
        { icon: "sparkles-outline", text: "AI grocery list creation" },
      ]}
      progressIndex={1}
      progressTotal={4}
      onSkip={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/home/home");
      }}
      onBack={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
      }}
      onNext={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/onboarding/digitalWallet");
      }}
    />
  );
}