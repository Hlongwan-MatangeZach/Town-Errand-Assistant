import Navigation from '@/components/navigation';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { themes } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';

// --- Constants & Theme ---
const theme = themes.light;

const APP_INFO = {
  name: 'Errand Assistance',
  version: 'v1.0.0',
  tagline: 'Made for the South African community',
};

const USER_NAME_KEY = 'ea_user_name_v1';

// --- Menu Section Data ---
const MENU_SECTIONS = [
  {
    header: 'Features',
    items: [
      {
        id: 'lists',
        route: '/grocery/myBasket',
        title: 'My Shopping Lists',
        sub: 'View and manage lists',
        icon: 'clipboard-list-outline',
        lib: 'MaterialCommunityIcons' as const,
        color: theme.colors.success,
        tint: '#E9FBF4',
      },
      {
        id: 'cards',
        route: '/wallet/myCards',
        title: 'Loyalty Cards',
        sub: 'Store cards & memberships',
        icon: 'card-outline',
        lib: 'Ionicons' as const,
        color: theme.colors.secondary,
        tint: '#F6EEFF',
      },
      {
        id: 'calc',
        route: '/transport/taxiCalculator',
        title: 'Taxi Calculator',
        sub: 'Estimate your trip fare',
        icon: 'calculator-variant-outline',
        lib: 'MaterialCommunityIcons' as const,
        color: theme.colors.primary,
        tint: '#EAF2FF',
      },
      {
        id: 'deals',
        route: '/deals/deals',
        title: 'Store Deals',
        sub: 'View current offers',
        icon: 'cart-outline',
        lib: 'MaterialCommunityIcons' as const,
        color: theme.colors.warning,
        tint: '#FFF4E9',
      },
    ],
  },
];

// --- Type Definitions ---
interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  tint: string;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  iconLib: 'Ionicons' | 'MaterialCommunityIcons';
  iconName: string;
  iconColor: string;
  tint: string;
  onPress: () => void;
}

interface CardProps {
  children: React.ReactNode;
  header?: string;
}

