import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountsScreen } from '../screens/AccountsScreen';
import { PersonalEventsScreen } from '../screens/PersonalEventsScreen';
import { RatesScreen } from '../screens/RatesScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { colors, radius, spacing, typography } from '../theme/tokens';

export type RootTabParamList = {
  Conti: undefined;
  Rate: undefined;
  Eventi: undefined;
  Statistiche: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          left: spacing.md,
          right: spacing.md,
          bottom: Math.max(10, insets.bottom + 4),
          height: 58,
          borderRadius: radius.md,
          backgroundColor: 'rgba(255, 253, 248, 0.94)',
          borderTopWidth: 0,
          paddingTop: 4,
          paddingBottom: 4,
          paddingHorizontal: 4,
          elevation: 0,
        },
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          fontFamily: typography.bodyStrong,
          fontSize: 10,
          marginBottom: 2,
        },
        tabBarIcon: ({ color }) => (
          <MaterialIcons color={color} name={getTabIcon(route.name)} size={20} />
        ),
      })}
    >
      <Tab.Screen name="Conti" component={AccountsScreen} />
      <Tab.Screen name="Rate" component={RatesScreen} />
      <Tab.Screen name="Eventi" component={PersonalEventsScreen} />
      <Tab.Screen name="Statistiche" component={StatisticsScreen} />
    </Tab.Navigator>
  );
}

function getTabIcon(routeName: keyof RootTabParamList): keyof typeof MaterialIcons.glyphMap {
  switch (routeName) {
    case 'Conti':
      return 'account-balance-wallet';
    case 'Rate':
      return 'payments';
    case 'Eventi':
      return 'event-note';
    case 'Statistiche':
      return 'query-stats';
  }
}