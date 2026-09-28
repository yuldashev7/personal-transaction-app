import { getDatabase } from '@/database/client';
import { useLiveQuery } from '@/database/live-query';
import { categories } from '@/database/schema';

import { getCategories, getCategoryById } from './queries';
import type { CategoryKind } from './types';

const CATEGORY_TABLES = [categories];

export function useCategories({
  kind,
  includeArchived = false,
}: { kind?: CategoryKind; includeArchived?: boolean } = {}) {
  const db = getDatabase();
  return useLiveQuery(() => getCategories(db, { kind, includeArchived }), CATEGORY_TABLES);
}

export function useCategory(id: string) {
  const db = getDatabase();
  return useLiveQuery(() => getCategoryById(db, id) ?? null, CATEGORY_TABLES);
}
