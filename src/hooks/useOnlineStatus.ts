import { useCallback } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  isUnstable: boolean;
  lastChecked: number;
  checkConnection: () => Promise<boolean>;
}

/**
 * Online status hook - Offline mode deactivated per system configuration.
 * Always maintains live connected state.
 */
export function useOnlineStatus(): OnlineStatus {
  const checkConnection = useCallback(async (): Promise<boolean> => {
    return true;
  }, []);

  return {
    isOnline: true,
    isUnstable: false,
    lastChecked: Date.now(),
    checkConnection,
  };
}
