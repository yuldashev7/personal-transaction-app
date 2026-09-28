import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/shared/hooks/use-theme';
import { Spacing } from '@/shared/theme/layout';
import { Icon } from '@/shared/ui/Icon';
import type { IconName } from '@/shared/ui/icons';
import { getPressedStyle, getRipple } from '@/shared/ui/pressable-feedback';
import { Text } from '@/shared/ui/Text';

import { PIN_LENGTH } from '../pin';

const KEY_SIZE = 76;
const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

export interface PinPadProps {
  readonly title: string;
  /** Error or hint under the dots; a fixed-height line so the keypad never jumps. */
  readonly message?: string | null;
  readonly disabled?: boolean;
  /** Increment to shake the dots (wrong PIN). */
  readonly errorSignal?: number;
  readonly onComplete: (pin: string) => void;
  /** Bottom-left key, e.g. Face ID. */
  readonly extraKey?: {
    readonly icon: IconName;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
  };
}

export function PinPad({
  title,
  message,
  disabled = false,
  errorSignal = 0,
  onComplete,
  extraKey,
}: PinPadProps) {
  const colors = useTheme();
  const [pin, setPin] = useState('');
  const shake = useSharedValue(0);

  useEffect(() => {
    if (errorSignal === 0) return;
    shake.set(
      withSequence(
        withTiming(-12, { duration: 50 }),
        withTiming(12, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  }, [errorSignal, shake]);

  const dotsStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  const press = (digit: string) => {
    if (disabled || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    if (next.length === PIN_LENGTH) {
      setPin('');
      onComplete(next);
    } else {
      setPin(next);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headline" align="center" accessibilityRole="header">
          {title}
        </Text>
        <Animated.View
          style={[styles.dots, dotsStyle]}
          accessible
          accessibilityLabel={`${PIN_LENGTH} tadan ${pin.length} ta raqam kiritildi`}>
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { borderColor: colors.primary },
                index < pin.length && { backgroundColor: colors.primary },
              ]}
            />
          ))}
        </Animated.View>
        <Text
          variant="caption"
          color="danger"
          align="center"
          numberOfLines={2}
          style={styles.message}
          accessibilityLiveRegion="polite">
          {message ?? ''}
        </Text>
      </View>

      <View style={styles.keypad}>
        {DIGIT_ROWS.map((row) => (
          <View key={row.join('')} style={styles.row}>
            {row.map((digit) => (
              <DigitKey key={digit} digit={digit} disabled={disabled} onPress={press} />
            ))}
          </View>
        ))}
        <View style={styles.row}>
          {extraKey ? (
            <IconKey
              icon={extraKey.icon}
              accessibilityLabel={extraKey.accessibilityLabel}
              disabled={disabled}
              onPress={extraKey.onPress}
            />
          ) : (
            <View style={styles.key} />
          )}
          <DigitKey digit="0" disabled={disabled} onPress={press} />
          {pin.length > 0 ? (
            <IconKey
              icon="backspace"
              accessibilityLabel="Oxirgi raqamni oʻchirish"
              disabled={disabled}
              onPress={() => setPin((value) => value.slice(0, -1))}
            />
          ) : (
            <View style={styles.key} />
          )}
        </View>
      </View>
    </View>
  );
}

function DigitKey({
  digit,
  disabled,
  onPress,
}: {
  digit: string;
  disabled: boolean;
  onPress: (digit: string) => void;
}) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="keyboardkey"
      accessibilityLabel={digit}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onPress(digit)}
      android_ripple={getRipple(colors.border, true)}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: colors.surfaceMuted },
        disabled && styles.disabled,
        getPressedStyle(pressed),
      ]}>
      <Text variant="title" tabularNumbers maxFontSizeMultiplier={1.2}>
        {digit}
      </Text>
    </Pressable>
  );
}

function IconKey({
  icon,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  icon: IconName;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={getRipple(colors.border, true)}
      style={({ pressed }) => [styles.key, disabled && styles.disabled, getPressedStyle(pressed)]}>
      <Icon name={icon} size={28} color="text" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.xl },
  header: { alignItems: 'center', gap: Spacing.lg, alignSelf: 'stretch' },
  dots: { flexDirection: 'row', gap: Spacing.lg },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  message: { minHeight: 36 },
  keypad: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.xl },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: { opacity: 0.4 },
});
