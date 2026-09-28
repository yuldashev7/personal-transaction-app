import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { getDatabase } from '@/database/client';
import { useAccounts } from '@/features/accounts/hooks';
import type { Account } from '@/features/accounts/types';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { useTransactionForEdit } from '@/features/transactions/hooks';
import { TRANSACTION_TYPE_OPTIONS } from '@/features/transactions/presentation';
import { updateTransaction } from '@/features/transactions/repository';
import type {
  Transaction,
  TransactionCategoryRef,
  TransactionInput,
} from '@/features/transactions/types';
import { useDeleteTransaction } from '@/features/transactions/use-delete-transaction';
import { getErrorMessage } from '@/shared/lib/errors';
import { hapticSuccess } from '@/shared/lib/haptics';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';
import { useToast } from '@/shared/ui/Toast';

export default function TransactionScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const result = useTransactionForEdit(id);
  const accountsResult = useAccounts({ includeArchived: true });
  const [leaving, setLeaving] = useState(false);

  if (leaving) return <Screen />;

  if (!result.ok || !accountsResult.ok) {
    const error = !result.ok ? result.error : accountsResult.ok ? null : accountsResult.error;
    return (
      <Screen edges={['bottom']}>
        <EmptyState
          icon="warning"
          title="Ochib boʻlmadi"
          message={error ? getErrorMessage(error) : undefined}
        />
      </Screen>
    );
  }

  if (!result.value) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState
          icon="warning"
          title="Yozuv topilmadi"
          message="U oʻchirilgan boʻlishi mumkin."
        />
      </Screen>
    );
  }

  return (
    <TransactionDetails
      transaction={result.value.transaction}
      categories={result.value.categories}
      accounts={accountsResult.value}
      onDeleted={() => setLeaving(true)}
    />
  );
}

function TransactionDetails({
  transaction,
  categories,
  accounts,
  onDeleted,
}: {
  transaction: Transaction;
  categories: readonly TransactionCategoryRef[];
  accounts: readonly Account[];
  onDeleted: () => void;
}) {
  const showToast = useToast();
  const confirmDelete = useDeleteTransaction();
  const typeLabel = TRANSACTION_TYPE_OPTIONS.find(
    (option) => option.type === transaction.type,
  )?.label;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: typeLabel ?? 'Yozuv' }} />
      <TransactionForm
        initialValues={toFormInput(transaction, categories)}
        initialCategories={categories}
        accounts={accounts}
        submitLabel="Saqlash"
        onSubmit={(input) => updateTransaction(getDatabase(), transaction.id, input)}
        onSuccess={() => {
          hapticSuccess();
          showToast({ message: 'Oʻzgarishlar saqlandi' });
          router.back();
        }}
      />
      <Button
        label="Oʻchirish"
        variant="destructive"
        icon="delete"
        fullWidth
        onPress={() =>
          confirmDelete(transaction.id, () => {
            onDeleted();
            router.back();
          })
        }
      />
    </Screen>
  );
}

function toFormInput(
  transaction: Transaction,
  categories: readonly TransactionCategoryRef[],
): TransactionInput {
  return {
    type: transaction.type,
    accountId: transaction.accountId,
    toAccountId: transaction.toAccountId,
    amount: formatMoney(transaction.amountMinor, undefined, { showCurrency: false }),
    categoryIds: categories.map((category) => category.id),
    note: transaction.note ?? '',
    occurredAt: transaction.occurredAt,
  };
}
