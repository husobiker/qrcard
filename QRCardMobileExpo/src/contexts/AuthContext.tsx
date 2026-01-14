import React, {createContext, useContext, useState, useEffect} from 'react';
import {supabase} from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getCompanyByUserId} from '../services/companyService';
import type {Company, Employee} from '../types';

interface AuthContextType {
  user: Company | Employee | null;
  userType: 'company' | 'employee' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{success: boolean; error?: string}>;
  signInEmployee: (username: string, password: string) => Promise<{success: boolean; error?: string}>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<Company | Employee | null>(null);
  const [userType, setUserType] = useState<'company' | 'employee' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      const storedUserType = await AsyncStorage.getItem('userType');
      
      if (storedUserType === 'employee') {
        // For employees, check AsyncStorage for employeeId
        const employeeId = await AsyncStorage.getItem('employeeId');
        if (employeeId) {
          const {data, error} = await supabase
            .from('employees')
            .select('*')
            .eq('id', employeeId)
            .single();

          if (data && !error) {
            setUser(data as Employee);
            setUserType('employee');
          }
        }
      } else {
        // For companies, check Supabase auth session
        const {data: {session}} = await supabase.auth.getSession();
        if (session) {
          await loadUserData(session.user.id);
        }
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
        // Use companyService to load company data (same as web)
        const companyData = await getCompanyByUserId(userId);
        if (companyData) {
          setUser(companyData as Company);
          setUserType('company');
        } else {
          // Company doesn't exist yet, check if there's a pending company name
          const pendingCompanyName = await AsyncStorage.getItem(`pending_company_${userId}`);
          
          if (pendingCompanyName) {
            // Try to create company with saved name
            const {error: companyError} = await supabase
              .from('companies')
              .insert({
                id: userId,
                name: pendingCompanyName,
                language: 'tr' as 'tr' | 'en',
              } as any);

            if (!companyError) {
              // Company created, remove pending flag
              await AsyncStorage.removeItem(`pending_company_${userId}`);
              const newCompanyData = await getCompanyByUserId(userId);
              if (newCompanyData) {
                setUser(newCompanyData as Company);
                setUserType('company');
                return;
              }
            } else {
              console.error('Error creating company in AuthContext:', companyError);
            }
          }
          
          // Company doesn't exist yet, but user is authenticated
          // Set user as company with basic info
          setUser({id: userId} as Company);
          setUserType('company');
        }
      } else if (storedUserType === 'employee') {
        // Load employee data from RPC or direct query
        // Ensure role and region_id are included
        const {data, error} = await supabase
          .from('employees')
          .select('*, role, region_id')
          .eq('id', userId)
          .single();

        if (data && !error) {
          setUser(data as Employee);
          setUserType('employee');
        } else {
          // If direct query fails, try to get from AsyncStorage employeeId
          const employeeId = await AsyncStorage.getItem('employeeId');
          if (employeeId) {
            const {data: employeeData, error: employeeError} = await supabase
              .from('employees')
              .select('*, role, region_id')
              .eq('id', employeeId)
              .single();
            
            if (employeeData && !employeeError) {
              setUser(employeeData as Employee);
              setUserType('employee');
            }
          }
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
        // Translate common Supabase error messages to Turkish
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid credentials')) {
          errorMessage = 'Geçersiz giriş bilgileri';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'E-posta adresi doğrulanmamış. Lütfen e-postanızı kontrol edin.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Kullanıcı bulunamadı';
        } else if (error.message.includes('Wrong password')) {
          errorMessage = 'Hatalı şifre';
        }
        return {success: false, error: errorMessage};
      }

      if (data.user) {
        await AsyncStorage.setItem('userType', 'company');
        await loadUserData(data.user.id);
        return {success: true};
      }

      return {success: false, error: 'Giriş başarısız'};
    } catch (error: any) {
      return {success: false, error: error?.message || 'Giriş hatası'};
    }
  };

  const signInEmployee = async (username: string, password: string) => {
    try {
      const {data, error} = await supabase.rpc('authenticate_employee', {
        emp_username: username,
        emp_password: password,
      });

      if (error || !data || data.length === 0) {
        return {success: false, error: 'Geçersiz kullanıcı adı veya şifre'};
      }

      const employee = data[0] as Employee;
      
      // If authenticate_employee doesn't return role/region_id, fetch full employee data
      // Ensure role and region_id are included
      if (!employee.role || employee.region_id === undefined) {
        const {data: fullEmployee, error: fetchError} = await supabase
          .from('employees')
          .select('*, role, region_id')
          .eq('id', employee.id)
          .single();
        
        if (fullEmployee && !fetchError) {
          Object.assign(employee, fullEmployee);
        }
      }
      
      console.log('Employee login - Full employee data:', employee);
      
      await AsyncStorage.setItem('userType', 'employee');
      await AsyncStorage.setItem('employeeId', employee.id);
      setUser(employee);
      setUserType('employee');
      return {success: true};
    } catch (error: any) {
      return {success: false, error: error?.message || 'Giriş hatası'};
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

  const refreshUser = async () => {
    try {
      const {data: {session}} = await supabase.auth.getSession();
      if (session) {
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        loading,
        signIn,
        signInEmployee,
        signOut,
        refreshUser,
        isAuthenticated,
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

