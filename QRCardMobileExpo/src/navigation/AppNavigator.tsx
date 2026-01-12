import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import EmployeeNavigator from './EmployeeNavigator';
import LoadingScreen from '../screens/auth/LoadingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const auth = useAuth();
  const isAuthenticated = typeof auth.isAuthenticated === 'boolean' ? auth.isAuthenticated : Boolean(auth.isAuthenticated);
  const loading = typeof auth.loading === 'boolean' ? auth.loading : Boolean(auth.loading);
  const userType = auth.userType;

  if (loading === true) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false as boolean}}>
        {isAuthenticated === true ? (
          userType === 'employee' ? (
            <Stack.Screen name="EmployeeMain" component={EmployeeNavigator} />
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

