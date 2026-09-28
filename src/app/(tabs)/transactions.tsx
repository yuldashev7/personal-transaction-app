import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePullToRefresh } from '@/database/live-query';
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import {
  createFilterState,
  hasActiveFilters,
  toTransactionFilter,
} from '@/features/transactions/filters';
import { useTransactionFeed, useTransactionTotals } from '@/features/transactions/hooks';
import {
  groupTransactionsByDay,
  type TransactionListEntry,
} from '@/features/transactions/presentation';
import { useDeleteTransaction } from '@/features/transactions/use-delete-transaction';
import { useTheme } from '@/shared/hooks/use-theme';
import { getErrorMessage } from '@/shared/lib/errors';
import { Spacing } from '@/shared/theme/layout';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';
import { useRefreshControl } from '@/shared/ui/refresh-control';
import { ScreenTitle } from '@/shared/ui/ScreenTitle';
import { Text } from '@/shared/ui/Text';

const openTransaction = (id: string) =>
  router.push({ pathname: '/transaction/[id]', params: { id } });

export default function TransactionsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now);
  const [filterState, setFilterState] = useState(() => createFilterState(now));
  const refreshControl = useRefreshControl(
    usePullToRefresh(() => setNow(Date.now())),
    Platform.OS === 'android' ? insets.top : 0,
  );
  const search = useDeferredValue(filterState.search);
  const filter = toTransactionFilter({ ...filterState, search }, now);
  const filtering = hasActiveFilters(filterState);

  const { result, loadMore } = useTransactionFeed(filter);
  const totals = useTransactionTotals(filter);
  const confirmDelete = useDeleteTransaction();

  const entries = result.ok ? groupTransactionsByDay(result.value, now) : [];

  const renderItem = ({ item }: { item: TransactionListEntry }) =>
    item.kind === 'day' ? (
      <View style={styles.dayHeader}>
        <Text variant="label" color="textSecondary" accessibilityRole="header">
          {item.label}
        </Text>
      </View>
    ) : (
      <TransactionRow
        item={item.item}
        now={now}
        onPress={() => openTransaction(item.item.id)}
        onLongPress={() => confirmDelete(item.item.id)}
      />
    );

  return (
    <FlashList
      data={entries}
      renderItem={renderItem}
      keyExtractor={(entry) => entry.key}
      getItemType={(entry) => entry.kind}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={refreshControl}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: (Platform.OS === 'android' ? insets.top : 0) + Spacing.lg,
        paddingBottom: Spacing.xl,
      }}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenTitle
            title="Yozuvlar"
            headerRight={
              <IconButton
                icon="add"
                variant="filled"
                accessibilityLabel="Yozuv qoʻshish"
                onPress={() => router.push('/transaction/new')}
              />
            }
          />
          <TransactionFilters
            value={filterState}
            onChange={setFilterState}
            totals={totals.ok ? totals.value : null}
            now={now}
          />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          {!result.ok ? (
            <EmptyState
              icon="warning"
              title="Ochib boʻlmadi"
              message={getErrorMessage(result.error)}
            />
          ) : filtering ? (
            <EmptyState
              icon="search"
              title="Hech narsa topilmadi"
              message="Boshqa soʻz yoki davrni tanlab koʻring."
              action={{
                label: 'Filtrlarni tozalash',
                onPress: () => setFilterState(createFilterState(now)),
              }}
            />
          ) : (
            <EmptyState
              icon="transactions"
              title="Hali yozuvlar yoʻq"
              message="Xarajat yoki daromad qoʻshsangiz, shu yerda kunlar boʻyicha koʻrinadi."
              action={{ label: 'Yozuv qoʻshish', onPress: () => router.push('/transaction/new') }}
            />
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.lg },
  dayHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  empty: { paddingHorizontal: Spacing.lg },
});
