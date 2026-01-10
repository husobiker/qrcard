import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  tr: {
    'auth.login.title': 'Giriş Yap',
    'auth.login.email': 'E-posta',
    'auth.login.password': 'Şifre',
    'auth.login.submit': 'Giriş Yap',
    'auth.login.employeeLogin': 'Çalışan Girişi',
    'auth.login.forgotPassword': 'Şifremi Unuttum',
    'auth.signup.title': 'Kayıt Ol',
    'auth.forgotPassword.title': 'Şifre Sıfırla',
    'dashboard.title': 'Dashboard',
    'crm.title': 'CRM',
    'calendar.title': 'Takvim',
    'tasks.title': 'Görevler',
    'vehicles.title': 'Araç Takip',
  },
  en: {
    'auth.login.title': 'Sign In',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.submit': 'Sign In',
    'auth.login.employeeLogin': 'Employee Login',
    'auth.login.forgotPassword': 'Forgot Password',
    'auth.signup.title': 'Sign Up',
    'auth.forgotPassword.title': 'Reset Password',
    'dashboard.title': 'Dashboard',
    'crm.title': 'CRM',
    'calendar.title': 'Calendar',
    'tasks.title': 'Tasks',
    'vehicles.title': 'Vehicle Tracking',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('language');
      if (savedLang === 'en' || savedLang === 'tr') {
        setLanguageState(savedLang);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{language, setLanguage, t}}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

