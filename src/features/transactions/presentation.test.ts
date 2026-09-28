import {
  getTransactionFieldMessage,
  getTransactionIcon,
  getTransactionSavedMessage,
  getTransactionSubtitle,
  getTransactionTitle,
  getTransactionTone,
  groupTransactionsByDay,
  parseTransactionType,
} from './presentation';
import type { TransactionListItem } from './types';

describe('transaction presentation', () => {
  it('parses the type route param safely', () => {
    expect(parseTransactionType('income')).toBe('income');
    expect(parseTransactionType('transfer')).toBe('transfer');
    expect(parseTransactionType('refund')).toBe('expense');
    expect(parseTransactionType(undefined)).toBe('expense');
  });

  it('uses field-specific messages for the same error code', () => {
    expect(getTransactionFieldMessage('accountId', 'required')).toBe('Hisobni tanlang');
    expect(getTransactionFieldMessage('toAccountId', 'required')).toBe(
      'Qaysi hisobga oʻtkazilishini tanlang',
    );
    expect(getTransactionFieldMessage('toAccountId', 'archived')).toBe(
      'Bu hisob arxivlangan — boshqasini tanlang',
    );
    expect(getTransactionFieldMessage('amount', 'not_positive')).toBe('Summa 0 dan katta boʻlsin');
    expect(getTransactionFieldMessage('categoryIds', 'required')).toBe(
      'Kamida bitta kategoriya tanlang',
    );
  });

  it('never shows raw codes', () => {
    expect(getTransactionFieldMessage('note', 'required')).toBeUndefined();
    expect(getTransactionFieldMessage('amount', 'toString')).toBeUndefined();
    expect(getTransactionFieldMessage('amount', undefined)).toBeUndefined();
  });

  describe('list rows', () => {
    const now = new Date(2026, 8, 28, 14).getTime();
    const base: TransactionListItem = {
      id: 't1',
      type: 'expense',
      amountMinor: 5_000_000,
      note: null,
      occurredAt: now,
      account: { id: 'uzum', name: 'Uzum' },
      toAccount: null,
      categories: [
        { id: 'food', name: 'Oziq-ovqat', icon: 'food' },
        { id: 'water', name: 'Suv', icon: 'water' },
      ],
    };

    it('joins categories and names the account', () => {
      expect(getTransactionTitle(base)).toBe('Oziq-ovqat + Suv');
      expect(getTransactionSubtitle({ ...base, note: 'tushlik' }, now)).toBe(
        'Bugun · Uzum · tushlik',
      );
      expect(getTransactionIcon(base)).toBe('food');
      expect(getTransactionTone('expense')).toBe('expense');
    });

    it('shows transfers as a route between accounts', () => {
      const transfer: TransactionListItem = {
        ...base,
        type: 'transfer',
        toAccount: { id: 'cash', name: 'Naqd' },
        categories: [],
        occurredAt: now - 24 * 60 * 60 * 1000,
      };
      expect(getTransactionTitle(transfer)).toBe('Uzum → Naqd');
      expect(getTransactionSubtitle(transfer, now)).toBe('Kecha');
      expect(getTransactionIcon(transfer)).toBe('transfer');
      expect(getTransactionTone('transfer')).toBe('neutral');
    });

    it('groups newest-first items under one header per local day', () => {
      const hour = 60 * 60 * 1000;
      const items = [
        { ...base, id: 'a', occurredAt: now },
        { ...base, id: 'b', occurredAt: now - 2 * hour },
        { ...base, id: 'c', occurredAt: now - 24 * hour },
        { ...base, id: 'd', occurredAt: new Date(2026, 8, 20, 9).getTime() },
      ];
      expect(
        groupTransactionsByDay(items, now).map((entry) =>
          entry.kind === 'day' ? entry.label : entry.item.id,
        ),
      ).toEqual(['Bugun', 'a', 'b', 'Kecha', 'c', '20-sentabr', 'd']);
      expect(groupTransactionsByDay([], now)).toEqual([]);
    });

    it('falls back for unknown icons and missing categories', () => {
      const orphan = { ...base, categories: [{ id: 'x', name: 'X', icon: 'removed-icon' }] };
      expect(getTransactionIcon(orphan)).toBe('other');
      expect(getTransactionTitle({ ...base, categories: [] })).toBe('Kategoriyasiz');
    });
  });

  it('confirms saving per type', () => {
    expect(getTransactionSavedMessage('expense')).toBe('Xarajat saqlandi');
    expect(getTransactionSavedMessage('transfer')).toBe('Oʻtkazma saqlandi');
  });
});
