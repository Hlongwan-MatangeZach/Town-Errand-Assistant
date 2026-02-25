import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { themes } from '../../constants/theme';

interface EmptyBasketsProps {
    onGenerateWithAI: () => void;
    onAddManually: () => void;
}

const EmptyBaskets: React.FC<EmptyBasketsProps> = ({ onGenerateWithAI, onAddManually }) => {
    return (
        <View style={styles.emptyWrapper}>
            <View style={styles.emptyIconWrapper}>
                <MaterialIcons name='shopping-basket' size={48} color={themes.light.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No baskets yet</Text>
            <Text style={styles.emptyDescription}>
                Your shopping list is empty. Use AI to generate a list or create one manually to get started.
            </Text>

            <Pressable style={styles.ctaBtn} onPress={onGenerateWithAI}>
                <Ionicons name='sparkles-outline' size={20} color={themes.light.colors.surface} />
                <Text style={styles.ctaBtnText}>Generate with AI</Text>
            </Pressable>

            <Pressable style={styles.secondaryCta} onPress={onAddManually}>
                <Text style={styles.secondaryCtaText}>Create basket manually</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    emptyWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -100,
    },
    emptyIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: themes.light.colors.text,
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        color: themes.light.colors.textSecondary,
        marginBottom: 32,
    },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: themes.light.colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 30,
        shadowColor: themes.light.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    ctaBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: themes.light.colors.surface,
    },
    secondaryCta: {
        marginTop: 20,
        padding: 10,
    },
    secondaryCtaText: {
        fontSize: 16,
        fontWeight: '600',
        color: themes.light.colors.primary,
    },
});

export default EmptyBaskets;
