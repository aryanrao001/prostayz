import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { theme } from "../../theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
  bordered?: boolean;
}

export function Card({ children, style, padded = true, elevated = false, bordered = true }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        padded && { padding: theme.space(4) },
        bordered && { borderWidth: 1, borderColor: theme.colors.border },
        elevated && theme.shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
  },
});
