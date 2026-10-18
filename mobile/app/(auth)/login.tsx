import { View } from 'react-native';
import { Link } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { signIn } = useAuth();

  return (
    <Screen scroll style={{ paddingTop: theme.spacing.xxl }}>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="title">{t('auth.welcome_back')}</AppText>
        <AppText muted>{t('auth.login_subtitle')}</AppText>
      </View>
      <Card>
        <AppText variant="caption" muted>
          {t('app.tagline')}
        </AppText>
      </Card>
      {__DEV__ ? (
        // TODO(M1): hapus tombol dev ini saat login sungguhan tersedia.
        <Button
          variant="secondary"
          label={t('auth.dev_login')}
          onPress={() => void signIn('dev-fake-token', { id: 'dev', name: 'Dev', email: 'dev@example.com', avatar: null })}
        />
      ) : null}
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        <AppText muted>{t('auth.no_account')}</AppText>
        <Link href="/register">
          <AppText color={theme.colors.primary} variant="bodyStrong">
            {t('auth.register')}
          </AppText>
        </Link>
      </View>
    </Screen>
  );
}
