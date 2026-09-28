import { useEffect, useEffectEvent, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/hooks/use-theme';
import { Spacing } from '@/shared/theme/layout';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

import { useAppLock } from '../app-lock-context';
import { usePinVerification } from '../hooks';
import { getBiometricMethodName } from '../presentation';
import { PinPad } from './PinPad';
import { PinSetupFlow } from './PinSetupFlow';

interface LockScreenProps {
  /** `false` renders the privacy cover shown in the app switcher. */
  readonly interactive: boolean;
  readonly onUnlock: () => void;
}

type Stage = 'pin' | 'reset';

export function LockScreen({ interactive, onUnlock }: LockScreenProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const appLock = useAppLock();
  const [stage, setStage] = useState<Stage>('pin');
  const [notice, setNotice] = useState<string | null>(null);

  const biometric = appLock.biometricEnabled ? appLock.biometricMethod : null;
  const verification = usePinVerification(appLock.checkPin, appLock.lockedUntil, onUnlock);

  const unlockWithBiometrics = async () => {
    if (!biometric) return;
    const outcome = await appLock.authenticate('Ilovani ochish', { biometricOnly: true });
    if (outcome === 'success') onUnlock();
  };

  const recoverPin = async () => {
    setNotice(null);
    const outcome = await appLock.authenticate('PINʼni tiklash', { biometricOnly: false });
    if (outcome === 'success') {
      appLock.resetPinAttempts();
      setStage('reset');
    } else if (outcome === 'unavailable') {
      setNotice(
        'Telefoningizda ekran qulfi yoʻq. Avval telefon sozlamalarida parol qoʻying, keyin qayta urining.',
      );
    } else if (outcome === 'failed') {
      setNotice('Tasdiqlab boʻlmadi. Qaytadan urinib koʻring.');
    }
  };

  const promptOnShow = useEffectEvent(() => {
    if (interactive && AppState.currentState !== 'background') void unlockWithBiometrics();
  });

  useEffect(() => {
    promptOnShow();
  }, []);

  useEffect(() => {
    if (!interactive) return;
    // The navigation stack underneath must not react to the Android back button.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [interactive]);

  return (
    <View
      accessibilityViewIsModal
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.lg,
        },
      ]}>
      <View style={[styles.brand, !interactive && styles.brandCentered]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.tint }]}>
          <Icon name="lock" size={24} color="primary" />
        </View>
        <Text variant="headline">Personal Transaction</Text>
      </View>

      {interactive && stage === 'pin' && (
        <>
          <PinPad
            title="PIN kiriting"
            message={notice ?? verification.message}
            disabled={verification.disabled}
            errorSignal={verification.errorSignal}
            onComplete={(pin) => {
              setNotice(null);
              void verification.submit(pin);
            }}
            extraKey={
              biometric
                ? {
                    icon: biometric === 'faceId' || biometric === 'face' ? 'faceId' : 'fingerprint',
                    accessibilityLabel: `${getBiometricMethodName(biometric)} bilan ochish`,
                    onPress: () => void unlockWithBiometrics(),
                  }
                : undefined
            }
          />
          <Button label="PINʼni unutdingizmi?" variant="ghost" onPress={recoverPin} />
        </>
      )}

      {interactive && stage === 'reset' && (
        <>
          <PinSetupFlow
            onDone={async (pin) => {
              const saved = await appLock.savePin(pin);
              if (saved) onUnlock();
              return saved;
            }}
          />
          <Button
            label="Qulfni oʻchirish"
            variant="ghost"
            onPress={async () => {
              if (await appLock.disableLock()) onUnlock();
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  brand: { alignItems: 'center', gap: Spacing.sm },
  brandCentered: { flex: 1, justifyContent: 'center' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
