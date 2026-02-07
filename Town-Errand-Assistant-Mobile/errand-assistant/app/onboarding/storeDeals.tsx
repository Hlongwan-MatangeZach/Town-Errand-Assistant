import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {OnboardingSlides} from '@/components/onboarding/onboardingSlides';

const dealsTheme = {
  background: ["#FFFBEB", "#FFFFFF"] as [string, string],
  primary: "#F59E0B",
  primaryDark: "#92400E",
  iconGradient: ["#F59E0B", "#D97706"] as [string, string],
  ringBg: "rgba(245,158,11,0.12)",
  ringBorder: "rgba(245,158,11,0.25)",
  ringBorderOuter: "rgba(245,158,11,0.15)",
};

export default function Deals() {
  const router = useRouter();

  return (
    <OnboardingSlides
      theme={dealsTheme}
      icon="pricetag"
      title="Best Deals"
      subtitle="Save more money"
      description="Find the latest store specials and compare prices to get the best deal in town."
      features={[
        { icon: "flash", text: "Latest store specials" },
        { icon: "swap-horizontal", text: "Price comparison" },
      ]}
      progressIndex={3}
      progressTotal={4}
      nextLabel="Get Started"
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
        router.push("/home/home");
      }}
    />
  );
}