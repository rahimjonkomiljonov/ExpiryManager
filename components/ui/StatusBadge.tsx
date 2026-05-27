// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpiryStatus } from '@/services/storageService';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

interface StatusBadgeProps {
  status: ExpiryStatus;
  label: string;
  compact?: boolean;
}

const STATUS_CONFIG = {
  expired: {
    bg: Colors.expiredBg,
    border: Colors.expiredBorder,
    text: Colors.expired,
    dot: Colors.expired,
  },
  critical: {
    bg: Colors.expiredBg,
    border: Colors.expiredBorder,
    text: Colors.expired,
    dot: Colors.expired,
  },
  soon: {
    bg: Colors.soonBg,
    border: Colors.soonBorder,
    text: Colors.soon,
    dot: Colors.soon,
  },
  fresh: {
    bg: Colors.freshBg,
    border: Colors.freshBorder,
    text: Colors.fresh,
    dot: Colors.fresh,
  },
};

export function StatusBadge({ status, label, compact = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bg, borderColor: config.border },
      compact && styles.compact,
    ]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text }, compact && styles.compactText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: Spacing.xs - 2,
  },
  compact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: Fonts.semibold,
  },
  compactText: {
    fontSize: 11,
  },
});
