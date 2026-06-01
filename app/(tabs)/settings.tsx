// Powered by OnSpace.AI
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useItems } from '@/hooks/useItems';
import {
  getNotificationPermissionStatus,
  initNotifications,
  NotificationPermissionStatus,
  scheduleExpiryNotifications,
  cancelExpiryNotifications,
} from '@/services/notificationService';
import {
  loadNotificationTime,
  saveNotificationTime,
  formatTime,
  NotificationTime,
} from '@/services/notificationTimeService';
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

// ---------- Time Picker Modal ----------
interface TimePickerModalProps {
  visible: boolean;
  initial: NotificationTime;
  onSave: (time: NotificationTime) => void;
  onClose: () => void;
}

function TimePickerModal({ visible, initial, onSave, onClose }: TimePickerModalProps) {
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    if (visible) {
      setHour(initial.hour);
      setMinute(initial.minute);
    }
  }, [visible, initial]);

  const adjustHour = (delta: number) => setHour(h => (h + delta + 24) % 24);
  const adjustMinute = (delta: number) => setMinute(m => (m + delta + 60) % 60);

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={tpStyles.backdrop}>
        <View style={tpStyles.card}>
          {/* Title */}
          <View style={tpStyles.titleRow}>
            <MaterialIcons name="schedule" size={20} color={Colors.primary} />
            <Text style={tpStyles.title}>Notification Time</Text>
          </View>
          <Text style={tpStyles.subtitle}>
            Reminders will fire at this time on the 7th, 3rd, and 1st day before expiry.
          </Text>

          {/* Picker */}
          <View style={tpStyles.pickerRow}>
            {/* Hour column */}
            <View style={tpStyles.column}>
              <Pressable style={tpStyles.arrowBtn} onPress={() => adjustHour(1)} hitSlop={8}>
                <MaterialIcons name="keyboard-arrow-up" size={28} color={Colors.primary} />
              </Pressable>
              <View style={tpStyles.digitBox}>
                <Text style={tpStyles.digitText}>{String(hour12).padStart(2, '0')}</Text>
              </View>
              <Pressable style={tpStyles.arrowBtn} onPress={() => adjustHour(-1)} hitSlop={8}>
                <MaterialIcons name="keyboard-arrow-down" size={28} color={Colors.primary} />
              </Pressable>
              <Text style={tpStyles.unitLabel}>Hour</Text>
            </View>

            <Text style={tpStyles.colon}>:</Text>

            {/* Minute column */}
            <View style={tpStyles.column}>
              <Pressable style={tpStyles.arrowBtn} onPress={() => adjustMinute(5)} hitSlop={8}>
                <MaterialIcons name="keyboard-arrow-up" size={28} color={Colors.primary} />
              </Pressable>
              <View style={tpStyles.digitBox}>
                <Text style={tpStyles.digitText}>{String(minute).padStart(2, '0')}</Text>
              </View>
              <Pressable style={tpStyles.arrowBtn} onPress={() => adjustMinute(-5)} hitSlop={8}>
                <MaterialIcons name="keyboard-arrow-down" size={28} color={Colors.primary} />
              </Pressable>
              <Text style={tpStyles.unitLabel}>Min</Text>
            </View>

            {/* AM/PM toggle */}
            <View style={tpStyles.column}>
              <View style={{ height: 36 }} />
              <Pressable
                style={tpStyles.ampmBtn}
                onPress={() => setHour(h => (h + 12) % 24)}
              >
                <Text style={[tpStyles.ampmText, ampm === 'AM' && tpStyles.ampmActive]}>AM</Text>
                <View style={tpStyles.ampmDivider} />
                <Text style={[tpStyles.ampmText, ampm === 'PM' && tpStyles.ampmActive]}>PM</Text>
              </Pressable>
              <View style={{ height: 36 }} />
              <Text style={tpStyles.unitLabel}> </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={tpStyles.actions}>
            <Pressable
              style={({ pressed }) => [tpStyles.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
            >
              <Text style={tpStyles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [tpStyles.saveBtn, pressed && { opacity: 0.85 }]}
              onPress={() => onSave({ hour, minute })}
            >
              <MaterialIcons name="check" size={16} color={Colors.textOnPrimary} />
              <Text style={tpStyles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------- Main Settings Screen ----------
export default function SettingsScreen() {
  const { showAlert } = useAlert();
  const { items, updateItem, deleteAllItems } = useItems();
  const [permStatus, setPermStatus] = useState<NotificationPermissionStatus>('undetermined');
  const [notifTime, setNotifTime] = useState<NotificationTime>({ hour: 9, minute: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    getNotificationPermissionStatus().then(setPermStatus);
    loadNotificationTime().then(setNotifTime);
  }, []);

  const handleSaveTime = useCallback(
    async (newTime: NotificationTime) => {
      setShowTimePicker(false);
      setNotifTime(newTime);
      await saveNotificationTime(newTime);

      // Reschedule all existing notifications with the new time
      const itemsWithNotifs = items.filter(i => (i.notificationIds?.length ?? 0) > 0);
      if (itemsWithNotifs.length > 0 && permStatus === 'granted') {
        setIsRescheduling(true);
        for (const item of itemsWithNotifs) {
          if (item.notificationIds?.length) {
            await cancelExpiryNotifications(item.notificationIds);
          }
          const newIds = await scheduleExpiryNotifications(item);
          await updateItem(item.id, { notificationIds: newIds });
        }
        setIsRescheduling(false);
        showAlert(
          'Time Updated',
          `Reminders rescheduled to ${formatTime(newTime)} for ${itemsWithNotifs.length} item${itemsWithNotifs.length !== 1 ? 's' : ''}.`
        );
      } else {
        showAlert('Time Saved', `Notifications will fire at ${formatTime(newTime)}.`);
      }
    },
    [items, permStatus, updateItem, showAlert]
  );

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
        `You receive reminders at ${formatTime(notifTime)} on the 7th, 3rd, and 1st day before each item expires.\n\nNotifications are scheduled automatically when you add an item.`
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

  const timeTrailing = (
    <View style={styles.timePill}>
      <MaterialIcons name="schedule" size={13} color={Colors.primary} />
      <Text style={styles.timePillText}>
        {isRescheduling ? 'Updating...' : formatTime(notifTime)}
      </Text>
    </View>
  );

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

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          <SettingRow
            icon="notifications-none"
            title="Expiry Reminders"
            subtitle={
              permStatus === 'granted'
                ? `7, 3 & 1 day${itemsWithNotifs > 0 ? ` · ${itemsWithNotifs} item${itemsWithNotifs !== 1 ? 's' : ''} scheduled` : ''}`
                : 'Tap to enable reminders before items expire'
            }
            onPress={handleNotifications}
            trailing={notifStatusBadge}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="access-time"
            title="Reminder Time"
            subtitle="Time of day to receive expiry alerts"
            onPress={() => setShowTimePicker(true)}
            trailing={timeTrailing}
          />
        </View>

        {/* General Section */}
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.section}>
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
            Tip: Change "Reminder Time" to set exactly when you want daily alerts — all scheduled items reschedule automatically.
          </Text>
        </View>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>

      <TimePickerModal
        visible={showTimePicker}
        initial={notifTime}
        onSave={handleSaveTime}
        onClose={() => setShowTimePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: Fonts.bold, color: Colors.textPrimary },
  headerSubtitle: { fontSize: 13, color: Colors.textTertiary, marginTop: 2 },
  scroll: { flex: 1 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 26, fontWeight: Fonts.bold, color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textTertiary, fontWeight: Fonts.medium, textAlign: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
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
    width: 36, height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconDestructive: { backgroundColor: Colors.expiredBg },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: Fonts.medium, color: Colors.textPrimary },
  rowTitleDestructive: { color: Colors.expired },
  rowSubtitle: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusPillOn: { backgroundColor: Colors.freshBg, borderColor: Colors.freshBorder },
  statusPillOff: { backgroundColor: Colors.surfaceSecondary, borderColor: Colors.border },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotOn: { backgroundColor: Colors.fresh },
  statusDotOff: { backgroundColor: Colors.textTertiary },
  statusPillText: { fontSize: 12, fontWeight: Fonts.semibold },
  statusPillTextOn: { color: Colors.fresh },
  statusPillTextOff: { color: Colors.textTertiary },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
    backgroundColor: Colors.primaryLight, borderColor: Colors.primary,
  },
  timePillText: { fontSize: 12, fontWeight: Fonts.semibold, color: Colors.primary },
  tip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    margin: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.soonBg, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.soonBorder,
  },
  tipText: { flex: 1, fontSize: 13, color: Colors.soon, lineHeight: 20, fontWeight: Fonts.medium },
});

