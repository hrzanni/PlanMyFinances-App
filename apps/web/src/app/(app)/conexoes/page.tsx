import { PageHeader } from '@/components/page-header'

/**
 * Conexões (Open Finance via Meu Pluggy) — a integração chega na fase 4.
 * Esta tela já explica o fluxo e o pré-requisito de credenciais.
 */
export default function ConnectionsPage() {
  return (
    <>
      <PageHeader
        title="Conexões"
        subtitle="Sincronize transações das suas contas via Open Finance (Meu Pluggy), gratuitamente."
      />

      <div className="max-w-2xl space-y-4">
        <div className="rounded-xl border border-dashed border-line bg-surface p-6 text-center">
          <b className="text-sm text-foreground">Integração em preparação</b>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
            Para ativar: crie sua conta gratuita em meu.pluggy.ai, conecte seus bancos por lá e
            gere as credenciais de desenvolvimento. Depois, preencha PLUGGY_CLIENT_ID e
            PLUGGY_CLIENT_SECRET no ambiente da API.
          </p>
        </div>

        <div className="rounded-r-lg border-l-4 border-info bg-info/5 px-4 py-3 text-xs text-body">
          <b className="text-foreground">Como funciona a segurança:</b> você nunca informa sua senha
          bancária aqui. A conexão é aprovada dentro do app do seu banco (Open Finance regulado pelo
          Banco Central) e pode ser revogada a qualquer momento. Este app apenas lê transações — não
          movimenta dinheiro.
        </div>
      </div>
    </>
  )
}
