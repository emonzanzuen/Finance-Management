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
import { useTranslation } from '@/i18n/useTranslation';
import { z } from 'zod';
import { useTheme } from '@/theme/useTheme';
import { ApiError } from '@/types/api';
import { forgotPassword } from '@/api/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('auth.validation.email_invalid').min(1, 'auth.validation.email_required'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ email?: string }>();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: params.email ?? '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null);
    try {
      await forgotPassword({ email: values.email.trim().toLowerCase() });
      showToast(t('auth.forgot_password.success_message'), 'success');
      router.push(`/reset-password?email=${encodeURIComponent(values.email.trim().toLowerCase())}`);
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
          <AppText variant="title">{t('auth.forgot_password.title')}</AppText>
          <AppText muted>{t('auth.forgot_password.subtitle')}</AppText>
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
                label={t('auth.forgot_password.email_label')}
                placeholder={t('auth.forgot_password.email_placeholder')}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.email?.message ? t(errors.email.message) : undefined}
              />
            )}
          />

          <Button
            label={t('auth.forgot_password.send_button')}
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={() => void handleSubmit(onSubmit)()}
          />
        </Card>

        <View style={[styles.footerRow, { gap: theme.spacing.xs }]}>
          <Link href="/login">
            <AppText color={theme.colors.primary} variant="bodyStrong">
              {t('auth.forgot_password.back_to_login')}
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