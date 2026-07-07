/** Tokens Nexforce — espelha apps/web/tailwind.config.ts (claro como base, dark: overrides) */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#F5F5F5',
        surface: '#FFFFFF',
        foreground: '#0C0E0E',
        body: '#515151',
        muted: '#777777',
        line: '#E4E4E2',
        navy: '#303F63',
        info: '#215A9F',
        positive: '#2D6E44',
        negative: '#BA1925',
        attention: '#8A7414',
        sidebar: '#0C0E0E',
        'background-dark': '#0C0E0E',
        'surface-dark': '#161919',
        'foreground-dark': '#FFFFFF',
        'body-dark': '#C7C7C5',
        'muted-dark': '#9C9B9B',
        'line-dark': '#292D2D',
        'navy-dark': '#8FA3D1',
        'info-dark': '#7FB0E8',
        'positive-dark': '#5CBF8B',
        'negative-dark': '#F0707A',
        'attention-dark': '#D8B523',
      },
    },
  },
  plugins: [],
}
