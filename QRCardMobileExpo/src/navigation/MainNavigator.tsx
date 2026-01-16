import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {MaterialIcons as Icon} from '@expo/vector-icons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CRMScreen from '../screens/crm/CRMScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import GoalsScreen from '../screens/goals/GoalsScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import CommunicationsScreen from '../screens/communications/CommunicationsScreen';
import CommissionsScreen from '../screens/commissions/CommissionsScreen';
import CallLogsScreen from '../screens/callLogs/CallLogsScreen';
import EmployeesScreen from '../screens/employees/EmployeesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import RolesScreen from '../screens/roles/RolesScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import EmployeeReportsScreen from '../screens/employeeReports/EmployeeReportsScreen';
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
      <Stack.Screen 
        name="CRM" 
        component={CRMScreen}
        options={{
          headerShown: false,
          title: 'Satış Takibi',
        }}
      />
      <Stack.Screen
        name="Customers"
        component={CustomersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EmployeeReports"
        component={EmployeeReportsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Roles"
        component={RolesScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Roles"
        component={RolesScreen}
        options={{ headerShown: false }}
      />
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
        name="DashboardTab"
        component={DashboardStack}
        options={{
          title: t('dashboard.title'),
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Employees"
        component={EmployeesScreen}
        options={{
          title: 'Personeller',
          headerShown: false,
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
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
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

