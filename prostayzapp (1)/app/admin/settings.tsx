import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  Switch, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";
import { useAuth } from "../../src/AuthContext";
import { useIsDesktop } from "../../src/components/WebDashboardShell";

type SettingsState = {
  razorpay_key_id: string;
  razorpay_key_secret: string;
  razorpay_mode: "test" | "live";
  amadeus_client_id: string;
  amadeus_client_secret: string;
  serpapi_key: string;
  sender_email: string;
  support_phone: string;
  app_name: string;
  tagline: string;
};

const empty: SettingsState = {
  razorpay_key_id: "",
  razorpay_key_secret: "",
  razorpay_mode: "test",
  amadeus_client_id: "",
  amadeus_client_secret: "",
  serpapi_key: "",
  sender_email: "",
  support_phone: "",
  app_name: "Prostayz",
  tagline: "Plan your perfect journey",
};

export default function AdminSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const [form, setForm] = useState<SettingsState>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSecret, setHasSecret] = useState({ razorpay: false, amadeus: false, serpapi: false });

  const load = useCallback(async () => {
    try {
      const s = await api<any>("/admin/settings", { auth: true });
      setForm({
        razorpay_key_id: s.razorpay_key_id || "",
        razorpay_key_secret: "",
        razorpay_mode: s.razorpay_mode || "test",
        amadeus_client_id: s.amadeus_client_id || "",
        amadeus_client_secret: "",
        serpapi_key: "",
        sender_email: s.sender_email || "",
        support_phone: s.support_phone || "",
        app_name: s.app_name || "Prostayz",
        tagline: s.tagline || "Plan your perfect journey",
      });
      setHasSecret({ razorpay: s.razorpay_key_secret_set, amadeus: s.amadeus_client_secret_set, serpapi: s.serpapi_key_set });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      setSaving(true);
      await api("/admin/settings", { method: "PUT", auth: true, body: form });
      Alert.alert("Saved", "Settings updated successfully");
      await load();
    } catch (e: any) {
      Alert.alert("Save failed", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "admin" && isDesktop) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  }

  if (loading) {
    return <View style={{ paddingTop: 60, alignItems: "center" }}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  const Content = (
    <ScrollView contentContainerStyle={{ padding: isDesktop ? 0 : 20, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
      <Section title="Razorpay Payment Gateway" icon="card" desc="Configure your Razorpay test/live keys for online payments.">
        <Field label="Key ID" value={form.razorpay_key_id} onChangeText={(v) => setForm({ ...form, razorpay_key_id: v })} placeholder="rzp_test_xxxxx" />
        <Field label={`Key Secret ${hasSecret.razorpay ? "(currently set — leave blank to keep)" : ""}`} value={form.razorpay_key_secret} onChangeText={(v) => setForm({ ...form, razorpay_key_secret: v })} placeholder="********" secure />
        <View style={styles.modeRow}>
          <Text style={styles.modeLabel}>Mode:</Text>
          <TouchableOpacity onPress={() => setForm({ ...form, razorpay_mode: "test" })} style={[styles.modeBtn, form.razorpay_mode === "test" && styles.modeBtnActive]}>
            <Text style={[styles.modeBtnText, form.razorpay_mode === "test" && { color: "#fff" }]}>Test</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setForm({ ...form, razorpay_mode: "live" })} style={[styles.modeBtn, form.razorpay_mode === "live" && styles.modeBtnActive]}>
            <Text style={[styles.modeBtnText, form.razorpay_mode === "live" && { color: "#fff" }]}>Live</Text>
          </TouchableOpacity>
        </View>
        <Note text="Get keys: https://dashboard.razorpay.com/app/keys" />
      </Section>

      <Section title="Flight API (Amadeus)" icon="airplane" desc="Optional. Connect Amadeus for live flight data. Leave empty to use demo flights.">
        <Field label="Amadeus Client ID" value={form.amadeus_client_id} onChangeText={(v) => setForm({ ...form, amadeus_client_id: v })} placeholder="xxxxxxxxxxxxxxxxxxxx" />
        <Field label={`Amadeus Client Secret ${hasSecret.amadeus ? "(set)" : ""}`} value={form.amadeus_client_secret} onChangeText={(v) => setForm({ ...form, amadeus_client_secret: v })} placeholder="********" secure />
        <Note text="Sign up: https://developers.amadeus.com" />
      </Section>

      <Section title="SerpAPI (Alternative flight source)" icon="search" desc="Optional. Use SerpAPI Google Flights as alternative.">
        <Field label={`SerpAPI Key ${hasSecret.serpapi ? "(set)" : ""}`} value={form.serpapi_key} onChangeText={(v) => setForm({ ...form, serpapi_key: v })} placeholder="********" secure />
      </Section>

      <Section title="Brand" icon="ribbon" desc="App name and tagline shown across the product.">
        <Field label="App Name" value={form.app_name} onChangeText={(v) => setForm({ ...form, app_name: v })} placeholder="Prostayz" />
        <Field label="Tagline" value={form.tagline} onChangeText={(v) => setForm({ ...form, tagline: v })} placeholder="Plan your perfect journey" />
      </Section>

      <Section title="Contact" icon="mail" desc="Email + phone shown on receipts and support pages.">
        <Field label="Sender Email" value={form.sender_email} onChangeText={(v) => setForm({ ...form, sender_email: v })} placeholder="support@prostayz.com" />
        <Field label="Support Phone" value={form.support_phone} onChangeText={(v) => setForm({ ...form, support_phone: v })} placeholder="+91 9XXXXXXXXX" />
      </Section>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={save} testID="save-settings">
        {saving ? <ActivityIndicator color="#fff" /> : (
          <>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Settings</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  if (isDesktop) return <View>{Content}</View>;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      {Content}
    </View>
  );
}

function Section({ title, icon, desc, children }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {desc && <Text style={styles.sectionDesc}>{desc}</Text>}
        </View>
      </View>
      <View style={{ gap: 12, marginTop: 4 }}>{children}</View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, secure }: any) {
  const [show, setShow] = useState(false);
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldWrap}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={secure && !show}
          autoCapitalize="none"
        />
        {secure && (
          <TouchableOpacity onPress={() => setShow((s) => !s)} style={{ padding: 6 }}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Note({ text }: { text: string }) {
  return (
    <View style={styles.note}>
      <Ionicons name="information-circle-outline" size={13} color={theme.colors.textSecondary} />
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary },
  section: { backgroundColor: theme.colors.surface, padding: 18, marginBottom: 16, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  sectionHead: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: theme.colors.textPrimary },
  sectionDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 16 },
  fieldLabel: { fontSize: 10, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 0.8, marginBottom: 6 },
  fieldWrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  fieldInput: { flex: 1, fontSize: 13, color: theme.colors.textPrimary, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}) },
  modeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "700", letterSpacing: 0.5 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.colors.muted },
  modeBtnActive: { backgroundColor: theme.colors.primary },
  modeBtnText: { fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },
  note: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  noteText: { fontSize: 10, color: theme.colors.textSecondary, fontStyle: "italic" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, backgroundColor: theme.colors.secondary, borderRadius: theme.radius.md, marginTop: 10 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
