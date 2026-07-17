import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";
import { useAuth } from "../../src/AuthContext";
import { useIsDesktop } from "../../src/components/WebDashboardShell";
import { LineChart, PieChart, BarChart } from "../../src/components/Charts";

type Stats = {
  totals: {
    bookings: number; revenue: number; confirmed: number; cancelled: number;
    users: number; stays: number; packages: number; reviews: number;
  };
  top_items: { item_type: string; item_id: string; item_title: string; bookings: number }[];
  recent_bookings: any[];
};

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        api<Stats>("/admin/stats", { auth: true }),
        api<any>("/admin/analytics", { auth: true }).catch(() => null),
      ]);
      setStats(s);
      setAnalytics(a);
    } catch (e) { console.warn(e); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

  if (user?.role !== "admin") {
    // On desktop, the layout already redirects to /admin/login; render nothing
    if (isDesktop) return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60, padding: 24 }]}>
        <Ionicons name="lock-closed" size={48} color={theme.colors.primary} />
        <Text style={styles.lockedTitle}>Admin only</Text>
        <Text style={styles.lockedSub}>You don't have permission to view this area.</Text>
        <TouchableOpacity onPress={() => router.push("/admin/login")} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Log in as admin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Build dashboard content (shared between mobile + desktop)
  const renderContent = () => {
    if (loading || !stats) {
      return <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} />;
    }
    return (
      <>
        <View style={[styles.heroCard, isDesktop && styles.heroCardWide]}>
          <Text style={styles.heroLabel}>TOTAL REVENUE</Text>
          <Text style={[styles.heroAmount, isDesktop && { fontSize: 44 }]}>₹{stats.totals.revenue.toLocaleString()}</Text>
          <View style={styles.heroFoot}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="trending-up" size={12} color={theme.colors.accent} />
              <Text style={styles.heroFootText}>{stats.totals.bookings} bookings</Text>
            </View>
            <View style={styles.heroDivider} />
            <Text style={styles.heroFootText}>{stats.totals.confirmed} confirmed</Text>
            {stats.totals.cancelled > 0 && (
              <>
                <View style={styles.heroDivider} />
                <Text style={styles.heroFootText}>{stats.totals.cancelled} cancelled</Text>
              </>
            )}
          </View>
        </View>

        <View style={[styles.statsGrid, isDesktop && styles.statsGridWide]}>
          <StatCard icon="bed-outline" label="Stays" value={stats.totals.stays} onPress={() => router.push("/admin/stays")} isDesktop={isDesktop} />
          <StatCard icon="airplane-outline" label="Packages" value={stats.totals.packages} onPress={() => router.push("/admin/packages")} isDesktop={isDesktop} />
          <StatCard icon="receipt-outline" label="Bookings" value={stats.totals.bookings} onPress={() => router.push("/admin/bookings")} isDesktop={isDesktop} />
          <StatCard icon="people-outline" label="Users" value={stats.totals.users} onPress={() => router.push("/admin/users")} isDesktop={isDesktop} />
        </View>

        <Text style={styles.sectionTitle}>Manage catalog</Text>
        <View style={[isDesktop ? styles.manageGridWide : { gap: 10 }]}>
          <ManageRow icon="bed" label="Stays / Villas / Hotels" desc="Add, edit or remove properties" onPress={() => router.push("/admin/stays")} testID="manage-stays" isDesktop={isDesktop} />
          <ManageRow icon="airplane" label="Holiday Packages" desc="Curate trips and itineraries" onPress={() => router.push("/admin/packages")} testID="manage-packages" isDesktop={isDesktop} />
          <ManageRow icon="paper-plane" label="Flights" desc="Add airlines and routes" onPress={() => router.push("/admin/flights")} testID="manage-flights" isDesktop={isDesktop} />
          <ManageRow icon="receipt" label="All Bookings" desc="Track and update order status" onPress={() => router.push("/admin/bookings")} testID="manage-bookings" isDesktop={isDesktop} />
          <ManageRow icon="people" label="Users" desc="View signed-up travellers" onPress={() => router.push("/admin/users")} testID="manage-users" isDesktop={isDesktop} />
          <ManageRow icon="settings" label="Settings" desc="API keys, payment & branding" onPress={() => router.push("/admin/settings")} testID="manage-settings" isDesktop={isDesktop} />
        </View>

        {analytics && (
          <>
            <Text style={styles.sectionTitle}>Analytics</Text>
            <View style={isDesktop ? { flexDirection: "row", gap: 16, flexWrap: "wrap" } : { gap: 16 }}>
              <View style={[styles.chartCard, isDesktop && { flex: 1, minWidth: 380 }]}>
                <LineChart
                  data={analytics.revenue_trend.map((d: any) => ({ label: d.label, value: d.revenue }))}
                  width={isDesktop ? 460 : 320}
                  height={isDesktop ? 200 : 160}
                  color={theme.colors.primary}
                  label="REVENUE TREND · LAST 7 DAYS"
                />
              </View>
              <View style={[styles.chartCard, isDesktop && { flex: 1, minWidth: 360 }]}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 0.5, marginBottom: 10 }}>BOOKINGS BY TYPE</Text>
                <PieChart data={analytics.bookings_by_type} size={140} />
              </View>
              <View style={[styles.chartCard, isDesktop && { flex: 1, minWidth: 360 }]}>
                <BarChart
                  data={analytics.bookings_by_status}
                  width={isDesktop ? 380 : 320}
                  height={180}
                  label="BOOKINGS BY STATUS"
                />
              </View>
            </View>
          </>
        )}

        {stats.top_items.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Best sellers</Text>
            {stats.top_items.map((t, i) => (
              <View key={i} style={styles.topRow}>
                <View style={styles.topRank}><Text style={styles.topRankText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topTitle2} numberOfLines={1}>{t.item_title}</Text>
                  <Text style={styles.topSub}>{t.item_type === "stay" ? "Stay" : "Holiday package"} · {t.item_id}</Text>
                </View>
                <View style={styles.topBookings}>
                  <Text style={styles.topBookingsNum}>{t.bookings}</Text>
                  <Text style={styles.topBookingsLbl}>{t.bookings === 1 ? "booking" : "bookings"}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {stats.recent_bookings.length > 0 && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 26, marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Recent orders</Text>
              <TouchableOpacity onPress={() => router.push("/admin/bookings")}>
                <Text style={styles.viewAll}>View all</Text>
              </TouchableOpacity>
            </View>
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

  // On desktop: WebDashboardShell wraps content; render plain View
  if (isDesktop) {
    return <View>{renderContent()}</View>;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="admin-back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.brandSmall}>Prostayz</Text>
          <Text style={styles.topTitle}>Admin Console</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={12} color={theme.colors.textInverse} />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.colors.primary} />}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, onPress, isDesktop }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; onPress: () => void; isDesktop?: boolean }) {
  return (
    <TouchableOpacity testID={`stat-${label.toLowerCase()}`} style={[styles.statCard, isDesktop && styles.statCardWide]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.statIcon}><Ionicons name={icon} size={18} color={theme.colors.primary} /></View>
      <Text style={[styles.statValue, isDesktop && { fontSize: 32 }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ManageRow({ icon, label, desc, onPress, testID, isDesktop }: { icon: keyof typeof Ionicons.glyphMap; label: string; desc: string; onPress: () => void; testID?: string; isDesktop?: boolean }) {
  return (
    <TouchableOpacity testID={testID} style={[styles.manageRow, isDesktop && styles.manageRowWide]} onPress={onPress} activeOpacity={0.85}>
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
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.full,
  },
  adminBadgeText: { color: theme.colors.textInverse, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  lockedTitle: { fontSize: 22, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 16 },
  lockedSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: "center" },
  primaryBtn: { marginTop: 24, backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: theme.radius.full },
  primaryBtnText: { color: theme.colors.textInverse, fontWeight: "700" },
  heroCard: {
    backgroundColor: theme.colors.secondary,
    padding: 22, borderRadius: theme.radius.xl,
    marginBottom: 18,
  },
  heroCardWide: { padding: 32, marginBottom: 24 },
  heroLabel: { fontSize: 11, color: theme.colors.accent, fontWeight: "700", letterSpacing: 1.5 },
  heroAmount: { fontSize: 36, fontWeight: "700", color: theme.colors.textInverse, marginTop: 6, letterSpacing: -0.5 },
  heroFoot: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  heroFootText: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  heroDivider: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statsGridWide: { gap: 16 },
  statCard: {
    width: "47.5%", padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statCardWide: { width: 220, flexGrow: 1, padding: 22 },
  statIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E4F0D1", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: "700", color: theme.colors.textPrimary, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "600", marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 26, marginBottom: 12 },
  manageRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  manageRowWide: { padding: 18, flex: 1, minWidth: 280 },
  manageGridWide: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  chartCard: { padding: 20, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, marginTop: 8 },
  manageIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
  manageLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary },
  manageDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  topRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md, marginBottom: 6,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  topRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.accent, alignItems: "center", justifyContent: "center" },
  topRankText: { fontSize: 12, fontWeight: "800", color: theme.colors.textPrimary },
  topTitle2: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary },
  topSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  topBookings: { alignItems: "flex-end" },
  topBookingsNum: { fontSize: 18, fontWeight: "700", color: theme.colors.primary },
  topBookingsLbl: { fontSize: 9, color: theme.colors.textSecondary, fontWeight: "600", letterSpacing: 0.5 },
  viewAll: { fontSize: 12, color: theme.colors.primary, fontWeight: "700" },
  bookingRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md, marginBottom: 6,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bookingTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary },
  bookingSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  bookingPrice: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
});
