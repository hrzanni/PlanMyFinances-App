import { Resend } from 'resend'

interface ResetEmail {
  to: string
  url: string
}

/**
 * Envia o email de recuperação de senha via Resend (FR-062).
 * Sem RESEND_API_KEY (dev local), loga a URL no console em vez de enviar.
 */
export async function sendResetPasswordEmail({ to, url }: ResetEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[DEV MODE] link de reset de senha para ${to}: ${url}`)
    return
  }
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'PlanMyFinances <onboarding@resend.dev>',
    to,
    subject: 'Redefinição de senha — PlanMyFinances',
    html: [
      '<p>Você pediu para redefinir sua senha no PlanMyFinances.</p>',
      `<p><a href="${url}">Clique aqui para criar uma nova senha</a>. O link expira em 1 hora.</p>`,
      '<p>Se não foi você, ignore este email.</p>',
    ].join('\n'),
  })
}
