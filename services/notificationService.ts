// Powered by OnSpace.AI
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { GroceryItem } from '@/services/storageService';
import { loadNotificationTime } from '@/services/notificationTimeService';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Days before expiry to schedule reminders */
const REMINDER_DAYS = [7, 3, 1];

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Request permission and set up Android notification channel */
export async function initNotifications(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-alerts', {
      name: 'Expiry Alerts',
      description: 'Reminders before grocery items expire',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2D7D46',
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return 'granted';

  const { status } = await Notifications.requestPermissionsAsync();
  return status as NotificationPermissionStatus;
}

/** Check current permission status without prompting */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as NotificationPermissionStatus;
}

/** Build the notification trigger date for N days before expiry at the user's configured time */
async function getTriggerDate(expiryDateStr: string, daysBefore: number): Promise<Date | null> {
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const time = await loadNotificationTime();

  const trigger = new Date(expiry);
  trigger.setDate(trigger.getDate() - daysBefore);
  trigger.setHours(time.hour, time.minute, 0, 0);

  // Only schedule if the trigger time is in the future
  if (trigger.getTime() <= Date.now()) return null;
  return trigger;
}

/** Schedule up to 3 reminders (7, 3, 1 day before) for a grocery item */
export async function scheduleExpiryNotifications(item: GroceryItem): Promise<string[]> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return [];

  const notificationIds: string[] = [];

  for (const daysBefore of REMINDER_DAYS) {
    const triggerDate = await getTriggerDate(item.expiryDate, daysBefore);
    if (!triggerDate) continue;

    const label =
      daysBefore === 1
        ? 'expires tomorrow'
        : `expires in ${daysBefore} days`;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${item.name} ${label}`,
          body: item.quantity
            ? `${item.quantity} — check your pantry and use it before it goes bad.`
            : 'Check your pantry and use it before it goes bad.',
          data: { itemId: item.id },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'expiry-alerts' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      notificationIds.push(id);
    } catch {
      // Silently skip if scheduling fails for this interval
    }
  }

  return notificationIds;
}

/** Cancel all scheduled notifications for an item */
export async function cancelExpiryNotifications(notificationIds: string[]): Promise<void> {
  await Promise.all(
    notificationIds.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
  );
}

/** Cancel ALL scheduled expiry notifications (used on clear-all) */
export async function cancelAllExpiryNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
