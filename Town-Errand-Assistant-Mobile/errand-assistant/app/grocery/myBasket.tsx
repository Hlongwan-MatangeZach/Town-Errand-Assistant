import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Components
import AddBasketModal from '../../components/grocery/addBasket';
import AddItemModal from '../../components/grocery/addItem';
import BasketActionsModal from '../../components/grocery/BasketActionsModal';
import BasketCard from '../../components/grocery/BasketCard';
import EmptyBaskets from '../../components/grocery/EmptyBaskets';
import EmptyItems from '../../components/grocery/EmptyItems';
import ItemRow from '../../components/grocery/ItemRow';
import ScanOptionsModal from '../../components/grocery/ScanOptionsModal';
import Navigation from '../../components/navigation';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// Constants
import { themes } from '../../constants/theme';
import { router } from 'expo-router';

const { width } = Dimensions.get("window");

// --- LOGIC HELPER (MOCK OCR) ---
const extractTextFromImage = async (imageUri: string) => {
    try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const mockResults = [
            { text: "BREAD", confidence: 0.9 },
            { text: "R25.99", confidence: 0.95 },
            { text: "MILK 2L", confidence: 0.85 },
            { text: "R18.50", confidence: 0.92 },
        ];
        const priceRegex = /R?\s*\d+[.,]\d{2}/i;
        const productNames = mockResults
            .filter((item) => !priceRegex.test(item.text))
            .sort((a, b) => b.confidence - a.confidence);
        const prices = mockResults
            .filter((item) => priceRegex.test(item.text))
            .sort((a, b) => b.confidence - a.confidence);

        let extractedName = "";
        let extractedPrice = "";

        if (productNames.length > 0) extractedName = productNames[0].text;
        if (prices.length > 0)
            extractedPrice = prices[0].text.replace(/[^\d.,]/g, "").replace(",", ".");

        return { name: extractedName, price: extractedPrice, success: true };
    } catch (error) {
        return { name: "", price: "", success: false, error: String(error) };
    }
};

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

