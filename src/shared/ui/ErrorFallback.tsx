import type { ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { logger } from '@/shared/lib/logger';

import { EmptyState } from './EmptyState';

/** Route error boundary: never shows technical details to the user. */
export function ErrorFallback({ error, retry }: ErrorBoundaryProps) {
  const colors = useTheme();

  useEffect(() => {
    logger.error('Unhandled render error', error);
    // The error may happen before the splash screen was hidden.
    SplashScreen.hideAsync().catch(() => undefined);
  }, [error]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon="warning"
        title="Nimadir notoʻgʻri ketdi"
        message="Maʼlumotlaringiz xavfsiz. Qaytadan urinib koʻring."
        action={{ label: 'Qayta urinish', onPress: retry }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
});
