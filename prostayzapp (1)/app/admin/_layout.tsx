import React, { useEffect } from "react";
import { Stack, Slot, usePathname, useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import { theme } from "../../src/theme";
import WebDashboardShell, { WEB_BREAKPOINT, NavItem } from "../../src/components/WebDashboardShell";
import { useAuth } from "../../src/AuthContext";

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", icon: "grid-outline", href: "/admin" },
  { label: "Stays / Villas", icon: "bed-outline", href: "/admin/stays" },
  { label: "Packages", icon: "airplane-outline", href: "/admin/packages" },
  { label: "Flights", icon: "paper-plane-outline", href: "/admin/flights" },
  { label: "Bookings", icon: "receipt-outline", href: "/admin/bookings" },
  { label: "Users", icon: "people-outline", href: "/admin/users" },
  { label: "Settings", icon: "settings-outline", href: "/admin/settings" },
];

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/admin": { title: "Dashboard", subtitle: "Overview of your platform's performance" },
  "/admin/stays": { title: "Stays / Villas", subtitle: "Manage all properties on the platform" },
  "/admin/packages": { title: "Holiday Packages", subtitle: "Curate trips and itineraries" },
  "/admin/flights": { title: "Flights", subtitle: "Manage airline routes and inventory" },
  "/admin/bookings": { title: "Bookings", subtitle: "Track and update order status" },
  "/admin/users": { title: "Users", subtitle: "View signed-up travellers" },
  "/admin/settings": { title: "Settings", subtitle: "Payment gateway, API keys & branding" },
};

export default function AdminLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= WEB_BREAKPOINT;
  const isLoginRoute = pathname === "/admin/login";

  // On web/desktop: if not admin, redirect to /admin/login
  useEffect(() => {
    if (loading) return;
    if (isLoginRoute) return;
    if (!isDesktop) return; // mobile uses its own auth UI
    if (!user || user.role !== "admin") {
      router.replace("/admin/login");
    }
  }, [loading, user, isDesktop, isLoginRoute, router]);

  // Login route renders standalone, no shell
  if (isLoginRoute) {
    return <Slot />;
  }

  if (isDesktop) {
    const meta = TITLES[pathname] || { title: "Admin Console" };
    return (
      <WebDashboardShell
        title={meta.title}
        subtitle={meta.subtitle}
        navItems={ADMIN_NAV}
        accent="admin"
      >
        <Slot />
      </WebDashboardShell>
    );
  }

  // Mobile: use original Stack
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
        animation: "slide_from_right",
      }}
    />
  );
}
