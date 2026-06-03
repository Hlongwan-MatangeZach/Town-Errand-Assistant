import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { networkService } from '../service/networkService';
import { syncQueue } from '../service/syncQueue';
import { cardRepository } from '../service/repositories/cardRepository';
import { groceryRepository } from '../service/repositories/groceryRepository';

interface SyncContextType {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [prevIsAuth, setPrevIsAuth] = useState(false);

  // Function to update the pending operations count
  const updatePendingCount = async () => {
    try {
      const queue = await syncQueue.getQueue();
      setPendingCount(queue.length);
    } catch (e) {
      console.error('Error reading sync queue length:', e);
    }
  };

  const triggerSync = async () => {
    if (!isAuthenticated || !token) return;
    const isOnline = await networkService.isOnline();
    if (!isOnline) return;

    setIsSyncing(true);
    try {
      console.log('SyncContext: Starting offline queue sync...');
      const success = await syncQueue.flush(token);
      if (success) {
        setLastSyncedAt(new Date());
        console.log('SyncContext: Sync completed successfully.');
      } else {
        console.log('SyncContext: Sync partially failed or was interrupted by network.');
      }
    } catch (error) {
      console.error('SyncContext: Sync error:', error);
    } finally {
      setIsSyncing(false);
      await updatePendingCount();
    }
  };

  // Watch network connectivity changes
  useEffect(() => {
    const unsubscribe = networkService.addConnectivityListener(async (online) => {
      console.log('SyncContext: Connection state changed to:', online ? 'ONLINE' : 'OFFLINE');
      if (online && isAuthenticated && token) {
        await triggerSync();
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, token]);

  // Periodically update pending count and sync on token/auth changes
  useEffect(() => {
    updatePendingCount();
    if (isAuthenticated && token) {
      triggerSync();
    }
  }, [isAuthenticated, token]);

  // Handle guest mode -> authenticated transition
  useEffect(() => {
    const handleAuthTransition = async () => {
      if (isAuthenticated && token && !prevIsAuth) {
        console.log('SyncContext: User transitioned guest -> auth. Starting migration...');
        setIsSyncing(true);
        try {
          // Trigger guest data migration
          await cardRepository.syncGuestDataToServer(token);
          await groceryRepository.syncGuestDataToServer(token);
          console.log('SyncContext: Guest data migration completed.');
          // Then flush any queued offline operations
          await triggerSync();
        } catch (error) {
          console.error('SyncContext: Error during guest migration:', error);
        } finally {
          setIsSyncing(false);
          await updatePendingCount();
        }
      }
      setPrevIsAuth(isAuthenticated);
    };

    handleAuthTransition();
  }, [isAuthenticated, token, prevIsAuth]);

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        pendingCount,
        lastSyncedAt,
        triggerSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
