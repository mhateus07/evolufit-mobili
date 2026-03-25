import admin from 'firebase-admin'
import 'dotenv/config'

let initialized = false

let firebaseReady = false

export function getFirebaseApp() {
  if (initialized) return firebaseReady ? admin.app() : null

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  if (!serviceAccountJson) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_JSON não configurado — notificações em modo simulado')
    initialized = true
    firebaseReady = false
    return null
  }

  const serviceAccount = JSON.parse(serviceAccountJson)
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  initialized = true
  firebaseReady = true
  return admin.app()
}

export async function sendPushNotification(params: {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}): Promise<boolean> {
  const app = getFirebaseApp()

  if (!app) {
    // Modo simulado — loga a notificação
    console.log(`📱 [NOTIFICAÇÃO SIMULADA]`)
    console.log(`   Título: ${params.title}`)
    console.log(`   Corpo:  ${params.body}`)
    console.log(`   Token:  ${params.token.slice(0, 20)}...`)
    return true
  }

  try {
    await admin.messaging().send({
      token: params.token,
      notification: { title: params.title, body: params.body },
      data: params.data ?? {},
      android: { priority: 'high' },
    })
    return true
  } catch (err) {
    console.error('Erro ao enviar notificação:', err)
    return false
  }
}
