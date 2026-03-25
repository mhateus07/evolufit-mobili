import { db } from '../../config/database.js'

export async function getAllMarmitas(onlyAvailable = true) {
  const { rows } = await db.query(
    `SELECT * FROM marmitas
     WHERE ($1 = false OR is_available = true)
     ORDER BY protein_g DESC`,
    [onlyAvailable]
  )
  return rows
}

export async function getMarmitasByTag(tag: string) {
  const { rows } = await db.query(
    `SELECT * FROM marmitas
     WHERE is_available = true AND $1 = ANY(tags)
     ORDER BY protein_g DESC`,
    [tag]
  )
  return rows
}

export async function findBestMatchForProteinGap(gap_protein_g: number) {
  // Busca marmitas que cobrem o gap de proteína sem ultrapassar muito
  const { rows } = await db.query(
    `SELECT * FROM marmitas
     WHERE is_available = true
       AND 'high_protein' = ANY(tags)
       AND protein_g >= $1 * 0.5
     ORDER BY ABS(protein_g - $1) ASC
     LIMIT 3`,
    [gap_protein_g]
  )
  return rows
}

export async function findBestMatchForCalorieGap(gap_calories: number) {
  const { rows } = await db.query(
    `SELECT * FROM marmitas
     WHERE is_available = true
       AND calories >= $1 * 0.4
       AND calories <= $1 * 1.3
     ORDER BY ABS(calories - $1) ASC
     LIMIT 3`,
    [gap_calories]
  )
  return rows
}

export async function saveSuggestion(userId: string, data: {
  marmita_id: string
  trigger_reason: string
  gap_protein_g?: number
  gap_calories?: number
}) {
  const { rows } = await db.query(
    `INSERT INTO marmita_suggestions
       (user_id, marmita_id, trigger_reason, gap_protein_g, gap_calories)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, data.marmita_id, data.trigger_reason, data.gap_protein_g ?? null, data.gap_calories ?? null]
  )
  return rows[0]
}

export async function markSuggestionViewed(id: string, userId: string) {
  const { rows } = await db.query(
    `UPDATE marmita_suggestions SET was_viewed = true
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  )
  return rows[0]
}

export async function markSuggestionPurchased(id: string, userId: string) {
  const { rows } = await db.query(
    `UPDATE marmita_suggestions SET was_purchased = true
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  )
  return rows[0]
}
