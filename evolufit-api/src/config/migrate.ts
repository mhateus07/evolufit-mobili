import { db } from './database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations')

  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const { rows } = await db.query(
      'SELECT id FROM _migrations WHERE filename = $1',
      [file]
    )

    if (rows.length > 0) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    await db.query(sql)
    await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file])
    console.log(`✅ Migration executada: ${file}`)
  }

  console.log('✅ Todas as migrations concluídas')
}
