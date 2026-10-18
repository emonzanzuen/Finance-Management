import { View } from 'react-native';
import { Link } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Screen scroll style={{ paddingTop: theme.spacing.xxl }}>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="title">{t('auth.register')}</AppText>
        <AppText muted>{t('auth.register_subtitle')}</AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        <AppText muted>{t('auth.have_account')}</AppText>
        <Link href="/login">
          <AppText color={theme.colors.primary} variant="bodyStrong">
            {t('auth.login')}
          </AppText>
        </Link>
      </View>
    </Screen>
  );
}
