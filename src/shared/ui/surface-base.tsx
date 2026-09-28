import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { Radius } from '@/shared/theme/layout';

export interface SurfaceProps extends ViewProps {
  /**
   * `glass` renders Liquid Glass on iOS 26+ (unless Reduce Transparency is on) and falls back to
   * `raised` everywhere else. Use it sparingly: hero cards, floating controls, toasts.
   */
  readonly variant?: 'flat' | 'raised' | 'glass';
  readonly radius?: keyof typeof Radius;
}

export function SolidSurface({ variant = 'flat', radius = 'lg', style, ...rest }: SurfaceProps) {
  const colors = useTheme();
  const raised = variant !== 'flat';

  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderRadius: Radius[radius] },
        raised && [styles.raised, { borderColor: colors.border }],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  raised: {
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
});
