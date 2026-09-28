const light = {
  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEEF2',
  border: '#DFE2E7',
  text: '#101216',
  textSecondary: '#596070',
  textTertiary: '#8A909C',
  primary: '#2F55D4',
  primaryMuted: '#E4EAFB',
  /** Translucent blue behind tinted buttons; works on both light and dark surfaces. */
  tint: '#0080E91A',
  onPrimary: '#FFFFFF',
  income: '#12804A',
  expense: '#C93636',
  danger: '#C93636',
  dangerMuted: '#FBE8E8',
  onDanger: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.4)',
} as const;

export type ThemeColors = { readonly [Key in keyof typeof light]: string };
export type ColorToken = keyof ThemeColors;

const dark: ThemeColors = {
  background: '#0B0C0F',
  surface: '#17191D',
  surfaceMuted: '#22252B',
  border: '#2C3037',
  text: '#F2F3F5',
  textSecondary: '#A5ABB6',
  textTertiary: '#6F7581',
  primary: '#8098FF',
  primaryMuted: '#1E2748',
  tint: '#0080E91A',
  onPrimary: '#0B1024',
  income: '#45D08E',
  expense: '#FF7373',
  danger: '#FF7373',
  dangerMuted: '#3A1E20',
  onDanger: '#1F0A0B',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

export const Colors = { light, dark } as const satisfies Record<string, ThemeColors>;

export type ColorScheme = keyof typeof Colors;
