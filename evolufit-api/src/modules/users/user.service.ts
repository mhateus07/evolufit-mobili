import bcrypt from 'bcryptjs'
import { createUser, findUserByEmail } from './user.repository.js'
import type { RegisterInput, LoginInput } from './user.schema.js'

export async function register(data: RegisterInput) {
  const existing = await findUserByEmail(data.email)
  if (existing) {
    throw { statusCode: 409, message: 'E-mail já cadastrado' }
  }

  const password_hash = await bcrypt.hash(data.password, 10)
  return createUser({ ...data, password_hash })
}

export async function authenticate(data: LoginInput) {
  const user = await findUserByEmail(data.email)
  if (!user) {
    throw { statusCode: 401, message: 'E-mail ou senha inválidos' }
  }

  const valid = await bcrypt.compare(data.password, user.password_hash)
  if (!valid) {
    throw { statusCode: 401, message: 'E-mail ou senha inválidos' }
  }

  return { id: user.id, name: user.name, email: user.email }
}
