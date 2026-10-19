import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
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
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';
import { useTheme } from '@/theme/useTheme';
import { ApiError } from '@/types/api';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const parsed = registerSchema.parse(values);
      await register(parsed);
      showToast(t('auth.register_success'), 'success');
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
          <AppText variant="title">{t('auth.register')}</AppText>
          <AppText muted>{t('auth.register_subtitle')}</AppText>
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
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.name')}
                placeholder={t('auth.name_placeholder')}
                leftIcon="user"
                autoCapitalize="words"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.name?.message ? t(errors.name.message) : undefined}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.email')}
                placeholder={t('auth.email_placeholder')}
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.password')}
                placeholder={t('auth.password_placeholder')}
                leftIcon="lock"
                secureTextEntry
                secureToggle
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message ? t(errors.password.message) : undefined}
              />
            )}
          />

          <Button
            label={t('auth.register')}
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={() => void handleSubmit(onSubmit)()}
          />
        </Card>

        <View style={[styles.footerRow, { gap: theme.spacing.xs }]}>
          <AppText muted>{t('auth.have_account')}</AppText>
          <Link href="/login">
            <AppText color={theme.colors.primary} variant="bodyStrong">
              {t('auth.login')}
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
