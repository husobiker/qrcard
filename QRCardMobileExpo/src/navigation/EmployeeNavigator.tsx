import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {MaterialIcons as Icon} from '@expo/vector-icons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';

// Screens
import EmployeeDashboardScreen from '../screens/employee/DashboardScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import CRMScreen from '../screens/crm/CRMScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import GoalsScreen from '../screens/goals/GoalsScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import CommunicationsScreen from '../screens/communications/CommunicationsScreen';
import CommissionsScreen from '../screens/commissions/CommissionsScreen';
import CallLogsScreen from '../screens/callLogs/CallLogsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function EmployeeDashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EmployeeDashboardMain"
        component={EmployeeDashboardScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="Communications" component={CommunicationsScreen} />
      <Stack.Screen name="Commissions" component={CommissionsScreen} />
      <Stack.Screen name="CallLogs" component={CallLogsScreen} />
      <Stack.Screen name="CRM" component={CRMScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}

function EmployeeProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EmployeeProfileMain"
        component={ProfileScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}

export default function EmployeeNavigator() {
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
        name="EmployeeDashboardTab"
        component={EmployeeDashboardStack}
        options={{
          title: 'Anasayfa',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EmployeeCalendar"
        component={CalendarScreen}
        options={{
          title: t('calendar.title'),
          tabBarIcon: ({color, size}) => (
            <Icon name="calendar-today" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EmployeeTasks"
        component={TasksScreen}
        options={{
          title: t('tasks.title'),
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EmployeeReports"
        component={ReportsScreen}
        options={{
          title: 'Raporlar',
          tabBarIcon: ({color, size}) => (
            <Icon name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EmployeeProfileTab"
        component={EmployeeProfileStack}
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
