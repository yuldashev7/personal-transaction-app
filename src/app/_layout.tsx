import { useFonts } from 'expo-font';
import { Stack, ThemeProvider, type NativeStackNavigationOptions } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DatabaseProvider } from '@/database/DatabaseProvider';
import { AppLockProvider } from '@/features/security/AppLockProvider';
import { useColorSchemeName, useTheme } from '@/shared/hooks/use-theme';
import { logger } from '@/shared/lib/logger';
import { Radius } from '@/shared/theme/layout';
import { NavigationThemes } from '@/shared/theme/navigation';
import { FONT_SOURCES, FontFamily } from '@/shared/theme/typography';
import { ErrorFallback } from '@/shared/ui/ErrorFallback';
import { ToastProvider } from '@/shared/ui/Toast';

export { ErrorFallback as ErrorBoundary } from '@/shared/ui/ErrorFallback';

export const unstable_settings = {
  anchor: '(tabs)',
  screenErrorBoundary: ErrorFallback,
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const FORM_SHEET: NativeStackNavigationOptions = {
  presentation: 'formSheet',
  headerShown: false,
  sheetGrabberVisible: true,
  sheetAllowedDetents: [0.92],
  sheetCornerRadius: Radius.xl,
};

export default function RootLayout() {
  const scheme = useColorSchemeName();
  const colors = useTheme();
  const [fontsLoaded, fontError] = useFonts(FONT_SOURCES);

  useEffect(() => {
    if (fontError) logger.error('Fonts failed to load, using system font', fontError);
  }, [fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={NavigationThemes[scheme]}>
      <DatabaseProvider>
        <AppLockProvider>
          <ToastProvider>
            <Stack
              screenOptions={{
                headerBackButtonDisplayMode: 'minimal',
                headerShadowVisible: false,
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: { fontFamily: FontFamily.medium, color: colors.text },
                contentStyle: { backgroundColor: colors.background },
              }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="transaction/new" options={FORM_SHEET} />
              <Stack.Screen name="transaction/[id]" options={{ title: 'Yozuv' }} />
              <Stack.Screen name="accounts" options={{ title: 'Hisoblar' }} />
              <Stack.Screen name="account/new" options={FORM_SHEET} />
              <Stack.Screen name="account/[id]" options={{ title: 'Hisob' }} />
              <Stack.Screen name="categories" options={{ title: 'Kategoriyalar' }} />
              <Stack.Screen name="category/new" options={FORM_SHEET} />
              <Stack.Screen name="category/[id]" options={{ title: 'Kategoriya' }} />
              <Stack.Screen name="pin" options={FORM_SHEET} />
              <Stack.Screen name="+not-found" options={{ title: 'Topilmadi' }} />
            </Stack>
          </ToastProvider>
        </AppLockProvider>
      </DatabaseProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
