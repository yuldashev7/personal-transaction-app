import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/shared/theme/layout';
import { Chip } from '@/shared/ui/Chip';

import { getAccountIcon } from '../presentation';
import type { Account } from '../types';

export interface AccountPickerProps {
  readonly accounts: readonly Account[];
  readonly selectedId: string | null;
  readonly onChange: (id: string) => void;
  readonly disabledId?: string | null;
  readonly accessibilityLabel: string;
  readonly includeArchived?: boolean;
  readonly allOption?: { readonly label: string; readonly onSelect: () => void };
}

export function AccountPicker({
  accounts,
  selectedId,
  onChange,
  disabledId = null,
  accessibilityLabel,
  includeArchived = false,
  allOption,
}: AccountPickerProps) {
  const visible = accounts.filter(
    (account) => includeArchived || account.archivedAt === null || account.id === selectedId,
  );

  return (
    <View
      style={styles.chips}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}>
      {allOption && (
        <Chip
          label={allOption.label}
          selectionMode="radio"
          selected={selectedId === null}
          onPress={allOption.onSelect}
        />
      )}
      {visible.map((account) => (
        <Chip
          key={account.id}
          label={account.name}
          icon={getAccountIcon(account)}
          selectionMode="radio"
          selected={account.id === selectedId}
          disabled={account.id === disabledId}
          onPress={() => onChange(account.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
