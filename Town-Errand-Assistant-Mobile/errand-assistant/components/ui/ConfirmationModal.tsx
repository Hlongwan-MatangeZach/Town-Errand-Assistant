import { themes } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ConfirmationModalProps = {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'success';
};

export default function ConfirmationModal({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type = 'danger',
}: ConfirmationModalProps) {

    const getConfirmButtonStyle = () => {
        switch (type) {
            case 'danger':
                return { backgroundColor: themes.light.colors.danger };
            case 'success':
                return { backgroundColor: themes.light.colors.success };
            case 'info':
            default:
                return { backgroundColor: themes.light.colors.primary };
        }
    };

    const getIconName = () => {
        switch (type) {
            case 'danger': return 'alert-circle-outline';
            case 'success': return 'checkmark-circle-outline';
            case 'info': default: return 'information-circle-outline';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'danger': return themes.light.colors.danger;
            case 'success': return themes.light.colors.success;
            case 'info': default: return themes.light.colors.primary;
        }
    };


    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.backdrop}>
                <View style={styles.modalCard}>

                    <View style={styles.iconWrapper}>
                        <Ionicons name={getIconName()} size={48} color={getIconColor()} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.actionButtons}>
                        <Pressable style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelBtnText}>{cancelText}</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.confirmBtn, getConfirmButtonStyle()]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmBtnText}>{confirmText}</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: themes.light.colors.surface,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    iconWrapper: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: themes.light.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: themes.light.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: themes.light.colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: themes.light.colors.text,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});
