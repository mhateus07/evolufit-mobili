import type { FastifyInstance } from 'fastify'
import { getAllMarmitas, getMarmitasByTag, markSuggestionViewed, markSuggestionPurchased } from './marmita.repository.js'
import { generateSuggestions } from './marmita.service.js'

export async function marmitaRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Token inválido ou ausente' })
    }
  })

  // Listar todas as marmitas disponíveis
  app.get('/marmitas', async (request) => {
    const { tag, available } = request.query as { tag?: string; available?: string }

    if (tag) return getMarmitasByTag(tag)
    return getAllMarmitas(available !== 'false')
  })

  // Sugestões personalizadas baseadas no gap nutricional
  app.get('/marmitas/suggestions', async (request) => {
    const { sub } = request.user as { sub: string }
    return generateSuggestions(sub)
  })

  // Marcar sugestão como visualizada
  app.post('/marmitas/suggestions/:id/view', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const result = await markSuggestionViewed(id, sub)
    if (!result) throw { statusCode: 404, message: 'Sugestão não encontrada' }
    return reply.status(200).send(result)
  })

  // Marcar como comprada (webhook/redirect)
  app.post('/marmitas/suggestions/:id/purchase', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const result = await markSuggestionPurchased(id, sub)
    if (!result) throw { statusCode: 404, message: 'Sugestão não encontrada' }
    return reply.status(200).send({ success: true, ...result })
  })
}
