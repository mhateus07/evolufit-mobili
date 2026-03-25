import type { FastifyInstance } from 'fastify'
import { nutritionPlanSchema, foodLogSchema } from './nutrition.schema.js'
import {
  getActivePlan,
  upsertNutritionPlan,
  upsertFoodLog,
  getFoodLogs,
  getTodayFoodLog,
} from './nutrition.repository.js'

export async function nutritionRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Token inválido ou ausente' })
    }
  })

  // Buscar plano ativo
  app.get('/nutrition/plan', async (request) => {
    const { sub } = request.user as { sub: string }
    const plan = await getActivePlan(sub)
    if (!plan) throw { statusCode: 404, message: 'Nenhum plano alimentar configurado' }
    return plan
  })

  // Criar ou atualizar plano
  app.put('/nutrition/plan', async (request) => {
    const { sub } = request.user as { sub: string }
    const data = nutritionPlanSchema.parse(request.body)
    return upsertNutritionPlan(sub, data)
  })

  // Registrar alimentação do dia
  app.post('/nutrition/log', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const data = foodLogSchema.parse(request.body)
    const log = await upsertFoodLog(sub, data)
    return reply.status(201).send(log)
  })

  // Histórico de registros
  app.get('/nutrition/log', async (request) => {
    const { sub } = request.user as { sub: string }
    const { from, to } = request.query as { from?: string; to?: string }
    return getFoodLogs(sub, from, to)
  })

  // Gap nutricional de hoje
  app.get('/nutrition/gap/today', async (request) => {
    const { sub } = request.user as { sub: string }

    const [plan, todayLog] = await Promise.all([
      getActivePlan(sub),
      getTodayFoodLog(sub),
    ])

    if (!plan) throw { statusCode: 404, message: 'Nenhum plano alimentar configurado' }

    const consumed = {
      calories: todayLog?.calories_actual ?? 0,
      protein_g: todayLog?.protein_g ?? 0,
      carbs_g: todayLog?.carbs_g ?? 0,
      fat_g: todayLog?.fat_g ?? 0,
    }

    const gap = {
      calories: plan.calories_target - consumed.calories,
      protein_g: Number(plan.protein_g) - Number(consumed.protein_g),
      carbs_g: Number(plan.carbs_g) - Number(consumed.carbs_g),
      fat_g: Number(plan.fat_g) - Number(consumed.fat_g),
    }

    const status =
      gap.calories > 200 ? 'below' :
      gap.calories < -200 ? 'above' : 'on_track'

    return { plan, consumed, gap, status, logged_today: !!todayLog }
  })
}
