import { db } from '../../config/database.js'
import type { WeightLogInput } from './biometrics.schema.js'

export async function createWeightLog(userId: string, data: WeightLogInput) {
  const { rows } = await db.query(
    `INSERT INTO weight_logs (user_id, weight_kg, body_fat_pct, muscle_mass_kg, notes, measured_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      userId,
      data.weight_kg,
      data.body_fat_pct ?? null,
      data.muscle_mass_kg ?? null,
      data.notes ?? null,
      data.measured_at ?? new Date().toISOString(),
    ]
  )
  return rows[0]
}

export async function getWeightLogs(userId: string, from?: string, to?: string, limit = 30) {
  const conditions = ['user_id = $1']
  const params: unknown[] = [userId]

  if (from) { params.push(from); conditions.push(`measured_at >= $${params.length}`) }
  if (to)   { params.push(to);   conditions.push(`measured_at <= $${params.length}`) }

  params.push(limit)
  const { rows } = await db.query(
    `SELECT * FROM weight_logs
     WHERE ${conditions.join(' AND ')}
     ORDER BY measured_at DESC
     LIMIT $${params.length}`,
    params
  )
  return rows
}

export async function deleteWeightLog(id: string, userId: string) {
  const { rowCount } = await db.query(
    'DELETE FROM weight_logs WHERE id = $1 AND user_id = $2',
    [id, userId]
  )
  return rowCount! > 0
}

export async function getLatestWeight(userId: string) {
  const { rows } = await db.query(
    'SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY measured_at DESC LIMIT 1',
    [userId]
  )
  return rows[0] || null
}
