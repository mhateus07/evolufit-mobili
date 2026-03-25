import { db } from '../../config/database.js'
import { calculateBMR, calculateTDEE, getCalorieTarget, calculateAgeFromBirthDate } from './engine/tdee.calculator.js'
import { calibrateTDEE } from './engine/calibration.js'
import { calculateAdherenceScore } from './engine/adherence.scorer.js'
import { assessColdStart } from './engine/cold.start.js'
import { buildScenarios, assessMuscleLossRisk } from './engine/scenario.builder.js'
import { saveProjection, getLatestProjection, isProjectionExpired } from './projection.repository.js'

export async function getOrGenerateProjection(userId: string, forceRecalculate = false) {
  // Verificar cache
  if (!forceRecalculate) {
    const cached = await getLatestProjection(userId)
    if (cached && !(await isProjectionExpired(cached))) {
      return { ...cached, from_cache: true }
    }
  }

  return generateProjection(userId)
}

export async function generateProjection(userId: string) {
  // Buscar todos os dados necessários em paralelo
  const [profile, weightLogs, foodLogs, trainingLogs, nutritionPlan, trainingPlan] =
    await Promise.all([
      db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]).then(r => r.rows[0]),
      db.query(`SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY measured_at DESC LIMIT 60`, [userId]).then(r => r.rows),
      db.query(`SELECT * FROM food_logs WHERE user_id = $1 AND logged_date >= CURRENT_DATE - INTERVAL '28 days' ORDER BY logged_date DESC`, [userId]).then(r => r.rows),
      db.query(`SELECT * FROM training_logs WHERE user_id = $1 AND trained_at >= CURRENT_DATE - INTERVAL '28 days'`, [userId]).then(r => r.rows),
      db.query(`SELECT * FROM nutrition_plans WHERE user_id = $1 AND is_active = true LIMIT 1`, [userId]).then(r => r.rows[0]),
      db.query(`SELECT * FROM training_plans WHERE user_id = $1 AND is_active = true LIMIT 1`, [userId]).then(r => r.rows[0]),
    ])

  if (!profile) throw { statusCode: 400, message: 'Configure seu perfil antes de gerar a projeção' }

  const latestWeight = weightLogs[0]
  if (!latestWeight) throw { statusCode: 400, message: 'Registre seu peso antes de gerar a projeção' }

  // Calcular idade e métricas base
  const age = calculateAgeFromBirthDate(profile.birth_date)
  const bmr = calculateBMR(Number(latestWeight.weight_kg), Number(profile.height_cm), age, profile.sex)
  const tdee_formula = calculateTDEE(bmr, profile.activity_level)
  const { target: calorie_target } = getCalorieTarget(tdee_formula, profile.goal)

  // Calibração do TDEE com dados reais
  const calibration = calibrateTDEE({
    tdee_formula,
    weightLogs: weightLogs.map(w => ({ weight_kg: Number(w.weight_kg), measured_at: w.measured_at })),
    foodLogs: foodLogs.map(f => ({ calories_actual: f.calories_actual, logged_date: f.logged_date })),
  })

  // Score de aderência
  const adherence = calculateAdherenceScore({
    weightLogs,
    foodLogs,
    trainingLogs,
    nutritionPlan,
    trainingPlan,
  })

  // Cold start
  const coldStart = assessColdStart(weightLogs, foodLogs)

  // Risco de perda muscular
  const muscle_loss_risk = assessMuscleLossRisk({
    protein_g_actual: foodLogs.length > 0
      ? foodLogs.reduce((s, l) => s + Number(l.protein_g ?? 0), 0) / foodLogs.length
      : 0,
    protein_g_target: Number(nutritionPlan?.protein_g ?? 150),
    weekly_deficit_kcal: (calibration.tdee_calibrated - calorie_target) * 7,
    sessions_per_week: trainingPlan?.sessions_per_week ?? 0,
  })

  // Construir os 3 cenários
  const scenarios = buildScenarios({
    current_weight_kg: Number(latestWeight.weight_kg),
    body_fat_pct: latestWeight.body_fat_pct ? Number(latestWeight.body_fat_pct) : null,
    age,
    sex: profile.sex,
    tdee_kcal: calibration.tdee_calibrated,
    calorie_target,
    protein_g_actual: foodLogs.length > 0
      ? foodLogs.reduce((s, l) => s + Number(l.protein_g ?? 0), 0) / foodLogs.length
      : 0,
    protein_g_target: Number(nutritionPlan?.protein_g ?? 150),
    goal: profile.goal,
    adherence_score: adherence.overall,
  })

  // Montar resposta completa
  const result = {
    current_weight_kg: Number(latestWeight.weight_kg),
    adherence_score: adherence.overall,
    adherence_detail: adherence,
    is_cold_start: coldStart.is_cold_start,
    cold_start_info: coldStart.is_cold_start ? coldStart : null,
    muscle_loss_risk,
    calibration: {
      quality: calibration.quality,
      confidence: calibration.confidence,
      tdee_formula,
      tdee_calibrated: calibration.tdee_calibrated,
      weeks_of_data: calibration.weeks_of_data,
    },
    metabolic: { bmr, tdee_formula, tdee_calibrated: calibration.tdee_calibrated, calorie_target },
    scenarios,
  }

  // Salvar no banco
  const saved = await saveProjection(userId, {
    current_weight_kg: result.current_weight_kg,
    conservative_scenario: scenarios.conservative,
    current_scenario: scenarios.current,
    optimized_scenario: scenarios.optimized,
    adherence_score: adherence.overall,
    is_cold_start: coldStart.is_cold_start,
  })

  return { ...result, generated_at: saved.generated_at, expires_at: saved.expires_at, from_cache: false }
}
