import { z } from 'zod'

export const marmitaSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  calories: z.number().int().min(100),
  protein_g: z.number().min(5),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  price_cents: z.number().int().min(1),
  tags: z.array(z.string()).optional(),
  image_url: z.string().url().optional(),
})

export type MarmitaInput = z.infer<typeof marmitaSchema>
