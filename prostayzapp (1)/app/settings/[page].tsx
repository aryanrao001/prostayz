import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { useAuth } from "../../src/AuthContext";

type PageKey = "personal" | "payments" | "notifications" | "privacy" | "help" | "terms" | "about";

const CONTENT: Record<PageKey, { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }> = {
  personal: { title: "Personal info", subtitle: "Your contact and identity details.", icon: "person-outline" },
  payments: { title: "Payments & payouts", subtitle: "Cards, wallets and refund history.", icon: "card-outline" },
  notifications: { title: "Notifications", subtitle: "Choose how Prostayz stays in touch.", icon: "notifications-outline" },
  privacy: { title: "Privacy & security", subtitle: "Control your data and account safety.", icon: "lock-closed-outline" },
  help: { title: "Help centre", subtitle: "We're here 24/7 for any wandering question.", icon: "help-circle-outline" },
  terms: { title: "Terms & policies", subtitle: "The fine print for your peace of mind.", icon: "document-text-outline" },
  about: { title: "About Prostayz", subtitle: "Our story, our mission, our people.", icon: "information-circle-outline" },
};

export default function SettingsPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const key = (page as PageKey) || "personal";
  const meta = CONTENT[key] || CONTENT.personal;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [notif, setNotif] = React.useState({ trips: true, offers: true, news: false });
  const [priv, setPriv] = React.useState({ twofa: false, marketing: true });
  const [form, setForm] = React.useState({ name: user?.name || "", email: user?.email || "", phone: "" });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="settings-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{meta.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name={meta.icon} size={26} color={theme.colors.primary} /></View>
          <Text style={styles.heroTitle}>{meta.title}</Text>
          <Text style={styles.heroSub}>{meta.subtitle}</Text>
        </View>

        {key === "personal" && (
          <View style={styles.group}>
            <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} testID="field-name" />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} testID="field-email" />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91 98xxxxxx" testID="field-phone" />
            <TouchableOpacity testID="save-personal" style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Save changes</Text>
            </TouchableOpacity>
          </View>
        )}

        {key === "payments" && (
          <View style={styles.group}>
            <Row icon="card-outline" label="Add payment method" right="chevron-forward" />
            <Row icon="wallet-outline" label="Prostayz wallet" right="chevron-forward" value="₹0.00" />
            <Row icon="cash-outline" label="Refund history" right="chevron-forward" value="No refunds" />
            <Row icon="pricetag-outline" label="Promo codes" right="chevron-forward" />
          </View>
        )}

        {key === "notifications" && (
          <View style={styles.group}>
            <Toggle label="Trip updates" desc="Booking confirmations, itinerary changes." value={notif.trips} onChange={(v) => setNotif({ ...notif, trips: v })} testID="n-trips" />
            <Toggle label="Deals & offers" desc="Seasonal packages and member-only savings." value={notif.offers} onChange={(v) => setNotif({ ...notif, offers: v })} testID="n-offers" />
            <Toggle label="Newsletter" desc="Monthly stories from the road." value={notif.news} onChange={(v) => setNotif({ ...notif, news: v })} testID="n-news" />
          </View>
        )}

        {key === "privacy" && (
          <View style={styles.group}>
            <Toggle label="Two-factor authentication" desc="Extra layer of security on login." value={priv.twofa} onChange={(v) => setPriv({ ...priv, twofa: v })} testID="p-2fa" />
            <Toggle label="Personalised marketing" desc="Allow us to tailor recommendations." value={priv.marketing} onChange={(v) => setPriv({ ...priv, marketing: v })} testID="p-mkt" />
            <TouchableOpacity testID="download-data" style={styles.ghostRow}>
              <Ionicons name="download-outline" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.ghostLabel}>Download my data</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity testID="delete-account" style={styles.dangerRow}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.dangerLabel}>Delete my account</Text>
            </TouchableOpacity>
          </View>
        )}

        {key === "help" && (
          <View style={styles.group}>
            <Row icon="chatbubbles-outline" label="Chat with support" right="chevron-forward" />
            <Row icon="call-outline" label="Call us" value="+91 80-4000 8080" right="call-outline" />
            <Row icon="mail-outline" label="Email us" value="hello@prostayz.in" right="mail-outline" />
            <FAQ q="How do I cancel a booking?" a="Head to Trips → select the booking → Cancel. Refunds are processed in 5-7 business days." />
            <FAQ q="Can I customise a holiday package?" a="Yes! Reach out via chat and Roamie's humans will tailor the itinerary." />
            <FAQ q="Is my payment secure?" a="All transactions use industry-standard encryption and tokenised cards." />
          </View>
        )}

        {key === "terms" && (
          <View style={styles.group}>
            <Row icon="document-outline" label="Terms of service" right="chevron-forward" />
            <Row icon="shield-checkmark-outline" label="Privacy policy" right="chevron-forward" />
            <Row icon="receipt-outline" label="Refund & cancellation" right="chevron-forward" />
            <Row icon="business-outline" label="Host guidelines" right="chevron-forward" />
            <Text style={styles.finePrint}>Last updated: 15 Feb 2026 · Prostayz Travels Pvt. Ltd.</Text>
          </View>
        )}

        {key === "about" && (
          <View style={styles.group}>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutHeading}>Born to wander.</Text>
              <Text style={styles.aboutBody}>
                Prostayz was founded in 2026 with a simple belief — travel should be slow, soulful, and stitched together by the people who know the ground. We handpick stays and craft journeys that let you see India like a local friend would show it.
              </Text>
              <Text style={styles.aboutHeading}>Our promise</Text>
              <Text style={styles.aboutBody}>• Verified stays · Zero hidden fees · 24/7 concierge{"\n"}• Curated packages with local guides{"\n"}• Carbon-aware travel recommendations</Text>
              <Text style={styles.aboutHeading}>The numbers</Text>
              <View style={styles.statsRow}>
                <Stat n="40K+" l="Happy travellers" />
                <Stat n="120" l="Curated stays" />
                <Stat n="38" l="Journey routes" />
              </View>
            </View>
            <Text style={styles.finePrint}>Prostayz · v1.0 · Made with ❤ in Bengaluru</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, testID }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput testID={testID} style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={theme.colors.textTertiary} />
    </View>
  );
}

