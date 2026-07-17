import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Input({ label, error, icon, style, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          focused && { borderColor: theme.colors.ink },
          !!error && { borderColor: theme.colors.danger },
        ]}
      >
        {icon && <Ionicons name={icon} size={18} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />}
        <TextInput
          placeholderTextColor={theme.colors.textTertiary}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  label: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderMedium,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
  },
  input: { flex: 1, fontSize: 15, color: theme.colors.textPrimary },
  error: { fontSize: 12, color: theme.colors.danger, marginTop: 4 },
});
