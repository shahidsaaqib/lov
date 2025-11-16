import { useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/storage';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      offlineStorage.setOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      offlineStorage.setOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
