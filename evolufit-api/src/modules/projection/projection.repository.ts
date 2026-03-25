import { db } from '../../config/database.js'

export async function saveProjection(userId: string, data: {
  current_weight_kg: number
  conservative_scenario: object
  current_scenario: object
  optimized_scenario: object
  adherence_score: number
  is_cold_start: boolean
  llm_explanation?: string
  horizon_weeks?: number
}) {
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { rows } = await db.query(
    `INSERT INTO projections
       (user_id, current_weight_kg, conservative_scenario, current_scenario,
        optimized_scenario, adherence_score, is_cold_start, llm_explanation,
        horizon_weeks, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      userId,
      data.current_weight_kg,
      JSON.stringify(data.conservative_scenario),
      JSON.stringify(data.current_scenario),
      JSON.stringify(data.optimized_scenario),
      data.adherence_score,
      data.is_cold_start,
      data.llm_explanation ?? null,
      data.horizon_weeks ?? 12,
      expires_at,
    ]
  )
  return rows[0]
}

export async function getLatestProjection(userId: string) {
  const { rows } = await db.query(
    `SELECT * FROM projections
     WHERE user_id = $1
     ORDER BY generated_at DESC LIMIT 1`,
    [userId]
  )
  return rows[0] || null
}

export function isProjectionExpired(projection: { expires_at: string } | null): boolean {
  if (!projection) return true
  return new Date(projection.expires_at) < new Date()
}
