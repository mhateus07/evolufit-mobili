import type { Goal } from './tdee.calculator.js'
import { getLeanMassRetentionFactor, compositionFromMeasured, estimateBodyComposition } from './body.composition.js'
import type { Sex } from './tdee.calculator.js'

const KCAL_PER_KG = 7700

// Variância biológica cresce com o tempo (retenção hídrica, variações naturais)
const VARIANCE_BY_WEEK: Record<number, number> = {
  1: 0.5, 2: 0.6, 3: 0.7, 4: 0.8,
  6: 1.0, 8: 1.2, 10: 1.5, 12: 1.8,
}

function getVariance(week: number): number {
  const keys = Object.keys(VARIANCE_BY_WEEK).map(Number).sort((a, b) => a - b)
  for (const k of keys.slice().reverse()) {
    if (week >= k) return VARIANCE_BY_WEEK[k]
  }
  return 0.5
}

export interface WeeklyProjection {
  week: number
  date: string
  weight_expected_kg: number
  weight_min_kg: number
  weight_max_kg: number
  fat_mass_expected_kg: number
  lean_mass_expected_kg: number
  cumulative_deficit_kcal: number
}

export interface ScenarioResult {
  weeks: WeeklyProjection[]
  adherence_assumption: number
  goal_reached_week: number | null
}

export interface ScenarioInput {
  current_weight_kg: number
  body_fat_pct: number | null
  age: number
  sex: Sex
  tdee_kcal: number
  calorie_target: number
  protein_g_actual: number
  protein_g_target: number
  goal: Goal
  adherence_score: number   // 0-100
  horizon_weeks?: number
}

export function buildScenarios(input: ScenarioInput) {
  return {
    conservative: buildScenario(input, 0.70),
    current:      buildScenario(input, input.adherence_score / 100),
    optimized:    buildScenario(input, 0.90),
  }
}

function buildScenario(input: ScenarioInput, adherence_factor: number): ScenarioResult {
  const horizon = input.horizon_weeks ?? 12

  const composition = input.body_fat_pct != null
    ? compositionFromMeasured(input.current_weight_kg, input.body_fat_pct)
    : estimateBodyComposition(input.current_weight_kg, input.age, input.sex)

  const leanRetention = getLeanMassRetentionFactor(
    input.goal,
    input.protein_g_actual,
    input.protein_g_target,
  )

  // Déficit/superávit diário efetivo com aderência aplicada
  const daily_delta_kcal = (input.tdee_kcal - input.calorie_target) * adherence_factor

  const weeks: WeeklyProjection[] = []
  let cumulative_deficit = 0
  let fat_mass    = composition.fat_mass_kg
  let lean_mass   = composition.lean_mass_kg
  let goal_reached_week: number | null = null

  const initial_weight = input.current_weight_kg

  for (let w = 1; w <= horizon; w++) {
    // Peso perdido/ganho nessa semana em kg
    const weekly_weight_change = -(daily_delta_kcal * 7) / KCAL_PER_KG

    // Separar gordura vs massa magra
    if (weekly_weight_change < 0) {
      const fat_loss  = Math.abs(weekly_weight_change) * leanRetention
      const lean_loss = Math.abs(weekly_weight_change) * (1 - leanRetention)
      fat_mass  = Math.max(fat_mass  - fat_loss,  1)
      lean_mass = Math.max(lean_mass - lean_loss, 30)
    } else {
      // Ganho: 30% músculo, 70% gordura (simplificado para não-iniciantes)
      lean_mass += weekly_weight_change * 0.30
      fat_mass  += weekly_weight_change * 0.70
    }

    const weight_expected = Number((fat_mass + lean_mass).toFixed(2))
    const variance        = getVariance(w)

    cumulative_deficit += daily_delta_kcal * 7

    const date = new Date()
    date.setDate(date.getDate() + w * 7)

    weeks.push({
      week: w,
      date: date.toISOString().split('T')[0],
      weight_expected_kg:   weight_expected,
      weight_min_kg:        Number((weight_expected - variance).toFixed(2)),
      weight_max_kg:        Number((weight_expected + variance).toFixed(2)),
      fat_mass_expected_kg: Number(fat_mass.toFixed(2)),
      lean_mass_expected_kg: Number(lean_mass.toFixed(2)),
      cumulative_deficit_kcal: Math.round(cumulative_deficit),
    })

    // Detectar semana em que meta é atingida (perda de 10% do peso inicial como referência)
    if (goal_reached_week === null && input.goal === 'lose_fat') {
      const target = initial_weight * 0.90
      if (weight_expected <= target) goal_reached_week = w
    }
  }

  return { weeks, adherence_assumption: adherence_factor, goal_reached_week }
}

export function assessMuscleLossRisk(params: {
  protein_g_actual: number
  protein_g_target: number
  weekly_deficit_kcal: number
  sessions_per_week: number
}): 'low' | 'moderate' | 'high' {
  const { protein_g_actual, protein_g_target, weekly_deficit_kcal, sessions_per_week } = params

  const protein_ratio   = protein_g_actual / protein_g_target
  const daily_deficit   = weekly_deficit_kcal / 7
  const high_deficit    = daily_deficit > 750
  const low_protein     = protein_ratio < 0.7
  const no_training     = sessions_per_week === 0

  if (low_protein && (high_deficit || no_training)) return 'high'
  if (low_protein || (high_deficit && no_training)) return 'moderate'
  return 'low'
}