interface BulletProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { username } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [shoppingCount, setShoppingCount] = useState<number>(0);
  const [cardsCount, setCardsCount] = useState<number>(0);
  const [taxiCount, setTaxiCount] = useState<number>(0);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  // Load counts

  // Load counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        // Grocery baskets
        const basketsRaw = await AsyncStorage.getItem('@grocery_baskets');
        const baskets = basketsRaw ? JSON.parse(basketsRaw) : [];
        setShoppingCount(Array.isArray(baskets) ? baskets.length : 0);

        // Cards: prefer SecureStore, fallback to AsyncStorage
        let cardsArr: any[] = [];
        try {
          const secure = await SecureStore.getItemAsync('user_cards');
          if (secure) {
            cardsArr = JSON.parse(secure);
          } else {
            const stored = await AsyncStorage.getItem('user_cards');
            cardsArr = stored ? JSON.parse(stored) : [];
          }
        } catch (e) {
          const stored = await AsyncStorage.getItem('user_cards');
          cardsArr = stored ? JSON.parse(stored) : [];
        }
        setCardsCount(Array.isArray(cardsArr) ? cardsArr.length : 0);

        // Taxi trips count
        try {
          const t = await AsyncStorage.getItem('@taxi_trip_count');
          const n = t ? parseInt(t, 10) : 0;
          setTaxiCount(Number.isFinite(n) ? n : 0);
        } catch (e) {
          setTaxiCount(0);
        }
      } catch (e) {
        console.error('Error loading counts:', e);
      }
    };

    loadCounts();
  }, [refreshing]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleMenuPress = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  const handleSignOut = useCallback(() => {
    setIsSignOutModalVisible(true);
  }, []);

  const confirmSignOut = async () => {
    try {
      // Clear user data if needed
      // await AsyncStorage.removeItem(USER_NAME_KEY);
      console.log('User signed out');
      setIsSignOutModalVisible(false);
      // Navigate to login or onboarding
      router.replace('/auth/auth');
    } catch (e) {
      console.error('Error signing out:', e);
    }
  };

  const stats: StatItemProps[] = [
    {
      label: 'Shopping Lists',
      value: String(shoppingCount),
      icon: 'list-outline',
      color: theme.colors.success,
      tint: '#E9FBF4',
    },
    {
      label: 'Taxi Trips',
      value: String(taxiCount),
      icon: 'bus-outline',
      color: theme.colors.primary, // Changed from info which was cyan
      tint: '#EAF2FF',
    },
    {
      label: 'Loyalty Cards',
      value: String(cardsCount),
      icon: 'card-outline',
      color: theme.colors.secondary,
      tint: '#F6EEFF',
    },
  ];

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle='dark-content' backgroundColor={theme.colors.background} />

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <ProfileHeader />

        {/* User Status Card */}
        <UserStatusCard userName={username} />

        {/* Stats Grid */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionHeader}>Quick Stats</Text>
          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <StatItem key={index} {...stat} />
            ))}
          </View>
        </View>

        {/* Dynamic Menu Sections */}
        {MENU_SECTIONS.map((section, index) => (
          <Card key={index} header={section.header}>
            {section.items.map((item, itemIndex) => (
              <React.Fragment key={item.id}>
                <ListItem
                  title={item.title}
                  subtitle={item.sub}
                  iconLib={item.lib}
                  iconName={item.icon}
                  iconColor={item.color}
                  tint={item.tint}
                  onPress={() => handleMenuPress(item.route)}
                />
                {itemIndex < section.items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        ))}

        {/* About & Sign Out */}
        <AboutSection />

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.8 }]}
        >
          <LinearGradient
            colors={[theme.colors.surfaceAlt, theme.colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signOutGradient}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FDECEC' }]}>
              <Ionicons name='log-out-outline' size={20} color={theme.colors.danger} />
            </View>
            <Text style={styles.signOutText}>Sign Out</Text>
          </LinearGradient>
        </Pressable>

        {/* Version Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {APP_INFO.name} {APP_INFO.version}
          </Text>
          <Text style={styles.footerSub}>{APP_INFO.tagline}</Text>
        </View>

        {/* Spacer for Bottom Navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Navigation />

      <ConfirmationModal
        visible={isSignOutModalVisible}
        title='Sign Out'
        message='Are you sure you want to sign out?'
        onConfirm={confirmSignOut}
        onCancel={() => setIsSignOutModalVisible(false)}
        confirmText='Sign Out'
        type='danger'
      />
    </View>
  );
}


const ProfileHeader = () => (
  <View style={styles.header}>
    <View style={styles.avatarContainer}>
      <Ionicons name='person' size={32} color={theme.colors.primary} />
    </View>
    <Text style={styles.headerTitle}>Profile</Text>
    <Text style={styles.headerSubtitle}>Manage your account</Text>
  </View>
);

const UserStatusCard = ({ userName }: { userName: string }) => (
  <Card>
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: '#EAF2FF', width: 48, height: 48 }]}>
        <Ionicons name='person-circle-outline' size={28} color={theme.colors.primary} />
      </View>
      <View style={styles.flexText}>
        <Text style={styles.cardTitle}>{userName}</Text>
        <Text style={styles.cardSub}>Basic Plan</Text>
      </View>
      <View style={styles.badge}>
        <Ionicons name='checkmark-circle' size={14} color={theme.colors.success} />
        <Text style={styles.badgeText}>Verified</Text>
      </View>
    </View>
  </Card>
);

const AboutSection = () => (
  <Card header={`About ${APP_INFO.name}`}>
    <Text style={styles.aboutText}>
      Your friendly companion for daily errands, taxi trips, and shopping. Helping the South African
      community manage budgets and transport.
    </Text>
    <View style={styles.bulletContainer}>
      <Bullet icon='people-outline' text='Community' />
      <Bullet icon='shield-checkmark-outline' text='Secure' />
      <Bullet icon='heart-outline' text='Local' />
    </View>
  </Card>
);


const Card = ({ children, header }: CardProps) => (
  <View style={styles.card}>
    {header && <Text style={styles.cardHeader}>{header}</Text>}
    {children}
  </View>
);

const ListItem = ({
  title,
  subtitle,
  iconLib,
  iconName,
  iconColor,
  tint,
  onPress,
}: ListItemProps) => {
  const IconComponent = iconLib === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: '#F9FAFB' }]}
    >
      <View style={[styles.iconBox, { backgroundColor: tint }]}>
        <IconComponent name={iconName as any} size={20} color={iconColor} />
      </View>
      <View style={styles.flexText}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSub}>{subtitle}</Text>}
      </View>
      <Ionicons
        name='chevron-forward'
        size={18}
        color={theme.colors.textSecondary}
        style={{ opacity: 0.5 }}
      />
    </Pressable>
  );
};

const StatItem = ({ icon, label, value, color, tint }: StatItemProps) => (
  <View style={styles.statBox}>
    <View
      style={[
        styles.iconBox,
        { backgroundColor: tint, marginBottom: 8, width: 36, height: 36 },
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Bullet = ({ icon, text }: BulletProps) => (
  <View style={styles.bulletBadge}>
    <Ionicons name={icon} size={14} color={theme.colors.textSecondary} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;


const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  // Card
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexText: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  // Badges & Icons
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 4,
  },
  badgeText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  sectionMargin: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // List Items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  itemSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSoft,
    marginLeft: 52,
  },

  // About & Footer
  aboutText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  bulletContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  bulletBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  bulletText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  signOutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  signOutText: {
    color: theme.colors.danger,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  footerSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});
