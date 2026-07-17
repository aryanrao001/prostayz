/**
 * Design tokens — single source of truth for the whole app.
 * Airbnb-inspired: neutral white/charcoal base, one confident accent,
 * generous whitespace, soft/short shadows, consistent radii.
 *
 * Do not hardcode colors/spacing/radii in screens — import `theme` and
 * `t()` style-shorthands from here so the whole app stays consistent
 * when tokens change.
 */
import { Platform } from "react-native";

export const theme = {
  colors: {
    // Surfaces
    bg: "#FFFFFF",
    bgAlt: "#F7F7F7",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    overlay: "rgba(15, 15, 15, 0.55)",
    scrim: "rgba(15, 15, 15, 0.18)",

    // Text
    textPrimary: "#222222",
    textSecondary: "#6A6A6A",
    textTertiary: "#9A9A9A",
    textInverse: "#FFFFFF",
    textDisabled: "#C6C6C6",

    // Brand / accent — warm coral, used sparingly (CTAs, active states, price)
    primary: "#E24B4A",
    primaryPressed: "#C13B3A",
    primarySoft: "#FCEBEB",

    // Secondary ink accent (used for headers/dark surfaces, host badges)
    ink: "#222222",
    inkSoft: "#484848",

    // Semantic
    success: "#1D9E75",
    successSoft: "#E1F5EE",
    warning: "#BA7517",
    warningSoft: "#FAEEDA",
    danger: "#C13B3A",
    dangerSoft: "#FAECE7",

    // Borders
    border: "#EBEBEB",
    borderMedium: "#DDDDDD",
    borderStrong: "#B0B0B0",

    // Ratings
    star: "#222222",
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
    // Airbnb-style shadows are short, soft, low-opacity — never heavy
    card: Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
      default: {},
    }),
    raised: Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
      default: {},
    }),
    subtle: Platform.select({
      ios: {
        shadowColor: "#000000",
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
