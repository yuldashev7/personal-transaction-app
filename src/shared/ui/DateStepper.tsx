import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { formatDayLabel, isSameLocalDay, shiftLocalDays } from '@/shared/lib/date';
import { CONTROL_HEIGHT, Radius, Spacing } from '@/shared/theme/layout';

import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { getPressedStyle, getRipple } from './pressable-feedback';
import { Text } from './Text';

export interface DateStepperProps {
  readonly label: string;
  /** Unix epoch milliseconds; stepping keeps the time of day. */
  readonly value: number;
  readonly onChange: (value: number) => void;
  /** Latest selectable moment, usually "now". Future days are not offered. */
  readonly max: number;
}

/** Day-by-day date selection without a native picker; tapping the date returns to today. */
export function DateStepper({ label, value, onChange, max }: DateStepperProps) {
  const colors = useTheme();
  const isToday = isSameLocalDay(value, max);
  const dayLabel = formatDayLabel(value, max);

  return (
    <View style={styles.container}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel="Oldingi kun"
          onPress={() => onChange(shiftLocalDays(value, -1))}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${dayLabel}`}
          accessibilityHint={isToday ? undefined : 'Bugunga qaytaradi'}
          disabled={isToday}
          onPress={() => onChange(max)}
          android_ripple={getRipple(colors.border)}
          style={({ pressed }) => [styles.day, getPressedStyle(pressed)]}>
          <Icon name="calendar" size={18} color="textSecondary" />
          <Text variant="bodyStrong">{dayLabel}</Text>
        </Pressable>
        <IconButton
          icon="chevronRight"
          accessibilityLabel="Keyingi kun"
          disabled={isToday}
          onPress={() => {
            const next = shiftLocalDays(value, 1);
            onChange(next > max ? max : next);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.xs,
  },
  day: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: CONTROL_HEIGHT,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
});
