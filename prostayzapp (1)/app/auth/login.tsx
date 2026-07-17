import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { useAuth } from "../../src/AuthContext";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("testing3@gmail.com");
  const [password, setPassword] = useState("test@1234");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!email || !password) { setErr("Email and password required."); return; }
    try {
      setErr(""); setBusy(true);
      await login(email.trim().toLowerCase(), password);
      router.back();
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity testID="login-close" onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.overline}>WELCOME BACK</Text>
        <Text style={styles.title}>Let's pick up{"\n"}where you left off.</Text>
        <Text style={styles.subtitle}>Log in to manage your trips and wishlist.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="login-email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            testID="login-password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textTertiary}
            secureTextEntry
          />
        </View>

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <TouchableOpacity testID="login-submit" style={styles.primary} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color={theme.colors.textInverse} /> : <Text style={styles.primaryText}>Log in</Text>}
        </TouchableOpacity>

        <View style={styles.divider}><View style={styles.hr} /><Text style={styles.dividerText}>or</Text><View style={styles.hr} /></View>

        <TouchableOpacity testID="go-register" style={styles.secondary} onPress={() => router.replace("/auth/register")}>
          <Text style={styles.secondaryText}>Create new account</Text>
        </TouchableOpacity>

        <Text style={styles.help}>Test: admin@auratravel.com / admin123</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  closeBtn: { alignSelf: "flex-end", padding: 6 },
  overline: { fontSize: 11, letterSpacing: 2, color: theme.colors.primary, fontWeight: "700", marginTop: 16 },
  title: { fontSize: 28, fontWeight: "600", color: theme.colors.textPrimary, marginTop: 8, lineHeight: 34, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 8, marginBottom: 28 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: theme.colors.textPrimary,
  },
  err: { color: theme.colors.primary, marginTop: 4, fontSize: 13 },
  primary: {
    marginTop: 18, backgroundColor: theme.colors.primary,
    paddingVertical: 16, borderRadius: theme.radius.full, alignItems: "center",
  },
  primaryText: { color: theme.colors.textInverse, fontWeight: "700", fontSize: 15 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 22 },
  hr: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { fontSize: 12, color: theme.colors.textTertiary },
  secondary: {
    borderWidth: 1, borderColor: theme.colors.borderMedium,
    paddingVertical: 16, borderRadius: theme.radius.full, alignItems: "center",
  },
  secondaryText: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 14 },
  help: { marginTop: 24, textAlign: "center", fontSize: 11, color: theme.colors.textTertiary },
});
