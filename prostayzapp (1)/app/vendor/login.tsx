import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, useWindowDimensions, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "../../src/theme";
import { useAuth } from "../../src/AuthContext";

type Mode = "login" | "signup";

export default function VendorLogin() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const submit = async () => {
    if (!email || !password || (mode === "signup" && !name)) {
      Alert.alert("Missing fields", "Please fill all fields");
      return;
    }
    try {
      setBusy(true);
      if (mode === "signup") {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      setTimeout(() => router.replace("/vendor"), 100);
    } catch (e: any) {
      Alert.alert(mode === "signup" ? "Signup failed" : "Login failed", e.message || "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.shell, isWide && styles.shellWide]}>
          {isWide && (
            <View style={styles.left}>
              <View style={styles.brandBlock}>
                <View style={styles.brandDot}>
                  <Ionicons name="briefcase" size={20} color="#fff" />
                </View>
                <Text style={styles.brandText}>Prostayz Hosts</Text>
              </View>
              <Text style={styles.leftHero}>Grow your travel business</Text>
              <Text style={styles.leftSub}>
                List your villa, hotel, or curated holiday packages. Reach thousands of travellers and manage bookings from one beautiful dashboard.
              </Text>
              <View style={styles.statsRow}>
                <Stat number="100+" label="Active hosts" />
                <Stat number="40K+" label="Travellers" />
                <Stat number="12%" label="Commission" />
              </View>
              <View style={styles.featList}>
                <Feature icon="cash" text="Zero listing fee — pay only on bookings" />
                <Feature icon="rocket" text="Go live in under 5 minutes" />
                <Feature icon="stats-chart" text="Track revenue & bookings in real-time" />
              </View>
            </View>
          )}

          <View style={[styles.right, isWide && styles.rightWide]}>
            <View style={styles.card}>
              {!isWide && (
                <View style={[styles.brandBlock, { marginBottom: 18 }]}>
                  <View style={styles.brandDot}>
                    <Ionicons name="briefcase" size={18} color="#fff" />
                  </View>
                  <Text style={[styles.brandText, { color: theme.colors.textPrimary }]}>Prostayz Hosts</Text>
                </View>
              )}

              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity onPress={() => setMode("login")} style={[styles.tab, mode === "login" && styles.tabActive]}>
                  <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Log in</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode("signup")} style={[styles.tab, mode === "signup" && styles.tabActive]}>
                  <Text style={[styles.tabText, mode === "signup" && styles.tabTextActive]}>Sign up</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.title}>
                {mode === "login" ? "Welcome back, host" : "Start hosting today"}
              </Text>
              <Text style={styles.subtitle}>
                {mode === "login" ? "Manage your listings and bookings" : "Create an account in 30 seconds"}
              </Text>

              {mode === "signup" && (
                <>
                  <Text style={styles.label}>FULL NAME</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={16} color={theme.colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your name"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={name}
                      onChangeText={setName}
                      testID="vendor-name"
                    />
                  </View>
                </>
              )}

              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={16} color={theme.colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="you@business.com"
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  testID="vendor-email"
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
                  testID="vendor-password"
                />
                <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={{ padding: 4 }}>
                  <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={16} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.submitBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit} testID="vendor-login-btn">
                {busy ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name={mode === "login" ? "log-in-outline" : "rocket-outline"} size={18} color="#fff" />
                    <Text style={styles.submitText}>
                      {mode === "login" ? "Log in to Host Console" : "Create host account"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

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

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    minHeight: 620,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  left: { flex: 1, backgroundColor: theme.colors.primary, padding: 48, justifyContent: "center" },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 30 },
  brandDot: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.secondary, alignItems: "center", justifyContent: "center" },
  brandText: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  leftHero: { fontSize: 30, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  leftSub: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 22, marginTop: 12 },
  statsRow: { flexDirection: "row", gap: 20, marginTop: 28, marginBottom: 24 },
  stat: { flex: 1 },
  statNumber: { fontSize: 24, fontWeight: "800", color: theme.colors.accent, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2, fontWeight: "600", letterSpacing: 0.5 },
  featList: { gap: 12 },
  featRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(251,232,206,0.18)", alignItems: "center", justifyContent: "center" },
  featText: { fontSize: 13, color: "rgba(255,255,255,0.95)", fontWeight: "500" },
  right: { width: "100%" },
  rightWide: { flex: 1, padding: 48, justifyContent: "center", backgroundColor: theme.colors.surface },
  card: { width: "100%", backgroundColor: theme.colors.surface, borderRadius: 18, padding: 28, borderWidth: 1, borderColor: theme.colors.border },
  tabs: { flexDirection: "row", backgroundColor: theme.colors.muted, borderRadius: theme.radius.full, padding: 4, marginBottom: 22 },
  tab: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: theme.radius.full },
  tabActive: { backgroundColor: theme.colors.surface, ...theme.shadow.subtle },
  tabText: { fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.textPrimary },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, marginBottom: 8 },
  label: { fontSize: 10, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 1.4, marginTop: 14, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === "web" ? 10 : 12,
    backgroundColor: theme.colors.bg, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  input: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}) },
  submitBtn: { marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 18 },
  backLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  backLinkText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600" },
});
