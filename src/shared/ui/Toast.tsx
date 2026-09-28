import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/hooks/use-theme';
import { logger } from '@/shared/lib/logger';
import { Spacing } from '@/shared/theme/layout';

import { Button } from './Button';
import { Icon } from './Icon';
import { Surface } from './Surface';
import { Text } from './Text';

export interface ToastOptions {
  readonly message: string;
  /** `error` shows a muted red toast; everything else uses the neutral glass style. */
  readonly tone?: 'default' | 'error';
  readonly action?: { readonly label: string; readonly onPress: () => void };
  readonly durationMs?: number;
}

interface ActiveToast extends ToastOptions {
  readonly id: number;
}

type ShowToast = (options: ToastOptions) => void;

const DEFAULT_DURATION_MS = 5000;
const ToastContext = createContext<ShowToast | null>(null);
let nextToastId = 0;

/** Single toast at a time; a new toast replaces the current one. */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ActiveToast | null>(null);

  const show: ShowToast = (options) => {
    nextToastId += 1;
    setToast({ ...options, id: nextToastId });
  };

  useEffect(() => {
    if (!toast) return;

    AccessibilityInfo.announceForAccessibility(toast.message);
    const timer = setTimeout(() => setToast(null), toast.durationMs ?? DEFAULT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext value={show}>
      {children}
      {toast && <ToastView key={toast.id} toast={toast} onDismiss={() => setToast(null)} />}
    </ToastContext>
  );
}

export function useToast(): ShowToast {
  const show = use(ToastContext);
  if (show) return show;

  return (options) => logger.warn('useToast called outside ToastProvider', options.message);
}

function ToastView({ toast, onDismiss }: { toast: ActiveToast; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { action } = toast;
  const error = toast.tone === 'error';

  return (
    <Animated.View
      entering={SlideInUp}
      exiting={SlideOutUp}
      pointerEvents="box-none"
      style={[styles.container, { top: insets.top + Spacing.sm }]}>
      <Surface
        variant={error ? 'raised' : 'glass'}
        radius="lg"
        style={[
          styles.toast,
          action && styles.toastWithAction,
          error && { backgroundColor: colors.dangerMuted, borderColor: `${colors.danger}4D` },
        ]}
        accessibilityLiveRegion="polite">
        {error && <Icon name="warning" size={18} color="danger" />}
        <View style={styles.message}>
          <Text variant="label" align="center" numberOfLines={2}>
            {toast.message}
          </Text>
        </View>
        {action && (
          <Button
            label={action.label}
            variant="ghost"
            onPress={() => {
              action.onPress();
              onDismiss();
            }}
          />
        )}
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Full-width row so the content-sized toast can center itself.
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 480,
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  toastWithAction: { paddingRight: Spacing.xs },
  message: { flexShrink: 1, paddingVertical: Spacing.md },
});
