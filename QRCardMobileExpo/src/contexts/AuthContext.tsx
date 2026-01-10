import React, {createContext, useContext, useState, useEffect} from 'react';
import {supabase} from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Company, Employee} from '../types';

interface AuthContextType {
  user: Company | Employee | null;
  userType: 'company' | 'employee' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{success: boolean; error?: string}>;
  signInEmployee: (username: string, password: string) => Promise<{success: boolean; error?: string}>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<Company | Employee | null>(null);
  const [userType, setUserType] = useState<'company' | 'employee' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const {data: authListener} = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserType(null);
          await AsyncStorage.removeItem('userType');
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const {data: {session}} = await supabase.auth.getSession();
      if (session) {
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const storedUserType = await AsyncStorage.getItem('userType');
      
      if (storedUserType === 'company') {
        const {data, error} = await supabase
          .from('companies')
          .select('*')
          .eq('id', userId)
          .single();

        if (data && !error) {
          setUser(data as Company);
          setUserType('company');
        }
      } else if (storedUserType === 'employee') {
        // Load employee data from RPC or direct query
        const {data, error} = await supabase
          .from('employees')
          .select('*')
          .eq('id', userId)
          .single();

        if (data && !error) {
          setUser(data as Employee);
          setUserType('employee');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {success: false, error: error.message};
      }

      if (data.user) {
        await AsyncStorage.setItem('userType', 'company');
        await loadUserData(data.user.id);
        return {success: true};
      }

      return {success: false, error: 'Login failed'};
    } catch (error: any) {
      return {success: false, error: error?.message || 'Login error'};
    }
  };

  const signInEmployee = async (username: string, password: string) => {
    try {
      const {data, error} = await supabase.rpc('authenticate_employee', {
        emp_username: username,
        emp_password: password,
      });

      if (error || !data || data.length === 0) {
        return {success: false, error: 'Invalid username or password'};
      }

      const employee = data[0] as Employee;
      await AsyncStorage.setItem('userType', 'employee');
      await AsyncStorage.setItem('employeeId', employee.id);
      setUser(employee);
      setUserType('employee');
      return {success: true};
    } catch (error: any) {
      return {success: false, error: error?.message || 'Login error'};
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserType(null);
      await AsyncStorage.removeItem('userType');
      await AsyncStorage.removeItem('employeeId');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        loading,
        signIn,
        signInEmployee,
        signOut,
        isAuthenticated: !!user,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

