/**
 * Design tokens — single source of truth for the whole app.
 * Brand: sage green + warm cream (from app icon / splash / adaptive-icon assets).
 * Layout language is Airbnb-inspired (whitespace, soft shadows, pill buttons,
 * consistent radii) but the palette is Prostayz's own — not a copy of Airbnb's colors.
 *
 * Do not hardcode colors/spacing/radii in screens — import `theme` from here
 * so the whole app stays consistent when tokens change.
 */
import { Platform } from "react-native";

export const theme = {
  colors: {
    // Surfaces
    bg: "#FFFFFF",
    bgAlt: "#FAF9F5",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    overlay: "rgba(31, 42, 26, 0.55)",
    scrim: "rgba(31, 42, 26, 0.18)",

    // Text
    textPrimary: "#1F2A1A",
    textSecondary: "#5B6B4F",
    textTertiary: "#9BA588",
    textInverse: "#FFFFFF",
    textDisabled: "#C7CFC1",

    // Brand — sage green (primary action / active states)
    primary: "#6F8F52",
    primaryPressed: "#5C7B40",
    primarySoft: "#E4F0D1",

    // Warm cream accent — badges, highlights, price tags, secondary surfaces
    accent: "#FBE8CE",
    accentStrong: "#F4D9A8",

    // Deep ink green — dark surfaces, headers, host badges (was "secondary")
    ink: "#2F3E27",
    inkSoft: "#3F5033",

    // Semantic
    success: "#5C7B40",
    successSoft: "#E4F0D1",
    warning: "#B3452E",
    warningSoft: "#FBE9E3",
    danger: "#B3452E",
    dangerSoft: "#FBE9E3",

    // Borders
    border: "rgba(31, 42, 26, 0.10)",
    borderMedium: "rgba(31, 42, 26, 0.18)",
    borderStrong: "rgba(31, 42, 26, 0.32)",

    // Ratings
    star: "#1F2A1A",
  },

  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 999,
  },

  space: (n: number) => n * 4, // usage: theme.space(4) === 16

  type: {
    display: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
    h1: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
    h2: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
    h3: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
    body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
    bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" as const },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
    captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
    micro: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const },
  },

  shadow: {
    card: Platform.select({
      ios: {
        shadowColor: "#1F2A1A",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
      default: {},
    }),
    raised: Platform.select({
      ios: {
        shadowColor: "#1F2A1A",
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
      default: {},
    }),
    subtle: Platform.select({
      ios: {
        shadowColor: "#1F2A1A",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
      default: {},
    }),
  },

  font: {
    heading: "System",
    body: "System",
  },
};

export type Theme = typeof theme;
