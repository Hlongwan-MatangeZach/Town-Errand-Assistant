import { themes } from '@/constants/theme';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SCREEN_WIDTH } from './constants';
import HeroCardFace from './HeroCardFace';
import { Card } from './types';
import { clampIndex } from './utils';

type SwipeableHeroCardProps = {
    cards: Card[];
    onPressCard: (c: Card) => void;
};

export default function SwipeableHeroCard({
    cards,
    onPressCard,
}: SwipeableHeroCardProps) {
    const ordered = useMemo(() => [...cards], [cards]);
    const [index, setIndex] = useState(0);

    // Keep index valid when list changes (search/filter/delete)
    useEffect(() => {
        setIndex((i) => clampIndex(i, ordered.length));
    }, [ordered.length]);

    const current = ordered.length ? ordered[index] : undefined;
    const next = ordered.length
        ? ordered[clampIndex(index + 1, ordered.length)]
        : undefined;

    const tx = useSharedValue(0);
    const rotate = useSharedValue(0);

    const goNext = () => setIndex((i) => clampIndex(i + 1, ordered.length));
    const goPrev = () => setIndex((i) => clampIndex(i - 1, ordered.length));

    const pan = Gesture.Pan()
        // Reduce conflicts with vertical scrolling
        .activeOffsetX([-15, 15])
        .failOffsetY([-15, 15])
        .onChange((e) => {
            tx.value = e.translationX;
            rotate.value = (e.translationX / (SCREEN_WIDTH * 0.5)) * 15;
        })
        .onEnd(() => {
            if (Math.abs(tx.value) > 80) {
                runOnJS(tx.value < 0 ? goNext : goPrev)();
            }
            tx.value = withSpring(0);
            rotate.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tx.value }, { rotate: `${rotate.value}deg` }],
    }));

    if (!current) return null;

    // Dots: show a 5-dot window around current index
    const maxDots = 5;
    const len = ordered.length;
    const dotCount = Math.min(len, maxDots);
    const start =
        len <= maxDots ? 0 : Math.min(Math.max(index - 2, 0), len - maxDots);
    const activeDot = len <= maxDots ? index : index - start;

    return (
        <View style={styles.heroWrap}>
            {ordered.length > 1 && next && (
                <View style={styles.heroBehindContainer} pointerEvents='none'>
                    <HeroCardFace card={next} muted />
                </View>
            )}

            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.heroTop, animatedStyle]}>
                    <Pressable onPress={() => onPressCard(current)}>
                        <HeroCardFace card={current} />
                    </Pressable>
                </Animated.View>
            </GestureDetector>

            <View style={styles.paginationPill}>
                {Array.from({ length: dotCount }).map((_, i) => (
                    <View key={i} style={[styles.dot, i === activeDot && styles.dotActive]} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    heroWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    heroTop: {
        zIndex: 10,
    },
    heroBehindContainer: {
        position: 'absolute',
        top: 20,
        transform: [{ scale: 0.92 }, { rotate: '-2deg' }],
        zIndex: 0,
        opacity: 0.7,
    },
    paginationPill: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 24,
        height: 8,
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D1D5DB',
    },
    dotActive: {
        width: 24,
        height: 6,
        borderRadius: 3,
        backgroundColor: themes.light.colors.primary,
    },
});
