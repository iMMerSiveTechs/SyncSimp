import chalk from 'chalk';

/**
 * SyncSimp Brand Theme
 * Inspired by the obsidian/deep purple aesthetic with calm, luxe vibes
 */

export const colors = {
  // Primary brand colors
  primary: '#8B5CF6',      // Soft purple
  primaryDark: '#6D28D9',  // Deep purple
  accent: '#06B6D4',       // Cyan
  accentGold: '#FBBF24',   // Soft gold

  // Status colors
  success: '#10B981',      // Aurora green
  warning: '#F59E0B',      // Soft yellow/amber
  error: '#EF4444',        // Red

  // Text colors
  heading: '#E9D5FF',      // Light purple
  label: '#C4B5FD',        // Lighter purple
  text: '#D1D5DB',         // Light grey
  muted: '#9CA3AF',        // Grey

  // Background
  bg: '#0F172A',           // Obsidian/slate
  bgAlt: '#1E293B'         // Dark slate
};

export const icons = {
  success: '✅',
  warn: '⚠️',
  error: '🚫',
  info: 'ℹ️',
  search: '🔎',
  rocket: '🚀',
  sparkle: '✨',
  check: '✓',
  cross: '✗',
  arrow: '→',
  bullet: '•'
};

// Chalk styled functions
export const styled = {
  heading: chalk.hex(colors.heading).bold,
  label: chalk.hex(colors.label),
  text: chalk.hex(colors.text),
  muted: chalk.hex(colors.muted),
  primary: chalk.hex(colors.primary),
  success: chalk.hex(colors.success),
  warning: chalk.hex(colors.warning),
  error: chalk.hex(colors.error),
  brand: chalk.hex(colors.primary).bold,
  dim: chalk.dim
};
