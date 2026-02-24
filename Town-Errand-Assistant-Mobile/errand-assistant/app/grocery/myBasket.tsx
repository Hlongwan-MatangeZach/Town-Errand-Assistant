import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Components
import AddBasketModal from '@/components/grocery/addBasket';
import Navigation from '@/components/navigation';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// Constants
import { themes } from '@/constants/theme';

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

/**
 * MyBasketScreen - The main view for managing grocery shopping lists.
 * Features:
 * - Persistent storage with AsyncStorage
 * - AI integration (placeholder)
 * - Full CRUD for baskets (Create, Read, Update, Delete)
 * - Duplication support
 */
export default function MyBasketScreen() {
    // State
    const [baskets, setBaskets] = useState<Basket[]>([]);
    const [activeBasketId, setActiveBasketId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Modals
    const [basketModalVisible, setBasketModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [basketToDelete, setBasketToDelete] = useState<string | null>(null);

    // Basket editing
    const [basketEditMode, setBasketEditMode] = useState(false);
    const [editBasketId, setEditBasketId] = useState<string | null>(null);
    const [basketInitialData, setBasketInitialData] = useState<{
        name: string;
        budget: string;
    } | null>(null);

    // Storage
    const BASKETS_STORAGE_KEY = "@grocery_baskets";

    const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // --- STORAGE EFFECTS ---
    useFocusEffect(
        React.useCallback(() => {
            loadBasketsFromStorage();
        }, [])
    );

    useEffect(() => {
        if (isLoaded) {
            AsyncStorage.setItem(BASKETS_STORAGE_KEY, JSON.stringify(baskets));
        }
    }, [baskets, isLoaded]);

    const loadBasketsFromStorage = async () => {
        try {
            const storedBaskets = await AsyncStorage.getItem(BASKETS_STORAGE_KEY);
            const parsed: Basket[] = storedBaskets ? JSON.parse(storedBaskets) : [];
            setBaskets(parsed);
            setIsLoaded(true);
        } catch (e) {
            console.error(e);
            setIsLoaded(true);
        }
    };


    // --- HELPERS ---
    const calculateTotal = useCallback((itemList: Item[]) =>
        itemList.reduce((sum, i) => {
            if (i.completed) return sum;
            const qty = parseFloat(i.quantity) || 1;
            return sum + (i.estimatedPrice || 0) * qty;
        }, 0), []);

    // --- BASKET ACTIONS ---
    const handleSaveBasket = useCallback((name: string, budgetStr: string) => {
        const budgetVal = budgetStr.trim()
            ? parseFloat(budgetStr.replace(",", "."))
            : NaN;
        const budget = !budgetStr.trim() || isNaN(budgetVal) ? null : budgetVal;

        if (basketEditMode && editBasketId) {
            setBaskets((prev) =>
                prev.map((b) => (b.id === editBasketId ? { ...b, name: name.trim(), budget } : b))
            );
        } else {
            const newBasket: Basket = {
                id: makeId(),
                name: name.trim(),
                items: [],
                completed: false,
                createdAt: new Date().toISOString(),
                budget,
                aiGenerated: false,
            };
            setBaskets((prev) => [newBasket, ...prev]);
        }

        setBasketEditMode(false);
        setEditBasketId(null);
        setBasketInitialData(null);
        setBasketModalVisible(false);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [basketEditMode, editBasketId]);

    const startEditBasket = useCallback((basket: Basket) => {
        setBasketEditMode(true);
        setEditBasketId(basket.id);
        setBasketInitialData({
            name: basket.name,
            budget: basket.budget != null ? String(basket.budget) : "",
        });
        setBasketModalVisible(true);
    }, []);

    const duplicateBasket = useCallback((basket: Basket) => {
        const newName = `${basket.name} (Copy)`;
        const duplicated: Basket = {
            ...basket,
            id: makeId(),
            name: newName,
            items: basket.items.map(it => ({ ...it, id: makeId(), completed: false })),
            createdAt: new Date().toISOString(),
        };
        setBaskets((prev) => [duplicated, ...prev]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const confirmDeleteBasket = useCallback((id: string) => {
        setBasketToDelete(id);
        setDeleteModalVisible(true);
    }, []);

    const handleDeleteBasket = useCallback(() => {
        if (basketToDelete) {
            setBaskets((prev) => prev.filter((b) => b.id !== basketToDelete));
            setDeleteModalVisible(false);
            setBasketToDelete(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, [basketToDelete]);

    const handleBasketPress = useCallback((basket: Basket) => {
        setActiveBasketId(basket.id);
        // Navigation logic for items view goes here
    }, []);

    // --- RENDERERS ---
    const renderBasketItem = useCallback(({ item }: { item: Basket }) => {
        const estimatedTotal = calculateTotal(item.items);
        const progress =
            item.items.length > 0 ? item.items.filter((i) => i.completed).length / item.items.length : 0;

        return (
            <View style={styles.basketCardWrapper}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.basketCard}
                    onPress={() => handleBasketPress(item)}
                >
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
                            <TouchableOpacity
                                activeOpacity={0.6}
                                style={styles.miniIconBtn}
                                onPress={() => startEditBasket(item)}
                            >
                                <Ionicons name="create-outline" size={18} color={themes.light.colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.6}
                                style={styles.miniIconBtn}
                                onPress={() => duplicateBasket(item)}
                            >
                                <Ionicons name="copy-outline" size={18} color={themes.light.colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.6}
                                style={styles.miniIconBtn}
                                onPress={() => confirmDeleteBasket(item.id)}
                            >
                                <Ionicons name="trash-outline" size={18} color={themes.light.colors.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                    </View>

                    <View style={styles.basketStatsRow}>
                        <View>
                            <Text style={styles.statLabel}>ESTIMATED</Text>
                            <Text style={styles.statValue}>R{estimatedTotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View>
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
                    </View>
                </TouchableOpacity>
            </View>
        );
    }, [calculateTotal, handleBasketPress, startEditBasket, duplicateBasket, confirmDeleteBasket]);

    const hasBaskets = useMemo(() => baskets.length > 0, [baskets.length]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <StatusBar
                    barStyle='dark-content'
                    backgroundColor={themes.light.colors.background}
                />
                <View style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>My baskets</Text>
                            <Text style={styles.subtitle}>
                                {baskets.length} basket{baskets.length !== 1 ? 's' : ''} stored
                            </Text>
                        </View>

                        <View style={styles.headerActions}>
                            <Pressable style={styles.headerBtnPrimary} onPress={() => { }}>
                                <Ionicons name='sparkles' size={20} color={themes.light.colors.surface} />
                            </Pressable>

                            <Pressable style={styles.headerBtnSecondary} onPress={() => {
                                setBasketEditMode(false);
                                setEditBasketId(null);
                                setBasketInitialData(null);
                                setBasketModalVisible(true);
                            }}>
                                <Ionicons name='add' size={20} color={themes.light.colors.primary} />
                            </Pressable>
                        </View>
                    </View>

                    {!hasBaskets ? (
                        <View style={styles.emptyWrapper}>
                            <View style={styles.emptyIconWrapper}>
                                <MaterialIcons name="shopping-basket" size={48} color={themes.light.colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>No baskets yet</Text>
                            <Text style={styles.emptyDescription}>
                                Your shopping list is empty. Use AI to generate a list or create one manually to get started.
                            </Text>

                            <Pressable style={styles.ctaBtn} onPress={() => { }}>
                                <Ionicons name="sparkles-outline" size={20} color={themes.light.colors.surface} />
                                <Text style={styles.ctaBtnText}>Generate with AI</Text>
                            </Pressable>

                            <Pressable
                                style={styles.secondaryCta}
                                onPress={() => {
                                    setBasketEditMode(false);
                                    setEditBasketId(null);
                                    setBasketInitialData(null);
                                    setBasketModalVisible(true);
                                }}
                            >
                                <Text style={styles.secondaryCtaText}>Create basket manually</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <FlatList
                            data={baskets}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                            renderItem={renderBasketItem}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* --- MODALS --- */}
                <AddBasketModal
                    visible={basketModalVisible}
                    onClose={() => {
                        setBasketModalVisible(false);
                        setBasketEditMode(false);
                        setEditBasketId(null);
                        setBasketInitialData(null);
                    }}
                    onSave={handleSaveBasket}
                    editMode={basketEditMode}
                    initialName={basketInitialData?.name ?? ''}
                    initialBudget={basketInitialData?.budget ?? ''}
                />

                <ConfirmationModal
                    visible={deleteModalVisible}
                    title="Delete basket"
                    message="Are you sure you want to delete this basket? All items inside will be lost."
                    onConfirm={handleDeleteBasket}
                    onCancel={() => {
                        setDeleteModalVisible(false);
                        setBasketToDelete(null);
                    }}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />

                <Navigation />
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: themes.light.colors.background,
    },
    // Header
    header: {
        paddingHorizontal: 20,
        paddingVertical: 29,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: themes.light.colors.background,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: themes.light.colors.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: themes.light.colors.textSecondary,
        marginTop: 2,
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerBtnPrimary: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: themes.light.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: themes.light.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    headerBtnSecondary: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: themes.light.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    // Basket list cards
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
    basketTitle: { fontSize: 17, fontWeight: "900", color: themes.light.colors.text },
    basketSubtitle: { fontSize: 12, color: themes.light.colors.textSecondary, marginTop: 3, fontWeight: "600" },

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
    progressBar: { height: "100%", borderRadius: 3, backgroundColor: themes.light.colors.primary },

    basketStatsRow: { flexDirection: "row", alignItems: "center" },
    statLabel: { fontSize: 9, fontWeight: "900", color: themes.light.colors.textSecondary, letterSpacing: 0.5 },
    statValue: {
        fontSize: 14,
        fontWeight: "900",
        color: themes.light.colors.text,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: themes.light.colors.border,
        marginHorizontal: 16,
    },

    // --- EMPTY STATE ---
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


