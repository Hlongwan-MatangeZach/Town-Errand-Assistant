import Navigation from '@/components/navigation';
import { themes } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AddBasket from '@/components/grocery/addBasket';
import AddBasketModal from '@/components/grocery/addBasket';

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
    const [items, setItems] = useState([]);
    
    // Modals
    const [basketModalVisible, setBasketModalVisible] = useState(false);
    
    // Basket editing
    const [basketEditMode, setBasketEditMode] = useState(false);
    const [editBasketId, setEditBasketId] = useState<string | null>(null);
    const [basketInitialData, setBasketInitialData] = useState<{
    name: string;
    budget: string;
    } | null>(null);

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
                                {items.length} basket{items.length !>= 1 ? 's' : ''} stored
                            </Text>
                        </View>

                        <View style={styles.headerActions}>
                            <Pressable style={styles.headerBtnPrimary} onPress={() => { }}>
                                <Ionicons name='sparkles' size={20} color={themes.light.colors.surface} />
                            </Pressable>

                            <Pressable style={styles.headerBtnSecondary} onPress={() => {setBasketModalVisible(true)}}>
                                <Ionicons name='add' size={20} color={themes.light.colors.primary} />
                            </Pressable>
                        </View>
                    </View> 

                </View>

                {/*Models*/}
                <AddBasketModal
                visible={basketModalVisible}
                onClose={() => {
                    setBasketModalVisible(false);
                    setBasketEditMode(false);
                    setEditBasketId(null);
                    setBasketInitialData(null);
                }}
                onSave={() => {}}
                editMode={basketEditMode}
                initialName={basketInitialData?.name ?? ''}
                initialBudget={basketInitialData?.budget ?? ''}
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
});

