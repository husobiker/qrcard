import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {MaterialIcons as Icon} from '@expo/vector-icons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';

// Screens
import RegionalManagerDashboardScreen from '../screens/regionalManager/DashboardScreen';
import RegionalEmployeesScreen from '../screens/regionalManager/EmployeesScreen';
import RegionalTasksScreen from '../screens/regionalManager/TasksScreen';
import RegionalManagerMyTasksScreen from '../screens/regionalManager/MyTasksScreen';
import RegionalCRMScreen from '../screens/regionalManager/CRMScreen';
import RegionalReportsScreen from '../screens/regionalManager/ReportsScreen';
import RegionalManagerEmployeeReportsScreen from '../screens/regionalManager/EmployeeReportsScreen';
import MarketingStaffQuotesScreen from '../screens/marketingStaff/QuotesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function RegionalManagerDashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RegionalManagerDashboardMain"
        component={RegionalManagerDashboardScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="RegionalManagerMyTasks" 
        component={RegionalManagerMyTasksScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="RegionalManagerEmployeeReports" 
        component={RegionalManagerEmployeeReportsScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="RegionalReports" 
        component={RegionalReportsScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

function RegionalManagerProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RegionalManagerProfileMain"
        component={ProfileScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

export default function RegionalManagerNavigator() {
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
        name="RegionalManagerDashboardTab"
        component={RegionalManagerDashboardStack}
        options={{
          title: 'Anasayfa',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RegionalEmployees"
        component={RegionalEmployeesScreen}
        options={{
          title: 'Personeller',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RegionalTasks"
        component={RegionalTasksScreen}
        options={{
          title: 'Görevler',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RegionalCRM"
        component={RegionalCRMScreen}
        options={{
          title: 'Müşteri Kayıtları',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="person-add" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RegionalQuotes"
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
        name="RegionalManagerProfileTab"
        component={RegionalManagerProfileStack}
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
