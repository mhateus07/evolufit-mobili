import { z } from 'zod'

export const trainingPlanSchema = z.object({
  sessions_per_week: z.number().int().min(1).max(7),
  avg_duration_min: z.number().int().min(10).max(300),
  intensity: z.enum(['low', 'moderate', 'high']),
})

export const trainingLogSchema = z.object({
  trained_at: z.string().datetime().optional(),
  duration_min: z.number().int().min(1).max(300).optional(),
  intensity: z.enum(['low', 'moderate', 'high']).optional(),
  calories_burned: z.number().int().min(0).optional(),
})

export type TrainingPlanInput = z.infer<typeof trainingPlanSchema>
export type TrainingLogInput = z.infer<typeof trainingLogSchema>
