import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const TABS: { name: string; titleKey: string; icon: FeatherName }[] = [
  { name: 'index', titleKey: 'nav.home', icon: 'home' },
  { name: 'transactions', titleKey: 'nav.transactions', icon: 'repeat' },
  { name: 'budget', titleKey: 'nav.budget', icon: 'pie-chart' },
  { name: 'savings', titleKey: 'nav.savings', icon: 'target' },
  { name: 'more', titleKey: 'nav.more', icon: 'menu' },
];

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          minHeight: theme.sizes.tabBarHeight,
        },
        tabBarLabelStyle: theme.typography.caption,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color }) => <Feather name={tab.icon} size={theme.sizes.icon} color={color as string} />,
          }}
        />
      ))}
    </Tabs>
  );
}
