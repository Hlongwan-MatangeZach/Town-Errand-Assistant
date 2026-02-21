import { themes } from "@/constants/theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Navigation from "../../components/navigation";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import AddCard from "../../components/wallet/addCard";
import BarcodeScanner from "../../components/wallet/BarcodeScanner";
import CardDetailModal from "../../components/wallet/cardDetails";
import {
    CARDS_STORAGE_KEY,
    USAGE_STORAGE_KEY,
} from "../../components/wallet/constants";
import RecentUsageList from "../../components/wallet/RecentUsageList";
import SwipeableHeroCard from "../../components/wallet/SwipeableHeroCard";
import { Card, UsageEntry } from "../../components/wallet/types";

export default function MyCardsScreen() {

    const [cards, setCards] = useState<Card[]>([]);
    const [recentUsage, setRecentUsage] = useState<UsageEntry[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const [scanning, setScanning] = useState(false);
    const [scanEnabled, setScanEnabled] = useState(true);
    const [scannedBarcode, setScannedBarcode] = useState("");

    const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
    const [manualModal, setManualModal] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [detailModal, setDetailModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);


    // Reset scan lock whenever scanner is opened
    useEffect(() => {
        if (scanning) setScanEnabled(true);
    }, [scanning]);

    // Load persisted data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Auto-save cards whenever they change (only after initial load)
    useEffect(() => {
        if (isLoaded) saveCardsToStorage(cards);
    }, [cards, isLoaded]);

    // Auto-save usage whenever it changes (only after initial load)
    useEffect(() => {
        if (isLoaded) saveUsageToStorage(recentUsage);
    }, [recentUsage, isLoaded]);

    const loadData = async () => {
        try {
            const [storedCards, storedUsage] = await Promise.all([
                AsyncStorage.getItem(CARDS_STORAGE_KEY),
                AsyncStorage.getItem(USAGE_STORAGE_KEY),
            ]);

            if (storedCards) setCards(JSON.parse(storedCards));
            if (storedUsage) setRecentUsage(JSON.parse(storedUsage));
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoaded(true);
        }
    };

    const saveCardsToStorage = async (data: Card[]) => {
        try {
            await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Error saving cards:", error);
        }
    };

    const saveUsageToStorage = async (data: UsageEntry[]) => {
        try {
            await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Error saving usage:", error);
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (!scanEnabled) return;
        setScanEnabled(false);
        setScanning(false);
        setScannedBarcode(data);

        Alert.alert("Card Detected", `Scanned: ${data}`, [
            { text: "Add Card", onPress: () => setManualModal(true) },
            {
                text: "Scan Again",
                style: "cancel",
                onPress: () => setScanning(true),
            },
        ]);
    };

    const addCardManually = (card: Partial<Card>) => {
        const newCard: Card = {
            ...card,
            id: card.id || Date.now().toString(),
            createdAt: card.createdAt || new Date().toISOString(),
        } as Card;
        setCards((prev) => [...prev, newCard]);
        setScannedBarcode("");
    };

    const trackUsage = (card: Card) => {
        const newEntry: UsageEntry = {
            id: Date.now().toString(),
            cardId: card.id,
            shopName: card.storeName || "Unknown Store",
            date: new Date().toISOString(),
        };
        setRecentUsage((prev) => [newEntry, ...prev].slice(0, 5));
    };

    const handleCardPress = (card: Card) => {
        trackUsage(card);
        setSelectedCard(card);
        setDetailModal(true);
    };

    const handleDeleteSingleCard = (cardId: string) => {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
    };

    const handleDeleteAllCards = () => {
        setDeleteModalVisible(true);
    };

    const handleConfirmDelete = async () => {
        setCards([]);
        setRecentUsage([]);
        setDeleteModalVisible(false);
        try {
            await AsyncStorage.multiRemove([CARDS_STORAGE_KEY, USAGE_STORAGE_KEY]);
        } catch (error) {
            console.error("Error clearing storage:", error);
        }
    };

    const handleScanBarcode = () => {
        setScanning(true);
        setManualModal(false);
    };

    const handleCloseManualModal = () => {
        setManualModal(false);
    };

    const toggleViewMode = () => {
        setViewMode((prev) => (prev === "cards" ? "list" : "cards"));
    };

    // ─── Derived / Memoised ─────────────────────────────────────────────

    const orderedCards = useMemo(() => {
        return [...cards].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [cards]);

    const filteredCards = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return orderedCards;
        return orderedCards.filter((card) => {
            const store = String(card?.storeName ?? "").toLowerCase();
            const cardName = String(card?.cardName ?? "").toLowerCase();
            const barcode = String(card?.barcode ?? "").toLowerCase();
            return store.includes(q) || cardName.includes(q) || barcode.includes(q);
        });
    }, [orderedCards, searchQuery]);

    const hasCards = cards.length > 0;
    const hasResults = filteredCards.length > 0;
    const clearSearch = () => setSearchQuery("");

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor={themes.light.colors.background}
                />
                <View style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>My Cards</Text>
                            <Text style={styles.subtitle}>
                                {cards.length} card{cards.length !== 1 ? "s" : ""} saved
                            </Text>
                        </View>

                        <View style={styles.headerActions}>
                            {hasCards && (
                                <Pressable style={styles.iconBtnGhost} onPress={handleDeleteAllCards}>
                                    <Ionicons name="trash-outline" size={20} color={themes.light.colors.danger} />
                                </Pressable>
                            )}

                            <Pressable style={styles.headerBtnPrimary} onPress={handleScanBarcode}>
                                <Ionicons name="scan" size={20} color={themes.light.colors.surface} />
                            </Pressable>

                            <Pressable style={styles.headerBtnSecondary} onPress={() => setManualModal(true)}>
                                <Ionicons name="add" size={20} color={themes.light.colors.primary} />
                            </Pressable>
                        </View>
                    </View>

                    {hasCards && (
                        <View style={styles.searchContainer}>
                            <View style={styles.searchWrapper}>
                                <Ionicons name="search-outline" size={20} color={themes.light.colors.textSecondary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search cards or scan barcode..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    returnKeyType="search"
                                    placeholderTextColor={themes.light.colors.textSecondary}
                                />
                                {searchQuery.length > 0 ? (
                                    <Pressable onPress={() => setSearchQuery("")} style={styles.searchIcon}>
                                        <Ionicons name="close-circle" size={20} color={themes.light.colors.textSecondary} />
                                    </Pressable>
                                ) : (
                                    <Pressable onPress={handleScanBarcode} style={styles.searchIcon}>
                                        <Ionicons name="scan" size={20} color={themes.light.colors.textSecondary} />
                                    </Pressable>
                                )}
                            </View>

                            <Pressable
                                style={[
                                    styles.viewBtn,
                                    viewMode === "cards" && styles.viewBtnActive,
                                ]}
                                onPress={toggleViewMode}
                            >
                                <Ionicons
                                    name={viewMode === "cards" ? "copy-outline" : "list-outline"}
                                    size={20}
                                    color={
                                        viewMode === "cards"
                                            ? themes.light.colors.surface
                                            : themes.light.colors.textSecondary
                                    }
                                />
                                <Text style={[styles.viewBtnText, viewMode === "cards" && styles.viewBtnTextActive,]}>
                                    {viewMode === "cards" ? "Cards" : "List"}
                                </Text>
                                <View style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor:
                                        viewMode === "cards"
                                            ? themes.light.colors.surface
                                            : themes.light.colors.textSecondary,
                                    marginLeft: 8,
                                }} />
                            </Pressable>
                        </View>
                    )}

                    <View style={{ flex: 1 }}>
                        {!hasCards ? (
                            <View style={styles.emptyWrapper}>
                                <View style={styles.emptyIconWrapper}>
                                    <MaterialIcons name="add-card" size={48} color={themes.light.colors.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>No cards yet</Text>
                                <Text style={styles.emptyDescription}>
                                    Your digital wallet is empty. Scan a loyalty card or add one
                                    manually to get started.
                                </Text>

                                <Pressable style={styles.ctaBtn} onPress={handleScanBarcode}>
                                    <Ionicons name="scan-outline" size={20} color={themes.light.colors.surface} />
                                    <Text style={styles.ctaBtnText}>Scan First Card</Text>
                                </Pressable>

                                <Pressable style={styles.secondaryCta} onPress={() => setManualModal(true)}>
                                    <Text style={styles.secondaryCtaText}>Enter details manually</Text>
                                </Pressable>
                            </View>
                        ) : viewMode === "cards" ? (
                            <FlatList
                                data={
                                    hasResults
                                        ? [{ key: "deck" }, { key: "history" }]
                                        : [{ key: "deck" }]
                                }
                                keyExtractor={(item) => item.key}
                                contentContainerStyle={{ paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => {
                                    if (item.key === "deck") {
                                        return hasResults ? (
                                            <SwipeableHeroCard
                                                cards={filteredCards}
                                                onPressCard={handleCardPress}
                                            />
                                        ) : (
                                            <View style={styles.noResultsContainer}>
                                                <Text style={styles.noResultsText}>
                                                    No cards match &quot;{searchQuery}&quot;
                                                </Text>
                                                <Pressable onPress={clearSearch}>
                                                    <Text style={styles.linkText}>Clear Search</Text>
                                                </Pressable>
                                            </View>
                                        );
                                    }
                                    if (item.key === "history") {
                                        return <RecentUsageList history={recentUsage} onClear={() => setRecentUsage([])} />;
                                    }
                                    return null;
                                }}
                            />
                        ) : (
                            /* List View */
                            <FlatList
                                data={filteredCards}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>
                                            No cards match &quot;{searchQuery}&quot;
                                        </Text>
                                        <Pressable onPress={clearSearch}>
                                            <Text style={styles.linkText}>Clear Search</Text>
                                        </Pressable>
                                    </View>
                                }
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={styles.listItemCard}
                                        onPress={() => handleCardPress(item)}
                                    >
                                        <View
                                            style={[
                                                styles.listIcon,
                                                {
                                                    backgroundColor:
                                                        item.color || themes.light.colors.primary,
                                                },
                                            ]}
                                        >
                                            {item.image ? (
                                                <Image
                                                    source={{ uri: item.image }}
                                                    style={styles.listImage}
                                                />
                                            ) : (
                                                <Text style={styles.listInitial}>
                                                    {(item.storeName || "C").charAt(0).toUpperCase()}
                                                </Text>
                                            )}
                                        </View>

                                        <View style={styles.listContent}>
                                            <Text style={styles.listTitle}>{item.storeName}</Text>
                                            <Text style={styles.listSubtitle}>{item.cardName}</Text>
                                        </View>

                                        <Ionicons
                                            name="chevron-forward"
                                            size={18}
                                            color="#D1D5DB"
                                        />
                                    </Pressable>
                                )}
                            />
                        )}
                    </View>

                    <AddCard
                        visible={manualModal}
                        onClose={handleCloseManualModal}
                        onSave={addCardManually}
                        onScanRequest={handleScanBarcode}
                        scannedBarcode={scannedBarcode}
                    />

                    <ConfirmationModal
                        visible={deleteModalVisible}
                        title="Delete all cards"
                        message="Are you sure you want to delete all cards? This action cannot be undone."
                        onConfirm={handleConfirmDelete}
                        onCancel={() => setDeleteModalVisible(false)}
                        confirmText="Delete"
                        cancelText="Cancel"
                        type="danger"
                    />

                    <CardDetailModal
                        visible={detailModal}
                        card={selectedCard}
                        onClose={() => setDetailModal(false)}
                        onDelete={handleDeleteSingleCard}
                    />

                    <BarcodeScanner
                        visible={scanning}
                        scanEnabled={scanEnabled}
                        onBarcodeScanned={handleBarCodeScanned}
                        onClose={() => setScanning(false)}
                    />

                    <Navigation />
                </View>
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: themes.light.colors.background,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: themes.light.colors.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: themes.light.colors.textSecondary,
        marginTop: 2,
        fontWeight: "500",
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    headerBtnPrimary: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: themes.light.colors.primary,
        justifyContent: "center",
        alignItems: "center",
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
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D1D5DB",
    },
    iconBtnGhost: {
        padding: 8,
    },

    // Empty State
    emptyWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        marginTop: -100,
    },
    emptyIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: themes.light.colors.text,
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
        color: themes.light.colors.textSecondary,
        marginBottom: 32,
    },
    ctaBtn: {
        flexDirection: "row",
        alignItems: "center",
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
        fontWeight: "700",
        color: themes.light.colors.surface,
    },
    secondaryCta: {
        marginTop: 20,
        padding: 10,
    },
    secondaryCtaText: {
        fontSize: 16,
        fontWeight: "600",
        color: themes.light.colors.primary,
    },

    // Search
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    searchWrapper: {
        flex: 1,
        backgroundColor: themes.light.colors.surface,
        height: 44,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 14,
        paddingRight: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: themes.light.colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: themes.light.colors.text,
        paddingVertical: 0,
    },
    searchIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
    },

    // View Toggle
    viewBtn: {
        height: 40,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: themes.light.colors.border,
        backgroundColor: themes.light.colors.surface,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    viewBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: themes.light.colors.text,
    },
    viewBtnActive: {
        backgroundColor: themes.light.colors.primary,
        borderColor: themes.light.colors.primary,
    },
    viewBtnTextActive: {
        color: themes.light.colors.surface,
    },

    // List Item Card
    listItemCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: themes.light.colors.surface,
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.02)",
    },
    listIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
        overflow: "hidden",
    },
    listImage: {
        width: "100%",
        height: "100%",
    },
    listInitial: {
        color: "white",
        fontSize: 20,
        fontWeight: "700",
    },
    listContent: {
        flex: 1,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: themes.light.colors.text,
        marginBottom: 2,
    },
    listSubtitle: {
        fontSize: 13,
        color: themes.light.colors.textSecondary,
    },

    // No Results
    noResultsContainer: {
        padding: 40,
        alignItems: "center",
    },
    noResultsText: {
        fontSize: 16,
        color: themes.light.colors.textSecondary,
        textAlign: "center",
        marginBottom: 8,
    },
    linkText: {
        color: themes.light.colors.primary,
        fontWeight: "600",
    },

});