import { Platform, type PressableAndroidRippleConfig } from 'react-native';

/** iOS dims on press; Android uses the native ripple instead. */
export function getPressedStyle(pressed: boolean) {
  return pressed && Platform.OS === 'ios' ? PRESSED_IOS : null;
}

export function getRipple(color: string, borderless = false): PressableAndroidRippleConfig {
  return { color, borderless, foreground: true };
}

const PRESSED_IOS = { opacity: 0.6 } as const;
