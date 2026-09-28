import { Alert } from 'react-native';

import { getDatabase } from '@/database/client';
import { getErrorMessage } from '@/shared/lib/errors';
import { hapticSuccess } from '@/shared/lib/haptics';
import { useToast } from '@/shared/ui/Toast';

import { deleteTransaction, restoreTransaction } from './repository';

export function useDeleteTransaction() {
  const showToast = useToast();

  const restore = (id: string) => {
    const result = restoreTransaction(getDatabase(), id);
    showToast(
      result.ok
        ? { message: 'Yozuv qaytarildi' }
        : { message: getErrorMessage(result.error), tone: 'error' },
    );
  };

  const remove = (id: string, onDeleted?: () => void) => {
    const result = deleteTransaction(getDatabase(), id);
    if (!result.ok) {
      Alert.alert('Xatolik', getErrorMessage(result.error));
      return;
    }
    hapticSuccess();
    onDeleted?.();
    showToast({
      message: 'Yozuv oʻchirildi',
      action: { label: 'Qaytarish', onPress: () => restore(id) },
    });
  };

  return (id: string, onDeleted?: () => void) =>
    Alert.alert('Yozuvni oʻchirasizmi?', 'Hisob balansi qayta hisoblanadi.', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Oʻchirish', style: 'destructive', onPress: () => remove(id, onDeleted) },
    ]);
}
