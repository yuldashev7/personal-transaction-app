import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/shared/hooks/use-theme';
import { FontFamily } from '@/shared/theme/typography';
import { ICONS } from '@/shared/ui/icons';

export default function TabsLayout() {
  const colors = useTheme();

  return (
    <NativeTabs
      tintColor={colors.primary}
      labelStyle={{ fontFamily: FontFamily.medium }}
      backgroundColor={colors.surface}
      indicatorColor={colors.primaryMuted}>
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={ICONS.home.ios} md={ICONS.home.android} />
        <NativeTabs.Trigger.Label>Asosiy</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={ICONS.transactions.ios} md={ICONS.transactions.android} />
        <NativeTabs.Trigger.Label>Yozuvlar</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="statistics" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={ICONS.statistics.ios} md={ICONS.statistics.android} />
        <NativeTabs.Trigger.Label>Statistika</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={ICONS.settings.ios} md={ICONS.settings.android} />
        <NativeTabs.Trigger.Label>Sozlamalar</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
