import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { theme } from "../theme";
import { useAuth } from "../AuthContext";

export type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  badge?: string | number;
};

export const WEB_BREAKPOINT = 900;

export function useIsDesktop() {
  const { width } = useWindowDimensions();
  return width >= WEB_BREAKPOINT;
}

type Props = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  accent?: "admin" | "vendor";
};

export default function WebDashboardShell({ children, title, subtitle, navItems, accent = "admin" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= WEB_BREAKPOINT;

  if (!isDesktop) {
    // Mobile: render children as-is (page handles its own mobile layout)
    return <>{children}</>;
  }

  const accentColor = accent === "admin" ? theme.colors.secondary : theme.colors.primary;
  const accentLabel = accent === "admin" ? "ADMIN" : "VENDOR";

  const handleLogout = async () => {
    await logout();
    router.replace(accent === "admin" ? "/admin/login" : "/vendor/login");
  };

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.brandBlock}>
          <View style={[styles.brandDot, { backgroundColor: accentColor }]}>
            <Ionicons name={accent === "admin" ? "shield-checkmark" : "briefcase"} size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandText}>Prostayz</Text>
            <Text style={styles.brandSub}>{accent === "admin" ? "Admin Console" : "Vendor Console"}</Text>
          </View>
        </View>

        <View style={styles.navList}>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/vendor" && pathname.startsWith(item.href));
            return (
              <TouchableOpacity
                key={item.href}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => router.push(item.href as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.navIcon, active && { backgroundColor: accentColor }]}>
                  <Ionicons name={item.icon} size={16} color={active ? "#fff" : theme.colors.textSecondary} />
                </View>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
                {item.badge !== undefined && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push("/")} activeOpacity={0.7}>
            <View style={styles.navIcon}>
              <Ionicons name="globe-outline" size={16} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.navLabel}>Back to Site</Text>
          </TouchableOpacity>

          <View style={styles.userCard}>
            <View style={[styles.userAvatar, { backgroundColor: accentColor }]}>
              <Text style={styles.userAvatarText}>
                {(user?.name || user?.email || "?").substring(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.userName} numberOfLines={1}>{user?.name || "Account"}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.main}>
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.topTitle}>{title}</Text>
            {subtitle && <Text style={styles.topSubtitle}>{subtitle}</Text>}
          </View>
          <View style={[styles.rolePill, { backgroundColor: accentColor }]}>
            <Ionicons name={accent === "admin" ? "shield-checkmark" : "briefcase"} size={12} color="#fff" />
            <Text style={styles.rolePillText}>{accentLabel}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentBox}>{children}</View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: theme.colors.bg,
    minHeight: "100%" as any,
  },
  sidebar: {
    width: 260,
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    ...(Platform.OS === "web" ? ({ position: "sticky", top: 0, height: "100vh" } as any) : {}),
  },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8, marginBottom: 28 },
  brandDot: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  brandText: { fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: 0.5 },
  brandSub: { fontSize: 11, color: theme.colors.textTertiary, fontWeight: "600", letterSpacing: 0.5, marginTop: 1 },
  navList: { gap: 4 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
  },
  navItemActive: { backgroundColor: theme.colors.muted },
  navIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: theme.colors.muted,
    alignItems: "center", justifyContent: "center",
  },
  navLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary },
  navLabelActive: { color: theme.colors.textPrimary, fontWeight: "700" },
  badge: { backgroundColor: theme.colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  sidebarFooter: { gap: 10, marginTop: 18 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
  },
  userAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  userAvatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  userName: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  userEmail: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 1 },
  logoutBtn: { padding: 6 },
  main: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 32, paddingVertical: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  topTitle: { fontSize: 22, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.3 },
  topSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  rolePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  rolePillText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 32 },
  contentBox: { maxWidth: 1280, width: "100%", alignSelf: "center" },
});