function Row({ icon, label, right, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; right?: keyof typeof Ionicons.glyphMap; value?: string }) {
  return (
    <TouchableOpacity style={styles.row}>
      <Ionicons name={icon} size={20} color={theme.colors.textPrimary} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {right && <Ionicons name={right} size={16} color={theme.colors.textTertiary} />}
    </TouchableOpacity>
  );
}

function Toggle({ label, desc, value, onChange, testID }: any) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.colors.muted, true: theme.colors.sageLight }}
        thumbColor={value ? theme.colors.primary : "#FFFFFF"}
      />
    </View>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(!open)} style={styles.faq}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="help-circle" size={18} color={theme.colors.primary} />
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={theme.colors.textSecondary} />
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.statL}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  hero: { alignItems: "center", paddingVertical: 24 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#E4F0D1", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  heroTitle: { fontSize: 22, fontWeight: "700", color: theme.colors.textPrimary },
  heroSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: "center" },
  group: { gap: 8 },
  label: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: theme.colors.textPrimary,
  },
  primaryBtn: { marginTop: 8, backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.radius.full, alignItems: "center" },
  primaryBtnText: { color: theme.colors.textInverse, fontWeight: "700" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: theme.colors.textPrimary },
  rowValue: { fontSize: 13, color: theme.colors.textSecondary, marginRight: 6 },
  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary },
  toggleDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  ghostRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
    marginTop: 4,
  },
  ghostLabel: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, fontWeight: "500" },
  dangerRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.primary,
    marginTop: 8,
  },
  dangerLabel: { flex: 1, fontSize: 14, color: theme.colors.primary, fontWeight: "700" },
  faq: {
    padding: 14, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
  },
  faqQ: { flex: 1, fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary },
  faqA: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 8, lineHeight: 19 },
  finePrint: { textAlign: "center", marginTop: 18, fontSize: 11, color: theme.colors.textTertiary },
  aboutCard: {
    backgroundColor: theme.colors.surface, padding: 18,
    borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border,
  },
  aboutHeading: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 12 },
  aboutBody: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20, marginTop: 6 },
  statsRow: { flexDirection: "row", marginTop: 12, gap: 12 },
  stat: { flex: 1, padding: 12, backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, alignItems: "center" },
  statN: { fontSize: 18, fontWeight: "700", color: theme.colors.primary },
  statL: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2, textAlign: "center" },
});
