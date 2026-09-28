import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/shared/theme/layout';

import { IconButton } from './IconButton';
import { Text } from './Text';

export interface SheetHeaderProps {
  readonly title: string;
  readonly onClose: () => void;
}

/** Title + close button for `formSheet` routes (they have no native header). */
export function SheetHeader({ title, onClose }: SheetHeaderProps) {
  return (
    <View style={styles.row}>
      <Text variant="title" accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <IconButton icon="close" variant="tinted" accessibilityLabel="Yopish" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm },
  title: { flex: 1 },
});
