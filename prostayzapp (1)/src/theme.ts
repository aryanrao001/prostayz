export const theme = {
  colors: {
    bg: "#FBF8EE",
    surface: "#FFFFFF",
    muted: "#F1ECDA",
    textPrimary: "#1F2A1A",
    textSecondary: "#4F5A3F",
    textTertiary: "#9BA588",
    textInverse: "#FFFFFF",
    primary: "#6F8F52",
    primaryHover: "#5C7B40",
    secondary: "#2F3E27",
    accent: "#FBE8CE",
    accentSoft: "#E4DFB5",
    sageLight: "#C3CC9B",
    sage: "#9AB17A",
    cream: "#FBE8CE",
    border: "rgba(31, 42, 26, 0.08)",
    borderMedium: "rgba(31, 42, 26, 0.18)",
    success: "#5C7B40",
    overlay: "rgba(31, 42, 26, 0.38)",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
    full: 999,
  },
  spacing: (n: number) => n * 4,
  shadow: {
    card: {
      shadowColor: "#1C1917",
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    subtle: {
      shadowColor: "#1C1917",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  },
  font: {
    heading: "System",
    body: "System",
  },
};

export type Theme = typeof theme;
