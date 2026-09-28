import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { formatMoney } from '@/shared/lib/money';
import { Radius, Spacing } from '@/shared/theme/layout';
import { AmountText } from '@/shared/ui/AmountText';
import { Icon } from '@/shared/ui/Icon';
import { resolveIconName } from '@/shared/ui/icons';
import { Surface } from '@/shared/ui/Surface';
import { Text } from '@/shared/ui/Text';

import { formatShare, getBarRatio } from '../presentation';
import type { BreakdownKind, CategoryShare } from '../types';

export interface CategoryBreakdownProps {
  readonly kind: BreakdownKind;
  readonly shares: readonly CategoryShare[];
}

export function CategoryBreakdown({ kind, shares }: CategoryBreakdownProps) {
  const colors = useTheme();
  const total = shares.reduce((sum, share) => sum + share.amountMinor, 0);
  const max = shares[0]?.amountMinor ?? 0;
  const barColor = colors[kind];

  return (
    <Surface style={styles.card}>
      {shares.map((share) => {
        const percent = formatShare(share.amountMinor, total);
        return (
          <View
            key={share.id}
            style={styles.row}
            accessible
            accessibilityLabel={`${share.name}: ${formatMoney(share.amountMinor)}, ${percent}, ${share.count} ta yozuv`}>
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}>
              <Icon name={resolveIconName(share.icon)} size={20} color={kind} />
            </View>
            <View style={styles.body}>
              <View style={styles.line}>
                <Text variant="bodyStrong" numberOfLines={1} style={styles.name}>
                  {share.name}
                </Text>
                <AmountText amountMinor={share.amountMinor} variant="bodyStrong" />
              </View>
              <View style={styles.line}>
                <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        backgroundColor: barColor,
                        width: `${getBarRatio(share.amountMinor, max) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text variant="caption" color="textSecondary" tabularNumbers style={styles.percent}>
                  {percent}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: Spacing.xs },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { flex: 1 },
  track: { flex: 1, height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  percent: { minWidth: 36, textAlign: 'right' },
});
