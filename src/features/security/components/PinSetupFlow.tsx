import { useState } from 'react';

import { hapticWarning } from '@/shared/lib/haptics';

import { PinPad } from './PinPad';

interface PinSetupFlowProps {
  readonly title?: string;
  /** Called with the confirmed PIN; resolves `false` when saving failed. */
  readonly onDone: (pin: string) => Promise<boolean>;
}

export function PinSetupFlow({ title = 'Yangi PIN kiriting', onDone }: PinSetupFlowProps) {
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorSignal, setErrorSignal] = useState(0);
  const [saving, setSaving] = useState(false);

  const fail = (text: string) => {
    hapticWarning();
    setErrorSignal((value) => value + 1);
    setMessage(text);
  };

  const complete = async (pin: string) => {
    if (firstPin === null) {
      setFirstPin(pin);
      setMessage(null);
      return;
    }
    if (pin !== firstPin) {
      setFirstPin(null);
      fail('PINʼlar mos kelmadi. Qaytadan kiriting.');
      return;
    }

    setSaving(true);
    const saved = await onDone(pin);
    setSaving(false);
    if (!saved) {
      setFirstPin(null);
      fail('PINʼni saqlab boʻlmadi. Qaytadan urinib koʻring.');
    }
  };

  return (
    <PinPad
      title={firstPin === null ? title : 'PINʼni takrorlang'}
      message={message}
      disabled={saving}
      errorSignal={errorSignal}
      onComplete={complete}
    />
  );
}
