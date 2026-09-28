import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AccountPicker } from '@/features/accounts/components/AccountPicker';
import type { Account } from '@/features/accounts/types';
import { CategoryPicker } from '@/features/categories/components/CategoryPicker';
import { getErrorMessage, type AppError, type FieldErrors } from '@/shared/lib/errors';
import { formatMoney, parseMoney } from '@/shared/lib/money';
import type { Result } from '@/shared/lib/result';
import { Spacing } from '@/shared/theme/layout';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { DateStepper } from '@/shared/ui/DateStepper';
import { Text } from '@/shared/ui/Text';
import { TextField } from '@/shared/ui/TextField';

import { getTransactionFieldMessage, TRANSACTION_TYPE_OPTIONS } from '../presentation';
import type {
  TransactionCategoryRef,
  TransactionField,
  TransactionInput,
  TransactionType,
} from '../types';
import { NOTE_MAX_LENGTH } from '../validation';

export interface TransactionFormProps {
  readonly initialValues: TransactionInput;
  /** Active accounts, plus archived ones that the edited transaction already uses. */
  readonly accounts: readonly Account[];
  readonly submitLabel: string;
  readonly onSubmit: (input: TransactionInput) => Result<unknown, AppError>;
  readonly onSuccess: (type: TransactionType) => void;
  readonly autoFocus?: boolean;
  /** Categories of the edited transaction, including deleted ones that can still be kept. */
  readonly initialCategories?: readonly TransactionCategoryRef[];
}

export function TransactionForm({
  initialValues,
  initialCategories,
  accounts,
  submitLabel,
  onSubmit,
  onSuccess,
  autoFocus = false,
}: TransactionFormProps) {
  const [values, setValues] = useState<TransactionInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [openedAt] = useState(Date.now);
  // Saving is synchronous; this blocks a second tap while the sheet is closing.
  const saved = useRef(false);

  const update = (changes: Partial<TransactionInput>) => {
    setValues((current) => ({ ...current, ...changes }));
    setFieldErrors((current) => {
      const next: Record<string, string | undefined> = { ...current };
      for (const field of Object.keys(changes)) next[field] = undefined;
      return next;
    });
    setFormError(null);
  };

  const changeType = (type: TransactionType) => {
    if (type === values.type) return;
    // Categories belong to one kind, so the selection cannot carry over.
    update({ type, categoryIds: [], toAccountId: null });
  };

  const changeAccount = (accountId: string) =>
    update(
      values.type === 'transfer' && values.toAccountId === accountId
        ? { accountId, toAccountId: null }
        : { accountId },
    );

  const submit = () => {
    if (saved.current) return;
    const result = onSubmit(values);
    if (result.ok) {
      saved.current = true;
      onSuccess(values.type);
    } else if (result.error.kind === 'validation') {
      setFieldErrors(result.error.fields);
    } else {
      setFormError(getErrorMessage(result.error));
    }
  };

  const message = (field: TransactionField) =>
    getTransactionFieldMessage(field, fieldErrors[field]);
  const isTransfer = values.type === 'transfer';

  return (
    <View style={styles.form}>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Yozuv turi">
        {TRANSACTION_TYPE_OPTIONS.map((option) => (
          <Chip
            key={option.type}
            label={option.label}
            icon={option.icon}
            selectionMode="radio"
            selected={values.type === option.type}
            onPress={() => changeType(option.type)}
          />
        ))}
      </View>

      <TextField
        size="lg"
        label="Summa"
        placeholder="0"
        value={values.amount}
        onChangeText={(amount) => update({ amount })}
        error={message('amount')}
        hint={getAmountHint(values.amount)}
        keyboardType="decimal-pad"
        autoFocus={autoFocus}
      />

      {!isTransfer && (
        <Field label="Kategoriyalar" error={message('categoryIds')}>
          <CategoryPicker
            kind={values.type}
            selectedIds={values.categoryIds}
            onChange={(categoryIds) => update({ categoryIds })}
            retainedCategories={initialCategories}
          />
        </Field>
      )}

      <Field label={isTransfer ? 'Qaysi hisobdan' : 'Hisob'} error={message('accountId')}>
        <AccountPicker
          accessibilityLabel={isTransfer ? 'Qaysi hisobdan' : 'Hisob'}
          accounts={accounts}
          selectedId={values.accountId}
          onChange={changeAccount}
        />
      </Field>

      {isTransfer && (
        <Field label="Qaysi hisobga" error={message('toAccountId')}>
          <AccountPicker
            accessibilityLabel="Qaysi hisobga"
            accounts={accounts}
            selectedId={values.toAccountId}
            disabledId={values.accountId}
            onChange={(toAccountId) => update({ toAccountId })}
          />
        </Field>
      )}

      <View style={styles.group}>
        <DateStepper
          label="Sana"
          value={values.occurredAt}
          max={Math.max(openedAt, values.occurredAt)}
          onChange={(occurredAt) => update({ occurredAt })}
        />
        {message('occurredAt') !== undefined && (
          <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
            {message('occurredAt')}
          </Text>
        )}
      </View>

      <TextField
        label="Izoh (ixtiyoriy)"
        placeholder="Masalan, tushlik"
        value={values.note}
        onChangeText={(note) => update({ note })}
        error={message('note')}
        maxLength={NOTE_MAX_LENGTH}
        autoCapitalize="sentences"
        returnKeyType="done"
      />

      {formError !== null && (
        <Text color="danger" accessibilityLiveRegion="polite">
          {formError}
        </Text>
      )}

      <Button label={submitLabel} fullWidth onPress={submit} />
    </View>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: string | undefined;
  children: ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      {children}
      {error !== undefined && (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

function getAmountHint(input: string): string | undefined {
  const parsed = parseMoney(input);
  return parsed.ok && parsed.value > 0 ? `= ${formatMoney(parsed.value)}` : undefined;
}

const styles = StyleSheet.create({
  form: { gap: Spacing.xl },
  group: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
