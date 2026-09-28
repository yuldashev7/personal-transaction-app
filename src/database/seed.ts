import { createId } from '@/shared/lib/id';

import type { Database } from './client';
import { categories } from './schema';

type CategoryKind = (typeof categories.$inferInsert)['kind'];

interface DefaultCategory {
  readonly systemKey: string;
  readonly kind: CategoryKind;
  readonly name: string;
  readonly icon: string;
}

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { systemKey: 'food', kind: 'expense', name: 'Oziq-ovqat', icon: 'food' },
  { systemKey: 'drinks', kind: 'expense', name: 'Ichimlik', icon: 'drinks' },
  { systemKey: 'taxi', kind: 'expense', name: 'Taksi', icon: 'taxi' },
  { systemKey: 'bus', kind: 'expense', name: 'Avtobus', icon: 'bus' },
  { systemKey: 'minibus', kind: 'expense', name: 'Marshrutka', icon: 'minibus' },
  { systemKey: 'metro', kind: 'expense', name: 'Metro', icon: 'metro' },
  { systemKey: 'korzinka', kind: 'expense', name: 'Korzinka', icon: 'supermarket' },
  { systemKey: 'olma', kind: 'expense', name: 'Olma', icon: 'supermarket' },
  { systemKey: 'havas', kind: 'expense', name: 'Havas', icon: 'supermarket' },
  { systemKey: 'shopping', kind: 'expense', name: 'Xaridlar', icon: 'shopping' },
  { systemKey: 'pharmacy', kind: 'expense', name: 'Dorixona', icon: 'pharmacy' },
  { systemKey: 'computer_club', kind: 'expense', name: 'Kompyuter xona', icon: 'computer' },
  { systemKey: 'playstation', kind: 'expense', name: 'PlayStation', icon: 'entertainment' },
  { systemKey: 'fitness', kind: 'expense', name: 'Fitnes', icon: 'fitness' },
  { systemKey: 'expense_other', kind: 'expense', name: 'Boshqa', icon: 'other' },
  { systemKey: 'salary', kind: 'income', name: 'Maosh', icon: 'salary' },
  { systemKey: 'freelance', kind: 'income', name: 'Frilans', icon: 'freelance' },
  { systemKey: 'gift', kind: 'income', name: 'Sovgʻa', icon: 'gift' },
  { systemKey: 'income_other', kind: 'income', name: 'Boshqa', icon: 'other' },
];

export function seedDefaultCategories(db: Database, now: number = Date.now()): void {
  db.insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((category, index) => ({
        id: createId(),
        kind: category.kind,
        name: category.name,
        icon: category.icon,
        systemKey: category.systemKey,
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing()
    .run();
}
