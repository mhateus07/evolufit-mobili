interface WeightLog { weight_kg: number }
interface FoodLog   { logged_date: string }

export interface ColdStartStatus {
  is_cold_start: boolean
  reason?: string
  days_until_ready: number
  weight_logs_needed: number
  food_logs_needed: number
}

const MIN_WEIGHT_LOGS = 3
const MIN_FOOD_LOGS   = 7

export function assessColdStart(
  weightLogs: WeightLog[],
  foodLogs: FoodLog[],
): ColdStartStatus {
  const missingWeight = Math.max(0, MIN_WEIGHT_LOGS - weightLogs.length)
  const missingFood   = Math.max(0, MIN_FOOD_LOGS - foodLogs.length)

  const is_cold_start = missingWeight > 0 || missingFood > 0

  if (!is_cold_start) {
    return { is_cold_start: false, days_until_ready: 0, weight_logs_needed: 0, food_logs_needed: 0 }
  }

  const reason = missingWeight > 0 && missingFood > 0
    ? 'Registre seu peso e alimentação por pelo menos 7 dias'
    : missingWeight > 0
      ? `Registre seu peso mais ${missingWeight} vez(es)`
      : `Registre sua alimentação por mais ${missingFood} dia(s)`

  return {
    is_cold_start: true,
    reason,
    days_until_ready: Math.max(missingWeight, missingFood),
    weight_logs_needed: missingWeight,
    food_logs_needed: missingFood,
  }
}
