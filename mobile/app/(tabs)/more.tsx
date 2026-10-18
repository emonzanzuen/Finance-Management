import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { getApiHost } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';

const WARMING_UP_AFTER_MS = 3000;

function ServerCheckCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const health = useHealthCheck();
  const [slow, setSlow] = useState(false);
  const host = getApiHost();

  useEffect(() => {
    if (!health.isPending) return;
    const timer = setTimeout(() => setSlow(true), WARMING_UP_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [health.isPending]);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Feather name="server" size={theme.sizes.icon} color={theme.colors.textMuted} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{t('more.server_check')}</AppText>
          <AppText variant="caption" muted>
            {t('more.server_check_hint')}
          </AppText>
        </View>
      </View>
      <Button
        variant="secondary"
        label={health.isPending ? t('health.checking') : t('health.check')}
        loading={health.isPending}
        onPress={() => health.mutate()}
      />
      {health.isPending && slow ? <AppText color={theme.colors.warning}>{t('health.warming_up')}</AppText> : null}
      {health.isSuccess ? (
        <View style={{ gap: theme.spacing.xs }}>
          <AppText color={theme.colors.income} variant="bodyStrong">
            {t('health.ok')}
          </AppText>
          <AppText variant="caption" muted>
            {t('health.response_time', { ms: health.data.ms })}
          </AppText>
        </View>
      ) : null}
      {health.isError ? (
        <View style={{ gap: theme.spacing.xs }}>
          <AppText color={theme.colors.danger} variant="bodyStrong">
            {t('health.failed')}
          </AppText>
          <AppText variant="caption" muted>
            {t(`errors.${health.error.code}`) === `errors.${health.error.code}`
              ? t('errors.UNKNOWN')
              : t(`errors.${health.error.code}`)}
          </AppText>
        </View>
      ) : null}
      <AppText variant="caption" muted>
        {host ? t('health.host', { host }) : t('health.not_configured')}
      </AppText>
    </Card>
  );
}

export default function MoreScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <Screen scroll>
      <AppText variant="title">{t('nav.more')}</AppText>
      <ServerCheckCard />
      <Button variant="danger" label={t('auth.logout')} onPress={() => void signOut()} />
    </Screen>
  );
}
