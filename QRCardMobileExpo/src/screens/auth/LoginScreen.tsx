import React, { useState } from "react";
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
  Image,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
} from "../../services/biometricAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Hata", "Lütfen e-posta ve şifre girin");
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert("Giriş Başarısız", result.error || "Geçersiz giriş bilgileri");
    }
  };

  const handleBiometricLogin = async () => {
    const result = await authenticateWithBiometrics("Giriş yapmak için kimlik doğrulayın");
    if (result.success) {
      const savedEmail = await AsyncStorage.getItem("savedEmail");
      const savedPassword = await AsyncStorage.getItem("savedPassword");
      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        await handleLogin();
      } else {
        Alert.alert(
          "Kayıtlı Bilgi Yok",
          "Lütfen önce e-posta ve şifre ile giriş yapın"
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/crew.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t("auth.login.title")}
          </Text>

          <View style={styles.inputContainer}>
            <Icon
              name="email"
              size={20}
              color={theme.colors.gray500}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.gray300 },
              ]}
              placeholder={t("auth.login.email")}
              placeholderTextColor={theme.colors.gray500}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon
              name="lock"
              size={20}
              color={theme.colors.gray500}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.gray300 },
              ]}
              placeholder={t("auth.login.password")}
              placeholderTextColor={theme.colors.gray500}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primaryDark },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Yükleniyor..." : t("auth.login.submit")}
            </Text>
          </TouchableOpacity>

          {biometricAvailable && (
            <TouchableOpacity
              style={[
                styles.biometricButton,
                { borderColor: theme.colors.primary },
              ]}
              onPress={handleBiometricLogin}
            >
              <Icon name="fingerprint" size={24} color={theme.colors.primary} />
              <Text
                style={[styles.biometricText, { color: theme.colors.primary }]}
              >
                Biyometrik Kullan
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              {t("auth.login.forgotPassword")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Signup")}
          >
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              Hesabınız yok mu? Kayıt olun
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.employeeButton,
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => navigation.navigate("EmployeeLogin")}
          >
            <Icon name="person" size={20} color={theme.colors.primary} />
            <Text
              style={[
                styles.employeeButtonText,
                { color: theme.colors.primary },
              ]}
            >
              Personel Girişi
            </Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text
              style={[styles.footerText, { color: theme.colors.textSecondary }]}
            >
              made with{" "}
            </Text>
            <Icon name="favorite" size={12} color={theme.colors.primary} />
            <Text
              style={[styles.footerText, { color: theme.colors.textSecondary }]}
            >
              {" "}
              by Gözcü Yazılım
            </Text>
          </View>
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
    justifyContent: "center",
  },
  content: {
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 0,
    marginTop: -160,
  },
  logo: {
    width: 270,
    height: 270,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  inputIcon: {
    position: "absolute",
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
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
  },
  employeeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  employeeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 120,
    marginBottom: -140,
  },
  footerText: {
    fontSize: 12,
  },
});
