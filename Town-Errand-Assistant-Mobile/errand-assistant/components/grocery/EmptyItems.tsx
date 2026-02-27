import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { themes } from '../../constants/theme';

interface EmptyItemsProps {
    onAddItem: () => void;
}

const EmptyItems: React.FC<EmptyItemsProps> = ({ onAddItem }) => {
    return (
        <View style={styles.emptyWrapper}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="cart-outline" size={48} color={themes.light.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>This basket is empty</Text>
            <Text style={styles.emptyDescription}>
                Add items manually or scan a label to fill your list faster.
            </Text>
            <Pressable style={styles.ctaBtn} onPress={onAddItem}>
                <Ionicons name="add" size={18} color="white" />
                <Text style={styles.ctaBtnText}>Add First Item</Text>
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
        marginTop: 60,
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
});

export default EmptyItems;
