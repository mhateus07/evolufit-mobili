import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../../config/database.js'
import { checkAndSendNutritionGapNotification } from './notification.service.js'

const pushTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(['ios', 'android']),
})

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Token inválido ou ausente' })
    }
  })

  // Registrar token push
  app.post('/notifications/token', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { token, platform } = pushTokenSchema.parse(request.body)

    await db.query(
      `INSERT INTO push_tokens (user_id, token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET is_active = true, user_id = $1`,
      [sub, token, platform]
    )
    return reply.status(201).send({ message: 'Token registrado com sucesso' })
  })

  // Remover token push
  app.delete('/notifications/token', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { token } = z.object({ token: z.string() }).parse(request.body)

    await db.query(
      'UPDATE push_tokens SET is_active = false WHERE user_id = $1 AND token = $2',
      [sub, token]
    )
    return reply.status(204).send()
  })

  // Histórico de notificações
  app.get('/notifications', async (request) => {
    const { sub } = request.user as { sub: string }
    const { unread, limit } = request.query as { unread?: string; limit?: string }

    const conditions = ['user_id = $1']
    const params: unknown[] = [sub]

    if (unread === 'true') conditions.push('read_at IS NULL')

    params.push(Number(limit ?? 20))
    const { rows } = await db.query(
      `SELECT * FROM notifications_sent
       WHERE ${conditions.join(' AND ')}
       ORDER BY sent_at DESC
       LIMIT $${params.length}`,
      params
    )
    return rows
  })

  // Marcar como lida
  app.patch('/notifications/:id/read', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { id } = request.params as { id: string }

    await db.query(
      'UPDATE notifications_sent SET read_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, sub]
    )
    return reply.status(204).send()
  })

  // Marcar todas como lidas
  app.patch('/notifications/read-all', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    await db.query(
      'UPDATE notifications_sent SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [sub]
    )
    return reply.status(204).send()
  })

  // Testar notificação manualmente (dev only)
  app.post('/notifications/test', async (request, reply) => {
    const { sub } = request.user as { sub: string }
    await checkAndSendNutritionGapNotification(sub)
    return reply.status(200).send({ message: 'Notificação de teste disparada' })
  })
}
