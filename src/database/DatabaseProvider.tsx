import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { EmptyState } from '@/shared/ui/EmptyState';

import { initializeDatabase } from './init';

type DatabaseStatus = 'loading' | 'ready' | 'error';

/** Renders children only after the database is migrated and seeded; keeps the splash until then. */
export function DatabaseProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<DatabaseStatus>('loading');
  const [attempt, setAttempt] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    initializeDatabase().then((result) => {
      if (!cancelled) setStatus(result.ok ? 'ready' : 'error');
    });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [status]);

  if (status === 'loading') return null;

  if (status === 'error') {
    return (
      <DatabaseErrorScreen
        onRetry={() => {
          setStatus('loading');
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  return children;
}

function DatabaseErrorScreen({ onRetry }: { onRetry: () => void }) {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon="warning"
        title="Maʼlumotlarni ochib boʻlmadi"
        message="Yozuvlaringiz xavfsiz. Qaytadan urinib koʻring."
        action={{ label: 'Qayta urinish', onPress: onRetry }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
});
