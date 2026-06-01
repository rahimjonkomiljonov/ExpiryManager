// Powered by OnSpace.AI
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAlert } from '@/template';
import { useItems } from '@/hooks/useItems';
import { CATEGORIES } from '@/constants/config';
import { Colors, Fonts, Spacing, Radius, Shadow } from '@/constants/theme';
import { ScannerEvents } from '@/services/scannerEvents';

type DateField = { day: string; month: string; year: string };

function parseDateFields(fields: DateField): string | null {
  const d = parseInt(fields.day, 10);
  const m = parseInt(fields.month, 10);
  const y = parseInt(fields.year, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2020) return null;
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

export default function AddItemScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { addItem } = useItems();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [dateFields, setDateFields] = useState<DateField>({ day: '', month: '', year: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

  // Listen for scan results when this screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      ScannerEvents.onResult((result) => {
        setScannedBarcode(result.barcode);
        if (result.name) setName(result.name);
        if (result.quantity) setQuantity(result.quantity);
        if (result.category) setCategory(result.category);

        if (result.found && result.name) {
          showAlert(
            'Product Found',
            `${result.name}${result.brand ? ` by ${result.brand}` : ''}\n\nFill in the expiry date to continue.`
          );
        } else {
          showAlert(
            'Barcode Scanned',
            `Barcode: ${result.barcode}\n\nProduct not found in database. Please enter details manually.`
          );
        }
      });

      return () => {
        ScannerEvents.offResult();
      };
    }, [showAlert])
  );

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      showAlert('Missing Name', 'Please enter a product name.');
      return;
    }
    const expiryDate = parseDateFields(dateFields);
    if (!expiryDate) {
      showAlert('Invalid Date', 'Please enter a valid expiry date (day, month, year).');
      return;
    }

    setIsSaving(true);
    await addItem({
      name: name.trim(),
      category,
      quantity: quantity.trim(),
      expiryDate,
      notes: notes.trim(),
    });
    setIsSaving(false);

    setName('');
    setQuantity('');
    setCategory('other');
    setNotes('');
    setDateFields({ day: '', month: '', year: '' });
    setScannedBarcode('');

    showAlert('Item Added', `${name.trim()} has been added to your pantry.`, [
      { text: 'View Pantry', onPress: () => router.push('/(tabs)/') },
      { text: 'Add Another', style: 'cancel' },
    ]);
  }, [name, dateFields, category, quantity, notes, addItem, showAlert, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Item</Text>
        <Text style={styles.headerSubtitle}>Track a new grocery item</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Scan Button — navigates to full-screen scanner route */}
          <Pressable
            style={({ pressed }) => [styles.scanButton, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/scanner')}
          >
            <MaterialIcons name="qr-code-scanner" size={22} color={Colors.primary} />
            <Text style={styles.scanText}>Scan Barcode</Text>
            {scannedBarcode ? (
              <View style={styles.scannedTag}>
                <MaterialIcons name="check-circle" size={12} color={Colors.fresh} />
                <Text style={styles.scannedTagText}>Scanned</Text>
              </View>
            ) : null}
          </Pressable>

          {scannedBarcode ? (
            <View style={styles.barcodeInfo}>
              <MaterialIcons name="qr-code" size={14} color={Colors.textTertiary} />
              <Text style={styles.barcodeInfoText}>Barcode: {scannedBarcode}</Text>
            </View>
          ) : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or enter manually</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Whole Milk"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g. 1 gallon, 500ml"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* Expiry Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Expiry Date *</Text>
              <View style={styles.dateRow}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={dateFields.day}
                  onChangeText={v => setDateFields(prev => ({ ...prev, day: v }))}
                  placeholder="DD"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={dateFields.month}
                  onChangeText={v => setDateFields(prev => ({ ...prev, month: v }))}
                  placeholder="MM"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, styles.dateInputYear]}
                  value={dateFields.year}
                  onChangeText={v => setDateFields(prev => ({ ...prev, year: v }))}
                  placeholder="YYYY"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <Pressable
                    key={cat.id}
                    style={[styles.catOption, category === cat.id && styles.catOptionActive]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={styles.catOptionEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.catOptionLabel,
                        category === cat.id && styles.catOptionLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && { opacity: 0.88 },
                isSaving && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.textOnPrimary} />
              ) : (
                <MaterialIcons name="check" size={20} color={Colors.textOnPrimary} />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Item'}
              </Text>
            </Pressable>
          </View>

          <View style={{ height: Spacing.xxl * 2 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: Fonts.bold, color: Colors.textPrimary },
  headerSubtitle: { fontSize: 13, color: Colors.textTertiary, marginTop: 2 },
  scroll: { flex: 1 },
  scanButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, margin: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
    position: 'relative',
  },
  scanText: { fontSize: 15, fontWeight: Fonts.semibold, color: Colors.primary },
  scannedTag: {
    position: 'absolute', top: 6, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.freshBg, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.freshBorder,
  },
  scannedTagText: { fontSize: 10, fontWeight: Fonts.bold, color: Colors.fresh, letterSpacing: 0.3 },
  barcodeInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, marginTop: -Spacing.sm, marginBottom: Spacing.sm,
  },
  barcodeInfoText: {
    fontSize: 12, color: Colors.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textTertiary, fontWeight: Fonts.medium },
  form: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  field: { gap: Spacing.sm },
  fieldLabel: { fontSize: 14, fontWeight: Fonts.semibold, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4, fontSize: 15, color: Colors.textPrimary, ...Shadow.sm,
  },
  dateRow: { flexDirection: 'row', gap: Spacing.sm },
  dateInput: { flex: 1, textAlign: 'center' },
  dateInputYear: { flex: 1.5, textAlign: 'center' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catOption: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  catOptionActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  catOptionEmoji: { fontSize: 14 },
  catOptionLabel: { fontSize: 13, fontWeight: Fonts.medium, color: Colors.textSecondary },
  catOptionLabelActive: { color: Colors.primaryDark, fontWeight: Fonts.semibold },
  notesInput: { height: 80, paddingTop: Spacing.sm + 4 },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary, padding: Spacing.md,
    borderRadius: Radius.md, marginTop: Spacing.sm, ...Shadow.md,
  },
  saveButtonText: { fontSize: 16, fontWeight: Fonts.semibold, color: Colors.textOnPrimary },
});
