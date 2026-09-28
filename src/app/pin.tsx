import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppLock } from '@/features/security/app-lock-context';
import { PinPad } from '@/features/security/components/PinPad';
import { PinSetupFlow } from '@/features/security/components/PinSetupFlow';
import { usePinVerification } from '@/features/security/hooks';
import { useTheme } from '@/shared/hooks/use-theme';
import { hapticSuccess } from '@/shared/lib/haptics';
import { Spacing } from '@/shared/theme/layout';
import { SheetHeader } from '@/shared/ui/SheetHeader';
import { Text } from '@/shared/ui/Text';
import { useToast } from '@/shared/ui/Toast';

type PinMode = 'create' | 'change' | 'disable';

const TITLES: Readonly<Record<PinMode, string>> = {
  create: 'Ilova paroli',
  change: 'PINʼni oʻzgartirish',
  disable: 'Parolni oʻchirish',
};

function parseMode(value: string | undefined): PinMode {
  return value === 'change' || value === 'disable' ? value : 'create';
}

export default function PinScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const appLock = useAppLock();
  const params = useLocalSearchParams<{ mode?: string }>();
  // Changing or removing requires the current PIN; without a PIN there is nothing to verify.
  const [mode] = useState<PinMode>(() => (appLock.enabled ? parseMode(params.mode) : 'create'));
  const [verified, setVerified] = useState(false);

  const verification = usePinVerification(appLock.checkPin, appLock.lockedUntil, async () => {
    if (mode !== 'disable') {
      setVerified(true);
      return;
    }
    if (await appLock.disableLock()) {
      hapticSuccess();
      showToast({ message: 'Ilova paroli oʻchirildi' });
      router.back();
    } else {
      showToast({ message: 'Amalni bajarib boʻlmadi. Qaytadan urinib koʻring.', tone: 'error' });
    }
  });

  const savePin = async (pin: string) => {
    const saved = await appLock.savePin(pin);
    if (saved) {
      hapticSuccess();
      showToast({ message: mode === 'create' ? 'Ilova paroli oʻrnatildi' : 'PIN oʻzgartirildi' });
      router.back();
    }
    return saved;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + Spacing.lg },
      ]}>
      <SheetHeader title={TITLES[mode]} onClose={() => router.back()} />

      <View style={styles.body}>
        {mode === 'create' || verified ? (
          <PinSetupFlow
            title={mode === 'create' ? 'PIN oʻylab toping' : 'Yangi PIN kiriting'}
            onDone={savePin}
          />
        ) : (
          <PinPad
            title="Joriy PINʼni kiriting"
            message={verification.message}
            disabled={verification.disabled}
            errorSignal={verification.errorSignal}
            onComplete={(pin) => void verification.submit(pin)}
          />
        )}
      </View>

      {mode === 'create' && (
        <Text variant="caption" color="textSecondary" align="center">
          4 raqamli PIN. Unutsangiz, telefon paroli yoki Face ID bilan tasdiqlab yangisini qoʻyasiz.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  body: { flex: 1, justifyContent: 'center' },
});
