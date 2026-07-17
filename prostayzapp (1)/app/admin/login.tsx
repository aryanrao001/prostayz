import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, useWindowDimensions, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "../../src/theme";
import { useAuth } from "../../src/AuthContext";

export default function AdminLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const submit = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Enter email and password");
      return;
    }
    try {
      setBusy(true);
      await login(email.trim(), password);
      // login() refreshes auth state; navigate
      setTimeout(() => router.replace("/admin"), 100);
    } catch (e: any) {
      Alert.alert("Login failed", e.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.shell, isWide && styles.shellWide]}>
          {isWide && (
            <View style={styles.left}>
              <View style={styles.brandBlock}>
                <View style={styles.brandDot}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                </View>
                <Text style={styles.brandText}>Prostayz</Text>
              </View>
              <Text style={styles.leftHero}>Admin Console</Text>
              <Text style={styles.leftSub}>
                Full control over stays, packages, bookings, users and vendors. Securely manage your travel marketplace.
              </Text>
              <View style={styles.featList}>
                <Feature icon="stats-chart" text="Real-time revenue & booking analytics" />
                <Feature icon="people" text="User & vendor management" />
                <Feature icon="bed" text="Curate stays and holiday packages" />
                <Feature icon="receipt" text="Order tracking & status updates" />
              </View>
            </View>
          )}

          <View style={[styles.right, isWide && styles.rightWide]}>
            <View style={styles.card}>
              {!isWide && (
                <View style={[styles.brandBlock, { marginBottom: 18 }]}>
                  <View style={styles.brandDot}>
                    <Ionicons name="shield-checkmark" size={18} color="#fff" />
                  </View>
                  <Text style={styles.brandText}>Prostayz</Text>
                </View>
              )}
              <Text style={styles.title}>Welcome back, admin</Text>
              <Text style={styles.subtitle}>Sign in to access the control panel</Text>

              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={16} color={theme.colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@example.com"
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  testID="admin-email"
                />
              </View>

              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color={theme.colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textTertiary}
                  secureTextEntry={!showPwd}
                  value={password}
                  onChangeText={setPassword}
                  testID="admin-password"
                />
                <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={{ padding: 4 }}>
                  <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={16} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, busy && { opacity: 0.6 }]}
                disabled={busy}
                onPress={submit}
                testID="admin-login-btn"
              >
                {busy ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="log-in-outline" size={18} color="#fff" />
                    <Text style={styles.submitText}>Sign in to Admin</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.hint}>
                <Ionicons name="information-circle-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.hintText}>Default: admin@auratravel.com / admin123</Text>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity onPress={() => router.replace("/")} style={styles.backLink}>
                <Ionicons name="arrow-back" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.backLinkText}>Back to public site</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Feature({ icon, text }: { icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.featRow}>
      <View style={styles.featIcon}>
        <Ionicons name={icon} size={14} color={theme.colors.accent} />
      </View>
      <Text style={styles.featText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  shell: { width: "100%", maxWidth: 460 },
  shellWide: {
    flexDirection: "row",
    maxWidth: 1080,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    overflow: "hidden",
    minHeight: 580,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  left: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    padding: 48,
    justifyContent: "center",
  },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 30 },
  brandDot: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
  brandText: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  leftHero: { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  leftSub: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 22, marginTop: 12 },
  featList: { gap: 12, marginTop: 32 },
  featRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(251,232,206,0.15)", alignItems: "center", justifyContent: "center" },
  featText: { fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "500" },
  right: { width: "100%" },
  rightWide: { flex: 1, padding: 48, justifyContent: "center", backgroundColor: theme.colors.surface },
  card: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, marginBottom: 22 },
  label: { fontSize: 10, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 1.4, marginTop: 14, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === "web" ? 10 : 12,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  input: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}) },
  submitBtn: {
    marginTop: 22,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  hint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, justifyContent: "center" },
  hintText: { fontSize: 11, color: theme.colors.textSecondary },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 18 },
  backLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  backLinkText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600" },
});
