import { resolveIconName } from '@/shared/ui/icons';
import { ListRow } from '@/shared/ui/ListRow';
import { Surface } from '@/shared/ui/Surface';

import type { Category } from '../types';

export interface CategoryListProps {
  readonly categories: readonly Category[];
  readonly onPressCategory: (category: Category) => void;
}

export function CategoryList({ categories, onPressCategory }: CategoryListProps) {
  return (
    <Surface>
      {categories.map((category) => {
        const archived = category.archivedAt !== null;
        return (
          <ListRow
            key={category.id}
            icon={resolveIconName(category.icon)}
            iconColor={archived ? 'textTertiary' : 'primary'}
            title={category.name}
            subtitle={archived ? 'arxivlangan' : undefined}
            showChevron
            onPress={() => onPressCategory(category)}
          />
        );
      })}
    </Surface>
  );
}
