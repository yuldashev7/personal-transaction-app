import { useEffect, useState } from 'react';

import { hapticWarning } from '@/shared/lib/haptics';

import { getPinCheckMessage, type PinCheck } from './pin';

/**
 * State for a "enter your current PIN" pad: wrong-PIN messages, the shake signal and the
 * lockout countdown (the lockout itself is persisted by `checkPin`).
 */
export function usePinVerification(
  checkPin: (pin: string) => Promise<PinCheck>,
  initialLockedUntil: number,
  onSuccess: () => void,
) {
  const [lockedUntil, setLockedUntil] = useState(initialLockedUntil);
  const [now, setNow] = useState(Date.now);
  const [error, setError] = useState<string | null>(null);
  const [errorSignal, setErrorSignal] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const remainingMs = Math.max(0, lockedUntil - now);

  const submit = async (pin: string) => {
    setBusy(true);
    const result = await checkPin(pin);
    setBusy(false);

    if (result.kind === 'ok') {
      setError(null);
      onSuccess();
      return;
    }

    hapticWarning();
    setErrorSignal((value) => value + 1);
    if (result.kind === 'locked_out') {
      const current = Date.now();
      setNow(current);
      setLockedUntil(current + result.remainingMs);
      setError(null);
    } else {
      setError(getPinCheckMessage(result));
    }
  };

  return {
    message: remainingMs > 0 ? getPinCheckMessage({ kind: 'locked_out', remainingMs }) : error,
    disabled: busy || remainingMs > 0,
    errorSignal,
    submit,
  };
}
