import { router } from 'expo-router';

import { usePullToRefresh } from '@/database/live-query';
import { AccountList } from '@/features/accounts/components/AccountList';
import { useAccounts } from '@/features/accounts/hooks';
import type { AccountWithBalance } from '@/features/accounts/types';
import { getErrorMessage } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';

const openAccount = (account: AccountWithBalance) =>
  router.push({ pathname: '/account/[id]', params: { id: account.id } });

/** All accounts, including archived ones (which the dashboard hides). */
export default function AccountsScreen() {
  const result = useAccounts({ includeArchived: true });
  const refresh = usePullToRefresh();

  if (!result.ok) {
    return (
      <Screen edges={['bottom']} refresh={refresh}>
        <EmptyState icon="warning" title="Ochib boʻlmadi" message={getErrorMessage(result.error)} />
      </Screen>
    );
  }

  const active = result.value.filter((account) => account.archivedAt === null);
  const archived = result.value.filter((account) => account.archivedAt !== null);

  return (
    <Screen edges={['bottom']} refresh={refresh}>
      {active.length > 0 ? (
        <AccountList accounts={active} onPressAccount={openAccount} />
      ) : (
        <EmptyState icon="wallet" title="Faol hisob yoʻq" />
      )}

      {archived.length > 0 && (
        <>
          <Text variant="headline" accessibilityRole="header">
            Arxivlangan
          </Text>
          <AccountList accounts={archived} onPressAccount={openAccount} />
        </>
      )}

      <Button
        label="Hisob qoʻshish"
        icon="add"
        variant="tinted"
        fullWidth
        onPress={() => router.push('/account/new')}
      />
    </Screen>
  );
}
