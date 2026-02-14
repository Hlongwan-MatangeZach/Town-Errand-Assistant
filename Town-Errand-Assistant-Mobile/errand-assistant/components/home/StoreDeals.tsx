import { themes } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

type StoreDeal = {
  id: string;
  name: string;
  label: string;
  pamphletThumb: string | ImageSourcePropType;
  validUntil?: string;
};

const SHOPRITE_PAMPHLET = require("../../assets/images/EC-Shoprite-Specials-DTFK.jpg");
const PNPAY_PAMPHLET = require("../../assets/images/PnPay.jpeg");
const CHECKERS_PAMPHLET = require("../../assets/images/Checkers.jpeg");

const DEALS: StoreDeal[] = [
  {
    id: 'shoprite',
    name: 'Shoprite',
    label: 'Exclusive Deals',
    pamphletThumb: SHOPRITE_PAMPHLET,
  },
  {
    id: 'pnp',
    name: 'Pick n Pay',
    label: 'Weekly Specials',
    pamphletThumb: PNPAY_PAMPHLET,
  },
  {
    id: 'checkers',
    name: 'Checkers',
    label: 'Weekly Specials',
    pamphletThumb: CHECKERS_PAMPHLET,
  },
];

function toImageSource(img: string | ImageSourcePropType): ImageSourcePropType {
  return typeof img === 'string' ? { uri: img } : img;
}

function getInitials(name: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.length === 1
    ? parts[0].slice(0, 1).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
}

const PamphletThumb = memo(function PamphletThumb({
  source,
  fallbackText,
}: {
  source: ImageSourcePropType;
  fallbackText: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{fallbackText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mediaWrap}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={18}
        onError={() => setError(true)}
      />
      <View style={styles.mediaDim} />
      <Image
        source={source}
        style={styles.mediaMain}
        resizeMode= 'contain'
        onError={() => setError(true)}
      />
    </View>
  );
});

const DealCard = memo(function DealCard({
  item,
  onPress,
}: {
  item: StoreDeal;
  onPress: (item: StoreDeal) => void;
}) {
  const initials = useMemo(() => getInitials(item.name), [item.name]);
  const src = useMemo(
    () => toImageSource(item.pamphletThumb),
    [item.pamphletThumb]
  );

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      accessibilityRole='button'
      accessibilityLabel={`${item.name} specials`}
    >
      <PamphletThumb source={src} fallbackText={initials} />
      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        </View>

        {!!item.validUntil && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Until {item.validUntil}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

export default function StoreDeals() {
  const router = useRouter();

  const onPress = useCallback(
    (item: StoreDeal) => {
      router.push({
        pathname: '/deals/[storeId]',
        params: { storeId: item.id },
      });
    },
    [router]
  );

  return (
    <FlatList
      data={DEALS}
      horizontal
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => <DealCard item={item} onPress={onPress} />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      snapToAlignment="start"
      decelerationRate="fast"
    />
  );
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(180, Math.round(width * 0.48));
const CARD_ASPECT = 0.82;
const CARD_HEIGHT = Math.round(CARD_WIDTH / CARD_ASPECT);

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  card: {
    width: CARD_WIDTH - 29,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: themes.light.colors.surface,
    marginBottom: 20,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  mediaWrap: {
    flex: 1,
    backgroundColor: '#111827',
  },
  mediaDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  mediaMain: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  label: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  fallbackText: {
    fontSize: 22,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.75)',
  },
});