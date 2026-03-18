import chalk from "chalk";

/**
 * VibePay Connect Brand Colors
 * "Obsidian Calm: Luxe Tech Monetization"
 */
export const colors = {
  // Primary brand colors
  primary: "#a78bfa", // Soft purple
  primaryDark: "#8b5cf6",

  // Accent colors
  cyan: "#06b6d4",
  gold: "#fbbf24",
  auroraGreen: "#10b981",

  // Neutral colors
  obsidian: "#0f172a",
  slate: "#1e293b",
  grey: "#64748b",
  lightGrey: "#cbd5e1",

  // Status colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#06b6d4",

  // Text colors
  text: "#e2e8f0",
  muted: "#94a3b8",
};

/**
 * Icon set for consistent output
 */
export const icons = {
  success: "✅",
  warn: "⚠️",
  error: "🚫",
  info: "ℹ️",
  search: "🔎",
  rocket: "🚀",
  sparkle: "✨",
  check: "✓",
  cross: "✗",
  arrow: "→",
  dot: "•",
};

/**
 * Styled chalk instances
 */
export const styled = {
  brand: chalk.hex(colors.primary),
  brandBold: chalk.hex(colors.primary).bold,
  success: chalk.hex(colors.success),
  warning: chalk.hex(colors.warning),
  error: chalk.hex(colors.error),
  info: chalk.hex(colors.info),
  muted: chalk.hex(colors.muted),
  text: chalk.hex(colors.text),
  dim: chalk.dim,
  bold: chalk.bold,
  cyan: chalk.hex(colors.cyan),
  gold: chalk.hex(colors.gold),
};
