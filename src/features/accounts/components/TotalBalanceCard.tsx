import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/theme/layout';
import { AmountText } from '@/shared/ui/AmountText';
import { Surface } from '@/shared/ui/Surface';
import { Text } from '@/shared/ui/Text';

import { getTotalBalance } from '../queries';
import type { AccountWithBalance } from '../types';

export interface TotalBalanceCardProps {
  readonly accounts: readonly AccountWithBalance[];
}

export function TotalBalanceCard({ accounts }: TotalBalanceCardProps) {
  const active = accounts.filter((account) => account.archivedAt === null);

  return (
    <Surface variant="glass" radius="xl" style={styles.card}>
      <Text variant="label" color="textSecondary">
        Umumiy balans
      </Text>
      <AmountText amountMinor={getTotalBalance(active)} variant="display" adjustsFontSizeToFit />
      <Text variant="caption" color="textSecondary">
        {active.length} ta hisob
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.xl, gap: Spacing.xs },
});
