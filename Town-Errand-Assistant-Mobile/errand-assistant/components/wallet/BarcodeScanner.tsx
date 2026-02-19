import { themes } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import React, { useRef } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type BarcodeScannerProps = {
    visible: boolean;
    scanEnabled: boolean;
    onBarcodeScanned: (result: { data: string }) => void;
    onClose: () => void;
};

export default function BarcodeScanner({
    visible,
    scanEnabled,
    onBarcodeScanned,
    onClose,
}: BarcodeScannerProps) {
    const cameraRef = useRef<any>(null);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.scannerContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanEnabled ? onBarcodeScanned : undefined}
                    barcodeScannerSettings={{
                        barcodeTypes: [
                            "ean13",
                            "ean8",
                            "qr",
                            "code128",
                            "code39",
                            "pdf417",
                        ],
                    }}
                >
                    <View style={styles.scannerOverlay}>
                        <Pressable style={styles.scannerCloseBtn} onPress={onClose}>
                            <Ionicons name="close" size={24} color="white" />
                        </Pressable>

                        <View style={styles.scannerFrameContainer}>
                            <View style={styles.scannerFrame} />
                            <Text style={styles.scannerHint}>
                                Align barcode within frame
                            </Text>
                        </View>
                    </View>
                </CameraView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    scannerContainer: {
        flex: 1,
        backgroundColor: "black",
    },
    camera: {
        flex: 1,
    },
    scannerOverlay: {
        flex: 1,
        justifyContent: "space-between",
    },
    scannerCloseBtn: {
        margin: 20,
        alignSelf: "flex-start",
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
    },
    scannerFrameContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 100,
    },
    scannerFrame: {
        width: 280,
        height: 180,
        borderWidth: 2,
        borderColor: themes.light.colors.primary,
        borderRadius: 16,
        backgroundColor: "transparent",
    },
    scannerHint: {
        color: "white",
        marginTop: 20,
        fontSize: 16,
        fontWeight: "500",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: "hidden",
    },
});
