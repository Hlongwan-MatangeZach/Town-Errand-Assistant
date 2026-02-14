import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { memo, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_COUNT = 5;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;
const BAR_HEIGHT = 70;
const CURVE_WIDTH = 80;
const CURVE_DEPTH = 38;
const BALL_SIZE = 54;

const COLORS = {
  barBackground: 'rgba(255, 255, 255, 0.85)',
  barBorder: 'rgba(0, 0, 0, 0.05)',
  activeCircle: '#2563EB',
  activeIcon: '#FFFFFF',
  inactiveIcon: '#9CA3AF',
  text: '#1F2937',
};

const createPath = () => {
  const totalWidth = SCREEN_WIDTH * 3;
  const center = totalWidth / 2;
  const startCurve = center - CURVE_WIDTH / 2;
  const endCurve = center + CURVE_WIDTH / 2;

  return `
    M0,0 
    L${startCurve},0 
    C${startCurve + 25},0 ${center - 20},${CURVE_DEPTH} ${center},${CURVE_DEPTH} 
    C${center + 20},${CURVE_DEPTH} ${endCurve - 25},0 ${endCurve},0 
    L${totalWidth},0 
    L${totalWidth},${BAR_HEIGHT + 100} 
    L0,${BAR_HEIGHT + 100} 
    Z
  `;
};

type NavItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
};

const Navigation = memo(function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const animValue = useRef(new Animated.Value(0)).current;

  const navItems: NavItem[] = useMemo(
    () => [
      { key: 'home', label: 'Home', icon: 'home', path: '/home/home' },
      { key: 'transport', label: 'Taxi', icon: 'car', path: '/transport/taxiCalculator' },
      { key: 'grocery', label: 'Shop', icon: 'basket', path: '/grocery/groceryPlanning' },
      { key: 'wallet', label: 'Cards', icon: 'card', path: '/wallet/myCards' },
      { key: 'profile', label: 'Profile', icon: 'person', path: '/profile/profile' },
    ],
    []
  );

  const activeIndex = useMemo(() => {
    const foundIndex = navItems.findIndex((item) => {
      if (item.path === '/') return pathname === '/';
      return pathname?.includes(item.path.split('/')[1]);
    });
    return foundIndex === -1 ? 0 : foundIndex;
  }, [pathname, navItems]);

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: activeIndex,
      useNativeDriver: true,
      friction: 9,
      tension: 60,
    }).start();
  }, [activeIndex]);

  const centerOfSvg = (SCREEN_WIDTH * 3) / 2;
  const centerOfFirstTab = TAB_WIDTH / 2;
  const initialOffset = -(centerOfSvg - centerOfFirstTab);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [initialOffset, initialOffset + TAB_WIDTH],
  });

  const ballTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TAB_WIDTH],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgContainer, { transform: [{ translateX }] }]}>
        <Svg width={SCREEN_WIDTH * 3} height={BAR_HEIGHT + 50}>
          <Path d={createPath()} stroke={COLORS.barBorder} strokeWidth={1} fill='none' />
          <Path d={createPath()} fill={COLORS.barBackground} />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.activeCircle,
          {
            bottom: insets.bottom + 18,
            left: (TAB_WIDTH - BALL_SIZE) / 2,
            transform: [{ translateX: ballTranslateX }],
          },
        ]}
      >
        <View style={styles.activeCircleInner}>
          <Ionicons
            name={navItems[activeIndex].icon}
            size={26}
            color={COLORS.activeIcon}
          />
        </View>
      </Animated.View>

      <View
        style={[
          styles.tabsContainer,
          {
            height: BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {navItems.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabItem}
              onPress={() => router.replace(item.path as any)}
              activeOpacity={1}
            >
              <View style={[styles.iconWrapper, { opacity: isActive ? 0 : 1 }]}>
                <Ionicons
                  name={`${item.icon}-outline` as any}
                  size={24}
                  color={COLORS.inactiveIcon}
                />
              </View>

              <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    elevation: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  svgContainer: {
    position: 'absolute',
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
    paddingHorizontal: 10,
  },
  activeCircle: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.activeCircle,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  activeCircleInner: {
    width: '100%',
    height: '100%',
    borderRadius: BALL_SIZE / 2,
    backgroundColor: COLORS.activeCircle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 5,
  },
  tabItem: {
    width: TAB_WIDTH,
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: '100%',
    paddingBottom: 8,
  },
  iconWrapper: {
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: 24,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.inactiveIcon,
  },
  tabLabelActive: {
    color: COLORS.activeCircle,
    fontWeight: '700',
    transform: [{ translateY: 2 }],
  },
});

export default Navigation;