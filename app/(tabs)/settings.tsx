// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useItems } from '@/hooks/useItems';
import {
  getNotificationPermissionStatus,
  initNotifications,
  NotificationPermissionStatus,
} from '@/services/notificationService';
import { Colors, Fonts, Spacing, Radius, Shadow } from '@/constants/theme';

interface SettingRowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  trailing?: React.ReactNode;
}

function SettingRow({ icon, title, subtitle, onPress, destructive, trailing }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <MaterialIcons name={icon} size={20} color={destructive ? Colors.expired : Colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, destructive && styles.rowTitleDestructive]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? trailing : (
        <MaterialIcons name="chevron-right" size={20} color={Colors.textTertiary} />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { showAlert } = useAlert();
  const { items, deleteAllItems } = useItems();
  const [permStatus, setPermStatus] = useState<NotificationPermissionStatus>('undetermined');

  useEffect(() => {
    getNotificationPermissionStatus().then(setPermStatus);
  }, []);

  const handleClearAll = () => {
    showAlert(
      'Clear All Items',
      `Remove all ${items.length} items from your pantry? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await deleteAllItems();
            showAlert('Cleared', 'All items and their notifications have been removed.');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    showAlert(
      'Expiry Date Manager',
      'Version 1.0\n\nTrack your groceries and reduce food waste by knowing exactly when items expire.'
    );
  };

  const handleNotifications = async () => {
    if (permStatus === 'granted') {
      showAlert(
        'Notifications Enabled',
        'You will receive reminders at 9:00 AM on the following days before each item expires:\n\n• 7 days before\n• 3 days before\n• 1 day before (tomorrow)\n\nNotifications are scheduled automatically when you add an item.'
      );
    } else {
      showAlert(
        'Enable Notifications',
        'Allow notifications to receive expiry reminders for your grocery items.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              const status = await initNotifications();
              setPermStatus(status);
              if (status === 'granted') {
                showAlert('Notifications Enabled', 'You will now receive expiry reminders.');
              } else {
                showAlert(
                  'Permission Denied',
                  'Please enable notifications in your device Settings to receive expiry reminders.'
                );
              }
            },
          },
        ]
      );
    }
  };

  const handleExport = () => {
    showAlert('Export Data', 'Data export functionality will be available in a future update.');
  };

  const notifStatusBadge = (
    <View
      style={[
        styles.statusPill,
        permStatus === 'granted' ? styles.statusPillOn : styles.statusPillOff,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          permStatus === 'granted' ? styles.statusDotOn : styles.statusDotOff,
        ]}
      />
      <Text
        style={[
          styles.statusPillText,
          permStatus === 'granted' ? styles.statusPillTextOn : styles.statusPillTextOff,
        ]}
      >
        {permStatus === 'granted' ? 'On' : 'Off'}
      </Text>
    </View>
  );

  // Count items that have active notifications scheduled
  const itemsWithNotifs = items.filter(i => (i.notificationIds?.length ?? 0) > 0).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Preferences & data management</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="notifications-active" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>{itemsWithNotifs}</Text>
            <Text style={styles.statLabel}>Notified</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="eco" size={28} color={Colors.fresh} />
            <Text style={styles.statLabel}>Food Tracked</Text>
          </View>
        </View>

        {/* General Section */}
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.section}>
          <SettingRow
            icon="notifications-none"
            title="Expiry Notifications"
            subtitle={
              permStatus === 'granted'
                ? `Reminders at 7, 3 & 1 day${itemsWithNotifs > 0 ? ` · ${itemsWithNotifs} item${itemsWithNotifs !== 1 ? 's' : ''} scheduled` : ''}`
                : 'Tap to enable reminders before items expire'
            }
            onPress={handleNotifications}
            trailing={notifStatusBadge}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="file-download"
            title="Export Data"
            subtitle="Download your pantry list as CSV"
            onPress={handleExport}
          />
        </View>

        {/* Data Section */}
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.section}>
          <SettingRow
            icon="delete-sweep"
            title="Clear All Items"
            subtitle={`Remove all ${items.length} tracked items & notifications`}
            onPress={handleClearAll}
            destructive
          />
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <SettingRow
            icon="info-outline"
            title="About App"
            subtitle="Version 1.0"
            onPress={handleAbout}
          />
        </View>

        {/* Tip */}
        <View style={styles.tip}>
          <MaterialIcons name="lightbulb-outline" size={18} color={Colors.soon} />
          <Text style={styles.tipText}>
            Tip: Notifications are scheduled automatically when you add an item — reminders fire at 9:00 AM, 7, 3, and 1 day before expiry.
          </Text>
        </View>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: Fonts.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: Fonts.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: Fonts.medium,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: Fonts.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  section: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.md,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: Colors.expiredBg,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: Fonts.medium,
    color: Colors.textPrimary,
  },
  rowTitleDestructive: {
    color: Colors.expired,
  },
  rowSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusPillOn: {
    backgroundColor: Colors.freshBg,
    borderColor: Colors.freshBorder,
  },
  statusPillOff: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOn: { backgroundColor: Colors.fresh },
  statusDotOff: { backgroundColor: Colors.textTertiary },
  statusPillText: {
    fontSize: 12,
    fontWeight: Fonts.semibold,
  },
  statusPillTextOn: { color: Colors.fresh },
  statusPillTextOff: { color: Colors.textTertiary },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.soonBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.soonBorder,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.soon,
    lineHeight: 20,
    fontWeight: Fonts.medium,
  },
});
