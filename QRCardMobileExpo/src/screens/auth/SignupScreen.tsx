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
  ScrollView,
} from 'react-native';
import {supabase} from '../../services/supabase';
import {useTheme} from '../../contexts/ThemeContext';
import {useLanguage} from '../../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {MaterialIcons as Icon} from '@expo/vector-icons';

export default function SignupScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const {theme} = useTheme();
  const {t} = useLanguage();

  const handleSignup = async () => {
    if (!email || !password || !companyName) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const {data, error} = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert('Kayıt Başarısız', error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Try to create company record immediately (if email confirmation is disabled)
        // Wait a bit for session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the current session
        const {data: {session}} = await supabase.auth.getSession();
        
        if (session) {
          // Session exists, try to create company
          const {error: companyError} = await supabase
            .from('companies')
            .insert({
              id: data.user.id,
              name: companyName,
            });

          if (!companyError) {
            // Company created successfully
            Alert.alert('Başarılı', 'Hesabınız başarıyla oluşturuldu. Lütfen e-postanızı kontrol ederek doğrulama yapın.');
            navigation.navigate('Login');
            return;
          }
        }
        
        // If we reach here, either no session or company creation failed
        // Save company name to AsyncStorage for later creation after email verification
        await AsyncStorage.setItem(`pending_company_${data.user.id}`, companyName);
        
        Alert.alert(
          'E-posta Doğrulama Gerekli',
          'Hesabınız oluşturuldu. Lütfen e-postanızı kontrol ederek doğrulama yapın. E-posta doğrulandıktan sonra giriş yaptığınızda şirket bilgileriniz otomatik olarak oluşturulacaktır.',
          [{text: 'Tamam', onPress: () => navigation.navigate('Login')}]
        );
      }
    } catch (error: any) {
      Alert.alert('Hata', error?.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            {t('auth.signup.title')}
          </Text>

          <View style={styles.inputContainer}>
            <Icon name="business" size={20} color={theme.colors.gray500} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, {color: theme.colors.text, borderColor: theme.colors.gray300}]}
              placeholder="Şirket Adı"
              placeholderTextColor={theme.colors.gray500}
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>

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

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={theme.colors.gray500} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, {color: theme.colors.text, borderColor: theme.colors.gray300}]}
              placeholder={t('auth.login.password')}
              placeholderTextColor={theme.colors.gray500}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, {backgroundColor: theme.colors.primaryDark}]}
            onPress={handleSignup}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Oluşturuluyor...' : 'Kayıt Ol'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.linkText, {color: theme.colors.primary}]}>
              Zaten hesabınız var mı? Giriş yapın
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
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

