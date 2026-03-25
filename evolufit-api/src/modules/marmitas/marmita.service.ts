import { db } from '../../config/database.js'
import {
  findBestMatchForProteinGap,
  findBestMatchForCalorieGap,
  saveSuggestion,
} from './marmita.repository.js'

const PROTEIN_GAP_THRESHOLD = 20  // sugerir se faltam mais de 20g de proteína
const CALORIE_GAP_THRESHOLD  = 300 // sugerir se faltam mais de 300 kcal

export async function generateSuggestions(userId: string) {
  // Buscar plano e consumo de hoje
  const [plan, todayLog] = await Promise.all([
    db.query(
      'SELECT * FROM nutrition_plans WHERE user_id = $1 AND is_active = true LIMIT 1',
      [userId]
    ).then(r => r.rows[0]),
    db.query(
      `SELECT * FROM food_logs WHERE user_id = $1 AND logged_date = CURRENT_DATE`,
      [userId]
    ).then(r => r.rows[0]),
  ])

  if (!plan) {
    return { suggestions: [], reason: 'no_plan', message: 'Configure seu plano alimentar primeiro.' }
  }

  const consumed_protein  = Number(todayLog?.protein_g  ?? 0)
  const consumed_calories = Number(todayLog?.calories_actual ?? 0)

  const gap_protein_g  = Number(plan.protein_g)      - consumed_protein
  const gap_calories   = Number(plan.calories_target) - consumed_calories

  // Determinar o trigger principal
  let trigger_reason: string | null = null
  let marmitas: any[] = []

  if (gap_protein_g > PROTEIN_GAP_THRESHOLD) {
    trigger_reason = 'protein_gap'
    marmitas = await findBestMatchForProteinGap(gap_protein_g)
  } else if (gap_calories > CALORIE_GAP_THRESHOLD) {
    trigger_reason = 'calorie_gap'
    marmitas = await findBestMatchForCalorieGap(gap_calories)
  }

  if (!trigger_reason || marmitas.length === 0) {
    return {
      suggestions: [],
      reason: 'on_track',
      message: gap_protein_g <= 0
        ? 'Você já atingiu sua meta de proteína hoje!'
        : 'Você está no caminho certo hoje.',
      gap: { protein_g: gap_protein_g, calories: gap_calories },
    }
  }

  // Salvar sugestões no banco
  const saved = await Promise.all(
    marmitas.map(m => saveSuggestion(userId, {
      marmita_id: m.id,
      trigger_reason,
      gap_protein_g: gap_protein_g > 0 ? gap_protein_g : undefined,
      gap_calories:  gap_calories  > 0 ? gap_calories  : undefined,
    }))
  )

  const message = trigger_reason === 'protein_gap'
    ? `Faltam ${Math.round(gap_protein_g)}g de proteína hoje. Temos marmitas perfeitas para você!`
    : `Faltam ${Math.round(gap_calories)} kcal para atingir sua meta. Confira nossas opções!`

  return {
    suggestions: marmitas.map((m, i) => ({ ...m, suggestion_id: saved[i].id })),
    trigger_reason,
    message,
    gap: { protein_g: Math.round(gap_protein_g), calories: Math.round(gap_calories) },
  }
}
