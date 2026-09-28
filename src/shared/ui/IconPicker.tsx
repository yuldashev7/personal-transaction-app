import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { MIN_TOUCH_SIZE, Radius, Spacing } from '@/shared/theme/layout';

import { Icon } from './Icon';
import type { IconName } from './icons';
import { getPressedStyle, getRipple } from './pressable-feedback';

export interface IconPickerProps {
  readonly options: readonly { readonly icon: IconName; readonly label: string }[];
  readonly value: IconName;
  readonly onChange: (icon: IconName) => void;
}

/** Single-choice icon grid. */
export function IconPicker({ options, value, onChange }: IconPickerProps) {
  const colors = useTheme();

  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {options.map(({ icon, label }) => {
        const selected = icon === value;
        return (
          <Pressable
            key={icon}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(icon)}
            android_ripple={getRipple(colors.border)}
            style={({ pressed }) => [
              styles.cell,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
              getPressedStyle(pressed),
            ]}>
            <Icon name={icon} size={22} color={selected ? 'onPrimary' : 'text'} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cell: {
    width: MIN_TOUCH_SIZE + Spacing.xs,
    height: MIN_TOUCH_SIZE + Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
