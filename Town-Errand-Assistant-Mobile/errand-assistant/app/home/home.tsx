import HomeHeader from '@/components/home/HomeHeader';
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

      </ScrollView>

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
 
});
