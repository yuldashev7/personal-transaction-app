import { router } from 'expo-router';

import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';

export default function NotFoundScreen() {
  return (
    <Screen edges={['bottom']}>
      <EmptyState
        icon="warning"
        title="Sahifa topilmadi"
        action={{ label: 'Bosh sahifaga', onPress: () => router.replace('/') }}
      />
    </Screen>
  );
}
