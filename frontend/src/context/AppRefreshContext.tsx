import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AppRefreshContextType {
  refresh: () => Promise<void>;
  refreshToken: number;
  isRefreshing: boolean;
}

const AppRefreshContext = createContext<AppRefreshContextType | undefined>(undefined);

export function AppRefreshProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [refreshToken, setRefreshToken] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidate and refetch all core dashboard queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['balancesSum'] }),
        queryClient.invalidateQueries({ queryKey: ['totalCollectedPayments'] }),
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] }),
      ]);

      // Wait for refetch to complete
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['customers'] }),
        queryClient.refetchQueries({ queryKey: ['balancesSum'] }),
        queryClient.refetchQueries({ queryKey: ['totalCollectedPayments'] }),
        queryClient.refetchQueries({ queryKey: ['currentUserProfile'] }),
      ]);

      // Increment refresh token to signal dialogs to clear errors
      setRefreshToken((prev) => prev + 1);

      toast.success('Data refreshed successfully');
    } catch (error: any) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  return (
    <AppRefreshContext.Provider value={{ refresh, refreshToken, isRefreshing }}>
      {children}
    </AppRefreshContext.Provider>
  );
}

export function useAppRefresh() {
  const context = useContext(AppRefreshContext);
  if (context === undefined) {
    throw new Error('useAppRefresh must be used within AppRefreshProvider');
  }
  return context;
}
