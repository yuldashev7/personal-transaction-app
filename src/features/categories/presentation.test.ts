import { DEFAULT_CATEGORIES } from '@/database/seed';

import { CATEGORY_ICON_OPTIONS, getCategoryFieldMessage, parseCategoryKind } from './presentation';

describe('category presentation', () => {
  it('parses the kind route param safely', () => {
    expect(parseCategoryKind('income')).toBe('income');
    expect(parseCategoryKind('expense')).toBe('expense');
    expect(parseCategoryKind('transfer')).toBe('expense');
    expect(parseCategoryKind(undefined)).toBe('expense');
  });

  it('uses field-specific messages for the same error code', () => {
    expect(getCategoryFieldMessage('name', 'required')).toBe('Nomini kiriting');
    expect(getCategoryFieldMessage('icon', 'required')).toBe('Belgini tanlang');
    expect(getCategoryFieldMessage('name', 'duplicate')).toBe('Bu nomli kategoriya allaqachon bor');
    expect(getCategoryFieldMessage('name', 'constructor')).toBeUndefined();
    expect(getCategoryFieldMessage('name', undefined)).toBeUndefined();
  });

  it('offers each icon once, including every default category icon', () => {
    const icons = CATEGORY_ICON_OPTIONS.map((option) => option.icon);
    expect(new Set(icons).size).toBe(icons.length);
    for (const category of DEFAULT_CATEGORIES) {
      expect(icons).toContain(category.icon);
    }
  });
});
