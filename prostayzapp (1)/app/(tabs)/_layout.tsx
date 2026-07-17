import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../src/theme";

function AiFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 20 }]}
    >
      <TouchableOpacity
        testID="ai-fab"
        activeOpacity={0.88}
        onPress={() => router.push("/ai")}
        style={[styles.fab, { bottom: insets.bottom + 92 }]}
      >
        <View style={styles.fabInner}>
          <Ionicons name="sparkles" size={22} color={theme.colors.textInverse} />
        </View>
        <View style={styles.fabLabelWrap}>
          <Text style={styles.fabLabel}>Ask Roamie</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textTertiary,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
          tabBarStyle: {
            position: "absolute",
            borderTopColor: theme.colors.border,
            backgroundColor: Platform.OS === "ios" ? "transparent" : "#FFFFFFEE",
            height: 74,
            paddingTop: 8,
            paddingBottom: Platform.OS === "ios" ? 22 : 12,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFFF2" }]} />
            ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            title: "Wishlist",
            tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: "Trips",
            tabBarIcon: ({ color, size }) => <Ionicons name="airplane-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
          }}
        />
      </Tabs>
      <AiFab />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    alignItems: "center",
  },
  fabInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: theme.colors.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: theme.colors.secondary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  fabLabelWrap: {
    marginTop: 6,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
  },
  fabLabel: { color: theme.colors.textInverse, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
});
