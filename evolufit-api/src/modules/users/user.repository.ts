import { db } from '../../config/database.js'
import type { RegisterInput, ProfileInput } from './user.schema.js'

export async function findUserByEmail(email: string) {
  const { rows } = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  )
  return rows[0] || null
}

export async function findUserById(id: string) {
  const { rows } = await db.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id]
  )
  return rows[0] || null
}

export async function createUser(data: RegisterInput & { password_hash: string }) {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [data.name, data.email, data.password_hash]
  )
  return rows[0]
}

export async function findProfileByUserId(userId: string) {
  const { rows } = await db.query(
    'SELECT * FROM user_profiles WHERE user_id = $1',
    [userId]
  )
  return rows[0] || null
}

export async function updatePasswordHash(userId: string, passwordHash: string) {
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId])
}

export async function createResetToken(userId: string, code: string, expiresAt: Date) {
  await db.query(
    'INSERT INTO password_reset_tokens (user_id, code, expires_at) VALUES ($1, $2, $3)',
    [userId, code, expiresAt]
  )
}

export async function findValidResetToken(userId: string, code: string) {
  const { rows } = await db.query(
    `SELECT * FROM password_reset_tokens
     WHERE user_id = $1 AND code = $2 AND used_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, code]
  )
  return rows[0] || null
}

export async function markResetTokenUsed(id: string) {
  await db.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [id])
}

export async function upsertProfile(userId: string, data: ProfileInput) {
  const { rows } = await db.query(
    `INSERT INTO user_profiles (user_id, birth_date, sex, height_cm, goal, activity_level)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       birth_date = EXCLUDED.birth_date,
       sex = EXCLUDED.sex,
       height_cm = EXCLUDED.height_cm,
       goal = EXCLUDED.goal,
       activity_level = EXCLUDED.activity_level
     RETURNING *`,
    [userId, data.birth_date, data.sex, data.height_cm, data.goal, data.activity_level]
  )
  return rows[0]
}
