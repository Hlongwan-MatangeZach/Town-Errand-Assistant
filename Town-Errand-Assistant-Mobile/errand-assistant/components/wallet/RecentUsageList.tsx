import { themes } from '@/constants/theme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ConfirmationModal from '../ui/ConfirmationModal';
import { UsageEntry } from './types';

type RecentUsageListProps = {
    history: UsageEntry[];
    onClear?: () => void;
};

export default function RecentUsageList({ history, onClear }: RecentUsageListProps) {
    const [clearModalVisible, setClearModalVisible] = useState(false);

    if (!history || history.length === 0) return null;

    const handleClear = () => {
        setClearModalVisible(true);
    };

    const handleConfirmClear = () => {
        setClearModalVisible(false);
        onClear?.();
    };

    return (
        <>
            <ConfirmationModal
                visible={clearModalVisible}
                title="Clear Recent Activity"
                message="Are you sure you want to clear all recent activity? This action cannot be undone."
                onConfirm={handleConfirmClear}
                onCancel={() => setClearModalVisible(false)}
                confirmText="Clear"
                cancelText="Cancel"
                type="danger"
            />
            <View style={styles.recentSection}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <Ionicons name="time-outline" size={16} color={themes.light.colors.textSecondary} />
                    <Pressable onPress={handleClear} style={styles.clearButton}>
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </Pressable>
                </View>

                <View style={styles.recentListContainer}>
                {history.map((item, index) => (
                    <View
                        key={item.id || String(index)}
                        style={[
                            styles.recentItem,
                            index === history.length - 1 && { borderBottomWidth: 0 },
                        ]}
                    >
                        <View style={styles.recentIconBox}>
                            <FontAwesome5 name="store" size={12} color={themes.light.colors.primary} />
                        </View>
                        <View style={styles.recentInfo}>
                            <Text style={styles.recentStore}>{item.shopName}</Text>
                            <Text style={styles.recentDate}>
                                {new Date(item.date).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                })}{' '}
                                •{' '}
                                {new Date(item.date).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Used</Text>
                        </View>
                    </View>
                ))}
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    recentSection: {
        marginTop: 10,
        marginHorizontal: 20,
        marginBottom: 40,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: themes.light.colors.text,
        flex: 1,
    },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFE4E4',
        borderRadius: 8,
    },
    clearButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#DC2626',
    },
    recentListContainer: {
        backgroundColor: themes.light.colors.surface,
        borderRadius: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    recentIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    recentInfo: {
        flex: 1,
    },
    recentStore: {
        fontSize: 15,
        fontWeight: '600',
        color: themes.light.colors.text,
    },
    recentDate: {
        fontSize: 12,
        color: themes.light.colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#ECFDF5',
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
        textTransform: 'uppercase',
    },
});
