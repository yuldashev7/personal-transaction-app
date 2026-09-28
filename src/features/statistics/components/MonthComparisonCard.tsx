import { StyleSheet, View } from 'react-native';

import type { TransactionTotals } from '@/features/transactions/types';
import { useTheme } from '@/shared/hooks/use-theme';
import { formatMoney } from '@/shared/lib/money';
import type { ColorToken } from '@/shared/theme/colors';
import { Spacing } from '@/shared/theme/layout';
import { Icon } from '@/shared/ui/Icon';
import { Surface } from '@/shared/ui/Surface';
import { Text } from '@/shared/ui/Text';

import {
  formatChange,
  formatComparisonPeriod,
  getChange,
  type Change,
  type ComparisonPeriod,
} from '../comparison';

export interface MonthComparisonCardProps {
  readonly totals: TransactionTotals;
  readonly previousTotals: TransactionTotals;
  readonly period: ComparisonPeriod;
  readonly now: number;
}

export function MonthComparisonCard({
  totals,
  previousTotals,
  period,
  now,
}: MonthComparisonCardProps) {
  const colors = useTheme();

  return (
    <Surface variant="raised" radius="lg" style={styles.card}>
      <View style={styles.header}>
        <Text variant="label" color="textSecondary" accessibilityRole="header">
          Oʻtgan oyga nisbatan
        </Text>
        <Text variant="caption" color="textSecondary">
          {formatComparisonPeriod(period, now)}
        </Text>
      </View>
      <ComparisonRow
        label="Xarajat"
        currentMinor={totals.expenseMinor}
        previousMinor={previousTotals.expenseMinor}
        increaseIsGood={false}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <ComparisonRow
        label="Daromad"
        currentMinor={totals.incomeMinor}
        previousMinor={previousTotals.incomeMinor}
        increaseIsGood
      />
    </Surface>
  );
}

function ComparisonRow({
  label,
  currentMinor,
  previousMinor,
  increaseIsGood,
}: {
  label: string;
  currentMinor: number;
  previousMinor: number;
  increaseIsGood: boolean;
}) {
  const change = getChange(currentMinor, previousMinor);
  const color = getChangeColor(change, increaseIsGood);
  const changeText = formatChange(change);
  const previousText = `Oʻtgan oy: ${formatMoney(previousMinor)}`;
  const difference =
    change.kind === 'up' || change.kind === 'down'
      ? formatMoney(
          change.kind === 'up' ? change.differenceMinor : -change.differenceMinor,
          undefined,
          {
            signDisplay: 'always',
          },
        )
      : null;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${changeText}${difference ? `, ${difference}` : ''}. ${previousText}`}>
      <View style={styles.label}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="textSecondary" tabularNumbers numberOfLines={1}>
          {previousText}
        </Text>
      </View>
      <View style={styles.value}>
        <View style={styles.change}>
          {(change.kind === 'up' || change.kind === 'down') && (
            <Icon name={change.kind === 'up' ? 'arrowUp' : 'arrowDown'} size={14} color={color} />
          )}
          <Text variant="bodyStrong" color={color} numberOfLines={1}>
            {changeText}
          </Text>
        </View>
        {difference !== null && (
          <Text variant="caption" color={color} tabularNumbers numberOfLines={1}>
            {difference}
          </Text>
        )}
      </View>
    </View>
  );
}

function getChangeColor(change: Change, increaseIsGood: boolean): ColorToken {
  if (change.kind !== 'up' && change.kind !== 'down') return 'textSecondary';
  return (change.kind === 'up') === increaseIsGood ? 'income' : 'expense';
}

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, gap: Spacing.md },
  header: { gap: Spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  label: { flex: 1, gap: Spacing.xxs },
  value: { alignItems: 'flex-end', gap: Spacing.xxs, flexShrink: 0 },
  change: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  divider: { height: StyleSheet.hairlineWidth },
});
