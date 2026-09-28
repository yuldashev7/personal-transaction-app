import * as Haptics from 'expo-haptics';

/** Best-effort feedback: devices without haptics (or with it disabled) are silently ignored. */
export function hapticSuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

export function hapticWarning(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
}
