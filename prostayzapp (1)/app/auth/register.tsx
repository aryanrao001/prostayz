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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { useAuth } from "../../src/AuthContext";

export default function Register() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!firstName || !phone || !password) {
      setErr("Please fill all required fields.");
      return;
    }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    try {
      setErr(""); setBusy(true);
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country_code: countryCode,
        password
      }); router.back();
    } catch (e: any) {
      console.log(e);
      setErr(e.message || "Registration failed");
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity testID="reg-close" onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.overline}>JOIN PROSTAYZ</Text>
        <Text style={styles.title}>Every journey{"\n"}begins here.</Text>
        <Text style={styles.subtitle}>Create your account to save stays and book trips.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>First Name</Text>

          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="John"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>

          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="9876543210"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="reg-email"
            style={styles.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="none" keyboardType="email-address"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            testID="reg-password"
            style={styles.input} value={password} onChangeText={setPassword}
            placeholder="At least 6 characters" placeholderTextColor={theme.colors.textTertiary}
            secureTextEntry
          />
        </View>

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <TouchableOpacity testID="reg-submit" style={styles.primary} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color={theme.colors.textInverse} /> : <Text style={styles.primaryText}>Create account</Text>}
        </TouchableOpacity>

        <TouchableOpacity testID="go-login" style={{ alignSelf: "center", marginTop: 20 }} onPress={() => router.replace("/auth/login")}>
          <Text style={{ color: theme.colors.textSecondary }}>Already have an account? <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>Log in</Text></Text>
        </TouchableOpacity>
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
});
