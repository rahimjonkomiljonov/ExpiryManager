// Powered by OnSpace.AI
import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAlert } from '@/template';
import { useItems } from '@/hooks/useItems';
import { getExpiryStatus, formatExpiryLabel, getDaysUntilExpiry } from '@/services/storageService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORIES } from '@/constants/config';
import { Colors, Fonts, Spacing, Radius, Shadow } from '@/constants/theme';

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showAlert } = useAlert();
  const { getItem, updateItem, deleteItem } = useItems();

  const item = getItem(id);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item?.name ?? '');
  const [quantity, setQuantity] = useState(item?.quantity ?? '');
  const [category, setCategory] = useState(item?.category ?? 'other');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [dayStr, setDayStr] = useState('');
  const [monthStr, setMonthStr] = useState('');
  const [yearStr, setYearStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      const d = new Date(item.expiryDate);
      setDayStr(String(d.getDate()).padStart(2, '0'));
      setMonthStr(String(d.getMonth() + 1).padStart(2, '0'));
      setYearStr(String(d.getFullYear()));
    }
  }, [item]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      showAlert('Missing Name', 'Please enter a product name.');
      return;
    }
    const d = parseInt(dayStr, 10);
    const m = parseInt(monthStr, 10);
    const y = parseInt(yearStr, 10);
    if (isNaN(d) || isNaN(m) || isNaN(y) || m < 1 || m > 12 || d < 1 || d > 31 || y < 2020) {
      showAlert('Invalid Date', 'Please enter a valid expiry date.');
      return;
    }
    const expiryDate = new Date(y, m - 1, d).toISOString();

    setIsSaving(true);
    await updateItem(id, { name: name.trim(), quantity, category, notes, expiryDate });
    setIsSaving(false);
    setIsEditing(false);
    showAlert('Saved', 'Item updated successfully.');
  }, [name, dayStr, monthStr, yearStr, quantity, category, notes, id, updateItem, showAlert]);

  const handleDelete = useCallback(() => {
    showAlert('Delete Item', `Remove "${item?.name}" from your pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(id);
          router.back();
        },
      },
    ]);
  }, [item, id, deleteItem, showAlert, router]);

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorState}>
          <MaterialIcons name="error-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Item not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const status = getExpiryStatus(item.expiryDate);
  const expiryLabel = formatExpiryLabel(item.expiryDate);
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  const categoryObj = CATEGORIES.find(c => c.id === item.category);

  const statusBg = {
    expired: Colors.expiredBg,
    critical: Colors.expiredBg,
    soon: Colors.soonBg,
    fresh: Colors.freshBg,
  }[status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{item.name}</Text>
        <Pressable style={styles.editToggle} onPress={() => setIsEditing(!isEditing)}>
          <MaterialIcons name={isEditing ? 'close' : 'edit'} size={20} color={Colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Status Hero */}
          {!isEditing ? (
            <View style={[styles.statusHero, { backgroundColor: statusBg }]}>
              <Text style={styles.heroEmoji}>{categoryObj?.emoji ?? '📦'}</Text>
              <Text style={styles.heroName}>{item.name}</Text>
              {item.quantity ? <Text style={styles.heroQty}>{item.quantity}</Text> : null}
              <View style={styles.heroBadge}>
                <StatusBadge status={status} label={expiryLabel} />
              </View>
              <Text style={styles.heroDays}>
                {daysLeft < 0
                  ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`
                  : daysLeft === 0
                  ? 'Expires today!'
                  : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
              </Text>
            </View>
          ) : null}

          {/* Details / Edit Form */}
          <View style={styles.form}>
            {isEditing ? (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Product Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Expiry Date *</Text>
                  <View style={styles.dateRow}>
                    <TextInput
                      style={[styles.input, styles.dateInput]}
                      value={dayStr}
                      onChangeText={setDayStr}
                      placeholder="DD"
                      placeholderTextColor={Colors.textTertiary}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <TextInput
                      style={[styles.input, styles.dateInput]}
                      value={monthStr}
                      onChangeText={setMonthStr}
                      placeholder="MM"
                      placeholderTextColor={Colors.textTertiary}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <TextInput
                      style={[styles.input, styles.dateInputYear]}
                      value={yearStr}
                      onChangeText={setYearStr}
                      placeholder="YYYY"
                      placeholderTextColor={Colors.textTertiary}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <View style={styles.categoriesGrid}>
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <Pressable
                        key={cat.id}
                        style={[styles.catOption, category === cat.id && styles.catOptionActive]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <Text style={styles.catEmoji}>{cat.emoji}</Text>
                        <Text style={[styles.catLabel, category === cat.id && styles.catLabelActive]}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.88 }]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <ActivityIndicator size="small" color={Colors.textOnPrimary} /> : null}
                  <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.infoCard}>
                  <InfoRow label="Category" value={`${categoryObj?.emoji ?? ''} ${categoryObj?.label ?? 'Other'}`} />
                  {item.notes ? (
                    <>
                      <View style={styles.infoSep} />
                      <InfoRow label="Notes" value={item.notes} />
                    </>
                  ) : null}
                  <View style={styles.infoSep} />
                  <InfoRow
                    label="Added"
                    value={new Date(item.addedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <View style={styles.infoSep} />
                  <InfoRow
                    label="Expires"
                    value={new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                </View>
              </>
            )}

            {/* Delete Button */}
            {!isEditing ? (
              <Pressable
                style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.8 }]}
                onPress={handleDelete}
              >
                <MaterialIcons name="delete-outline" size={18} color={Colors.expired} />
                <Text style={styles.deleteButtonText}>Remove Item</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={{ height: Spacing.xxl * 2 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.sm + 2,
  },
  label: {
    fontSize: 12,
    fontWeight: Fonts.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: Fonts.medium,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  backBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  backBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: Fonts.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: Fonts.bold,
    color: Colors.textPrimary,
  },
  editToggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
  },
  scroll: {
    flex: 1,
  },
  statusHero: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  heroEmoji: {
    fontSize: 52,
  },
  heroName: {
    fontSize: 22,
    fontWeight: Fonts.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  heroQty: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  heroBadge: {
    marginTop: Spacing.xs,
  },
  heroDays: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Fonts.medium,
  },
  form: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  infoSep: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  field: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: Fonts.semibold,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 15,
    color: Colors.textPrimary,
    ...Shadow.sm,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    textAlign: 'center',
  },
  dateInputYear: {
    flex: 1.5,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catOptionActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  catEmoji: { fontSize: 14 },
  catLabel: {
    fontSize: 13,
    fontWeight: Fonts.medium,
    color: Colors.textSecondary,
  },
  catLabelActive: {
    color: Colors.primaryDark,
    fontWeight: Fonts.semibold,
  },
  notesInput: {
    height: 80,
    paddingTop: Spacing.sm + 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radius.md,
    ...Shadow.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: Fonts.semibold,
    color: Colors.textOnPrimary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.expiredBorder,
    backgroundColor: Colors.expiredBg,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: Fonts.semibold,
    color: Colors.expired,
  },
});
