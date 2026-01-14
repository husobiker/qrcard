import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {MaterialIcons as Icon} from '@expo/vector-icons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';

// Screens
import MarketingStaffDashboardScreen from '../screens/marketingStaff/DashboardScreen';
import MarketingStaffQuotesScreen from '../screens/marketingStaff/QuotesScreen';
import MarketingStaffTasksScreen from '../screens/marketingStaff/TasksScreen';
import MarketingStaffMeetingsScreen from '../screens/marketingStaff/MeetingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MarketingStaffDashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MarketingStaffDashboardMain"
        component={MarketingStaffDashboardScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

function MarketingStaffProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MarketingStaffProfileMain"
        component={ProfileScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

export default function MarketingStaffNavigator() {
  const {theme} = useTheme();
  const {t} = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          paddingBottom: 0,
          paddingTop: 0,
          height: 60,
          marginTop: 0,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}>
      <Tab.Screen
        name="MarketingStaffDashboardTab"
        component={MarketingStaffDashboardStack}
        options={{
          title: 'Anasayfa',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MarketingStaffQuotes"
        component={MarketingStaffQuotesScreen}
        options={{
          title: 'Teklifler',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="description" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MarketingStaffTasks"
        component={MarketingStaffTasksScreen}
        options={{
          title: 'Görevler',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MarketingStaffMeetings"
        component={MarketingStaffMeetingsScreen}
        options={{
          title: 'Görüşmeler',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="event" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MarketingStaffProfileTab"
        component={MarketingStaffProfileStack}
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
