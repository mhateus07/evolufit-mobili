import { db } from '../../config/database.js'
import { sendPushNotification } from '../../config/firebase.js'

export type EventType =
  | 'nutrition_gap'
  | 'goal_milestone'
  | 'weekly_summary'
  | 'no_weight_log'
  | 'cold_start_complete'

interface SendNotificationParams {
  userId: string
  event_type: EventType
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendNotificationToUser(params: SendNotificationParams) {
  const { userId, event_type, title, body, data } = params

  // Buscar tokens ativos do usuário
  const { rows: tokens } = await db.query(
    'SELECT token FROM push_tokens WHERE user_id = $1 AND is_active = true',
    [userId]
  )

  if (tokens.length === 0) {
    console.log(`Usuário ${userId} sem token push registrado`)
    return
  }

  // Salvar no histórico
  await db.query(
    `INSERT INTO notifications_sent (user_id, event_type, title, body, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, event_type, title, body, data ? JSON.stringify(data) : null]
  )

  // Enviar para todos os tokens do usuário
  for (const { token } of tokens) {
    await sendPushNotification({ token, title, body, data })
  }
}

// Checar e enviar notificação de gap nutricional
export async function checkAndSendNutritionGapNotification(userId: string) {
  const [plan, todayLog] = await Promise.all([
    db.query(
      'SELECT * FROM nutrition_plans WHERE user_id = $1 AND is_active = true LIMIT 1',
      [userId]
    ).then(r => r.rows[0]),
    db.query(
      'SELECT * FROM food_logs WHERE user_id = $1 AND logged_date = CURRENT_DATE',
      [userId]
    ).then(r => r.rows[0]),
  ])

  if (!plan) return

  const gap_protein = Number(plan.protein_g) - Number(todayLog?.protein_g ?? 0)

  if (gap_protein > 20) {
    await sendNotificationToUser({
      userId,
      event_type: 'nutrition_gap',
      title: 'Sua proteína está baixa hoje!',
      body: `Faltam ${Math.round(gap_protein)}g de proteína. Confira nossas marmitas!`,
      data: { gap_protein_g: String(Math.round(gap_protein)), screen: 'marmitas' },
    })
  }
}

// Checar e enviar notificação de ausência de peso
export async function checkAndSendNoWeightLogNotification(userId: string) {
  const { rows } = await db.query(
    `SELECT * FROM weight_logs
     WHERE user_id = $1
     ORDER BY measured_at DESC LIMIT 1`,
    [userId]
  )

  const lastLog = rows[0]
  if (!lastLog) return

  const daysSinceLastLog = Math.floor(
    (Date.now() - new Date(lastLog.measured_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceLastLog >= 4) {
    await sendNotificationToUser({
      userId,
      event_type: 'no_weight_log',
      title: 'Não esqueça de se pesar!',
      body: `Faz ${daysSinceLastLog} dias sem registro. Seus dados mantêm a projeção precisa.`,
      data: { screen: 'weight_log' },
    })
  }
}

// Resumo semanal
export async function sendWeeklySummary(userId: string) {
  const { rows: scores } = await db.query(
    `SELECT overall_score FROM adherence_scores
     WHERE user_id = $1
     ORDER BY score_date DESC LIMIT 7`,
    [userId]
  )

  const avg = scores.length > 0
    ? Math.round(scores.reduce((s: number, r: any) => s + Number(r.overall_score), 0) / scores.length)
    : 0

  const emoji = avg >= 80 ? '🔥' : avg >= 60 ? '💪' : '📈'

  await sendNotificationToUser({
    userId,
    event_type: 'weekly_summary',
    title: `Resumo da semana ${emoji}`,
    body: `Score de aderência: ${avg}/100. Veja sua evolução no app!`,
    data: { adherence_score: String(avg), screen: 'projection' },
  })
}
