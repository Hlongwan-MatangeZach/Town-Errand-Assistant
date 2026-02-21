import { themes } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";


const POPULAR_STORES = [
    'Pick n Pay',
    'Shoprite',
    'Checkers',
    'Woolworth',
    'Spar',
    'Game',
    'Makro',
    'Dis-Chem',
];

const COLORS = [
    '#0284C7',
    '#F87171',
    '#F97316',
    '#FACC15',
    '#4ADE80',
    '#2DD4BF',
    '#A78BFA',
    '#EC4899',
];

type AddCardProps = {
    visible: boolean;
    onClose: () => void;
    onSave: (card: {
        id: string;
        storeName: string;
        cardName: string;
        barcode: string;
        color: string;
        image: string | null;
    }) => void;
    onScanRequest?: () => void;
    scannedBarcode?: string;
}

export default function AddCardModel({
    visible,
    onClose,
    onSave,
    onScanRequest,
    scannedBarcode,
}: AddCardProps) {
    const [storeName, setStoreName] = useState('Shoprite');
    const [cardName, setCardName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [image, setImage] = useState<string | null>(null);

    {/*Auto populate barcode when scanneedBarcode is provided */ }
    useEffect(() => {
        if (scannedBarcode) {
            setBarcode(scannedBarcode);
        }
    }, [scannedBarcode]);

    const handleScanBarcode = () => {
        if (onScanRequest) {
            onScanRequest();
        } else {
            Alert.alert(
                'Scan Barcode',
                'Please enable barcode scanning to add a new card.',
                [
                    {
                        text: 'OK',
                        onPress: onClose,
                    },
                ],
            );
        }
    };

    function handleSaveCard() {
        if (!storeName.trim() || !cardName.trim() || !barcode.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const newCard = {
            id: Date.now().toString(),
            storeName: storeName.trim(),
            cardName: cardName.trim(),
            barcode: barcode.trim(),
            color: selectedColor,
            image,
        };

        onSave(newCard);
        onClose();
        resetForm();
    }

    function resetForm() {
        setStoreName('Shoprite');
        setCardName('');
        setBarcode('');
        setSelectedColor(COLORS[0]);
        setImage(null);
    }

    const handleClose = () => {
        setStoreName('Shoprite');
        setCardName('');
        setBarcode('');
        setSelectedColor(COLORS[0]);
        setImage(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType='slide' transparent>
            <View style={styles.backdrop}>
                <View style={styles.modalCard}>
                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/*Header*/}
                        <View style={styles.header}>
                            <Text style={styles.title}>Add New Card</Text>
                            <Pressable onPress={handleClose} style={styles.closeBtn}>
                                <Ionicons name='close' size={27} color={themes.light.colors.textSecondary} />
                            </Pressable>
                        </View>
                        {/*Store Name*/}
                        <Text style={styles.label}>Store Name</Text>
                        <TextInput
                            placeholder='Store Name'
                            value={storeName}
                            onChangeText={setStoreName}
                            style={styles.input}
                            placeholderTextColor={themes.light.colors.textSecondary}

                        />
                        {/*Popular stores*/}
                        <Text style={styles.popularStoresTitle}>Popular Stores:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularStoresScroll}>
                            <View style={styles.popularStoresContainer}>
                                {POPULAR_STORES.map((store) => (
                                    <Pressable
                                        key={store}
                                        onPress={() => setStoreName(store)}
                                        style={[
                                            styles.popularStoreBtn,
                                            storeName === store && styles.popularStoreBtnSelected,
                                        ]}
                                    >
                                        <Text style={[styles.popularStoreBtnText, storeName === store && styles.popularStoreBtnTextSelected]}>{store}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>

                    </ScrollView>

                    {/*Card name */}
                    <TextInput
                        placeholder='Card Name (e.g. Loyalty Card)'
                        value={cardName}
                        onChangeText={setCardName}
                        style={styles.input}
                        placeholderTextColor={themes.light.colors.textSecondary}
                    />

                    {/*Barcode */}
                    <View style={styles.barcodeContainer}>
                        <TextInput
                            placeholder='Barcode'
                            value={barcode}
                            onChangeText={setBarcode}
                            style={[styles.input, { flex: 1 }]}
                            placeholderTextColor={themes.light.colors.textSecondary}
                            returnKeyType='done'
                        />
                        <Pressable onPress={handleScanBarcode} style={styles.scanBtn}>
                            <Ionicons name='scan-outline' size={24} color={themes.light.colors.surface} />
                            <Text style={styles.scanBtnText}>Scan</Text>
                        </Pressable>
                    </View>

                    {/*Color */}
                    <Text style={styles.colorTitle}>Card Color</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                        <View style={styles.colorContainer}>
                            {COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    onPress={() => setSelectedColor(color)}
                                    style={[styles.colorBtn, { backgroundColor: color }]}
                                >
                                    {selectedColor === color && (
                                        <Ionicons name='checkmark' size={18} color={themes.light.colors.surface} />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>

                    {/*Action Buttons*/}
                    <View style={styles.actionButtons}>
                        <Pressable style={styles.cancelBtn} onPress={handleClose}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable style={styles.addBtn} onPress={handleSaveCard}>
                            <Text style={styles.addBtnText}>Add Card</Text>
                        </Pressable>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: themes.light.colors.background,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingTop: 20,
        padding: 20,
        maxHeight: Dimensions.get('window').height * 0.9,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 2,
        marginBottom: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: themes.light.colors.text,
        marginBottom: 20,
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 6,
    },
    input: {
        backgroundColor: themes.light.colors.background,
        borderWidth: 1,
        borderColor: themes.light.colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: themes.light.colors.text,
        marginVertical: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: themes.light.colors.text,
        marginBottom: 6,
    },
    popularStoresTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: themes.light.colors.text,
        marginBottom: 6,
        marginTop: 12,
    },
    popularStoresScroll: {
        marginBottom: 10,
    },
    popularStoreBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 50,
        backgroundColor: themes.light.colors.background,
        borderWidth: 1,
        borderColor: themes.light.colors.border,
        marginRight: 8,
    },
    popularStoreBtnSelected: {
        backgroundColor: themes.light.colors.primary,
    },
    popularStoreBtnText: {
        fontSize: 14,
        color: themes.light.colors.text,
    },
    popularStoreBtnTextSelected: {
        color: themes.light.colors.surface,
    },
    popularStoresContainer: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    barcodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    scanBtn: {
        backgroundColor: themes.light.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    scanBtnText: {
        color: themes.light.colors.surface,
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 4,
    },
    colorTitle: {
        marginTop: 12,
        fontWeight: '600',
        color: themes.light.colors.text,
        marginBottom: 6,
    },
    colorScroll: {
        marginBottom: 10,
    },
    colorContainer: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    colorBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#D0D3CE',
        color: themes.light.colors.text,
        marginRight: 8,
        alignItems: 'center',
    },
    addBtnText: {
        color: themes.light.colors.surface,
        fontWeight: '600',
        fontSize: 16,
    },
    cancelBtnText: {
        color: themes.light.colors.text,
        fontWeight: '600',
        fontSize: 16,
    },
    addBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 14,
        backgroundColor: themes.light.colors.primary,
        marginLeft: 8,
        alignItems: 'center',
    }
});
