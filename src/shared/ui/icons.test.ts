import { DEFAULT_CATEGORIES } from '@/database/seed';

import { FALLBACK_ICON, isIconName, resolveIconName } from './icons';

describe('icons', () => {
  it('has an icon for every default category', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(isIconName(category.icon)).toBe(true);
    }
  });

  it('falls back for unknown, empty or missing keys', () => {
    expect(resolveIconName('food')).toBe('food');
    expect(resolveIconName('does-not-exist')).toBe(FALLBACK_ICON);
    expect(resolveIconName('')).toBe(FALLBACK_ICON);
    expect(resolveIconName(null)).toBe(FALLBACK_ICON);
    expect(resolveIconName(undefined)).toBe(FALLBACK_ICON);
  });

  it('does not treat Object prototype keys as icons', () => {
    expect(isIconName('toString')).toBe(false);
    expect(resolveIconName('constructor')).toBe(FALLBACK_ICON);
  });
});
