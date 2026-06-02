
import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GroceryItem, getExpiryStatus, formatExpiryLabel } from '@/services/storageService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORIES } from '@/constants/config';
import { Colors, Fonts, Spacing, Radius, Shadow } from '@/constants/theme';

interface ItemCardProps {
  item: GroceryItem;
}

function ItemCardComponent({ item }: ItemCardProps) {
  const router = useRouter();
  const status = getExpiryStatus(item.expiryDate);
  const expiryLabel = formatExpiryLabel(item.expiryDate);
  const category = CATEGORIES.find(c => c.id === item.category);

  const borderColor = {
    expired: Colors.expired,
    critical: Colors.expired,
    soon: Colors.soon,
    fresh: Colors.border,
  }[status];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: borderColor, opacity: pressed ? 0.92 : 1 },
      ]}
      onPress={() => router.push(`/item/${item.id}`)}
    >
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{category?.emoji ?? '📦'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
        </View>

        {item.quantity ? (
          <Text style={styles.quantity}>{item.quantity}</Text>
        ) : null}

        <View style={styles.bottomRow}>
          <StatusBadge status={status} label={expiryLabel} compact />
        </View>
      </View>
    </Pressable>
  );
}

export const ItemCard = memo(ItemCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderLeftWidth: 4,
    ...Shadow.sm,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  emoji: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: Fonts.semibold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.xs,
  },
  quantity: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: Fonts.regular,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});
