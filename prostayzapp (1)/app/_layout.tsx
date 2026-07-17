import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FDFCF8" } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="stay/[id]" options={{ presentation: "card", animation: "slide_from_right" }} />
          <Stack.Screen name="package/[id]" options={{ presentation: "card", animation: "slide_from_right" }} />
          <Stack.Screen name="auth/login" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="auth/register" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="search" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="ai" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="settings/[page]" options={{ presentation: "card", animation: "slide_from_right" }} />
          <Stack.Screen name="admin" options={{ presentation: "card", animation: "slide_from_right" }} />
          <Stack.Screen name="vendor" options={{ presentation: "card", animation: "slide_from_right" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
