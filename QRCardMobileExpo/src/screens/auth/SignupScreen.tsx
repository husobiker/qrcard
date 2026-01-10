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
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SignupScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const {theme} = useTheme();
  const {t} = useLanguage();

  const handleSignup = async () => {
    if (!email || !password || !companyName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const {data, error} = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert('Signup Failed', error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create company record
        const {error: companyError} = await supabase
          .from('companies')
          .insert({
            id: data.user.id,
            name: companyName,
          });

        if (companyError) {
          Alert.alert('Error', 'Failed to create company');
        } else {
          Alert.alert('Success', 'Account created successfully. Please check your email to verify.');
          navigation.navigate('Login');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Signup failed');
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
              placeholder="Company Name"
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
            style={[styles.button, {backgroundColor: theme.colors.primary}]}
            onPress={handleSignup}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Creating...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.linkText, {color: theme.colors.primary}]}>
              Already have an account? Sign in
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

