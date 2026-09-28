import { useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { CONTROL_HEIGHT, Radius, Spacing } from '@/shared/theme/layout';
import { MAX_FONT_SCALE, Typography } from '@/shared/theme/typography';

import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  readonly ref?: Ref<TextInput>;
  readonly label: string;
  /** User-facing message; also marks the field invalid. */
  readonly error?: string;
  /** Helper text shown when there is no error. */
  readonly hint?: string;
  /** `lg` renders the value in title type, e.g. for the amount of a transaction. */
  readonly size?: 'md' | 'lg';
}

export function TextField({
  label,
  error,
  hint,
  size = 'md',
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  const helper = error ?? hint;

  return (
    <View style={styles.container}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={helper}
        maxFontSizeMultiplier={size === 'lg' ? MAX_FONT_SCALE.title : MAX_FONT_SCALE.body}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          size === 'lg' && styles.inputLarge,
          { color: colors.text, backgroundColor: colors.surface, borderColor },
        ]}
        {...rest}
      />
      {helper !== undefined && (
        <Text
          variant="caption"
          color={error ? 'danger' : 'textSecondary'}
          accessibilityLiveRegion={error ? 'polite' : 'none'}>
          {helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  input: {
    ...Typography.body,
    minHeight: CONTROL_HEIGHT,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  inputLarge: { ...Typography.title, minHeight: 64, fontVariant: ['tabular-nums'] },
});
