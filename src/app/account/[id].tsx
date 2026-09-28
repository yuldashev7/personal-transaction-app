import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { getDatabase } from '@/database/client';
import { AccountForm } from '@/features/accounts/components/AccountForm';
import { useAccount } from '@/features/accounts/hooks';
import { getAccountErrorMessage } from '@/features/accounts/presentation';
import { deleteAccount, setAccountArchived, updateAccount } from '@/features/accounts/repository';
import type { AccountInput, AccountWithBalance } from '@/features/accounts/types';
import { getErrorMessage } from '@/shared/lib/errors';
import { hapticSuccess, hapticWarning } from '@/shared/lib/haptics';
import { formatMoney } from '@/shared/lib/money';
import { Spacing } from '@/shared/theme/layout';
import { AmountText } from '@/shared/ui/AmountText';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';
import { Surface } from '@/shared/ui/Surface';
import { Text } from '@/shared/ui/Text';
import { useToast } from '@/shared/ui/Toast';

export default function AccountScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const result = useAccount(id);
  const [leaving, setLeaving] = useState(false);

  // Keeps the screen blank while it animates out after deletion instead of flashing "not found".
  if (leaving) return <Screen />;

  if (!result.ok) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState icon="warning" title="Ochib boʻlmadi" message={getErrorMessage(result.error)} />
      </Screen>
    );
  }

  if (!result.value) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState icon="warning" title="Hisob topilmadi" />
      </Screen>
    );
  }

  return <AccountDetails account={result.value} onDeleted={() => setLeaving(true)} />;
}

function AccountDetails({
  account,
  onDeleted,
}: {
  account: AccountWithBalance;
  onDeleted: () => void;
}) {
  const showToast = useToast();
  const archived = account.archivedAt !== null;

  const toggleArchived = () => {
    const result = setAccountArchived(getDatabase(), account.id, !archived);
    if (!result.ok) {
      Alert.alert('Xatolik', getErrorMessage(result.error));
      return;
    }
    hapticSuccess();
    showToast({ message: archived ? 'Hisob arxivdan chiqarildi' : 'Hisob arxivlandi' });
  };

  const remove = () => {
    const result = deleteAccount(getDatabase(), account.id);
    if (result.ok) {
      hapticSuccess();
      onDeleted();
      showToast({ message: 'Hisob oʻchirildi' });
      router.back();
      return;
    }

    hapticWarning();
    const inUse = result.error.kind === 'constraint';
    Alert.alert(
      'Oʻchirib boʻlmaydi',
      getAccountErrorMessage(result.error),
      inUse && !archived
        ? [
            { text: 'Yopish', style: 'cancel' },
            { text: 'Arxivlash', onPress: toggleArchived },
          ]
        : [{ text: 'Yopish', style: 'cancel' }],
    );
  };

  const confirmDelete = () =>
    Alert.alert('Hisobni oʻchirasizmi?', `“${account.name}” roʻyxatdan olib tashlanadi.`, [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Oʻchirish', style: 'destructive', onPress: remove },
    ]);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: account.name }} />

      <Surface variant="raised" style={styles.balance}>
        <Text variant="label" color="textSecondary">
          {archived ? 'Balans (arxivlangan)' : 'Joriy balans'}
        </Text>
        <AmountText
          amountMinor={account.balanceMinor}
          currency={account.currencyCode}
          variant="title"
        />
        <Text variant="caption" color="textSecondary">
          Boshlangʻich balans + daromadlar − xarajatlar
        </Text>
      </Surface>

      <AccountForm
        initialValues={toFormInput(account)}
        submitLabel="Saqlash"
        onSubmit={(input) => updateAccount(getDatabase(), account.id, input)}
        onSuccess={() => {
          hapticSuccess();
          showToast({ message: 'Saqlandi' });
          router.back();
        }}
      />

      <View style={styles.actions}>
        <Button
          label={archived ? 'Arxivdan chiqarish' : 'Arxivlash'}
          variant="tinted"
          fullWidth
          onPress={toggleArchived}
        />
        <Button
          label="Oʻchirish"
          variant="destructive"
          icon="delete"
          fullWidth
          onPress={confirmDelete}
        />
        {!archived && (
          <Text variant="caption" color="textSecondary" align="center">
            Arxivlangan hisob umumiy balansga kirmaydi va yangi yozuvlarda tanlanmaydi, lekin tarixi
            saqlanadi.
          </Text>
        )}
      </View>
    </Screen>
  );
}

function toFormInput(account: AccountWithBalance): AccountInput {
  return {
    name: account.name,
    kind: account.kind,
    initialBalance:
      account.initialBalanceMinor === 0
        ? ''
        : formatMoney(account.initialBalanceMinor, account.currencyCode, { showCurrency: false }),
    cardNumber: account.cardNumber ?? '',
  };
}

const styles = StyleSheet.create({
  balance: { padding: Spacing.lg, gap: Spacing.xs },
  actions: { gap: Spacing.md },
});
