import { db } from '../../config/database.js'
import type { TrainingPlanInput, TrainingLogInput } from './training.schema.js'

export async function getActivePlan(userId: string) {
  const { rows } = await db.query(
    'SELECT * FROM training_plans WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
    [userId]
  )
  return rows[0] || null
}

export async function upsertTrainingPlan(userId: string, data: TrainingPlanInput) {
  await db.query(
    'UPDATE training_plans SET is_active = false WHERE user_id = $1',
    [userId]
  )
  const { rows } = await db.query(
    `INSERT INTO training_plans (user_id, sessions_per_week, avg_duration_min, intensity)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, data.sessions_per_week, data.avg_duration_min, data.intensity]
  )
  return rows[0]
}

export async function createTrainingLog(userId: string, data: TrainingLogInput) {
  const { rows } = await db.query(
    `INSERT INTO training_logs (user_id, trained_at, duration_min, intensity, calories_burned)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      userId,
      data.trained_at ?? new Date().toISOString(),
      data.duration_min ?? null,
      data.intensity ?? null,
      data.calories_burned ?? null,
    ]
  )
  return rows[0]
}

export async function getTrainingLogs(userId: string, from?: string, to?: string) {
  const conditions = ['user_id = $1']
  const params: unknown[] = [userId]

  if (from) { params.push(from); conditions.push(`trained_at >= $${params.length}`) }
  if (to)   { params.push(to);   conditions.push(`trained_at <= $${params.length}`) }

  const { rows } = await db.query(
    `SELECT * FROM training_logs WHERE ${conditions.join(' AND ')} ORDER BY trained_at DESC`,
    params
  )
  return rows
}

export async function getWeeklyTrainingSessions(userId: string) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int as count FROM training_logs
     WHERE user_id = $1
     AND trained_at >= date_trunc('week', CURRENT_DATE)`,
    [userId]
  )
  return rows[0].count
}
