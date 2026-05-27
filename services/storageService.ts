// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '@/constants/config';

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  expiryDate: string; // ISO date string
  addedDate: string;  // ISO date string
  notes: string;
  barcode?: string;
}

export type ExpiryStatus = 'expired' | 'critical' | 'soon' | 'fresh';

export function getExpiryStatus(expiryDateStr: string): ExpiryStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'critical';
  if (diffDays <= 7) return 'soon';
  return 'fresh';
}

export function getDaysUntilExpiry(expiryDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatExpiryLabel(expiryDateStr: string): string {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 7) return `Expires in ${days} days`;
  const expiry = new Date(expiryDateStr);
  return `Expires ${expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export async function loadItems(): Promise<GroceryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GroceryItem[];
  } catch {
    return [];
  }
}

export async function saveItems(items: GroceryItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silent
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function sortByExpiry(items: GroceryItem[]): GroceryItem[] {
  return [...items].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );
}
