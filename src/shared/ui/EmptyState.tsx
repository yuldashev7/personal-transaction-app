import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { Spacing } from '@/shared/theme/layout';

import { Button } from './Button';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { Text } from './Text';

export interface EmptyStateProps {
  readonly icon: IconName;
  readonly title: string;
  readonly message?: string;
  readonly action?: { readonly label: string; readonly onPress: () => void };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
        <Icon name={icon} size={28} color="textSecondary" />
      </View>
      <Text variant="headline" align="center" accessibilityRole="header">
        {title}
      </Text>
      {message !== undefined && (
        <Text color="textSecondary" align="center">
          {message}
        </Text>
      )}
      {action && (
        <View style={styles.action}>
          <Button label={action.label} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  action: { marginTop: Spacing.md },
});
