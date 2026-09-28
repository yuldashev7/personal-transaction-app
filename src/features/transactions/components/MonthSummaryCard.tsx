import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { formatMonthLabel } from '@/shared/lib/date';
import { formatMoney } from '@/shared/lib/money';
import { Spacing } from '@/shared/theme/layout';
import { AmountText } from '@/shared/ui/AmountText';
import { Surface } from '@/shared/ui/Surface';
import { Text } from '@/shared/ui/Text';

import type { TransactionTotals } from '../types';

export interface MonthSummaryCardProps {
  readonly totals: TransactionTotals;
  readonly monthStart: number;
  /** Replaces the default "Sentabr oyi" heading, e.g. where the month is already shown. */
  readonly title?: string;
  /** Adds income − expense below the two columns. */
  readonly showNet?: boolean;
}

/** Transfers are excluded: they move money between own accounts. */
export function MonthSummaryCard({
  totals,
  monthStart,
  title,
  showNet = false,
}: MonthSummaryCardProps) {
  const colors = useTheme();
  const net = totals.incomeMinor - totals.expenseMinor;

  return (
    <Surface variant="raised" radius="lg" style={styles.card}>
      <Text variant="label" color="textSecondary" accessibilityRole="header">
        {title ?? `${formatMonthLabel(monthStart)} oyi`}
      </Text>
      <View style={styles.row}>
        <View
          style={styles.column}
          accessible
          accessibilityLabel={`Daromad ${formatMoney(totals.incomeMinor)}`}>
          <Text variant="caption" color="textSecondary">
            Daromad
          </Text>
          <AmountText
            amountMinor={totals.incomeMinor}
            tone="income"
            variant="headline"
            adjustsFontSizeToFit
          />
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View
          style={styles.column}
          accessible
          accessibilityLabel={`Xarajat ${formatMoney(totals.expenseMinor)}`}>
          <Text variant="caption" color="textSecondary">
            Xarajat
          </Text>
          <AmountText
            amountMinor={totals.expenseMinor}
            tone="expense"
            variant="headline"
            adjustsFontSizeToFit
          />
        </View>
      </View>
      {showNet && (
        <View
          style={[styles.net, { borderTopColor: colors.border }]}
          accessible
          accessibilityLabel={`Farq ${formatMoney(net, undefined, { signDisplay: 'always' })}`}>
          <Text variant="label" color="textSecondary" style={styles.netLabel}>
            Farq
          </Text>
          <AmountText
            amountMinor={net}
            tone={net > 0 ? 'income' : net < 0 ? 'expense' : 'neutral'}
            variant="bodyStrong"
          />
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.lg },
  column: { flex: 1, gap: Spacing.xxs },
  divider: { width: StyleSheet.hairlineWidth },
  net: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  netLabel: { flex: 1 },
});
