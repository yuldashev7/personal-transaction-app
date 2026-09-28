import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, type AppError, type FieldErrors } from '@/shared/lib/errors';
import type { Result } from '@/shared/lib/result';
import { NAME_MAX_LENGTH } from '@/shared/lib/validation';
import { Spacing } from '@/shared/theme/layout';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { IconPicker } from '@/shared/ui/IconPicker';
import { resolveIconName } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/Text';
import { TextField } from '@/shared/ui/TextField';

import {
  CATEGORY_ICON_OPTIONS,
  CATEGORY_KIND_OPTIONS,
  getCategoryFieldMessage,
} from '../presentation';
import type { CategoryInput } from '../types';

export interface CategoryFormProps {
  readonly initialValues: CategoryInput;
  /** Kind is chosen on creation only; existing transactions depend on it. */
  readonly kindEditable: boolean;
  readonly submitLabel: string;
  readonly onSubmit: (input: CategoryInput) => Result<unknown, AppError>;
  readonly onSuccess: () => void;
  readonly autoFocus?: boolean;
}

export function CategoryForm({
  initialValues,
  kindEditable,
  submitLabel,
  onSubmit,
  onSuccess,
  autoFocus = false,
}: CategoryFormProps) {
  const [values, setValues] = useState<CategoryInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const update = <K extends keyof CategoryInput>(field: K, value: CategoryInput[K]) => {
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
      setFormError(getErrorMessage(result.error));
    }
  };

  const iconError = getCategoryFieldMessage('icon', fieldErrors.icon);

  return (
    <View style={styles.form}>
      {kindEditable && (
        <View style={styles.chips} accessibilityRole="radiogroup">
          {CATEGORY_KIND_OPTIONS.map((option) => (
            <Chip
              key={option.kind}
              label={option.label}
              selectionMode="radio"
              selected={values.kind === option.kind}
              onPress={() => update('kind', option.kind)}
            />
          ))}
        </View>
      )}

      <TextField
        label="Nomi"
        placeholder="Masalan, Sport"
        value={values.name}
        onChangeText={(text) => update('name', text)}
        error={getCategoryFieldMessage('name', fieldErrors.name)}
        maxLength={NAME_MAX_LENGTH}
        autoFocus={autoFocus}
        autoCapitalize="sentences"
        returnKeyType="done"
      />

      <View style={styles.group}>
        <Text variant="label" color="textSecondary">
          Belgi
        </Text>
        <IconPicker
          options={CATEGORY_ICON_OPTIONS}
          value={resolveIconName(values.icon)}
          onChange={(icon) => update('icon', icon)}
        />
        {iconError !== undefined && (
          <Text variant="caption" color="danger">
            {iconError}
          </Text>
        )}
      </View>

      {formError !== null && (
        <Text color="danger" accessibilityLiveRegion="polite">
          {formError}
        </Text>
      )}

      <Button label={submitLabel} fullWidth onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.xl },
  group: { gap: Spacing.sm },
  chips: { flexDirection: 'row', gap: Spacing.sm },
});
