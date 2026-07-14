import type { Gender } from '@pmf/schemas'

/** Opções de gênero (valores canônicos em @pmf/schemas, rótulos PT-BR). */
export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'outro', label: 'Outro' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
]
