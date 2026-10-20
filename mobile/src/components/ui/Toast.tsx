import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export type ToastVariant = 'success' | 'error' | 'info';

type ToastData = {
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastData | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, variant });
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start(() => setToast(null));
      }, 2800);
    },
    [opacity],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  const iconName: React.ComponentProps<typeof Feather>['name'] =
    toast?.variant === 'error'
      ? 'alert-circle'
      : toast?.variant === 'info'
        ? 'info'
        : 'check-circle';

  const accentColor =
    toast?.variant === 'error'
      ? theme.colors.danger
      : toast?.variant === 'info'
        ? theme.colors.info
        : theme.colors.income;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          style={[
            styles.overlay,
            { top: insets.top + theme.spacing.md, paddingHorizontal: theme.spacing.lg },
          ]}
        >
          <Animated.View
            style={[
              styles.toastBox,
              {
                opacity,
                backgroundColor: theme.colors.surface,
                borderColor: accentColor,
                borderRadius: theme.radius.control,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <Feather name={iconName} size={18} color={accentColor} />
            <AppText variant="bodyStrong" style={styles.message}>
              {toast.message}
            </AppText>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    elevation: 6,
  },
  message: {
    flex: 1,
  },
});
