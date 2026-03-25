import type { FastifyInstance } from 'fastify'
import { register, authenticate } from './user.service.js'
import {
  findUserById, findUserByEmail, findProfileByUserId, upsertProfile,
  createResetToken, findValidResetToken, markResetTokenUsed, updatePasswordHash,
} from './user.repository.js'
import { registerSchema, loginSchema, profileSchema } from './user.schema.js'
import { sendPasswordResetEmail } from '../../services/email.service.js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function userRoutes(app: FastifyInstance) {
  // Cadastro
  app.post('/auth/register', async (request, reply) => {
    const data = registerSchema.parse(request.body)
    const user = await register(data)
    const token = app.jwt.sign({ sub: user.id })
    return reply.status(201).send({ user, token })
  })

  // Login
  app.post('/auth/login', async (request, reply) => {
    const data = loginSchema.parse(request.body)
    const user = await authenticate(data)
    const token = app.jwt.sign({ sub: user.id })
    return reply.send({ user, token })
  })

  // Solicitar recuperação de senha
  app.post('/auth/forgot-password', async (request, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body)
    const user = await findUserByEmail(email)

    // Sempre retorna 200 para não expor se email existe
    if (!user) return reply.send({ message: 'Se esse email estiver cadastrado, você receberá um código.' })

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min

    await createResetToken(user.id, code, expiresAt)

    try {
      await sendPasswordResetEmail(user.email, user.name, code)
    } catch (err) {
      console.error('Erro ao enviar email:', err)
      return reply.status(500).send({ message: 'Falha ao enviar email. Tente novamente.' })
    }

    return reply.send({ message: 'Se esse email estiver cadastrado, você receberá um código.' })
  })

  // Redefinir senha com código
  app.post('/auth/reset-password', async (request, reply) => {
    const { email, code, new_password } = z.object({
      email: z.string().email(),
      code: z.string().length(6),
      new_password: z.string().min(6),
    }).parse(request.body)

    const user = await findUserByEmail(email)
    if (!user) return reply.status(400).send({ message: 'Código inválido ou expirado' })

    const token = await findValidResetToken(user.id, code)
    if (!token) return reply.status(400).send({ message: 'Código inválido ou expirado' })

    const passwordHash = await bcrypt.hash(new_password, 10)
    await updatePasswordHash(user.id, passwordHash)
    await markResetTokenUsed(token.id)

    return reply.send({ message: 'Senha redefinida com sucesso!' })
  })

  // Rotas autenticadas
  app.register(async (privateApp) => {
    privateApp.addHook('onRequest', async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch {
        reply.status(401).send({ error: 'Token inválido ou ausente' })
      }
    })

    // Meus dados
    privateApp.get('/users/me', async (request) => {
      const { sub } = request.user as { sub: string }
      const user = await findUserById(sub)
      if (!user) throw { statusCode: 404, message: 'Usuário não encontrado' }
      return user
    })

    // Buscar perfil
    privateApp.get('/users/me/profile', async (request) => {
      const { sub } = request.user as { sub: string }
      const profile = await findProfileByUserId(sub)
      if (!profile) throw { statusCode: 404, message: 'Perfil não configurado' }
      return profile
    })

    // Criar ou atualizar perfil
    privateApp.put('/users/me/profile', async (request, reply) => {
      const { sub } = request.user as { sub: string }
      const data = profileSchema.parse(request.body)
      const profile = await upsertProfile(sub, data)
      return reply.status(200).send(profile)
    })
  })
}
