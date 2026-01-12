import React, { useState, useEffect } from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar} from 'expo-status-bar';
import {View} from 'react-native';
import {AuthProvider} from './src/contexts/AuthContext';
import {ThemeProvider} from './src/contexts/ThemeContext';
import {LanguageProvider} from './src/contexts/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import CustomSplashScreen from './src/components/SplashScreen';

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleSplashFinish = () => {
    setIsSplashVisible(false);
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <StatusBar style="auto" />
      {isSplashVisible ? (
        <CustomSplashScreen onFinish={handleSplashFinish} />
      ) : (
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      )}
    </GestureHandlerRootView>
  );
}
