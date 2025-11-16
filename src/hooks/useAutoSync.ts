/* ==== AUTO SYNC HOOK ==== */

import { useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { syncService } from '@/lib/sync';
import { toast } from 'sonner';

export const useAutoSync = () => {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    let syncInterval: NodeJS.Timeout | null = null;

    const performSync = async () => {
      if (!isOnline || !syncService.isSupabaseConfigured()) return;

      try {
        await syncService.fullSync();
        console.log('Auto-sync completed');
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    };

    if (isOnline && syncService.isSupabaseConfigured()) {
      // Perform initial sync
      performSync();

      // Set up periodic sync every 5 minutes
      syncInterval = setInterval(performSync, 5 * 60 * 1000);
      
      toast.success('Connected - Auto-sync enabled');
    } else if (!isOnline) {
      toast.warning('Offline mode - Changes will sync when online');
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isOnline]);

  return { isOnline, isConfigured: syncService.isSupabaseConfigured() };
};

/* ==== END OF AUTO SYNC HOOK ==== */
