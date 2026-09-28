import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

interface PlatformSymbol {
  readonly ios: SFSymbol;
  readonly android: AndroidSymbol;
}

/**
 * Icon keys stored in the database (`categories.icon`, `accounts.icon`) and used by the UI.
 * Keys are stable: renaming one requires a data migration.
 */
export const ICONS = {
  // Categories
  food: { ios: 'fork.knife', android: 'restaurant' },
  water: { ios: 'drop.fill', android: 'water_drop' },
  taxi: { ios: 'car.fill', android: 'local_taxi' },
  metro: { ios: 'tram.fill', android: 'subway' },
  shopping: { ios: 'bag.fill', android: 'shopping_bag' },
  coffee: { ios: 'cup.and.saucer.fill', android: 'coffee' },
  pharmacy: { ios: 'cross.case.fill', android: 'local_pharmacy' },
  home: { ios: 'house.fill', android: 'home' },
  entertainment: { ios: 'gamecontroller.fill', android: 'sports_esports' },
  salary: { ios: 'banknote.fill', android: 'payments' },
  freelance: { ios: 'laptopcomputer', android: 'laptop_mac' },
  gift: { ios: 'gift.fill', android: 'redeem' },
  other: { ios: 'square.grid.2x2.fill', android: 'category' },
  bus: { ios: 'bus.fill', android: 'directions_bus' },
  fuel: { ios: 'fuelpump.fill', android: 'local_gas_station' },
  phone: { ios: 'iphone', android: 'smartphone' },
  internet: { ios: 'wifi', android: 'wifi' },
  utilities: { ios: 'bolt.fill', android: 'bolt' },
  rent: { ios: 'building.2.fill', android: 'apartment' },
  clothes: { ios: 'tshirt.fill', android: 'checkroom' },
  beauty: { ios: 'scissors', android: 'content_cut' },
  health: { ios: 'heart.fill', android: 'favorite' },
  sport: { ios: 'figure.run', android: 'fitness_center' },
  education: { ios: 'book.fill', android: 'school' },
  travel: { ios: 'airplane', android: 'flight' },
  kids: { ios: 'figure.and.child.holdinghands', android: 'child_care' },
  pets: { ios: 'pawprint.fill', android: 'pets' },
  repair: { ios: 'wrench.and.screwdriver.fill', android: 'build' },
  interest: { ios: 'percent', android: 'percent' },
  drinks: { ios: 'takeoutbag.and.cup.and.straw.fill', android: 'local_drink' },
  minibus: { ios: 'car.side.fill', android: 'airport_shuttle' },
  supermarket: { ios: 'cart.fill', android: 'shopping_cart' },
  computer: { ios: 'desktopcomputer', android: 'computer' },
  fitness: { ios: 'dumbbell.fill', android: 'fitness_center' },
  // Accounts
  card: { ios: 'creditcard.fill', android: 'credit_card' },
  cash: { ios: 'banknote', android: 'payments' },
  wallet: { ios: 'wallet.bifold.fill', android: 'account_balance_wallet' },
  // Actions & UI
  add: { ios: 'plus', android: 'add' },
  close: { ios: 'xmark', android: 'close' },
  check: { ios: 'checkmark', android: 'check' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  edit: { ios: 'pencil', android: 'edit' },
  delete: { ios: 'trash', android: 'delete' },
  undo: { ios: 'arrow.uturn.backward', android: 'undo' },
  income: { ios: 'arrow.down.left', android: 'south_west' },
  expense: { ios: 'arrow.up.right', android: 'north_east' },
  arrowUp: { ios: 'arrow.up', android: 'arrow_upward' },
  arrowDown: { ios: 'arrow.down', android: 'arrow_downward' },
  transfer: { ios: 'arrow.left.arrow.right', android: 'swap_horiz' },
  transactions: { ios: 'list.bullet.rectangle', android: 'receipt_long' },
  statistics: { ios: 'chart.bar.fill', android: 'bar_chart' },
  settings: { ios: 'gearshape', android: 'settings' },
  search: { ios: 'magnifyingglass', android: 'search' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'filter_list' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning' },
  lock: { ios: 'lock.fill', android: 'lock' },
  backspace: { ios: 'delete.left', android: 'backspace' },
  faceId: { ios: 'faceid', android: 'face' },
  fingerprint: { ios: 'touchid', android: 'fingerprint' },
} as const satisfies Record<string, PlatformSymbol>;

export type IconName = keyof typeof ICONS;

export const FALLBACK_ICON: IconName = 'other';

export function isIconName(value: string): value is IconName {
  return Object.hasOwn(ICONS, value);
}

/** Resolves a stored icon key; unknown or missing keys fall back instead of rendering nothing. */
export function resolveIconName(value: string | null | undefined): IconName {
  return value && isIconName(value) ? value : FALLBACK_ICON;
}
