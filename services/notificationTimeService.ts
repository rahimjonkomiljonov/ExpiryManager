// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_TIME_KEY = '@expiry_notif_time';

export interface NotificationTime {
  hour: number;   // 0–23
  minute: number; // 0–59
}

const DEFAULT_TIME: NotificationTime = { hour: 9, minute: 0 };

export async function loadNotificationTime(): Promise<NotificationTime> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_TIME_KEY);
    if (!raw) return DEFAULT_TIME;
    const parsed = JSON.parse(raw) as NotificationTime;
    if (
      typeof parsed.hour === 'number' &&
      typeof parsed.minute === 'number' &&
      parsed.hour >= 0 && parsed.hour <= 23 &&
      parsed.minute >= 0 && parsed.minute <= 59
    ) {
      return parsed;
    }
    return DEFAULT_TIME;
  } catch {
    return DEFAULT_TIME;
  }
}

export async function saveNotificationTime(time: NotificationTime): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIF_TIME_KEY, JSON.stringify(time));
  } catch {
    // silent
  }
}

export function formatTime(time: NotificationTime): string {
  const h = time.hour;
  const m = time.minute;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minStr = String(m).padStart(2, '0');
  return `${hour12}:${minStr} ${ampm}`;
}
