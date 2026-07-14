'use client'

import { bankPresetInfo } from '@pmf/core'

/** Marca do banco do cartão (fase 8.2): monograma nas cores da marca, sem asset externo. */
export function BankLogo({ preset, size = 32 }: { preset: string; size?: number }) {
  const info = bankPresetInfo(preset)
  return (
    <span
      aria-label={info.label}
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-black"
      style={{
        width: size,
        height: size,
        backgroundColor: info.color,
        color: info.markColor,
        fontSize: size * 0.4,
      }}
    >
      {info.mark}
    </span>
  )
}
