import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";
import { useAuth } from "../../src/AuthContext";
import { useIsDesktop } from "../../src/components/WebDashboardShell";

const BUSINESS_TYPES = ["Hotel", "Villa", "Homestay", "Travel Agency", "Tour Operator", "Resort"];

type Stats = {
  totals: { bookings: number; revenue: number; confirmed: number; cancelled: number; stays: number; packages: number };
  recent_bookings: any[];
};

type Vendor = {
  business_name: string; business_type: string; phone: string; city: string;
  description: string; status: string;
};

export default function VendorDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const isDesktop = useIsDesktop();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Apply form state
  const [form, setForm] = useState({ business_name: "", business_type: BUSINESS_TYPES[0], phone: "", city: "", description: "" });
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      // For non-vendor/admin users, /vendor/me will 403
      if (user.role === "vendor" || user.role === "admin") {
        const [v, s] = await Promise.all([
          api<Vendor>("/vendor/me", { auth: true }).catch(() => null),
          api<Stats>("/vendor/stats", { auth: true }).catch(() => null),
        ]);
        setVendor(v && (v as any).business_name ? v : null);
        setStats(s);
      } else {
        setVendor(null);
        setStats(null);
      }
    } catch (e) { console.warn(e); }
  }, [user]);

  useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

  const submitApply = async () => {
    if (!form.business_name || !form.business_type || !form.phone || !form.city || form.description.length < 10) {
      Alert.alert("Missing fields", "Please fill all fields. Description must be 10+ chars.");
      return;
    }
    try {
      setApplying(true);
      await api("/vendor/apply", { method: "POST", auth: true, body: form });
      await refresh();
      await load();
      Alert.alert("Welcome aboard!", "Your vendor account is active. Start adding properties now.");
    } catch (e: any) {
      Alert.alert("Application failed", e.message);
    } finally { setApplying(false); }
  };

  if (!user) {
    if (isDesktop) return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60, padding: 24 }]}>
        <Ionicons name="briefcase-outline" size={48} color={theme.colors.primary} />
        <Text style={styles.lockedTitle}>Log in to become a host</Text>
        <TouchableOpacity onPress={() => router.push("/vendor/login")} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Log in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show apply form if not yet a vendor
  if (!vendor && user.role !== "admin") {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity testID="back" onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Become a host</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Ionicons name="business" size={26} color={theme.colors.primary} /></View>
            <Text style={styles.heroTitle}>List your property on Prostayz</Text>
            <Text style={styles.heroSub}>Earn from your villa, hotel or travel packages. Join 100+ hosts already on Prostayz.</Text>
          </View>

          <View style={styles.benefits}>
            <Benefit icon="cash-outline" text="Zero listing fee · 12% per booking only" />
            <Benefit icon="people-outline" text="Reach 40K+ Indian travellers" />
            <Benefit icon="rocket-outline" text="Get live in under 5 minutes" />
          </View>

          <Text style={styles.lbl}>BUSINESS NAME</Text>
          <TextInput testID="biz-name" style={styles.input} value={form.business_name} onChangeText={(v) => setForm({ ...form, business_name: v })} placeholder="e.g. Sunrise Beach Villas" placeholderTextColor={theme.colors.textTertiary} />

          <Text style={styles.lbl}>BUSINESS TYPE</Text>
          <View style={styles.chipRow}>
            {BUSINESS_TYPES.map((t) => (
              <TouchableOpacity key={t} testID={`type-${t}`} onPress={() => setForm({ ...form, business_type: t })} style={[styles.chip, form.business_type === t && styles.chipActive]}>
                <Text style={[styles.chipText, form.business_type === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lbl}>PHONE</Text>
              <TextInput testID="biz-phone" style={styles.input} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="+91 98xxxx" placeholderTextColor={theme.colors.textTertiary} keyboardType="phone-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lbl}>CITY</Text>
              <TextInput testID="biz-city" style={styles.input} value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} placeholder="Goa" placeholderTextColor={theme.colors.textTertiary} />
            </View>
          </View>

          <Text style={styles.lbl}>ABOUT YOUR BUSINESS</Text>
          <TextInput testID="biz-desc" style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]} value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Tell travelers what makes your place special..." placeholderTextColor={theme.colors.textTertiary} multiline />

          <TouchableOpacity testID="apply-btn" style={[styles.applyBtn, applying && { opacity: 0.5 }]} disabled={applying} onPress={submitApply}>
            {applying ? <ActivityIndicator color={theme.colors.textInverse} /> : (
              <>
                <Ionicons name="rocket" size={18} color={theme.colors.textInverse} />
                <Text style={styles.applyText}>Activate my host account</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Vendor dashboard content (shared mobile + desktop)
  const renderVendorContent = () => {
    if (loading || !stats) return <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} />;
    return (
      <>
        {vendor && (
          <View style={styles.vendorCard}>
            <View style={styles.vendorIcon}><Ionicons name="business" size={20} color={theme.colors.textInverse} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{vendor.business_name}</Text>
              <Text style={styles.vendorMeta}>{vendor.business_type} · {vendor.city}</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, vendor.status === "approved" && { backgroundColor: theme.colors.success }]} />
              <Text style={styles.statusText}>{vendor.status}</Text>
            </View>
          </View>
        )}

        <View style={[styles.heroCard, isDesktop && { padding: 32, marginBottom: 24 }]}>
          <Text style={styles.heroLabel}>YOUR REVENUE</Text>
          <Text style={[styles.heroAmount, isDesktop && { fontSize: 44 }]}>₹{stats.totals.revenue.toLocaleString()}</Text>
          <View style={styles.heroFoot}>
            <Text style={styles.heroFootText}>{stats.totals.bookings} bookings</Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroFootText}>{stats.totals.confirmed} confirmed</Text>
          </View>
        </View>

        <View style={[styles.statsGrid, isDesktop && { gap: 16 }]}>
          <StatCard icon="bed-outline" label="My Stays" value={stats.totals.stays} onPress={() => router.push("/vendor/stays")} isDesktop={isDesktop} />
          <StatCard icon="airplane-outline" label="My Packages" value={stats.totals.packages} onPress={() => router.push("/vendor/packages")} isDesktop={isDesktop} />
          <StatCard icon="receipt-outline" label="Bookings" value={stats.totals.bookings} onPress={() => router.push("/vendor/bookings")} isDesktop={isDesktop} />
          <StatCard icon="checkmark-circle-outline" label="Confirmed" value={stats.totals.confirmed} onPress={() => router.push("/vendor/bookings")} isDesktop={isDesktop} />
        </View>

        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={isDesktop ? { flexDirection: "row", flexWrap: "wrap", gap: 14 } : undefined}>
          <ManageRow icon="bed" label="My Stays / Villas" desc="Add and manage your properties" onPress={() => router.push("/vendor/stays")} testID="manage-stays" isDesktop={isDesktop} />
          <ManageRow icon="airplane" label="My Holiday Packages" desc="Curate your trip offerings" onPress={() => router.push("/vendor/packages")} testID="manage-packages" isDesktop={isDesktop} />
          <ManageRow icon="receipt" label="Bookings & Orders" desc="View incoming reservations" onPress={() => router.push("/vendor/bookings")} testID="manage-bookings" isDesktop={isDesktop} />
        </View>

        {stats.recent_bookings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent orders</Text>
            {stats.recent_bookings.slice(0, 5).map((b) => (
              <View key={b.id} style={styles.bookingRow}>
                <View style={[styles.dot, b.status === "confirmed" ? { backgroundColor: theme.colors.success } : { backgroundColor: theme.colors.textTertiary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingTitle} numberOfLines={1}>{b.item_title}</Text>
                  <Text style={styles.bookingSub}>{b.item_type} · {b.guests} guest{b.guests > 1 ? "s" : ""}</Text>
                </View>
                <Text style={styles.bookingPrice}>₹{b.total_price.toLocaleString()}</Text>
              </View>
            ))}
          </>
        )}
      </>
    );
  };

  // Desktop: shell provides chrome
  if (isDesktop) {
    return <View>{renderVendorContent()}</View>;
  }

  // Vendor dashboard (existing vendor or admin) — mobile
  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.brandSmall}>Prostayz</Text>
          <Text style={styles.topTitle}>Vendor Console</Text>
        </View>
        <View style={styles.vendorBadge}>
          <Ionicons name="briefcase" size={11} color={theme.colors.textInverse} />
          <Text style={styles.vendorBadgeText}>{user.role === "admin" ? "ADMIN" : "VENDOR"}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.colors.primary} />}
      >
        {renderVendorContent()}
      </ScrollView>
    </View>
  );
}

