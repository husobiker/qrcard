import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import EmployeeNavigator from './EmployeeNavigator';
import RegionalManagerNavigator from './RegionalManagerNavigator';
import MarketingStaffNavigator from './MarketingStaffNavigator';
import CallCenterNavigator from './CallCenterNavigator';
import LoadingScreen from '../screens/auth/LoadingScreen';
import {FIXED_ROLES} from '../types';
import type {Employee} from '../types';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const loading = auth.loading;
  const userType = auth.userType;
  const user = auth.user;

  if (loading) {
    return <LoadingScreen />;
  }

  // Check if employee is Regional Manager, Marketing Staff, or Call Center
  const isRegionalManager =
    userType === 'employee' &&
    (user as Employee)?.role === FIXED_ROLES.REGIONAL_MANAGER;
  
  const isMarketingStaff =
    userType === 'employee' &&
    (user as Employee)?.role === FIXED_ROLES.MARKETING_STAFF;

  const isCallCenter =
    userType === 'employee' &&
    (user as Employee)?.role === FIXED_ROLES.CALL_CENTER;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {isAuthenticated ? (
          userType === 'employee' ? (
            isRegionalManager ? (
              <Stack.Screen
                name="RegionalManagerMain"
                component={RegionalManagerNavigator}
              />
            ) : isMarketingStaff ? (
              <Stack.Screen
                name="MarketingStaffMain"
                component={MarketingStaffNavigator}
              />
            ) : isCallCenter ? (
              <Stack.Screen
                name="CallCenterMain"
                component={CallCenterNavigator}
              />
            ) : (
              <Stack.Screen name="EmployeeMain" component={EmployeeNavigator} />
            )
          ) : (
            <Stack.Screen name="Main" component={MainNavigator} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

