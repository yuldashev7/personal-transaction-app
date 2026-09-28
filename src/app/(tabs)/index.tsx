import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePullToRefresh } from '@/database/live-query';
import { AccountStrip } from '@/features/accounts/components/AccountStrip';
import { TotalBalanceCard } from '@/features/accounts/components/TotalBalanceCard';
import { useAccounts } from '@/features/accounts/hooks';
import { MonthSummaryCard } from '@/features/transactions/components/MonthSummaryCard';
import { TransactionList } from '@/features/transactions/components/TransactionList';
import { useMonthTotals, useRecentTransactions } from '@/features/transactions/hooks';
import type { TransactionType } from '@/features/transactions/types';
import { useDeleteTransaction } from '@/features/transactions/use-delete-transaction';
import { getErrorMessage } from '@/shared/lib/errors';
import { Spacing } from '@/shared/theme/layout';
import { Button, type ButtonProps } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';

const RECENT_LIMIT = 10;

const addTransaction = (type?: TransactionType) =>
  router.push({ pathname: '/transaction/new', params: type ? { type } : {} });

export default function HomeScreen() {
  const accountsResult = useAccounts();
  const [now, setNow] = useState(Date.now);
  const refresh = usePullToRefresh(() => setNow(Date.now()));

  return (
    <Screen
      title="Personal Transaction"
      edges={['top']}
      refresh={refresh}
      headerRight={
        <IconButton
          icon="add"
          variant="filled"
          accessibilityLabel="Yozuv qoʻshish"
          onPress={() => addTransaction()}
        />
      }>
      {!accountsResult.ok ? (
        <EmptyState
          icon="warning"
          title="Ochib boʻlmadi"
          message={getErrorMessage(accountsResult.error)}
        />
      ) : accountsResult.value.length === 0 ? (
        <EmptyState
          icon="wallet"
          title="Hali hisob yoʻq"
          message="Karta yoki naqd pulingizni qoʻshing — balans avtomatik hisoblanadi."
          action={{ label: 'Hisob qoʻshish', onPress: () => router.push('/account/new') }}
        />
      ) : (
        <>
          <TotalBalanceCard accounts={accountsResult.value} />
          <MonthSummary />
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button
                label="Xarajat"
                icon="expense"
                variant="tinted"
                fullWidth
                onPress={() => addTransaction('expense')}
              />
            </View>
            <View style={styles.action}>
              <Button
                label="Daromad"
                icon="income"
                variant="tinted"
                fullWidth
                onPress={() => addTransaction('income')}
              />
            </View>
          </View>

          <SectionHeader
            title="Hisoblar"
            action={{ label: 'Qoʻshish', icon: 'add', onPress: () => router.push('/account/new') }}
          />
          <AccountStrip
            accounts={accountsResult.value}
            onPressAccount={(account) =>
              router.push({ pathname: '/account/[id]', params: { id: account.id } })
            }
          />

          <RecentTransactions now={now} />
        </>
      )}
    </Screen>
  );
}

function MonthSummary() {
  const result = useMonthTotals();
  // The totals are secondary; balances above still work if this query fails.
  if (!result.ok) return null;
  return <MonthSummaryCard totals={result.value} monthStart={result.value.monthStart} />;
}

function RecentTransactions({ now }: { now: number }) {
  const result = useRecentTransactions(RECENT_LIMIT);
  const confirmDelete = useDeleteTransaction();

  if (!result.ok) {
    return (
      <>
        <SectionHeader title="Oxirgi yozuvlar" />
        <Text color="textSecondary">{getErrorMessage(result.error)}</Text>
      </>
    );
  }

  if (result.value.length === 0) {
    return (
      <>
        <SectionHeader title="Oxirgi yozuvlar" />
        <EmptyState
          icon="transactions"
          title="Hali yozuv yoʻq"
          message="Birinchi xarajat yoki daromadingizni qoʻshing — balans darhol yangilanadi."
        />
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title="Oxirgi yozuvlar"
        action={{ label: 'Hammasi', onPress: () => router.navigate('/transactions') }}
      />
      <TransactionList
        items={result.value}
        now={now}
        onPressItem={(item) =>
          router.push({ pathname: '/transaction/[id]', params: { id: item.id } })
        }
        onLongPressItem={(item) => confirmDelete(item.id)}
      />
    </>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: Pick<ButtonProps, 'label' | 'icon' | 'onPress'>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="headline" accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {action && <Button variant="ghost" {...action} />}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.md },
  action: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    marginBottom: -Spacing.sm,
  },
  sectionTitle: { flex: 1 },
});
