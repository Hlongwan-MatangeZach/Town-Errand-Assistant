import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {OnboardingSlides} from '@/components/onboarding/onboardingSlides';

const walletTheme = {
  background: ["#F5F3FF", "#FFFFFF"] as [string, string],
  primary: "#8B5CF6",
  primaryDark: "#4C1D95",
  iconGradient: ["#8B5CF6", "#7C3AED"] as [string, string],
  ringBg: "rgba(139,92,246,0.12)",
  ringBorder: "rgba(139,92,246,0.25)",
  ringBorderOuter: "rgba(139,92,246,0.12)",
};

export default function DigitalWallet() {
  const router = useRouter();

  return (
    <OnboardingSlides
      theme={walletTheme}
      icon="wallet-outline"
      title="Digital Wallet"
      subtitle="All cards in one place"
      description="Store loyalty cards, discount cards, and membership barcodes — securely and digitally."
      features={[
        { icon: "card-outline", text: "Digital card storage" },
        { icon: "barcode-outline", text: "Barcode scanning" },
        { icon: "share-outline", text: "Card sharing with Friends" },
      ]}
      progressIndex={2}
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
        router.push("/onboarding/storeDeals");
      }}
    />
  );
}