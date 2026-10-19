import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ visible, title, onClose, children }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
          <Pressable style={styles.flex} onPress={onClose} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: theme.radius.card,
                borderTopRightRadius: theme.radius.card,
                borderColor: theme.colors.border,
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.md,
                paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
                gap: theme.spacing.md,
              },
            ]}
          >
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.colors.border, borderRadius: theme.radius.full },
              ]}
            />
            {title ? (
              <View style={styles.header}>
                <AppText variant="subtitle" style={styles.flex}>
                  {title}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={12}
                  onPress={onClose}
                  style={styles.closeBtn}
                >
                  <Feather name="x" size={20} color={theme.colors.textMuted} />
                </Pressable>
              </View>
            ) : null}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing.md }}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
