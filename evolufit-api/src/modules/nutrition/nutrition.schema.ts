import { z } from 'zod'

export const nutritionPlanSchema = z.object({
  calories_target: z.number().min(500).max(10000),
  protein_g: z.number().min(10).max(500),
  carbs_g: z.number().min(0).max(1000),
  fat_g: z.number().min(0).max(500),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const foodLogSchema = z.object({
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  calories_actual: z.number().min(0).max(20000).optional(),
  protein_g: z.number().min(0).max(500).optional(),
  carbs_g: z.number().min(0).max(1000).optional(),
  fat_g: z.number().min(0).max(500).optional(),
  source: z.enum(['manual', 'api', 'barcode']).optional(),
})

export type NutritionPlanInput = z.infer<typeof nutritionPlanSchema>
export type FoodLogInput = z.infer<typeof foodLogSchema>
