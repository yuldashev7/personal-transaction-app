import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/hooks/use-theme';
import { Spacing } from '@/shared/theme/layout';

import { useRefreshControl, type RefreshState } from './refresh-control';
import { ScreenTitle } from './ScreenTitle';

type Edge = 'top' | 'bottom';

export interface ScreenProps extends PropsWithChildren {
  /** In-content large title for screens without a native header (tab roots). */
  readonly title?: string;
  readonly headerRight?: ReactNode;
  /**
   * Safe-area edges to pad on Android (edge-to-edge). iOS needs none: the root ScrollView uses
   * automatic content insets, which also account for the native tab bar and headers.
   */
  readonly edges?: readonly Edge[];
  readonly contentStyle?: StyleProp<ViewStyle>;
  /** Enables pull-to-refresh. */
  readonly refresh?: RefreshState;
}

/**
 * The ScrollView must stay the first native child of a tab screen so iOS native tabs can inset
 * content behind the tab bar.
 */
export function Screen({
  title,
  headerRight,
  edges = [],
  contentStyle,
  refresh,
  children,
}: ScreenProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const android = Platform.OS === 'android';
  const refreshControl = useRefreshControl(
    refresh,
    android && edges.includes('top') ? insets.top : 0,
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      refreshControl={refreshControl}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: (android && edges.includes('top') ? insets.top : 0) + Spacing.lg,
          paddingBottom: (android && edges.includes('bottom') ? insets.bottom : 0) + Spacing.xl,
        },
        contentStyle,
      ]}>
      {title !== undefined && <ScreenTitle title={title} headerRight={headerRight} />}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg, gap: Spacing.lg },
});
