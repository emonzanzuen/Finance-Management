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
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { useTheme } from '@/theme/useTheme';
import { ApiError } from '@/types/api';

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const parsed = loginSchema.parse(values);
      await login(parsed);
      showToast(t('auth.login_success'), 'success');
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
      <Screen
        scroll
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.xl,
          paddingHorizontal: theme.spacing.xl,
          gap: theme.spacing.xl,
        }}
      >
        <View style={[styles.header, { gap: theme.spacing.lg }]}>
          <View
            style={[
              styles.iconHalo,
              { backgroundColor: `${theme.colors.primary}15`, borderRadius: theme.radius.full },
            ]}
          >
            <View
              style={[
                styles.iconCore,
                { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full },
              ]}
            >
              <Feather name="trending-up" size={28} color={theme.colors.onPrimary} />
            </View>
          </View>
          <View style={[styles.headerText, { gap: theme.spacing.xs }]}>
            <AppText variant="title" style={styles.centerText}>
              {t('auth.welcome_back')}
            </AppText>
            <AppText muted style={styles.centerText}>
              {t('auth.login_subtitle')}
            </AppText>
          </View>
        </View>

        {serverError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: `${theme.colors.danger}15`,
                borderColor: `${theme.colors.danger}40`,
                borderRadius: theme.radius.control,
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <Feather name="alert-circle" size={20} color={theme.colors.danger} />
            <AppText color={theme.colors.danger} style={styles.flex}>
              {serverError}
            </AppText>
          </View>
        ) : null}

        <Card
          style={{
            gap: theme.spacing.lg,
            padding: theme.spacing.xl,
            shadowColor: theme.colors.text,
            shadowOpacity: theme.isDark ? 0 : 0.06,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: theme.isDark ? 0 : 3,
          }}
        >
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
                placeholder="••••••••"
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

          <View style={{ alignSelf: 'flex-end', marginTop: -theme.spacing.sm }}>
            <Link href="/forgot-password">
              <AppText color={theme.colors.primary} variant="bodyStrong" style={{ paddingVertical: (theme.sizes.touchTarget - theme.typography.bodyStrong.lineHeight) / 2 }}>
                {t('auth.forgot_password_link')}
              </AppText>
            </Link>
          </View>

          <Button
            label={t('auth.login')}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submit}
            onPress={() => void handleSubmit(onSubmit)()}
          />
        </Card>

        <View style={[styles.footerRow, { gap: theme.spacing.xs }]}>
          <AppText muted>{t('auth.no_account')}</AppText>
          <Link href="/register">
            <AppText color={theme.colors.primary} variant="bodyStrong" style={{ paddingVertical: (theme.sizes.touchTarget - theme.typography.bodyStrong.lineHeight) / 2 }}>
              {t('auth.register')}
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
  header: {
    alignItems: 'center',
  },
  headerText: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  centerText: {
    textAlign: 'center',
  },
  iconHalo: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCore: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit: {
    minHeight: 52,
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
