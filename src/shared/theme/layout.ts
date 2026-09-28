/** 4pt grid. */
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Minimum touch target (Apple HIG 44pt, Material 48dp). */
export const MIN_TOUCH_SIZE = 48;

/** One height for buttons, text fields and steppers, so stacked controls line up. */
export const CONTROL_HEIGHT = 52;
