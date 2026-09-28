import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import type { AppError, FieldErrors } from '@/shared/lib/errors';
import { formatMoney, parseMoney } from '@/shared/lib/money';
import type { Result } from '@/shared/lib/result';
import { NAME_MAX_LENGTH } from '@/shared/lib/validation';
import { Spacing } from '@/shared/theme/layout';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { Text } from '@/shared/ui/Text';
import { TextField } from '@/shared/ui/TextField';

import {
  ACCOUNT_KIND_OPTIONS,
  formatCardNumber,
  getAccountErrorMessage,
  getAccountFieldMessage,
} from '../presentation';
import type { AccountInput } from '../types';
import { CARD_NUMBER_MAX_DIGITS } from '../validation';

const EMPTY_INPUT: AccountInput = { name: '', kind: 'card', initialBalance: '', cardNumber: '' };

/** Digits plus a space after every group of four. */
const CARD_NUMBER_MAX_LENGTH =
  CARD_NUMBER_MAX_DIGITS + Math.floor((CARD_NUMBER_MAX_DIGITS - 1) / 4);

export interface AccountFormProps {
  readonly initialValues?: AccountInput;
  readonly submitLabel: string;
  /** Validates and saves (repository); the form only maps errors to messages. */
  readonly onSubmit: (input: AccountInput) => Result<unknown, AppError>;
  readonly onSuccess: () => void;
  readonly autoFocus?: boolean;
}

export function AccountForm({
  initialValues = EMPTY_INPUT,
  submitLabel,
  onSubmit,
  onSuccess,
  autoFocus = false,
}: AccountFormProps) {
  const [values, setValues] = useState<AccountInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const balanceRef = useRef<TextInput>(null);

  const update = <K extends keyof AccountInput>(field: K, value: AccountInput[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const submit = () => {
    const result = onSubmit(values);
    if (result.ok) {
      onSuccess();
    } else if (result.error.kind === 'validation') {
      setFieldErrors(result.error.fields);
    } else {
      setFormError(getAccountErrorMessage(result.error));
    }
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Nomi"
        placeholder="Masalan, TBC karta"
        value={values.name}
        onChangeText={(text) => update('name', text)}
        error={getAccountFieldMessage(fieldErrors.name)}
        maxLength={NAME_MAX_LENGTH}
        autoFocus={autoFocus}
        autoCapitalize="sentences"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => balanceRef.current?.focus()}
      />

      <View style={styles.group}>
        <Text variant="label" color="textSecondary">
          Turi
        </Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {ACCOUNT_KIND_OPTIONS.map((option) => (
            <Chip
              key={option.kind}
              label={option.label}
              icon={option.icon}
              selectionMode="radio"
              selected={values.kind === option.kind}
              onPress={() => update('kind', option.kind)}
            />
          ))}
        </View>
      </View>

      {values.kind === 'card' && (
        <TextField
          label="Karta raqami (ixtiyoriy)"
          placeholder="0000 0000 0000 0000"
          value={formatCardNumber(values.cardNumber ?? '')}
          onChangeText={(text) => update('cardNumber', formatCardNumber(text))}
          keyboardType="number-pad"
          maxLength={CARD_NUMBER_MAX_LENGTH}
          autoComplete="off"
          textContentType="none"
        />
      )}

      <TextField
        ref={balanceRef}
        label="Boshlangʻich balans"
        placeholder="0"
        value={values.initialBalance}
        onChangeText={(text) => update('initialBalance', text)}
        error={getAccountFieldMessage(fieldErrors.initialBalance)}
        hint={getBalanceHint(values.initialBalance)}
        keyboardType="decimal-pad"
        returnKeyType="done"
        onSubmitEditing={submit}
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

function getBalanceHint(input: string): string | undefined {
  if (input.trim() === '') return 'Hozir kartada yoki qoʻlda qancha pul bor. Boʻsh qolsa — 0.';
  const parsed = parseMoney(input);
  return parsed.ok ? `= ${formatMoney(parsed.value)}` : undefined;
}

const styles = StyleSheet.create({
  form: { gap: Spacing.xl },
  group: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
