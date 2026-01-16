import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {MaterialIcons as Icon} from '@expo/vector-icons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';

// Screens
import CallCenterDashboardScreen from '../screens/callCenter/DashboardScreen';
import CallCenterSearchCallScreen from '../screens/callCenter/SearchCallScreen';
import CallCenterCRMScreen from '../screens/callCenter/CRMScreen';
import CallCenterPerformanceScreen from '../screens/callCenter/PerformanceScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CallCenterDashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CallCenterDashboardMain"
        component={CallCenterDashboardScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="CallCenterPerformance"
        component={CallCenterPerformanceScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

function CallCenterProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CallCenterProfileMain"
        component={ProfileScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

export default function CallCenterNavigator() {
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
        name="CallCenterDashboardTab"
        component={CallCenterDashboardStack}
        options={{
          title: 'Anasayfa',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CallCenterSearchCall"
        component={CallCenterSearchCallScreen}
        options={{
          title: 'Müşteri Ara',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="phone" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CallCenterCRM"
        component={CallCenterCRMScreen}
        options={{
          title: 'Müşteri Kayıtları',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CallCenterProfileTab"
        component={CallCenterProfileStack}
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
