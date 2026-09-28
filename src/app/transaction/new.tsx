import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { getDatabase } from '@/database/client';
import { useAccounts } from '@/features/accounts/hooks';
import type { AccountWithBalance } from '@/features/accounts/types';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { useLastUsedAccountId } from '@/features/transactions/hooks';
import {
  getTransactionSavedMessage,
  parseTransactionType,
} from '@/features/transactions/presentation';
import { createTransaction } from '@/features/transactions/repository';
import type { TransactionInput, TransactionType } from '@/features/transactions/types';
import { getErrorMessage } from '@/shared/lib/errors';
import { hapticSuccess } from '@/shared/lib/haptics';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';
import { SheetHeader } from '@/shared/ui/SheetHeader';
import { useToast } from '@/shared/ui/Toast';

export default function NewTransactionScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const accountsResult = useAccounts();
  const lastUsed = useLastUsedAccountId();
  const [openedAt] = useState(Date.now);
  const showToast = useToast();

  const close = () => router.back();

  const content = !accountsResult.ok ? (
    <EmptyState
      icon="warning"
      title="Ochib boʻlmadi"
      message={getErrorMessage(accountsResult.error)}
    />
  ) : accountsResult.value.length === 0 ? (
    <EmptyState
      icon="wallet"
      title="Avval hisob qoʻshing"
      message="Yozuv qaysi karta yoki naqd pulga tegishli ekanini tanlash uchun kamida bitta hisob kerak."
      action={{ label: 'Hisob qoʻshish', onPress: () => router.replace('/account/new') }}
    />
  ) : (
    <TransactionForm
      autoFocus
      accounts={accountsResult.value}
      initialValues={createInitialInput(
        parseTransactionType(type),
        accountsResult.value,
        lastUsed.ok ? lastUsed.value : null,
        openedAt,
      )}
      submitLabel="Saqlash"
      onSubmit={(input) => createTransaction(getDatabase(), input)}
      onSuccess={(savedType) => {
        hapticSuccess();
        showToast({ message: getTransactionSavedMessage(savedType) });
        close();
      }}
    />
  );

  return (
    <Screen edges={['bottom']}>
      <SheetHeader title="Yangi yozuv" onClose={close} />
      {content}
    </Screen>
  );
}

/** Defaults to the account of the newest entry, otherwise the first active account. */
function createInitialInput(
  type: TransactionType,
  accounts: readonly AccountWithBalance[],
  lastUsedAccountId: string | null,
  occurredAt: number,
): TransactionInput {
  const accountId =
    accounts.find((account) => account.id === lastUsedAccountId)?.id ?? accounts[0]?.id ?? null;
  return {
    type,
    accountId,
    toAccountId: null,
    amount: '',
    categoryIds: [],
    note: '',
    occurredAt,
  };
}
