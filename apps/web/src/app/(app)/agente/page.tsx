import { PageHeader } from '@/components/page-header'

/** Tela do agente: só a interface, sem funcionalidade (FR-130/131). */
export default function AgentPage() {
  return (
    <>
      <PageHeader title="Agente" />

      <div className="mx-auto max-w-xl">
        <div className="mb-5 rounded-xl border border-dashed border-line bg-surface p-4 text-center">
          <b className="text-sm text-foreground">Em breve</b>
          <p className="mt-1 text-xs text-muted">
            Converse com suas finanças por chat — e futuramente pelo WhatsApp. Prévia da interface
            abaixo.
          </p>
        </div>

        <div className="space-y-3 opacity-55" aria-hidden>
          <div className="ml-auto max-w-[82%] rounded-xl rounded-br-sm bg-foreground px-4 py-2.5 text-sm text-background">
            Quanto gastei com alimentação em junho?
          </div>
          <div className="max-w-[82%] rounded-xl rounded-bl-sm border border-line bg-surface px-4 py-2.5 text-sm text-body">
            Em junho você gastou <b className="text-foreground">R$ 842,30</b> com Alimentação — 12%
            a menos que em maio. O maior gasto foi Mercado (R$ 310,45).
          </div>
          <div className="ml-auto max-w-[82%] rounded-xl rounded-br-sm bg-foreground px-4 py-2.5 text-sm text-background">
            E o aluguel de julho, já foi pago?
          </div>
          <div className="max-w-[82%] rounded-xl rounded-bl-sm border border-line bg-surface px-4 py-2.5 text-sm text-body">
            Sim — o Aluguel (R$ 1.850,00) foi marcado como pago em 05/07 e a despesa já está no seu
            histórico.
          </div>
        </div>

        <div className="mt-5 flex gap-2 opacity-55">
          <input
            disabled
            placeholder="Pergunte sobre suas finanças…"
            className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-muted"
          />
          <button
            disabled
            className="cursor-not-allowed rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background opacity-60"
          >
            Enviar
          </button>
        </div>
      </div>
    </>
  )
}
