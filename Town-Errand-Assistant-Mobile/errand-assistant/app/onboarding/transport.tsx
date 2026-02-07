import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import React, {useEffect} from 'react';
import {OnboardingSlides} from '@/components/onboarding/onboardingSlides';

const transportTheme={
  background: ["#EFF6FF", "#FFFFFF"] as [string, string],
  primary: "#3B82F6",
  primaryDark: "#1E3A8A",
  iconGradient: ["#3B82F6", "#2563EB"] as [string, string],
  ringBg: "rgba(59,130,246,0.10)",
  ringBorder: "rgba(59,130,246,0.25)",
  ringBorderOuter: "rgba(59,130,246,0.12)",  
};

export default function transportOnboarding(){
    const router= useRouter();

   return (
    <OnboardingSlides
      theme={transportTheme}
      icon="car-outline"
      title="Smart Taxi Calculator"
      subtitle="Split fares fairly"
      description={
        "Calculate taxi costs, split fares with passengers, and get exact change amounts.\nNever overpay again!"
      }
      features={[
        { icon: "calculator-outline", text: "Accurate fare calculation" },
        { icon: "people-outline", text: "Easy fare splitting" },
        { icon: "cash-outline", text: "Exact change amounts" },
      ]}
      progressIndex={0}
      progressTotal={4}
      onSkip={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/home/home");
      }}
      onNext={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/onboarding/groceryPlanning");
      }}
    />
  );
}