function Benefit({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIcon}><Ionicons name={icon} size={16} color={theme.colors.primary} /></View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, onPress, isDesktop }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; onPress: () => void; isDesktop?: boolean }) {
  return (
    <TouchableOpacity style={[styles.statCard, isDesktop && { width: 220, flexGrow: 1, padding: 22 }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.statIcon}><Ionicons name={icon} size={18} color={theme.colors.primary} /></View>
      <Text style={[styles.statValue, isDesktop && { fontSize: 30 }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ManageRow({ icon, label, desc, onPress, testID, isDesktop }: any) {
  return (
    <TouchableOpacity testID={testID} style={[styles.manageRow, isDesktop && { flex: 1, minWidth: 280, padding: 18 }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.manageIcon}><Ionicons name={icon} size={20} color={theme.colors.textInverse} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.manageLabel}>{label}</Text>
        <Text style={styles.manageDesc}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  brandSmall: { fontSize: 10, color: theme.colors.textTertiary, letterSpacing: 2, fontWeight: "700" },
  topTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary },
  vendorBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.full },
  vendorBadgeText: { color: theme.colors.textInverse, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  lockedTitle: { fontSize: 22, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 16, textAlign: "center" },
  primaryBtn: { marginTop: 24, backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: theme.radius.full, alignSelf: "center" },
  primaryBtnText: { color: theme.colors.textInverse, fontWeight: "700" },
  hero: { alignItems: "center", paddingVertical: 18 },
  heroIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#E4F0D1", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: "700", color: theme.colors.textPrimary, textAlign: "center" },
  heroSub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 19, paddingHorizontal: 20 },
  benefits: { gap: 8, marginVertical: 22 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  benefitIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E4F0D1", alignItems: "center", justifyContent: "center" },
  benefitText: { flex: 1, fontSize: 13, color: theme.colors.textPrimary, fontWeight: "500" },
  lbl: { fontSize: 10, letterSpacing: 1.4, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.colors.textPrimary },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.full, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  chipTextActive: { color: theme.colors.textInverse },
  applyBtn: { marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, backgroundColor: theme.colors.primary, borderRadius: theme.radius.full },
  applyText: { color: theme.colors.textInverse, fontWeight: "700", fontSize: 15 },
  vendorCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 14 },
  vendorIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
  vendorName: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  vendorMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#E8F0E9", borderRadius: theme.radius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.textTertiary },
  statusText: { fontSize: 10, fontWeight: "700", color: theme.colors.success, textTransform: "capitalize" },
  heroCard: { backgroundColor: theme.colors.secondary, padding: 22, borderRadius: theme.radius.xl, marginBottom: 18 },
  heroLabel: { fontSize: 11, color: theme.colors.accent, fontWeight: "700", letterSpacing: 1.5 },
  heroAmount: { fontSize: 36, fontWeight: "700", color: theme.colors.textInverse, marginTop: 6, letterSpacing: -0.5 },
  heroFoot: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  heroFootText: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  heroDivider: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47.5%", padding: 16, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  statIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E4F0D1", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: "700", color: theme.colors.textPrimary, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "600", marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 24, marginBottom: 12 },
  manageRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
  manageIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
  manageLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary },
  manageDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  bookingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, marginBottom: 6, borderWidth: 1, borderColor: theme.colors.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bookingTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary },
  bookingSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  bookingPrice: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
});
