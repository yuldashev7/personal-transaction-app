import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { CONTROL_HEIGHT, Radius, Spacing } from '@/shared/theme/layout';
import { MAX_FONT_SCALE, Typography } from '@/shared/theme/typography';

import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface SearchFieldProps extends Omit<
  TextInputProps,
  'style' | 'placeholderTextColor' | 'value' | 'onChangeText'
> {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  /** Read by screen readers; the placeholder alone is not announced reliably. */
  readonly accessibilityLabel: string;
}

export function SearchField({ value, onChangeText, ...rest }: SearchFieldProps) {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceMuted }]}>
      <Icon name="search" size={18} color="textSecondary" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        role="searchbox"
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        maxFontSizeMultiplier={MAX_FONT_SCALE.body}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        style={[styles.input, { color: colors.text }]}
        {...rest}
      />
      {value !== '' && (
        <IconButton
          icon="close"
          accessibilityLabel="Qidiruvni tozalash"
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: CONTROL_HEIGHT,
    paddingLeft: Spacing.md,
    borderRadius: Radius.md,
  },
  input: { ...Typography.body, flex: 1, paddingVertical: Spacing.sm },
});
