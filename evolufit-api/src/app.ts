import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import { env } from './config/env.js'
import { errorHandler } from './shared/middleware/error.handler.js'
import { userRoutes } from './modules/users/user.routes.js'
import { biometricsRoutes } from './modules/biometrics/biometrics.routes.js'
import { nutritionRoutes } from './modules/nutrition/nutrition.routes.js'
import { trainingRoutes } from './modules/training/training.routes.js'
import { projectionRoutes } from './modules/projection/projection.routes.js'
import { marmitaRoutes } from './modules/marmitas/marmita.routes.js'
import { notificationRoutes } from './modules/notifications/notification.routes.js'

export async function buildApp() {
  const app = Fastify({ logger: env.NODE_ENV === 'development' })

  await app.register(fastifyHelmet)
  await app.register(fastifyCors, { origin: true })
  await app.register(fastifyJwt, { secret: env.JWT_SECRET })

  app.setErrorHandler(errorHandler)

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  await app.register(userRoutes)
  await app.register(biometricsRoutes)
  await app.register(nutritionRoutes)
  await app.register(trainingRoutes)
  await app.register(projectionRoutes)
  await app.register(marmitaRoutes)
  await app.register(notificationRoutes)

  return app
}
