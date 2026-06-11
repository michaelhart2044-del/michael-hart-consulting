/**
 * Brand Tokens
 * 
 * Centralized source of truth for the MH Consulting premium dark + gold palette.
 * Keep in sync with the CSS variables in app/globals.css (and @theme mappings).
 * 
 * Usage:
 *   import { colors } from '@/lib/brand-tokens';
 *   <div style={{ color: colors.accent }} />
 *   or with Tailwind after @theme: text-accent bg-card etc.
 */

export const colors = {
  background: '#0a0f2c',      // Deep navy - primary bg
  card: '#0f172a',            // Secondary navy - cards & sections
  foreground: '#f1f5f9',      // Primary text
  muted: '#94a3b8',           // Secondary / supporting text
  subtle: '#64748b',          // Subtlest text / placeholders
  accent: '#c5a46e',          // Signature elegant gold
  accentHover: '#d4b57e',     // Gold on hover / active states
  border: 'rgba(255, 255, 255, 0.1)',
} as const;

export const typography = {
  fontSans: 'var(--font-geist-sans)',
  fontMono: 'var(--font-geist-mono)',
} as const;

// Convenience re-exports
export const accent = colors.accent;
export const accentHover = colors.accentHover;
export const background = colors.background;
export const card = colors.card;

export type BrandColors = typeof colors;
