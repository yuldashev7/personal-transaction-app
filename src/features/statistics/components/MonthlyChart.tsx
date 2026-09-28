import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { formatMonthLabel, formatMonthShort } from '@/shared/lib/date';
import { formatMoney } from '@/shared/lib/money';
import { Radius, Spacing } from '@/shared/theme/layout';
import { FontFamily } from '@/shared/theme/typography';
import { getPressedStyle } from '@/shared/ui/pressable-feedback';
import { Surface } from '@/shared/ui/Surface';
import { Text } from '@/shared/ui/Text';

import { getBarRatio } from '../presentation';
import type { MonthTotals } from '../types';

const CHART_HEIGHT = 120;

export interface MonthlyChartProps {
  readonly months: readonly MonthTotals[];
  readonly selected: number;
  readonly onSelect: (monthStart: number) => void;
}

export function MonthlyChart({ months, selected, onSelect }: MonthlyChartProps) {
  const colors = useTheme();
  const max = Math.max(0, ...months.flatMap((month) => [month.incomeMinor, month.expenseMinor]));

  return (
    <Surface style={styles.card}>
      <View style={styles.legend}>
        <LegendDot color={colors.income} label="Daromad" />
        <LegendDot color={colors.expense} label="Xarajat" />
      </View>
      <View style={styles.columns}>
        {months.map((month) => {
          const isSelected = month.monthStart === selected;
          return (
            <Pressable
              key={month.monthStart}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${formatMonthLabel(month.monthStart)}: daromad ${formatMoney(month.incomeMinor)}, xarajat ${formatMoney(month.expenseMinor)}`}
              onPress={() => onSelect(month.monthStart)}
              style={({ pressed }) => [styles.column, getPressedStyle(pressed)]}>
              <View style={styles.bars}>
                <Bar color={colors.income} ratio={getBarRatio(month.incomeMinor, max)} />
                <Bar color={colors.expense} ratio={getBarRatio(month.expenseMinor, max)} />
              </View>
              <Text
                variant="caption"
                color={isSelected ? 'primary' : 'textSecondary'}
                style={isSelected && styles.selectedLabel}>
                {formatMonthShort(month.monthStart)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Surface>
  );
}

function Bar({ color, ratio }: { color: string; ratio: number }) {
  return <View style={[styles.bar, { height: CHART_HEIGHT * ratio, backgroundColor: color }]} />;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, gap: Spacing.md },
  legend: { flexDirection: 'row', gap: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: Radius.pill },
  columns: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { flex: 1, alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xs },
  bars: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: { width: 10, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  selectedLabel: { fontFamily: FontFamily.bold },
});
