import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './trpc/root'
import { createContext } from './trpc/context'
import { auth } from './auth/auth'
import { assertDevBypassNotInProduction, isDevBypassEnabled } from './auth/dev-mode'

assertDevBypassNotInProduction()

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? true,
  credentials: true,
})

// Better Auth: converte a request do Fastify em Request web e delega ao handler
app.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  handler: async (req, reply) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(key, value)
      else if (Array.isArray(value)) headers.set(key, value.join(', '))
    }
    const request = new Request(url, {
      method: req.method,
      headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
    })
    const response = await auth.handler(request)
    reply.status(response.status)
    response.headers.forEach((value, key) => reply.header(key, value))
    reply.send(response.body ? await response.text() : null)
  },
})

await app.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext },
})

app.get('/health', async () => ({ ok: true }))

if (isDevBypassEnabled()) {
  app.log.warn('[DEV MODE] AUTH_BYPASS ativo — identidade fixa de desenvolvimento')
}

const port = Number(process.env.PORT ?? 3333)
await app.listen({ port, host: '0.0.0.0' })
