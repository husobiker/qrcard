import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CRMScreen from '../screens/crm/CRMScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import VehicleTrackingScreen from '../screens/vehicles/VehicleTrackingScreen';
import GoalsScreen from '../screens/goals/GoalsScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import CommunicationsScreen from '../screens/communications/CommunicationsScreen';
import CommissionsScreen from '../screens/commissions/CommissionsScreen';
import CallLogsScreen from '../screens/callLogs/CallLogsScreen';
import EmployeesScreen from '../screens/employees/EmployeesScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="Communications" component={CommunicationsScreen} />
      <Stack.Screen name="Commissions" component={CommissionsScreen} />
      <Stack.Screen name="CallLogs" component={CallLogsScreen} />
      <Stack.Screen name="Employees" component={EmployeesScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  const {theme} = useTheme();
  const {t} = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.gray200,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          title: t('dashboard.title'),
          tabBarIcon: ({color, size}) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CRM"
        component={CRMScreen}
        options={{
          title: t('crm.title'),
          tabBarIcon: ({color, size}) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: t('calendar.title'),
          tabBarIcon: ({color, size}) => (
            <Icon name="calendar-today" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: t('tasks.title'),
          tabBarIcon: ({color, size}) => (
            <Icon name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Vehicles"
        component={VehicleTrackingScreen}
        options={{
          title: t('vehicles.title'),
          tabBarIcon: ({color, size}) => (
            <Icon name="directions-car" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

