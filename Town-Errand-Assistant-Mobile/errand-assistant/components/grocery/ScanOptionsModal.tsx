import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { themes } from '../../constants/theme';

interface ScanOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onCamera: () => void;
    onGallery: () => void;
}

const ScanOptionsModal: React.FC<ScanOptionsModalProps> = ({
    visible,
    onClose,
    onCamera,
    onGallery,
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCardStyle}>
                    <Text style={styles.modalTitle}>Scan Item</Text>
                    <View style={styles.scanGrid}>
                        <Pressable style={styles.scanBtn} onPress={onCamera}>
                            <View style={[styles.scanIcon, { backgroundColor: "#DBEAFE" }]}>
                                <Ionicons name="camera" size={28} color={themes.light.colors.primary} />
                            </View>
                            <Text style={styles.scanText}>Camera</Text>
                        </Pressable>

                        <Pressable style={styles.scanBtn} onPress={onGallery}>
                            <View style={[styles.scanIcon, { backgroundColor: "#FEF3C7" }]}>
                                <Ionicons name="images" size={28} color="#D97706" />
                            </View>
                            <Text style={styles.scanText}>Gallery</Text>
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={onClose}
                        style={{ alignItems: "center", padding: 10 }}
                    >
                        <Text style={{ color: themes.light.colors.textSecondary, fontWeight: "800" }}>
                            Cancel
                        </Text>
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
    modalTitle: {
        fontSize: 20,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 20,
        color: themes.light.colors.text,
        letterSpacing: -0.2,
    },
    scanGrid: { flexDirection: "row", justifyContent: "center", gap: 30, marginBottom: 18 },
    scanBtn: { alignItems: "center" },
    scanIcon: {
        width: 64,
        height: 64,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    scanText: { fontWeight: "900", color: themes.light.colors.text },
});

export default ScanOptionsModal;
