// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GroceryItem, getExpiryStatus } from '@/services/storageService';
import { Colors, Fonts, Spacing, Radius, Shadow } from '@/constants/theme';

interface SummaryStripProps {
  items: GroceryItem[];
}

function SummaryStripComponent({ items }: SummaryStripProps) {
  const expired = items.filter(i => getExpiryStatus(i.expiryDate) === 'expired').length;
  const critical = items.filter(i => getExpiryStatus(i.expiryDate) === 'critical').length;
  const soon = items.filter(i => getExpiryStatus(i.expiryDate) === 'soon').length;
  const fresh = items.filter(i => getExpiryStatus(i.expiryDate) === 'fresh').length;

  const stats = [
    { label: 'Expired', count: expired, color: Colors.expired, bg: Colors.expiredBg },
    { label: 'Critical', count: critical, color: Colors.expired, bg: Colors.expiredBg },
    { label: 'Soon', count: soon, color: Colors.soon, bg: Colors.soonBg },
    { label: 'Fresh', count: fresh, color: Colors.fresh, bg: Colors.freshBg },
  ];

  return (
    <View style={styles.container}>
      {stats.map(stat => (
        <View key={stat.label} style={[styles.stat, { backgroundColor: stat.bg }]}>
          <Text style={[styles.count, { color: stat.color }]}>{stat.count}</Text>
          <Text style={[styles.label, { color: stat.color }]}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

export const SummaryStrip = memo(SummaryStripComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  count: {
    fontSize: 22,
    fontWeight: Fonts.bold,
  },
  label: {
    fontSize: 11,
    fontWeight: Fonts.medium,
    marginTop: 2,
  },
});
