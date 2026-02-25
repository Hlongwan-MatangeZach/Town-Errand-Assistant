import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { themes } from '../../constants/theme';

type Item = {
    id: string;
    name: string;
    quantity: string;
    category: string;
    estimatedPrice: number | null;
    completed: boolean;
    addedDate: string;
    scanned: boolean;
    fromAI: boolean;
};

type Basket = {
    id: string;
    name: string;
    items: Item[];
    completed: boolean;
    createdAt: string;
    budget: number | null;
    aiGenerated: boolean;
};

interface BasketCardProps {
    item: Basket;
    calculateTotal: (items: Item[]) => number;
    onPress: (basket: Basket) => void;
    onAddItem: (basketId: string) => void;
    onMorePress: (basket: Basket) => void;
}

const BasketCard: React.FC<BasketCardProps> = ({
    item,
    calculateTotal,
    onPress,
    onAddItem,
    onMorePress
}) => {
    const estimatedTotal = calculateTotal(item.items);
    const spentTotal = item.items
        .filter(i => i.completed)
        .reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
    const remainingBalance = item.budget ? item.budget - spentTotal : null;

    const progress =
        item.items.length > 0 ? item.items.filter((i) => i.completed).length / item.items.length : 0;

    return (
        <View style={styles.basketCardWrapper}>
            <Pressable style={styles.basketCard} onPress={() => onPress(item)}>
                <View style={styles.basketHeaderRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.basketTitle} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={styles.basketSubtitle} numberOfLines={1}>
                            {new Date(item.createdAt).toLocaleDateString()} • {item.items.length} Items
                        </Text>
                    </View>

                    <View style={styles.basketActions}>
                        <Pressable
                            style={styles.miniIconBtn}
                            onPress={() => onAddItem(item.id)}
                        >
                            <Ionicons name="add" size={18} color={themes.light.colors.primary} />
                        </Pressable>

                        <Pressable
                            style={styles.miniIconBtn}
                            onPress={() => onMorePress(item)}
                        >
                            <Ionicons name="ellipsis-horizontal" size={18} color={themes.light.colors.textSecondary} />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                </View>

                <View style={styles.basketStatsRow}>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>ESTIMATED</Text>
                        <Text style={styles.statValue}>R{estimatedTotal.toFixed(2)}</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>BUDGET</Text>
                        <Text
                            style={[
                                styles.statValue,
                                item.budget && estimatedTotal > item.budget ? { color: themes.light.colors.danger } : null,
                            ]}
                        >
                            {item.budget ? `R${item.budget.toFixed(2)}` : "—"}
                        </Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>SPENT</Text>
                        <Text style={styles.statValue}>R{spentTotal.toFixed(2)}</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>REMAINING</Text>
                        <Text
                            style={[
                                styles.statValue,
                                remainingBalance !== null && remainingBalance < 0 ? { color: themes.light.colors.danger } : null,
                                remainingBalance !== null && remainingBalance > 0 ? { color: themes.light.colors.success } : null,
                            ]}
                        >
                            {remainingBalance !== null ? `R${remainingBalance.toFixed(2)}` : "—"}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    basketCardWrapper: {
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    basketCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(17,24,39,0.06)",
    },
    basketHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 14,
    },
    basketTitle: { 
        fontSize: 17, 
        fontWeight: "900", 
        color: themes.light.colors.text 
    },
    basketSubtitle: { 
        fontSize: 12, 
        color: themes.light.colors.textSecondary, 
        marginTop: 3, 
        fontWeight: "600" 
    },

    basketActions: {
        flexDirection: "row",
        gap: 8,
    },
    miniIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(17,24,39,0.05)",
    },

    progressContainer: {
        height: 6,
        backgroundColor: "#F3F4F6",
        borderRadius: 3,
        marginBottom: 14,
        overflow: "hidden",
    },
    progressBar: { 
        height: "100%", 
        borderRadius: 3, 
        backgroundColor: themes.light.colors.primary 
    },

    basketStatsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    statCol: {
        flex: 1,
        alignItems: "flex-start",
    },
    statLabel: { 
        fontSize: 8, 
        fontWeight: "900", 
        color: themes.light.colors.textSecondary, 
        letterSpacing: 0.3 
    },
    statValue: {
        fontSize: 12,
        fontWeight: "900",
        color: themes.light.colors.text,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 18,
        backgroundColor: "rgba(17,24,39,0.08)",
        marginHorizontal: 8,
    },
});

export default BasketCard;
