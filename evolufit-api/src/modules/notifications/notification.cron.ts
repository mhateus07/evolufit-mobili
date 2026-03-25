import { db } from '../../config/database.js'
import {
  checkAndSendNutritionGapNotification,
  checkAndSendNoWeightLogNotification,
  sendWeeklySummary,
} from './notification.service.js'

// Checa todos os usuários para uma função de notificação
async function forAllUsers(fn: (userId: string) => Promise<void>) {
  const { rows } = await db.query('SELECT id FROM users')
  for (const user of rows) {
    try {
      await fn(user.id)
    } catch (err) {
      console.error(`Erro ao notificar usuário ${user.id}:`, err)
    }
  }
}

// Rodar às 18h todo dia — checar gap nutricional
export async function runNutritionGapCheck() {
  console.log('🔔 Cron: verificando gaps nutricionais...')
  await forAllUsers(checkAndSendNutritionGapNotification)
}

// Rodar às 8h todo dia — checar ausência de peso
export async function runNoWeightLogCheck() {
  console.log('🔔 Cron: verificando ausência de registro de peso...')
  await forAllUsers(checkAndSendNoWeightLogNotification)
}

// Rodar todo domingo às 19h — resumo semanal
export async function runWeeklySummary() {
  console.log('🔔 Cron: enviando resumo semanal...')
  await forAllUsers(sendWeeklySummary)
}
