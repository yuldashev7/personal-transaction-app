import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePullToRefresh } from '@/database/live-query';
import { AccountActivityList } from '@/features/statistics/components/AccountActivityList';
import { CategoryBreakdown } from '@/features/statistics/components/CategoryBreakdown';
import { MonthComparisonCard } from '@/features/statistics/components/MonthComparisonCard';
import { MonthlyChart } from '@/features/statistics/components/MonthlyChart';
import { MonthStepper } from '@/features/statistics/components/MonthStepper';
import { useMonthStatistics } from '@/features/statistics/hooks';
import type { BreakdownKind } from '@/features/statistics/types';
import { MonthSummaryCard } from '@/features/transactions/components/MonthSummaryCard';
import { getErrorMessage } from '@/shared/lib/errors';
import { startOfLocalMonth } from '@/shared/lib/date';
import { Spacing } from '@/shared/theme/layout';
import { Chip } from '@/shared/ui/Chip';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';

const BREAKDOWN_OPTIONS: readonly { readonly kind: BreakdownKind; readonly label: string }[] = [
  { kind: 'expense', label: 'Xarajatlar' },
  { kind: 'income', label: 'Daromadlar' },
];

export default function StatisticsScreen() {
  const [now, setNow] = useState(Date.now);
  const [currentMonth, setCurrentMonth] = useState(() => startOfLocalMonth(now));
  const [monthStart, setMonthStart] = useState(currentMonth);
  const [kind, setKind] = useState<BreakdownKind>('expense');
  const result = useMonthStatistics(monthStart, kind, now);
  const refresh = usePullToRefresh(() => {
    const nextNow = Date.now();
    const month = startOfLocalMonth(nextNow);
    setNow(nextNow);
    setCurrentMonth(month);
    if (monthStart === currentMonth) setMonthStart(month);
  });

  return (
    <Screen title="Statistika" edges={['top']} refresh={refresh}>
      <MonthStepper value={monthStart} max={currentMonth} onChange={setMonthStart} />

      {!result.ok ? (
        <EmptyState icon="warning" title="Ochib boʻlmadi" message={getErrorMessage(result.error)} />
      ) : (
        <>
          <MonthSummaryCard
            title={`Jami · ${result.value.totals.count} ta yozuv`}
            totals={result.value.totals}
            monthStart={monthStart}
            showNet
          />

          <MonthComparisonCard
            totals={result.value.totals}
            previousTotals={result.value.previousTotals}
            period={result.value.comparison}
            now={now}
          />

          <View style={styles.tabs} accessibilityRole="radiogroup" accessibilityLabel="Taqsimot">
            {BREAKDOWN_OPTIONS.map((option) => (
              <Chip
                key={option.kind}
                label={option.label}
                selectionMode="radio"
                selected={kind === option.kind}
                onPress={() => setKind(option.kind)}
              />
            ))}
          </View>

          <Text variant="headline" accessibilityRole="header">
            Kategoriyalar boʻyicha
          </Text>
          {result.value.categories.length > 0 ? (
            <CategoryBreakdown kind={kind} shares={result.value.categories} />
          ) : (
            <EmptyState
              icon="statistics"
              title={kind === 'expense' ? 'Bu oyda xarajat yoʻq' : 'Bu oyda daromad yoʻq'}
              action={{
                label: 'Yozuv qoʻshish',
                onPress: () =>
                  router.push({ pathname: '/transaction/new', params: { type: kind } }),
              }}
            />
          )}

          {result.value.accounts.length > 0 && (
            <>
              <Text variant="headline" accessibilityRole="header">
                Hisoblar boʻyicha
              </Text>
              <AccountActivityList accounts={result.value.accounts} />
            </>
          )}

          <Text variant="headline" accessibilityRole="header">
            Oylar boʻyicha
          </Text>
          <MonthlyChart
            months={result.value.months}
            selected={monthStart}
            onSelect={setMonthStart}
          />
          <Text variant="caption" color="textSecondary">
            Bir nechta kategoriyali yozuv summasi kategoriyalar orasida teng boʻlinadi. Oʻtkazmalar
            daromad va xarajatga kirmaydi.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: Spacing.sm },
});
