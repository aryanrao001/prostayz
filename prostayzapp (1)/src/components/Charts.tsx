import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Line, Rect, G, Text as SvgText } from "react-native-svg";
import { theme } from "../theme";

type LinePoint = { label: string; value: number };

export function LineChart({ data, width = 320, height = 160, color = theme.colors.primary, label = "Revenue" }: { data: LinePoint[]; width?: number; height?: number; color?: string; label?: string }) {
  if (!data || data.length === 0) return <View style={{ height, width }} />;
  const maxV = Math.max(1, ...data.map((d) => d.value));
  const padding = 30;
  const gW = width - padding * 2;
  const gH = height - padding * 2;
  const step = gW / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => ({
    x: padding + i * step,
    y: padding + gH - (d.value / maxV) * gH,
    v: d.value,
    l: d.label,
  }));
  const path = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const area = `${path} L ${pts[pts.length - 1].x} ${padding + gH} L ${pts[0].x} ${padding + gH} Z`;
  return (
    <View>
      <Text style={styles.chartLabel}>{label}</Text>
      <Svg width={width} height={height}>
        <Path d={area} fill={color} opacity={0.15} />
        <Path d={path} stroke={color} strokeWidth={2.5} fill="none" />
        {pts.map((p, i) => (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke={color} strokeWidth={2} />
            <SvgText x={p.x} y={height - 8} fontSize={10} fill={theme.colors.textSecondary} textAnchor="middle">
              {p.l}
            </SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
}

type BarPoint = { label: string; value: number; color?: string };

export function BarChart({ data, width = 320, height = 180, label = "" }: { data: BarPoint[]; width?: number; height?: number; label?: string }) {
  if (!data || data.length === 0) return <View style={{ height, width }} />;
  const maxV = Math.max(1, ...data.map((d) => d.value));
  const padding = 30;
  const gW = width - padding * 2;
  const gH = height - padding * 2;
  const barW = Math.max(10, gW / data.length - 12);
  return (
    <View>
      {label && <Text style={styles.chartLabel}>{label}</Text>}
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const h = (d.value / maxV) * gH;
          const x = padding + i * (gW / data.length) + (gW / data.length - barW) / 2;
          const y = padding + gH - h;
          return (
            <G key={i}>
              <Rect x={x} y={y} width={barW} height={h} fill={d.color || theme.colors.primary} rx={6} />
              <SvgText x={x + barW / 2} y={y - 6} fontSize={10} fill={theme.colors.textPrimary} textAnchor="middle" fontWeight="700">
                {d.value}
              </SvgText>
              <SvgText x={x + barW / 2} y={height - 8} fontSize={10} fill={theme.colors.textSecondary} textAnchor="middle">
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

type PiePoint = { label: string; value: number; color: string };

export function PieChart({ data, size = 160 }: { data: PiePoint[]; size?: number }) {
  if (!data || data.length === 0) return <View style={{ width: size, height: size }} />;
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const a = (d.value / total) * Math.PI * 2;
    const start = angle;
    const end = angle + a;
    angle = end;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const largeArc = a > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { path, color: d.color, label: d.label, value: d.value, pct: Math.round((d.value / total) * 100) };
  });
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => <Path key={i} d={s.path} fill={s.color} />)}
        <Circle cx={cx} cy={cy} r={radius * 0.55} fill={theme.colors.surface} />
        <SvgText x={cx} y={cy} fontSize={14} fontWeight="700" fill={theme.colors.textPrimary} textAnchor="middle">
          {total}
        </SvgText>
        <SvgText x={cx} y={cy + 14} fontSize={9} fill={theme.colors.textSecondary} textAnchor="middle">
          Total
        </SvgText>
      </Svg>
      <View style={{ flex: 1, gap: 6 }}>
        {slices.map((s, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
            <Text style={styles.legendValue}>{s.value} ({s.pct}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartLabel: { fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 0.5, marginLeft: 4, marginBottom: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 11, color: theme.colors.textPrimary, fontWeight: "600" },
  legendValue: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "700" },
});
