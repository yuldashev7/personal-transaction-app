import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { formatMoney } from '@/shared/lib/money';
import { Radius, Spacing } from '@/shared/theme/layout';
import { AmountText } from '@/shared/ui/AmountText';
import { Icon } from '@/shared/ui/Icon';
import { getPressedStyle, getRipple } from '@/shared/ui/pressable-feedback';
import { Text } from '@/shared/ui/Text';

import { formatCardNumber, getAccountIcon } from '../presentation';
import type { AccountWithBalance } from '../types';

export interface AccountStripProps {
  readonly accounts: readonly AccountWithBalance[];
  readonly onPressAccount: (account: AccountWithBalance) => void;
}

export function AccountStrip({ accounts, onPressAccount }: AccountStripProps) {
  const colors = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}>
      {accounts.map((account) => (
        <Pressable
          key={account.id}
          accessibilityRole="button"
          accessibilityLabel={`${account.name}, balans ${formatMoney(account.balanceMinor, account.currencyCode)}`}
          onPress={() => onPressAccount(account)}
          android_ripple={getRipple(colors.border)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            getPressedStyle(pressed),
          ]}>
          <Icon name={getAccountIcon(account)} size={20} color="primary" />
          <Text variant="label" color="textSecondary" numberOfLines={1}>
            {account.name}
          </Text>
          {account.cardNumber !== null && (
            <Text variant="label" color="textSecondary" numberOfLines={1}>
              {formatCardNumber(account.cardNumber)}
            </Text>
          )}
          <AmountText
            amountMinor={account.balanceMinor}
            currency={account.currencyCode}
            variant="bodyStrong"
            adjustsFontSizeToFit
            style={styles.amount}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -Spacing.lg, flexGrow: 0 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  card: {
    // Fits a 16-digit card number ("8600 1234 5678 9012") on one line at the label size.
    width: 172,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  // Cards stretch to the tallest one; keeps balances aligned when only some show a card number.
  amount: { marginTop: 'auto' },
});
