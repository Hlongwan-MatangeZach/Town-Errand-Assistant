import HomeHeader from '@/components/home/HomeHeader';
import StoreDeals from '@/components/home/StoreDeals';
import Navigation from '@/components/navigation';
import { themes } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";


const { width } = Dimensions.get("window");


export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [query, setQuery] = useState("");



  return (
    <View style={styles.container}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>

        {/*header*/}
        <HomeHeader onProfilePress={() => router.push("/profile")} />

        {/**Welcome section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Hello, {userName} ! 👋</Text>
            <Text style={styles.taglineInline}>
              Manage your trips, shopping, and budget.
            </Text>
          </View>
          <Text style={styles.welcomeEmoji}>🛍️</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name='search' size={20} color={themes.light.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder='Search for shops, deals, or cards...'
              value={query}
              onChangeText={setQuery}
              placeholderTextColor={themes.light.colors.textSecondary}
              returnKeyType='search'
              accessibilityLabel='Search Input'
              accessibilityHint='Search for shops, deals, or cards'
            />
          </View>
        </View>

        {/*Taxi Math Container */}
        <View style={styles.taxiCardContainer}>
          <Pressable style={({ pressed }) => [styles.taxiCard, pressed && styles.taxiCardPressed]}
            onPress={() => router.push('/transport/taxiCalculator')}
            accessibilityLabel='Taxi Math Card'
            accessibilityHint='Open to Taxi Math feature'
            accessibilityRole='button'
            hitSlop={8}>

            <LinearGradient colors={themes.light.gradients.sunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.taxiCardGradient}>
              <View style={styles.taxiCardContent}>
                <View style={styles.taxiCardIconWrapper}>
                  <MaterialCommunityIcons name='taxi' size={25} color={themes.light.colors.surfaceAlt} />
                </View>
                <View style={styles.taxiCardTextWrapper}>
                  <Text style={styles.taxiCardTitle}>Taxi Math</Text>
                  <Text style={styles.taxiCardSubtitle}>Calculate your taxi fares and slip change fairly with ease.</Text>
                </View>

                <View style={styles.taxiCardRightWrapper}>
                  <MaterialCommunityIcons name='calculator' size={24} color={themes.light.colors.surfaceAlt} />
                </View>

              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/*Grocery & Shopping Assistant */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Grocery & Shopping Assistant</Text>
        </View>

        <View style={styles.gridWrapper}>
          <Pressable style={[styles.gridCard, { backgroundColor: '#5AD99C' }]} onPress={() => router.push("/grocery-assistant")}
            accessibilityLabel='Grocery Assistant Card'
            accessibilityHint='Open to Grocery Assistant feature'
            accessibilityRole='button'
            hitSlop={8}>

            <View style={styles.gridCardIconWrapper}>
              <MaterialCommunityIcons name='basket' size={32} color={themes.light.colors.surfaceAlt} />
              <Ionicons name='list' size={18} color={themes.light.colors.surfaceAlt} />
            </View>
            <Text style={styles.gridCardTitle}>Grocery Assistant</Text>
            <Text style={styles.gridCardSubtitle}>Get help with grocery shopping and budget management.</Text>
          </Pressable>

          <Pressable style={[styles.gridCard, { backgroundColor: '#8FC2FF' }]} onPress={() => router.push("/shopping-cards")}
            accessibilityLabel='Grocery Assistant Card'
            accessibilityHint='Open to Grocery Assistant feature'
            accessibilityRole='button'
            hitSlop={8}>

            <View style={styles.gridCardIconWrapper}>
              <Ionicons name='card-outline' size={32} color={themes.light.colors.surfaceAlt} />
              <Ionicons name='pricetag' size={18} color={themes.light.colors.surfaceAlt} />
            </View>
            <Text style={styles.gridCardTitle}>Shopping Cards</Text>
            <Text style={styles.gridCardSubtitle}>Store loyalty cards and manage your shopping rewards.</Text>
          </Pressable>
        </View>

        {/*Special Offers & Deals */}
        <View style={styles.specialsHeaderConteiner}>
          <View style={styles.specialsHeader}>
            <Ionicons name='pricetags' size={20} color={themes.light.colors.textSecondary} />
            <Text style={styles.sectionTitle}>Shop Specials</Text>
          </View>
          <Pressable onPress={() => router.push("/deals")}
            accessibilityLabel='View Deals Button'
            accessibilityHint='Open to view current deals and specials'>
            <Text style={styles.viewAllText}>View all</Text>
          </Pressable>
        </View>
        
        <StoreDeals />
        
      </ScrollView>
      <Navigation/>
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themes.light.colors.background,
  },
  scrollContainer: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: themes.light.colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: themes.light.colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: 1,
    marginBottom: 20,
    lineHeight: 20,
  },
  welcomeEmoji: {
    fontSize: 52,
  },
  taglineInline: {
    fontSize: 14,
    color: themes.light.colors.textSecondary,
    marginBottom: 2,
    lineHeight: 18,
  },
  searchWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
    zIndex: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themes.light.colors.surface,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: themes.light.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: themes.light.colors.text,
    padding: 0,
  },
  taxiCardContainer: {
    marginBottom: 24,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  taxiCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  taxiCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  taxiCardGradient: {
    padding: 22,
  },
  taxiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxiCardIconWrapper: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 100,
    width: 48,
    height: 48,

  },
  taxiCardTextWrapper: {
    flex: 1,
  },
  taxiCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 16,
  },

  taxiCardSubtitle: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
    lineHeight: 18,
  },
  taxiCardRightWrapper: {
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: themes.light.colors.text,
  },
  gridWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 28,
  },
  gridCard: {
    width: (width - 50) / 2,
    height: (width - 50) / 2,
    borderRadius: 20,
    padding: 16,
  },
  gridCardIconWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: themes.light.colors.text,
  },
  gridCardSubtitle: {
    fontSize: 12,
    color: '#1F2937 ',
    marginTop: 4,
  },
  specialsHeaderConteiner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  specialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: themes.light.colors.primary,
    fontWeight: '600',
  },
});
