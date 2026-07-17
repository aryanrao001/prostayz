import React from "react";
import { Stack } from "expo-router";
import { theme } from "../../src/theme";

export default function ListingsLayout() {
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
