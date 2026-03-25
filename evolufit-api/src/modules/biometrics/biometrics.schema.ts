import { z } from 'zod'

export const weightLogSchema = z.object({
  weight_kg: z.number().min(20).max(400),
  body_fat_pct: z.number().min(1).max(70).optional(),
  muscle_mass_kg: z.number().min(10).max(200).optional(),
  notes: z.string().max(500).optional(),
  measured_at: z.string().datetime().optional(),
})

export type WeightLogInput = z.infer<typeof weightLogSchema>
