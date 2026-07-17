import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<Size, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 36, paddingH: 14, fontSize: 13 },
  md: { height: 48, paddingH: 20, fontSize: 15 },
  lg: { height: 56, paddingH: 24, fontSize: 16 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading,
  disabled,
  fullWidth,
  style,
}: ButtonProps) {
  const s = SIZE_MAP[size];
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? theme.colors.primary
      : variant === "danger"
      ? theme.colors.danger
      : variant === "secondary"
      ? theme.colors.ink
      : "transparent";

  const border =
    variant === "outline" ? theme.colors.borderStrong : variant === "ghost" ? "transparent" : bg;

  const textColor =
    variant === "outline" || variant === "ghost" ? theme.colors.textPrimary : theme.colors.textInverse;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.paddingH,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === "outline" ? 1 : 0,
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && (
            <Ionicons name={icon} size={s.fontSize + 3} color={textColor} style={{ marginRight: 8 }} />
          )}
          <Text style={[styles.label, { color: textColor, fontSize: s.fontSize }]} numberOfLines={1}>
            {label}
          </Text>
          {icon && iconPosition === "right" && (
            <Ionicons name={icon} size={s.fontSize + 3} color={textColor} style={{ marginLeft: 8 }} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "700" },
});
