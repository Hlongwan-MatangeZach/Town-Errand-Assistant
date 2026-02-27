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

interface ItemRowProps {
    item: Item;
    onToggle: (id: string) => void;
    onEdit: (item: Item) => void;
    onDelete: (id: string) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, onToggle, onEdit, onDelete }) => {
    const price = item.estimatedPrice ? `R${item.estimatedPrice.toFixed(2)} ` : "";
    const qty = parseFloat(item.quantity) || 1;

    return (
        <View style={styles.itemRow} key={item.id}>
            <Pressable
                style={[styles.checkbox, item.completed && styles.checkboxActive]}
                onPress={() => onToggle(item.id)}
            >
                {item.completed ? <Ionicons name="checkmark" size={14} color="white" /> : null}
            </Pressable>

            <Pressable style={{ flex: 1 }} onPress={() => onEdit(item)}>
                <Text
                    style={[
                        styles.itemName,
                        item.completed
                            ? { color: themes.light.colors.textSecondary, textDecorationLine: "line-through" }
                            : null,
                    ]}
                    numberOfLines={1}
                >
                    {item.name}
                </Text>
                <Text style={styles.itemMeta} numberOfLines={1}>
                    {price}
                    {price && qty > 1 ? " • " : ""}
                    {qty > 1 ? `${qty} x` : ""}
                </Text>
            </Pressable>

            <Pressable onPress={() => onDelete(item.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={18} color={themes.light.colors.textSecondary} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: themes.light.colors.border,
        marginRight: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxActive: { backgroundColor: themes.light.colors.primary, borderColor: themes.light.colors.primary },
    itemName: { fontSize: 15, fontWeight: "800", color: themes.light.colors.text },
    itemMeta: { fontSize: 13, color: themes.light.colors.textSecondary, marginTop: 2, fontWeight: "600" },
});

export default ItemRow;
