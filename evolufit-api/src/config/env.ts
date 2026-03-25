import 'dotenv/config'

export const env = {
  PORT: Number(process.env.PORT) || 3333,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
}

const required = ['DATABASE_URL', 'JWT_SECRET']
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`)
  }
}
