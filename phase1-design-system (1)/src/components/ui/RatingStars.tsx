import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";

interface RatingStarsProps {
  /** e.g. properties.average_rating */
  rating: number;
  /** e.g. properties.total_reviews */
  reviewCount?: number;
  size?: number;
  showValue?: boolean;
}

export function RatingStars({ rating, reviewCount, size = 13, showValue = true }: RatingStarsProps) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={size} color={theme.colors.star} />
      {showValue && <Text style={[styles.value, { fontSize: size }]}>{rating.toFixed(2)}</Text>}
      {typeof reviewCount === "number" && (
        <Text style={[styles.count, { fontSize: size }]}>
          {" "}
          · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  value: { marginLeft: 4, fontWeight: "700", color: theme.colors.textPrimary },
  count: { color: theme.colors.textSecondary, fontWeight: "400" },
});