export default function MyBasketScreen() {
    // State
    const [baskets, setBaskets] = useState<Basket[]>([]);
    const [activeBasketId, setActiveBasketId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [viewMode, setViewMode] = useState<"baskets" | "items">("baskets");
    const [groupByCategory, setGroupByCategory] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modals
    const [basketModalVisible, setBasketModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [basketToDelete, setBasketToDelete] = useState<string | null>(null);
    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [basketActionsModalVisible, setBasketActionsModalVisible] = useState(false);
    const [selectedActionBasket, setSelectedActionBasket] = useState<Basket | null>(null);

    // Basket editing
    const [basketEditMode, setBasketEditMode] = useState(false);
    const [editBasketId, setEditBasketId] = useState<string | null>(null);
    const [basketInitialData, setBasketInitialData] = useState<{
        name: string;
        budget: string;
    } | null>(null);

    // Item Editing/Adding
    const [editMode, setEditMode] = useState(false);
    const [editItemId, setEditItemId] = useState<string | null>(null);
    const [tempScannedData, setTempScannedData] = useState<any>(null);

    // Scan & Camera
    const [scanning, setScanning] = useState(false);
    const [showScanOptions, setShowScanOptions] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

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

            // Set active basket if coming back to items view
            if (activeBasketId && !parsed.find(b => b.id === activeBasketId)) {
                setActiveBasketId(null);
                setViewMode("baskets");
            }
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

    const activeBasket = useMemo(() => baskets.find((b) => b.id === activeBasketId), [baskets, activeBasketId]);
    const items = useMemo(() => activeBasket?.items || [], [activeBasket]);
    const totalCost = useMemo(() => calculateTotal(items), [items, calculateTotal]);
    const completedCount = useMemo(() => items.filter((i) => i.completed).length, [items]);

    const filteredBaskets = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return baskets;
        return baskets.filter(b => b.name.toLowerCase().includes(q));
    }, [baskets, searchQuery]);

    const filteredItems = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return items;
        return items.filter(i => i.name.toLowerCase().includes(q));
    }, [items, searchQuery]);

    const groupedItems = useMemo(() => {
        if (!groupByCategory) return [];
        const grouped: Record<string, Item[]> = {};
        filteredItems.forEach((i) => {
            const k = i.category || "Other";
            if (!grouped[k]) grouped[k] = [];
            grouped[k].push(i);
        });
        return Object.keys(grouped).map((k) => ({ title: k, data: grouped[k] }));
    }, [filteredItems, groupByCategory]);

    const getCategoryColor = (cat: string) => {
        const colors: any = {
            Food: "#10B981",
            Toiletries: "#8B5CF6",
            Cleaning: "#F59E0B",
            Household: "#3B82F6",
            "Personal Care": "#EC4899",
            Electronics: "#06B6D4",
            Clothing: "#F97316",
            Books: "#8B5CF6",
            Other: "#6B7280",
        };
        return colors[cat] || "#6B7280";
    };

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
        setSearchQuery("");
        setViewMode("items");
    }, []);

    const openBasketActions = useCallback((basket: Basket) => {
        setSelectedActionBasket(basket);
        setBasketActionsModalVisible(true);
    }, []);

    // --- ITEM ACTIONS ---
    const handleSaveItem = useCallback((itemData: any) => {
        if (!activeBasketId) return;

        if (editMode && editItemId) {
            setBaskets((prev) =>
                prev.map((b) =>
                    b.id === activeBasketId
                        ? {
                            ...b,
                            items: b.items.map((i) =>
                                i.id === editItemId
                                    ? {
                                        ...i,
                                        name: itemData.name,
                                        quantity: itemData.quantity,
                                        category: itemData.category,
                                        estimatedPrice: itemData.estimatedPrice
                                            ? parseFloat(itemData.estimatedPrice)
                                            : null,
                                    }
                                    : i
                            ),
                        }
                        : b
                )
            );
        } else {
            const newItem: Item = {
                id: makeId(),
                name: itemData.name,
                quantity: itemData.quantity,
                category: itemData.category,
                estimatedPrice: itemData.estimatedPrice ? parseFloat(itemData.estimatedPrice) : null,
                completed: false,
                addedDate: new Date().toLocaleDateString(),
                scanned: !!tempScannedData,
                fromAI: false,
            };

            setBaskets((prev) =>
                prev.map((b) => (b.id === activeBasketId ? { ...b, items: [newItem, ...b.items] } : b))
            );
        }

        setItemModalVisible(false);
        setEditMode(false);
        setEditItemId(null);
        setTempScannedData(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [activeBasketId, editMode, editItemId, tempScannedData]);

    const toggleItemCompletion = useCallback((itemId: string) => {
        if (!activeBasketId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setBaskets((prev) =>
            prev.map((b) =>
                b.id === activeBasketId
                    ? {
                        ...b,
                        items: b.items.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i)),
                    }
                    : b
            )
        );
    }, [activeBasketId]);

    const deleteItem = useCallback((itemId: string) => {
        if (!activeBasketId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setBaskets((prev) =>
            prev.map((b) => (b.id === activeBasketId ? { ...b, items: b.items.filter((i) => i.id !== itemId) } : b))
        );
    }, [activeBasketId]);

    const handleEditItem = useCallback((item: Item) => {
        setEditMode(true);
        setEditItemId(item.id);
        setTempScannedData({
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            estimatedPrice: item.estimatedPrice ? String(item.estimatedPrice) : "",
        });
        setItemModalVisible(true);
    }, []);

    const handleAddItemPress = useCallback(() => {
        if (viewMode === "baskets") {
            setBasketEditMode(false);
            setEditBasketId(null);
            setBasketInitialData(null);
            setBasketModalVisible(true);
        } else {
            setEditMode(false);
            setEditItemId(null);
            setTempScannedData(null);
            setItemModalVisible(true);
        }
    }, [viewMode]);

    // --- SCAN HANDLERS ---
    const initiateScan = useCallback(async () => {
        setItemModalVisible(false);
        setShowScanOptions(true);
    }, []);

    const handleCameraScan = useCallback(async () => {
        if (!permission?.granted) {
            const { status } = await requestPermission();
            if (status !== "granted") {
                // Should show error dialog
                return;
            }
        }
        setShowScanOptions(false);
        setShowCamera(true);
    }, [permission, requestPermission]);

    const handleGalleryScan = useCallback(async () => {
        setShowScanOptions(false);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            processImage(result.assets[0].uri);
        } else {
            setItemModalVisible(true);
        }
    }, []);

    const takePicture = useCallback(async () => {
        if (!cameraRef.current) return;
        setScanning(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true,
            });
            await processImage(photo.uri);
        } catch (e) {
            console.error(e);
        } finally {
            setScanning(false);
        }
    }, []);

    const processImage = useCallback(async (uri: string) => {
        const res = await extractTextFromImage(uri);
        setShowCamera(false);

        if (res.success) {
            setTempScannedData({
                name: res.name,
                estimatedPrice: res.price,
                quantity: "1",
                category: "Food",
            });
            setItemModalVisible(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            setItemModalVisible(true);
        }
    }, [extractTextFromImage, handleAddItemPress]);

    // --- RENDERERS ---
    const renderBasketItem = useCallback(({ item }: { item: Basket }) => {
        return (
            <BasketCard
                item={item}
                calculateTotal={calculateTotal}
                onPress={handleBasketPress}
                onAddItem={(basketId) => {
                    setActiveBasketId(basketId);
                    setEditMode(false);
                    setEditItemId(null);
                    setTempScannedData(null);
                    setItemModalVisible(true);
                }}
                onMorePress={openBasketActions}
            />
        );
    }, [calculateTotal, handleBasketPress, openBasketActions]);

    const hasBaskets = useMemo(() => baskets.length > 0, [baskets.length]);
    const headerTitle = viewMode === "items" ? activeBasket?.name ?? "Basket" : "My Baskets";
    const headerSubtitle =
        viewMode === "items" ? `${completedCount}/${items.length} items` : `${baskets.length} lists`;

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
                            <Text style={styles.title}>{headerTitle}</Text>
                            <Text style={styles.subtitle}>{headerSubtitle}</Text>
                        </View>

                        <View style={styles.headerActions}>
                            {viewMode === "items" ? (
                                <>
                                    <Pressable
                                        accessibilityLabel="Back to baskets"
                                        onPress={() => {
                                            setViewMode("baskets");
                                            setActiveBasketId(null);
                                            setSearchQuery("");
                                        }}
                                        style={styles.iconButtonGhost}
                                    >
                                        <Ionicons name="arrow-back" size={20} color={themes.light.colors.textSecondary} />
                                    </Pressable>


                                    <Pressable
                                        accessibilityLabel="Toggle grouping"
                                        onPress={() => setGroupByCategory(!groupByCategory)}
                                        style={styles.headerBtnPrimary}
                                    >
                                        <Ionicons
                                            name={groupByCategory ? "list" : "grid"}
                                            size={20}
                                            color="white"
                                        />
                                    </Pressable>

                                    <Pressable
                                        accessibilityLabel="Add item"
                                        onPress={handleAddItemPress}
                                        style={styles.headerBtnSecondary}
                                    >
                                        <Ionicons name="add" size={24} color={themes.light.colors.primary} />
                                    </Pressable>
                                </>
                            ) : (
                                <>
                                    <Pressable
                                        accessibilityLabel="Create with AI"
                                        onPress={() => {router.push("/grocery/aiGrocery") }}
                                        style={styles.headerBtnPrimary}
                                    >
                                        <Ionicons name="sparkles" size={20} color="white" />
                                    </Pressable>

                                    <Pressable
                                        accessibilityLabel="Add basket"
                                        onPress={handleAddItemPress}
                                        style={styles.headerBtnSecondary}
                                    >
                                        <Ionicons name="add" size={24} color={themes.light.colors.primary} />
                                    </Pressable>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Search Bar */}
                    {(viewMode === "baskets" ? hasBaskets : items.length > 0) && (
                        <View style={styles.searchContainer}>
                            <View style={styles.searchWrapper}>
                                <Ionicons name="search-outline" size={20} color={themes.light.colors.textSecondary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder={viewMode === "baskets" ? "Search baskets..." : "Search items..."}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    returnKeyType="search"
                                    placeholderTextColor={themes.light.colors.textSecondary}
                                />
                                {searchQuery.length > 0 && (
                                    <Pressable onPress={() => setSearchQuery("")} style={styles.searchIcon}>
                                        <Ionicons name="close-circle" size={20} color={themes.light.colors.textSecondary} />
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    )}

                    {viewMode === "baskets" ? (
                        !hasBaskets ? (
                            <EmptyBaskets
                                onGenerateWithAI={() => { }}
                                onAddManually={() => {
                                    setBasketEditMode(false);
                                    setEditBasketId(null);
                                    setBasketInitialData(null);
                                    setBasketModalVisible(true);
                                }}
                            />
                        ) : (
                            <FlatList
                                data={filteredBaskets}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                                renderItem={renderBasketItem}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    searchQuery ? (
                                        <View style={styles.noResultsContainer}>
                                            <Ionicons name="search" size={48} color={themes.light.colors.textSecondary} style={{ opacity: 0.2, marginBottom: 16 }} />
                                            <Text style={styles.noResultsText}>No baskets match "{searchQuery}"</Text>
                                            <Pressable onPress={() => setSearchQuery("")}>
                                                <Text style={styles.linkText}>Clear Search</Text>
                                            </Pressable>
                                        </View>
                                    ) : null
                                }
                            />
                        )
                    ) : (
                        <>
                            <View style={styles.statsBar}>
                                <View style={{ alignItems: "center", flex: 1 }}>
                                    <Text style={styles.statsLabel}>REMAINING</Text>
                                    <Text style={styles.statsVal}>{items.length - completedCount}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={{ alignItems: "center", flex: 1 }}>
                                    <Text style={styles.statsLabel}>TOTAL EST</Text>
                                    <Text style={[styles.statsVal, { color: themes.light.colors.primary }]}>
                                        R{totalCost.toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            <FlatList
                                data={groupByCategory ? groupedItems : filteredItems}
                                keyExtractor={(item: any) => (groupByCategory ? item.title : item.id)}
                                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                                renderItem={({ item }) => {
                                    if (groupByCategory) {
                                        if (item.data.length === 0) return null;
                                        return (
                                            <View style={{ marginBottom: 20 }}>
                                                <View style={styles.catHeader}>
                                                    <View
                                                        style={[
                                                            styles.catDot,
                                                            { backgroundColor: getCategoryColor(item.title) },
                                                        ]}
                                                    />
                                                    <Text style={styles.catTitle}>{item.title}</Text>
                                                </View>
                                                <View style={styles.catList}>
                                                    {item.data.map((i: Item) => (
                                                        <ItemRow
                                                            key={i.id}
                                                            item={i}
                                                            onToggle={toggleItemCompletion}
                                                            onEdit={handleEditItem}
                                                            onDelete={deleteItem}
                                                        />
                                                    ))}
                                                </View>
                                            </View>
                                        );
                                    }
                                    return (
                                        <View style={styles.singleItemCard}>
                                            <ItemRow
                                                item={item}
                                                onToggle={toggleItemCompletion}
                                                onEdit={handleEditItem}
                                                onDelete={deleteItem}
                                            />
                                        </View>
                                    );
                                }}
                                ListEmptyComponent={
                                    searchQuery ? (
                                        <View style={styles.noResultsContainer}>
                                            <Ionicons name="search" size={48} color={themes.light.colors.textSecondary} style={{ opacity: 0.2, marginBottom: 16 }} />
                                            <Text style={styles.noResultsText}>No items match "{searchQuery}"</Text>
                                            <Pressable onPress={() => setSearchQuery("")}>
                                                <Text style={styles.linkText}>Clear Search</Text>
                                            </Pressable>
                                        </View>
                                    ) : (
                                        <EmptyItems
                                            onAddItem={() => {
                                                setEditMode(false);
                                                setEditItemId(null);
                                                setTempScannedData(null);
                                                setItemModalVisible(true);
                                            }}
                                        />
                                    )
                                }
                            />
                        </>
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

                <AddItemModal
                    visible={itemModalVisible}
                    onClose={() => {
                        setItemModalVisible(false);
                        setEditMode(false);
                        setEditItemId(null);
                        setTempScannedData(null);
                    }}
                    onSave={handleSaveItem}
                    initialData={tempScannedData}
                    editMode={editMode}
                    onScanRequest={initiateScan}
                />

                <ScanOptionsModal
                    visible={showScanOptions}
                    onClose={() => {
                        setShowScanOptions(false);
                        setItemModalVisible(true);
                    }}
                    onCamera={handleCameraScan}
                    onGallery={handleGalleryScan}
                />

                {/* --- CAMERA --- */}
                <Modal visible={showCamera} animationType="slide">
                    <View style={{ flex: 1, backgroundColor: "black" }}>
                        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
                            <View style={styles.cameraOverlay}>
                                <Pressable
                                    style={styles.cameraClose}
                                    onPress={() => {
                                        setShowCamera(false);
                                        setItemModalVisible(true);
                                    }}
                                >
                                    <Ionicons name="close" size={24} color="white" />
                                </Pressable>

                                <View style={styles.scannerFrame} />

                                <Pressable style={styles.captureBtn} onPress={takePicture}>
                                    {scanning ? (
                                        <ActivityIndicator color={themes.light.colors.primary} />
                                    ) : (
                                        <View style={styles.captureInner} />
                                    )}
                                </Pressable>
                            </View>
                        </CameraView>
                    </View>
                </Modal>

                <BasketActionsModal
                    visible={basketActionsModalVisible}
                    onClose={() => setBasketActionsModalVisible(false)}
                    basketName={selectedActionBasket?.name}
                    onEdit={() => {
                        setBasketActionsModalVisible(false);
                        if (selectedActionBasket) startEditBasket(selectedActionBasket);
                    }}
                    onDuplicate={() => {
                        setBasketActionsModalVisible(false);
                        if (selectedActionBasket) duplicateBasket(selectedActionBasket);
                    }}
                    onDelete={() => {
                        setBasketActionsModalVisible(false);
                        if (selectedActionBasket) confirmDeleteBasket(selectedActionBasket.id);
                    }}
                />

                <Navigation />
            </View>
        </GestureHandlerRootView >
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
    iconButtonGhost: {
        padding: 8,
    },
    // Item List
    statsBar: {
        flexDirection: "row",
        backgroundColor: "white",
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: themes.light.colors.border,
        marginTop: 10,
        marginBottom: 10,
    },
    statsLabel: { fontSize: 10, fontWeight: "900", color: themes.light.colors.textSecondary, letterSpacing: 0.6 },
    statsVal: { fontSize: 16, fontWeight: "900", color: themes.light.colors.text, marginTop: 2 },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: themes.light.colors.border,
        marginHorizontal: 16,
    },
    catHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingHorizontal: 4 },
    catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    catTitle: {
        fontSize: 13,
        fontWeight: "900",
        color: themes.light.colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    catList: {
        backgroundColor: "white",
        borderRadius: 20,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "rgba(17,24,39,0.06)",
    },
    singleItemCard: {
        backgroundColor: "white",
        marginBottom: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(17,24,39,0.06)",
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
        backgroundColor: "white",
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
    noResultsContainer: {
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 40,
    },
    noResultsText: {
        fontSize: 16,
        color: themes.light.colors.textSecondary,
        textAlign: "center",
        marginBottom: 12,
        fontWeight: "500",
    },
    linkText: {
        color: themes.light.colors.primary,
        fontWeight: "700",
        fontSize: 15,
    },
    // Camera
    cameraOverlay: { flex: 1, justifyContent: "space-between" },
    cameraClose: {
        margin: 20,
        alignSelf: "flex-start",
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.4)",
        borderRadius: 20,
    },
    scannerFrame: {
        width: width * 0.7,
        height: width * 0.7,
        borderColor: "white",
        borderWidth: 2,
        alignSelf: "center",
        borderRadius: 14,
    },
    captureBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: "white",
        alignSelf: "center",
        marginBottom: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "white" },
});



