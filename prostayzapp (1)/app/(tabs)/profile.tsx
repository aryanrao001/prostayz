import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { useAuth } from "../../src/AuthContext";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <ScrollView style={[styles.container]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120, paddingHorizontal: 20 }}>
      <Text style={styles.h1}>Profile</Text>

      {user ? (
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.first_name?.[0]?.toUpperCase() || "U"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user.first_name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>User</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.loginCta}>
          <Image source={{ uri: "https://static.prod-images.emergentagent.com/jobs/b2ca5880-2dc3-4cdc-96c9-ed68b55a540b/images/e66d7ca0df99271d0f7bdec1d483eec81afcc8d4c33c6558517143bc65344f1a.png" }} style={styles.loginImg} />
          <Text style={styles.loginTitle}>Log in to unlock trips</Text>
          <Text style={styles.loginSub}>Save favourites, book stays and track curated journeys.</Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
            <TouchableOpacity testID="profile-login-btn" style={styles.primaryBtn} onPress={() => router.push("/auth/login")}>
              <Text style={styles.primaryBtnText}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="profile-register-btn" style={styles.secondaryBtn} onPress={() => router.push("/auth/register")}>
              <Text style={styles.secondaryBtnText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {user?.role === "admin" && (
        <TouchableOpacity testID="open-admin" style={styles.adminCta} onPress={() => router.push("/admin")}>
          <View style={styles.adminCtaIcon}><Ionicons name="shield-checkmark" size={20} color={theme.colors.textInverse} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.adminCtaLabel}>Admin Console</Text>
            <Text style={styles.adminCtaDesc}>Manage stays, packages, bookings & users</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textInverse} />
        </TouchableOpacity>
      )}

      {user && (
        <TouchableOpacity testID="open-vendor" style={styles.vendorCta} onPress={() => router.push("/vendor")}>
          <View style={styles.vendorCtaIcon}><Ionicons name="briefcase" size={20} color={theme.colors.textInverse} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorCtaLabel}>
              {user.role === "vendor" || user.role === "admin" ? "Vendor Console" : "Become a host"}
            </Text>
            <Text style={styles.vendorCtaDesc}>
              {user.role === "vendor" || user.role === "admin"
                ? "Manage your listings & view bookings"
                : "List your villa, hotel or trip package"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textInverse} />
        </TouchableOpacity>
      )}

      <Text style={styles.section}>Settings</Text>
      <MenuRow icon="person-outline" label="Personal info" href="/settings/personal" />
      <MenuRow icon="card-outline" label="Payments & payouts" href="/settings/payments" />
      <MenuRow icon="notifications-outline" label="Notifications" href="/settings/notifications" />
      <MenuRow icon="lock-closed-outline" label="Privacy & security" href="/settings/privacy" />

      <Text style={styles.section}>Support</Text>
      <MenuRow icon="help-circle-outline" label="Help centre" href="/settings/help" />
      <MenuRow icon="document-text-outline" label="Terms & policies" href="/settings/terms" />
      <MenuRow icon="information-circle-outline" label="About Prostayz" href="/settings/about" />

      {user && (
        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.version}>Prostayz · v1.0</Text>
    </ScrollView>
  );
}

function MenuRow({ icon, label, href }: { icon: keyof typeof Ionicons.glyphMap; label: string; href?: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      testID={`menu-${href?.split("/").pop() || label}`}
      style={styles.menuRow}
      onPress={() => href && router.push(href as any)}
    >
      <Ionicons name={icon} size={20} color={theme.colors.textPrimary} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  h1: { fontSize: 28, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 18, letterSpacing: -0.3 },
  userCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.radius.xl,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: theme.colors.secondary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: theme.colors.textInverse, fontSize: 24, fontWeight: "700" },
  userName: { fontSize: 18, fontWeight: "600", color: theme.colors.textPrimary },
  userEmail: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  rolePill: {
    alignSelf: "flex-start", marginTop: 6,
    backgroundColor: theme.colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  roleText: { fontSize: 10, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: 0.5, textTransform: "uppercase" },
  loginCta: {
    backgroundColor: theme.colors.surface, padding: 22, borderRadius: theme.radius.xl,
    alignItems: "center",
    borderWidth: 1, borderColor: theme.colors.border,
  },
  loginImg: { width: 120, height: 120, borderRadius: theme.radius.lg, marginBottom: 14 },
  loginTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.textPrimary },
  loginSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: "center" },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radius.full },
  primaryBtnText: { color: theme.colors.textInverse, fontWeight: "700" },
  secondaryBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.borderMedium,
  },
  secondaryBtnText: { color: theme.colors.textPrimary, fontWeight: "700" },
  section: { fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 1.2, marginTop: 28, marginBottom: 10, textTransform: "uppercase" },
  menuRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, paddingHorizontal: 14,
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.md,
    marginBottom: 6, borderWidth: 1, borderColor: theme.colors.border,
  },
  menuLabel: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, fontWeight: "500" },
  logoutBtn: {
    marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14,
    borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.primary,
  },
  logoutText: { color: theme.colors.primary, fontWeight: "700", fontSize: 14 },
  adminCta: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 20, padding: 16,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.lg,
  },
  adminCtaIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  adminCtaLabel: { fontSize: 15, fontWeight: "700", color: theme.colors.textInverse },
  adminCtaDesc: { fontSize: 11, color: theme.colors.accent, marginTop: 2 },
  vendorCta: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 10, padding: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
  },
  vendorCtaIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    alignItems: "center", justifyContent: "center",
  },
  vendorCtaLabel: { fontSize: 15, fontWeight: "700", color: theme.colors.textInverse },
  vendorCtaDesc: { fontSize: 11, color: theme.colors.accent, marginTop: 2 },
  version: { marginTop: 24, textAlign: "center", fontSize: 11, color: theme.colors.textTertiary },
});
