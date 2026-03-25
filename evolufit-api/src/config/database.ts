import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function connectDatabase() {
  const client = await db.connect()
  client.release()
  console.log('✅ Banco de dados conectado')
}
