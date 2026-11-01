import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';
import { z } from 'zod';
import { useTheme } from '@/theme/useTheme';
import { ApiError } from '@/types/api';
import { resetPassword } from '@/api/auth';

const resetPasswordSchema = z.object({
  email: z.string().email('auth.validation.email_invalid').min(1, 'auth.validation.email_required'),
  otp: z.string().length(6, 'auth.reset_password.otp_length').regex(/^\d{6}$/, 'auth.reset_password.otp_numeric'),
  newPassword: z
    .string()
    .min(8, 'auth.validation.password_min')
    .max(128, 'auth.validation.password_max')
    .regex(/[A-Za-z]/, 'auth.validation.password_alphanumeric')
    .regex(/[0-9]/, 'auth.validation.password_alphanumeric'),
  confirmPassword: z.string().min(1, 'auth.reset_password.confirm_required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'auth.reset_password.password_mismatch',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { clearSession } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: params.email ?? '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null);
    try {
      await resetPassword({
        email: params.email ?? '',
        otp: values.otp,
        newPassword: values.newPassword,
      });
      // Reset revokes every session: drop cached queries, local JWT, and auth state.
      await clearSession();
      showToast(t('auth.reset_password.success_message'), 'success');
      router.replace('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        const key = `errors.${err.code}`;
        const translated = t(key);
        setServerError(translated !== key ? translated : err.message || t('errors.UNKNOWN'));
      } else {
        setServerError(t('errors.UNKNOWN'));
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen scroll style={{ paddingTop: theme.spacing.xxl }}>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="title">{t('auth.reset_password.title')}</AppText>
          <AppText muted>{t('auth.reset_password.subtitle')}</AppText>
        </View>

        {serverError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.danger,
                borderRadius: theme.radius.control,
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <Feather name="alert-circle" size={18} color={theme.colors.danger} />
            <AppText color={theme.colors.danger} style={styles.flex}>
              {serverError}
            </AppText>
          </View>
        ) : null}

        <Card style={{ gap: theme.spacing.md }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.reset_password.email_label')}
                placeholder={t('auth.reset_password.email_placeholder')}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                editable={false}
                error={errors.email?.message ? t(errors.email.message) : undefined}
              />
            )}
          />

          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.reset_password.otp_label')}
                placeholder={t('auth.reset_password.otp_placeholder')}
                leftIcon="lock"
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="one-time-code"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.otp?.message ? t(errors.otp.message) : undefined}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.reset_password.new_password_label')}
                placeholder={t('auth.reset_password.new_password_placeholder')}
                leftIcon="lock"
                secureTextEntry
                secureToggle
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.newPassword?.message ? t(errors.newPassword.message) : undefined}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.reset_password.confirm_password_label')}
                placeholder={t('auth.reset_password.confirm_password_placeholder')}
                leftIcon="lock"
                secureTextEntry
                secureToggle
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined}
              />
            )}
          />

          <Button
            label={t('auth.reset_password.reset_button')}
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={() => void handleSubmit(onSubmit)()}
          />
        </Card>

        <View style={[styles.footerRow, { gap: theme.spacing.xs }]}>
          <Link href="/login">
            <AppText color={theme.colors.primary} variant="bodyStrong">
              {t('auth.reset_password.back_to_login')}
            </AppText>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});