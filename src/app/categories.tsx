import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePullToRefresh } from '@/database/live-query';
import { CategoryList } from '@/features/categories/components/CategoryList';
import { useCategories } from '@/features/categories/hooks';
import { CATEGORY_KIND_OPTIONS } from '@/features/categories/presentation';
import type { Category, CategoryKind } from '@/features/categories/types';
import { getErrorMessage } from '@/shared/lib/errors';
import { Spacing } from '@/shared/theme/layout';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';

const openCategory = (category: Category) =>
  router.push({ pathname: '/category/[id]', params: { id: category.id } });

export default function CategoriesScreen() {
  const [kind, setKind] = useState<CategoryKind>('expense');
  const result = useCategories({ kind, includeArchived: true });
  const refresh = usePullToRefresh();

  return (
    <Screen edges={['bottom']} refresh={refresh}>
      <View style={styles.tabs} accessibilityRole="radiogroup">
        {CATEGORY_KIND_OPTIONS.map((option) => (
          <Chip
            key={option.kind}
            label={option.label}
            selectionMode="radio"
            selected={kind === option.kind}
            onPress={() => setKind(option.kind)}
          />
        ))}
      </View>

      {!result.ok ? (
        <EmptyState icon="warning" title="Ochib boʻlmadi" message={getErrorMessage(result.error)} />
      ) : (
        <CategorySections categories={result.value} />
      )}

      <Button
        label="Kategoriya qoʻshish"
        icon="add"
        variant="tinted"
        fullWidth
        onPress={() => router.push({ pathname: '/category/new', params: { kind } })}
      />
    </Screen>
  );
}

function CategorySections({ categories }: { categories: readonly Category[] }) {
  const active = categories.filter((category) => category.archivedAt === null);
  const archived = categories.filter((category) => category.archivedAt !== null);

  return (
    <>
      {active.length > 0 ? (
        <CategoryList categories={active} onPressCategory={openCategory} />
      ) : (
        <EmptyState icon="other" title="Faol kategoriya yoʻq" />
      )}
      {archived.length > 0 && (
        <>
          <Text variant="headline" accessibilityRole="header">
            Arxivlangan
          </Text>
          <CategoryList categories={archived} onPressCategory={openCategory} />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: Spacing.sm },
});
