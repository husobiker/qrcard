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
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function EmployeeLoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInEmployee } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Hata", "Lütfen kullanıcı adı ve şifre girin");
      return;
    }

    setLoading(true);
    const result = await signInEmployee(username, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert("Giriş Başarısız", result.error || "Geçersiz kullanıcı adı veya şifre");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/crew.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Personel Girişi
          </Text>

          <View style={styles.inputContainer}>
            <Icon
              name="person"
              size={20}
              color={theme.colors.gray500}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.gray300 },
              ]}
              placeholder="Kullanıcı Adı"
              placeholderTextColor={theme.colors.gray500}
              value={username}
              onChangeText={setUsername}
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
              placeholder="Şifre"
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
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              Şirket girişine dön
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 1,
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
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
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
