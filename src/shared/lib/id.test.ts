import { createId } from './id';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('createId', () => {
  it('returns unique UUID v4 strings', () => {
    const ids = Array.from({ length: 100 }, createId);
    for (const id of ids) {
      expect(id).toMatch(UUID_V4);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});
