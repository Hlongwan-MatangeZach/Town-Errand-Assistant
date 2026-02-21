import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Radii, Spacing, themes } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Barcode from 'react-native-barcode-svg';
import { Card } from './types';

class BarcodeErrorBoundary extends React.PureComponent<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

type CardDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  card: Card | null;
  onDelete?: (cardId: string) => void;
};

const sanitizeBarcode = (barcode?: unknown): string => {
  return String(barcode ?? '')
    .normalize('NFKD')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
};

const guessFormat = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  const hasNonDigits = /\D/.test(value);

  if (!hasNonDigits) {
    if (digitsOnly.length === 13) return 'EAN13';
    if (digitsOnly.length === 8) return 'EAN8';
    if (digitsOnly.length === 12) return 'UPC';
  }
  return 'CODE128';
};

export default function CardDetailModal({
  visible,
  onClose,
  card,
  onDelete,
}: CardDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const rawBarcode = card?.barcode ?? '';
  const cleanBarcode = useMemo(() => sanitizeBarcode(rawBarcode), [rawBarcode]);

  let format = useMemo(() => guessFormat(cleanBarcode), [cleanBarcode]);
  const digitsOnly = cleanBarcode.replace(/\D/g, '');

  if (format === 'EAN13' && digitsOnly.length !== 13) format = 'CODE128';
  if (format === 'EAN8' && digitsOnly.length !== 8) format = 'CODE128';
  if (format === 'UPC' && digitsOnly.length !== 12) format = 'CODE128';

  const canGenerate = cleanBarcode.length > 0;
  const barWidth = cleanBarcode.length > 30 ? 1.5 : 2;
  const finalBarWidth = barWidth;

  // Value to pass to the barcode generator
  const barcodeValue = useMemo(() => {
    if (format === 'EAN13' || format === 'EAN8' || format === 'UPC') {
      return cleanBarcode.replace(/\D/g, '');
    }
    return cleanBarcode;
  }, [format, cleanBarcode]);

  if (!card) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my ${card.storeName} card: ${card.cardName}${card.barcode ? `\nBarcode: ${card.barcode}` : ''
          }`,
        title: `${card.storeName} Card`,
      });
    } catch {
      Alert.alert('Error', 'Could not share card details');
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Pressable style={styles.closeButton} onPress={onClose}>
                  <Ionicons
                    name='close'
                    size={24}
                    color={themes.light.colors.textSecondary}
                  />
                </Pressable>
                <Text style={styles.title}>Card Details</Text>
                <View style={styles.headerButtons}>
                  <Pressable style={styles.iconButton} onPress={handleShare}>
                    <Ionicons
                      name='share-outline'
                      size={20}
                      color={themes.light.colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable style={styles.iconButton} onPress={handleDelete}>
                    <Ionicons
                      name='trash-outline'
                      size={20}
                      color={themes.light.colors.danger}
                    />
                  </Pressable>
                </View>
              </View>

              <View
                style={[
                  styles.cardPreview,
                  { backgroundColor: card.color || themes.light.colors.secondary },
                ]}
              >
                <View style={styles.cardPreviewHeader}>
                  {card.image ? (
                    <Image source={{ uri: card.image }} style={styles.cardPreviewImage} />
                  ) : (
                    <View style={styles.cardPreviewIcon}>
                      <Ionicons name="card" size={32} color={themes.light.colors.surface} />
                    </View>
                  )}
                  <View style={styles.cardPreviewText}>
                    <Text style={styles.cardPreviewStore}>{card.storeName}</Text>
                    <Text style={styles.cardPreviewName}>{card.cardName}</Text>
                  </View>
                </View>

                {canGenerate ? (
                  <View style={styles.barcodeContainer}>
                    <View style={styles.barcodeWrapper}>
                      <BarcodeErrorBoundary
                        fallback={
                          <View style={styles.barcodeFallback}>
                            <Ionicons
                              name='warning-outline'
                              size={32}
                              color={themes.light.colors.textMuted}
                            />
                            <Text style={styles.barcodeFallbackText}>
                              Could not generate barcode
                            </Text>
                          </View>
                        }
                      >
                        <Barcode
                          key={`${format}:${barcodeValue}`}
                          value={barcodeValue}
                          format={format}
                          singleBarWidth={finalBarWidth}
                          height={100}
                          backgroundColor={themes.light.colors.surface}
                          lineColor={themes.light.colors.text}
                        />
                      </BarcodeErrorBoundary>
                    </View>
                    <Text style={styles.barcodeNumber}>{rawBarcode}</Text>
                  </View>
                ) : (
                  <View style={styles.barcodeContainerPlaceholder}>
                    <View style={styles.barcodePlaceholder}>
                      <Ionicons
                        name='barcode-outline'
                        size={32}
                        color='rgba(255,255,255,0.7)'
                      />
                      <Text style={styles.barcodePlaceholderText}>
                        {rawBarcode ? 'Invalid Barcode' : 'No Barcode Available'}
                      </Text>
                    </View>
                    {!!rawBarcode && (
                      <Text style={styles.barcodeNumberWhite}>{rawBarcode}</Text>
                    )}
                  </View>
                )}
              </View>


              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
      <ConfirmationModal
        visible={showDeleteConfirm}
        title='Delete Card'
        message={`Are you sure you want to delete your ${card.storeName} card?`}
        onConfirm={() => {
          if (onDelete && card.id) {
            onDelete(card.id);
            onClose();
          }
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText='Delete'
        type='danger'
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: themes.light.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: themes.light.colors.background,
    borderTopLeftRadius: Radii['2xl'],
    borderTopRightRadius: Radii['2xl'],
    paddingTop: Spacing.xl,
    padding: Spacing.xl,
    maxHeight: Dimensions.get('window').height * 0.9,
    shadowColor: themes.light.colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    padding: Spacing.xs,
    borderRadius: Radii.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: themes.light.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: themes.light.colors.surfaceAlt,
  },
  cardPreview: {
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: themes.light.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 220,
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  cardPreviewImage: {
    width: 50,
    height: 50,
    borderRadius: Radii.lg,
    marginRight: Spacing.md,
  },
  cardPreviewIcon: {
    width: 50,
    height: 50,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardPreviewText: {
    flex: 1,
  },
  cardPreviewStore: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 2,
  },
  cardPreviewName: {
    fontSize: 20,
    color: themes.light.colors.surface,
    fontWeight: '700',
  },
  barcodeContainer: {
    alignItems: 'center',
    backgroundColor: themes.light.colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  barcodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: themes.light.colors.surface,
    marginBottom: Spacing.sm,
  },
  barcodeNumber: {
    fontSize: 14,
    color: themes.light.colors.text,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  barcodeContainerPlaceholder: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 8,
  },
  barcodeNumberWhite: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  barcodePlaceholder: {
    alignItems: 'center',
    padding: 16,
    height: 80,
    justifyContent: 'center',
  },
  barcodePlaceholderText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  barcodeFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: themes.light.colors.surfaceAlt,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    width: '100%',
  },
  barcodeFallbackText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
});