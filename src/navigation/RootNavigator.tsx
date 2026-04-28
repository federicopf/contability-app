import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { AccountsScreen } from '../screens/AccountsScreen';
import { PersonalEventsScreen } from '../screens/PersonalEventsScreen';
import { RatesScreen } from '../screens/RatesScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { colors, radius, typography } from '../theme/tokens';

export type RootTabParamList = {
  Conti: undefined;
  Rate: undefined;
  Eventi: undefined;
  Statistiche: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          height: 74,
          borderRadius: radius.lg,
          backgroundColor: 'rgba(255, 253, 248, 0.94)',
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: 12,
          paddingHorizontal: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: typography.bodyStrong,
          fontSize: 12,
        },
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons color={color} name={getTabIcon(route.name)} size={size} />
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