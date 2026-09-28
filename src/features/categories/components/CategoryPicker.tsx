import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/shared/theme/layout';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { resolveIconName } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/Text';

import { useCategories } from '../hooks';
import type { CategoryKind } from '../types';

export interface CategoryPickerProps {
  readonly kind: CategoryKind;
  readonly selectedIds: readonly string[];
  readonly onChange: (ids: string[]) => void;
  /** Deleted categories an edited transaction still uses; shown only while selected. */
  readonly retainedCategories?: readonly CategoryChip[];
}

interface CategoryChip {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

/**
 * Multi-select category chips. Archived and deleted categories are hidden unless already selected
 * (editing an old transaction keeps them); they are never offered anew.
 */
export function CategoryPicker({
  kind,
  selectedIds,
  onChange,
  retainedCategories = [],
}: CategoryPickerProps) {
  const result = useCategories({ kind, includeArchived: true });

  if (!result.ok) {
    return <Text color="danger">Kategoriyalarni yuklab boʻlmadi.</Text>;
  }

  const available: CategoryChip[] = result.value.filter(
    (category) => category.archivedAt === null || selectedIds.includes(category.id),
  );
  const retained = retainedCategories.filter(
    (category) =>
      selectedIds.includes(category.id) && !available.some((item) => item.id === category.id),
  );
  const visible = [...retained, ...available];

  const toggle = (id: string) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selected) => selected !== id)
        : [...selectedIds, id],
    );

  return (
    <View style={styles.chips}>
      {visible.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          icon={resolveIconName(category.icon)}
          selected={selectedIds.includes(category.id)}
          onPress={() => toggle(category.id)}
        />
      ))}
      <Button
        label="Yangi"
        icon="add"
        variant="ghost"
        onPress={() => router.push({ pathname: '/category/new', params: { kind } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
});
