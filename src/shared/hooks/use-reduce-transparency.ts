import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** iOS "Reduce Transparency" setting; always `false` on Android. */
export function useReduceTransparency(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((value) => {
        if (active) setEnabled(value);
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setEnabled,
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}
