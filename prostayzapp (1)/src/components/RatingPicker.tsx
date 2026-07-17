import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

type Props = {
  value: number;
  onChange: (n: number) => void;
  label?: string;
  max?: number;
  step?: number;
};

export default function RatingPicker({ value, onChange, label = "Rating", max = 5, step = 0.1 }: Props) {
  const clamp = (n: number) => Math.max(0, Math.min(max, n));
  const set = (n: number) => onChange(Math.round(clamp(n) * 10) / 10);

  // Build star display
  const stars = [];
  for (let i = 1; i <= max; i++) {
    const filled = value >= i;
    const half = !filled && value >= i - 0.5;
    stars.push(
      <TouchableOpacity key={i} onPress={() => set(i)} activeOpacity={0.7} testID={`rating-star-${i}`}>
        <Ionicons
          name={filled ? "star" : half ? "star-half" : "star-outline"}
          size={28}
          color={filled || half ? "#F4B400" : theme.colors.borderMedium}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={styles.row}>
        <View style={styles.starsRow}>{stars}</View>
        <View style={styles.valueBox}>
          <TextInput
            value={String(value)}
            onChangeText={(t) => {
              const n = parseFloat(t);
              if (!isNaN(n)) set(n);
              else if (t === "" || t === ".") onChange(0);
            }}
            keyboardType="decimal-pad"
            style={styles.valueInput}
            maxLength={3}
          />
          <Text style={styles.valueMax}>/ {max}</Text>
        </View>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => set(value - step)} style={styles.adjBtn}>
          <Ionicons name="remove" size={16} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.hint}>Drag stars or type — customer reviews will average around this baseline.</Text>
        <TouchableOpacity onPress={() => set(value + step)} style={styles.adjBtn}>
          <Ionicons name="add" size={16} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: "700", letterSpacing: 0.8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  starsRow: { flexDirection: "row", gap: 4, flex: 1 },
  valueBox: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: theme.colors.muted, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  valueInput: {
    fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary,
    minWidth: 32, textAlign: "center",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  valueMax: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600" },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  adjBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  hint: { flex: 1, fontSize: 10, color: theme.colors.textTertiary, fontStyle: "italic", textAlign: "center" },
});
