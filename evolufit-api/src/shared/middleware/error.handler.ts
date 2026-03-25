import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Dados inválidos',
      details: error.flatten().fieldErrors,
    })
  }

  if (error.statusCode) {
    return reply.status(error.statusCode).send({ error: error.message })
  }

  console.error(error)
  return reply.status(500).send({ error: 'Erro interno do servidor' })
}
