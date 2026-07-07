import type { Config } from 'tailwindcss'

/**
 * Tokens do tema Nexforce (spec amendment 2026-07-06, seção 6).
 * As cores reais vivem em CSS variables (globals.css) para suportar claro/escuro.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui-web/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        body: 'rgb(var(--body) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        navy: 'rgb(var(--navy) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        positive: 'rgb(var(--positive) / <alpha-value>)',
        negative: 'rgb(var(--negative) / <alpha-value>)',
        attention: 'rgb(var(--attention) / <alpha-value>)',
        sidebar: 'rgb(var(--sidebar) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-lato)', 'Calibri', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
