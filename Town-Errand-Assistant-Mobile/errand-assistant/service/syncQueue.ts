import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardsService } from './cardsService';
import { GroceryService } from './groceryService';

const QUEUE_STORAGE_KEY = '@sync_queue_v1';

export interface SyncQueueEntry {
  id: string;
  timestamp: number;
  entity: 'card' | 'basket' | 'item';
  operation: 'create' | 'update' | 'delete' | 'delete_all';
  localId: string;
  basketId?: string;
  payload: any;
}

function isNetworkError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('cannot reach the api') ||
    msg.includes('failed to fetch') ||
    msg.includes('typeerror')
  );
}

export const syncQueue = {
  async getQueue(): Promise<SyncQueueEntry[]> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading sync queue from AsyncStorage:', e);
      return [];
    }
  },

  async enqueue(entry: Omit<SyncQueueEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newEntry: SyncQueueEntry = {
        ...entry,
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now(),
      };
      queue.push(newEntry);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      console.log('Enqueued offline operation:', newEntry);
    } catch (e) {
      console.error('Error enqueuing to sync queue:', e);
    }
  },

  async flush(token: string): Promise<boolean> {
    const queue = await this.getQueue();
    if (queue.length === 0) return true;

    const idMap: Record<string, string> = {};
    const remaining: SyncQueueEntry[] = [];
    let hasNetworkError = false;

    console.log(`Flushing sync queue with ${queue.length} items...`);

    for (const entry of queue) {
      if (hasNetworkError) {
        remaining.push(entry);
        continue;
      }

      try {
        if (entry.entity === 'card') {
          if (entry.operation === 'create') {
            const result = await CardsService.addUserCard(token, entry.payload);
            idMap[entry.localId] = result.id;
          } else if (entry.operation === 'delete') {
            const cardId = idMap[entry.localId] || entry.localId;
            await CardsService.deleteUserCard(token, cardId);
          } else if (entry.operation === 'delete_all') {
            await CardsService.deleteAllUserCards(token);
          }
        } else if (entry.entity === 'basket') {
          if (entry.operation === 'create') {
            const result = await GroceryService.createUserBasket(token, entry.payload);
            idMap[entry.localId] = result.id;
          } else if (entry.operation === 'update') {
            const basketId = idMap[entry.localId] || entry.localId;
            await GroceryService.updateUserBasket(token, basketId, entry.payload);
          } else if (entry.operation === 'delete') {
            const basketId = idMap[entry.localId] || entry.localId;
            await GroceryService.deleteUserBasket(token, basketId);
          }
        } else if (entry.entity === 'item') {
          const basketId = idMap[entry.basketId!] || entry.basketId!;
          if (entry.operation === 'create') {
            const result = await GroceryService.createUserItem(token, basketId, entry.payload);
            idMap[entry.localId] = result.id;
          } else if (entry.operation === 'update') {
            const itemId = idMap[entry.localId] || entry.localId;
            await GroceryService.updateUserItem(token, basketId, itemId, entry.payload);
          } else if (entry.operation === 'delete') {
            const itemId = idMap[entry.localId] || entry.localId;
            await GroceryService.deleteUserItem(token, basketId, itemId);
          }
        }
      } catch (error: any) {
        console.error('Error flushing sync queue entry:', entry, error);
        if (isNetworkError(error)) {
          hasNetworkError = true;
          remaining.push(entry);
        } else {
          // Log logic/validation error and remove (skip) it from the queue
          console.warn('Skipping queue entry due to logical/validation error:', entry, error);
        }
      }
    }

    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.error('Error saving remaining sync queue:', e);
    }

    return !hasNetworkError;
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
      console.log('Cleared sync queue.');
    } catch (e) {
      console.error('Error clearing sync queue:', e);
    }
  },
};
