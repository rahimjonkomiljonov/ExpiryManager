// Powered by OnSpace.AI
import { useContext } from 'react';
import { ItemsContext } from '@/contexts/ItemsContext';

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used within ItemsProvider');
  return context;
}
