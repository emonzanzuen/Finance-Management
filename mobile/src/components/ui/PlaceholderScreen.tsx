import { AppText } from './AppText';
import { Card } from './Card';
import { Screen } from './Screen';
import { useTranslation } from '@/i18n/useTranslation';

export function PlaceholderScreen({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText variant="title">{t(titleKey)}</AppText>
      <Card>
        <AppText muted>{t('common.coming_soon')}</AppText>
      </Card>
    </Screen>
  );
}
