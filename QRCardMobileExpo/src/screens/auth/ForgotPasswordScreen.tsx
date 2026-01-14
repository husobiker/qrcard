import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {supabase} from '../../services/supabase';
import {useTheme} from '../../contexts/ThemeContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {MaterialIcons as Icon} from '@expo/vector-icons';

export default function ForgotPasswordScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const {theme} = useTheme();
  const {t} = useLanguage();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin');
      return;
    }

    setLoading(true);
    try {
      const {error} = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'qrcard://reset-password',
      });

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert(
          'Başarılı',
          'Şifre sıfırlama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.',
          [{text: 'Tamam', onPress: () => navigation.navigate('Login')}],
        );
      }
    } catch (error: any) {
      Alert.alert('Hata', error?.message || 'Şifre sıfırlama e-postası gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          {t('auth.forgotPassword.title')}
        </Text>

        <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
          E-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz.
        </Text>

        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color={theme.colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, {color: theme.colors.text, borderColor: theme.colors.gray300}]}
            placeholder={t('auth.login.email')}
            placeholderTextColor={theme.colors.gray500}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, {backgroundColor: theme.colors.primaryDark}]}
          onPress={handleResetPassword}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.linkText, {color: theme.colors.primary}]}>
            Giriş Sayfasına Dön
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 12,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
});

