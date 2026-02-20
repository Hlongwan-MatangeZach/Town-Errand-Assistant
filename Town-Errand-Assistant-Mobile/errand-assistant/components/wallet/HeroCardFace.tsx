import { themes } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { CARD_H, CARD_W } from './constants';
import { Card } from './types';
import { shadeHex } from './utils';

type HeroCardFaceProps = {
    card: Card;
    muted?: boolean;
    mutedColor?: string;
};

export default function HeroCardFace({
    card,
    muted,
    mutedColor,
}: HeroCardFaceProps) {
    const color = card?.color || themes.light.colors.primary;
    const baseColor = muted ? (mutedColor ?? card?.color ?? themes.light.colors.primary) : color;

    // Add depth (instead of flat solid color)
    const c1 = shadeHex(baseColor, muted ? -6 : 0);
    const c2 = shadeHex(baseColor, muted ? -14 : -18);
    const gradientColors = [c1, c2];

    return (
        <View
            style={[
                styles.heroCardShadowWrapper,
                muted && styles.heroCardShadowMuted,
            ]}
        >
            <LinearGradient
                colors={gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.heroCard, muted && { opacity: 0.82 }]}
            >
                {!muted && (
                    <>
                        <View style={styles.cardPatternCircle} />
                        <View style={styles.cardPatternCircleSmall} />
                        <View style={styles.cardGlossOverlay} />
                    </>
                )}

                <View style={styles.heroInner}>
                    <View style={styles.heroHeaderRow}>
                        <Text style={styles.heroStore} numberOfLines={1}>
                            {card?.storeName || 'Store Name'}
                        </Text>
                        {card?.image ? (
                            <Image source={{ uri: card.image }} style={styles.heroLogo} />
                        ) : (
                            <View style={styles.heroLogoFallback}>
                                <Ionicons name='pricetag' size={16} color='white' />
                            </View>
                        )}
                    </View>

                    {!muted && (
                        <View style={styles.chipRow}>
                            <View style={styles.emvChip}>
                                <View style={styles.emvLine1} />
                                <View style={styles.emvLine2} />
                                <View style={styles.emvLine3} />
                                <View style={styles.emvLine4} />
                            </View>
                            <Ionicons
                                name='wifi'
                                size={20}
                                color='rgba(255,255,255,0.6)'
                                style={{ transform: [{ rotate: '90deg' }] }}
                            />
                        </View>
                    )}

                    <View style={styles.heroContent}>
                        <Text style={styles.heroName} numberOfLines={1}>
                            {card?.cardName || 'Membership Card'}
                        </Text>

                        <View style={styles.heroFooter}>
                            <Text style={styles.heroMeta}>
                                {card?.barcode
                                    ? `•••• ${String(card.barcode).slice(-4)}`
                                    : '**** **** ****'}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    heroCardShadowWrapper: {
        width: CARD_W,
        height: CARD_H,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
        borderRadius: 24,
    },
    heroCardShadowMuted: {
        shadowOpacity: 0,
        elevation: 0,
    },
    heroCard: {
        flex: 1,
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    heroInner: {
        flex: 1,
        justifyContent: 'space-between',
        zIndex: 2,
    },
    cardPatternCircle: {
        position: 'absolute',
        top: -100,
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    cardPatternCircleSmall: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    cardGlossOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    heroHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    heroStore: {
        fontSize: 16,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.95)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroLogo: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: 'white',
    },
    heroLogoFallback: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emvChip: {
        width: 45,
        height: 34,
        borderRadius: 6,
        backgroundColor: '#FCD34D',
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#D97706',
    },
    emvLine1: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#D97706',
    },
    emvLine2: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: 1,
        backgroundColor: '#D97706',
    },
    emvLine3: {
        position: 'absolute',
        top: '20%',
        bottom: '20%',
        left: '25%',
        right: '25%',
        borderWidth: 1,
        borderColor: '#D97706',
        borderRadius: 4,
    },
    emvLine4: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '33%',
        width: 1,
        backgroundColor: '#D97706',
    },
    heroContent: {
        marginTop: 10,
    },
    heroName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        marginBottom: 4,
    },
    heroFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroMeta: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 2,
    },
});
