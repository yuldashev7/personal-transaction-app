import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { useAppLock } from '@/features/security/app-lock-context';
import { getBiometricMethodName } from '@/features/security/presentation';
import { useTheme } from '@/shared/hooks/use-theme';
import { hapticSuccess } from '@/shared/lib/haptics';
import { Spacing } from '@/shared/theme/layout';
import { ListRow } from '@/shared/ui/ListRow';
import { Screen } from '@/shared/ui/Screen';
import { Surface } from '@/shared/ui/Surface';
import { Text } from '@/shared/ui/Text';
import { useToast } from '@/shared/ui/Toast';

export default function SettingsScreen() {
  const colors = useTheme();
  const showToast = useToast();
  const appLock = useAppLock();
  const [biometricPending, setBiometricPending] = useState(false);

  const biometricName = appLock.biometricMethod
    ? getBiometricMethodName(appLock.biometricMethod)
    : null;

  const toggleLock = () => {
    router.push({ pathname: '/pin', params: { mode: appLock.enabled ? 'disable' : 'create' } });
  };

  const toggleBiometric = async () => {
    if (appLock.biometricBlocked) {
      showToast({ message: 'Face ID Expo Goʼda ishlamaydi. Ilovaning oʻz buildʼida yoqiladi.' });
      return;
    }
    if (biometricPending) return;
    const next = !appLock.biometricEnabled;

    setBiometricPending(true);
    const outcome = await appLock.setBiometricEnabled(next);
    setBiometricPending(false);

    if (outcome === 'success') {
      hapticSuccess();
      return;
    }
    if (outcome === 'unavailable') {
      showToast({
        message: `Avval telefon sozlamalarida ${biometricName ?? 'biometrika'}ni yoqing.`,
      });
    } else if (outcome === 'failed' || outcome === 'error') {
      showToast({ message: 'Amalni bajarib boʻlmadi. Qaytadan urinib koʻring.', tone: 'error' });
    }
  };

  return (
    <Screen title="Sozlamalar" edges={['top']}>
      <Surface>
        <ListRow
          icon="card"
          title="Hisoblar"
          subtitle="Kartalar, naqd pul, arxiv"
          showChevron
          onPress={() => router.push('/accounts')}
        />
        <ListRow
          icon="other"
          title="Kategoriyalar"
          showChevron
          onPress={() => router.push('/categories')}
        />
      </Surface>

      <View style={styles.section}>
        <Text variant="label" color="textSecondary" style={styles.sectionText}>
          Xavfsizlik
        </Text>
        <Surface>
          <ListRow
            icon="lock"
            title="Ilova paroli"
            subtitle={appLock.enabled ? '4 raqamli PIN oʻrnatilgan' : 'Oʻrnatilmagan'}
            onPress={toggleLock}
            accessibilityRole="switch"
            accessibilityState={{ checked: appLock.enabled }}
            trailing={
              <Switch
                value={appLock.enabled}
                onValueChange={toggleLock}
                trackColor={{ true: colors.primary }}
              />
            }
          />
          {appLock.enabled && (
            <ListRow
              icon="edit"
              title="PINʼni oʻzgartirish"
              showChevron
              onPress={() => router.push({ pathname: '/pin', params: { mode: 'change' } })}
            />
          )}
          {appLock.enabled && appLock.biometricMethod && biometricName && (
            <ListRow
              icon={
                appLock.biometricMethod === 'faceId' || appLock.biometricMethod === 'face'
                  ? 'faceId'
                  : 'fingerprint'
              }
              title={`${biometricName} bilan ochish`}
              subtitle={appLock.biometricBlocked ? 'Expo Goʼda ishlamaydi' : 'PIN oʻrniga tezroq'}
              onPress={toggleBiometric}
              accessibilityRole="switch"
              accessibilityState={{
                checked: appLock.biometricEnabled,
                disabled: biometricPending || appLock.biometricBlocked,
              }}
              trailing={
                <Switch
                  value={appLock.biometricEnabled}
                  disabled={biometricPending || appLock.biometricBlocked}
                  onValueChange={toggleBiometric}
                  trackColor={{ true: colors.primary }}
                />
              }
            />
          )}
        </Surface>
        <Text variant="caption" color="textSecondary" style={styles.sectionText}>
          {appLock.enabled
            ? 'Ilovadan chiqqaningizdan 30 soniya oʻtgach qulflanadi. Ochiq ilovalar roʻyxatida maʼlumotlaringiz koʻrinmaydi.'
            : 'Parol oʻrnatsangiz, ilova har safar ochilganda PIN soʻraydi.'}{' '}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  sectionText: { paddingHorizontal: Spacing.lg },
});
