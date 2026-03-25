import type { FastifyInstance } from 'fastify'
import { weightLogSchema } from './biometrics.schema.js'
import {
  createWeightLog,
  getWeightLogs,
  deleteWeightLog,
} from './biometrics.repository.js'

export async function biometricsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Token inválido ou ausente' })
    }
  })

  // Registrar peso
  app.post('/biometrics/weight', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const data = weightLogSchema.parse(request.body)
    const log = await createWeightLog(sub, data)
    return reply.status(201).send(log)
  })

  // Histórico de peso
  app.get('/biometrics/weight', async (request) => {
    const { sub } = request.user as { sub: string }
    const { from, to, limit } = request.query as {
      from?: string
      to?: string
      limit?: string
    }
    return getWeightLogs(sub, from, to, limit ? Number(limit) : 30)
  })

  // Deletar registro
  app.delete('/biometrics/weight/:id', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const deleted = await deleteWeightLog(id, sub)
    if (!deleted) throw { statusCode: 404, message: 'Registro não encontrado' }
    return reply.status(204).send()
  })
}
