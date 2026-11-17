import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  // Adapt dynamically to Android 3-button navigation bar or gesture bar
  const bottomInset = Math.max(insets.bottom, 8);
  const tabBarHeight = 62 + bottomInset;

  const softActivePillBg = theme.isDark
    ? `${theme.colors.primary}22`
    : `${theme.colors.primary}12`;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.isDark ? `${theme.colors.border}80` : `${theme.colors.border}90`,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          minHeight: tabBarHeight,
          paddingHorizontal: theme.spacing.sm,
          paddingTop: 6,
          paddingBottom: bottomInset,
          shadowColor: '#0F172A',
          shadowOpacity: theme.isDark ? 0 : 0.03,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -4 },
          elevation: theme.isDark ? 0 : 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[
                  styles.iconPill,
                  {
                    backgroundColor: focused ? softActivePillBg : 'transparent',
                  },
                ]}
              >
                <Feather name={tab.icon} size={19} color={color as string} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    width: 46,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
