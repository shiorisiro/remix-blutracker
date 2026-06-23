import { useCallback, useEffect, useState } from 'react';
import { dexieDb } from './dexieClient';
import { syncEvents } from './offlineDb';

export type SyncStatus = 'offline' | 'syncing' | 'pending' | 'synced';

export function useSyncStatus(userId: string | undefined) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isFlushing, setIsFlushing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!userId) {
      setPendingCount(0);
      return;
    }
    const count = await dexieDb.syncQueue.where('userId').equals(userId).count();
    setPendingCount(count);
  }, [userId]);

  useEffect(() => {
    refreshCount();

    const onQueueChanged = () => refreshCount();
    const onFlushStart = () => setIsFlushing(true);
    const onFlushEnd = () => {
      setIsFlushing(false);
      refreshCount();
    };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    syncEvents.addEventListener('queue-changed', onQueueChanged);
    syncEvents.addEventListener('flush-start', onFlushStart);
    syncEvents.addEventListener('flush-end', onFlushEnd);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      syncEvents.removeEventListener('queue-changed', onQueueChanged);
      syncEvents.removeEventListener('flush-start', onFlushStart);
      syncEvents.removeEventListener('flush-end', onFlushEnd);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [refreshCount]);

  let status: SyncStatus;
  if (!isOnline) status = 'offline';
  else if (isFlushing) status = 'syncing';
  else if (pendingCount > 0) status = 'pending';
  else status = 'synced';

  return { status, pendingCount, isOnline };
}
