// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  GroceryItem,
  loadItems,
  saveItems,
  generateId,
  sortByExpiry,
} from '@/services/storageService';
import {
  scheduleExpiryNotifications,
  cancelExpiryNotifications,
  cancelAllExpiryNotifications,
} from '@/services/notificationService';

interface ItemsContextType {
  items: GroceryItem[];
  isLoading: boolean;
  addItem: (item: Omit<GroceryItem, 'id' | 'addedDate' | 'notificationIds'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deleteAllItems: () => Promise<void>;
  getItem: (id: string) => GroceryItem | undefined;
  refresh: () => Promise<void>;
}

export const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const loaded = await loadItems();
    setItems(sortByExpiry(loaded));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (item: Omit<GroceryItem, 'id' | 'addedDate' | 'notificationIds'>) => {
      const newItem: GroceryItem = {
        ...item,
        id: generateId(),
        addedDate: new Date().toISOString(),
        notificationIds: [],
      };

      // Schedule notifications and store their IDs on the item
      const notificationIds = await scheduleExpiryNotifications(newItem);
      newItem.notificationIds = notificationIds;

      const updated = sortByExpiry([...items, newItem]);
      setItems(updated);
      await saveItems(updated);
    },
    [items]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<GroceryItem>) => {
      const existing = items.find(i => i.id === id);

      // If expiry date changed, reschedule notifications
      let notificationIds = existing?.notificationIds ?? [];
      if (updates.expiryDate && updates.expiryDate !== existing?.expiryDate) {
        // Cancel old notifications
        if (notificationIds.length > 0) {
          await cancelExpiryNotifications(notificationIds);
        }
        // Schedule new ones with updated expiry
        const merged: GroceryItem = { ...existing!, ...updates };
        notificationIds = await scheduleExpiryNotifications(merged);
        updates = { ...updates, notificationIds };
      }

      const updated = sortByExpiry(
        items.map(item => (item.id === id ? { ...item, ...updates } : item))
      );
      setItems(updated);
      await saveItems(updated);
    },
    [items]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const item = items.find(i => i.id === id);
      // Cancel scheduled notifications for this item
      if (item?.notificationIds?.length) {
        await cancelExpiryNotifications(item.notificationIds);
      }
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      await saveItems(updated);
    },
    [items]
  );

  const deleteAllItems = useCallback(async () => {
    await cancelAllExpiryNotifications();
    setItems([]);
    await saveItems([]);
  }, []);

  const getItem = useCallback(
    (id: string) => {
      return items.find(item => item.id === id);
    },
    [items]
  );

  return (
    <ItemsContext.Provider
      value={{ items, isLoading, addItem, updateItem, deleteItem, deleteAllItems, getItem, refresh }}
    >
      {children}
    </ItemsContext.Provider>
  );
}
