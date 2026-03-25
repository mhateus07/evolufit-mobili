// Calibração progressiva do TDEE com dados reais
// Algoritmo: lerp(TDEE_formula, TDEE_real, confidence)
// confidence = min(semanas_de_dados / 8, 1.0)

const KCAL_PER_KG = 7700

export interface CalibrationResult {
  tdee_calibrated: number
  confidence: number        // 0.0 a 1.0
  quality: 'insufficient' | 'low' | 'medium' | 'high'
  weeks_of_data: number
  tdee_real_estimate: number | null
}

export function calibrateTDEE(params: {
  tdee_formula: number
  weightLogs: { weight_kg: number; measured_at: string }[]
  foodLogs: { calories_actual: number | null; logged_date: string }[]
}): CalibrationResult {
  const { tdee_formula, weightLogs, foodLogs } = params

  if (weightLogs.length < 2 || foodLogs.length < 7) {
    return {
      tdee_calibrated: tdee_formula,
      confidence: 0.05,
      quality: 'insufficient',
      weeks_of_data: 0,
      tdee_real_estimate: null,
    }
  }

  // Ordenar por data
  const sortedWeights = [...weightLogs].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  )

  const firstWeight = sortedWeights[0]
  const lastWeight  = sortedWeights[sortedWeights.length - 1]

  const deltaWeight_kg = Number(lastWeight.weight_kg) - Number(firstWeight.weight_kg)
  const days = Math.max(
    (new Date(lastWeight.measured_at).getTime() - new Date(firstWeight.measured_at).getTime())
    / (1000 * 60 * 60 * 24),
    1
  )

  const weeks_of_data = Math.floor(days / 7)

  // Média calórica dos dias com registro
  const logsWithCalories = foodLogs.filter(l => l.calories_actual != null && l.calories_actual > 0)
  if (logsWithCalories.length === 0) {
    return {
      tdee_calibrated: tdee_formula,
      confidence: 0.05,
      quality: 'insufficient',
      weeks_of_data,
      tdee_real_estimate: null,
    }
  }

  const avgCalories = logsWithCalories.reduce((sum, l) => sum + (l.calories_actual ?? 0), 0)
    / logsWithCalories.length

  // TDEE real: se o usuário consumiu X calorias e perdeu Y kg em Z dias
  // TDEE_real = avgCalories - (deltaWeight_kg * 7700 / dias)
  const tdee_real_estimate = Math.round(avgCalories - (deltaWeight_kg * KCAL_PER_KG / days))

  // Confiança aumenta progressivamente até 8 semanas
  const confidence = Math.min(weeks_of_data / 8, 1.0)

  // Interpolação linear entre fórmula e dados reais
  const tdee_calibrated = Math.round(
    tdee_formula + (tdee_real_estimate - tdee_formula) * confidence
  )

  const quality =
    weeks_of_data < 2  ? 'insufficient' :
    weeks_of_data < 4  ? 'low' :
    weeks_of_data < 8  ? 'medium' : 'high'

  return {
    tdee_calibrated: Math.max(tdee_calibrated, 1000), // mínimo fisiológico
    confidence: Number(confidence.toFixed(3)),
    quality,
    weeks_of_data,
    tdee_real_estimate,
  }
}
