
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { fetchProductByBarcode, FoodProduct } from '@/services/foodApiService';

interface BarcodeScannerProps {
  onProductFound: (product: FoodProduct, barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onProductFound, onClose }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isFetching, setIsFetching] = useState(false);
  const [lastBarcode, setLastBarcode] = useState('');
  const [statusMsg, setStatusMsg] = useState('Point at a barcode to scan');
  const cooldownRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (cooldownRef.current || isFetching) return;
      const barcode = result.data;
      if (barcode === lastBarcode) return;

      cooldownRef.current = true;
      setLastBarcode(barcode);
      setIsFetching(true);
      setStatusMsg('Looking up product...');

      const product = await fetchProductByBarcode(barcode);

      if (product.found) {
        setStatusMsg(`Found: ${product.name}`);
        setTimeout(() => {
          onProductFound(product, barcode);
        }, 400);
      } else {
        setStatusMsg('Product not found — enter manually');
        setIsFetching(false);
        setTimeout(() => {
          setStatusMsg('Point at a barcode to scan');
          cooldownRef.current = false;
        }, 2500);
      }
    },
    [isFetching, lastBarcode, onProductFound]
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="camera-alt" size={56} color={Colors.textTertiary} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionSubtitle}>
          Allow camera access to scan barcodes and auto-fill product details.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={styles.closeTextBtn} onPress={onClose}>
          <Text style={styles.closeTextBtnText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'qr',
          ],
        }}
        onBarcodeScanned={isFetching ? undefined : handleBarcodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <MaterialIcons name="close" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.topTitle}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinderArea}>
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Status bar */}
        <View style={styles.statusBar}>
          {isFetching ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
          ) : (
            <MaterialIcons name="qr-code-scanner" size={18} color="rgba(255,255,255,0.8)" />
          )}
          <Text style={styles.statusText}>{statusMsg}</Text>
        </View>

        {/* Powered by note */}
        <View style={styles.apiNote}>
          <MaterialIcons name="info-outline" size={13} color="rgba(255,255,255,0.5)" />
          <Text style={styles.apiNoteText}>Product data from Open Food Facts</Text>
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;
const cornerBase: object = {
  position: 'absolute',
  width: CORNER_SIZE,
  height: CORNER_SIZE,
  borderColor: Colors.primary,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: Fonts.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  permissionBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: Fonts.semibold,
    fontSize: 15,
  },
  closeTextBtn: {
    paddingVertical: Spacing.sm,
  },
  closeTextBtnText: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
  },
  topTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: Fonts.semibold,
  },
  viewfinderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 260,
    height: 180,
    position: 'relative',
  },
  corner: cornerBase,
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 6,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: Fonts.medium,
  },
  apiNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  apiNoteText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});
