// Score de aderência: 0-100
// 20% = registro de peso | 50% = nutrição | 30% = treino

interface WeightLog { measured_at: string }
interface FoodLog   { logged_date: string; calories_actual?: number }
interface NutritionPlan { calories_target: number; protein_g: number }
interface TrainingLog   { trained_at: string }
interface TrainingPlan  { sessions_per_week: number }

export interface AdherenceScore {
  overall: number
  weight_score: number
  nutrition_score: number
  training_score: number
}

export function calculateAdherenceScore(params: {
  weightLogs: WeightLog[]
  foodLogs: FoodLog[]
  trainingLogs: TrainingLog[]
  nutritionPlan: NutritionPlan | null
  trainingPlan: TrainingPlan | null
  windowDays?: number
}): AdherenceScore {
  const { weightLogs, foodLogs, trainingLogs, nutritionPlan, trainingPlan, windowDays = 28 } = params

  const weight_score    = scoreWeightLogging(weightLogs, windowDays)
  const nutrition_score = scoreNutritionAdherence(foodLogs, nutritionPlan, windowDays)
  const training_score  = scoreTrainingAdherence(trainingLogs, trainingPlan, windowDays)

  const overall = Math.round(
    0.20 * weight_score +
    0.50 * nutrition_score +
    0.30 * training_score
  )

  return { overall, weight_score, nutrition_score, training_score }
}

function scoreWeightLogging(logs: WeightLog[], windowDays: number): number {
  // Esperado: ao menos 2 pesagens por semana
  const weeks = windowDays / 7
  const expected = weeks * 2
  const actual   = logs.length

  return Math.min(Math.round((actual / expected) * 100), 100)
}

function scoreNutritionAdherence(
  logs: FoodLog[],
  plan: NutritionPlan | null,
  windowDays: number,
): number {
  if (!plan || logs.length === 0) return 0

  // Dias sem registro = 0 pontos (penaliza ausência)
  const daysWithLog = logs.filter(l => l.calories_actual != null && l.calories_actual > 0).length
  const totalDays   = windowDays

  // Score base pela cobertura (dias registrados vs total)
  const coverage = daysWithLog / totalDays

  // Score de qualidade: dias dentro de ±20% do alvo calórico
  const daysOnTarget = logs.filter(l => {
    if (!l.calories_actual) return false
    const ratio = l.calories_actual / plan.calories_target
    return ratio >= 0.8 && ratio <= 1.2
  }).length

  const quality = daysWithLog > 0 ? daysOnTarget / daysWithLog : 0

  return Math.round((coverage * 0.4 + quality * 0.6) * 100)
}

function scoreTrainingAdherence(
  logs: TrainingLog[],
  plan: TrainingPlan | null,
  windowDays: number,
): number {
  if (!plan) return 0

  const weeks    = windowDays / 7
  const expected = weeks * plan.sessions_per_week
  const actual   = logs.length

  return Math.min(Math.round((actual / expected) * 100), 100)
}
