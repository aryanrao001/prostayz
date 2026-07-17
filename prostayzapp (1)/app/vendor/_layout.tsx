import React, { useEffect } from "react";
import { Stack, Slot, usePathname, useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import { theme } from "../../src/theme";
import WebDashboardShell, { WEB_BREAKPOINT, NavItem } from "../../src/components/WebDashboardShell";
import { useAuth } from "../../src/AuthContext";

const VENDOR_NAV: NavItem[] = [
  { label: "Dashboard", icon: "grid-outline", href: "/vendor" },
  { label: "My Stays", icon: "bed-outline", href: "/vendor/stays" },
  { label: "My Packages", icon: "airplane-outline", href: "/vendor/packages" },
  { label: "My Flights", icon: "paper-plane-outline", href: "/vendor/flights" },
  { label: "Bookings", icon: "receipt-outline", href: "/vendor/bookings" },
];

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/vendor": { title: "Host Dashboard", subtitle: "Track your listings, bookings & earnings" },
  "/vendor/stays": { title: "My Stays", subtitle: "Manage your properties" },
  "/vendor/packages": { title: "My Packages", subtitle: "Curate your holiday offerings" },
  "/vendor/flights": { title: "My Flights", subtitle: "Manage your flight inventory" },
  "/vendor/bookings": { title: "Bookings", subtitle: "Incoming reservations" },
};

export default function VendorLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= WEB_BREAKPOINT;
  const isLoginRoute = pathname === "/vendor/login";

  // On web/desktop: if not logged in (any role), redirect to /vendor/login
  // Non-vendor logged-in users will see the apply form inside the dashboard
  useEffect(() => {
    if (loading) return;
    if (isLoginRoute) return;
    if (!isDesktop) return;
    if (!user) {
      router.replace("/vendor/login");
    }
  }, [loading, user, isDesktop, isLoginRoute, router]);

  if (isLoginRoute) {
    return <Slot />;
  }

  if (isDesktop) {
    const meta = TITLES[pathname] || { title: "Host Console" };
    return (
      <WebDashboardShell
        title={meta.title}
        subtitle={meta.subtitle}
        navItems={VENDOR_NAV}
        accent="vendor"
      >
        <Slot />
      </WebDashboardShell>
    );
  }

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
