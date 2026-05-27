// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  GroceryItem,
  loadItems,
  saveItems,
  generateId,
  sortByExpiry,
} from '@/services/storageService';

interface ItemsContextType {
  items: GroceryItem[];
  isLoading: boolean;
  addItem: (item: Omit<GroceryItem, 'id' | 'addedDate'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
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

  const addItem = useCallback(async (item: Omit<GroceryItem, 'id' | 'addedDate'>) => {
    const newItem: GroceryItem = {
      ...item,
      id: generateId(),
      addedDate: new Date().toISOString(),
    };
    const updated = sortByExpiry([...items, newItem]);
    setItems(updated);
    await saveItems(updated);
  }, [items]);

  const updateItem = useCallback(async (id: string, updates: Partial<GroceryItem>) => {
    const updated = sortByExpiry(
      items.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
    setItems(updated);
    await saveItems(updated);
  }, [items]);

  const deleteItem = useCallback(async (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    await saveItems(updated);
  }, [items]);

  const getItem = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  return (
    <ItemsContext.Provider value={{ items, isLoading, addItem, updateItem, deleteItem, getItem, refresh }}>
      {children}
    </ItemsContext.Provider>
  );
}
