import { db } from '../../config/database.js'
import type { NutritionPlanInput, FoodLogInput } from './nutrition.schema.js'

export async function getActivePlan(userId: string) {
  const { rows } = await db.query(
    `SELECT * FROM nutrition_plans
     WHERE user_id = $1 AND is_active = true
     ORDER BY valid_from DESC LIMIT 1`,
    [userId]
  )
  return rows[0] || null
}

export async function upsertNutritionPlan(userId: string, data: NutritionPlanInput) {
  await db.query(
    'UPDATE nutrition_plans SET is_active = false WHERE user_id = $1',
    [userId]
  )
  const { rows } = await db.query(
    `INSERT INTO nutrition_plans (user_id, calories_target, protein_g, carbs_g, fat_g, valid_from)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, data.calories_target, data.protein_g, data.carbs_g, data.fat_g, data.valid_from]
  )
  return rows[0]
}

export async function upsertFoodLog(userId: string, data: FoodLogInput) {
  const date = data.logged_date ?? new Date().toISOString().split('T')[0]
  const { rows } = await db.query(
    `INSERT INTO food_logs (user_id, logged_date, calories_actual, protein_g, carbs_g, fat_g, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, logged_date) DO UPDATE SET
       calories_actual = EXCLUDED.calories_actual,
       protein_g       = EXCLUDED.protein_g,
       carbs_g         = EXCLUDED.carbs_g,
       fat_g           = EXCLUDED.fat_g,
       source          = EXCLUDED.source
     RETURNING *`,
    [userId, date, data.calories_actual ?? null, data.protein_g ?? null,
     data.carbs_g ?? null, data.fat_g ?? null, data.source ?? 'manual']
  )
  return rows[0]
}

export async function getFoodLogs(userId: string, from?: string, to?: string) {
  const conditions = ['user_id = $1']
  const params: unknown[] = [userId]

  if (from) { params.push(from); conditions.push(`logged_date >= $${params.length}`) }
  if (to)   { params.push(to);   conditions.push(`logged_date <= $${params.length}`) }

  const { rows } = await db.query(
    `SELECT * FROM food_logs
     WHERE ${conditions.join(' AND ')}
     ORDER BY logged_date DESC`,
    params
  )
  return rows
}

export async function getTodayFoodLog(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { rows } = await db.query(
    'SELECT * FROM food_logs WHERE user_id = $1 AND logged_date = $2',
    [userId, today]
  )
  return rows[0] || null
}

export async function getRecentFoodLogs(userId: string, days: number) {
  const { rows } = await db.query(
    `SELECT * FROM food_logs
     WHERE user_id = $1 AND logged_date >= CURRENT_DATE - $2 * INTERVAL '1 day'
     ORDER BY logged_date DESC`,
    [userId, days]
  )
  return rows
}
