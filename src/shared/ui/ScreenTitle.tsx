import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/shared/theme/layout';

import { Text } from './Text';

export interface ScreenTitleProps {
  readonly title: string;
  readonly headerRight?: ReactNode;
}

export function ScreenTitle({ title, headerRight }: ScreenTitleProps) {
  return (
    <View style={styles.row}>
      <Text
        variant="display"
        accessibilityRole="header"
        style={styles.title}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {title}
      </Text>
      {headerRight}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  title: { flex: 1 },
});