// Time picker styles
const tpStyles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.lg,
    ...Shadow.md,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: { fontSize: 18, fontWeight: Fonts.bold, color: Colors.textPrimary },
  subtitle: {
    fontSize: 13, color: Colors.textTertiary, lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  column: { alignItems: 'center', gap: Spacing.xs },
  arrowBtn: {
    width: 44, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  digitBox: {
    width: 72, height: 64,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  digitText: { fontSize: 32, fontWeight: Fonts.bold, color: Colors.primary },
  unitLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: Fonts.medium, marginTop: 2 },
  colon: {
    fontSize: 32, fontWeight: Fonts.bold, color: Colors.textTertiary,
    marginTop: -Spacing.sm,
  },
  ampmBtn: {
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    overflow: 'hidden', backgroundColor: Colors.surfaceSecondary,
  },
  ampmDivider: { height: 1, backgroundColor: Colors.border },
  ampmText: {
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontWeight: Fonts.semibold, color: Colors.textTertiary,
    textAlign: 'center',
  },
  ampmActive: { color: Colors.textOnPrimary, backgroundColor: Colors.primary },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSecondary, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: Fonts.semibold, color: Colors.textSecondary },
  saveBtn: {
    flex: 1, flexDirection: 'row', gap: Spacing.xs,
    paddingVertical: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  saveText: { fontSize: 15, fontWeight: Fonts.semibold, color: Colors.textOnPrimary },
});
