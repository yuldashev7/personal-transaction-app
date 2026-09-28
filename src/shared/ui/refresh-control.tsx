import type { ReactElement } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';

export interface RefreshState {
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
}

/**
 * Themed pull-to-refresh control for `ScrollView` / `FlashList` `refreshControl` props.
 * `topInset` moves the Android spinner below the status bar on edge-to-edge screens.
 */
export function useRefreshControl(
  refresh: RefreshState | undefined,
  topInset = 0,
): ReactElement<RefreshControlProps> | undefined {
  const colors = useTheme();
  if (!refresh) return undefined;

  return (
    <RefreshControl
      refreshing={refresh.refreshing}
      onRefresh={refresh.onRefresh}
      progressViewOffset={topInset}
      tintColor={colors.textSecondary}
      colors={[colors.primary]}
      progressBackgroundColor={colors.surface}
    />
  );
}
