import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AccountPicker } from '@/features/accounts/components/AccountPicker';
import { useAccounts } from '@/features/accounts/hooks';
import { useCategories } from '@/features/categories/hooks';
import type { CategoryKind } from '@/features/categories/types';
import { formatMoney } from '@/shared/lib/money';
import { Spacing } from '@/shared/theme/layout';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { DateStepper } from '@/shared/ui/DateStepper';
import { resolveIconName } from '@/shared/ui/icons';
import { SearchField } from '@/shared/ui/SearchField';
import { Text } from '@/shared/ui/Text';

import {
  countPanelFilters,
  createFilterState,
  getFilterRange,
  hasActiveFilters,
  PERIOD_OPTIONS,
  type TransactionFilterState,
} from '../filters';
import { TRANSACTION_TYPE_OPTIONS } from '../presentation';
import type { TransactionTotals, TransactionType } from '../types';

export interface TransactionFiltersProps {
  readonly value: TransactionFilterState;
  readonly onChange: (value: TransactionFilterState) => void;
  readonly totals: TransactionTotals | null;
  readonly now: number;
}

export function TransactionFilters({ value, onChange, totals, now }: TransactionFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const panelCount = countPanelFilters(value);
  const active = hasActiveFilters(value);
  const rangeError = getFilterRange(value, now).error;

  const update = (changes: Partial<TransactionFilterState>) => onChange({ ...value, ...changes });

  const changeType = (type: TransactionType | null) =>
    update(type === value.type ? {} : { type, categoryIds: [] });

  return (
    <View style={styles.container}>
      <SearchField
        value={value.search}
        onChangeText={(search) => update({ search })}
        placeholder="Izoh, kategoriya, hisob yoki summa"
        accessibilityLabel="Yozuvlarni qidirish"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.bleed}
        contentContainerStyle={styles.periods}
        accessibilityRole="radiogroup"
        accessibilityLabel="Davr">
        {PERIOD_OPTIONS.map((option) => (
          <Chip
            key={option.preset}
            label={option.label}
            selectionMode="radio"
            selected={value.period === option.preset}
            onPress={() => update({ period: option.preset })}
          />
        ))}
      </ScrollView>

      {value.period === 'custom' && (
        <View style={styles.group}>
          <DateStepper
            label="Qaysi kundan"
            value={value.from}
            max={now}
            onChange={(from) => update({ from })}
          />
          <DateStepper
            label="Qaysi kungacha"
            value={value.to}
            max={now}
            onChange={(to) => update({ to })}
          />
          {rangeError && (
            <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
              Boshlanish sanasi tugash sanasidan keyin boʻlmasin
            </Text>
          )}
        </View>
      )}

      <View style={styles.toolbar}>
        <Button
          label={panelCount > 0 ? `Filtrlar (${panelCount})` : 'Filtrlar'}
          icon="filter"
          variant="ghost"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((current) => !current)}
        />
        {active && (
          <Button
            label="Tozalash"
            variant="ghost"
            onPress={() => {
              onChange(createFilterState(now));
              setExpanded(false);
            }}
          />
        )}
      </View>

      {expanded && (
        <View style={styles.panel}>
          <Field label="Turi">
            <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Turi">
              <Chip
                label="Hammasi"
                selectionMode="radio"
                selected={value.type === null}
                onPress={() => changeType(null)}
              />
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
                <Chip
                  key={option.type}
                  label={option.label}
                  icon={option.icon}
                  selectionMode="radio"
                  selected={value.type === option.type}
                  onPress={() => changeType(option.type)}
                />
              ))}
            </View>
          </Field>

          <Field label="Hisob">
            <AccountFilter
              selectedId={value.accountId}
              onChange={(accountId) => update({ accountId })}
            />
          </Field>

          {value.type !== null && value.type !== 'transfer' && (
            <Field label="Kategoriyalar">
              <CategoryFilter
                kind={value.type}
                selectedIds={value.categoryIds}
                onChange={(categoryIds) => update({ categoryIds })}
              />
            </Field>
          )}
        </View>
      )}

      {active && totals && <FilterSummary totals={totals} />}
    </View>
  );
}

function AccountFilter({
  selectedId,
  onChange,
}: {
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  const result = useAccounts({ includeArchived: true });
  if (!result.ok) return <Text color="danger">Hisoblarni yuklab boʻlmadi.</Text>;
  return (
    <AccountPicker
      accessibilityLabel="Hisob"
      accounts={result.value}
      includeArchived
      selectedId={selectedId}
      onChange={onChange}
      allOption={{ label: 'Hammasi', onSelect: () => onChange(null) }}
    />
  );
}

function CategoryFilter({
  kind,
  selectedIds,
  onChange,
}: {
  kind: CategoryKind;
  selectedIds: readonly string[];
  onChange: (ids: string[]) => void;
}) {
  const result = useCategories({ kind, includeArchived: true });
  if (!result.ok) return <Text color="danger">Kategoriyalarni yuklab boʻlmadi.</Text>;

  const toggle = (id: string) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selected) => selected !== id)
        : [...selectedIds, id],
    );

  return (
    <View style={styles.chips}>
      {result.value.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          icon={resolveIconName(category.icon)}
          selected={selectedIds.includes(category.id)}
          onPress={() => toggle(category.id)}
        />
      ))}
    </View>
  );
}

function FilterSummary({ totals }: { totals: TransactionTotals }) {
  const parts = [`${totals.count} ta yozuv`];
  if (totals.incomeMinor > 0)
    parts.push(formatMoney(totals.incomeMinor, undefined, { signDisplay: 'always' }));
  if (totals.expenseMinor > 0) parts.push(formatMoney(-totals.expenseMinor));
  return (
    <Text variant="label" color="textSecondary" tabularNumbers accessibilityLiveRegion="polite">
      {parts.join(' · ')}
    </Text>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  bleed: { marginHorizontal: -Spacing.lg },
  periods: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: -Spacing.sm },
  panel: { gap: Spacing.lg },
  group: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
