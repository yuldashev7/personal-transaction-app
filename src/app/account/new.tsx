import { router } from 'expo-router';

import { getDatabase } from '@/database/client';
import { AccountForm } from '@/features/accounts/components/AccountForm';
import { createAccount } from '@/features/accounts/repository';
import { hapticSuccess } from '@/shared/lib/haptics';
import { Screen } from '@/shared/ui/Screen';
import { SheetHeader } from '@/shared/ui/SheetHeader';
import { useToast } from '@/shared/ui/Toast';

export default function NewAccountScreen() {
  const showToast = useToast();

  return (
    <Screen edges={['bottom']}>
      <SheetHeader title="Yangi hisob" onClose={() => router.back()} />
      <AccountForm
        autoFocus
        submitLabel="Qoʻshish"
        onSubmit={(input) => createAccount(getDatabase(), input)}
        onSuccess={() => {
          hapticSuccess();
          showToast({ message: 'Hisob qoʻshildi' });
          router.back();
        }}
      />
    </Screen>
  );
}
