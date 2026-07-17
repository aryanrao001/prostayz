import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Chip({ label, selected, onPress, icon }: ChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.unselected]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? theme.colors.textInverse : theme.colors.textSecondary}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.label, { color: selected ? theme.colors.textInverse : theme.colors.textPrimary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 36,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  selected: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink },
  unselected: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  label: { fontSize: 13, fontWeight: "600" },
});
