import { buildApp } from './app.js'
import { connectDatabase } from './config/database.js'
import { runMigrations } from './config/migrate.js'
import { getFirebaseApp } from './config/firebase.js'
import { env } from './config/env.js'
import { runNutritionGapCheck, runNoWeightLogCheck, runWeeklySummary } from './modules/notifications/notification.cron.js'

function startCronJobs() {
  const now = new Date()

  // Checar gap nutricional — todo dia às 18h
  const msUntil18h = new Date(now).setHours(18, 0, 0, 0) - now.getTime()
  const delay18h = msUntil18h < 0 ? msUntil18h + 86400000 : msUntil18h
  setTimeout(() => {
    runNutritionGapCheck()
    setInterval(runNutritionGapCheck, 86400000)
  }, delay18h)

  // Checar ausência de peso — todo dia às 8h
  const msUntil8h = new Date(now).setHours(8, 0, 0, 0) - now.getTime()
  const delay8h = msUntil8h < 0 ? msUntil8h + 86400000 : msUntil8h
  setTimeout(() => {
    runNoWeightLogCheck()
    setInterval(runNoWeightLogCheck, 86400000)
  }, delay8h)

  // Resumo semanal — todo domingo às 19h
  const dayOfWeek = now.getDay()
  const daysUntilSunday = (7 - dayOfWeek) % 7
  const msUntilSunday19h = daysUntilSunday * 86400000 +
    (new Date(now).setHours(19, 0, 0, 0) - now.getTime())
  setTimeout(() => {
    runWeeklySummary()
    setInterval(runWeeklySummary, 7 * 86400000)
  }, msUntilSunday19h)

  console.log('⏰ Cron jobs agendados')
}

async function start() {
  const app = await buildApp()

  await connectDatabase()
  await runMigrations()
  getFirebaseApp()
  startCronJobs()

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`🚀 Servidor rodando em http://localhost:${env.PORT}`)
}

start()
