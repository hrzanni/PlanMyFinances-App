'use client'

import { useTheme } from 'next-themes'

/**
 * Cores de gráfico resolvidas em hex por tema. Necessário porque o Recharts
 * escreve `fill`/`stroke` como atributo SVG, onde `var()` CSS não resolve.
 */
export function useChartColors() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  return {
    positive: dark ? '#5CBF8B' : '#2D6E44',
    negative: dark ? '#F0707A' : '#BA1925',
    navy: dark ? '#8FA3D1' : '#303F63',
    line: dark ? '#292D2D' : '#E4E4E2',
    surface: dark ? '#161919' : '#FFFFFF',
    muted: dark ? '#9C9B9B' : '#777777',
  }
}
