import type { FastifyInstance } from 'fastify'
import { getOrGenerateProjection } from './projection.service.js'
import { calculateAdherenceScore } from './engine/adherence.scorer.js'
import { db } from '../../config/database.js'

export async function projectionRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Token inválido ou ausente' })
    }
  })

  // Projeção atual (usa cache se válido)
  app.get('/projection/current', async (request) => {
    const { sub } = request.user as { sub: string }
    return getOrGenerateProjection(sub)
  })

  // Forçar recálculo
  app.post('/projection/recalculate', async (request) => {
    const { sub } = request.user as { sub: string }
    return getOrGenerateProjection(sub, true)
  })

  // Score de aderência detalhado
  app.get('/projection/adherence', async (request) => {
    const { sub } = request.user as { sub: string }

    const [weightLogs, foodLogs, trainingLogs, nutritionPlan, trainingPlan] = await Promise.all([
      db.query(`SELECT * FROM weight_logs WHERE user_id = $1 AND measured_at >= CURRENT_DATE - INTERVAL '28 days'`, [sub]).then(r => r.rows),
      db.query(`SELECT * FROM food_logs WHERE user_id = $1 AND logged_date >= CURRENT_DATE - INTERVAL '28 days'`, [sub]).then(r => r.rows),
      db.query(`SELECT * FROM training_logs WHERE user_id = $1 AND trained_at >= CURRENT_DATE - INTERVAL '28 days'`, [sub]).then(r => r.rows),
      db.query(`SELECT * FROM nutrition_plans WHERE user_id = $1 AND is_active = true LIMIT 1`, [sub]).then(r => r.rows[0]),
      db.query(`SELECT * FROM training_plans WHERE user_id = $1 AND is_active = true LIMIT 1`, [sub]).then(r => r.rows[0]),
    ])

    return calculateAdherenceScore({ weightLogs, foodLogs, trainingLogs, nutritionPlan, trainingPlan })
  })

  // Status da calibração
  app.get('/projection/calibration-status', async (request) => {
    const { sub } = request.user as { sub: string }
    const { rows } = await db.query(
      'SELECT * FROM tdee_calibrations WHERE user_id = $1',
      [sub]
    )
    return rows[0] ?? { quality: 'insufficient', message: 'Dados insuficientes para calibração' }
  })
}
