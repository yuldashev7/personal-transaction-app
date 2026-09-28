import { Text as NativeText, StyleSheet, type TextProps as NativeTextProps } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import type { ColorToken } from '@/shared/theme/colors';
import { MAX_FONT_SCALE, Typography, type TypographyVariant } from '@/shared/theme/typography';

export interface TextProps extends NativeTextProps {
  readonly variant?: TypographyVariant;
  readonly color?: ColorToken;
  readonly align?: 'left' | 'center' | 'right';
  /** Equal-width digits so amounts don't jitter when they change. */
  readonly tabularNumbers?: boolean;
}

export function Text({
  variant = 'body',
  color = 'text',
  align,
  tabularNumbers = false,
  style,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const colors = useTheme();

  return (
    <NativeText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_FONT_SCALE[variant]}
      style={[
        variantStyles[variant],
        { color: colors[color] },
        align && { textAlign: align },
        tabularNumbers && styles.tabular,
        style,
      ]}
      {...rest}
    />
  );
}

const variantStyles = StyleSheet.create(Typography);

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
});
