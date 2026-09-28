import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { getDatabase } from '@/database/client';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { useCategory } from '@/features/categories/hooks';
import { getCategoryKindLabel } from '@/features/categories/presentation';
import {
  deleteCategory,
  setCategoryArchived,
  updateCategory,
} from '@/features/categories/repository';
import type { Category } from '@/features/categories/types';
import { getErrorMessage } from '@/shared/lib/errors';
import { hapticSuccess } from '@/shared/lib/haptics';
import { Spacing } from '@/shared/theme/layout';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';
import { useToast } from '@/shared/ui/Toast';

export default function CategoryScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const result = useCategory(id);
  const [leaving, setLeaving] = useState(false);

  // Keeps the screen blank while it animates out after deletion instead of flashing "not found".
  if (leaving) return <Screen />;

  if (!result.ok) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState icon="warning" title="Ochib boʻlmadi" message={getErrorMessage(result.error)} />
      </Screen>
    );
  }

  if (!result.value) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState icon="warning" title="Kategoriya topilmadi" />
      </Screen>
    );
  }

  return <CategoryDetails category={result.value} onDeleted={() => setLeaving(true)} />;
}

function CategoryDetails({ category, onDeleted }: { category: Category; onDeleted: () => void }) {
  const showToast = useToast();
  const archived = category.archivedAt !== null;

  const toggleArchived = () => {
    const result = setCategoryArchived(getDatabase(), category.id, !archived);
    if (!result.ok) {
      Alert.alert('Xatolik', getErrorMessage(result.error));
      return;
    }
    hapticSuccess();
    showToast({ message: archived ? 'Kategoriya qaytarildi' : 'Kategoriya arxivlandi' });
  };

  const remove = () => {
    const result = deleteCategory(getDatabase(), category.id);
    if (!result.ok) {
      Alert.alert('Xatolik', getErrorMessage(result.error));
      return;
    }
    hapticSuccess();
    onDeleted();
    showToast({ message: 'Kategoriya oʻchirildi' });
    router.back();
  };

  const confirmDelete = () =>
    Alert.alert(
      'Kategoriyani oʻchirasizmi?',
      `“${category.name}” yangi yozuvlarda tanlanmaydi. Oʻtgan yozuvlarda nomi saqlanib qoladi.`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Oʻchirish', style: 'destructive', onPress: remove },
      ],
    );

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: category.name }} />

      <Text variant="caption" color="textSecondary">
        Turi: {getCategoryKindLabel(category.kind)}
        {archived ? ' · arxivlangan' : ''}
      </Text>

      <CategoryForm
        kindEditable={false}
        initialValues={{ name: category.name, kind: category.kind, icon: category.icon }}
        submitLabel="Saqlash"
        onSubmit={(input) =>
          updateCategory(getDatabase(), category.id, { name: input.name, icon: input.icon })
        }
        onSuccess={() => {
          hapticSuccess();
          showToast({ message: 'Saqlandi' });
          router.back();
        }}
      />

      <View style={styles.actions}>
        <Button
          label={archived ? 'Arxivdan chiqarish' : 'Arxivlash'}
          variant="tinted"
          fullWidth
          onPress={toggleArchived}
        />
        <Button
          label="Oʻchirish"
          variant="destructive"
          icon="delete"
          fullWidth
          onPress={confirmDelete}
        />
        {!archived && (
          <Text variant="caption" color="textSecondary" align="center">
            Arxivlangan kategoriya yangi yozuvlarda koʻrinmaydi, lekin istalgan vaqt qaytarish
            mumkin.
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: Spacing.md },
});
