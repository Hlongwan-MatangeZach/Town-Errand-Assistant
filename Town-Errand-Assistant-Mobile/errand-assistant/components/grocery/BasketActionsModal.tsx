import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { themes } from '../../constants/theme';

interface BasketActionsModalProps {
    visible: boolean;
    onClose: () => void;
    basketName: string | undefined;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
}

const BasketActionsModal: React.FC<BasketActionsModalProps> = ({
    visible,
    onClose,
    basketName,
    onEdit,
    onDuplicate,
    onDelete,
}) => {
    return (
        <Modal visible={visible} transparent animationType='slide'>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCardStyle}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.actionModalTitle}>{basketName}</Text>

                    <Pressable style={styles.actionItem} onPress={onEdit}>
                        <Ionicons name='create-outline' size={22} color={themes.light.colors.text} />
                        <Text style={styles.actionItemText}>Edit details</Text>
                    </Pressable>

                    <Pressable style={styles.actionItem} onPress={onDuplicate}>
                        <Ionicons name='copy-outline' size={22} color={themes.light.colors.text} />
                        <Text style={styles.actionItemText}>Duplicate list</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionItem, { borderBottomWidth: 0 }]}
                        onPress={onDelete}
                    >
                        <Ionicons name='trash-outline' size={22} color={themes.light.colors.danger} />
                        <Text style={[styles.actionItemText, { color: themes.light.colors.danger }]}>Delete basket</Text>
                    </Pressable>

                    <Pressable
                        onPress={onClose}
                        style={styles.cancelActionBtn}
                    >
                        <Text style={styles.cancelActionText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalCardStyle: {
        backgroundColor: "white",
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        padding: 28,
        paddingBottom: 44,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    actionModalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: themes.light.colors.text,
        marginBottom: 24,
        textAlign: 'center',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    actionItemText: {
        fontSize: 16,
        fontWeight: '700',
        color: themes.light.colors.text,
    },
    cancelActionBtn: {
        marginTop: 16,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
    },
    cancelActionText: {
        fontSize: 16,
        fontWeight: '800',
        color: themes.light.colors.textSecondary,
    },
});

export default BasketActionsModal;
