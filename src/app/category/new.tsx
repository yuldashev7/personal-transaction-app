import { router, useLocalSearchParams } from 'expo-router';

import { getDatabase } from '@/database/client';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { parseCategoryKind } from '@/features/categories/presentation';
import { createCategory } from '@/features/categories/repository';
import { hapticSuccess } from '@/shared/lib/haptics';
import { FALLBACK_ICON } from '@/shared/ui/icons';
import { Screen } from '@/shared/ui/Screen';
import { SheetHeader } from '@/shared/ui/SheetHeader';
import { useToast } from '@/shared/ui/Toast';

export default function NewCategoryScreen() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const showToast = useToast();

  return (
    <Screen edges={['bottom']}>
      <SheetHeader title="Yangi kategoriya" onClose={() => router.back()} />
      <CategoryForm
        autoFocus
        kindEditable
        initialValues={{ name: '', kind: parseCategoryKind(kind), icon: FALLBACK_ICON }}
        submitLabel="Qoʻshish"
        onSubmit={(input) => createCategory(getDatabase(), input)}
        onSuccess={() => {
          hapticSuccess();
          showToast({ message: 'Kategoriya qoʻshildi' });
          router.back();
        }}
      />
    </Screen>
  );
}
