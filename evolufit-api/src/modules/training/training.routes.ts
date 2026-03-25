import type { FastifyInstance } from 'fastify'
import { trainingPlanSchema, trainingLogSchema } from './training.schema.js'
import {
  getActivePlan,
  upsertTrainingPlan,
  createTrainingLog,
  getTrainingLogs,
} from './training.repository.js'

export async function trainingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Token inválido ou ausente' })
    }
  })

  // Buscar plano ativo
  app.get('/training/plan', async (request) => {
    const { sub } = request.user as { sub: string }
    const plan = await getActivePlan(sub)
    if (!plan) throw { statusCode: 404, message: 'Nenhum plano de treino configurado' }
    return plan
  })

  // Criar ou atualizar plano
  app.put('/training/plan', async (request) => {
    const { sub } = request.user as { sub: string }
    const data = trainingPlanSchema.parse(request.body)
    return upsertTrainingPlan(sub, data)
  })

  // Registrar sessão de treino
  app.post('/training/log', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const data = trainingLogSchema.parse(request.body)
    const log = await createTrainingLog(sub, data)
    return reply.status(201).send(log)
  })

  // Histórico de treinos
  app.get('/training/log', async (request) => {
    const { sub } = request.user as { sub: string }
    const { from, to } = request.query as { from?: string; to?: string }
    return getTrainingLogs(sub, from, to)
  })
}
