'use client'

import { passwordStrength, type PasswordStrength } from '@pmf/core'

const LEVELS: Record<PasswordStrength, { label: string; bars: number; color: string; text: string }> = {
  fraca: { label: 'Senha fraca', bars: 1, color: 'bg-negative', text: 'text-negative' },
  moderada: { label: 'Senha moderada', bars: 2, color: 'bg-attention', text: 'text-attention' },
  forte: { label: 'Senha forte', bars: 3, color: 'bg-positive', text: 'text-positive' },
}

/** Medidor visual de força de senha (fraca/moderada/forte) para formulários de auth. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const level = LEVELS[passwordStrength(password)]
  return (
    <div className="mb-3" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`h-1 flex-1 rounded-full ${bar <= level.bars ? level.color : 'bg-line'}`}
          />
        ))}
      </div>
      <p className={`mt-1 text-[11px] font-bold ${level.text}`}>{level.label}</p>
    </div>
  )
}
