import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { formatMonthLabel, shiftLocalMonths } from '@/shared/lib/date';
import { CONTROL_HEIGHT, Radius, Spacing } from '@/shared/theme/layout';
import { IconButton } from '@/shared/ui/IconButton';
import { getPressedStyle, getRipple } from '@/shared/ui/pressable-feedback';
import { Text } from '@/shared/ui/Text';

export interface MonthStepperProps {
  /** First day of the selected month. */
  readonly value: number;
  /** First day of the current month; later months are not offered. */
  readonly max: number;
  readonly onChange: (monthStart: number) => void;
}

export function MonthStepper({ value, max, onChange }: MonthStepperProps) {
  const colors = useTheme();
  const isCurrent = value >= max;
  const label = formatMonthLabel(value, max);

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <IconButton
        icon="chevronLeft"
        accessibilityLabel="Oldingi oy"
        onPress={() => onChange(shiftLocalMonths(value, -1))}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Oy: ${label}`}
        accessibilityHint={isCurrent ? undefined : 'Joriy oyga qaytaradi'}
        disabled={isCurrent}
        onPress={() => onChange(max)}
        android_ripple={getRipple(colors.border)}
        style={({ pressed }) => [styles.month, getPressedStyle(pressed)]}>
        <Text variant="headline">{label}</Text>
      </Pressable>
      <IconButton
        icon="chevronRight"
        accessibilityLabel="Keyingi oy"
        disabled={isCurrent}
        onPress={() => onChange(shiftLocalMonths(value, 1))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.xs,
  },
  month: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CONTROL_HEIGHT,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
});
